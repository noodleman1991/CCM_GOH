/**
 * The Payload half of `lib/content/system.ts`.
 *
 * Five answers — the announcement bar, the CMS half of the sitemap, the two
 * docs-reader reads and the homepage's fresh-content bento — read from Payload
 * instead of Sanity, with the same shapes. `system.ts` picks between this file
 * and its own GROQ through `activeBackend("system")`; the `safe()` wrappers and
 * the deliberate *absence* of one stay in the domain module, so a failure
 * degrades (or propagates) in exactly the same place on either backend.
 *
 * `getSearchIndexRecords` is not here: it is a pure dispatcher onto
 * `case-studies.ts` / `news.ts` / `outputs.ts`, and those move with their own
 * tasks. Routing it through a backend flag would give it an opinion it does not
 * have.
 *
 * ---------------------------------------------------------------------------
 * The moderation filters, one collection at a time
 * ---------------------------------------------------------------------------
 *
 * Six GROQ sites in `system.ts` read Sanity's `status`, which is
 * `moderationStatus` in Payload (the name `status` collides with Payload's own
 * `_status` enum — Phase-2 obligation 1). Five are strict and **one is not**,
 * and the difference is deliberate rather than an inconsistency to tidy up:
 *
 *   caseStudy       status == "approved"                             strict
 *   researchOutput  status == "approved"                             strict
 *   event           status == "approved"                             strict
 *   livedExperience status == "approved" || !defined(status)          loose
 *   newsPost, agenda, page, regionalCommunity*   no filter at all
 *
 * `livedExperience.moderationStatus` is **0 of 56 populated** and the live app
 * treats unset as approved (Phase-2 obligation 10); without the loose arm every
 * real lived experience would vanish from the sitemap and the bento. The other
 * two types carry `defaultValue`s and are fully populated, so a loose arm there
 * would only ever admit a row written around Payload — which is precisely what
 * `payload/access/index.ts` refuses to do in `moderationApprovedOnly`. The same
 * two shapes, under the same two names, are used here.
 *
 * They are re-expressed rather than imported: those exports are Payload
 * `Access` functions (they take a request and may return `true` for an editor),
 * and this seam reads with `overrideAccess: true` by design — see
 * `payload-source.ts`'s own header. What is shared is the rule, and it is
 * written down once, in `MODERATION`.
 *
 * ---------------------------------------------------------------------------
 * Ordering: the tie-break, and why it is `id` ascending
 * ---------------------------------------------------------------------------
 *
 * `getFreshContentRows` orders by `coalesce(publishedAt, publishDate,
 * _createdAt) desc`, and on this dataset that is very nearly not an order at
 * all: 25 of 28 case studies share `2024-01-01T00:00:00Z` and all 29 research
 * outputs share `2024-03-18T00:00:00.000Z`. GROQ breaks the tie by document
 * order and Postgres by row order, so the two backends would pick different —
 * equally valid — representatives, and the parity harness would go blind on
 * every date-ordered surface.
 *
 * Measured against `production_2` on 2026-09-07 (control
 * `count(*[_type=="agenda"])` = 29), at the published perspective, for all four
 * types with their real filters and cap: **`_id` ascending reproduces what
 * Sanity returns today, exactly.** `_id` descending and `_createdAt` ascending
 * both do not — they reorder case studies (`case-study-37, 36, 35…` and
 * `case-study-2, 11, 12…` against today's `case-study-11, 12, 13…`). So the
 * tie-break is `id` ascending, it is now explicit on *both* backends, and
 * adding it changed nothing about what Sanity serves.
 *
 * Compared by code point, not `localeCompare`: that is the order GROQ's
 * `order(_id asc)` uses, and a collation-aware comparison is a different order.
 *
 * ---------------------------------------------------------------------------
 * Two things the sitemap loses, and they are the same thing twice
 * ---------------------------------------------------------------------------
 *
 * Sanity holds one document per language for both `page` (36 = 9 slugs x 4) and
 * `regionalCommunityPage` (28 = 7 slugs x 4); Payload holds one localized
 * document each (9 and 7). Every one of those language documents projects the
 * same `slug.current`, so the sitemap emits the same URL four times over today.
 * Reading Payload emits it once.
 *
 * **The URL set is identical** — verified slug for slug, 9 against 9 and 7
 * against 7 — and what disappears is a duplicate `<loc>` a crawler already
 * collapses. It is recorded here rather than reproduced: emitting a URL four
 * times because the old store happened to hold four rows would be inventing
 * output, and there is no fourth row to read it from.
 */
