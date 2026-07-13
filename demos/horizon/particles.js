/**
 * A perpetual n-body-of-one simulation: every grain orbits the same central
 * mass, bleeding just enough velocity to spiral slowly inward. Whatever
 * crosses the horizon is consumed — and immediately reborn at the rim with a
 * fresh circular orbit, so the disk feeds the hole forever without a single
 * CPU-side reset. The cursor is a second, mobile gravity well: hold it near
 * the disk and it pulls a stream of matter off into its own little orbit.
 */
import {
  Fn, If, color, cos, deltaTime, exp, float, frameId, hash, instanceIndex,
  instancedArray, mix, sin, smoothstep, vec3,
} from 'three/tsl';
import { grains, grainScale, softDisc } from '../../lib/grains.js';
import { disk, palette, pointerField, sprites } from './config.js';

export function createParticles(field, pointer) {
  const positions = instancedArray(field.positions, 'vec3');
  const velocities = instancedArray(field.velocities, 'vec3');
  const center = vec3(disk.center.x, disk.center.y, 0);

  const update = Fn(() => {
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);

    const dt = deltaTime.min(1 / 30);

    // Newtonian pull toward the hole, clamped near the center so a grain
    // skimming the singularity can't be slingshot across the viewport.
    const fromCenter = position.sub(center);
    const orbit = fromCenter.length().max(0.12);
    const acceleration = fromCenter.div(orbit).mul(float(disk.gm).div(orbit.mul(orbit)).negate()).toVar('acceleration');

    // The cursor attracts — the opposite pole of every other demo's shove.
    const offset = pointer.position.sub(position);
    const reach = offset.length();
    const falloff = smoothstep(0, pointerField.radius, reach).oneMinus();
    acceleration.addAssign(
      offset.div(reach.max(1e-3)).mul(pointerField.pull).add(pointer.velocity.mul(pointerField.entrainment)).mul(falloff),
    );

    velocity.addAssign(acceleration.mul(dt));
    velocity.mulAssign(exp(float(-disk.decay).mul(dt))); // the slow inspiral
    position.addAssign(velocity.mul(dt));

    // Consumed at the horizon → reborn on the rim, on a clean circular orbit.
    If(position.sub(center).length().lessThan(disk.horizon), () => {
      const seed = instanceIndex.add(frameId);
      const angle = hash(seed).mul(Math.PI * 2);
      const radius = float(disk.outer).mul(hash(seed.add(1)).mul(0.2).add(0.9));
      const speed = float(disk.gm).div(radius).sqrt();
      position.assign(vec3(cos(angle).mul(radius), sin(angle).mul(radius), 0).add(center));
      velocity.assign(vec3(sin(angle).negate(), cos(angle), 0).mul(speed));
    });
  })().compute(field.count).setName('horizon disk');

  // Radial temperature: cool silver at the rim, ember toward the horizon,
  // with a white flare on the fastest matter.
  const orbit = positions.toAttribute().sub(center).length();
  const glow = smoothstep(disk.horizon * 1.5, disk.outer * 0.85, orbit).oneMinus();
  const sparkle = smoothstep(...sprites.sparkleSpeeds, velocities.toAttribute().length());
  const tint = mix(color(palette.cool), color(palette.ember), glow)
    .add(color(palette.flare).mul(sparkle.mul(0.35)))
    .mul(hash(instanceIndex.add(3)).mul(0.35).add(0.65));

  const sprite = grains(field.count, {
    position: positions.toAttribute(),
    tint,
    scale: grainScale(sprites.size, glow, sprites.glowSwell),
    opacity: softDisc(sprites.opacity),
  });

  return { sprite, update };
}
