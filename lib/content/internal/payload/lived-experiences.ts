/**
 * The Payload half of `lib/content/lived-experiences.ts`.
 *
 * Nine exported answers and — for the first time in this phase — **three
 * writes**. `lived-experiences.ts` picks between this file and its own GROQ
 * through `activeBackend("lived-experiences")`; the `safe()` wrappers, the
 * deliberate absence of one on the write paths, and the whole of the
 * authorization gate's *decision* stay in the domain module, so a failure
 * degrades — or throws — in exactly the same place on either backend.
 *
 * ---------------------------------------------------------------------------
 * The authorization gate: what moved, and what deliberately did not
 * ---------------------------------------------------------------------------
 *
 * `loadEditableLivedExperience` is a write-time gate fed by `queryRaw` — the
 * exact shape of the Phase-1 authorization bypass, where a `drafts.`-prefixed
 * document claiming `status: "approved"` answered a permission question. So it
 * is translated with one rule: **the gate's decision is not translated at all.**
 * This file exports `loadEditableDoc`, which does nothing but read one document
 * with every version visible and hand back the same `RawEditableDoc` the GROQ
 * projects. The status test, the ownership test, the workspace-membership test
 * and the field mapping all stay where they are, written once, exercised by
 * both backends. A gate implemented twice is a gate that can disagree with
 * itself.
 *
 * Three things about the read itself are Payload-specific:
 *
 * **1. There is no `drafts.` prefix to strip.** Sanity matches `_id == $id ||
 * _id == "drafts." + $id` because a draft is a *different document*; in Payload
 * a draft is a *version of the same document*. So the id-juggling collapses
 * into one `findByID` issued through `queryRaw`, which is `draft: true` — the
 * newest version, published or not. The domain module still normalises a
 * `drafts.` prefix off the caller-supplied id before calling, because an id
 * minted while Sanity was the backend can still be sitting in someone's URL.
 *
 * **2. Sanity's `status` is two things; Payload's are two fields.** The gate's
 * list is `["pending", "revision", "draft", null, undefined]` — a moderation
 * state (`pending`, `revision`) and a draft state (`draft`) conflated in one
 * column. Payload splits them: `moderationStatus` holds the moderation state,
 * `_status` holds the draft state. **`"draft"` is NOT mapped onto
 * `moderationStatus`** — that would invent a fifth moderation value no
 * collection declares and no editor can select. `status` here is
 * `moderationStatus` and nothing else; the `"draft"` literal in the domain
 * module's list stays vestigial, exactly as it is on Sanity today.
 *
 * **3. The gate is inert today, and that is preserved rather than fixed.**
 * `status` is 0/56 populated in Sanity and `moderation_status` is `null` on all
 * 35 Payload rows, with **no `defaultValue`** applied by the import
 * (`payload/collections/lived-experiences.ts` says why). So the status test
 * always passes today and the real work is the ownership check that follows.
 * The property that matters is the one the gate has *if anyone ever sets the
 * field*: an approved or rejected document must not be reopenable. Returning
 * `moderationStatus` verbatim — `null` for `null`, `"approved"` for
 * `"approved"` — keeps both halves: inert now, closed later.
 *
 * ---------------------------------------------------------------------------
 * `queryRaw` is not `queryLive`, and this module holds the only two `queryRaw`
 * call sites outside `lib/actions/`
 * ---------------------------------------------------------------------------
 *
 * Both write-feeding reads below use `queryRaw` (drafts visible, uncached) and
 * neither may use `queryLive` (published only, uncached) or `query` (published,
 * cached an hour). They return the same *shape*, so a wrong choice is invisible
 * to any test that only inspects the result — which is precisely how the
 * Phase-1 bypass survived review. `lib/__tests__/content-lived-experiences.test.ts`
 * therefore asserts **which primitive was called**, on both backends.
 *
 * The direction of the mistake matters too: `queryLive` here would break the
 * feature (you could never reopen your own unpublished submission) *and* would
 * be the wrong safety story; `query` would let an hour-old cache answer a
 * permission question.
 *
 * ---------------------------------------------------------------------------
 * The public reads: unset means approved
 * ---------------------------------------------------------------------------
 *
 * Every public read filters `(status == "approved" || !defined(status))` — the
 * loose, exists-or-approved rule, because on this content type an unset status
 * means approved (Phase-2 obligation 10; 0/56 populated). That is
 * `publishedAndApproved`'s shape in `payload/access/index.ts`, **not**
 * `moderationApprovedOnly`'s strict one. Written out as `APPROVED_OR_UNSET`
 * below rather than imported, for the reason `payload/system.ts` gives: those
 * exports are Payload `Access` functions that take a request and may answer
 * `true` outright for an editor, and this seam reads with `overrideAccess:
 * true` by design. What is shared is the rule.
 *
 * Using the strict variant would empty the site: all 35 published documents
 * carry `moderationStatus: null`.
 *
 * ---------------------------------------------------------------------------
 * Three fields the schema and the data disagree about
 * ---------------------------------------------------------------------------
 *
 * **`region` holds a `regionalCommunity` reference**, not the fixed-7 short
 * code the Sanity schema declares — 42/56 populated, 42 references, 0 strings —
 * so Payload models it as a `relationship` and this file dereferences it into
 * the same `{_id, name, slug}` the GROQ projects.
 *
 * `rawRegion` needs more care than it looks. It is the *undereferenced* field,
 * and `app/[locale]/(main)/lived-experiences/page.tsx`'s `belongsToCommunity`
 * falls back to it only when `region->` resolved to nothing, accepting a bare
 * legacy short code (`"ssa"`). Payload cannot hold a bare code in a
 * relationship column, so that arm is unreachable on this backend — but
 * `rawRegion` is still a **prop of a client component** (`initialCommunityVideos`
 * flows into `page-client.tsx`), which means it reaches the RSC flight payload
 * and is therefore part of the rendered output the parity harness compares. So
 * it is emitted in the shape Sanity emits it in, `{_type: "reference", _ref:
 * id}`, which is what a Payload relationship *is*. Emitting the bare id string
 * instead would render identically and diff the flight payload for no reason a
 * reader could act on.
 *
 * **`videoUrl` is real and undeclared.** It is not in the Sanity schema, it is
 * 56/56 populated, and five `lib/content/*.ts` modules read it. Payload
 * declares it as a plain text field; this file carries it.
 *
 * **`videoFile` resolves to `files`, not `media`.** `media` is images-only
 * (`mimeTypes: ["image/*"]`); a video is not an image. So the upload primitive
 * this module calls is `uploadFileAsset`, whose Payload implementation targets
 * `files`, and `videoFile.asset->url` becomes the `files` row's own `url`.
 *
 * ---------------------------------------------------------------------------
 * `ContentTag.value`, flattened on both sides
 * ---------------------------------------------------------------------------
 *
 * `ContentTag.value` is declared `string`. In Sanity a tag's `value` is
 * `{_type: "slug", current: "…"}`, and this module's four `{… value …}` tag
 * projections bind it bare — so it is this module, not `taxonomy.ts`, that
 * actually hands consumers the mis-shaped object the type denies. Payload
 * stores a flat text column and can only return the string. The Sanity
 * projections are flattened to `"value": value.current` so both backends agree;
 * see the domain module for what that changes at the two call sites that read
 * it.
 *
 * ---------------------------------------------------------------------------
 * What Payload cannot answer, said out loud
 * ---------------------------------------------------------------------------
 *
 * `relatedContent` is projected by `DETAIL_QUERY` and has **no Payload field**.
 * It is also **0 of 56 populated in Sanity** — measured, published perspective,
 * control 29 — so nothing renders from it on either backend and there is
 * nothing to reconstruct. It comes back `undefined`, which is what a GROQ
 * projection of an unset field produces, and `components/content/related-content.tsx`
 * already renders nothing for that. Recorded rather than faked.
 */
