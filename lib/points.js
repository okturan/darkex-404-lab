/**
 * Sampling: turns artwork into grain seed data.
 *
 * Both samplers rasterize to an offscreen canvas and keep every "lit" texel
 * — bright and opaque — as one grain home. On these near-black pages only
 * light pixels are worth a grain, which conveniently also strips the dark
 * shield fill out of the Darkex mark.
 *
 * Homes come out centered on the origin in world units on the z = 0 plane:
 * the lit content's bounding box is measured and mapped so it stands exactly
 * `worldHeight` units tall, regardless of padding in the source art. Every
 * home carries sub-texel jitter so the raster grid reads as a cloud.
 */

export async function sampleImage(url, { rasterWidth, worldHeight }) {
  const image = new Image();
  image.src = url;
  await image.decode();

  const height = Math.round(rasterWidth * (image.naturalHeight / image.naturalWidth));
  const context = new OffscreenCanvas(rasterWidth, height).getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, rasterWidth, height);
  return scan(context, worldHeight);
}

export function sampleText(text, { rasterWidth, worldHeight }) {
  const height = Math.round(rasterWidth * 0.5);
  const context = new OffscreenCanvas(rasterWidth, height).getContext('2d', { willReadFrequently: true });

  const widthAt = (size) => {
    context.font = `900 ${size}px system-ui, sans-serif`;
    return context.measureText(text).width;
  };
  let size = height * 0.8;
  size *= Math.min(1, (rasterWidth * 0.94) / widthAt(size));
  widthAt(size);

  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, rasterWidth / 2, height / 2);
  return scan(context, worldHeight);
}

/** Random start positions in a centered box (half-extents in world units). */
export function scatter(count, { x, y, z }) {
  const starts = new Float32Array(count * 3);
  for (let i = 0; i < starts.length; i += 3) {
    starts[i] = (Math.random() * 2 - 1) * x;
    starts[i + 1] = (Math.random() * 2 - 1) * y;
    starts[i + 2] = (Math.random() * 2 - 1) * z;
  }
  return starts;
}

/**
 * Grows a home set to `count` by re-picking random existing homes, so two
 * artworks with different grain counts can share one particle population.
 */
export function pad(homes, count) {
  const have = homes.length / 3;
  const out = new Float32Array(count * 3);
  out.set(homes);
  for (let i = have; i < count; i++) {
    const j = Math.floor(Math.random() * have) * 3;
    out.set(homes.subarray(j, j + 3), i * 3);
  }
  return out;
}

function scan(context, worldHeight) {
  const { width, height } = context.canvas;
  const { data } = context.getImageData(0, 0, width, height);

  const cols = [];
  const rows = [];
  let top = height, bottom = 0, left = width, right = 0;
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const at = (row * width + col) * 4;
      if (data[at + 3] > 127 && data[at] + data[at + 1] + data[at + 2] > 384) {
        cols.push(col);
        rows.push(row);
        top = Math.min(top, row);
        bottom = Math.max(bottom, row);
        left = Math.min(left, col);
        right = Math.max(right, col);
      }
    }
  }

  const texel = worldHeight / (bottom - top + 1);
  const centerX = (left + right + 1) / 2;
  const centerY = (top + bottom + 1) / 2;
  const homes = new Float32Array(cols.length * 3);
  for (let i = 0; i < cols.length; i++) {
    homes[i * 3] = (cols[i] + Math.random() - centerX) * texel;
    homes[i * 3 + 1] = (centerY - rows[i] - Math.random()) * texel;
    homes[i * 3 + 2] = 0;
  }

  return {
    homes,
    count: cols.length,
    size: { width: (right - left + 1) * texel, height: worldHeight },
  };
}
