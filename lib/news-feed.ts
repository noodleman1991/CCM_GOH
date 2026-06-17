/**
 * Merge CCM's own news posts and curated external sources into ONE date-sorted
 * feed, each item tagged with its kind so the card can show a clear badge.
 * The page renders a single grid instead of separate "Latest" / "External"
 * sections.
 */

export type FeedKind = "site" | "external";

export type FeedItem =
  | { kind: "site"; id: string; date: number; data: any }
  | { kind: "external"; id: string; date: number; data: any };

const toTime = (d?: string | null) => {
  const t = d ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Interleave site + external items, newest first. */
export function mergeNewsFeed(
  site: any[] | null | undefined,
  external: any[] | null | undefined
): FeedItem[] {
  const items: FeedItem[] = [
    ...(site || []).map((d): FeedItem => ({ kind: "site", id: d._id, date: toTime(d.publishedAt), data: d })),
    ...(external || []).map((d): FeedItem => ({ kind: "external", id: d._id, date: toTime(d.publishedAt), data: d })),
  ];
  return items.sort((a, b) => b.date - a.date);
}
