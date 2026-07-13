/**
 * Samples both shapes, pads the smaller home set so one grain population
 * serves both, and drives the morph timeline: hold, travel, hold, travel.
 */
import { Clock } from 'three/webgpu';
import { logoUrl } from '../../lib/logo.js';
import { pad, sampleImage, sampleText, scatter } from '../../lib/points.js';
import { createStage } from '../../lib/stage.js';
import { createPointer } from '../../lib/pointer.js';
import { createParticles } from './particles.js';
import { glyphs, logo, morph, pointerField, view } from './config.js';

const mark = await sampleImage(logoUrl, logo);
const error = sampleText(glyphs.text, glyphs);

const count = Math.max(mark.count, error.count);
const field = {
  count,
  markHomes: pad(mark.homes, count),
  glyphHomes: pad(error.homes, count),
  starts: scatter(count, logo.scatter),
};

const frame = {
  width: Math.max(mark.size.width, error.size.width),
  height: Math.max(mark.size.height, error.size.height),
};

const stage = createStage(document.querySelector('#scene'), frame, view);
const pointer = createPointer(stage.camera, pointerField.smoothing);
const particles = createParticles(field, pointer);

stage.scene.add(particles.sprite);
await stage.renderer.init();

const easeInOut = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const cycle = 2 * (morph.hold + morph.travel);

/** Piecewise timeline over one cycle: mark, flight out, "404", flight home. */
const progressAt = (t) => {
  const p = t % cycle;
  if (p < morph.hold) return 0;
  if (p < morph.hold + morph.travel) return easeInOut((p - morph.hold) / morph.travel);
  if (p < cycle - morph.travel) return 1;
  return 1 - easeInOut((p - (cycle - morph.travel)) / morph.travel);
};

const clock = new Clock();
stage.renderer.setAnimationLoop(() => {
  pointer.update(clock.getDelta());
  particles.progress.value = progressAt(clock.elapsedTime);
  stage.renderer.compute(particles.update);
  stage.renderer.render(stage.scene, stage.camera);
});