import "server-only";
import type { Where } from "payload";
import { portableTextToLexical } from "@/lib/content/internal/lexical";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import {
  createDocument,
  query,
  queryPreviewable,
  queryRaw,
  updateDocument,
  type PayloadLocale,
} from "@/lib/content/internal/payload-source";
import type {
  LivedExperienceCarouselFilters,
  LivedExperienceCarouselItem,
  LivedExperienceCommunityOption,
  LivedExperienceDetail,
  LivedExperienceIndex,
  LivedExperienceOgData,
  LivedExperienceTagOption,
} from "@/lib/content/lived-experiences";
import type { Localized, RichText } from "@/lib/content/types";

interface Paginated<T> {
  docs: T[];
}

/** A localized field read at `locale: "all"`. */
type LocalizedRaw = Partial<Record<keyof Localized & string, string | null>> | null | undefined;

/**
 * A Payload localized field, as a Sanity projection of the same field.
 *
 * Sanity omits an unset field; Payload spells the locale key out with `null`
 * (`issue: {en: null}` on all 56). Left in, those are two different objects for
 * the same content and every one is a parity difference that means nothing.
 * Same rule as `payload/taxonomy.ts`'s `localized()`, for the same reason.
 */
function localized(value: LocalizedRaw): Localized | undefined {
  if (!value || typeof value !== "object") return undefined;
  const out: Record<string, string> = {};
  // Alphabetical, because that is the order Sanity's Content Lake serializes an
  // object's keys in — measured across tags, regionalCommunities and pages, all
  // `ar,en,es,fr` — while Payload returns them in `payload.config.ts`'s locale
  // order, `en,es,fr,ar`. Nothing reads key order, but a localized object
  // handed to a client component is serialized into the RSC flight payload
  // verbatim, so the two orders are a byte difference the parity harness
  // reports on every localized field. Canonicalising here costs nothing and
  // makes the two stores agree; the alternative is a harness normaliser, and a
  // normaliser that reorders object keys could hide a moved value.
  for (const locale of Object.keys(value).sort()) {
    const string = value[locale as keyof Localized & string];
    if (typeof string === "string" && string.length > 0) out[locale] = string;
  }
  return Object.keys(out).length > 0 ? (out as Localized) : undefined;
}

/**
 * `undefined` as the `null` a GROQ projection actually returns.
 *
 * An explicit GROQ projection emits every key it names, with `null` for a field
 * the document does not set — measured: a lived experience with no region
 * projects `{"format":null,"rawRegion":null,"thumbnailUrl":null,...}`, not a
 * shorter object. Payload's reader naturally produces `undefined` for the same
 * fields, and React serializes that into the flight payload as `"$undefined"`,
 * which is a different byte string from `null`. Every projected-but-unset field
 * below therefore goes through this.
 */
