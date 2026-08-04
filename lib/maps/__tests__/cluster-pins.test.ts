import { describe, it, expect } from "vitest";
import { clusterPins, layerColorKeyFor, donutSegments } from "../cluster-pins";

const item = (id: string, x: number, y: number, type: "caseStudy" | "livedExperience" = "caseStudy") => ({
  id, title: id, type, slug: id, countryCode3: "KEN", x, y,
});

const approxItem = (id: string, x: number, y: number, approx: boolean) => ({
  ...item(id, x, y),
  approx,
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

  it("marks a cluster approx when every item in the bucket is country-precision", () => {
    const [c] = clusterPins(
      [approxItem("a", 100, 100, true), approxItem("b", 101, 101, true)],
      24
    );
    expect(c.approx).toBe(true);
  });

  it("marks a cluster non-approx when it mixes exact and country-precision items", () => {
    const [c] = clusterPins(
      [approxItem("a", 100, 100, true), approxItem("b", 101, 101, false)],
      24
    );
    expect(c.approx).toBe(false);
  });

  it("marks a cluster non-approx when every item is exact (no approx flag)", () => {
    const [c] = clusterPins([item("a", 100, 100), item("b", 101, 101)], 24);
    expect(c.approx).toBe(false);
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

describe("donutSegments gap (pins v2)", () => {
  const C = 2 * Math.PI * 10;

  it("shrinks drawn arcs by the gap and centres them in their slot", () => {
    const segs = donutSegments({ caseStudy: 1, livedExperience: 1 }, C, 4);
    const [a, b] = segs;
    const drawnA = parseFloat(a.dashArray.split(" ")[0]);
    expect(drawnA).toBeCloseTo(C / 2 - 4, 5);
    // centred: offset shifted by half the removed length
    expect(a.dashOffset).toBeCloseTo(-2, 5);
    expect(b.dashOffset).toBeCloseTo(-(C / 2 + 2), 5);
    // true shares unaffected by the visual gap
    expect(a.share).toBeCloseTo(0.5, 5);
  });

  it("never shrinks a tiny segment below a quarter of its true arc", () => {
    const segs = donutSegments({ caseStudy: 99, livedExperience: 1 }, C, 8);
    const tiny = segs[1];
    const trueArc = 0.01 * C;
    const drawn = parseFloat(tiny.dashArray.split(" ")[0]);
    expect(drawn).toBeCloseTo(trueArc / 4, 5);
  });

  it("applies no gap to a single-segment donut", () => {
    const segs = donutSegments({ caseStudy: 5 }, C, 6);
    expect(parseFloat(segs[0].dashArray.split(" ")[0])).toBeCloseTo(C, 5);
  });
});
