import { describe, it, expect } from "vitest";
import { assignGalleryVariant, spanForVariant } from "@/lib/case-studies/gallery-layout";

describe("assignGalleryVariant", () => {
  it("leads with a feature card", () => {
    expect(assignGalleryVariant(0, 10)).toBe("feature");
    expect(assignGalleryVariant(0, 1)).toBe("feature");
  });

  it("adds a wide split after every six standard cards, so rows of two or three stay full", () => {
    expect(assignGalleryVariant(7, 20)).toBe("wide");
    expect(assignGalleryVariant(14, 20)).toBe("wide");
    expect([1, 2, 3, 4, 5, 6, 8].map((i) => assignGalleryVariant(i, 20))).toEqual(Array(7).fill("classic"));
    expect(assignGalleryVariant(7, 7)).toBe("classic");
  });

  it("is deterministic and only emits known variants", () => {
    const run = () => Array.from({ length: 12 }, (_, i) => assignGalleryVariant(i, 12));
    expect(run()).toEqual(run());
    for (const v of run()) expect(["feature", "wide", "classic"]).toContain(v);
  });
});

describe("spanForVariant", () => {
  // Titles get three lines; a standard card must be wide enough to show a
  // 100-character title in them, so it takes half the row until very wide screens.
  it("puts standard cards two to a row once the content area is wide enough, sized to the content area (not the window)", () => {
    expect(spanForVariant("classic")).toBe("col-span-1");
    expect(spanForVariant("feature")).toBe("@content-md/page:col-span-2");
    expect(spanForVariant("wide")).toBe("@content-md/page:col-span-2");
  });
});