function orNull<T>(value: T | undefined): T | null {
  return value ?? null;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** A Payload `date` column, as the ISO string every `lib/content/` type
 *  declares. An uncached read can hand back a `Date`; a cached one cannot. */
function isoDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  return text(value);
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * `status == "approved" || !defined(status)` — the loose rule, and the only one
 * correct for this collection. See the header.
 */
const APPROVED_OR_UNSET: Where = {
  or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
};

function and(...parts: (Where | null | undefined)[]): Where | undefined {
  const kept = parts.filter((part): part is Where => Boolean(part));
  if (kept.length === 0) return undefined;
  return kept.length === 1 ? kept[0] : { and: kept };
}

// ---------------------------------------------------------------------------
// Shared row shapes
// ---------------------------------------------------------------------------

/** A `tags` relationship populated to depth >= 1. */
interface TagRow {
  id: string;
  label?: LocalizedRaw;
  value?: string | null;
  color?: string | null;
}

/** A `regionalCommunities` relationship populated to depth >= 1. */
interface CommunityRow {
  id: string;
  name?: LocalizedRaw;
  slug?: string | null;
}

/** A `media` or `files` row behind an upload field, populated to depth >= 1. */
interface AssetRow {
  id?: unknown;
  url?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  lqip?: string | null;
}

function isRow(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

/** `tags[]->{ _id, label, "value": value.current, color }`. */
function tagProjection(rows: unknown): { _id: string; label?: Localized; value?: string; color?: string }[] {
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRow).map((row) => {
    const tag = row as unknown as TagRow;
    return {
      _id: String(tag.id),
      // `orNull` on all three: the GROQ names them, so an unset one is `null`
      // in the projection, not absent. See `orNull`.
      label: orNull(localized(tag.label)),
      value: orNull(text(tag.value)),
      color: orNull(text(tag.color)),
    } as { _id: string; label?: Localized; value?: string; color?: string };
  });
}

/** `region->{ _id, name, "slug": slug.current }`. */
function communityProjection(row: unknown): { _id: string; name?: Localized; slug?: string } | null {
  if (!isRow(row)) return null;
  const community = row as unknown as CommunityRow;
  return { _id: String(community.id), name: localized(community.name), slug: text(community.slug) };
}

/** GROQ's bare `slug`, which is the whole slug object, not `slug.current`. */
function slugObject(value: unknown): { _type: string; current: string } | null {
  const current = text(value);
  return current ? { _type: "slug", current } : null;
}

/** The id behind a relationship, whatever depth it came back at. */
function relationId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (isRow(value)) return text(value.id) ?? (value.id !== undefined ? String(value.id) : undefined);
  return undefined;
}

// ---------------------------------------------------------------------------
// The index (app/[locale]/(main)/lived-experiences/page.tsx)
// ---------------------------------------------------------------------------

interface IndexVideoRow {
  id: string;
  title?: LocalizedRaw;
  format?: string | null;
  videoUrl?: string | null;
  tags?: unknown;
  thumbnail?: { asset?: unknown } | null;
  region?: unknown;
  createdAt?: unknown;
}

/**
 * The whole index in one shape: the videos, the seven communities, and the
 * tags any published lived experience uses.
 *
 * GROQ gets all three in a single round trip because it is one query with three
 * named sub-queries; Payload needs three `find`s. They are issued with
 * `Promise.all` — independent, each separately cached by `query()`, and three
 * serial round trips would treble the page's latency for nothing.
 *
 * Ordering is `_createdAt desc`, and it needs no tie-break: `createdAt` is
 * 35/35 distinct on the published set and Payload preserved Sanity's values
 * verbatim, so the two stores return the identical order. It is applied by
 * Payload (`sort: "-createdAt"`) rather than in JS, because unlike
 * `system.ts`'s three-way `coalesce` there is exactly one column to order by.
 *
 * `regionalCommunities` is `order(order asc, name asc)` in GROQ, and **both
 * keys are inert**: `order` is 0/7 populated and `name` is a localized object,
 * which GROQ cannot order by. Measured against `production_2` (control 29), the
 * result is plain document order — `_id` ascending — so `sort: "id"` here
 * reproduces it exactly rather than inventing an editorial order neither store
 * has. (`orderRank` exists on the Payload collection and would be a *different*
 * order; it is not what the GROQ asks for.)
 */
