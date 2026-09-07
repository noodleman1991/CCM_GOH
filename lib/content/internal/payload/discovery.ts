/**
 * `lib/content/discovery.ts`, answered from Payload.
 *
 * Nineteen callable exports over seven Payload collections and one global, and
 * the module carries more read primitives than any other in the layer: **five
 * `queryLive` sites, two `queryRaw` sites**, `createDocument` ×2 and
 * `updateDocument`. `queryLive` and `queryRaw` return the same shape, so a
 * reader that picks the wrong one is invisible to a result-based test — which
 * is exactly how the Phase-1 authorization bypass happened. Every one of the
 * seven is asserted by descriptor in `lib/__tests__/content-discovery.test.ts`,
 * which mocks `payload-source` rather than this file so the real reader runs.
 *
 * ---------------------------------------------------------------------------
 * 1. The cross-type union excludes an entire content type, and that is
 *    REPRODUCED, not fixed
 * ---------------------------------------------------------------------------
 *
 * `discovery.ts:366` asks for
 *
 *   *[_type in ["caseStudy", "livedExperience", "newsPost"]
 *      && (status == "approved" || (!defined(status) && _type == "newsPost"))
 *      && defined(slug.current) && …]
 *
 * Measured on the **published** perspective, which is what `query()` reads
 * (control `count(*[_type=="agenda"])` = 29 on every query): **29 rows — 25
 * `caseStudy`, 4 `newsPost`, ZERO `livedExperience`**, while 35 lived
 * experiences have slugs. The cause is that `livedExperience.status` is
 * **0/56 populated** and the unset-status branch is restricted to `newsPost`,
 * so no lived experience can ever satisfy the predicate. "For You" has
 * silently never included that type. **That is a pre-existing production
 * defect, not one the swap introduces.**
 *
 * Payload has no cross-collection query, so this becomes three reads merged.
 * The obvious way to write it is with the collection's own access helper,
 * `publishedAndApproved`, which applies exists-or-approved to
 * `livedExperiences` — and would suddenly admit all 35 into a recommendation
 * surface that has never shown one. That is user-visible and is not an
 * implementer's call. So the predicate is translated **literally, per
 * collection**:
 *
 *   caseStudies       moderationStatus == "approved"
 *   newsPosts         no `moderationStatus` field exists at all, so
 *                     `!defined(status) && _type == "newsPost"` is true for
 *                     every row — all four match, exactly as measured
 *   livedExperiences  moderationStatus == "approved"  ← the unset branch does
 *                     NOT apply here, because the GROQ restricts it to
 *                     newsPost. 0 rows today, and if an editor ever sets one
 *                     to approved BOTH backends admit it, which is the point:
 *                     hard-coding "skip lived experiences" would make the two
 *                     stores disagree the first time the field is used.
 *
 * The defect is reported to the user for a decision; it is not fixed here.
 *
 * ---------------------------------------------------------------------------
 * 2. The merge is ordered as one list, not concatenated per type
 * ---------------------------------------------------------------------------
 *
 * `order(coalesce(publishedAt, publishDate, _createdAt) desc)`. Measured: four
 * news posts on four distinct dates, then **25 case studies all tied at
 * `2024-01-01T00:00:00Z`**, and that tie comes back in `_id` **ascending**
 * code-point order (`case-study-11, -12, -13, -14, -15, -19, -2, -20, …`) —
 * the same tie-break Task 12 measured for `case-studies.ts` and applied to
 * both backends. Three per-collection reads concatenated type-by-type would
 * have identical membership and the wrong order, so they are merged first and
 * sorted once.
 *
 * ---------------------------------------------------------------------------
 * 3. `order(<an object> asc)` is a no-op in GROQ, and two reads depend on it
 * ---------------------------------------------------------------------------
 *
 * `getDiscoveryOptions` sorts regions by `order(name asc)` and tags by
 * `order(value asc)` — but `regionalCommunity.name` is a locale map and
 * `tag.value` is a slug object, and GROQ cannot order by either. Measured: the
 * returned sequence is **exactly `_id` ascending** for both (verified
 * programmatically against `order(_id asc)` on all 67 tags and all 7
 * communities; the regions only *look* alphabetical because their ids are).
 * So the Payload arm sorts by `id asc`, not by the name or the value.
 *
 * ---------------------------------------------------------------------------
 * 4. `status` is `moderationStatus`, in both directions
 * ---------------------------------------------------------------------------
 *
 * Six `status == "approved"` event filters live in this module, and
 * `payload/collections/events.ts` renames the field for the same enum-collision
 * reason as case studies and lived experiences. `event.moderationStatus` is
 * **strict**-approved (`moderationApprovedOnly`), unlike `livedExperiences`'
 * exists-or-approved: none of the six GROQ filters admits an unset status.
 *
 * The write direction is the one that gets forgotten, and Task 12 measured why
 * it matters: **Payload drops an unknown data key silently**, so writing
 * `status` would make a submission look successful while leaving the document
 * in whatever state it was already in. Every Payload field name in this file is
 * therefore set **inside** the reader; no caller hands one in.
 *
 * ---------------------------------------------------------------------------
 * 5. Events are 0 documents in both stores, and their title is shaped
 *    differently
 * ---------------------------------------------------------------------------
 *
 * `count(*[_type=="event"])` is 0 on the published perspective and
 * `payload.count({collection:"events"})` is 0. Nothing here is exercised by
 * data today — which is precisely why it is written from the schemas rather
 * than from observation.
 *
 * Sanity declares `event.title` and `event.description` as plain strings;
 * Payload declares both localized (its collection header says the localized
 * wrapper "captures both shapes"). `ContentEvent.title` is `string | null`, so
 * a read collapses the locale map onto its `en` arm and a write puts the
 * caller's string in `en`. `slug` is a Sanity slug object and a Payload text
 * column; the GROQ always projects `"slug": slug.current`, so both arms hand
 * back a bare string.
 *
 * ---------------------------------------------------------------------------
 * 6. `ContentTag.value` is a flat string here, as it is in every Payload reader
 * ---------------------------------------------------------------------------
 *
 * Seven projections in this module bind a bare `value` inside `tags[]->{…}`.
 * In Sanity that returns `{_type:"slug", current:"climate-change"}` — the lie
 * behind `ContentTag.value`'s `string` declaration (plan, "the declaration is
 * Task 6's, the violations are Tasks 10 and 11's"). Payload stores a flat text
 * column, and `payload/news.ts` and `payload/outputs.ts` already emit the flat
 * string. This file does the same rather than reconstructing a slug object no
 * Payload row has. `DiscoveryTagOption.value` gets the same treatment.
 *
 * ---------------------------------------------------------------------------
 * 7. Four things this reader answers with `null` on purpose
 * ---------------------------------------------------------------------------
 *
 * - **`newsPost.language`** — not modelled in Payload, deliberately (Task 10,
 *   `payload/collections/news-posts.ts`). `NEWS_POST_BLOCK_FIELDS` names it, so
 *   it is emitted as `null`; Sanity returns `"en"` on 3 of 4 posts. Nothing
 *   renders it, and the block has no route at all (see below).
 * - **`author.bio`** — Portable Text on 2 of 95 authors, preserved in the
 *   archive only (Phase-2 obligation 9). 0/4 on the authors these posts use.
 * - **`caption`** on the image group — projected by the GROQ, declared by
 *   neither schema, `null` on every document in both stores.
 * - **`excerpt` on a lived experience** — `fetchDynamicLivedExperiences`
 *   projects it and `livedExperience` has no such field, in either store.
 *
 * ---------------------------------------------------------------------------
 * 8. Cross-collection id lookups
 * ---------------------------------------------------------------------------
 *
 * `getDocSlugs`, `getOutputSummaries` and `getOutputStatuses` are given
 * `CollaborationOutput.sanityId` values and ask `*[_id in $ids]` with **no type
 * filter**. Payload addresses a document by `(collection, id)`, so the same
 * question is asked of the four collections a workspace output can actually be
 * — `lib/collaboration/outputs.ts`'s `OUTPUT_TYPES` is exactly
 * `caseStudy | event | livedExperience | researchOutput`, and
 * `addOutput` refuses anything else through `isOutputType`.
 *
 * `getOutputStatuses` additionally matches `("drafts." + _id) in $ids`, because
 * its caller passes `sanityId` unstripped. Payload has no `drafts.`-prefixed
 * ids — a draft is a version of the same id — so that clause collapses into
 * "strip the prefix off each input id and match on the remainder", and the
 * returned `_id` stays unprefixed, which is what both callers look up by.
 */
