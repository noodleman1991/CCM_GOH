export type FacetContentType = "caseStudy" | "livedExperience" | "newsPost" | "agenda" | "report";

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
  }));
}
