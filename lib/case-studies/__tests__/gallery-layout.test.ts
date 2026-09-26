import { describe, it, expect } from "vitest";
import { assignGalleryVariant, spanForVariant } from "@/lib/case-studies/gallery-layout";

describe("assignGalleryVariant", () => {
  it("leads with a feature card", () => {
    expect(assignGalleryVariant(0, 10)).toBe("feature");
    expect(assignGalleryVariant(0, 1)).toBe("feature");
  });

  it("adds a periodic wide split only in galleries larger than 4", () => {
    expect(assignGalleryVariant(4, 10)).toBe("wide");
    expect(assignGalleryVariant(8, 10)).toBe("wide");
    expect(assignGalleryVariant(4, 4)).toBe("classic");
  });

  it("is deterministic and only emits known variants", () => {
    const run = () => Array.from({ length: 12 }, (_, i) => assignGalleryVariant(i, 12));
    expect(run()).toEqual(run());
    for (const v of run()) expect(["feature", "wide", "classic"]).toContain(v);
  });
});

describe("spanForVariant", () => {
  it("maps every variant to a grid span", () => {
    expect(spanForVariant("feature")).toContain("lg:col-span-4");
    expect(spanForVariant("wide")).toContain("lg:col-span-6");
    expect(spanForVariant("classic")).toContain("lg:col-span-2");
  });
});
