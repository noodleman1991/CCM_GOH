export type FacetContentType = "caseStudy" | "livedExperience" | "newsPost" | "researchOutput" | "agenda" | "report";

/**
 * Map a pin's content type to its `COLOR.layer` key (`lib/ccm-colors.ts`), so a
 * cluster's colour always matches the type label shown alongside it in the
 * popover (a11y — colour is never the only signal). caseStudy and
 * livedExperience get their own layer colours; every other content type
 * (newsPost, agenda, report) falls back to "projects".
 */
export function layerColorKeyFor(type: FacetContentType): "cases" | "lived" | "projects" {
  if (type === "caseStudy") return "cases";
  if (type === "livedExperience") return "lived";
  return "projects";
}

export interface PinItem {
  id: string;
  title: string;
  type: FacetContentType;
  slug: string;
  countryCode3: string | null;
  /** Country-precision item pinned at its country's geometry centre — the
   *  location is approximate by design and renders visually distinct. */
  approx?: boolean;
}

export interface PinCluster {
  x: number;
  y: number;
  count: number;
  /** Items for the popover, `count` is the real total. Capped at 8 total AND
   *  at most 3 per content type (`fairItems`) — a per-type round-robin, not a
   *  flat first-8, so a mixed cluster's smaller types still get a titled item
   *  in the popover instead of being silently swallowed by a dominant type. */
  items: PinItem[];
  /** Distinct content types across the FULL bucket (not just the capped
   *  `items`) — a single-type cluster gets that type's `COLOR.layer` colour;
   *  a mixed-type cluster renders as a segmented donut (see `donutSegments`)
   *  instead of a flat "mixed" colour. */
  types: FacetContentType[];
  /** Per-type counts across the FULL bucket — feeds `donutSegments` to size
   *  each mixed cluster's donut arcs. */
  typeCounts: Partial<Record<FacetContentType, number>>;
  /** True when EVERY item in the bucket is country-precision — the whole
   *  cluster renders with the approximate (dashed) treatment. A mix of exact
   *  and approximate renders solid: at least one item truly is there. */
  approx: boolean;
}

/** Popover item caps — a flat `slice(0, N)` would let one dominant type
 *  (e.g. 20 caseStudy pins) crowd out a mixed cluster's smaller types
 *  entirely, leaving them a count with no titles at all. Round-robin across
 *  types instead: up to `MAX_PER_TYPE` from each, in turn, until `MAX_TOTAL`
 *  is reached — so every type present in the bucket surfaces at least one
 *  titled item whenever the total items available allow it. */
const MAX_TOTAL_ITEMS = 8;
const MAX_PER_TYPE = 3;

/** Select a fair, capped subset of a cluster's bucket for the popover (pure,
 *  order-stable within each type). See `MAX_TOTAL_ITEMS`/`MAX_PER_TYPE`. */
function fairItems(bucket: Array<PinItem & { x: number; y: number }>): PinItem[] {
  const byType = new Map<FacetContentType, Array<PinItem & { x: number; y: number }>>();
  for (const p of bucket) {
    const arr = byType.get(p.type) ?? [];
    if (arr.length < MAX_PER_TYPE) arr.push(p);
    byType.set(p.type, arr);
  }
  const types = [...byType.keys()];
  const result: Array<PinItem & { x: number; y: number }> = [];
  for (let round = 0; round < MAX_PER_TYPE && result.length < MAX_TOTAL_ITEMS; round++) {
    for (const type of types) {
      if (result.length >= MAX_TOTAL_ITEMS) break;
      const candidate = byType.get(type)![round];
      if (candidate) result.push(candidate);
    }
  }
  return result.map(({ x: _x, y: _y, ...item }) => item);
}

/** Grid-cluster projected points (viewBox 960×500). Pure — testable, no d3. */
export function clusterPins(
  points: Array<PinItem & { x: number; y: number }>,
  cell = 24
): PinCluster[] {
  const cells = new Map<string, Array<PinItem & { x: number; y: number }>>();
  for (const p of points) {
    const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
    const bucket = cells.get(key) ?? [];
    bucket.push(p);
    cells.set(key, bucket);
  }
  return [...cells.values()].map((bucket) => {
    const typeCounts: Partial<Record<FacetContentType, number>> = {};
    for (const p of bucket) typeCounts[p.type] = (typeCounts[p.type] ?? 0) + 1;
    return {
      x: bucket.reduce((s, p) => s + p.x, 0) / bucket.length,
      y: bucket.reduce((s, p) => s + p.y, 0) / bucket.length,
      count: bucket.length,
      items: fairItems(bucket),
      types: [...new Set(bucket.map((p) => p.type))],
      typeCounts,
      approx: bucket.every((p) => p.approx === true),
    };
  });
}

export interface DonutSegment {
  type: FacetContentType | "other";
  /** Share of the circle, 0–1; all segments in the returned array sum to 1
   *  (modulo floating-point). */
  share: number;
  /** SVG `stroke-dasharray` pair (`"filled gap"`) for a circle of the given
   *  circumference, so the caller can drop it straight onto a `<circle>`. */
  dashArray: string;
  /** SVG `stroke-dashoffset` — where this segment starts, going clockwise
   *  from 12 o'clock. */
  dashOffset: number;
}

/**
 * Turn a mixed pin cluster's type counts into segmented-donut arc geometry.
 * Pure + testable (no DOM/SVG dependency): callers drop `dashArray`/`dashOffset`
 * straight onto a `<circle>` with the matching `circumference` as its
 * `stroke-dasharray` basis. Caps at 3 segments by count desc, folding any
 * remainder into a synthetic "other" segment (slate) rather than drawing an
 * unreadable sliver per extra type — mirrors the popover's "count desc"
 * ordering so the two views agree on what's dominant.
 */
export function donutSegments(
  counts: Partial<Record<FacetContentType, number>>,
  circumference = 2 * Math.PI * 10,
  /** Visual breathing gap between segments (in circumference units) — pins v2
   *  renders rounded caps with a small gap so the ring reads as crafted.
   *  Applied only when there are 2+ segments; a gap never shrinks a segment
   *  below a quarter of its true arc (tiny shares stay visible). `share`
   *  still reports the TRUE proportion — the gap is presentation only. */
  gap = 0
): DonutSegment[] {
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);
  if (total <= 0) return [];

  const ranked = (Object.entries(counts) as Array<[FacetContentType, number]>)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);

  const MAX_SEGMENTS = 3;
  const top = ranked.slice(0, MAX_SEGMENTS);
  const restCount = ranked.slice(MAX_SEGMENTS).reduce((s, [, n]) => s + n, 0);

  const parts: Array<{ type: FacetContentType | "other"; count: number }> = [
    ...top.map(([type, count]) => ({ type, count })),
    ...(restCount > 0 ? [{ type: "other" as const, count: restCount }] : []),
  ];

  const effectiveGap = parts.length > 1 ? gap : 0;
  let offset = 0;
  return parts.map(({ type, count }) => {
    const share = count / total;
    const arcLength = share * circumference;
    const drawn = Math.max(arcLength - effectiveGap, arcLength / 4);
    const segment: DonutSegment = {
      type,
      share,
      dashArray: `${drawn} ${circumference - drawn}`,
      // Centre the drawn arc inside its true slot so gaps split evenly
      // between neighbours.
      dashOffset: -(offset + (arcLength - drawn) / 2),
    };
    offset += arcLength;
    return segment;
  });
}
