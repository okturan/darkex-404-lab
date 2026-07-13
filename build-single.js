/**
 * Emits dist/404.html — the entire page in one file, openable straight from
 * file:// (double-click) as well as from any server. `bun run build` stays
 * the deployment-grade multi-file bundle; this artifact exists for the cases
 * where a 404 page must be exactly one document: local previews, CDN error
 * pages that accept a single upload, or handing the file around.
 *
 * Three inlining moves, and why each is required for file:// to work:
 *
 *   JS   — bare specifiers like `three/webgpu` never resolve in a browser,
 *          and module fetches are CORS-blocked on file:// anyway; the whole
 *          bundle has to live inside the <script> tag itself.
 *   SVG  — an <img> loaded from a file:// path taints the sampling canvas
 *          and getImageData throws; a data: URI is origin-clean everywhere.
 *   CSS  — a stylesheet <link> would dangle next to a lone HTML file.
 */

const bundle = await Bun.build({
  entrypoints: ['./demos/ember/main.js'],
  target: 'browser',
  minify: true,
});

const js = (await bundle.outputs[0].text())
  // A literal `</script` in the payload would end the inline tag mid-bundle.
  // The sequence can only appear inside a JS string, where this escape is
  // behavior-preserving; today it appears zero times, this is upgrade-proofing.
  .replaceAll('</script', '<\\/script');

const css = await Bun.file('./lib/page.css').text();
const svg = await Bun.file('./logo.svg').bytes();
const favicon = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

// Splice the inlined pieces into the same markup the dev page uses, so the
// two entry points cannot drift apart. Replacements are functions to keep
// `$` sequences in the minified JS out of String.replace's pattern syntax.
// The gallery back-link is dropped — a lone file has no gallery beside it.
let splices = 0;
const spliced = (await Bun.file('./demos/ember/index.html').text())
  .replace(/<link rel="icon"[^>]*>/, () => (splices++, `<link rel="icon" type="image/svg+xml" href="${favicon}" />`))
  .replace(/<link rel="stylesheet"[^>]*>/, () => (splices++, `<style>\n${css}</style>`))
  .replace(/<script type="module" src="[^"]*"><\/script>/, () => (splices++, `<script type="module">\n${js}\n</script>`))
  .replace(/\s*<a class="back"[^>]*>.*?<\/a>/, () => (splices++, ''));

if (splices !== 4) throw new Error(`ember/index.html drifted — made ${splices} of 4 splices`);

await Bun.write('./dist/404.html', spliced);
console.log(`dist/404.html — ${(spliced.length / 1024).toFixed(0)} KB, self-contained`);