export async function getLivedExperienceIndex(): Promise<LivedExperienceIndex> {
  const [videos, communities] = await Promise.all([
    query<Paginated<IndexVideoRow>>({
      type: "find",
      collection: "livedExperiences",
      locale: "all",
      // The tag rows, the region row and the thumbnail's media row are all one
      // hop away and all three are projected.
      depth: 1,
      pagination: false,
      sort: "-createdAt",
      where: APPROVED_OR_UNSET,
    }),
    query<Paginated<CommunityRow>>({
      type: "find",
      collection: "regionalCommunities",
      locale: "all",
      depth: 0,
      pagination: false,
      sort: "id",
      select: { name: true, slug: true },
    }),
  ]);

  const videoRows = videos?.docs ?? [];

  // `*[_type == "tag" && count(*[_type == "livedExperience" && references(^._id)]) > 0]`
  // — a reverse lookup, one of the four GROQ constructs with no Payload
  // equivalent. Payload has no `references()`; what it has is the forward edge,
  // and the forward edge is already in hand. Reading the used ids off the rows
  // above rather than issuing a second scan also guarantees the two halves of
  // the page cannot disagree about which tags are in use.
  const usedTagIds = new Set<string>();
  for (const row of videoRows) for (const tag of tagProjection(row.tags)) usedTagIds.add(tag._id);

  const allTags = usedTagIds.size
    ? await query<Paginated<TagRow>>({
        type: "find",
        collection: "tags",
        locale: "all",
        depth: 0,
        pagination: false,
        where: { id: { in: [...usedTagIds] } },
        select: { label: true, value: true, color: true },
      })
    : { docs: [] };

  return {
    videos: videoRows.map((row) => {
      const region = communityProjection(row.region);
      const asset = isRow(row.thumbnail?.asset) ? (row.thumbnail.asset as AssetRow) : undefined;
      // Every one of these is a key the GROQ projects, so an unset field is
      // `null` and not absent — see `orNull`. `title` too: it is required on
      // all 56 documents, and matching the projection matters more than
      // matching the optional type.
      return {
        id: String(row.id),
        title: orNull(localized(row.title)),
        format: orNull(text(row.format) as LivedExperienceIndex["videos"][number]["format"]),
        videoUrl: orNull(text(row.videoUrl)),
        thumbnailUrl: orNull(text(asset?.url)),
        tags: tagProjection(row.tags).map((t) => ({ id: t._id, label: t.label ?? {}, value: t.value, color: t.color })),
        region: region ? { id: region._id, name: region.name ?? {}, slug: region.slug ?? "" } : null,
        // The undereferenced field, in the shape Sanity emits it in — including
        // its key ORDER, which Sanity serializes alphabetically (`_ref` before
        // `_type`) and which reaches the flight payload verbatim. See header.
        rawRegion: relationId(row.region) ? { _ref: relationId(row.region), _type: "reference" } : null,
      } as LivedExperienceIndex["videos"][number];
    }),
    regionalCommunities: (communities?.docs ?? []).map((row) => ({
      id: String(row.id),
      name: localized(row.name) ?? {},
      slug: text(row.slug) ?? "",
    })),
    allTags: (allTags?.docs ?? [])
      .map((row) => ({
        id: String(row.id),
        label: localized(row.label) ?? {},
        value: text(row.value),
        color: text(row.color),
      }))
      // `order(label.en asc)`. Sorted here rather than by Payload for the
      // reason `payload/taxonomy.ts` gives: `sort` names a column, and a
      // localized column is a joined table Payload will not order a
      // `locale: "all"` read by.
      .sort((a, b) => byCodePoint(a.label.en ?? "", b.label.en ?? "")),
  };
}

// ---------------------------------------------------------------------------
// The page-builder carousel block
// ---------------------------------------------------------------------------

interface CarouselRow {
  id: string;
  title?: LocalizedRaw;
  description?: LocalizedRaw;
  issue?: LocalizedRaw;
  personContext?: LocalizedRaw;
  videoLink?: string | null;
  thumbnail?: { asset?: unknown; alt?: LocalizedRaw } | null;
  duration?: string | null;
  publishedAt?: unknown;
  author?: unknown;
  relatedCommunity?: unknown;
  tags?: unknown;
  featured?: boolean | null;
  slug?: string | null;
}

interface AuthorRow {
  id: string;
  name?: string | null;
  image?: unknown;
  organizationalAffiliation?: string | null;
}

/**
 * The carousel's four filters, translated one at a time.
 *
 * Three are mechanical. The fourth is not, and is reproduced rather than
 * repaired:
 *
 *   `_id in *[_type == "regionalCommunity" && _id in $communities].members[].person._ref`
 *
 * That tests the *lived experience's own id* against the person references in
 * those communities' member lists — an id space it can never belong to, so the
 * filter matches nothing whenever it is active. It is reproduced here as
 * written (read the named communities, collect `members[].person`, filter on
 * membership of that set) because a swap is not the place to change what a
 * filter selects. It is also unreachable on this dataset: `members` is `null`
 * on all seven communities, and **zero pages carry a `lived-experiences-carousel`
 * block**, so the block never renders at all today.
 */
async function carouselWhere(filters: LivedExperienceCarouselFilters): Promise<Where | undefined> {
  const parts: Where[] = [APPROVED_OR_UNSET];

  if (filters.communities?.length) {
    const communities = await queryPreviewable<Paginated<{ members?: { person?: unknown }[] | null }>>({
      type: "find",
      collection: "regionalCommunities",
      depth: 0,
      pagination: false,
      where: { id: { in: filters.communities } },
      select: { members: true },
    });
    const people = (communities?.docs ?? []).flatMap((row) =>
      (row.members ?? []).map((member) => relationId(member?.person)).filter((id): id is string => Boolean(id)),
    );
    // `in` against an empty list matches nothing, which is what the GROQ does.
    parts.push({ id: { in: people } });
  }
  if (filters.tags?.length) parts.push({ tags: { in: filters.tags } });
  if (filters.authors?.length) parts.push({ author: { in: filters.authors } });
  // `!defined($featured) || $featured == false || featured == true` — the
  // domain module always binds `$featured`, so the middle arm is the switch:
  // false means "no filter", true means "featured only".
  if (filters.featured) parts.push({ featured: { equals: true } });

  return and(...parts);
}

