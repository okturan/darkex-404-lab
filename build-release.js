/**
 * Assembles the designer-facing release zip.
 *
 * release/404.template.html holds every human-editable surface — copy,
 * color tokens, the mark, the motion config — and a single marker where
 * this script splices the minified engine (three.js + the simulation,
 * bundled from release/engine.js). Recipients of the zip never run this;
 * it exists to regenerate the engine when three.js or the sim changes.
 *
 * Output: release/dist/{404.html, README.md, preview.png}
 *         release/darkex-404-v<version>.zip
 */
const VERSION = '1.1.0';

const bundle = await Bun.build({
  entrypoints: ['./release/engine.js'],
  target: 'browser',
  minify: true,
});

const js = (await bundle.outputs[0].text())
  // A literal `</script` would end the inline tag mid-bundle; the sequence
  // can only occur inside a JS string, where this escape is behavior-preserving.
  .replaceAll('</script', '<\\/script');

let spliced = 0;
const html = (await Bun.file('./release/404.template.html').text())
  .replace('<!-- @ENGINE -->', () => (spliced++, `<script type="module">\n${js}\n</script>`));
if (spliced !== 1) throw new Error('template drifted: @ENGINE marker not found');

await Bun.write('./release/dist/404.html', html);
await Bun.write('./release/dist/README.md', Bun.file('./release/README.md'));
// Load-bearing: the page fetches this file at runtime (config logo.src).
await Bun.write('./release/dist/logo.svg', Bun.file('./logo.svg'));

const zipName = `darkex-404-v${VERSION}.zip`;
Bun.spawnSync(['zip', '-X', '-j', '-q', zipName, 'dist/404.html', 'dist/README.md', 'dist/logo.svg'], {
  cwd: './release',
});

const size = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`release/dist/404.html — ${size(html.length)}`);
console.log(`release/${zipName} — ${size(Bun.file(`./release/${zipName}`).size)}`);
