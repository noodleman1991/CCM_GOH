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
}

export interface PinCluster {
  x: number;
  y: number;
  count: number;
  /** First items for the popover; capped at 5, `count` is the real total. */
  items: PinItem[];
  /** Distinct content types across the FULL bucket (not just the capped
   *  `items`) — a single-type cluster gets that type's `COLOR.layer` colour;
   *  a mixed-type cluster renders as a segmented donut (see `donutSegments`)
   *  instead of a flat "mixed" colour. */
  types: FacetContentType[];
  /** Per-type counts across the FULL bucket — feeds `donutSegments` to size
   *  each mixed cluster's donut arcs. */
  typeCounts: Partial<Record<FacetContentType, number>>;
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
      items: bucket.slice(0, 5).map(({ x: _x, y: _y, ...item }) => item),
      types: [...new Set(bucket.map((p) => p.type))],
      typeCounts,
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
