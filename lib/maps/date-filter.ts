// Atlas "When" facet — maps a coarse date bucket to a GROQ predicate over a
// document's effective publish date. Shared by region-data / region-items /
// region-pins so the map counts, the cards, and the pins all describe the SAME
// filtered set (count↔card↔pin consistency, the same invariant theme/q hold).
//
// The effective date mirrors the projections in those routes:
//   coalesce(publishedAt, publishDate, _createdAt)
// A missing date sorts as "no date"; such docs are only included in the
// unfiltered ("all") bucket, never in a bounded one — a doc with no date can't
// be asserted to fall in "past year".

export type WhenBucket = "y1" | "y3" | "older";

const WHEN_BUCKETS: ReadonlySet<string> = new Set(["y1", "y3", "older"]);

/** Validate a raw `?when=` param; returns the bucket or null (→ no date filter). */
export function parseWhen(raw: string | null | undefined): WhenBucket | null {
  return raw && WHEN_BUCKETS.has(raw) ? (raw as WhenBucket) : null;
}

/** The document's effective-date expression, reused inside the predicate. Kept
 *  here (not inlined) so every route computes the same date the same way. */
export const EFFECTIVE_DATE_GROQ = "coalesce(publishedAt, publishDate, _createdAt)";

export interface WhenFilter {
  /** GROQ fragment to append inside a filter, e.g. ` && <date> >= $whenFrom`.
   *  Empty string when no bucket is active. Only ever references bound params. */
  filter: string;
  /** Bound GROQ params to spread into the query's param object. */
  params: Record<string, string>;
}

/**
 * Build the GROQ date predicate + bound params for a `when` bucket, relative to
 * `now` (pass the request's `new Date()` — kept as a parameter so this is pure
 * and testable). Boundaries:
 *   y1    → date >= (now - 1 year)
 *   y3    → date >= (now - 3 years)   (a superset of y1 — "recent" widened)
 *   older → date <  (now - 3 years)
 * Both bounds also require the date to be defined, so date-less docs drop out of
 * any bounded bucket. Returns an empty filter for a null bucket.
 */
export function whenFilter(bucket: WhenBucket | null, now: Date): WhenFilter {
  if (!bucket) return { filter: "", params: {} };
  const d = EFFECTIVE_DATE_GROQ;
  const iso = (yearsAgo: number) => {
    const t = new Date(now);
    t.setFullYear(t.getFullYear() - yearsAgo);
    return t.toISOString();
  };
  if (bucket === "y1") {
    return { filter: ` && defined(${d}) && ${d} >= $whenFrom`, params: { whenFrom: iso(1) } };
  }
  if (bucket === "y3") {
    return { filter: ` && defined(${d}) && ${d} >= $whenFrom`, params: { whenFrom: iso(3) } };
  }
  // older
  return { filter: ` && defined(${d}) && ${d} < $whenTo`, params: { whenTo: iso(3) } };
}
