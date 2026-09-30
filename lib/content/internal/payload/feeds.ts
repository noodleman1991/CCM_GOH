/**
 * The Content feed's reads (spec §3.2) — one query per kind, turned into the
 * site's shared card shape.
 *
 * Every read goes through `query`, which is cached and published-only: on a
 * collection with drafts it adds `_status: published` itself (see
 * `payload-source.ts`), so a draft never reaches a feed, and the moderation
 * rules come from `MODERATION` in `system.ts`, written down once.
 *
 * Where each kind keeps its community and region is not uniform, and getting
 * it wrong fails silently (an empty feed, not an error):
 *
 * - lived experiences hold their community in `region` — a reference to the
 *   regional community — and never in `relatedCommunity` (0 of 35, see
 *   `page-feeds.ts`), so their region code is `region.region`;
 * - research outputs and agendas link several communities (`relatedCommunities`,
 *   `regionalCommunities`);
 * - events and agendas have no region at all, so a region filter leaves them out.
 */
import "server-only";
import type { CollectionSlug, Where } from "payload";
import type { TypedCardItem, TypedCardType } from "@/lib/cards/type-style";
import type { FeedCard, FeedContext, FeedFilters, FeedKind, FeedPick } from "@/lib/content/feeds/types";
import { localized, type LocalizedRaw } from "@/lib/content/internal/localized";
import { blurDataURL, imageUrl } from "@/lib/content/internal/payload-image-source";
import { query } from "@/lib/content/internal/payload-source";
import { MODERATION, type ModerationRule } from "@/lib/content/internal/payload/system";

interface KindConfig {
  collection: CollectionSlug;
  card: TypedCardType;
  href: (slug: string) => string;
  moderation: ModerationRule;
  /** The date that orders it: a publish date, or an event's start. */
  date: "publishedAt" | "publishDate" | "startAt";
  featured: boolean;
  /** The Where path for a region code, or `null` for a kind with no region. */
  region: string | null;
  community: string;
  tags: string | null;
  /** The Where path to the organisations it's linked to, or `null` when it has none. */
  organizations: string | null;
  image: "image" | "coverImage" | null;
  excerpt: "excerpt" | "description";
  place: "locationDisplayText" | "place.text" | null;
}

const KINDS: Record<FeedKind, KindConfig> = {
  caseStudies: {
    collection: "caseStudies",
    card: "caseStudy",
    href: (s) => `/research-and-action/case-studies/${s}`,
    moderation: "approved",
    date: "publishedAt",
    featured: true,
    region: "region",
    community: "relatedCommunity",
    tags: "tags",
    organizations: "organizations",
    image: "image",
    excerpt: "excerpt",
    place: "locationDisplayText",
  },
  newsPosts: {
    collection: "newsPosts",
    card: "newsPost",
    href: (s) => `/news/${s}`,
    moderation: "none",
    date: "publishedAt",
    featured: true,
    region: "region",
    community: "relatedCommunity",
    tags: "tags",
    organizations: "organizations",
    image: "image",
    excerpt: "excerpt",
    place: "place.text",
  },
  livedExperiences: {
    collection: "livedExperiences",
    card: "livedExperience",
    href: (s) => `/lived-experiences/${s}`,
    moderation: "approved-or-unset",
    date: "publishedAt",
    featured: true,
    region: "region.region",
    community: "region",
    tags: "tags",
    organizations: "organizations",
    // Its `thumbnail` is video-only; cards use the tinted placeholder, as the homepage does.
    image: null,
    excerpt: "description",
    place: "place.text",
  },
  researchOutputs: {
    collection: "researchOutputs",
    card: "researchOutput",
    href: (s) => `/research-and-action/research-outputs/${s}`,
    moderation: "approved",
    date: "publishDate",
    featured: true,
    region: "region",
    community: "relatedCommunities",
    tags: "tags",
    organizations: "organizations",
    image: "coverImage",
    excerpt: "excerpt",
    place: "place.text",
  },
  events: {
    collection: "events",
    card: "event",
    href: (s) => `/collaborate/events/${s}`,
    moderation: "approved",
    date: "startAt",
    featured: false,
    region: null,
    community: "relatedCommunity",
    tags: null,
    organizations: null,
    image: "coverImage",
    excerpt: "description",
    place: "place.text",
  },
  agendas: {
    collection: "agendas",
    card: "agenda",
    // Agendas have no page of their own; they are downloads listed from the hub.
    href: () => `/research-and-action`,
    moderation: "none",
    date: "publishDate",
    featured: true,
    region: null,
    community: "regionalCommunities",
    tags: "tags",
    organizations: "organizations",
    image: "coverImage",
    excerpt: "description",
    place: null,
  },
};

type Row = Record<string, unknown>;

function and(...parts: (Where | null | undefined)[]): Where {
  const kept = parts.filter((part): part is Where => Boolean(part));
  return kept.length === 1 ? kept[0] : { and: kept };
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return text(value);
}

/** A localized value in the page's language, then English, then a plain string. */
function inLocale(value: unknown, locale: FeedContext["locale"]): string | null {
  const arms = localized(value as LocalizedRaw);
  return text(arms?.[locale]) ?? text(arms?.en) ?? text(value);
}

function pathValue(row: Row, path: string): unknown {
  return path.split(".").reduce<unknown>((at, key) => (at && typeof at === "object" ? (at as Row)[key] : undefined), row);
}

/** Moderation + a slug to link to: the conditions every read shares. */
function baseWhere(config: KindConfig): Where {
  return and(MODERATION[config.moderation], { slug: { exists: true } });
}

