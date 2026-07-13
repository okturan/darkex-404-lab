/**
 * Assembles the designer-facing release zips:
 *
 *   darkex-404-v<version>.zip   — the full 404 page (404.html + README + logo.svg)
 *   darkex-mark-v<version>.zip  — just the interactive mark (mark.html + README + logo.svg)
 *
 * Each template holds every human-editable surface and one marker where
 * this script splices its minified engine. Recipients of the zips never run
 * this; it exists to regenerate the engines when three.js or the simulation
 * changes.
 */
const VERSION = '1.4.0';

async function bundle(entry) {
  const build = await Bun.build({ entrypoints: [entry], target: 'browser', minify: true });
  // A literal `</script` would end the inline tag mid-bundle; the sequence
  // can only occur inside a JS string, where this escape is behavior-preserving.
  return (await build.outputs[0].text()).replaceAll('</script', '<\\/script');
}

async function splice(template, js, out) {
  let markers = 0;
  const html = (await Bun.file(template).text())
    .replace('<!-- @ENGINE -->', () => (markers++, `<script type="module">\n${js}\n</script>`));
  if (markers !== 1) throw new Error(`${template}: @ENGINE marker not found`);
  await Bun.write(out, html);
  return html.length;
}

async function pack(name, files) {
  Bun.spawnSync(['zip', '-X', '-j', '-q', name, ...files], { cwd: './release' });
  console.log(`release/${name} — ${(Bun.file(`./release/${name}`).size / 1024).toFixed(0)} KB`);
}

// The 404 page.
await splice('./release/404.template.html', await bundle('./release/engine.js'), './release/dist/404/404.html');
await Bun.write('./release/dist/404/README.md', Bun.file('./release/README.md'));
// Reference copies for design tooling; the pages read their embedded SVGs
// unless config logo.src points at a hosted file.
await Bun.write('./release/dist/404/logo.svg', Bun.file('./logo.svg'));
await pack(`darkex-404-v${VERSION}.zip`, ['dist/404/404.html', 'dist/404/README.md', 'dist/404/logo.svg']);

// The bare mark.
await splice('./release/mark.template.html', await bundle('./release/engine-embed.js'), './release/dist/mark/mark.html');
await Bun.write('./release/dist/mark/README.md', Bun.file('./release/README-mark.md'));
await Bun.write('./release/dist/mark/logo.svg', Bun.file('./logo.svg'));
await pack(`darkex-mark-v${VERSION}.zip`, ['dist/mark/mark.html', 'dist/mark/README.md', 'dist/mark/logo.svg']);
