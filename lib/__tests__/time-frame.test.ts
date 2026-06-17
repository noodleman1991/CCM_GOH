import { describe, it, expect } from "vitest";
import { timeFrameToDateFrom, dateFromToTimeFrame } from "../filters/time-frame";

const now = new Date("2026-06-17T00:00:00Z");

describe("timeFrameToDateFrom", () => {
  it("returns null for 'any'", () => {
    expect(timeFrameToDateFrom("any", now)).toBeNull();
  });
  it("subtracts the right number of years", () => {
    expect(timeFrameToDateFrom("year", now)?.slice(0, 4)).toBe("2025");
    expect(timeFrameToDateFrom("threeYears", now)?.slice(0, 4)).toBe("2023");
    expect(timeFrameToDateFrom("fiveYears", now)?.slice(0, 4)).toBe("2021");
  });
});

describe("dateFromToTimeFrame", () => {
  it("maps a stored dateFrom back to its preset", () => {
    expect(dateFromToTimeFrame(timeFrameToDateFrom("year", now), now)).toBe("year");
    expect(dateFromToTimeFrame(timeFrameToDateFrom("threeYears", now), now)).toBe("threeYears");
  });
  it("returns 'any' when there's no lower bound", () => {
    expect(dateFromToTimeFrame(null, now)).toBe("any");
    expect(dateFromToTimeFrame(undefined, now)).toBe("any");
    expect(dateFromToTimeFrame("not-a-date", now)).toBe("any");
  });
  it("returns null for a custom date that matches no preset", () => {
    expect(dateFromToTimeFrame("2024-07-04T00:00:00Z", now)).toBeNull();
  });
});
