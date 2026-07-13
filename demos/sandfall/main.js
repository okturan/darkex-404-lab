/** Composition root — identical wiring to ember, different physics inside. */
import { Clock } from 'three/webgpu';
import { logoUrl } from '../../lib/logo.js';
import { sampleImage, scatter } from '../../lib/points.js';
import { createStage } from '../../lib/stage.js';
import { createPointer } from '../../lib/pointer.js';
import { createParticles } from './particles.js';
import { logo, pointerField, view } from './config.js';

const mark = await sampleImage(logoUrl, logo);
const field = { ...mark, starts: scatter(mark.count, logo.scatter) };

const stage = createStage(document.querySelector('#scene'), mark.size, view);
const pointer = createPointer(stage.camera, pointerField.smoothing);
const particles = createParticles(field, pointer);

stage.scene.add(particles.sprite);
await stage.renderer.init();

const clock = new Clock();
stage.renderer.setAnimationLoop(() => {
  pointer.update(clock.getDelta());
  stage.renderer.compute(particles.update);
  stage.renderer.render(stage.scene, stage.camera);
});