import {
  createDocument,
  query,
  queryLive,
  queryRaw,
  updateDocument,
  type PayloadFindQuery,
} from "@/lib/content/internal/payload-source";
import {
  altString,
  assetShape,
  imageGroup,
  mediaOf,
} from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import { safe } from "@/lib/content/internal/safe";
import { generateEventSlug } from "@/lib/validation/event";
import { isRegionCode } from "@/lib/maps/region-codes";
import type {
  AllPostsMode,
  CommentTarget,
  ContentEvent,
  DiscoveryItem,
  DiscoveryRegionOption,
  DiscoveryTagOption,
  DynamicOptions,
  DynamicTemplateFetchOptions,
  EventFilter,
  EventInput,
  EventRsvpMeta,
  ForYouCandidateRow,
  ModerationSettings,
  NewsPostBlockItem,
  RawEditableEventDoc,
  UpcomingReminderEvent,
} from "@/lib/content/discovery";
import type { ContentKind } from "@/lib/content/types";
import type { CommentTargetType } from "@/generated/prisma";
import type { CollectionSlug, Where } from "payload";

// ---------------------------------------------------------------------------
// Shared shapes and primitives
// ---------------------------------------------------------------------------

interface Paginated<T> {
  docs: T[];
}

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** A Payload `date` column as the ISO string `lib/content/` declares. Payload
 *  always spells a whole second `…:00.000Z`; Sanity stores `…:00Z`. */
function isoDate(value: unknown): string | undefined {
  const raw = value instanceof Date ? value.toISOString() : text(value);
  return raw?.replace(/\.000Z$/, "Z");
}

/** A `dateOnly` field — `studyPeriod.startDate`/`endDate`. */
function isoDay(value: unknown): string | undefined {
  const raw = value instanceof Date ? value.toISOString() : text(value);
  return raw?.slice(0, 10);
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** `order(<date> desc)`, compared by instant rather than by string — the two
 *  stores spell the same instant differently. A row with no date sorts last,
 *  which is where GROQ's descending order puts it. */
function byNewestFirst(a: string | undefined, b: string | undefined): number {
  const left = a ? Date.parse(a) : Number.NaN;
  const right = b ? Date.parse(b) : Number.NaN;
  if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
}

/** An unset Payload container, as the `null` GROQ projects for it. */
function listOrNull<T>(rows: T[]): T[] | null {
  return rows.length > 0 ? rows : null;
}

function and(...parts: (Where | null | undefined)[]): Where | undefined {
  const kept = parts.filter((part): part is Where => Boolean(part));
  if (kept.length === 0) return undefined;
  return kept.length === 1 ? kept[0] : { and: kept };
}

/** A Payload row's own id, as the string `_id` every projection emits.
 *  Named `docId` rather than `id` because half this module's functions take a
 *  parameter called `id` and a shadowed helper is a silent wrong answer. */
function docId(row: Row): string {
  return String(row.id ?? "");
}

/** Sanity's `slug` field, as the object a bare `slug` projection returns. */
function slugObject(value: unknown): Row | null {
  const slug = text(value);
  return slug ? groqObject({ _type: "slug", current: slug }) : null;
}

/** A Payload `point` column (`[lng, lat]`) as Sanity's geopoint. */
function geopoint(value: unknown): Row | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const [lng, lat] = value;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  return groqObject({ _type: "geopoint", lat, lng });
}

/** The one arm a Sanity plain-string field has, read out of Payload's locale
 *  map. `fallback: true` means `en` is populated whenever anything is. */
function enArm(value: unknown): string | undefined {
  return localized(value as LocalizedRaw)?.en;
}

const APPROVED: Where = { moderationStatus: { equals: "approved" } };

/** `status == "approved" || !defined(status)` — the loose rule, correct for
 *  `livedExperiences` and for nothing else in this module. */
const APPROVED_OR_UNSET: Where = {
  or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
};

// ---------------------------------------------------------------------------
// Sub-projections
// ---------------------------------------------------------------------------

/**
 * `image{ asset->{_id, url, [mimeType,] metadata{lqip, dimensions{…}}}, alt[, caption] }`.
 *
 * The shape, the flattened media row emitted beside it and the reason both are
 * emitted at once all live in `internal/image-shape.ts`.
 */
function imageProjection(
  group: unknown,
  opts: { mimeType?: boolean; caption?: boolean } = {},
): Row | null {
  return imageGroup(group, {
    asset: opts.mimeType
      ? ["_id", "url", "mimeType", "lqip", "dimensions"]
      : ["_id", "url", "lqip", "dimensions"],
    keys: opts.caption ? ["alt", "caption"] : ["alt"],
  });
}

/** `coverImage{ asset->{ url } }` — the narrowest asset projection in the
 *  module, and the only one that names neither `_id` nor `metadata`. It never
 *  reaches `imageUrl()`, so no flattened media row is emitted. */
function coverImageProjection(group: unknown): Row | null {
  if (!isRow(group)) return null;
  const media = mediaOf(group);
  return { asset: media ? assetShape(media, ["url"]) : null };
}

interface TagRow {
  id?: unknown;
  label?: LocalizedRaw;
  value?: string | null;
  color?: string | null;
  category?: string | null;
}

/**
 * `tags[]->{…}`. `fields` names the keys the caller's GROQ actually projects —
 * a key a projection does not name must be absent, not null.
 *
 * `value` is the flat Payload string, not a reconstructed slug object. See
 * note 6 in the header.
 */
function tagProjection(rows: unknown, fields: readonly string[]): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const tags = rows.filter(isRow).map((raw) => {
    const tag = raw as TagRow;
    const all: Row = {
      _id: String(tag.id ?? ""),
      label: orNull(localized(tag.label)),
      value: orNull(text(tag.value)),
      color: orNull(text(tag.color)),
      category: orNull(text(tag.category)),
    };
    return groqObject(Object.fromEntries(fields.map((field) => [field, all[field]])));
  });
  return listOrNull(tags);
}

