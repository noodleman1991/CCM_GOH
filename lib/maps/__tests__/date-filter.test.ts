import { describe, it, expect } from "vitest";
import { parseWhen, whenFilter, EFFECTIVE_DATE_GROQ } from "../date-filter";

const NOW = new Date("2026-07-17T00:00:00.000Z");

describe("parseWhen", () => {
  it("accepts the three valid buckets", () => {
    expect(parseWhen("y1")).toBe("y1");
    expect(parseWhen("y3")).toBe("y3");
    expect(parseWhen("older")).toBe("older");
  });
  it("rejects unknown / empty values as null (no filter)", () => {
    expect(parseWhen("")).toBeNull();
    expect(parseWhen(null)).toBeNull();
    expect(parseWhen(undefined)).toBeNull();
    expect(parseWhen("last-week")).toBeNull();
  });
});

describe("whenFilter", () => {
  it("returns an empty filter with no params for a null bucket", () => {
    expect(whenFilter(null, NOW)).toEqual({ filter: "", params: {} });
  });

  it("y1 bounds to one year ago via a bound param, requiring a defined date", () => {
    const { filter, params } = whenFilter("y1", NOW);
    expect(filter).toContain(`defined(${EFFECTIVE_DATE_GROQ})`);
    expect(filter).toContain(`${EFFECTIVE_DATE_GROQ} >= $whenFrom`);
    expect(params.whenFrom).toBe("2025-07-17T00:00:00.000Z");
  });

  it("y3 widens the recent window to three years", () => {
    const { params } = whenFilter("y3", NOW);
    expect(params.whenFrom).toBe("2023-07-17T00:00:00.000Z");
  });

  it("older is the strict complement of y3 (before three years ago)", () => {
    const { filter, params } = whenFilter("older", NOW);
    expect(filter).toContain(`${EFFECTIVE_DATE_GROQ} < $whenTo`);
    expect(params.whenTo).toBe("2023-07-17T00:00:00.000Z");
  });

  it("never interpolates raw dates into the filter string (params only)", () => {
    for (const b of ["y1", "y3", "older"] as const) {
      expect(whenFilter(b, NOW).filter).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });

  it("does not mutate the passed-in now", () => {
    const now = new Date(NOW);
    whenFilter("older", now);
    expect(now.toISOString()).toBe(NOW.toISOString());
  });
});
