import { describe, it, expect } from "vitest";
import { clusterPins, layerColorKeyFor, donutSegments } from "../cluster-pins";

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

describe("donutSegments", () => {
  it("returns [] for an empty/all-zero count map", () => {
    expect(donutSegments({})).toEqual([]);
    expect(donutSegments({ caseStudy: 0 })).toEqual([]);
  });

  it("splits two types proportionally and sums shares to 1", () => {
    const segs = donutSegments({ caseStudy: 3, livedExperience: 1 });
    expect(segs).toHaveLength(2);
    expect(segs[0].type).toBe("caseStudy");
    expect(segs[0].share).toBeCloseTo(0.75);
    expect(segs[1].type).toBe("livedExperience");
    expect(segs[1].share).toBeCloseTo(0.25);
    expect(segs.reduce((s, seg) => s + seg.share, 0)).toBeCloseTo(1);
  });

  it("orders segments by count desc", () => {
    const segs = donutSegments({ newsPost: 1, caseStudy: 5, report: 2 });
    expect(segs.map((s) => s.type)).toEqual(["caseStudy", "report", "newsPost"]);
  });

  it("caps at 3 segments, folding the remainder into a slate 'other' bucket", () => {
    const segs = donutSegments({
      caseStudy: 4, livedExperience: 3, report: 2, agenda: 1, newsPost: 1,
    });
    expect(segs).toHaveLength(4);
    expect(segs.map((s) => s.type)).toEqual(["caseStudy", "livedExperience", "report", "other"]);
    const other = segs[3];
    expect(other.type).toBe("other");
    // agenda(1) + newsPost(1) folded together
    expect(other.share).toBeCloseTo(2 / 11);
  });

  it("computes contiguous, non-overlapping dashOffsets starting at 0", () => {
    const circumference = 2 * Math.PI * 10;
    const segs = donutSegments({ caseStudy: 1, livedExperience: 1 }, circumference);
    expect(segs[0].dashOffset).toBe(-0);
    const firstArc = segs[0].share * circumference;
    expect(segs[1].dashOffset).toBeCloseTo(-firstArc);
  });

  it("a single-type map yields one full-circle segment", () => {
    const segs = donutSegments({ caseStudy: 5 });
    expect(segs).toHaveLength(1);
    expect(segs[0].share).toBe(1);
  });
});