const CARD_TAG_FIELDS = ["_id", "label", "value", "color"] as const;
const BLOCK_TAG_FIELDS = ["_id", "label", "value", "color", "category"] as const;

interface AuthorRow {
  id?: unknown;
  name?: string | null;
  slug?: string | null;
  image?: unknown;
}

/** `author->{ name, slug }` — the dynamic-insert author, two keys only. */
function cardAuthorProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const author = row as AuthorRow;
  return groqObject({ name: orNull(text(author.name)), slug: slugObject(author.slug) });
}

/** `author->{ _id, name, image, bio }` — the all-posts block's author.
 *  `image` is projected RAW (not dereferenced) by the GROQ and is 0/4
 *  populated; `bio` is not modelled (note 7). */
function blockAuthorProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const author = row as AuthorRow;
  return groqObject({
    _id: docId(author as Row),
    name: orNull(text(author.name)),
    image: imageProjection(author.image),
    bio: null,
  });
}

interface OrganizationRow {
  id?: unknown;
  name?: string | null;
  slug?: string | null;
  acronym?: string | null;
  logo?: unknown;
}

/** `affiliation->{ name, slug }` — the case-study card's affiliation. */
function affiliationProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const org = row as OrganizationRow;
  return groqObject({ name: orNull(text(org.name)), slug: slugObject(org.slug) });
}

/** `authors[]{ name, affiliation->{name, slug} }` — note the missing `->`:
 *  `authors` is an inline array on the document, not a reference list. */
function cardAuthorsProjection(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const authors = rows.filter(isRow).map((row) =>
    groqObject({
      name: orNull(text(row.name)),
      affiliation: affiliationProjection(row.affiliation),
    }),
  );
  return listOrNull(authors);
}

/** `organizations[]->{ _id, name, slug, acronym[, logo{asset->{_id,url},alt}] }` */
function organizationsProjection(rows: unknown, opts: { logo: boolean }): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const orgs = rows.filter(isRow).map((raw) => {
    const org = raw as OrganizationRow;
    const projected: Row = {
      _id: docId(org as Row),
      name: orNull(text(org.name)),
      slug: slugObject(org.slug),
      acronym: orNull(text(org.acronym)),
    };
    if (opts.logo) {
      const logo = isRow(org.logo) ? org.logo : undefined;
      const logoMedia = mediaOf(logo);
      projected.logo = logo
        ? groqObject({
            asset: logoMedia ? assetShape(logoMedia, ["_id", "url"]) : null,
            alt: orNull(altString(logo.alt)),
          })
        : null;
    }
    return groqObject(projected);
  });
  return listOrNull(orgs);
}

/** `relatedCommunity->{ _id, name, slug }`. */
function communityProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  return groqObject({
    _id: docId(row),
    name: orNull(localized(row.name as LocalizedRaw)),
    slug: slugObject(row.slug),
  });
}

/** A populated relationship's own id, however deep Payload returned it. */
function relationSlug(value: unknown): string | undefined {
  return isRow(value) ? text(value.slug) : undefined;
}

// ---------------------------------------------------------------------------
// Dynamic content inserts
// ---------------------------------------------------------------------------

/** Relationship population depth. Two, because the case-study card reaches
 *  `authors[].affiliation` and every card reaches `image.asset`. */
const DEPTH = 2;

function newsCardProjection(row: Row, featured: boolean): DiscoveryItem {
  const projected: Row = {
    _id: docId(row),
    author: cardAuthorProjection(row.author),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    image: imageProjection(row.image),
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: slugObject(row.slug),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    title: orNull(localized(row.title as LocalizedRaw)),
  };
  if (featured) projected.featured = row.featured ?? null;
  return groqObject(projected) as unknown as DiscoveryItem;
}

function caseStudyCardProjection(row: Row, featured: boolean): DiscoveryItem {
  const projected: Row = {
    _id: docId(row),
    authors: cardAuthorsProjection(row.authors),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    image: imageProjection(row.image),
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: slugObject(row.slug),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    title: orNull(localized(row.title as LocalizedRaw)),
  };
  if (featured) projected.featured = row.featured ?? null;
  return groqObject(projected) as unknown as DiscoveryItem;
}

function livedExperienceCardProjection(row: Row, featured: boolean): DiscoveryItem {
  const projected: Row = {
    _id: docId(row),
    author: cardAuthorProjection(row.author),
    description: orNull(localized(row.description as LocalizedRaw)),
    duration: orNull(text(row.duration)),
    issue: orNull(localized(row.issue as LocalizedRaw)),
    personContext: orNull(localized(row.personContext as LocalizedRaw)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: slugObject(row.slug),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    thumbnail: imageProjection(row.thumbnail),
    title: orNull(localized(row.title as LocalizedRaw)),
    videoLink: orNull(text(row.videoLink)),
  };
  if (featured) projected.featured = row.featured ?? null;
  return groqObject(projected) as unknown as DiscoveryItem;
}

/** `order(publishedAt desc)` or `order(featured desc, publishedAt desc)`, with
 *  the `_id asc` tie-break both backends now carry. Measured: GROQ's
 *  `featured desc` puts `true` first and orders `false` with `null`. */
function sortCards(rows: Row[], mode: "recent" | "featured"): Row[] {
  return [...rows].sort((a, b) => {
    if (mode === "featured") {
      const byFeatured = Number(b.featured === true) - Number(a.featured === true);
      if (byFeatured !== 0) return byFeatured;
    }
    const byDate = byNewestFirst(isoDate(a.publishedAt), isoDate(b.publishedAt));
    if (byDate !== 0) return byDate;
    return byCodePoint(docId(a), docId(b));
  });
}

/** The three (kind → collection, where, projection) triples the dynamic-insert
 *  queries name. `region`/`researchOutput`/`agenda` have no dynamic-insert
 *  query at all and resolve to `[]` in `discovery.ts` before reaching here. */
const DYNAMIC_KINDS: Partial<
  Record<
    ContentKind,
    {
      collection: CollectionSlug;
      where: (communitySlug: string) => Where;
      project: (row: Row, featured: boolean) => DiscoveryItem;
    }
  >
> = {
  newsPost: {
    collection: "newsPosts",
    where: (communitySlug) => ({ "relatedCommunity.slug": { equals: communitySlug } }),
    project: newsCardProjection,
  },
  caseStudy: {
    collection: "caseStudies",
    // `references(*[_type == "regionalCommunity" && slug.current == $s][0]._id)`.
    // Measured across all 7 communities: `references(rc)` and
    // `relatedCommunity._ref == rc` return the same count on every one, and 0
    // approved case studies reference a community by any other field.
    where: (communitySlug) => ({ and: [APPROVED, { "relatedCommunity.slug": { equals: communitySlug } }] }),
    project: caseStudyCardProjection,
  },
  livedExperience: {
    collection: "livedExperiences",
    // Here the unset-status branch DOES apply — this GROQ writes
    // `(status == "approved" || !defined(status))` with no type restriction,
    // unlike the "For You" union. Measured: `relatedCommunity` is 0/35 on
    // published lived experiences, so this returns [] on today's data either
    // way.
    where: (communitySlug) => ({
      and: [APPROVED_OR_UNSET, { "relatedCommunity.slug": { equals: communitySlug } }],
    }),
    project: livedExperienceCardProjection,
  },
};

export async function getDynamicContent(
  kind: ContentKind,
  options: DynamicOptions,
): Promise<DiscoveryItem[]> {
  const spec = DYNAMIC_KINDS[kind];
  if (!spec) return [];
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: spec.collection,
    where: spec.where(options.communitySlug),
    pagination: false,
    locale: "all",
    depth: DEPTH,
  });
  const featured = options.mode === "featured";
  return sortCards(result.docs, options.mode)
    .slice(0, options.count)
    .map((row) => spec.project(row, featured));
}

