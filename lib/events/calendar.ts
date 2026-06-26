/**
 * Pure date helpers for the events-calendar block (Slice H3).
 *
 * No `server-only`, no React — these are pure functions used by the client
 * calendar component AND covered directly by Vitest. The single source of truth
 * for the block's date math:
 *  - month-grid construction (`buildMonthGrid`),
 *  - mapping events onto calendar days (`dayKey` / `eventDayKeys`),
 *  - the upcoming-events filter (`upcomingEvents`).
 *
 * Conventions:
 *  - Grids are **Monday-first** (the codebase serves a global audience; ISO weeks
 *    start Monday) and always a full **6×7 = 42 cells** so the grid height is
 *    stable across months (no layout jump when paging).
 *  - "Upcoming" is measured from the **start of today** (local), so an event
 *    earlier today still counts as upcoming rather than vanishing at noon.
 *  - All keys are LOCAL calendar days (`YYYY-MM-DD`); a calendar cell and an
 *    event match when their `dayKey`s are equal.
 */

/** The minimal event shape these helpers need (structural subset of EventListItem). */
export type MiniEvent = { _id: string; startAt: string | null };

/** A single calendar cell. */
export type MonthGridCell = {
  /** The local date this cell represents (midnight, local). */
  date: Date;
  /** True when the cell belongs to the grid's target month (vs. padding). */
  inMonth: boolean;
  /** The cell's `YYYY-MM-DD` local key (matches `dayKey`). */
  key: string;
};

const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Local `YYYY-MM-DD` for a date — the join key between a cell and an event. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday-first weekday index (Mon=0 … Sun=6) for a JS day (Sun=0 … Sat=6). */
function mondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

/**
 * Build a stable 42-cell, Monday-first month grid. `month0` is 0-based (Jan=0).
 * Leading cells come from the previous month and trailing cells from the next,
 * each flagged `inMonth=false`.
 */
export function buildMonthGrid(year: number, month0: number): MonthGridCell[] {
  const firstOfMonth = new Date(year, month0, 1);
  const leading = mondayIndex(firstOfMonth.getDay());

  // The grid's first cell = first-of-month minus the leading padding days.
  const start = new Date(year, month0, 1 - leading);

  const cells: MonthGridCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === month0 && date.getFullYear() === year,
      key: dayKey(date),
    });
  }
  return cells;
}

/** Set of local day keys that have at least one event (null `startAt` skipped). */
export function eventDayKeys(events: MiniEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const e of events) {
    if (!e.startAt) continue;
    keys.add(dayKey(new Date(e.startAt)));
  }
  return keys;
}

/**
 * Events starting from the start of `now`'s local day onward, soonest-first,
 * capped at `limit`. Events with a null `startAt` are excluded.
 */
export function upcomingEvents<T extends MiniEvent>(
  events: T[],
  now: Date,
  limit: number
): T[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return events
    .filter((e): e is T & { startAt: string } => {
      if (!e.startAt) return false;
      return new Date(e.startAt).getTime() >= startOfToday;
    })
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, Math.max(0, limit));
}
