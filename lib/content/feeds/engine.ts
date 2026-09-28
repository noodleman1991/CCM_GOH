/**
 * The Content feed's rules, with no I/O: settings in, ordered cards out.
 * `resolve.ts` does the fetching; this decides what shows and in what order.
 */
import { isRegionCode } from "@/lib/maps/region-codes";
import {
  FEED_FILLS,
  FEED_KINDS,
  FEED_LAYOUTS,
  FEED_SORTS,
  KIND_HAS_FEATURED,
  KIND_LISTING,
  type FeedCard,
  type FeedKind,
  type FeedPick,
  type FeedResult,
  type FeedSettings,
  type FeedSort,
} from "@/lib/content/feeds/types";

type Loose = Record<string, unknown>;

const asRow = (v: unknown): Loose => (v && typeof v === "object" && !Array.isArray(v) ? (v as Loose) : {});
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : []);
const oneOf = <T extends string>(v: unknown, all: readonly T[], dflt: T): T => (all.includes(v as T) ? (v as T) : dflt);
const isKind = (v: unknown): v is FeedKind => (FEED_KINDS as readonly unknown[]).includes(v);
const nonEmpty = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

function clamp(n: unknown, lo: number, hi: number, dflt: number): number {
  return typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt;
}

/** Any stored or submitted value → complete, safe settings. Unknown kinds,
 *  region codes and malformed picks are dropped, never passed to a query. */
export function normalizeFeedSettings(raw: unknown): FeedSettings {
  const r = asRow(raw);
  const f = asRow(r.filters);
  const v = asRow(r.viewAll);
  const kinds = strs(r.kinds).filter(isKind);
  const picks = (Array.isArray(r.picks) ? r.picks : [])
    .map(asRow)
    .filter((p) => isKind(p.kind) && typeof p.id === "string" && p.id.length > 0)
    .map((p): FeedPick => ({ kind: p.kind as FeedKind, id: p.id as string }));

  return {
    kinds: kinds.length ? [...new Set(kinds)] : ["caseStudies"],
    fill: oneOf(r.fill, FEED_FILLS, "automatic"),
    picks,
    filters: {
      regions: strs(f.regions).filter(isRegionCode),
      communityIds: strs(f.communityIds),
      tagIds: strs(f.tagIds),
      featuredOnly: f.featuredOnly === true,
      upcomingOnly: f.upcomingOnly === true,
    },
    sort: oneOf(r.sort, FEED_SORTS, "newest"),
    count: clamp(r.count, 1, 24, 6),
    layout: oneOf(r.layout, FEED_LAYOUTS, "grid"),
    heading: nonEmpty(r.heading),
    intro: nonEmpty(r.intro),
    viewAll: { show: v.show !== false, href: nonEmpty(v.href), label: nonEmpty(v.label) },
  };
}

/** The kinds worth querying: "Featured only" leaves out kinds with no featured flag. */
export function kindsToQuery(s: FeedSettings): FeedKind[] {
  return s.filters.featuredOnly ? s.kinds.filter((k) => KIND_HAS_FEATURED[k]) : s.kinds;
}

const when = (x: FeedCard) => x.startAt ?? x.date ?? "";
/** Newest first; undated last; ties broken by key so the order is stable. */
const newest = (a: FeedCard, b: FeedCard) => when(b).localeCompare(when(a)) || a.key.localeCompare(b.key);

export function sortCards(cards: FeedCard[], sort: FeedSort, now: Date): FeedCard[] {
  const list = [...cards];
  if (sort === "featuredFirst") return list.sort((a, b) => Number(b.featured) - Number(a.featured) || newest(a, b));
  if (sort === "upcomingSoonest") {
    const t = now.toISOString();
    const isUpcoming = (x: FeedCard) => x.startAt !== null && x.startAt >= t;
    const upcoming = list.filter(isUpcoming).sort((a, b) => a.startAt!.localeCompare(b.startAt!));
    return [...upcoming, ...list.filter((x) => !isUpcoming(x)).sort(newest)];
  }
  return list.sort(newest);
}

/**
 * Picks (when the fill mode uses them) first, then the automatic items, with no
 * item twice and no more than `count`. A pick the published read didn't return
 * — unpublished, deleted, or not approved — is skipped and reported.
 */
export function mergeFeed({
  settings,
  pickedCards,
  automatic,
  now,
}: {
  settings: FeedSettings;
  pickedCards: Map<string, FeedCard>;
  automatic: FeedCard[];
  now: Date;
}): FeedResult {
  const skipped: FeedResult["skipped"] = [];
  const picks: FeedCard[] = [];
  if (settings.fill !== "automatic") {
    for (const pick of settings.picks) {
      const card = pickedCards.get(`${pick.kind}:${pick.id}`);
      if (card) picks.push(card);
      else skipped.push({ pick, reason: "unpublished" });
    }
  }

  // Picks keep the editor's order, except "Only my picks" with a real sort chosen.
  const orderedPicks = settings.fill === "picksOnly" && settings.sort !== "myOrder" ? sortCards(picks, settings.sort, now) : picks;
  const seen = new Set<string>();
  const out: FeedCard[] = [];
  const add = (x: FeedCard) => {
    if (!seen.has(x.key) && out.length < settings.count) {
      seen.add(x.key);
      out.push(x);
    }
  };
  orderedPicks.forEach(add);
  if (settings.fill !== "picksOnly") {
    sortCards(automatic, settings.sort === "myOrder" ? "newest" : settings.sort, now).forEach(add);
  }
  return { items: out.map((x) => x.card), skipped };
}

/** A site path or an http(s) URL; anything else (javascript:, //host) is refused. */
function safeHref(href: string): boolean {
  if (href.startsWith("/")) return !href.startsWith("//") && !href.includes("\\");
  return /^https?:\/\//i.test(href);
}

/**
 * The "View all" link, or `null` for none. One kind → that kind's listing, with
 * the site's own label (`labelKey` in the `feed` messages) and `siteLink: true`:
 * the path has no language prefix, because the locale-aware `Link` adds it. A
 * mixed feed has no single listing, so it needs both a link and a label from
 * the editor, used exactly as typed.
 */
export function viewAllLink(
  s: FeedSettings,
): { href: string; labelKey: string | null; label: string | null; siteLink: boolean } | null {
  if (!s.viewAll.show) return null;
  if (s.kinds.length === 1) return { href: KIND_LISTING[s.kinds[0]], labelKey: `viewAll.${s.kinds[0]}`, label: null, siteLink: true };
  if (s.viewAll.href && s.viewAll.label && safeHref(s.viewAll.href)) {
    return { href: s.viewAll.href, labelKey: null, label: s.viewAll.label, siteLink: false };
  }
  return null;
}