// ---------------------------------------------------------------------------
// Discovery filter options
// ---------------------------------------------------------------------------

/**
 * `*[_type == "regionalCommunity" && defined(slug.current)] | order(name asc){ "slug": slug.current, name }`
 *
 * `order(name asc)` sorts by a locale map, which GROQ cannot do; measured, the
 * result is `_id` ascending. See note 3.
 */
export async function getDiscoveryRegions(): Promise<DiscoveryRegionOption[]> {
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "regionalCommunities",
    where: { slug: { exists: true } },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(docId(a), docId(b)))
    .map((row) =>
      groqObject({
        slug: orNull(text(row.slug)),
        name: orNull(localized(row.name as LocalizedRaw)),
      }),
    ) as unknown as DiscoveryRegionOption[];
}

/**
 * `*[_type == "tag" && defined(value)] | order(value asc){ value, label }`
 *
 * Same `_id`-ascending fallback, and `value` is the flat Payload string rather
 * than the slug object Sanity returns (note 6).
 */
export async function getDiscoveryTags(): Promise<DiscoveryTagOption[]> {
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "tags",
    where: { value: { exists: true } },
    pagination: false,
    locale: "all",
    depth: 0,
  });
  return [...result.docs]
    .sort((a, b) => byCodePoint(docId(a), docId(b)))
    .map((row) =>
      groqObject({
        value: orNull(text(row.value)),
        label: orNull(localized(row.label as LocalizedRaw)),
      }),
    ) as unknown as DiscoveryTagOption[];
}

// ---------------------------------------------------------------------------
// "For you" candidates — the cross-type union
// ---------------------------------------------------------------------------

interface UnionArm {
  collection: CollectionSlug;
  /** The moderation half of the union's predicate, for THIS collection.
   *  `null` means the collection has no moderation field, so the
   *  `!defined(status)` branch admits every row. */
  moderation: Where | null;
  /** Sanity's `_type`, which `lib/follows/for-you.ts` dispatches its hrefs on. */
  type: string;
  /** `region` is a select on two of the three and a `regionalCommunities`
   *  reference on the third (Phase-2 obligation 10). */
  regionIsReference: boolean;
}

/**
 * The union's three arms. See note 1 in the header for why
 * `livedExperiences` carries `APPROVED` rather than `APPROVED_OR_UNSET`, and
 * why that is a faithful reproduction rather than a fix.
 */
const FOR_YOU_ARMS: UnionArm[] = [
  { collection: "caseStudies", moderation: APPROVED, type: "caseStudy", regionIsReference: false },
  { collection: "livedExperiences", moderation: APPROVED, type: "livedExperience", regionIsReference: true },
  { collection: "newsPosts", moderation: null, type: "newsPost", regionIsReference: false },
];

export async function getForYouCandidates(input: {
  regionCodes: string[];
  regionSlugs: string[];
  themeSlugs: string[];
  limit: number;
}): Promise<ForYouCandidateRow[]> {
  const arms = await Promise.all(
    FOR_YOU_ARMS.map(async (arm) => {
      // The OR of the three follow filters. An empty list must match nothing,
      // which is what GROQ's `x in []` does — Payload's `in` with an empty
      // array is the same, but the clause is dropped so the query stays a
      // plain disjunction rather than an always-false one.
      const matches: Where[] = [];
      // `region` is a Postgres ENUM in Payload and a plain string in Sanity, so
      // a value outside the fixed seven THROWS here where GROQ's `in` merely
      // fails to match. Measured: `select … "region" in ('esa')` dies with
      // `invalid input value for enum enum_case_studies_region`. Today's only
      // caller derives the codes through `slugToShortCode`, which returns
      // `RegionCode | null`, so nothing invalid can arrive — but an unfiltered
      // list would turn a working "For You" into an empty one on Payload only
      // (`getForYouCandidates` is not wrapped in `safe()`; its caller degrades
      // to []). Filtering keeps the two backends answering the same thing.
      const regionCodes = input.regionCodes.filter(isRegionCode);
      if (regionCodes.length > 0 && !arm.regionIsReference) {
        matches.push({ region: { in: regionCodes } });
      }
      if (input.regionSlugs.length > 0) {
        matches.push({ "relatedCommunity.slug": { in: input.regionSlugs } });
      }
      if (input.themeSlugs.length > 0) {
        matches.push({ "tags.value": { in: input.themeSlugs } });
      }
      if (matches.length === 0) return [];

      const result = await query<Paginated<Row>>({
        type: "find",
        collection: arm.collection,
        where: and(arm.moderation, { slug: { exists: true } }, { or: matches }),
        pagination: false,
        locale: "all",
        depth: 1,
      });
      return result.docs.map((row) => ({ arm, row }));
    }),
  );

  // Merged FIRST, then ordered once: three per-type lists concatenated would
  // have the same membership and the wrong order. See note 2.
  return arms
    .flat()
    .sort((a, b) => {
      const byDate = byNewestFirst(unionDate(a.row), unionDate(b.row));
      if (byDate !== 0) return byDate;
      return byCodePoint(docId(a.row), docId(b.row));
    })
    .slice(0, input.limit)
    .map(({ arm, row }) =>
      groqObject({
        _id: docId(row),
        _type: arm.type,
        title: orNull(localized(row.title as LocalizedRaw)?.en ?? text(row.title)),
        slug: orNull(text(row.slug)),
        region: arm.regionIsReference ? relationRefOrNull(row.region) : orNull(text(row.region)),
        rcSlug: orNull(relationSlug(row.relatedCommunity)),
        tagSlugs: tagSlugs(row.tags),
      }),
    ) as unknown as ForYouCandidateRow[];
}

/** `coalesce(publishedAt, publishDate, _createdAt)`. Only `researchOutput`
 *  carries `publishDate`, and it is not in this union — the coalesce is left
 *  intact anyway because the GROQ writes it. */
function unionDate(row: Row): string | undefined {
  return (
    isoDate(row.publishedAt) ??
    isoDate(row.publishDate) ??
    isoDate(row.sanityUpdatedAt ?? row.createdAt)
  );
}

/** `region` on a lived experience is a `regionalCommunities` reference, so a
 *  bare `region` projection returns Sanity's raw reference object. */
