import { describe, it, expect } from "vitest";
import { clusterPins } from "../cluster-pins";

const item = (id: string, x: number, y: number) => ({
  id, title: id, type: "caseStudy" as const, slug: id, countryCode3: "KEN", x, y,
});

describe("clusterPins", () => {
  it("merges points in the same cell and averages the position", () => {
    const clusters = clusterPins([item("a", 100, 100), item("b", 104, 102), item("c", 300, 300)], 24);
    expect(clusters).toHaveLength(2);
    const big = clusters.find((c) => c.count === 2)!;
    expect(big.x).toBeCloseTo(102);
    expect(big.y).toBeCloseTo(101);
    expect(big.items.map((i) => i.id).sort()).toEqual(["a", "b"]);
  });

  it("caps items per cluster at 5 but keeps the true count", () => {
    const many = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 50 + i, 50));
    const [c] = clusterPins(many, 24);
    expect(c.count).toBe(8);
    expect(c.items).toHaveLength(5);
  });

  it("returns [] for no input", () => {
    expect(clusterPins([])).toEqual([]);
  });
});
