/** Inevitable — the mark and the error trade places, forever. */

export const logo = {
  rasterWidth: 480,
  worldHeight: 2,
  scatter: { x: 4.5, y: 2.8, z: 1.6 },
};

export const glyphs = {
  text: '404',
  rasterWidth: 520,
  worldHeight: 1.35, // "404" is wide — shorter than the mark so both frame alike
};

export const morph = {
  hold: 3.2, // seconds spent resting in each shape
  travel: 1.4, // seconds spent in transit between them
};

export const physics = {
  stiffness: 55,
  drag: 5,
  maxStep: 1 / 30,
  wanderStrength: 0.55,
  wanderSpeed: 1.4,
};

export const pointerField = {
  radius: 0.8,
  shove: 30,
  entrainment: 7,
  smoothing: 14,
};

export const sprites = {
  size: 0.009,
  opacity: 0.8,
  heatSpeeds: [0.6, 4],
  emberSwell: 0.8,
};

export const palette = {
  rest: 0xfafbfc, // line-work white while the mark is assembled…
  restAs404: 0xffc9a8, // …warming toward this while the grains spell the error
  ember: 0xff5d15,
};

export const view = {
  fov: 38,
  fill: 0.38,
  lift: 0.55,
};
