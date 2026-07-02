import { describe, it, expect } from "vitest";
import { clusterPins, layerColorKeyFor } from "../cluster-pins";

const item = (id: string, x: number, y: number, type: "caseStudy" | "livedExperience" = "caseStudy") => ({
  id, title: id, type, slug: id, countryCode3: "KEN", x, y,
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

  it("reports a single-type cluster's type from the full bucket, not just the capped items", () => {
    const many = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 50 + i, 50));
    const [c] = clusterPins(many, 24);
    expect(c.types).toEqual(["caseStudy"]);
  });

  it("reports multiple distinct types for a mixed-type cluster", () => {
    const [c] = clusterPins(
      [item("a", 100, 100, "caseStudy"), item("b", 101, 101, "livedExperience")],
      24
    );
    expect(c.types.sort()).toEqual(["caseStudy", "livedExperience"]);
  });
});

describe("layerColorKeyFor", () => {
  it("maps caseStudy to cases", () => {
    expect(layerColorKeyFor("caseStudy")).toBe("cases");
  });

  it("maps livedExperience to lived", () => {
    expect(layerColorKeyFor("livedExperience")).toBe("lived");
  });

  it("maps every other content type to the projects fallback", () => {
    expect(layerColorKeyFor("newsPost")).toBe("projects");
    expect(layerColorKeyFor("agenda")).toBe("projects");
    expect(layerColorKeyFor("report")).toBe("projects");
  });
});
