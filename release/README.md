# Darkex 404 · "Assembly"

The deliverable is `404.html`. The Darkex mark rebuilt from ~45,000 GPU-simulated
grains — it assembles out of a drifting cloud on load, scatters into embers
under the visitor's cursor, and springs back home. No dependencies, no build
step, no network requests; it runs from any web server or straight off disk
(double-click it).

## Ship it

Serve the file **with a 404 status**:

| Host | How |
| --- | --- |
| nginx | `error_page 404 /404.html;` (+ an exact `location = /404.html` if needed) |
| Cloudflare Pages / Netlify | place it as `404.html` at the publish root |
| S3 / CloudFront | set it as the 404 error document |
| Vercel | `404.html` at the project root (static) |
| Apache | `ErrorDocument 404 /404.html` |

The copy is plain DOM, so search engines and no-JS visitors still get a real
404 page; the particles are enhancement on top.

## Edit it

Open `404.html` in any editor. The top half is yours; the four editable
surfaces are marked with numbered banner comments:

1. **Copy** — the text and CTA link, plain HTML inside `<main class="content">`.
2. **Colors** — the `:root` CSS variables. The engine reads them too:
   `--fg` tints resting grains, `--brand` tints disturbed ones,
   `--scene-glow`/`--scene-edge` paint the backdrop. Retheme in one place.
3. **Logo** — the SVG inside `<template id="logo-source">`. Paste any SVG;
   grains are sampled from its *light* pixels (line-work), so artwork should
   read light-on-dark. The favicon is derived from it automatically.
   (`logo.svg` in this zip is the same artwork as a standalone asset for
   design tools — the page never reads it, so a logo swap goes in the HTML.)
4. **Motion & feel** — the `window.DARKEX404` block. Every dial is commented
   with what raising it does. The shipped values are the reference tuning.

Nothing below the `ENGINE — GENERATED` banner should be edited.

## Practicalities

- **Weight**: ~900 KB raw, ~230 KB over the wire with gzip/brotli (any CDN
  or sane server config does this) — the whole of three.js rides inside.
- **Browsers**: any 2025+ evergreen. WebGPU where present (Chrome, Edge,
  Safari 26+, Firefox 141+); everywhere else the renderer transparently
  falls back to WebGL2 with the identical look.
- **Accessibility**: honors `prefers-reduced-motion` — the mark renders
  fully assembled and still, and the cursor field stays inert.
- **Rebuilding the engine** (only for a three.js upgrade or a simulation
  change — never for copy/color/logo/feel edits):
  https://github.com/okturan/darkex-404-lab → `bun install && bun run release`
