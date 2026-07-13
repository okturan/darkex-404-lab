/** Crumble — touch melts the mark into sand; time rebuilds it. */

export const logo = {
  rasterWidth: 480,
  worldHeight: 2,
  scatter: { x: 3.2, y: 2.2, z: 1.2 },
};

export const physics = {
  stiffness: 60, // the rebuild spring, active only on gripped grains
  drag: 5, // drag while gripped (1/s)…
  looseDrag: 0.5, // …and while falling — sand falls nearly free
  maxStep: 1 / 30,
  wanderStrength: 0.4,
  wanderSpeed: 1.2,
  gravity: 5.5, // units/s², applied in proportion to looseness
  recovery: 2.4, // seconds for looseness to decay ≈ how long the sand stays sand
  floorY: -1.35, // where the pile collects (units)
  pileDepth: 0.08, // per-grain rest offset above the floor — gives the pile thickness
  bounce: 0.32,
};

export const pointerField = {
  radius: 0.55,
  melt: 0.22, // falloff level beyond which a grain lets go
  shove: 9, // a little spray on top of the melt
  entrainment: 2.5,
  smoothing: 14,
};

export const sprites = {
  size: 0.009,
  opacity: 0.8,
  heatSpeeds: [0.5, 3.2],
  emberSwell: 0.8,
};

export const palette = {
  rest: 0xfafbfc,
  ember: 0xff5d15,
};

export const view = {
  fov: 38,
  fill: 0.34,
  lift: 0.5,
};
