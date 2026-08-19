/**
 * Merge CCM's own news posts and curated external sources into ONE date-sorted
 * feed, each item tagged with its kind so the card can show a clear badge.
 * The page renders a single grid instead of separate "Latest" / "External"
 * sections.
 */

export type FeedKind = "site" | "external";

// The site/external documents come from untyped GROQ fetches (client.fetch
// resolves to `any`), and the news page reads many card fields straight off
// `item.data`. A generic or `unknown` here breaks that consumer (TS infers the
// constraint, not `any`, from an `any` argument), so the flow-through type is
// kept as an explicit, documented `any` alias.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberate flow-through for untyped GROQ results; see comment above.
type UntypedFeedDoc = any;

export type FeedItem =
  | { kind: "site"; id: string; date: number; data: UntypedFeedDoc }
  | { kind: "external"; id: string; date: number; data: UntypedFeedDoc };

const toTime = (d?: string | null) => {
  const t = d ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Interleave site + external items, newest first. */
export function mergeNewsFeed(
  site: UntypedFeedDoc[] | null | undefined,
  external: UntypedFeedDoc[] | null | undefined
): FeedItem[] {
  const items: FeedItem[] = [
    ...(site || []).map((d): FeedItem => ({ kind: "site", id: d._id, date: toTime(d.publishedAt), data: d })),
    ...(external || []).map((d): FeedItem => ({ kind: "external", id: d._id, date: toTime(d.publishedAt), data: d })),
  ];
  return items.sort((a, b) => b.date - a.date);
}
