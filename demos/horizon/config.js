/** Event Horizon — an accretion disk orbits the missing page. */

export const disk = {
  count: 65000,
  gm: 0.62, // gravitational parameter; sets orbital speeds (v = √(gm/r))
  horizon: 0.42, // capture radius — grains inside are consumed and reborn on the rim
  inner: 0.85, // spawn annulus (units)…
  outer: 2.35, // …out to here; respawns land near the rim
  decay: 0.028, // velocity bleed (1/s) — the slow inspiral that feeds the hole
  retrograde: 0.05, // fraction of matter orbiting the wrong way (adds shear sparkle)
  center: { x: 0, y: 0.18 },
};

export const pointerField = {
  radius: 0.9,
  pull: 14, // the cursor is a second, mobile gravity well — it attracts
  entrainment: 3,
  smoothing: 12,
};

export const sprites = {
  size: 0.0075,
  opacity: 0.7,
  glowSwell: 0.9, // grains swell as they near the horizon
  sparkleSpeeds: [1.2, 2.6], // orbital speeds (units/s) mapped to white flare
};

export const palette = {
  cool: 0x9aa1ab, // outer disk
  ember: 0xff5d15, // inner disk
  flare: 0xfff3ea, // fast-matter highlight
};

export const view = {
  fov: 38,
  fill: 0.78,
  lift: 0.3,
};

/** The disk's world footprint, for camera framing. */
export const frame = { width: disk.outer * 2.1, height: disk.outer * 1.32 };
