/**
 * Ember's field plus one scalar of state per grain: looseness. The cursor
 * sets it to 1 (the grain lets go of its home and obeys gravity), time
 * decays it back toward 0 (the spring regains its grip and hauls the grain
 * out of the pile). Every blend in the pass — spring, gravity, drag, wander
 * — keys off that one number, so melting and rebuilding are the same code
 * path at different points on a curve.
 */
import {
  Fn, If, color, cos, deltaTime, exp, float, hash, instanceIndex, instancedArray,
  mix, sin, smoothstep, time, vec3,
} from 'three/tsl';
import { grains, grainScale, heatColor, softDisc } from '../../lib/grains.js';
import { palette, physics, pointerField, sprites } from './config.js';

export function createParticles(field, pointer) {
  const homes = instancedArray(field.homes, 'vec3');
  const positions = instancedArray(field.starts, 'vec3');
  const velocities = instancedArray(field.count, 'vec3');
  const looseness = instancedArray(field.count, 'float');

  const update = Fn(() => {
    const home = homes.element(instanceIndex);
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);
    const loose = looseness.element(instanceIndex);

    const dt = deltaTime.min(physics.maxStep);

    const offset = position.sub(pointer.position);
    const reach = offset.length();
    const falloff = smoothstep(0, pointerField.radius, reach).oneMinus();
    const outward = offset.div(reach.max(1e-3));

    // Deep enough in the field, the grain lets go…
    If(falloff.greaterThan(pointerField.melt), () => {
      loose.assign(1);
    });
    // …and forgets it did at this rate.
    loose.mulAssign(exp(float(-1 / physics.recovery).mul(dt)));

    const grip = loose.oneMinus();
    const acceleration = home.sub(position).mul(physics.stiffness).mul(grip).toVar('acceleration');
    acceleration.addAssign(vec3(0, -physics.gravity, 0).mul(loose));
    acceleration.addAssign(outward.mul(pointerField.shove).add(pointer.velocity.mul(pointerField.entrainment)).mul(falloff));

    // Held grains shimmer; falling sand doesn't flutter.
    const drift = time
      .mul(physics.wanderSpeed)
      .mul(hash(instanceIndex.add(1)).add(0.5))
      .add(hash(instanceIndex).mul(1000));
    acceleration.addAssign(vec3(sin(drift), cos(drift.mul(1.37)), sin(drift.mul(0.83))).mul(physics.wanderStrength).mul(grip));

    const agility = hash(instanceIndex.add(2)).mul(0.7).add(0.65);
    velocity.addAssign(acceleration.mul(agility).mul(dt));
    velocity.mulAssign(exp(mix(float(physics.drag), float(physics.looseDrag), loose).negate().mul(dt)));
    position.addAssign(velocity.mul(dt));

    // The floor: each grain rests at its own height, so the sand piles with
    // visible thickness instead of collapsing into a one-texel line.
    const restHeight = float(physics.floorY).add(hash(instanceIndex.add(5)).mul(physics.pileDepth));
    If(position.y.lessThan(restHeight).and(velocity.y.lessThan(0)), () => {
      position.y.assign(restHeight);
      velocity.y.assign(velocity.y.negate().mul(physics.bounce));
      velocity.x.mulAssign(0.72);
      velocity.z.mulAssign(0.72);
    });
  })().compute(field.count).setName('sandfall field');

  const { tint, heat } = heatColor(
    velocities.toAttribute().length(),
    sprites.heatSpeeds,
    color(palette.rest),
    color(palette.ember),
  );

  const sprite = grains(field.count, {
    position: positions.toAttribute(),
    tint,
    scale: grainScale(sprites.size, heat, sprites.emberSwell),
    opacity: softDisc(sprites.opacity),
  });

  return { sprite, update };
}
