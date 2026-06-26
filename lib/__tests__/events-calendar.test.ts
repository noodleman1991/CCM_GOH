import { describe, it, expect } from "vitest";
import {
  dayKey,
  buildMonthGrid,
  eventDayKeys,
  upcomingEvents,
} from "@/lib/events/calendar";

describe("dayKey", () => {
  it("formats a local date as YYYY-MM-DD (zero-padded)", () => {
    expect(dayKey(new Date(2026, 5, 9))).toBe("2026-06-09"); // June (month0=5)
    expect(dayKey(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(dayKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("buildMonthGrid", () => {
  it("returns a full 42-cell, Monday-first grid", () => {
    const grid = buildMonthGrid(2026, 5); // June 2026; June 1 2026 is a Monday
    expect(grid).toHaveLength(42);
    // June 1 is a Monday → no leading padding; first cell is in-month.
    expect(grid[0].key).toBe("2026-06-01");
    expect(grid[0].inMonth).toBe(true);
    // All in-month cells are exactly the 30 days of June.
    expect(grid.filter((c) => c.inMonth)).toHaveLength(30);
    // Cells are contiguous calendar days.
    for (let i = 1; i < grid.length; i++) {
      const prev = grid[i - 1].date.getTime();
      const cur = grid[i].date.getTime();
      expect(cur - prev).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("pads leading days from the previous month (Mon-first)", () => {
    const grid = buildMonthGrid(2026, 0); // Jan 2026; Jan 1 2026 is a Thursday
    // Monday-first: Thu is index 3 → 3 leading days from Dec, all inMonth=false.
    expect(grid.slice(0, 3).every((c) => !c.inMonth)).toBe(true);
    expect(grid[3].key).toBe("2026-01-01");
    expect(grid[3].inMonth).toBe(true);
    // The 3 leading days are the last 3 days of December 2025.
    expect(grid[0].key).toBe("2025-12-29");
  });

  it("pads trailing days from the next month", () => {
    const grid = buildMonthGrid(2026, 5); // June 2026 ends Tue June 30
    const trailing = grid.filter((c) => !c.inMonth);
    // 30 in-month + 42 total → 12 padding days, all trailing here.
    expect(trailing).toHaveLength(12);
    expect(trailing.every((c) => c.key.startsWith("2026-07"))).toBe(true);
  });
});

describe("eventDayKeys", () => {
  it("collects day keys with at least one event, skipping null startAt", () => {
    const keys = eventDayKeys([
      { _id: "a", startAt: new Date(2026, 5, 9, 14).toISOString() },
      { _id: "b", startAt: null },
      { _id: "c", startAt: new Date(2026, 5, 9, 18).toISOString() },
      { _id: "d", startAt: new Date(2026, 5, 12, 9).toISOString() },
    ]);
    expect(keys.has("2026-06-09")).toBe(true);
    expect(keys.has("2026-06-12")).toBe(true);
    expect(keys.size).toBe(2);
  });

  it("is empty for no events", () => {
    expect(eventDayKeys([]).size).toBe(0);
  });
});

describe("upcomingEvents", () => {
  const now = new Date(2026, 5, 15, 12); // 2026-06-15 noon
  const evs = [
    { _id: "past", startAt: new Date(2026, 5, 10).toISOString() },
    { _id: "todayEarlier", startAt: new Date(2026, 5, 15, 9).toISOString() },
    { _id: "soon", startAt: new Date(2026, 5, 16).toISOString() },
    { _id: "later", startAt: new Date(2026, 5, 20).toISOString() },
    { _id: "nodate", startAt: null },
  ];

  it("keeps events from the start of today onward, soonest-first, capped", () => {
    const up = upcomingEvents(evs, now, 2);
    expect(up.map((e) => e._id)).toEqual(["todayEarlier", "soon"]);
  });

  it("includes same-day-earlier events (start-of-day boundary), excludes past + null", () => {
    const ids = upcomingEvents(evs, now, 10).map((e) => e._id);
    expect(ids).toEqual(["todayEarlier", "soon", "later"]);
    expect(ids).not.toContain("past");
    expect(ids).not.toContain("nodate");
  });

  it("sorts unsorted input soonest-first", () => {
    const shuffled = [evs[3], evs[2], evs[1]]; // later, soon, todayEarlier
    expect(upcomingEvents(shuffled, now, 10).map((e) => e._id)).toEqual([
      "todayEarlier",
      "soon",
      "later",
    ]);
  });
});
