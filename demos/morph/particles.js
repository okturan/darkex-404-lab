/**
 * Ember's spring field with two home sets instead of one: every grain owns a
 * texel in the Darkex mark *and* a texel in the "404" glyphs. A single eased
 * uniform slides the homes between the shapes and the spring does the rest —
 * the flight between forms is real simulated motion, so grains heat up in
 * transit and cool on arrival, and the cursor can interfere mid-flight.
 */
import {
  Fn, color, cos, deltaTime, exp, float, hash, instanceIndex, instancedArray,
  mix, sin, smoothstep, time, uniform, vec3,
} from 'three/tsl';
import { grains, grainScale, heatColor, softDisc } from '../../lib/grains.js';
import { palette, physics, pointerField, sprites } from './config.js';

export function createParticles(field, pointer) {
  const markHomes = instancedArray(field.markHomes, 'vec3');
  const glyphHomes = instancedArray(field.glyphHomes, 'vec3');
  const positions = instancedArray(field.starts, 'vec3');
  const velocities = instancedArray(field.count, 'vec3');

  /** 0 = the mark, 1 = the "404" glyphs; eased along a timeline in main.js. */
  const progress = uniform(0);

  const update = Fn(() => {
    const home = mix(markHomes.element(instanceIndex), glyphHomes.element(instanceIndex), progress);
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);

    const dt = deltaTime.min(physics.maxStep);
    const acceleration = home.sub(position).mul(physics.stiffness).toVar('acceleration');

    const drift = time
      .mul(physics.wanderSpeed)
      .mul(hash(instanceIndex.add(1)).add(0.5))
      .add(hash(instanceIndex).mul(1000));
    acceleration.addAssign(vec3(sin(drift), cos(drift.mul(1.37)), sin(drift.mul(0.83))).mul(physics.wanderStrength));

    const offset = position.sub(pointer.position);
    const reach = offset.length();
    const falloff = smoothstep(0, pointerField.radius, reach).oneMinus();
    const outward = offset.div(reach.max(1e-3));
    acceleration.addAssign(
      outward.mul(pointerField.shove).add(pointer.velocity.mul(pointerField.entrainment)).mul(falloff),
    );

    const agility = hash(instanceIndex.add(2)).mul(0.7).add(0.65);
    velocity.addAssign(acceleration.mul(agility).mul(dt));
    velocity.mulAssign(exp(float(-physics.drag).mul(dt)));
    position.addAssign(velocity.mul(dt));
  })().compute(field.count).setName('morph field');

  // The resting color itself drifts warm while the grains spell the error.
  const rest = mix(color(palette.rest), color(palette.restAs404), progress);
  const { tint, heat } = heatColor(velocities.toAttribute().length(), sprites.heatSpeeds, rest, color(palette.ember));

  const sprite = grains(field.count, {
    position: positions.toAttribute(),
    tint,
    scale: grainScale(sprites.size, heat, sprites.emberSwell),
    opacity: softDisc(sprites.opacity),
  });

  return { sprite, update, progress };
}
