/**
 * The release engine: everything below the fold of 404.html.
 *
 * It reads the page it lives in — copy stays untouched DOM, colors come
 * from the :root CSS variables, the mark comes from the embedded SVG
 * template (or the URL in config.logo.src, when set), and the feel comes
 * from window.DARKEX404. Those four surfaces are the whole public API;
 * this bundle never needs editing.
 */
import { Clock, Color } from 'three/webgpu';
import { sampleImage, scatter } from '../lib/points.js';
import { createStage } from '../lib/stage.js';
import { createPointer } from '../lib/pointer.js';
import { createParticles } from '../lib/assembly.js';

const config = window.DARKEX404;

// The mark: the SVG embedded in the page, unless logo.src points at a
// hosted copy — then the URL wins. Either way it is re-issued as a data URI,
// which keeps sampling origin-clean (even for CDN sources) and lets the
// favicon derive from the exact artwork in use.
const embedded = () =>
  new XMLSerializer().serializeToString(document.querySelector('#logo-source').content.firstElementChild);
const svg = config.logo.src ? await (await fetch(config.logo.src)).text() : embedded();
const logoUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const icon = document.createElement('link');
icon.rel = 'icon';
icon.type = 'image/svg+xml';
icon.href = logoUrl;
document.head.append(icon);

// Colors: the stylesheet is the single source of truth.
const css = getComputedStyle(document.documentElement);
const tone = (name) => new Color(css.getPropertyValue(name).trim());

// The physics are tuned around a mark exactly 2 units tall; only sampling
// density is the designer's business.
const mark = await sampleImage(logoUrl, { rasterWidth: config.logo.rasterWidth, worldHeight: 2 });

// Reduced motion: the mark simply *is* — fully assembled, shimmer off,
// cursor inert (its field stays parked because update() never runs).
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
const field = { ...mark, starts: still ? mark.homes.slice() : scatter(mark.count, config.logo.scatter) };
const physics = still ? { ...config.physics, wanderStrength: 0 } : config.physics;

const stage = createStage(document.querySelector('#scene'), mark.size, {
  ...config.view,
  backgroundCenter: tone('--scene-glow'),
  backgroundEdge: tone('--scene-edge'),
});
const pointer = createPointer(stage.camera, config.pointerField.smoothing);
const particles = createParticles(field, pointer, {
  physics,
  pointerField: config.pointerField,
  sprites: config.sprites,
  palette: { rest: tone('--fg'), ember: tone('--brand') },
});

stage.scene.add(particles.sprite);
await stage.renderer.init();

const clock = new Clock();
stage.renderer.setAnimationLoop(() => {
  if (!still) pointer.update(clock.getDelta());
  stage.renderer.compute(particles.update);
  stage.renderer.render(stage.scene, stage.camera);
});
