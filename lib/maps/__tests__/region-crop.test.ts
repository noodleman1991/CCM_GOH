import { describe, it, expect } from "vitest";
import { REGION_CODES } from "../region-codes";
import { regionCrop, regionCropViewBox } from "../region-crop";
import geometry from "@/components/maps/region-geometry-soft.json";

const WORLD = { x: 0, y: 0, w: 960, h: 500 };
const MIN_ASPECT = 16 / 10;

describe("regionCrop", () => {
  it("returns a box for every canonical region code", () => {
    for (const code of REGION_CODES) {
      expect(regionCrop(code), code).not.toBeNull();
    }
  });

  it("every box lies inside world bounds", () => {
    for (const code of REGION_CODES) {
      const b = regionCrop(code)!;
      expect(b.x, code).toBeGreaterThanOrEqual(WORLD.x);
      expect(b.y, code).toBeGreaterThanOrEqual(WORLD.y);
      expect(b.x + b.w, code).toBeLessThanOrEqual(WORLD.x + WORLD.w);
      expect(b.y + b.h, code).toBeLessThanOrEqual(WORLD.y + WORLD.h);
      expect(b.w, code).toBeGreaterThan(0);
      expect(b.h, code).toBeGreaterThan(0);
    }
  });

  it("every box meets the minimum 16:10 aspect ratio (within clamp tolerance)", () => {
    for (const code of REGION_CODES) {
      const b = regionCrop(code)!;
      // Clamping to world bounds may trim a widened box; allow 1% tolerance.
      expect(b.w / b.h, code).toBeGreaterThanOrEqual(MIN_ASPECT * 0.99);
    }
  });

  it("box contains the region's raw coordinate extremes", () => {
    // Raw bbox from path data (control points included) must fit inside the crop.
    for (const code of REGION_CODES) {
      const d = (geometry.regions as Record<string, { d: string }>)[code].d;
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      const b = regionCrop(code)!;
      expect(Math.min(...xs), code).toBeGreaterThanOrEqual(b.x);
      expect(Math.max(...xs), code).toBeLessThanOrEqual(b.x + b.w);
      expect(Math.min(...ys), code).toBeGreaterThanOrEqual(b.y);
      expect(Math.max(...ys), code).toBeLessThanOrEqual(b.y + b.h);
    }
  });

  it("unknown code returns null", () => {
    expect(regionCrop("atlantis")).toBeNull();
    expect(regionCropViewBox("atlantis")).toBeNull();
  });

  it("viewBox string matches the box", () => {
    const b = regionCrop("ssa")!;
    expect(regionCropViewBox("ssa")).toBe(
      `${b.x} ${b.y} ${b.w} ${b.h}`
    );
  });
});