function relationRefOrNull(value: unknown): Row | string | null {
  if (isRow(value)) return groqObject({ _type: "reference", _ref: docId(value) });
  const raw = text(value);
  return raw ? groqObject({ _type: "reference", _ref: raw }) : null;
}

/** `tags[]->value.current` — a string array, or `null` when the document has
 *  no tags at all, which is what GROQ returns for an absent array. */
function tagSlugs(rows: unknown): string[] | null {
  if (!Array.isArray(rows)) return null;
  const values = rows
    .map((row) => (isRow(row) ? text(row.value) : text(row)))
    .filter((value): value is string => Boolean(value));
  return listOrNull(values);
}

// ---------------------------------------------------------------------------
// All-posts block
// ---------------------------------------------------------------------------

function newsPostBlockProjection(row: Row): NewsPostBlockItem {
  return groqObject({
    _id: docId(row),
    _type: "newsPost",
    _updatedAt: orNull(isoDate(row.sanityUpdatedAt ?? row.updatedAt)),
    author: blockAuthorProjection(row.author),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    featured: row.featured ?? null,
    image: imageProjection(row.image, { mimeType: true, caption: true }),
    // Not modelled in Payload, deliberately. Note 7.
    language: null,
    publishedAt: orNull(isoDate(row.publishedAt)),
    slug: orNull(text(row.slug)),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    tags: tagProjection(row.tags, BLOCK_TAG_FIELDS),
    title: orNull(localized(row.title as LocalizedRaw)),
  }) as unknown as NewsPostBlockItem;
}

/** `publishedAt <= now()`. */
function publishedByNow(): Where {
  return { publishedAt: { less_than_equal: new Date().toISOString() } };
}

async function findNewsPosts(where: Where | undefined): Promise<Row[]> {
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "newsPosts",
    where,
    pagination: false,
    locale: "all",
    depth: DEPTH,
  });
  return result.docs;
}

export async function getNewsPostsForBlock(
  mode: AllPostsMode,
  limit: number,
  manualIds?: string[],
): Promise<NewsPostBlockItem[]> {
  if (mode === "manual") {
    if (!manualIds || manualIds.length === 0) return [];
    // No `order(…)` in the GROQ, so document order — `_id` ascending.
    const docs = await findNewsPosts({ id: { in: manualIds } });
    return [...docs].sort((a, b) => byCodePoint(docId(a), docId(b))).map(newsPostBlockProjection);
  }

  if (mode === "featured") {
    const featured = sortCards(
      await findNewsPosts(and({ featured: { equals: true } }, publishedByNow())),
      "recent",
    );
    if (featured.length >= limit) return featured.slice(0, limit).map(newsPostBlockProjection);

    const remaining = limit - featured.length;
    const recent = sortCards(
      await findNewsPosts(
        and(
          { or: [{ featured: { exists: false } }, { featured: { equals: false } }] },
          publishedByNow(),
        ),
      ),
      "recent",
    );
    return [...featured, ...recent.slice(0, remaining)].map(newsPostBlockProjection);
  }

  return sortCards(await findNewsPosts(publishedByNow()), "recent")
    .slice(0, limit)
    .map(newsPostBlockProjection);
}

// ---------------------------------------------------------------------------
// Collaboration output enrichment
// ---------------------------------------------------------------------------

/**
 * The four collections a workspace output can be — `OUTPUT_TYPES` in
 * `lib/collaboration/outputs.ts`, which `addOutput` enforces through
 * `isOutputType`. See note 8.
 */
const OUTPUT_COLLECTIONS: CollectionSlug[] = [
  "caseStudies",
  "events",
  "livedExperiences",
  "researchOutputs",
];

/** Every output-collection row whose id is in `ids`, read through `read`.
 *  The primitive is passed in because the three callers deliberately differ:
 *  two are cached display enrichment (`query`) and one feeds a Postgres write
 *  (`queryLive`). */
async function findOutputRows(
  read: <T>(descriptor: PayloadFindQuery) => Promise<T>,
  ids: string[],
): Promise<Row[]> {
  if (ids.length === 0) return [];
  const perCollection = await Promise.all(
    OUTPUT_COLLECTIONS.map(async (collection) => {
      const result = await read<Paginated<Row>>({
        type: "find",
        collection,
        where: { id: { in: ids } },
        pagination: false,
        locale: "all",
        depth: 0,
      });
      return result.docs;
    }),
  );
  return perCollection.flat().sort((a, b) => byCodePoint(docId(a), docId(b)));
}

export async function getDocSlugs(ids: string[]): Promise<{ _id: string; slug: string | null }[]> {
  const docs = await findOutputRows(query, ids);
  return docs.map((row) => groqObject({ _id: docId(row), slug: orNull(text(row.slug)) }));
}

export async function getOutputSummaries(
  ids: string[],
): Promise<{ _id: string; title: string | null; status: string | null; slug: string | null }[]> {
  const docs = await findOutputRows(query, stripDraftPrefixes(ids));
  return docs.map((row) =>
    groqObject({
      _id: docId(row),
      title: orNull(localized(row.title as LocalizedRaw)?.en ?? text(row.title)),
      status: orNull(text(row.moderationStatus)),
      slug: orNull(text(row.slug)),
    }),
  );
}

/**
 * `queryLive`, not `query` and not `queryRaw`.
 *
 * This read REFRESHES the cached Prisma rows and drives an X3/X5 notification
 * fan-out, so it must not be cached — and it must not see drafts either: a
 * still-unpublished draft's title/status leaking into Postgres would fire a
 * notification on a document that is not public. `queryLive` is live and
 * published-only, which is what the pre-seam `client.fetch` was.
 */
export async function getOutputStatuses(
  ids: string[],
): Promise<{ _id: string; title?: string; status?: string }[]> {
  const docs = await findOutputRows(queryLive, stripDraftPrefixes(ids));
  return docs.map((row) =>
    groqObject({
      _id: docId(row),
      title: orNull(localized(row.title as LocalizedRaw)?.en ?? text(row.title)),
      status: orNull(text(row.moderationStatus)),
    }),
  ) as unknown as { _id: string; title?: string; status?: string }[];
}

/** `_id in $ids || ("drafts." + _id) in $ids`, as the single lookup Payload
 *  needs. Both spellings of the same id collapse onto one row. */
function stripDraftPrefixes(ids: string[]): string[] {
  return [...new Set(ids.map((value) => value.replace(/^drafts\./, "")))];
}

// ---------------------------------------------------------------------------
// Workspace output draft creation — a write
// ---------------------------------------------------------------------------

/** Sanity's `_type` for each workspace output, as a Payload collection. */
const OUTPUT_COLLECTION_BY_TYPE: Record<string, CollectionSlug> = {
  caseStudy: "caseStudies",
  event: "events",
  livedExperience: "livedExperiences",
  researchOutput: "researchOutputs",
};