/** The automatic query's filters, or `null` when this kind can't match them. */
function filterWhere(kind: FeedKind, filters: FeedFilters, ctx: FeedContext): Where | null {
  const config = KINDS[kind];
  const parts: Where[] = [baseWhere(config)];
  if (filters.regions.length > 0) {
    // A region matches on the item's own region OR its community's region, so
    // kinds that only link a community (events, agendas) aren't dropped.
    const paths = [...new Set([config.region, `${config.community}.region`].filter((p): p is string => Boolean(p)))];
    parts.push(paths.length === 1 ? { [paths[0]]: { in: filters.regions } } : { or: paths.map((p) => ({ [p]: { in: filters.regions } })) });
  }
  const communities = filters.communityIds.length > 0 ? filters.communityIds : ctx.communityId ? [ctx.communityId] : [];
  if (communities.length > 0) parts.push({ [config.community]: { in: communities } });
  if (filters.tagIds.length > 0) {
    if (!config.tags) return null;
    parts.push({ [config.tags]: { in: filters.tagIds } });
  }
  if (filters.audienceTagIds.length > 0) {
    if (!config.tags) return null;
    parts.push({ [config.tags]: { in: filters.audienceTagIds } });
  }
  if (filters.organizationIds.length > 0) {
    if (!config.organizations) return null;
    parts.push({ [config.organizations]: { in: filters.organizationIds } });
  }
  if (filters.featuredOnly) {
    if (!config.featured) return null;
    parts.push({ featured: { equals: true } });
  }
  if (filters.upcomingOnly && kind === "events") {
    parts.push({ startAt: { greater_than_equal: (ctx.now ?? new Date()).toISOString() } });
  }
  return and(...parts);
}

/** An agenda's own document (its first file), so its card opens the agenda
 *  itself; agendas have no page. Public agendas only; only web or site addresses. */
function agendaDocument(row: Row): string | null {
  // Registered-only and members-only agendas keep their gated download buttons on the hub.
  if (row.accessLevel && row.accessLevel !== "public") return null;
  const files = Array.isArray(row.files) ? row.files : [];
  const first = files[0] && typeof files[0] === "object" ? (files[0] as Row).file : null;
  const url = first && typeof first === "object" ? text((first as Row).url) : null;
  return url && (/^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//"))) ? url : null;
}

function toCard(kind: FeedKind, row: Row, locale: FeedContext["locale"]): FeedCard | null {
  const config = KINDS[kind];
  const id = text(row.id) ?? (typeof row.id === "number" ? String(row.id) : null);
  const slug = text(row.slug);
  if (!id || !slug) return null;
  const image = config.image ? row[config.image] : undefined;
  const when = isoDate(row[config.date]);
  const isEvent = kind === "events";
  const card: TypedCardItem = {
    type: config.card,
    id,
    title: inLocale(row.title, locale) ?? "",
    href: (kind === "agendas" ? agendaDocument(row) : null) ?? config.href(slug),
    excerpt: inLocale(row[config.excerpt], locale),
    image: image ? imageUrl(image, { width: 800 }) || null : null,
    imageLqip: image ? (blurDataURL(image) ?? null) : null,
    place: config.place ? text(pathValue(row, config.place)) : null,
    date: when,
    ...(isEvent ? { event: { startAt: when } } : {}),
    ...(kind === "livedExperiences" ? { quote: true } : {}),
  };
  return { key: `${kind}:${id}`, kind, featured: row.featured === true, date: isEvent ? null : when, startAt: isEvent ? when : null, card };
}

async function find(kind: FeedKind, where: Where, limit: number): Promise<Row[]> {
  const config = KINDS[kind];
  try {
    const result = await query<{ docs?: Row[] }>({
      type: "find",
      collection: config.collection,
      locale: "all",
      depth: 1,
      pagination: false,
      where,
      sort: [`-${config.date}`, "id"],
      limit,
    });
    return result?.docs ?? [];
  } catch (error) {
    // One kind failing leaves the rest of the feed standing.
    console.error(`[content-feed] ${config.collection} read failed`, error);
    return [];
  }
}

/** The newest matching items of each kind, `limit` per kind. */
export async function fetchFeedCards(kinds: FeedKind[], filters: FeedFilters, ctx: FeedContext, limit: number): Promise<FeedCard[]> {
  const perKind = await Promise.all(
    kinds.map(async (kind) => {
      const where = filterWhere(kind, filters, ctx);
      if (!where) return [];
      const rows = await find(kind, where, limit);
      return rows.map((row) => toCard(kind, row, ctx.locale)).filter((card): card is FeedCard => card !== null);
    }),
  );
  return perKind.flat();
}

/** The picked items that are still public, keyed `kind:id`. A pick that is
 *  unpublished, deleted or not approved is simply absent. */
export async function fetchPickedCards(picks: FeedPick[], ctx: FeedContext): Promise<Map<string, FeedCard>> {
  const byKind = new Map<FeedKind, string[]>();
  for (const pick of picks) byKind.set(pick.kind, [...(byKind.get(pick.kind) ?? []), pick.id]);
  const found = await Promise.all(
    [...byKind].map(async ([kind, ids]) => {
      const rows = await find(kind, and(baseWhere(KINDS[kind]), { id: { in: ids } }), ids.length);
      return rows.map((row) => toCard(kind, row, ctx.locale)).filter((card): card is FeedCard => card !== null);
    }),
  );
  return new Map(found.flat().map((card) => [card.key, card]));
}
