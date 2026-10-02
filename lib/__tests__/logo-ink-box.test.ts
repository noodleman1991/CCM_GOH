import { describe, expect, it } from "vitest";
import { logoCrop } from "@/lib/logos/ink-box";

/** A white w×h canvas with a dark rectangle at (x, y, rw, rh). */
function canvas(w: number, h: number, rect?: { x: number; y: number; w: number; h: number }, background: [number, number, number, number] = [255, 255, 255, 255]) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set(background, i * 4);
  if (rect) for (let y = rect.y; y < rect.y + rect.h; y++) for (let x = rect.x; x < rect.x + rect.w; x++) data.set([20, 40, 120, 255], (y * w + x) * 4);
  return data;
}

describe("finding the logo inside its file", () => {
  it("crops a wide logo sitting in a big white square, keeping a small margin", () => {
    const crop = logoCrop(canvas(100, 100, { x: 10, y: 40, w: 80, h: 20 }), 100, 100);
    // margin = 4% of the longer logo side (80) → 3px, kept inside the file
    expect(crop).toEqual({ left: 7, top: 37, width: 86, height: 26 });
  });

  it("ignores near-white noise and see-through pixels", () => {
    const data = canvas(100, 100, { x: 30, y: 30, w: 40, h: 40 });
    data.set([250, 250, 250, 255], (5 * 100 + 5) * 4); // near-white speck
    data.set([0, 0, 0, 10], (90 * 100 + 90) * 4); // almost fully transparent dark pixel
    expect(logoCrop(data, 100, 100)).toEqual({ left: 28, top: 28, width: 44, height: 44 });
  });

  it("leaves a logo that already fills its file alone", () => {
    expect(logoCrop(canvas(100, 100, { x: 2, y: 3, w: 96, h: 94 }), 100, 100)).toBeNull();
  });

  it("leaves a file with no logo in it alone", () => {
    expect(logoCrop(canvas(50, 50), 50, 50)).toBeNull();
  });

  it("works on a transparent background too", () => {
    const crop = logoCrop(canvas(100, 100, { x: 20, y: 45, w: 60, h: 10 }, [0, 0, 0, 0]), 100, 100);
    expect(crop).toMatchObject({ top: 43, height: 14 });
  });
});