/**
 * Create an unpublished output for a workspace (`addOutput`'s "create" mode).
 *
 * Three deliberate differences from the Sanity arm, all forced by the store:
 *
 * 1. **No `drafts.` prefix.** Sanity expresses draft-ness in the id; Payload
 *    expresses it as `_status`, so the id is a plain uuid and `draft: true`
 *    carries the meaning the prefix used to. Both callers strip the prefix
 *    before looking the id up again, so nothing downstream changes.
 * 2. **`moderationStatus`, not `status`.** Payload drops an unknown data key
 *    silently — a `status` key would have created the document in whatever
 *    state its `defaultValue` says and reported success.
 * 3. **`id` and `slug` are supplied.** `id` is a required text column (Sanity's
 *    `_id`, preserved by the import) and `slug` is required and unique on all
 *    four collections. Payload skips `required` validation for a draft, but a
 *    row with a null slug is a row no route can address, so a slug is minted
 *    from the same uuid.
 */
export async function createWorkspaceOutputDraft(
  sanityType: string,
  title: string,
): Promise<{ id: string }> {
  const collection = OUTPUT_COLLECTION_BY_TYPE[sanityType];
  if (!collection) {
    throw new Error(`No Payload collection is modelled for workspace output type "${sanityType}".`);
  }
  const newId = crypto.randomUUID();
  return createDocument({
    collection,
    locale: "en",
    draft: true,
    data: {
      id: newId,
      slug: `draft-${newId}`,
      title,
      moderationStatus: "pending",
    },
  });
}

// ---------------------------------------------------------------------------
// Comment target resolution — a write-time authorization gate
// ---------------------------------------------------------------------------

/**
 * The public predicate per comment-target type, as
 * `SANITY_COMMENT_PREDICATE`'s Payload twin.
 *
 * `livedExperience` is the one loose arm (`status == "approved" ||
 * !defined(status)`); `caseStudy`, `researchOutput` and `event` are strict;
 * `newsPost` has no moderation field at all. `queryLive` supplies the
 * published-only half on the two collections that have `_status`.
 */
const PAYLOAD_COMMENT_TARGET: Partial<
  Record<CommentTargetType, { collection: CollectionSlug; where: Where | null }>
> = {
  caseStudy: { collection: "caseStudies", where: APPROVED },
  newsPost: { collection: "newsPosts", where: null },
  livedExperience: { collection: "livedExperiences", where: APPROVED_OR_UNSET },
  researchOutput: { collection: "researchOutputs", where: APPROVED },
  event: { collection: "events", where: APPROVED },
};

/**
 * `queryLive`, not `query` and not `queryRaw`.
 *
 * `id` is client-supplied — `lib/comments/target.ts` guards against "a client
 * aiming the polymorphic targetId at an arbitrary document" — so the gate has
 * to be live (a withdrawn document must stop validating immediately, not up to
 * an hour later) AND published-only (a draft that says
 * `moderationStatus: "approved"` must not answer it). That pair is exactly the
 * Phase-1 bypass, and `queryLive` is the primitive that closes it.
 */
export async function resolveCommentTarget(
  type: CommentTargetType,
  id: string,
): Promise<CommentTarget | null> {
  const spec = PAYLOAD_COMMENT_TARGET[type];
  if (!spec) return null;
  return safe(`comment-target-${type}`, null, async () => {
    const count = await queryLive<number>({
      type: "count",
      collection: spec.collection,
      where: and(spec.where, { id: { equals: id } }),
    });
    return count > 0 ? { type, id } : null;
  });
}

// ---------------------------------------------------------------------------
// Comment moderation settings
// ---------------------------------------------------------------------------

/**
 * `queryLive`, not `query`. The pre-seam original was a bare `client.fetch`
 * with no `next.revalidate`, and `moderateBody()` is the gate deciding whether
 * a comment is blocked, held or published — an hour-long cache stacked on the
 * module's own 60-second TTL would delay a new blocklist term by up to an hour.
 *
 * Both wordlists are arrays of `{term}` in Payload (it has no scalar array
 * field) and arrays of bare strings in Sanity, so they are flattened here.
 * Measured: the global is unauthored in both stores, and Payload's defaults
 * (`enabled: true`, two empty lists) are the same values `discovery.ts`'s
 * `DEFAULT_MODERATION_SETTINGS` supplies when Sanity returns nothing.
 */
export async function getModerationSettings(): Promise<ModerationSettings> {
  const raw = await queryLive<Row | null>({ type: "global", slug: "moderationSettings", locale: "all" });
  return {
    enabled: typeof raw?.enabled === "boolean" ? raw.enabled : true,
    blockTerms: terms(raw?.blockTerms),
    reviewTerms: terms(raw?.reviewTerms),
  };
}

function terms(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => (isRow(row) ? text(row.term) : text(row)))
    .filter((value): value is string => Boolean(value));
}

// ---------------------------------------------------------------------------
// Events — the public list and detail
// ---------------------------------------------------------------------------

/** `SanityPlace`, from Payload's `place` group. */
function placeProjection(value: unknown): Row | null {
  if (!isRow(value)) return null;
  return groqObject({
    point: geopoint(value.point),
    text: orNull(text(value.text)),
    precision: orNull(text(value.precision)),
    countryCode: orNull(text(value.countryCode)),
  });
}

/** `APPROVED_EVENTS_QUERY`'s eleven keys. */
function eventListProjection(row: Row): ContentEvent {
  return groqObject({
    _id: docId(row),
    title: orNull(enArm(row.title) ?? text(row.title)),
    description: orNull(enArm(row.description) ?? text(row.description)),
    scope: orNull(text(row.scope)),
    startAt: orNull(isoDate(row.startAt)),
    endAt: orNull(isoDate(row.endAt)),
    mode: orNull(text(row.mode)),
    locationName: orNull(text(row.locationName)),
    url: orNull(text(row.url)),
    linkedProject: orNull(text(row.linkedProject)),
    slug: orNull(text(row.slug)),
  }) as unknown as ContentEvent;
}

/** `EVENT_BY_SLUG_QUERY` — the list projection plus `place`, `recordingUrl`,
 *  `relatedCollaboration`, `coverImage` and the rich-text `body`. */
function eventDetailProjection(row: Row): ContentEvent {
  return groqObject({
    ...(eventListProjection(row) as unknown as Row),
    place: placeProjection(row.place),
    recordingUrl: orNull(text(row.recordingUrl)),
    relatedCollaboration: orNull(text(row.relatedCollaboration)),
    coverImage: coverImageProjection(row.coverImage),
    body: eventBody(row.body),
  }) as unknown as ContentEvent;
}

/** `body` is a localized rich text and the GROQ projects it bare, so the arm
 *  the site renders is the default locale's. An unset body is `null` on both
 *  backends, not `[]` — GROQ emits null for a key the document does not set. */
function eventBody(value: unknown): unknown[] | null {
  const arm = isRow(value) && !("root" in value) ? value.en : value;
  if (!arm) return null;
  const blocks = portableText(arm);
  return blocks.length > 0 ? blocks : null;
}

