/** Assembly — the mark gathers out of a drifting cloud; the cursor scatters embers. */

export const logo = {
  rasterWidth: 480, // grain count scales with its square; 480 ≈ 45k grains
  worldHeight: 2,
  scatter: { x: 4.5, y: 2.8, z: 1.6 }, // half-extents of the pre-assembly cloud (units)
};

export const physics = {
  stiffness: 55, // spring pull toward home per unit displacement (1/s²)
  drag: 5, // exponential decay rate (1/s); 2·√55 ≈ 15 would be critical — 5 leaves lively overshoot
  maxStep: 1 / 30, // integration ceiling (s): stiff springs diverge on background-tab dt spikes
  wanderStrength: 0.55, // idle shimmer acceleration (units/s²)
  wanderSpeed: 1.4, // idle shimmer base frequency (rad/s)
};

export const pointerField = {
  radius: 0.8, // reach of the cursor's field (units)
  shove: 30, // radial push at its center (units/s²)
  entrainment: 7, // how much of the cursor's own velocity grains inherit (1/s)
  smoothing: 14, // cursor chase rate (1/s)
};

export const sprites = {
  size: 0.009, // grain diameter (units); texel pitch ≈ 0.0045 at these defaults
  opacity: 0.8,
  heatSpeeds: [0.6, 4], // speeds (units/s) mapping to ember tint 0 → 1
  emberSwell: 0.8, // extra diameter at full heat (fraction of base)
};

export const palette = {
  rest: 0xfafbfc, // line-work white
  ember: 0xff5d15, // brand orange
};

export const view = {
  fov: 38,
  fill: 0.34, // fraction of the limiting viewport axis the mark spans
  lift: 0.55, // world units above screen center — clears the copy below
};
