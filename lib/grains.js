/**
 * The node snippets every demo's sprite material agrees on. Each demo still
 * assembles its own look; these are the recurring pieces.
 */
import * as THREE from 'three/webgpu';
import { float, hash, instanceIndex, mix, smoothstep, uv } from 'three/tsl';

/** Soft radial sprite footprint — tighter than a gaussian, cheaper than a texture. */
export function softDisc(opacity) {
  const edge = uv().mul(2).sub(1).length();
  return smoothstep(0.1, 1, edge).oneMinus().pow(1.5).mul(opacity);
}

/**
 * White-hot ramp: `rest` color at low speed, `ember` at high, with per-grain
 * brightness sparkle. Both colors are nodes, so callers can animate them.
 * Returns the heat node too — demos reuse it for size swell.
 */
export function heatColor(speed, [calm, hot], rest, ember) {
  const heat = smoothstep(calm, hot, speed);
  const sparkle = hash(instanceIndex.add(3)).mul(0.35).add(0.65);
  return { tint: mix(rest, ember, heat).mul(sparkle), heat };
}

/** Per-grain size jitter around `base`, swelling with heat. */
export function grainScale(base, heat, swell) {
  return float(base).mul(hash(instanceIndex.add(4)).mul(0.6).add(0.7)).mul(heat.mul(swell).add(1));
}

/** One additive, depth-agnostic instanced sprite for the whole population. */
export function grains(count, nodes) {
  const material = new THREE.SpriteNodeMaterial();
  material.positionNode = nodes.position;
  material.colorNode = nodes.tint;
  material.scaleNode = nodes.scale;
  material.opacityNode = nodes.opacity;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.transparent = true;

  const sprite = new THREE.Sprite(material);
  sprite.count = count;
  sprite.frustumCulled = false; // positions live in GPU storage; three can't know the bounds
  return sprite;
}
