/**
 * Where the logo actually is inside its image file (user, 2026-10-02: most
 * partner logos were square white files with the logo in a thin band across
 * the middle, so they rendered tiny however big the box). Pure: RGBA in,
 * crop box out.
 *
 * A pixel is part of the logo when it is mostly opaque and not near-white.
 * The crop keeps a small margin (4% of the logo's longer side) and stays
 * inside the file. `null` when there is no logo, or it already fills the file.
 */
export interface Crop {
  left: number;
  top: number;
  width: number;
  height: number;
}

const OPAQUE = 128;
const NEAR_WHITE = 680; // r + g + b
const FILLS = 0.9;

export function logoCrop(rgba: Uint8Array | Buffer, width: number, height: number): Crop | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const k = (y * width + x) * 4;
      if (rgba[k + 3] > OPAQUE && rgba[k] + rgba[k + 1] + rgba[k + 2] < NEAR_WHITE) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const margin = Math.round(0.04 * Math.max(maxX - minX + 1, maxY - minY + 1));
  const left = Math.max(0, minX - margin);
  const top = Math.max(0, minY - margin);
  const right = Math.min(width - 1, maxX + margin);
  const bottom = Math.min(height - 1, maxY + margin);
  const crop = { left, top, width: right - left + 1, height: bottom - top + 1 };
  if (crop.width >= FILLS * width && crop.height >= FILLS * height) return null;
  return crop;
}