export async function getEvents(filter: EventFilter = {}): Promise<ContentEvent[]> {
  if (filter.slug) {
    const result = await query<Paginated<Row>>({
      type: "find",
      collection: "events",
      where: and(APPROVED, { slug: { equals: filter.slug } }),
      limit: 1,
      locale: "all",
      depth: DEPTH,
    });
    const row = result.docs[0];
    return row ? [eventDetailProjection(row)] : [];
  }

  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "events",
    where: APPROVED,
    pagination: false,
    locale: "all",
    depth: 1,
  });
  return [...result.docs]
    .sort((a, b) => {
      // `order(startAt asc)` — ascending, so the mirror of byNewestFirst, with
      // the same `_id asc` tie-break the rest of the module carries.
      const byStart = byNewestFirst(isoDate(b.startAt), isoDate(a.startAt));
      if (byStart !== 0) return byStart;
      return byCodePoint(docId(a), docId(b));
    })
    .slice(0, filter.limit ?? 50)
    .map(eventListProjection);
}

// ---------------------------------------------------------------------------
// The editable event — a gated, drafts-visible read
// ---------------------------------------------------------------------------

/**
 * `queryRaw`, not `queryLive`.
 *
 * Edit mode is exactly about reopening an unpublished document, so this one
 * must see drafts — the opposite requirement from `resolveCommentTarget`. It
 * throws on failure like the write paths rather than degrading through
 * `safe()`, mirroring `lived-experiences.ts`'s `loadEditableLivedExperience`.
 *
 * The GROQ matches `_id == $id || _id == "drafts." + $id`. Payload has no
 * `drafts.`-prefixed ids — a draft is a version of the same id — so that
 * id-juggling collapses into one lookup with drafts visible.
 */
export async function getEditableEventDoc(id: string): Promise<RawEditableEventDoc | null> {
  const row = await queryRaw<Row | null>({
    type: "findByID",
    collection: "events",
    id: id.replace(/^drafts\./, ""),
    locale: "all",
    depth: 0,
  });
  if (!row) return null;
  return groqObject({
    _id: String(row.id ?? ""),
    title: orNull(enArm(row.title) ?? text(row.title)),
    description: orNull(enArm(row.description) ?? text(row.description)),
    scope: orNull(text(row.scope)),
    startAt: orNull(isoDate(row.startAt)),
    endAt: orNull(isoDate(row.endAt)),
    mode: orNull(text(row.mode)),
    locationName: orNull(text(row.locationName)),
    url: orNull(text(row.url)),
    submittedBy: orNull(text(row.submittedBy)),
    status: orNull(text(row.moderationStatus)),
    reviewNotes: orNull(text(row.reviewNotes)),
  }) as unknown as RawEditableEventDoc;
}

/**
 * `queryRaw`. The minimal existence + ownership gate the submit route checks
 * before allowing an edit-mode resubmission — a read that feeds the
 * `updateEvent` write below. Distinct from `getEditableEventDoc`: no
 * drafts-id fallback in the GROQ, three fields only, a different call site.
 */
export async function getEventEditGate(
  id: string,
): Promise<{ _id: string; submittedBy: string | null; status: string | null } | null> {
  const result = await queryRaw<Paginated<Row>>({
    type: "find",
    collection: "events",
    where: { id: { equals: id } },
    limit: 1,
    locale: "all",
    depth: 0,
  });
  const row = result.docs[0];
  if (!row) return null;
  return groqObject({
    _id: String(row.id ?? ""),
    submittedBy: orNull(text(row.submittedBy)),
    status: orNull(text(row.moderationStatus)),
  });
}

// ---------------------------------------------------------------------------
// Event submission and edit-resubmission — writes
// ---------------------------------------------------------------------------

/**
 * The editable fields, and their Payload names.
 *
 * Written as a table rather than inline so that the ONE renamed field —
 * `status` becoming `moderationStatus` — is visible next to the eight that
 * keep their names, and so no caller can hand a field name in. Payload drops
 * an unknown data key silently, which is what makes that a real hazard rather
 * than a typo caught by `tsc`.
 */
function eventFields(patch: Partial<EventInput>): Record<string, unknown> {
  return {
    title: patch.title,
    description: patch.description ?? undefined,
    scope: patch.scope,
    startAt: patch.startAt,
    endAt: patch.endAt ?? undefined,
    mode: patch.mode,
    locationName: patch.locationName ?? undefined,
    url: patch.url ?? undefined,
    linkedProject: patch.scope === "project" ? patch.linkedProject ?? undefined : undefined,
  };
}

/**
 * Create a PENDING event. Status is forced regardless of input — never trust
 * the client — and it is spelled `moderationStatus` here, once, inside the
 * reader.
 *
 * `title` is written at `locale: "en"`: Sanity declares it a plain string,
 * Payload declares it localized, and `fallback: true` then serves the same
 * text to all four locales.
 */
export async function submitEvent(input: EventInput): Promise<{ id: string }> {
  const data: Record<string, unknown> = {
    // Payload's `id` is a text column carrying what Sanity called `_id`, and a
    // brand-new document needs one; `slug` is required and unique.
    id: crypto.randomUUID(),
    slug: generateEventSlug(input.title),
    moderationStatus: "pending",
    submittedBy: input.submittedBy,
  };
  for (const [key, value] of Object.entries(eventFields(input))) {
    if (value !== undefined) data[key] = value;
  }
  if (input.regionalCommunityId) data.relatedCommunity = input.regionalCommunityId;
  if (input.relatedCollaboration) data.relatedCollaboration = input.relatedCollaboration;
  return createDocument({ collection: "events", locale: "en", data });
}

/**
 * Patch an event for an edit-mode resubmission — status returns to "pending",
 * slug and submittedBy are untouched, every editable field the resubmission
 * leaves blank is explicitly cleared (`null`, which the seam's `updateDocument`
 * defines as "unset"), except `relatedCommunity`/`relatedCollaboration`, which
 * are only ever set and never cleared. Same asymmetry as the Sanity arm.
 */
export async function updateEvent(id: string, patch: Partial<EventInput>): Promise<void> {
  const data: Record<string, unknown> = { moderationStatus: "pending" };
  for (const [key, value] of Object.entries(eventFields(patch))) {
    data[key] = value === undefined ? null : value;
  }
  if (patch.regionalCommunityId) data.relatedCommunity = patch.regionalCommunityId;
  if (patch.relatedCollaboration) data.relatedCollaboration = patch.relatedCollaboration;
  await updateDocument({ collection: "events", id, locale: "en", data });
}

// ---------------------------------------------------------------------------
// RSVP gate and the reminder cron
// ---------------------------------------------------------------------------

/**
 * `queryLive`, not `query` and not `queryRaw`.
 *
 * `eventId` is client-supplied (`lib/actions/rsvp.ts`'s `setRsvp` takes it
 * straight from the caller), so `queryRaw`'s drafts visibility would let an
 * unpublished event whose draft says approved take RSVPs — the same bypass
 * shape as `resolveCommentTarget`. And the read feeds a write, so `query()`'s
 * hour-long cache is wrong too.
 */
export async function getApprovedEventForRsvp(eventId: string): Promise<EventRsvpMeta | null> {
  const result = await queryLive<Paginated<Row>>({
    type: "find",
    collection: "events",
    where: and(APPROVED, { id: { equals: eventId } }),
    limit: 1,
    locale: "all",
    depth: 0,
  });
  const row = result.docs[0];
  if (!row) return null;
  return groqObject({
    _id: docId(row),
    title: orNull(enArm(row.title) ?? text(row.title)),
    startAt: orNull(isoDate(row.startAt)),
    slug: orNull(text(row.slug)),
    submittedBy: orNull(text(row.submittedBy)),
  }) as unknown as EventRsvpMeta;
}

