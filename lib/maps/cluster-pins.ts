export type FacetContentType = "caseStudy" | "livedExperience" | "newsPost" | "agenda" | "report";

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
   *  `items`) — drives pin colour: single-type cluster gets that type's
   *  `COLOR.layer` colour, a mixed-type cluster falls back to `CCM.amber`. */
  types: FacetContentType[];
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
  return [...cells.values()].map((bucket) => ({
    x: bucket.reduce((s, p) => s + p.x, 0) / bucket.length,
    y: bucket.reduce((s, p) => s + p.y, 0) / bucket.length,
    count: bucket.length,
    items: bucket.slice(0, 5).map(({ x: _x, y: _y, ...item }) => item),
    types: [...new Set(bucket.map((p) => p.type))],
  }));
}
