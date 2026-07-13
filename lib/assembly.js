/**
 * The Assembly field — one GPU sprite per sampled logo texel. Shared by the
 * ember demo and the release build; all tuning arrives as a parameter.
 *
 * A single TSL compute pass integrates three accelerations — home spring,
 * idle wander, pointer field — and the material maps each grain's speed to
 * an ember tint and swell. TSL compiles the same graph to WGSL on WebGPU
 * and GLSL on the WebGL2 fallback.
 */
import {
  Fn, color, cos, deltaTime, exp, float, hash, instanceIndex, instancedArray,
  sin, smoothstep, time, vec3,
} from 'three/tsl';
import { grains, grainScale, heatColor, softDisc } from './grains.js';

export function createParticles(field, pointer, { physics, pointerField, sprites, palette }) {
  const homes = instancedArray(field.homes, 'vec3');
  const positions = instancedArray(field.starts, 'vec3');
  const velocities = instancedArray(field.count, 'vec3');

  const update = Fn(() => {
    const home = homes.element(instanceIndex);
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);

    // Explicit integration of a spring this stiff diverges past ~50 ms, so a
    // background-tab resume must not arrive as one giant step.
    const dt = deltaTime.min(physics.maxStep);
    const acceleration = home.sub(position).mul(physics.stiffness).toVar('acceleration');

    // Idle shimmer: per-grain phase and frequency keep the sines decorrelated.
    const drift = time
      .mul(physics.wanderSpeed)
      .mul(hash(instanceIndex.add(1)).add(0.5))
      .add(hash(instanceIndex).mul(1000));
    acceleration.addAssign(vec3(sin(drift), cos(drift.mul(1.37)), sin(drift.mul(0.83))).mul(physics.wanderStrength));

    // Pointer field: push straight out of the cursor and drag grains along
    // with its motion; both fade to nothing at the field's radius.
    const offset = position.sub(pointer.position);
    const reach = offset.length();
    const falloff = smoothstep(0, pointerField.radius, reach).oneMinus();
    const outward = offset.div(reach.max(1e-3)); // finite even for a grain dead on the cursor
    acceleration.addAssign(
      outward.mul(pointerField.shove).add(pointer.velocity.mul(pointerField.entrainment)).mul(falloff),
    );

    // Semi-implicit Euler with exponential, frame-rate-independent drag;
    // per-grain agility staggers the response so the cloud feels granular.
    const agility = hash(instanceIndex.add(2)).mul(0.7).add(0.65);
    velocity.addAssign(acceleration.mul(agility).mul(dt));
    velocity.mulAssign(exp(float(-physics.drag).mul(dt)));
    position.addAssign(velocity.mul(dt));
  })().compute(field.count).setName('assembly field');

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
