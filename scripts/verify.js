import { readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localOrigin = new URL('https://local.invalid/');
const mode = process.argv[2] ?? 'source';
const failures = [];
const checkedFiles = new Set();
const checkedReferences = new Set();

const demos = [
  { slug: 'ember', title: 'Assembly' },
  { slug: 'morph', title: 'Inevitable' },
  { slug: 'hollow', title: 'Negative Space' },
  { slug: 'sandfall', title: 'Crumble' },
  { slug: 'horizon', title: 'Event Horizon' },
].map((demo) => ({
  ...demo,
  thumb: `assets/thumbs/${demo.slug}.png`,
  live: `https://okturan.github.io/darkex-404-lab/demos/${demo.slug}/`,
}));

function fail(message) {
  failures.push(message);
}

function toPosix(path) {
  return path.split(sep).join('/');
}

function label(root, path) {
  return toPosix(relative(repoRoot, join(root, path))) || '.';
}

async function fileInfo(root, path, { allowEmpty = false } = {}) {
  const fullPath = join(root, path);
  try {
    const info = await stat(fullPath);
    if (!info.isFile()) {
      fail(`${label(root, path)} is not a file`);
      return null;
    }
    if (!allowEmpty && info.size === 0) {
      fail(`${label(root, path)} is empty`);
      return null;
    }
    checkedFiles.add(fullPath);
    return info;
  } catch {
    fail(`${label(root, path)} is missing`);
    return null;
  }
}

async function readText(root, path) {
  if (!(await fileInfo(root, path))) return '';
  return Bun.file(join(root, path)).text();
}

function localTarget(fromPath, reference) {
  if (!reference || reference.startsWith('#')) return null;

  try {
    const base = new URL(toPosix(fromPath), localOrigin);
    const resolved = new URL(reference, base);
    if (resolved.origin !== localOrigin.origin) return null;
    return decodeURIComponent(resolved.pathname).replace(/^\/+/, '') || 'index.html';
  } catch {
    return null;
  }
}

async function checkReference(root, fromPath, reference, kind) {
  const target = localTarget(fromPath, reference);
  if (target === null) return;

  checkedReferences.add(`${root}:${fromPath}:${reference}`);
  const fullPath = join(root, target);
  try {
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      const indexPath = join(fullPath, 'index.html');
      const indexInfo = await stat(indexPath);
      if (!indexInfo.isFile()) throw new Error('directory has no index.html');
      checkedFiles.add(indexPath);
    } else if (info.isFile()) {
      checkedFiles.add(fullPath);
    } else {
      throw new Error('target is not a file');
    }
  } catch {
    fail(`${label(root, fromPath)} has broken ${kind} ${JSON.stringify(reference)}`);
  }
}

function parseAttributes(tag) {
  const attributes = {};
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? '';
  }
  return attributes;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))]
    .map((match) => parseAttributes(match[0]));
}

async function checkHtml(root, path) {
  const html = await readText(root, path);
  if (!html) return '';

  for (const match of html.matchAll(/\b(href|src)\s*=\s*(["'])(.*?)\2/gi)) {
    await checkReference(root, path, match[3], match[1].toLowerCase());
  }

  for (const image of tags(html, 'img')) {
    if (!Object.hasOwn(image, 'alt')) {
      fail(`${label(root, path)} has an image without an alt attribute`);
    }
  }

  return html;
}

async function walk(root, path = '') {
  const found = [];
  for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await walk(root, child));
    if (entry.isFile()) found.push(toPosix(child));
  }
  return found;
}

async function checkJavaScriptImports(path) {
  const source = await readText(repoRoot, path);
  if (!source) return;

  const references = new Set();
  for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^'"\n]*?\s+from\s*)?["']([^"']+)["']/g)) {
    references.add(match[1]);
  }
  for (const match of source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
    references.add(match[1]);
  }

  for (const reference of references) {
    if (reference.startsWith('.') || reference.startsWith('/')) {
      await checkReference(repoRoot, path, reference, 'module import');
    }
  }
}

async function checkCssUrls(path) {
  const css = await readText(repoRoot, path);
  if (!css) return;
  for (const match of css.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/g)) {
    await checkReference(repoRoot, path, match[2], 'CSS url');
  }
}

