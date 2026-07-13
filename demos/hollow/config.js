/** Negative Space — a field of dust with the error carved out of it. */

export const dust = {
  count: 72000,
  extent: { x: 3.6, y: 1.8, z: 0.5 }, // half-extents of the dust slab (units); x:y matches the mask's 2:1
};

export const mask = {
  text: '404',
  source: { width: 128, height: 64 }, // tiny draw — its bilinear upscale IS the blur
  texture: { width: 1024, height: 512 },
  homeInkCeiling: 0.25, // homes re-roll until they land where ink < this
};

export const physics = {
  stiffness: 3.5, // barely a spring — dust is meant to roam
  drag: 1.6,
  maxStep: 1 / 30,
  wanderStrength: 0.8,
  wanderSpeed: 0.7,
  voidPush: 60, // eviction strength along the ink gradient (units/s² per ink/uv)
};

export const pointerField = {
  radius: 1.0,
  shove: 6, // the cursor mostly stirs…
  swirl: 16, // …tangentially, like a finger through fog
  entrainment: 4,
  smoothing: 14,
};

export const sprites = {
  size: 0.008,
  opacity: 0.7,
  heatSpeeds: [0.8, 5],
  emberSwell: 0.6,
  rimInk: [0.03, 0.4], // ink range over which grains at the void's slope glow ember
};

export const palette = {
  rest: 0xd4d8dd, // silver dust
  ember: 0xff5d15,
};

export const view = {
  fov: 38,
  fill: 0.8,
  lift: 0.5, // the slab rides clear of the copy below
};
