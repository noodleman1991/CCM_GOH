/**
 * Shared time-frame filtering — a small set of friendly presets that resolve to
 * a `dateFrom` ISO string, used by the time-frame pills across news, case
 * studies and agendas. "Any time" clears the date filter.
 */

export type TimeFrame = "any" | "year" | "threeYears" | "fiveYears";

export const TIME_FRAMES: TimeFrame[] = ["any", "year", "threeYears", "fiveYears"];

/** Years back for each preset (0 = no lower bound). */
const YEARS_BACK: Record<TimeFrame, number> = {
  any: 0,
  year: 1,
  threeYears: 3,
  fiveYears: 5,
};

/** The `dateFrom` ISO string for a time-frame (null = no lower bound). */
export function timeFrameToDateFrom(tf: TimeFrame, now: Date = new Date()): string | null {
  const years = YEARS_BACK[tf] ?? 0;
  if (years <= 0) return null;
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString();
}

/**
 * Infer which preset a stored `dateFrom` corresponds to (for highlighting the
 * active pill). Matches to the nearest preset within a small tolerance; returns
 * "any" when there's no lower bound and null when it's a custom date.
 */
export function dateFromToTimeFrame(
  dateFrom: string | null | undefined,
  now: Date = new Date()
): TimeFrame | null {
  if (!dateFrom) return "any";
  const from = Date.parse(dateFrom);
  if (Number.isNaN(from)) return "any";
  const toleranceMs = 1000 * 60 * 60 * 24 * 14; // 2 weeks
  for (const tf of TIME_FRAMES) {
    if (tf === "any") continue;
    const preset = timeFrameToDateFrom(tf, now);
    if (preset && Math.abs(Date.parse(preset) - from) <= toleranceMs) return tf;
  }
  return null; // a custom date the presets don't cover
}