async function checkPng(path) {
  if (!(await fileInfo(repoRoot, path))) return;
  const bytes = new Uint8Array(await Bun.file(join(repoRoot, path)).arrayBuffer());
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (signature.some((byte, index) => bytes[index] !== byte)) {
    fail(`${path} is not a valid PNG`);
    return;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 24 || view.getUint32(16) === 0 || view.getUint32(20) === 0) {
    fail(`${path} has invalid PNG dimensions`);
  }
}

async function checkGif(path, expectedWidth, expectedHeight) {
  const info = await fileInfo(repoRoot, path);
  if (!info) return;
  if (info.size > 1_000_000) fail(`${path} is ${info.size} bytes; expected at most 1000000`);
  const bytes = new Uint8Array(await Bun.file(join(repoRoot, path)).arrayBuffer());
  const signature = new TextDecoder().decode(bytes.slice(0, 6));
  if (!['GIF87a', 'GIF89a'].includes(signature)) {
    fail(`${path} is not a valid GIF`);
    return;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint16(6, true);
  const height = view.getUint16(8, true);
  if (width !== expectedWidth || height !== expectedHeight) {
    fail(`${path} is ${width}x${height}; expected ${expectedWidth}x${expectedHeight}`);
  }
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function releaseVersion() {
  const source = await readText(repoRoot, 'build-release.js');
  const match = source.match(/const VERSION\s*=\s*["'](\d+\.\d+\.\d+)["']/);
  if (!match) {
    fail('build-release.js does not declare a semantic VERSION');
    return null;
  }
  return match[1];
}

async function checkSource() {
  for (const path of ['package.json', 'bun.lock', 'README.md', 'index.html', 'gallery.css', 'logo.svg']) {
    await fileInfo(repoRoot, path);
  }

  const sourcePages = ['index.html'];
  for (const demo of demos) {
    for (const path of [`demos/${demo.slug}/index.html`, `demos/${demo.slug}/main.js`, `demos/${demo.slug}/config.js`]) {
      await fileInfo(repoRoot, path);
    }
    sourcePages.push(`demos/${demo.slug}/index.html`);
    await checkPng(demo.thumb);
  }
  await checkGif('assets/motion/inevitable-live.gif', 800, 450);
  await fileInfo(repoRoot, 'assets/motion/README.md');
  sourcePages.push('release/404.template.html', 'release/mark.template.html');
  for (const page of sourcePages) await checkHtml(repoRoot, page);

  const sourceScripts = [
    ...(await walk(join(repoRoot, 'demos'))).filter((path) => path.endsWith('.js')).map((path) => `demos/${path}`),
    ...(await walk(join(repoRoot, 'lib'))).filter((path) => path.endsWith('.js')).map((path) => `lib/${path}`),
    'release/boot.js',
    'release/engine.js',
    'release/engine-embed.js',
    'build-release.js',
    'build-single.js',
  ];
  for (const script of sourceScripts) await checkJavaScriptImports(script);
  for (const css of ['gallery.css', 'lib/page.css']) await checkCssUrls(css);

  const gallery = await readText(repoRoot, 'index.html');
  const cards = tags(gallery, 'a').filter((attributes) => attributes.class?.split(/\s+/).includes('card'));
  if (cards.length !== demos.length) {
    fail(`index.html has ${cards.length} demo cards; expected ${demos.length}`);
  }
  const galleryImages = tags(gallery, 'img');
  for (const demo of demos) {
    const expectedTarget = `demos/${demo.slug}`;
    if (!cards.some((card) => localTarget('index.html', card.href) === expectedTarget)) {
      fail(`index.html does not link a card to ${expectedTarget}`);
    }
    const image = galleryImages.find((candidate) => candidate.src === `./${demo.thumb}`);
    if (!image) fail(`index.html does not use ${demo.thumb}`);
    else if (!image.alt?.trim()) fail(`index.html thumbnail ${demo.thumb} has empty alt text`);
  }

  const readme = await readText(repoRoot, 'README.md');
  const motionProof = '[![Inevitable live study moving between the Darkex mark and 404](assets/motion/inevitable-live.gif)](https://okturan.github.io/darkex-404-lab/demos/morph/)';
  if (!readme.includes(motionProof)) fail('README.md does not link the motion proof directly to the live Inevitable study');
  if (!readme.includes('prefers-reduced-motion') || !readme.includes('WebGL2 fallback')) {
    fail('README.md does not document the production reduced-motion and rendering fallback boundaries');
  }
  const motionProvenance = await readText(repoRoot, 'assets/motion/README.md');
  if (!motionProvenance.includes(demos.find(({ slug }) => slug === 'morph').live) || !motionProvenance.includes('40 real page screenshots')) {
    fail('motion proof provenance does not identify the live source and captured-frame boundary');
  }
  const releaseBoot = await readText(repoRoot, 'release/boot.js');
  for (const contract of [
    "matchMedia('(prefers-reduced-motion: reduce)').matches",
    'still ? mark.homes.slice() : scatter',
    'wanderStrength: 0',
    'if (!still) pointer.update',
  ]) {
    if (!releaseBoot.includes(contract)) fail(`release/boot.js is missing reduced-motion contract ${JSON.stringify(contract)}`);
  }
  for (const demo of demos) {
    const pattern = new RegExp(
      `\\[!\\[([^\\]]+)\\]\\(${escapeRegex(demo.thumb)}\\)\\]\\(${escapeRegex(demo.live)}\\)`,
    );
    const match = readme.match(pattern);
    if (!match) fail(`README.md does not link ${demo.thumb} directly to ${demo.live}`);
    else if (!match[1].toLowerCase().includes(demo.title.toLowerCase())) {
      fail(`README.md alt text for ${demo.thumb} does not identify ${demo.title}`);
    }
  }

  const releaseInputs = [
    'release/404.template.html',
    'release/mark.template.html',
    'release/engine.js',
    'release/engine-embed.js',
    'release/boot.js',
    'release/README.md',
    'release/README-mark.md',
    'logo.svg',
  ];
  for (const path of releaseInputs) await fileInfo(repoRoot, path);
  for (const template of ['release/404.template.html', 'release/mark.template.html']) {
    const source = await readText(repoRoot, template);
    const markers = source.match(/<!-- @ENGINE -->/g)?.length ?? 0;
    if (markers !== 1) fail(`${template} has ${markers} engine markers; expected 1`);
  }

  const version = await releaseVersion();
  if (version) {
    for (const claim of [
      `releases/tag/v${version}`,
      `darkex-404-v${version}.zip`,
      `darkex-mark-v${version}.zip`,
    ]) {
      if (!readme.includes(claim)) fail(`README.md is missing current release claim ${claim}`);
    }
  }
}

async function checkDocs() {
  const docsRoot = join(repoRoot, 'docs');
  await fileInfo(docsRoot, '.nojekyll', { allowEmpty: true });
  const expectedPages = ['index.html', ...demos.map((demo) => `demos/${demo.slug}/index.html`)];
  for (const page of expectedPages) await fileInfo(docsRoot, page);

  const docsFiles = await walk(docsRoot);
  for (const page of docsFiles.filter((path) => path.endsWith('.html'))) {
    await checkHtml(docsRoot, page);
  }

  const gallery = await readText(docsRoot, 'index.html');
  const cards = tags(gallery, 'a').filter((attributes) => attributes.class?.split(/\s+/).includes('card'));
  if (cards.length !== demos.length) {
    fail(`docs/index.html has ${cards.length} demo cards; expected ${demos.length}`);
  }
  for (const demo of demos) {
    if (!cards.some((card) => localTarget('index.html', card.href) === `demos/${demo.slug}`)) {
      fail(`docs/index.html does not link to demos/${demo.slug}`);
    }
  }
  const builtThumbs = tags(gallery, 'img').filter((image) => image.src?.toLowerCase().endsWith('.png'));
  if (builtThumbs.length !== demos.length) {
    fail(`docs/index.html has ${builtThumbs.length} built thumbnails; expected ${demos.length}`);
  }

  for (const demo of demos) {
    const page = `demos/${demo.slug}/index.html`;
    const html = await readText(docsRoot, page);
    const modules = tags(html, 'script').filter((script) => script.type === 'module' && script.src);
    if (modules.length !== 1) {
      fail(`docs/${page} has ${modules.length} external module entries; expected 1`);
      continue;
    }
    await checkReference(docsRoot, page, modules[0].src, 'module entry');
    const target = localTarget(page, modules[0].src);
    if (target) await fileInfo(docsRoot, target);
  }
}

async function sameBytes(first, second) {
  const left = Buffer.from(await Bun.file(first).arrayBuffer());
  const right = Buffer.from(await Bun.file(second).arrayBuffer());
  return left.equals(right);
}

async function zipEntries(path) {
  const result = Bun.spawnSync(['unzip', '-Z1', join(repoRoot, path)]);
  if (result.exitCode !== 0) {
    fail(`${path} could not be inspected with unzip`);
    return [];
  }
  return new TextDecoder().decode(result.stdout).trim().split('\n').filter(Boolean).sort();
}

async function checkRelease() {
  const version = await releaseVersion();
  if (!version) return;

  const artifacts = [
    {
      directory: '404',
      html: '404.html',
      readmeSource: 'release/README.md',
      zip: `release/darkex-404-v${version}.zip`,
    },
    {
      directory: 'mark',
      html: 'mark.html',
      readmeSource: 'release/README-mark.md',
      zip: `release/darkex-mark-v${version}.zip`,
    },
  ];

  for (const artifact of artifacts) {
    const root = join(repoRoot, 'release/dist', artifact.directory);
    for (const path of [artifact.html, 'README.md', 'logo.svg']) await fileInfo(root, path);
    await fileInfo(repoRoot, artifact.zip);

    const html = await checkHtml(root, artifact.html);
    if (html.includes('<!-- @ENGINE -->')) {
      fail(`release/dist/${artifact.directory}/${artifact.html} still contains the engine marker`);
    }
    const inlineModules = tags(html, 'script').filter((script) => script.type === 'module' && !script.src);
    if (inlineModules.length !== 1) {
      fail(`release/dist/${artifact.directory}/${artifact.html} has ${inlineModules.length} inline module engines; expected 1`);
    }

    const copiedReadme = await readText(root, 'README.md');
    const sourceReadme = await readText(repoRoot, artifact.readmeSource);
    if (copiedReadme !== sourceReadme) {
      fail(`release/dist/${artifact.directory}/README.md drifted from ${artifact.readmeSource}`);
    }
    if (!await sameBytes(join(root, 'logo.svg'), join(repoRoot, 'logo.svg'))) {
      fail(`release/dist/${artifact.directory}/logo.svg drifted from logo.svg`);
    }

    const entries = await zipEntries(artifact.zip);
    const expectedEntries = [artifact.html, 'README.md', 'logo.svg'].sort();
    if (entries.join('\n') !== expectedEntries.join('\n')) {
      fail(`${artifact.zip} contains [${entries.join(', ')}]; expected [${expectedEntries.join(', ')}]`);
    }
  }
}

const checks = { source: checkSource, docs: checkDocs, release: checkRelease };
if (!checks[mode]) {
  console.error(`Unknown verification mode ${JSON.stringify(mode)}. Use source, docs, or release.`);
  process.exit(2);
}

await checks[mode]();

if (failures.length) {
  console.error(`Verification failed (${mode}):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Verified ${mode}: ${checkedFiles.size} files and ${checkedReferences.size} local references.`);
