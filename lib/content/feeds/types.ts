import type { TypedCardItem } from "@/lib/cards/type-style";

/**
 * The Content feed section's settings and results (spec §3.2). Pure types and
 * constants — safe for the admin's client components and the server alike.
 */

export const FEED_KINDS = ["caseStudies", "newsPosts", "events", "livedExperiences", "researchOutputs", "agendas"] as const;
export type FeedKind = (typeof FEED_KINDS)[number];

export const FEED_FILLS = ["automatic", "automaticWithPicks", "picksOnly"] as const;
export type FeedFill = (typeof FEED_FILLS)[number];

export const FEED_SORTS = ["newest", "featuredFirst", "upcomingSoonest", "myOrder"] as const;
export type FeedSort = (typeof FEED_SORTS)[number];

export const FEED_LAYOUTS = ["grid", "carousel", "list"] as const;
export type FeedLayout = (typeof FEED_LAYOUTS)[number];

export interface FeedPick {
  kind: FeedKind;
  id: string;
}

export interface FeedFilters {
  regions: string[];
  communityIds: string[];
  tagIds: string[];
  featuredOnly: boolean;
  upcomingOnly: boolean;
}

export interface FeedSettings {
  kinds: FeedKind[];
  fill: FeedFill;
  picks: FeedPick[];
  filters: FeedFilters;
  sort: FeedSort;
  count: number;
  layout: FeedLayout;
  heading: string | null;
  intro: string | null;
  viewAll: { show: boolean; href: string | null; label: string | null };
}

export interface FeedContext {
  locale: "en" | "es" | "fr" | "ar";
  /** The community whose page this feed sits on, used when no community filter is set. */
  communityId?: string | null;
  now?: Date;
}

/** A card plus what the engine needs to sort it; `key` is `${kind}:${id}`. */
export interface FeedCard {
  key: string;
  kind: FeedKind;
  featured: boolean;
  /** Publish date (ISO); `null` for events and undated items. */
  date: string | null;
  /** Events only: start (ISO). */
  startAt: string | null;
  card: TypedCardItem;
}

export interface FeedResult {
  items: TypedCardItem[];
  skipped: Array<{ pick: FeedPick; reason: "unpublished" }>;
}

/** Events have no featured flag, so "Featured only" leaves them out. */
export const KIND_HAS_FEATURED: Record<FeedKind, boolean> = {
  caseStudies: true,
  newsPosts: true,
  events: false,
  livedExperiences: true,
  researchOutputs: true,
  agendas: true,
};

/** Where "View all" goes for a single-kind feed (without the locale prefix).
 *  Agendas have no listing of their own; the Research & action hub links all three kinds. */
export const KIND_LISTING: Record<FeedKind, string> = {
  caseStudies: "/research-and-action/case-studies",
  newsPosts: "/news",
  events: "/collaborate/events",
  livedExperiences: "/lived-experiences",
  researchOutputs: "/research-and-action/research-outputs",
  agendas: "/research-and-action",
};
