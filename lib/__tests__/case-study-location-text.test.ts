import { describe, expect, it } from "vitest";
import { getStudyLocationText } from "@/lib/case-study-utils";

const base = { studyLocation: { lat: 51.5074, lng: -0.1278 } } as never;

describe("getStudyLocationText", () => {
  it("uses the place name", () => {
    expect(getStudyLocationText({ ...(base as object), locationDisplayText: "London, UK" } as never)).toBe("London, UK");
  });
  it("falls back to city and country", () => {
    expect(getStudyLocationText({ ...(base as object), locationText: { city: "Lagos", country: "Nigeria" } } as never)).toBe("Lagos, Nigeria");
    expect(getStudyLocationText({ ...(base as object), locationText: { country: "Kenya" } } as never)).toBe("Kenya");
  });
  it("never shows coordinates", () => {
    expect(getStudyLocationText(base)).toBeNull();
  });
});
