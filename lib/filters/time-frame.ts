/**
 * Shared time-frame filtering — a small set of friendly presets that resolve to
 * a `dateFrom` ISO string, used by the time-frame pills across news, case
 * studies and lived experiences. "Any time" clears the date filter. Max = 3 years.
 */

export type TimeFrame = "any" | "month" | "threeMonths" | "year" | "threeYears";

export const TIME_FRAMES: TimeFrame[] = ["any", "month", "threeMonths", "year", "threeYears"];

/** Months back for each preset (0 = no lower bound). */
const MONTHS_BACK: Record<TimeFrame, number> = {
  any: 0,
  month: 1,
  threeMonths: 3,
  year: 12,
  threeYears: 36,
};

/** The `dateFrom` ISO string for a time-frame (null = no lower bound). */
export function timeFrameToDateFrom(tf: TimeFrame, now: Date = new Date()): string | null {
  const months = MONTHS_BACK[tf] ?? 0;
  if (months <= 0) return null;
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
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
