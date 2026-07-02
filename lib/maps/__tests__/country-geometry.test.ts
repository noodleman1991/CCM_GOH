import { describe, it, expect } from "vitest";
import { getCountryPath, listCountryIsoCodes } from "../country-geometry";

describe("country geometry accessor", () => {
  it("has Kenya, mapped to ssa", () => {
    const ken = getCountryPath("KEN");
    expect(ken).not.toBeNull();
    expect(ken!.d.length).toBeGreaterThan(20);
    expect(ken!.region).toBe("ssa");
  });
  it("returns null for unknown codes", () => {
    expect(getCountryPath("XXX")).toBeNull();
  });
  it("covers most of the world", () => {
    expect(listCountryIsoCodes().length).toBeGreaterThan(150);
  });
});