/**
 * `queryPreviewable`, not `query` — for the reason the domain module records at
 * length: the original inline `sanityFetch` omitted `perspective`/`stega`, so
 * the block follows `draftMode()` and stays visible in draft preview on a page
 * whose own reads are previewable. Swapping in `query` would silently end that.
 */
export async function getLivedExperiencesCarousel(
  filters: LivedExperienceCarouselFilters,
): Promise<LivedExperienceCarouselItem[]> {
  const where = await carouselWhere(filters);
  const result = await queryPreviewable<Paginated<CarouselRow>>({
    type: "find",
    collection: "livedExperiences",
    locale: "all",
    depth: 1,
    // `order(publishedAt desc) [0...$maxItems]`. 35/35 distinct, so no
    // tie-break is needed and none was added to either backend.
    sort: "-publishedAt",
    limit: filters.maxItems ?? 10,
    pagination: false,
    where,
  });

  return (result?.docs ?? []).map((row) => {
    const author = isRow(row.author) ? (row.author as unknown as AuthorRow) : undefined;
    const community = communityProjection(row.relatedCommunity);
    const asset = isRow(row.thumbnail?.asset) ? (row.thumbnail.asset as AssetRow) : undefined;
    return {
      _id: String(row.id),
      // The GROQ projects `_type` verbatim; Payload has no `_type` column, and
      // `lived-experiences-carousel.tsx` keys its links off it.
      _type: "livedExperience",
      title: localized(row.title),
      description: localized(row.description),
      issue: localized(row.issue),
      personContext: localized(row.personContext),
      videoLink: orNull(text(row.videoLink)),
      thumbnail: asset
        ? {
            asset: { _id: String(asset.id), url: asset.url ?? null, mimeType: asset.mimeType ?? null },
            alt: localized(row.thumbnail?.alt)?.en ?? null,
          }
        : null,
      duration: orNull(text(row.duration)),
      publishedAt: orNull(isoDate(row.publishedAt)),
      author: author
        ? {
            _id: String(author.id),
            name: author.name ?? "",
            image: orNull(author.image),
            organizationalAffiliation: orNull(text(author.organizationalAffiliation)),
          }
        : null,
      relatedCommunity: community
        ? { _id: community._id, name: orNull(community.name), slug: slugObject(community.slug) }
        : null,
      tags: tagProjection(row.tags).map((t) => ({ _id: t._id, label: t.label, color: t.color })),
      featured: orNull(row.featured),
      slug: slugObject(row.slug),
    } as unknown as LivedExperienceCarouselItem;
  });
}

// ---------------------------------------------------------------------------
// Submit-form option lists
// ---------------------------------------------------------------------------

/** `*[_type == "tag"] | order(label.en asc) { _id, label, "value": value.current }`. */
export async function getAvailableLivedExperienceTags(): Promise<LivedExperienceTagOption[]> {
  const result = await query<Paginated<TagRow>>({
    type: "find",
    collection: "tags",
    locale: "all",
    depth: 0,
    pagination: false,
    select: { label: true, value: true },
  });
  return (result?.docs ?? [])
    .map((row) => ({ _id: String(row.id), label: localized(row.label), value: text(row.value) }))
    .sort((a, b) => byCodePoint(a.label?.en ?? "", b.label?.en ?? ""));
}

/** `*[_type == "regionalCommunity" && active == true] | order(name.en asc)`. */
export async function getActiveRegionalCommunities(): Promise<LivedExperienceCommunityOption[]> {
  const result = await query<Paginated<CommunityRow>>({
    type: "find",
    collection: "regionalCommunities",
    locale: "all",
    depth: 0,
    pagination: false,
    where: { active: { equals: true } },
    select: { name: true, slug: true },
  });
  return (result?.docs ?? [])
    .map((row) => ({
      _id: String(row.id),
      name: localized(row.name) ?? {},
      slug: text(row.slug) ? { current: String(row.slug) } : undefined,
    }))
    .sort((a, b) => byCodePoint((a.name as Localized).en ?? "", (b.name as Localized).en ?? ""));
}

// ---------------------------------------------------------------------------
// The gated read that feeds the write
// ---------------------------------------------------------------------------

/**
 * The raw projection `loadEditableLivedExperience` gates on. Deliberately the
 * same shape the GROQ returns, and deliberately no decisions of its own — see
 * the header.
 */
export interface RawEditableDoc {
  _id: string;
  language?: string;
  title?: Localized;
  description?: Localized;
  issue?: Localized;
  personContext?: Localized;
  videoSource?: string;
  videoLink?: string;
  body?: RichText;
  submittedBy?: string;
  status?: string | null;
  reviewNotes?: string | null;
  regionalCommunityId?: string;
  tagIds?: string[];
  hasVideoFile?: boolean;
}

interface EditableRow {
  id: string;
  title?: LocalizedRaw;
  description?: LocalizedRaw;
  issue?: LocalizedRaw;
  personContext?: LocalizedRaw;
  videoSource?: string | null;
  videoLink?: string | null;
  body?: Partial<Record<string, unknown>> | null;
  submittedBy?: string | null;
  moderationStatus?: string | null;
  reviewNotes?: string | null;
  relatedCommunity?: unknown;
  tags?: unknown;
  videoFile?: unknown;
}