import "server-only";
import type { CollectionSlug, Where } from "payload";
import { localized } from "@/lib/content/internal/localized";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { blurDataURL, imageUrl } from "@/lib/content/internal/payload-image-source";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import type {
  DocsChapter,
  DocsChapterDetail,
  FreshContentRow,
  SiteAnnouncement,
  SitemapEntry,
} from "@/lib/content/system";

interface Paginated<T> {
  docs: T[];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** GROQ's string ordering: by code point, not by locale collation. This is the
 *  comparison `order(_id asc)` uses, and the tie-break the header measured. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** `order(<date> desc)`: newest first, by instant rather than by string.
 *  Two stores can spell the same instant differently — Sanity keeps what was
 *  authored (`2024-05-10T00:00:00Z`) and Postgres emits milliseconds — and a
 *  lexicographic comparison would order those two spellings by their text. A
 *  row with no date at all sorts last, as GROQ's descending order does. */
function byNewestFirst(a: string | null, b: string | null): number {
  const left = a ? Date.parse(a) : Number.NaN;
  const right = b ? Date.parse(b) : Number.NaN;
  if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
}

/** A Payload `date` column, as the ISO string every `lib/content/` type
 *  declares. Postgres round-trips through `Date`, so a cached read hands back
 *  a string and an uncached one may hand back a `Date`; both become a string
 *  here rather than one of them reaching a caller that will `localeCompare` it. */
function isoDate(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return text(value);
}

// ---------------------------------------------------------------------------
// The moderation rules, written down once
// ---------------------------------------------------------------------------

export type ModerationRule = "approved" | "approved-or-unset" | "none";

export const MODERATION: Record<ModerationRule, Where | null> = {
  approved: { moderationStatus: { equals: "approved" } },
  // The loose arm belongs to `livedExperience` alone. See the header.
  "approved-or-unset": {
    or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
  },
  none: null,
};

function and(...parts: (Where | null | undefined)[]): Where | undefined {
  const kept = parts.filter((part): part is Where => Boolean(part));
  if (kept.length === 0) return undefined;
  return kept.length === 1 ? kept[0] : { and: kept };
}

// ---------------------------------------------------------------------------
// Site announcement
// ---------------------------------------------------------------------------

interface AnnouncementGlobal {
  enabled?: boolean | null;
  variant?: string | null;
  message?: LocalizedRaw;
  dismissible?: boolean | null;
  startsAt?: unknown;
  endsAt?: unknown;
  link?: { url?: string | null; label?: LocalizedRaw } | null;
}

/**
 * The singleton announcement, projected to exactly the seven fields the GROQ
 * names — not the whole global. Payload's `findGlobal` also returns `id`,
 * `createdAt`, `updatedAt` and `globalType`, none of which the Sanity
 * projection has and none of which
 * `components/announcement/site-announcement-bar.tsx` reads.
 *
 * `queryPreviewable`, not `query` — the Sanity twin omits `perspective`, which
 * is what keeps the bar visible in Presentation's draft preview. Swapping in
 * `query` would silently end that, which is one of the six Phase-1 bugs this
 * seam exists to prevent.
 */
export async function getSiteAnnouncement(): Promise<SiteAnnouncement | null> {
  const doc = await queryPreviewable<AnnouncementGlobal | null>({
    type: "global",
    slug: "siteAnnouncement",
    locale: "all",
    depth: 0,
  });
  if (!doc) return null;
  return {
    enabled: doc.enabled ?? undefined,
    variant: text(doc.variant) ?? undefined,
    message: localized(doc.message),
    dismissible: doc.dismissible ?? undefined,
    startsAt: isoDate(doc.startsAt) ?? undefined,
    endsAt: isoDate(doc.endsAt) ?? undefined,
    link: {
      url: text(doc.link?.url) ?? undefined,
      label: localized(doc.link?.label),
    },
  };
}

// ---------------------------------------------------------------------------
// Sitemap
// ---------------------------------------------------------------------------

/**
 * What each `CONTENT_SITEMAP_SPECS` filter names, in Payload.
 *
 * Keyed by the spec's `pathPrefix`, which is what makes a spec unique — the
 * filters are GROQ strings and cannot be matched on. Each entry lists the
 * collections the GROQ's `_type` test admits, because one of them admits two:
 *
 *   `_type == "regionalCommunityPage" || _type == "regionalCommunity" && defined(slug.current)`
 *
 * `&&` binds tighter than `||` in GROQ, and the whole thing sits inside an
 * outer `&& defined(slug.current)`, so it reads as "either type, with a slug"
 * — both collections, not just the page one.
 *
 * `lastModified` names which column carries Sanity's `_updatedAt`. It is
 * `sanityUpdatedAt` everywhere the importer wrote (Payload overwrites its own
 * `updatedAt` on every save, so ordering or stamping by it would report the
 * import date — see `payload/fields/sanity-timestamps.ts`), and `updatedAt` on
 * `events`, the one sitemap collection that carries no imported timestamp
 * because it is not built from a Sanity content document. Zero events are
 * approved in either store, so that arm has never produced a row.
 */
interface SitemapSource {
  collections: CollectionSlug[];
  moderation: ModerationRule;
  lastModified: "sanityUpdatedAt" | "updatedAt";
  /** An extra condition, e.g. organisations shown on the site. */
  where?: Where;
}

const SITEMAP_SOURCES: Record<string, SitemapSource> = {
  "/research-and-action/case-studies": { collections: ["caseStudies"], moderation: "approved", lastModified: "sanityUpdatedAt" },
  "/news": { collections: ["newsPosts"], moderation: "none", lastModified: "sanityUpdatedAt" },
  "/lived-experiences": { collections: ["livedExperiences"], moderation: "approved-or-unset", lastModified: "sanityUpdatedAt" },
  // No agenda or report source: `lib/content/system.ts` dropped both specs
  // (no detail route for either — Decision 11), and a source with no spec
  // would only hide that a dead prefix had crept back in.
  "/research-and-action/research-outputs": { collections: ["researchOutputs"], moderation: "approved", lastModified: "sanityUpdatedAt" },
  "/communities": { collections: ["regionalCommunityPages", "regionalCommunities"], moderation: "none", lastModified: "sanityUpdatedAt" },
  "/collaborate/events": { collections: ["events"], moderation: "approved", lastModified: "updatedAt" },
  "/organizations": { collections: ["organizations"], moderation: "none", lastModified: "updatedAt", where: { showOnSite: { not_equals: false } } },
};

interface SitemapRow {
  slug?: string | null;
  sanityUpdatedAt?: unknown;
  updatedAt?: unknown;
}

/**
 * The `page` doctype's own entries.
 *
 * `order(slug.current)` on the Sanity side; `sort: "slug"` here. Slugs are
 * unique in both stores, so there is no tie to break.
 *
 * `select` deliberately omits `blocks`: the projection reads three fields and
 * `pages` is the collection whose rows are largest by two orders of magnitude.
 */
export async function getPagesSitemapEntries(): Promise<SitemapEntry[]> {
  const result = await queryPreviewable<Paginated<SitemapRow>>({
    type: "find",
    collection: "pages",
    depth: 0,
    pagination: false,
    sort: "slug",
    select: { slug: true, sanityUpdatedAt: true },
  });
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  return (result?.docs ?? []).map((row) => ({
    url: `${base ?? ""}${row.slug === "index" ? "" : `/${String(row.slug)}`}`,
    lastModified: isoDate(row.sanityUpdatedAt) ?? undefined,
    changeFrequency: "daily" as const,
    priority: row.slug === "index" ? 1 : 0.5,
  }));
}

/**
 * The per-locale entries for one content spec.
 *
 * Returns the raw `{slug, lastModified}` rows in the shape the GROQ projects;
 * `system.ts` owns the locale fan-out and the `alternates` map on both
 * backends, so a URL can only ever be built one way.
 *
 * `sort: "id"` is the tie-break the header explains, and it is also what an
 * un-`order`ed GROQ filter already does: document order in Sanity is `_id`
 * ascending. Without it the sitemap's row order would drift between the two
 * backends for no reason a reader could act on.
 */
export async function getContentSitemapRows(pathPrefix: string): Promise<{ slug: string; lastModified: string }[]> {
  const source = SITEMAP_SOURCES[pathPrefix];
  if (!source) {
    throw new Error(
      `No Payload source is declared for the sitemap spec "${pathPrefix}". ` +
        `Add it to SITEMAP_SOURCES rather than letting the spec silently return nothing.`,
    );
  }

  const perCollection = await Promise.all(
    source.collections.map(async (collection) => {
      const result = await queryPreviewable<Paginated<SitemapRow>>({
        type: "find",
        collection,
        depth: 0,
        pagination: false,
        sort: "id",
        where: and(MODERATION[source.moderation], { slug: { exists: true } }, source.where),
        select: { slug: true, [source.lastModified]: true },
      });
      return (result?.docs ?? [])
        .filter((row) => text(row.slug) !== null)
        .map((row) => ({
          slug: String(row.slug),
          lastModified: isoDate(source.lastModified === "updatedAt" ? row.updatedAt : row.sanityUpdatedAt) ?? "",
        }));
    }),
  );
  return perCollection.flat();
}

// ---------------------------------------------------------------------------
// Docs reader
// ---------------------------------------------------------------------------

interface DocsChapterRow {
  slug?: string | null;
  title?: string | null;
  order?: number | null;
  body?: unknown;
}

/**
 * The chapter list. `docsChapter` is the one collection in this migration with
 * no localized fields at all — `title` is a bare string on all 12 documents —
 * so there is no locale to resolve here and none is requested.
 */
export async function getDocsChapters(collection: string): Promise<DocsChapter[]> {
  const result = await query<Paginated<DocsChapterRow>>({
    type: "find",
    collection: "docsChapters",
    depth: 0,
    pagination: false,
    sort: "order",
    where: { collection: { equals: collection } },
    select: { slug: true, title: true, order: true },
  });
  return (result?.docs ?? []).map((row) => ({
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    order: typeof row.order === "number" ? row.order : 0,
  }));
}

/**
 * One chapter's full body.
 *
 * `depth: 2` because the body's embedded images are `upload` relationships to
 * `media`, and `portableText()` needs the media row itself to rebuild Sanity's
 * `asset->{…}` projection — at `depth: 0` it would get an id string and the
 * renderer would drop the figure entirely. 34 such blocks across the 12
 * chapters.
 *
 * GROQ's `[0]` on no match is `null`; a Payload `find` returning no document is
 * the same `null` here, which is what `notFound()` upstream is written for.
 */
export async function getDocsChapter(collection: string, slug: string): Promise<DocsChapterDetail | null> {
  const result = await query<Paginated<DocsChapterRow>>({
    type: "find",
    collection: "docsChapters",
    depth: 2,
    limit: 1,
    pagination: false,
    where: { and: [{ collection: { equals: collection } }, { slug: { equals: slug } }] },
  });
  const row = result?.docs?.[0];
  if (!row) return null;
  return {
    title: String(row.title ?? ""),
    order: typeof row.order === "number" ? row.order : 0,
    body: portableText(row.body),
  };
}

// ---------------------------------------------------------------------------
// Fresh content
// ---------------------------------------------------------------------------

/**
 * What each card-capable type declares, for the one projection that reads
 * across all four.
 *
 * The GROQ coalesces the same four expressions on every type
 * (`coalesce(image.asset->url, coverImage.asset->url)`,
 * `coalesce(excerpt.en, excerpt, description.en, description)`,
 * `coalesce(locationDisplayText, locationText.city, place.text)`,
 * `coalesce(publishedAt, publishDate, _createdAt)`) and lets the arms that name
 * a field the type does not have resolve to null. Payload cannot: a `where` or
 * a `select` naming an undeclared path is an error, not a no-op (verified in
 * Task 6 — `locationCountryCode` on `newsPosts` throws "The following path
 * cannot be queried"). So the arms each type actually has are written down.
 *
 * `livedExperience` has no `image` and no `coverImage`: its `thumbnail` is
 * video-only and the GROQ does not project it, so its cards fall back to the
 * tinted placeholder on both backends. That is today's behaviour, preserved.
 */
interface FreshShape {
  collection: CollectionSlug;
  moderation: ModerationRule;
  /** The image group whose `asset` the GROQ dereferences, if the type has one. */
  image: "image" | "coverImage" | null;
  /** The localized text arms of the excerpt coalesce, in GROQ's order. */
  excerpt: ("excerpt" | "description")[];
  /** The place arms, in GROQ's order. */
  place: ("locationDisplayText" | "locationText.city" | "place.text")[];
  /** The date arms; `createdAt` is always the last resort and is not listed. */
  dates: ("publishedAt" | "publishDate")[];
}

const FRESH_SHAPES: Record<string, FreshShape> = {
  caseStudy: {
    collection: "caseStudies",
    moderation: "approved",
    image: "image",
    excerpt: ["excerpt"],
    place: ["locationDisplayText", "locationText.city"],
    dates: ["publishedAt"],
  },
  livedExperience: {
    collection: "livedExperiences",
    moderation: "approved-or-unset",
    image: null,
    excerpt: ["description"],
    place: ["place.text"],
    dates: ["publishedAt"],
  },
  newsPost: {
    collection: "newsPosts",
    moderation: "none",
    image: "image",
    excerpt: ["excerpt"],
    place: ["place.text"],
    dates: ["publishedAt"],
  },
  researchOutput: {
    collection: "researchOutputs",
    moderation: "approved",
    image: "coverImage",
    excerpt: ["excerpt"],
    place: ["place.text"],
    dates: ["publishDate"],
  },
};

interface FreshRow {
  id?: unknown;
  title?: LocalizedRaw;
  slug?: string | null;
  excerpt?: LocalizedRaw;
  description?: LocalizedRaw;
  image?: unknown;
  coverImage?: unknown;
  locationDisplayText?: string | null;
  locationText?: { city?: string | null } | null;
  place?: { text?: string | null } | null;
  publishedAt?: unknown;
  publishDate?: unknown;
  createdAt?: unknown;
}

/** `coalesce(publishedAt, publishDate, _createdAt)`, computed once so the
 *  ordering and the emitted `date` cannot disagree. */
function effectiveDate(row: FreshRow, shape: FreshShape): string | null {
  for (const field of shape.dates) {
    const value = isoDate(row[field]);
    if (value) return value;
  }
  return isoDate(row.createdAt);
}

function firstPlace(row: FreshRow, shape: FreshShape): string | null {
  for (const field of shape.place) {
    if (field === "locationDisplayText") {
      const value = text(row.locationDisplayText);
      if (value) return value;
    } else if (field === "locationText.city") {
      const value = text(row.locationText?.city);
      if (value) return value;
    } else {
      const value = text(row.place?.text);
      if (value) return value;
    }
  }
  return null;
}

/** `coalesce(excerpt.en, excerpt, description.en, description)` — every arm
 *  that names a field this type has, English first, exactly as GROQ walks it. */
function firstExcerpt(row: FreshRow, shape: FreshShape): string | null {
  for (const field of shape.excerpt) {
    const value = text(localized(row[field])?.en);
    if (value) return value;
  }
  return null;
}

function selectFor(shape: FreshShape): Record<string, true> {
  const select: Record<string, true> = { title: true, slug: true, createdAt: true };
  if (shape.image) select[shape.image] = true;
  for (const field of shape.excerpt) select[field] = true;
  for (const field of shape.place) select[field.split(".")[0]] = true;
  for (const field of shape.dates) select[field] = true;
  return select;
}

/**
 * The newest public content of one type, capped, newest first.
 *
 * One call per type, exactly as the GROQ does, so `system.ts`'s per-type
 * `safe()` still degrades one type without taking the bento down.
 *
 * Ordering and the cap are applied here rather than by Payload: `sort` names
 * one column and no `Where` composes the three-way `coalesce` the GROQ orders
 * by, so a `sort`+`limit` in the database would slice the wrong rows off the
 * wrong order. The cost is bounded and known — 25 case studies, 35 lived
 * experiences, 4 news posts, 29 research outputs.
 */
export async function getFreshContentRowsForType(type: string, cap: number): Promise<FreshContentRow[]> {
  const shape = FRESH_SHAPES[type];
  if (!shape) return [];

  const result = await query<Paginated<FreshRow>>({
    type: "find",
    collection: shape.collection,
    locale: "all",
    // The media row behind `image.asset` carries the url and the lqip.
    depth: 2,
    pagination: false,
    where: and(MODERATION[shape.moderation], { slug: { exists: true } }),
    select: selectFor(shape),
    // Push-down (2026-09-17): every shape has exactly one date arm, so the
    // three-way coalesce the GROQ orders by is two-way here; the database
    // orders and caps, and the JavaScript sort below stays as the createdAt
    // fallback for a row without that date (none admitted today).
    sort: [`-${shape.dates[0]}`, "id"],
    limit: cap,
  });

  return (result?.docs ?? [])
    .map((row) => {
      const image = shape.image ? row[shape.image] : undefined;
      return {
        id: String(row.id ?? ""),
        type,
        title: text(localized(row.title)?.en) ?? "",
        slug: text(row.slug),
        image: imageUrl(image, { width: 800 }) || null,
        imageLqip: blurDataURL(image) ?? null,
        excerpt: firstExcerpt(row, shape),
        place: firstPlace(row, shape),
        date: effectiveDate(row, shape),
      };
    })
    .sort((a, b) => byNewestFirst(a.date, b.date) || byCodePoint(a.id, b.id))
    .slice(0, cap);
}
