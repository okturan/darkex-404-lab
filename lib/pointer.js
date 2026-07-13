/**
 * Tracks the mouse on the grains' z = 0 plane as a pair of TSL uniforms.
 *
 * The tracked point chases the OS cursor with an exponential ease and its
 * velocity feeds the demos' entrainment forces — a flick therefore whips
 * grains along with it instead of just poking a hole. While no pointer is
 * on the page the point parks far outside every field, where the falloff
 * makes its influence exactly zero; no shader ever needs an "is hovering"
 * branch.
 */
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';

const PARKED = new THREE.Vector3(100, 100, 0);

export function createPointer(camera, smoothing = 14) {
  const position = uniform(PARKED.clone());
  const velocity = uniform(new THREE.Vector3());
  const target = PARKED.clone();
  const previous = new THREE.Vector3();

  const aim = (event) => {
    const through = new THREE.Vector3(
      (event.clientX / innerWidth) * 2 - 1,
      1 - (event.clientY / innerHeight) * 2,
      0.5,
    ).unproject(camera);
    const direction = through.sub(camera.position).normalize();
    // Intersect the eye ray with the z = 0 plane the grains live on.
    target.copy(camera.position).addScaledVector(direction, -camera.position.z / direction.z);
  };

  const park = () => {
    target.copy(PARKED);
    position.value.copy(PARKED);
    velocity.value.set(0, 0, 0);
  };

  window.addEventListener('pointermove', aim);
  window.addEventListener('blur', park);
  document.documentElement.addEventListener('pointerleave', park);
  window.addEventListener('pointerup', (event) => {
    // Touch has no hover: the field lifts off with the finger.
    if (event.pointerType !== 'mouse') park();
  });

  const update = (dt) => {
    const step = Math.max(dt, 1e-3); // the first getDelta() can be 0 — keep the derivative finite
    previous.copy(position.value);
    position.value.lerp(target, 1 - Math.exp(-smoothing * step));
    velocity.value.copy(position.value).sub(previous).divideScalar(step);
  };

  return { position, velocity, update };
}