/**
 * `queryLive`. Feeds the T-24h reminder cron's RSVP notification fan-out (a
 * Prisma write), so it must be live; and `raw` would surface unpublished
 * drafts into that fan-out, so an unapproved event could fire reminders.
 */
export async function getEventsStartingWithin(
  nowIso: string,
  endIso: string,
): Promise<UpcomingReminderEvent[]> {
  const result = await queryLive<Paginated<Row>>({
    type: "find",
    collection: "events",
    where: and(APPROVED, {
      and: [{ startAt: { greater_than: nowIso } }, { startAt: { less_than: endIso } }],
    }),
    pagination: false,
    locale: "all",
    depth: 0,
  });
  // No `order(…)` in the GROQ — document order, i.e. `_id` ascending.
  return [...result.docs]
    .sort((a, b) => byCodePoint(docId(a), docId(b)))
    .map((row) =>
      groqObject({ _id: docId(row), title: orNull(enArm(row.title) ?? text(row.title)) }),
    ) as unknown as UpcomingReminderEvent[];
}

// ---------------------------------------------------------------------------
// The dynamic template fetchers
// ---------------------------------------------------------------------------
//
// Zero importers anywhere in app/components/lib — `discovery.ts`'s own header
// records that, and it still holds. Converted rather than deleted, per the
// same instruction that moved them here. Both swallow their own errors and
// return [], which is preserved on this arm too.

/* eslint-disable @typescript-eslint/no-explicit-any -- the templates these fed
   depend on the loose row shape; the Sanity arm carries the same disable. */

function templateCaseStudyProjection(row: Row): any {
  return groqObject({
    _id: docId(row),
    title: orNull(localized(row.title as LocalizedRaw)),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    slug: slugObject(row.slug),
    status: orNull(text(row.moderationStatus)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    featured: row.featured ?? null,
    image: imageProjection(row.image, { mimeType: true, caption: true }),
    authors: templateAuthors(row.authors),
    organizations: organizationsProjection(row.organizations, { logo: true }),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    studyPeriod: isRow(row.studyPeriod)
      ? groqObject({
          startDate: orNull(isoDay(row.studyPeriod.startDate)),
          endDate: orNull(isoDay(row.studyPeriod.endDate)),
        })
      : null,
    studyLocation: geopoint(row.studyLocation),
  });
}

/** `authors[]{ userId, name, email, role, affiliation->{_id,name,slug,acronym,logo{…}} }`.
 *  `email` is editor-only at FIELD level on the collection; the Local API
 *  bypasses access control, so it comes back and is projected, exactly as the
 *  token-carrying Sanity client returns it. */
function templateAuthors(rows: unknown): any[] | null {
  if (!Array.isArray(rows)) return null;
  const authors = rows.filter(isRow).map((row) =>
    groqObject({
      userId: orNull(text(row.userId)),
      name: orNull(text(row.name)),
      email: orNull(text(row.email)),
      role: orNull(text(row.role)),
      affiliation: isRow(row.affiliation)
        ? organizationsProjection([row.affiliation], { logo: true })?.[0] ?? null
        : null,
    }),
  );
  return listOrNull(authors);
}

async function findTemplateRows(collection: CollectionSlug, where: Where | undefined): Promise<Row[]> {
  const result = await query<Paginated<Row>>({
    type: "find",
    collection,
    where,
    pagination: false,
    locale: "all",
    depth: DEPTH,
  });
  return result.docs;
}

export async function fetchDynamicCaseStudies({
  regionalCommunityId,
  mode = "dynamic-featured",
  maxItems = 6,
}: DynamicTemplateFetchOptions): Promise<any[]> {
  try {
    const inCommunity: Where = { "relatedCommunity.id": { equals: regionalCommunityId } };
    if (mode === "dynamic-featured") {
      const featuredRows = sortCards(
        await findTemplateRows(
          "caseStudies",
          and(APPROVED, { featured: { equals: true } }, inCommunity),
        ),
        "recent",
      ).slice(0, maxItems);
      let items = featuredRows.map(templateCaseStudyProjection);
      if (items.length < maxItems) {
        const remaining = maxItems - items.length;
        const featuredIds = featuredRows.map(docId);
        const recent = sortCards(
          await findTemplateRows(
            "caseStudies",
            and(
              APPROVED,
              featuredIds.length > 0 ? { id: { not_in: featuredIds } } : null,
              inCommunity,
            ),
          ),
          "recent",
        ).slice(0, remaining);
        items = [...items, ...recent.map(templateCaseStudyProjection)];
      }
      return items;
    }
    return sortCards(await findTemplateRows("caseStudies", and(APPROVED, inCommunity)), "recent")
      .slice(0, maxItems)
      .map(templateCaseStudyProjection);
  } catch (error) {
    console.error("Error fetching dynamic case studies:", error);
    return [];
  }
}

function templateLivedExperienceProjection(row: Row): any {
  return groqObject({
    _id: docId(row),
    title: orNull(localized(row.title as LocalizedRaw)),
    // `excerpt` is projected by the GROQ and declared by neither schema — null
    // on every document in both stores. Note 7.
    excerpt: null,
    slug: slugObject(row.slug),
    thumbnail: imageProjection(row.thumbnail, { mimeType: true }),
    videoUrl: orNull(text(row.videoUrl)),
    duration: orNull(text(row.duration)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    relatedCommunity: communityProjection(row.relatedCommunity),
    organizations: organizationsProjection(row.organizations, { logo: false }),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    featured: row.featured ?? null,
  });
}

export async function fetchDynamicLivedExperiences({
  regionalCommunityId,
  mode = "dynamic-featured",
  maxItems = 10,
}: DynamicTemplateFetchOptions): Promise<any[]> {
  try {
    // `relatedCommunity._ref == $id` — no moderation clause at all in this
    // GROQ, unlike its case-study twin. Reproduced.
    const inCommunity: Where = { "relatedCommunity.id": { equals: regionalCommunityId } };
    if (mode === "dynamic-featured") {
      const featuredRows = sortCards(
        await findTemplateRows("livedExperiences", and({ featured: { equals: true } }, inCommunity)),
        "recent",
      ).slice(0, maxItems);
      let items = featuredRows.map(templateLivedExperienceProjection);
      if (items.length < maxItems) {
        const remaining = maxItems - items.length;
        const featuredIds = featuredRows.map(docId);
        const recent = sortCards(
          await findTemplateRows(
            "livedExperiences",
            and(featuredIds.length > 0 ? { id: { not_in: featuredIds } } : null, inCommunity),
          ),
          "recent",
        ).slice(0, remaining);
        items = [...items, ...recent.map(templateLivedExperienceProjection)];
      }
      return items;
    }
    return sortCards(await findTemplateRows("livedExperiences", inCommunity), "recent")
      .slice(0, maxItems)
      .map(templateLivedExperienceProjection);
  } catch (error) {
    console.error("Error fetching dynamic lived experiences:", error);
    return [];
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
