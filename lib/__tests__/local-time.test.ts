import { describe, expect, it } from "vitest";
import { localInputToIso, zoneLabel } from "@/lib/events/local-time";

describe("times the member typed", () => {
  it("become UTC instants from the browser's own zone", () => {
    const typed = "2026-11-02T19:30";
    const expected = new Date(2026, 10, 2, 19, 30).toISOString(); // the same wall-clock time, in this machine's zone
    expect(localInputToIso(typed)).toBe(expected);
  });
  it("are labelled with the zone the form used", () => {
    expect(zoneLabel(new Date("2026-07-01T12:00:00Z"), "en")).toMatch(/GMT|UTC|[A-Z]{2,5}/);
  });
  it("refuse an empty or broken value", () => {
    expect(localInputToIso("")).toBe("");
    expect(localInputToIso("nope")).toBe("");
  });
});