const LOCALES: PayloadLocale[] = ["en", "es", "fr", "ar"];

/**
 * Which locale a submission was written in.
 *
 * Sanity stores it in a `language` field; Payload does not model one, because
 * Payload's own locale mechanism *is* that fact — a document submitted in
 * Spanish has `title.es` populated and the rest null
 * (`payload/collections/lived-experiences.ts` records the decision). So the
 * language is read back off the content rather than invented: the first locale
 * carrying a title, `en` first, which is what every one of the 56 real
 * documents answers. `fallbackLocale: false` on the read is what makes this
 * meaningful — with Payload's `fallback: true`, every locale would carry the
 * English title and this would always answer `en`.
 */
function submissionLanguage(title: LocalizedRaw): string | undefined {
  for (const locale of LOCALES) if (text(title?.[locale])) return locale;
  return undefined;
}

/**
 * One document, every version visible, uncached.
 *
 * `queryRaw`, and nothing else — see the header. No `drafts.` prefix to match:
 * in Payload the draft is a version of this same id, and `queryRaw`'s
 * `draft: true` is what overlays it.
 */
export async function loadEditableDoc(id: string): Promise<RawEditableDoc | null> {
  const row = await queryRaw<EditableRow | null>({
    type: "findByID",
    collection: "livedExperiences",
    id,
    locale: "all",
    // See `submissionLanguage`: the whole point of reading every locale is to
    // see which ones are really populated.
    fallbackLocale: false,
    depth: 0,
  });
  if (!row) return null;

  const title = localized(row.title);
  return {
    _id: String(row.id),
    language: submissionLanguage(row.title),
    title,
    description: localized(row.description),
    issue: localized(row.issue),
    personContext: localized(row.personContext),
    videoSource: text(row.videoSource),
    videoLink: text(row.videoLink),
    // `body` is Lexical here and Portable Text everywhere above the seam. Read
    // at `locale: "all"`, so the submission language's state is the one to
    // convert; 0/56 documents carry a body today.
    body: portableText(row.body?.[submissionLanguage(row.title) ?? "en"]),
    submittedBy: text(row.submittedBy),
    // `moderationStatus`, verbatim. NOT `_status`, and `"draft"` is not
    // synthesised onto it. See the header.
    status: row.moderationStatus ?? null,
    reviewNotes: row.reviewNotes ?? null,
    regionalCommunityId: relationId(row.relatedCommunity),
    tagIds: Array.isArray(row.tags)
      ? row.tags.map(relationId).filter((tagId): tagId is string => Boolean(tagId))
      : [],
    // `defined(videoFile.asset)` in Sanity; in Payload the upload field sits
    // directly on the document, with no `asset` wrapper.
    hasVideoFile: Boolean(row.videoFile),
  };
}

/**
 * The narrower gate `submitLivedExperience` runs before a resubmission.
 *
 * The same three facts, from the same primitive, as the GROQ's
 * `{_id, submittedBy, status, "hasVideoFile": defined(videoFile.asset)}`. It is
 * a separate read rather than a call to `loadEditableDoc` because that is what
 * the Sanity side does — a second, narrower query — and because the wider one
 * would convert a Lexical body nobody is about to look at.
 *
 * `queryRaw` again, for the same reason and with the same consequence if it
 * were `queryLive`: a resubmission of an unpublished draft would stop being
 * possible, and a permission question would start being answered by a
 * different document than the one about to be written.
 */
