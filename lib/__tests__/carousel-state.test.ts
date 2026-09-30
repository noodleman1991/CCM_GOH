import { describe, expect, it } from "vitest";
import { carouselReducer, initialCarousel, shouldAdvance } from "@/lib/communities/carousel-state";

describe("the community carousel", () => {
  it("loops forward on its own", () => {
    let s = initialCarousel(7, false);
    for (let i = 0; i < 7; i++) s = carouselReducer(s, { type: "tick" });
    expect(s.index).toBe(0);
  });
  it("stops moving while hovered or the tab is hidden, and resumes after", () => {
    let s = carouselReducer(initialCarousel(7, false), { type: "pause", reason: "hover" });
    expect(shouldAdvance(s)).toBe(false);
    s = carouselReducer(s, { type: "resume", reason: "hover" });
    expect(shouldAdvance(s)).toBe(true);
    s = carouselReducer(s, { type: "pause", reason: "hidden" });
    expect(carouselReducer(s, { type: "tick" }).index).toBe(0);
  });
  it("stops for good once the visitor focuses it or uses the arrows", () => {
    let s = carouselReducer(initialCarousel(7, false), { type: "pause", reason: "focus" });
    s = carouselReducer(s, { type: "resume", reason: "focus" });
    expect(shouldAdvance(s)).toBe(false);
    const t = carouselReducer(initialCarousel(7, false), { type: "next" });
    expect(t.index).toBe(1);
    expect(shouldAdvance(t)).toBe(false);
  });
  it("never moves with reduced motion or with one card", () => {
    expect(shouldAdvance(initialCarousel(7, true))).toBe(false);
    expect(shouldAdvance(initialCarousel(1, false))).toBe(false);
  });
  it("wraps backwards and jumps to a dot", () => {
    expect(carouselReducer(initialCarousel(7, false), { type: "prev" }).index).toBe(6);
    expect(carouselReducer(initialCarousel(7, false), { type: "goto", index: 4 }).index).toBe(4);
  });
});
