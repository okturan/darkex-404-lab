/**
 * The "404" ink mask, built twice from one tiny drawing:
 *
 *  - the low-res ImageData the CPU uses to keep grain homes out of the glyphs
 *  - the same pixels upscaled through bilinear filtering into a soft-sloped
 *    CanvasTexture that the compute pass differentiates into an eviction force
 *
 * Drawing at 128×64 and upscaling 8× is the entire blur — wide, smooth slopes
 * with no ctx.filter dependency, and the slope width is what gives the void
 * its fuzzy halo.
 */
import * as THREE from 'three/webgpu';

export function buildMask({ text, source, texture }) {
  const small = new OffscreenCanvas(source.width, source.height);
  const ink = small.getContext('2d', { willReadFrequently: true });

  const widthAt = (size) => {
    ink.font = `900 ${size}px system-ui, sans-serif`;
    return ink.measureText(text).width;
  };
  let size = source.height * 0.82;
  size *= Math.min(1, (source.width * 0.86) / widthAt(size));
  widthAt(size);

  ink.fillStyle = '#000';
  ink.fillRect(0, 0, source.width, source.height);
  ink.fillStyle = '#fff';
  ink.textAlign = 'center';
  ink.textBaseline = 'middle';
  ink.fillText(text, source.width / 2, source.height / 2);

  const big = new OffscreenCanvas(texture.width, texture.height);
  const up = big.getContext('2d');
  up.imageSmoothingEnabled = true;
  up.imageSmoothingQuality = 'high';
  up.drawImage(small, 0, 0, texture.width, texture.height);

  return {
    data: ink.getImageData(0, 0, source.width, source.height).data,
    width: source.width,
    height: source.height,
    map: new THREE.CanvasTexture(big),
  };
}

/**
 * Dust homes: uniform over the slab, re-rolled until they land outside the
 * glyphs — so the void reads from the very first frame and the GPU force
 * only has to evict grains that wander in later.
 */
export function dustHomes(count, extent, mask, ceiling) {
  const homes = new Float32Array(count * 3);
  const inkAt = (x, y) => {
    const col = Math.min(mask.width - 1, Math.floor((x * 0.5 + 0.5) * mask.width));
    const row = Math.min(mask.height - 1, Math.floor((0.5 - y * 0.5) * mask.height));
    return mask.data[(row * mask.width + col) * 4] / 255;
  };

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
    } while (inkAt(x, y) > ceiling);
    homes[i * 3] = x * extent.x;
    homes[i * 3 + 1] = y * extent.y;
    homes[i * 3 + 2] = (Math.random() * 2 - 1) * extent.z;
  }
  return homes;
}
