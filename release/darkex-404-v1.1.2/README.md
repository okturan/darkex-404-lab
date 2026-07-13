# Darkex 404 · "Assembly"

Two files that travel together: **`404.html`** (the page, engine included)
and **`logo.svg`** (the mark, fetched by the page at runtime). The Darkex
mark rebuilt from ~45,000 GPU-simulated grains — it assembles out of a
drifting cloud on load, scatters into embers under the visitor's cursor,
and springs back home. No dependencies and no build step; any static server
will do.

Previewing works two ways. Double-click `404.html` and it draws using the
built-in copy of the mark embedded in the page (browsers block `fetch` on
`file://`, so the external file can't be read there). Or serve the folder —
`python3 -m http.server` → <http://localhost:8000/404.html> — and the real
`logo.svg` is used: the engine looks at `logo.src` (`/logo.svg`) first and
falls back to the `logo.svg` sitting beside the page, so nested folders work
too. To preview a *swapped* logo, use the served route (or update the
built-in `<template id="logo-source">` copy as well).

## Ship it

Put **both files at the publish root** and serve the page **with a 404
status**. The page references the logo by absolute path (`/logo.svg`) on
purpose — error pages render under whatever URL failed, so a relative path
would break on deep 404s like `/account/settings/oops`. If your assets live
elsewhere, change `logo.src` in the config block and the favicon `<link>` in
the head together.

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
3. **Logo** — replace `logo.svg` with any SVG; no HTML edit needed. Grains
   are sampled from its *light* pixels (line-work), so artwork should read
   light-on-dark. The favicon points at the same file.
4. **Motion & feel** — the `window.DARKEX404` block. Every dial is commented
   with what raising it does. The shipped values are the reference tuning.

Nothing below the `ENGINE — GENERATED` banner should be edited.

## Practicalities

- **Weight**: ~880 KB raw, ~230 KB over the wire with gzip/brotli (any CDN
  or sane server config does this) — the whole of three.js rides inside.
  The only runtime request is the logo.
- **Browsers**: any 2025+ evergreen. WebGPU where present (Chrome, Edge,
  Safari 26+, Firefox 141+); everywhere else the renderer transparently
  falls back to WebGL2 with the identical look.
- **Accessibility**: honors `prefers-reduced-motion` — the mark renders
  fully assembled and still, and the cursor field stays inert.
- **Rebuilding the engine** (only for a three.js upgrade or a simulation
  change — never for copy/color/logo/feel edits):
  https://github.com/okturan/darkex-404-lab → `bun install && bun run release`
