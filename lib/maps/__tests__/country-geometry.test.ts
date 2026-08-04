import { describe, it, expect } from "vitest";
import { countryCentroid, getCountryPath, listCountryIsoCodes } from "../country-geometry";

describe("country geometry accessor", () => {
  it("has Kenya, mapped to ssa", () => {
    const ken = getCountryPath("KEN");
    expect(ken).not.toBeNull();
    expect(ken!.d.length).toBeGreaterThan(20);
    expect(ken!.region).toBe("ssa");
  });
  it("returns null for unknown codes", () => {
    expect(getCountryPath("XXX")).toBeNull();
  });
  it("covers most of the world", () => {
    expect(listCountryIsoCodes().length).toBeGreaterThan(150);
  });
});

describe("countryCentroid", () => {
  it("lands inside mainland France for a multi-part territory (regression: whole-path bbox previously dragged this toward French Guiana, ~x418)", () => {
    const c = countryCentroid("FRA");
    expect(c).not.toBeNull();
    expect(c!.x).toBeGreaterThanOrEqual(460);
    expect(c!.x).toBeLessThanOrEqual(510);
    expect(c!.y).toBeGreaterThanOrEqual(80);
    expect(c!.y).toBeLessThanOrEqual(125);
  });

  it("returns the bbox centre for a single-path country (Kenya)", () => {
    const entry = getCountryPath("KEN")!;
    const nums = (entry.d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const expected = {
      x: (Math.min(...xs) + Math.max(...xs)) / 2,
      y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
    const c = countryCentroid("KEN");
    expect(c).not.toBeNull();
    expect(c!.x).toBeCloseTo(expected.x);
    expect(c!.y).toBeCloseTo(expected.y);
  });

  it("returns null for an unknown code with no geometry and no fallback", () => {
    expect(countryCentroid("XXX")).toBeNull();
  });

  it("falls back to a hand-projected point for Malta, which has no geometry entry", () => {
    expect(getCountryPath("MLT")).toBeNull();
    const c = countryCentroid("MLT");
    expect(c).not.toBeNull();
    expect(Number.isFinite(c!.x)).toBe(true);
    expect(Number.isFinite(c!.y)).toBe(true);
  });

  it("caches results — repeated calls return the same object", () => {
    expect(countryCentroid("FRA")).toBe(countryCentroid("FRA"));
    expect(countryCentroid("MLT")).toBe(countryCentroid("MLT"));
  });
});
