/** Seeds the disk with area-uniform circular orbits and runs it. */
import { Clock } from 'three/webgpu';
import { createStage } from '../../lib/stage.js';
import { createPointer } from '../../lib/pointer.js';
import { createParticles } from './particles.js';
import { disk, frame, pointerField, view } from './config.js';

const positions = new Float32Array(disk.count * 3);
const velocities = new Float32Array(disk.count * 3);
for (let i = 0; i < disk.count; i++) {
  // √-distributed radius → uniform surface density across the annulus.
  const radius = disk.inner + (disk.outer - disk.inner) * Math.sqrt(Math.random());
  const angle = Math.random() * Math.PI * 2;
  const speed = Math.sqrt(disk.gm / radius) * (0.9 + Math.random() * 0.2);
  const spin = Math.random() < disk.retrograde ? -1 : 1;

  positions[i * 3] = disk.center.x + Math.cos(angle) * radius;
  positions[i * 3 + 1] = disk.center.y + Math.sin(angle) * radius;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
  velocities[i * 3] = -Math.sin(angle) * speed * spin;
  velocities[i * 3 + 1] = Math.cos(angle) * speed * spin;
}

const field = { count: disk.count, positions, velocities };

const stage = createStage(document.querySelector('#scene'), frame, view);
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
