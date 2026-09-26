import { describe, it, expect } from "vitest";
import { projectPoint } from "../project-point";

describe("projectPoint", () => {
  it("projects Nairobi into the viewBox, right-of-centre and below-middle", () => {
    const p = projectPoint(-1.29, 36.82); // Nairobi (lat, lng)
    expect(p).not.toBeNull();
    expect(p!.x).toBeGreaterThan(480); // east of the prime-meridian centre line
    expect(p!.x).toBeLessThan(960);
    expect(p!.y).toBeGreaterThan(250); // southern hemisphere → lower half
    expect(p!.y).toBeLessThan(500);
  });

  it("returns null for junk", () => {
    expect(projectPoint(NaN, 10)).toBeNull();
    expect(projectPoint(95, 10)).toBeNull(); // out-of-range latitude
  });
});
