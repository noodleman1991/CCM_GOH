import geometry from "@/components/maps/region-geometry-soft.json";

/** World coordinate space of the atlas artwork (region-geometry-soft.json). */
const WORLD = { x: 0, y: 0, w: 960, h: 500 };
/** Breathing room around the region's raw bbox, in viewBox units. */
const PAD = 40;
/** Tall regions (ssa, lac) are WIDENED to this floor instead of producing a
 *  near-square embed — keeps map height consistent across all seven pages. */
const MIN_ASPECT = 16 / 10;

export type CropBox = { x: number; y: number; w: number; h: number };

const cache = new Map<string, CropBox | null>();

/** Crop box for a region: raw path bbox + padding, widened to MIN_ASPECT
 *  (centered), clamped inside the world. Null for unknown/malformed input —
 *  callers fall back to the full-world viewBox. Coordinates include curve
 *  control points, a slight overestimate the padding absorbs. */
export function regionCrop(code: string): CropBox | null {
  if (cache.has(code)) return cache.get(code)!;
  const d = (geometry.regions as Record<string, { d: string }>)[code]?.d;
  let box: CropBox | null = null;
  if (d) {
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length >= 4) {
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      let x0 = Math.min(...xs) - PAD;
      let x1 = Math.max(...xs) + PAD;
      let y0 = Math.min(...ys) - PAD;
      let y1 = Math.max(...ys) + PAD;
      // Widen (never shrink) to the minimum aspect, centered on the region.
      const h = y1 - y0;
      const minW = h * MIN_ASPECT;
      if (x1 - x0 < minW) {
        const grow = (minW - (x1 - x0)) / 2;
        x0 -= grow;
        x1 += grow;
      }
      // Clamp: shift back inside the world, then trim whatever still overflows.
      if (x0 < WORLD.x) { x1 += WORLD.x - x0; x0 = WORLD.x; }
      if (y0 < WORLD.y) { y1 += WORLD.y - y0; y0 = WORLD.y; }
      if (x1 > WORLD.x + WORLD.w) { x0 -= x1 - (WORLD.x + WORLD.w); x1 = WORLD.x + WORLD.w; }
      if (y1 > WORLD.y + WORLD.h) { y0 -= y1 - (WORLD.y + WORLD.h); y1 = WORLD.y + WORLD.h; }
      x0 = Math.max(x0, WORLD.x);
      y0 = Math.max(y0, WORLD.y);
      box = {
        x: Math.round(x0),
        y: Math.round(y0),
        w: Math.round(x1 - x0),
        h: Math.round(y1 - y0),
      };
    }
  }
  cache.set(code, box);
  return box;
}

/** `regionCrop` as an SVG viewBox string ("x y w h"), null for unknown codes. */
export function regionCropViewBox(code: string): string | null {
  const b = regionCrop(code);
  return b ? `${b.x} ${b.y} ${b.w} ${b.h}` : null;
}
