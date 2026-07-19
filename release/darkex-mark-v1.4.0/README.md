# Darkex Mark · interactive brand particle

One file: **`mark.html`** — just the mark, nothing else. The Darkex logo as
~45,000 GPU-simulated grains: it assembles out of a drifting cloud on load,
scatters into embers under the cursor, and springs back home. No page copy,
no buttons — a full-viewport canvas to use as-is, drop into an `<iframe>`,
or build a page around.

Self-sufficient: no dependencies, no build step, no companion files. It runs
from any server, at any path, or straight off disk (double-click it).

`logo.svg` in this zip is a **reference copy of the mark for design
tooling** — the page does not read it; its own logo is embedded inside the
HTML.

## Use it

- **Standalone**: open or serve `mark.html`. Done.
- **Embedded**: `<iframe src="mark.html" style="border:0"></iframe>` sized
  however you like — the mark frames itself to whatever viewport it gets.

## Edit it

Everything is at the top of the file, in three marked sections:

1. **Colors** — the `:root` CSS variables. `--fg` tints resting grains,
   `--brand` tints disturbed ones, `--scene-glow`/`--scene-edge` paint the
   backdrop vignette.
2. **Motion** — the `window.DARKEX404` block; every dial is commented with
   what raising it does. `view.fill` sizes the mark, `view.lift` moves it
   off dead center.
3. **Logo** — the SVG inside `<template id="logo-source">`; paste any
   light-on-dark SVG and the grains (and favicon) follow. Or set `logo.src`
   to a hosted SVG's URL — a URL there wins over the embed.

## Practicalities

- ~880 KB raw, ~230 KB over the wire with gzip/brotli; zero runtime requests
  unless `logo.src` is set.
- Any 2025+ evergreen browser: WebGPU where present, transparent WebGL2
  fallback elsewhere, identical look.
- Honors `prefers-reduced-motion`: the mark renders assembled and still.
- Engine rebuilds (three.js upgrades only):
  https://github.com/okturan/darkex-404-lab
