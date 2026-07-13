/** Builds the ink mask, seeds dust around it, and runs the field. */
import { Clock } from 'three/webgpu';
import { scatter } from '../../lib/points.js';
import { createStage } from '../../lib/stage.js';
import { createPointer } from '../../lib/pointer.js';
import { buildMask, dustHomes } from './mask.js';
import { createParticles } from './particles.js';
import { dust, mask, pointerField, view } from './config.js';

const ink = buildMask(mask);
const field = {
  count: dust.count,
  homes: dustHomes(dust.count, dust.extent, ink, mask.homeInkCeiling),
  starts: scatter(dust.count, dust.extent),
};

const slab = { width: dust.extent.x * 2, height: dust.extent.y * 2 };
const stage = createStage(document.querySelector('#scene'), slab, view);
const pointer = createPointer(stage.camera, pointerField.smoothing);
const particles = createParticles(field, ink.map, pointer);

stage.scene.add(particles.sprite);
await stage.renderer.init();

const clock = new Clock();
stage.renderer.setAnimationLoop(() => {
  pointer.update(clock.getDelta());
  stage.renderer.compute(particles.update);
  stage.renderer.render(stage.scene, stage.camera);
});