export async function loadExistingSubmission(
  id: string,
): Promise<{ _id: string; submittedBy?: string; status?: string | null; hasVideoFile?: boolean } | null> {
  const row = await queryRaw<{
    id: string;
    submittedBy?: string | null;
    moderationStatus?: string | null;
    videoFile?: unknown;
  } | null>({
    type: "findByID",
    collection: "livedExperiences",
    id,
    depth: 0,
  });
  if (!row) return null;
  return {
    _id: String(row.id),
    submittedBy: text(row.submittedBy),
    // `moderationStatus`, not `_status`. See the header.
    status: row.moderationStatus ?? null,
    hasVideoFile: Boolean(row.videoFile),
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * A submission in this module's own vocabulary — neither store's.
 *
 * The intricate part of `submitLivedExperience` is not the document shape, it
 * is deciding *which fields carry a value and which are cleared* on a
 * resubmission. That decision is computed once, in the domain module, and
 * handed to whichever backend is active as this neutral record. Each backend
 * then does nothing but name its own fields. Two copies of the decision would
 * be two chances to disagree about whether an edit deletes someone's video.
 */
export interface SubmissionDraft {
  language: "en" | "es" | "fr" | "ar";
  title: string;
  description?: string;
  issue?: string;
  personContext?: string;
  videoSource?: "youtube" | "vimeo" | "upload";
  videoLink?: string;
  body?: RichText;
  /** A `regionalCommunity` id, bound to `relatedCommunity`. */
  community?: string;
  /** `tag` ids. */
  tags?: string[];
  /** An already-uploaded asset's id. */
  videoAsset?: string;
}

/** The fields a resubmission clears, named in the same vocabulary. */
export type SubmissionField = keyof Omit<SubmissionDraft, "language" | "title">;

/** The neutral names, as Payload's own field names. */
const PAYLOAD_FIELD: Record<SubmissionField, string> = {
  description: "description",
  issue: "issue",
  personContext: "personContext",
  videoSource: "videoSource",
  videoLink: "videoLink",
  body: "body",
  community: "relatedCommunity",
  tags: "tags",
  videoAsset: "videoFile",
};

/**
 * The set half of a write.
 *
 * Localized fields are plain strings here, not `{en: "…"}` objects, because the
 * write names a `locale` and Payload assigns to that locale. There is a real
 * difference from Sanity in this: Sanity's patch replaces the whole `title`
 * object, so editing an English submission *deletes* any Spanish translation of
 * it; Payload writes only the named locale and leaves the others. Payload's is
 * the better behaviour and it is unobservable on this data — 56/56 documents
 * populate exactly one locale — but it is a difference, so it is written down.
 */
function payloadData(draft: SubmissionDraft): Record<string, unknown> {
  const data: Record<string, unknown> = {
    title: draft.title,
    description: draft.description,
    issue: draft.issue,
    personContext: draft.personContext,
    featured: false,
    // Never trust the client: always pending on submit, exactly as the Sanity
    // path forces `status: "pending"`.
    moderationStatus: "pending",
  };
  if (draft.videoSource) data.videoSource = draft.videoSource;
  if (draft.videoLink) data.videoLink = draft.videoLink;
  // Portable Text in, Lexical stored. `lexicalToPortableText` is the inverse,
  // and `loadEditableDoc` above uses it, so a body survives a reopen.
  if (draft.body) data.body = portableTextToLexical(draft.body);
  if (draft.community) data.relatedCommunity = draft.community;
  if (draft.tags) data.tags = draft.tags;
  if (draft.videoAsset) data.videoFile = draft.videoAsset;
  return data;
}

/**
 * Create a new submission.
 *
 * Published, not a draft: the Sanity original calls `writeClient.create` with a
 * plain id, which makes a live document whose invisibility comes entirely from
 * `moderationStatus: "pending"` failing the read filter. Creating a Payload
 * draft instead would hide it a second way and would put a brand-new submission
 * somewhere the moderation queue does not look.
 */
export async function createSubmission(
  draft: SubmissionDraft,
  meta: { slug: string; submittedBy: string; publishedAt: string },
): Promise<{ id: string }> {
  return createDocument({
    collection: "livedExperiences",
    locale: draft.language,
    draft: false,
    data: {
      ...payloadData(draft),
      // Sanity mints its own `_id`; Payload's `id` column is a text column
      // carrying Sanity's, so a new document needs one. The slug is unique and
      // is what every route addresses this content by.
      id: meta.slug,
      slug: meta.slug,
      submittedBy: meta.submittedBy,
      publishedAt: meta.publishedAt,
    },
  });
}

/**
 * Patch an existing submission. `unset` names the fields to clear.
 *
 * `draft: true`, and this is the one write-path decision that is a judgment
 * rather than a translation. Sanity patches whatever id the raw lookup found,
 * and when a draft exists that is `drafts.<id>` — document order puts it first
 * — so the common Sanity path already leaves the published copy alone. Payload
 * expresses the same thing as a new draft version. Where Sanity found no draft
 * and patched the live document, Payload is stricter: the public copy does not
 * change while the resubmission is in review. That is the safer direction for a
 * moderation flow, and it is recorded here rather than discovered later.
 */
export async function updateSubmission(
  id: string,
  draft: SubmissionDraft,
  unset: SubmissionField[],
): Promise<void> {
  await updateDocument({
    collection: "livedExperiences",
    id,
    locale: draft.language,
    draft: true,
    data: {
      ...payloadData(draft),
      ...Object.fromEntries(unset.map((field) => [PAYLOAD_FIELD[field], null])),
    },
  });
}

// ---------------------------------------------------------------------------
// The detail page
// ---------------------------------------------------------------------------

interface DetailRow extends CarouselRow {
  format?: string | null;
  layout?: string | null;
  videoSource?: string | null;
  videoFile?: unknown;
  body?: Partial<Record<string, unknown>> | null;
  organizations?: unknown;
  region?: unknown;
}

interface OrganizationRow {
  id: string;
  name?: LocalizedRaw;
  slug?: string | null;
  acronym?: string | null;
}

/**
 * One published, approved lived experience by slug.
 *
 * `depth: 2` rather than 1: the thumbnail's `media` row and the body's embedded
 * `media` rows are one hop past the document, and `portableText()` needs the
 * row itself to rebuild Sanity's `asset->{…}` projection.
 */
export async function getLivedExperienceBySlug(slug: string): Promise<LivedExperienceDetail | null> {
  const result = await query<Paginated<DetailRow>>({
    type: "find",
    collection: "livedExperiences",
    locale: "all",
    depth: 2,
    limit: 1,
    pagination: false,
    where: and({ slug: { equals: slug } }, APPROVED_OR_UNSET),
  });
  const row = result?.docs?.[0];
  if (!row) return null;

  const author = isRow(row.author) ? (row.author as unknown as AuthorRow) : undefined;
  const community = communityProjection(row.relatedCommunity);
  const thumbnailAsset = isRow(row.thumbnail?.asset) ? (row.thumbnail.asset as AssetRow) : undefined;
  const videoFile = isRow(row.videoFile) ? (row.videoFile as AssetRow) : undefined;
  const body = row.body?.en ?? row.body?.[LOCALES.find((l) => row.body?.[l]) ?? "en"];

  // `orNull` throughout, for the reason `orNull` gives: DETAIL_QUERY names every
  // one of these, so on a document that does not set one GROQ emits the key
  // with `null` — and React writes an absent prop into the flight payload as
  // `"$undefined"`, which is a different byte string. Measured on this very
  // route: `author.organizationalAffiliation` is unset on all 56 documents, and
  // the detail page renders it as the third child of a `<p>`, where `null` and
  // `"$undefined"` were the whole of the remaining diff.
  return {
    _id: String(row.id),
    title: orNull(localized(row.title)),
    format: orNull(text(row.format) as LivedExperienceDetail["format"]),
    layout: orNull(text(row.layout) as LivedExperienceDetail["layout"]),
    description: orNull(localized(row.description)),
    issue: orNull(localized(row.issue)),
    personContext: orNull(localized(row.personContext)),
    slug: slugObject(row.slug),
    videoLink: orNull(text(row.videoLink)),
    videoSource: orNull(text(row.videoSource) as LivedExperienceDetail["videoSource"]),
    videoFileUrl: orNull(text(videoFile?.url)),
    // `body[]{…}` on an unset body is `null`, not `[]` — and `portableText`
    // answers `[]`, which `PortableTextRenderer` treats identically but which
    // is not the same bytes. 0/56 documents carry a body.
    body: orNull(body === undefined || body === null ? undefined : portableText(body)),
    duration: orNull(text(row.duration)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    thumbnail: thumbnailAsset
      ? {
          asset: {
            _id: String(thumbnailAsset.id),
            url: thumbnailAsset.url ?? "",
            mimeType: orNull(text(thumbnailAsset.mimeType)),
            metadata: {
              lqip: orNull(text(thumbnailAsset.lqip)),
              dimensions:
                typeof thumbnailAsset.width === "number" && typeof thumbnailAsset.height === "number"
                  ? { width: thumbnailAsset.width, height: thumbnailAsset.height }
                  : null,
            },
          },
          alt: orNull(localized(row.thumbnail?.alt)?.en),
        }
      : null,
    author: author
      ? {
          _id: String(author.id),
          name: orNull(text(author.name)),
          organizationalAffiliation: orNull(text(author.organizationalAffiliation)),
        }
      : null,
    relatedCommunity: community
      ? { _id: community._id, name: orNull(community.name), slug: slugObject(community.slug) }
      : null,
    organizations: Array.isArray(row.organizations) && row.organizations.length > 0
      ? row.organizations.filter(isRow).map((org) => {
          const organization = org as unknown as OrganizationRow;
          return {
            _id: String(organization.id),
            name: orNull(localized(organization.name)),
            slug: slugObject(organization.slug),
            acronym: orNull(text(organization.acronym)),
          };
        })
      : null,
    tags: tagProjection(row.tags),
    // No Payload field, 0/56 populated in Sanity — so `null`, which is what
    // `relatedContent[]{…}` projects on a document that has none. See the header.
    relatedContent: null,
  } as unknown as LivedExperienceDetail;
}

/** Every published, approved slug — `generateStaticParams`'s whole input. */
export async function getLivedExperienceSlugs(): Promise<{ slug: string }[]> {
  const result = await query<Paginated<{ slug?: string | null }>>({
    type: "find",
    collection: "livedExperiences",
    depth: 0,
    pagination: false,
    sort: "id",
    where: and({ slug: { exists: true } }, APPROVED_OR_UNSET),
    select: { slug: true },
  });
  return (result?.docs ?? [])
    .filter((row) => text(row.slug))
    .map((row) => ({ slug: String(row.slug) }));
}

// ---------------------------------------------------------------------------
// The OG card
// ---------------------------------------------------------------------------

/**
 * `{ title, "region": relatedCommunity->name.en }`.
 *
 * Note the field: the GROQ dereferences `relatedCommunity`, which is 0/56
 * populated, **not** `region`, which is 42/56. So this answers `null` for the
 * region on every real document, on both backends. That is today's behaviour
 * and this task does not change it — pointing it at `region` would put a
 * community name on every OG card that has never carried one.
 *
 * Unlike every other read here, this one carries **no moderation filter**: the
 * GROQ matches on slug alone. Reproduced as written; the route it feeds is
 * reached only from a page that already 404s for an unapproved document.
 */
export async function getLivedExperienceOgData(slug: string): Promise<LivedExperienceOgData | null> {
  const result = await query<Paginated<{ title?: LocalizedRaw; relatedCommunity?: unknown }>>({
    type: "find",
    collection: "livedExperiences",
    locale: "all",
    depth: 1,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
    select: { title: true, relatedCommunity: true },
  });
  const row = result?.docs?.[0];
  if (!row) return null;
  const community = communityProjection(row.relatedCommunity);
  return {
    title: (localized(row.title) as Record<string, string> | undefined) ?? null,
    region: community?.name?.en ?? null,
  };
}
