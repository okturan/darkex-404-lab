/**
 * Dust that refuses to enter the error. The compute pass reads the blurred
 * ink mask like a potential field: grains accelerate down its gradient, so
 * the glyphs stay carved out no matter how hard the cursor stirs the field
 * through them. Grains riding the void's slope pick up an ember rim tint —
 * the absence gets a faint hot outline.
 */
import {
  Fn, color, cos, deltaTime, exp, float, hash, instanceIndex, instancedArray,
  mix, sin, smoothstep, textureLevel, time, vec2, vec3,
} from 'three/tsl';
import { grains, grainScale, heatColor, softDisc } from '../../lib/grains.js';
import { dust, palette, physics, pointerField, sprites } from './config.js';

export function createParticles(field, maskMap, pointer) {
  const homes = instancedArray(field.homes, 'vec3');
  const positions = instancedArray(field.starts, 'vec3');
  const velocities = instancedArray(field.count, 'vec3');

  /** World xy → mask uv; the slab and the mask share a 2:1 aspect. */
  const maskUv = (xy) => xy.div(vec2(dust.extent.x * 2, dust.extent.y * 2)).add(0.5);
  const inkAt = (uvNode) => textureLevel(maskMap, uvNode, 0).r;

  const update = Fn(() => {
    const home = homes.element(instanceIndex);
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);

    const dt = deltaTime.min(physics.maxStep);
    const acceleration = home.sub(position).mul(physics.stiffness).toVar('acceleration');

    // Slow, heavy wander — fog, not fireflies.
    const drift = time
      .mul(physics.wanderSpeed)
      .mul(hash(instanceIndex.add(1)).add(0.5))
      .add(hash(instanceIndex).mul(1000));
    acceleration.addAssign(vec3(sin(drift), cos(drift.mul(1.37)), sin(drift.mul(0.83))).mul(physics.wanderStrength));

    // The void: central differences over the blurred ink turn the "404"
    // into a downhill force that evicts trespassing dust.
    const uv = maskUv(position.xy);
    const step = float(0.01);
    const slopeX = inkAt(uv.add(vec2(step, 0))).sub(inkAt(uv.sub(vec2(step, 0))));
    const slopeY = inkAt(uv.add(vec2(0, step))).sub(inkAt(uv.sub(vec2(0, step))));
    acceleration.addAssign(vec3(slopeX, slopeY, 0).mul(-physics.voidPush));

    // The cursor stirs more than it shoves: mostly tangential swirl.
    const offset = position.sub(pointer.position);
    const reach = offset.length();
    const falloff = smoothstep(0, pointerField.radius, reach).oneMinus();
    const outward = offset.div(reach.max(1e-3));
    const around = vec3(offset.y.negate(), offset.x, 0).div(reach.max(1e-3));
    acceleration.addAssign(
      outward.mul(pointerField.shove)
        .add(around.mul(pointerField.swirl))
        .add(pointer.velocity.mul(pointerField.entrainment))
        .mul(falloff),
    );

    const agility = hash(instanceIndex.add(2)).mul(0.7).add(0.65);
    velocity.addAssign(acceleration.mul(agility).mul(dt));
    velocity.mulAssign(exp(float(-physics.drag).mul(dt)));
    position.addAssign(velocity.mul(dt));
  })().compute(field.count).setName('hollow field');

  // Rim glow: grains sitting on the void's slope warm toward ember before
  // the usual speed heat is applied on top.
  const ink = inkAt(maskUv(positions.toAttribute().xy));
  const rim = smoothstep(...sprites.rimInk, ink);
  const rest = mix(color(palette.rest), color(palette.ember), rim);
  const { tint, heat } = heatColor(velocities.toAttribute().length(), sprites.heatSpeeds, rest, color(palette.ember));

  const sprite = grains(field.count, {
    position: positions.toAttribute(),
    tint,
    scale: grainScale(sprites.size, heat, sprites.emberSwell),
    opacity: softDisc(sprites.opacity),
  });

  return { sprite, update };
}
