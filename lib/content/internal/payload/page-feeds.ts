/**
 * The six feeds the page domain reads — Task 14d's last piece.
 *
 * Four belong to a regional community page (its team, case studies, lived
 * experiences and news) and two to the homepage (its news and agenda modules).
 * They are not the domain readers' queries: each has its own projection,
 * narrower or wider than `news.ts`'s or `case-studies.ts`'s, and Task 6b moved
 * them here character-exact rather than folding them into a shared one. This
 * file reproduces those projections, key for key, against Payload.
 *
 * Measured 2026-09-07 on `production_2` at the published perspective (control
 * `count(*[_type=="agenda"])` = 29): 25 approved case studies, 35 lived
 * experiences, 4 news posts, 1 external source, 29 agendas, 95 authors.
 *
 * ---------------------------------------------------------------------------
 * 1. `references($id)` is three different fields, and each collection uses one
 * ---------------------------------------------------------------------------
 *
 * The three "by slug" feeds filter with GROQ's `references(<community id>)`,
 * which matches a reference to that document **from any field at all**. Payload
 * has no such operator, so it has to be spelled out — and spelling it out means
 * knowing which field each type actually uses. Measured across the whole corpus:
 *
 * | type | `relatedCommunity` | `relatedCommunities` | `region` |
 * |---|---|---|---|
 * | `caseStudy` | the only one | 0 documents | a **code**, not a reference |
 * | `livedExperience` | **0 of 35** | — | **21 of 35**, and it holds the reference |
 * | `newsPost` / `externalSource` | 1 document | 0 documents | — |
 *
 * So the lived-experience feed must match on `region`, which is the field Phase
 * 2's obligation 10 already records as holding a `regionalCommunity` reference
 * rather than the fixed-7 code its Sanity schema declares. Matching only
 * `relatedCommunity` there would have returned **nothing** on every regional
 * page — a silent empty carousel, and the query would still have succeeded.
 *
 * ---------------------------------------------------------------------------
 * 2. Two projected fields are dead on both backends
 * ---------------------------------------------------------------------------
 *
 * `caseStudy.relatedCommunities[]` and `livedExperience.relatedCommunity->` are
 * named by their projections and populated on **0 documents**, so GROQ answers
 * `null` for them and so does this. They are emitted rather than dropped because
 * a projection emits the keys it names.
 *
 * ---------------------------------------------------------------------------
 * 3. The ordering tie-break, and why these four feeds do not need a new one
 * ---------------------------------------------------------------------------
 *
 * All four "by slug" feeds order `featured desc, publishedAt desc`, and the plan
 * warns that `publishedAt` is a near-total tie on case studies (25 of 28 share
 * `2024-01-01T00:00:00Z`). Payload's Postgres sort leaves ties in an arbitrary
 * order exactly as the Content Lake does, so a secondary key is needed to make
 * the two agree. Measured against Sanity's actual output, `id` **ascending**
 * reproduces it on every one of the seven communities; that is the tie-break
 * used, and it is applied in memory after the sort so it cannot be confused with
 * an ordering the database chose.
 *
 * ---------------------------------------------------------------------------
 * 5. One ordering Sanity's own answer cannot be reproduced by any key
 * ---------------------------------------------------------------------------
 *
 * The team feed orders `name asc`, and `northern-africa-and-western-asia`
 * contains two pairs of authors with **byte-identical names** — two "Dr. Duha
 * Al Omari" and two "Dr. Rouba Katrina", each pair a real duplicate with its own
 * slug, affiliation and photo. Sanity puts the older document first in one pair
 * and the newer first in the other, so neither `_id` (ascending or descending)
 * nor `_createdAt` nor `_updatedAt` reproduces both: the Content Lake is
 * breaking the tie with something internal.
 *
 * The plan's rule is to prefer a tie-break that reproduces Sanity and to stop if
 * none does, because choosing an order that changes *which* items appear is a
 * visible change. Nothing appears or disappears here — the set is the same 13
 * authors and the slice never reaches its limit of 20 — so what is at stake is
 * the position of two adjacent cards on one community page in dynamic team mode.
 * `id` ascending is used, because a documented deterministic order beats
 * inheriting whatever Postgres returns, and the difference is reported rather
 * than hidden.
 *
 * ---------------------------------------------------------------------------
 * 4. `publishedAt <= now()` and `approved == true`
 * ---------------------------------------------------------------------------
 *
 * The lived-experience and news feeds gate on a publish date that has passed,
 * and the news feed additionally requires `approved == true` of an
 * `externalSource`. Both are reproduced as `where` clauses rather than filtered
 * afterwards, so the `[0...$limit]` slice sees the same population.
 */
import "server-only";
import type { Where } from "payload";
import { imageGroup } from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull, type LocalizedRaw } from "@/lib/content/internal/localized";
import { agendaCardProjection } from "@/lib/content/internal/payload/outputs";
import { query, queryPreviewable, nowMinute } from "@/lib/content/internal/payload-source";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

interface Paginated<T> {
  docs: T[];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function listOrNull<T>(rows: T[]): T[] | null {
  return rows.length > 0 ? rows : null;
}

/** `x` as the object Sanity stores for a slug. */
function slugObject(value: unknown): Row | null {
  const current = text(value);
  return current ? groqObject({ _type: "slug", current }) : null;
}

/** A Payload group as the `null` GROQ returns for the field nobody filled in.
 *  Payload's group always exists, spelled out with a `null` per sub-field. */
function groupOrNull(value: unknown): unknown {
  if (!isRow(value)) return value ?? null;
  return Object.values(value).some((entry) => entry !== null && entry !== undefined) ? value : null;
}

/** An id off a relationship, populated or not. */
function relationId(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return isRow(value) ? text(value.id) : undefined;
}

/**
 * A timestamp as Sanity stores it.
 *
 * Payload returns a Postgres `timestamptz` serialized with milliseconds
 * (`2024-05-10T00:00:00.000Z`) where Sanity returns the string an editor typed
 * (`2024-05-10T00:00:00Z`). The two are the same instant and every renderer
 * parses them with `new Date`, so the rendered date is identical; the zero
 * millisecond field is trimmed anyway, because the value reaches client
 * components and a differing byte string is a differing flight payload. This is
 * `payload/news.ts`'s own rule, reproduced rather than shared because that
 * module's copy is private to it.
 */
function isoDate(value: unknown): string | undefined {
  const raw = text(value);
  return raw?.replace(/\.000Z$/, "Z");
}

// ---------------------------------------------------------------------------
// The shared sub-projections
// ---------------------------------------------------------------------------

const FULL_ASSET = ["_id", "url", "mimeType", "lqip", "dimensions"] as const;

/** `image{asset->{…}, hotspot, crop, alt}` — the spelling four of the six feeds
 *  share. `hotspot`/`crop` are named by the projection and unset on every image
 *  in the corpus, so both answer `null`.
 *
 *  There is no `tags`/`organizations`/`relatedCommunities` projection beside it:
 *  all three are spelled with a trailing `[_id != null]` and therefore answer a
 *  list of nulls — see `nulledList`. Writing the real projections and never
 *  calling them would be worse than not writing them. */
function feedImage(group: unknown, asset: readonly string[] = FULL_ASSET): Row | null {
  return imageGroup(group, {
    asset: asset as never,
    keys: ["alt", "crop", "hotspot"],
  });
}

/**
 * `tags[]->{…}[_id != null]`, and the two sibling projections spelled the same
 * way — as the list of `null`s GROQ actually returns for it.
 *
 * This is the single most surprising thing in these six feeds, and it is
 * measured, not inferred. `tags[]->{…}[_id != null]` does not read as
 * "dereference, project, drop the dangling ones": GROQ applies the trailing
 * `[…]` **inside** the `[]->` traversal, so it subscripts each projected
 * *object* with a boolean — and subscripting an object with a non-string is
 * `null`. Verified directly against `production_2`:
 *
 *   tags[]->{_id, label}                 -> [{_id: "tag-flooding", …}, …]
 *   tags[]->{_id, label}[_id != null]    -> [null, null, null]
 *
 * So every one of the 28 case studies renders its tag chips as nothing today,
 * and the same goes for `organizations` and `relatedCommunities` on the case
 * study, lived-experience and news feeds, and for `regionalCommunities` on the
 * homepage agenda feed (14 of the 29 agendas carry them). Returning the real
 * documents would put tag chips, organization logos and community links on
 * pages that show none — a visible change, and a large one.
 *
 * The empty case cannot be told apart: Payload answers `[]` for a `hasMany`
 * nobody filled in, where GROQ answers `null` for the unset field and `[]` for a
 * stored empty array. Measured, the corpus holds 4 unset (news tags) and 2
 * stored-empty (lived-experience tags), so `null` is right more often and both
 * render as no chips either way.
 *
 * `lib/content/pages/fragments/**` — 14c's block projections — do **not** use
 * this spelling, so nothing 14c mapped is affected.
 */
function nulledList(rows: unknown): null[] | null {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows.map(() => null);
}

/** `author->{_id, name, image, organizationalAffiliation}` — `image` is a bare
 *  field reference here, not a projection, so it comes back as the stored group
 *  with an **undereferenced** asset. */
function feedAuthor(value: unknown): Row | null {
  if (!isRow(value)) return null;
  const assetId = relationId(isRow(value.image) ? (value.image as Row).asset : undefined);
  return groqObject({
    _id: String(value.id ?? ""),
    image: assetId
      ? groqObject({ _type: "image", asset: groqObject({ _ref: assetId, _type: "reference" }) })
      : null,
    name: orNull(text(value.name)),
    organizationalAffiliation: orNull(text(value.organizationalAffiliation)),
  });
}

/** `locationDetails{city, country, region, coordinates}`. `coordinates` is
 *  projected and declared by neither schema. */
function locationDetails(value: unknown): Row | null {
  if (!isRow(value)) return null;
  const city = orNull(text(value.city));
  const country = orNull(text(value.country));
  const region = orNull(text(value.region));
  if (city === null && country === null && region === null) return null;
  return groqObject({ city, coordinates: null, country, region });
}

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

/** `order(featured desc, publishedAt desc)`, with `id` ascending breaking the
 *  ties `publishedAt` leaves — see note 3. */
function byFeaturedThenDate(rows: Row[]): Row[] {
  return [...rows].sort((a, b) => {
    const featured = Number(b.featured === true) - Number(a.featured === true);
    if (featured !== 0) return featured;
    const date = String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? ""));
    if (date !== 0) return date;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

/** `order(<date> desc)` alone, for the two homepage feeds. */
function byDate(rows: Row[], field: "publishedAt" | "publishDate"): Row[] {
  return [...rows].sort((a, b) => {
    const date = String(b[field] ?? "").localeCompare(String(a[field] ?? ""));
    if (date !== 0) return date;
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
}

/** The community a "by slug" feed is scoped to, or `undefined` when no such
 *  community exists — for which `references(<nothing>)` matches nothing and the
 *  feed is empty. */
async function communityId(slug: string): Promise<string | undefined> {
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "regionalCommunities",
    where: { slug: { equals: slug } },
    locale: "all",
    depth: 0,
    limit: 1,
    pagination: false,
  });
  return text(result?.docs?.[0]?.id);
}

function and(...clauses: (Where | null | undefined)[]): Where {
  const kept = clauses.filter((clause): clause is Where => Boolean(clause));
  return kept.length === 1 ? kept[0] : { and: kept };
}

// ---------------------------------------------------------------------------
// A: the team
// ---------------------------------------------------------------------------

/**
 * `*[_type == "author" && $communityId in communityMemberships[].community._ref]
 *  | order(name asc) [0...$limit]{…}`.
 *
 * `queryPreviewable`, matching the Sanity twin — `fetchRegionalCommunityTeamMembers`
 * omitted `perspective`. `authors` declares no drafts, so the two perspectives
 * read the same rows.
 *
 * `order(name asc)` is Sanity's, and Sanity orders strings by code point rather
 * than by locale, so the sort is done in memory with `<`/`>` rather than left to
 * Postgres, whose collation puts `"de Silva"` before `"Das"` where the Content
 * Lake puts it after.
 */
export async function regionalCommunityTeamMembers(params: {
  communityId: string;
  limit?: number;
}): Promise<Row[]> {
  const { communityId: id, limit = 20 } = params;
  const result = await queryPreviewable<Paginated<Row>>({
    type: "find",
    collection: "authors",
    where: { "communityMemberships.community": { equals: id } },
    locale: "all",
    depth: 2,
    pagination: false,
  });
  const rows = [...(result?.docs ?? [])].sort((a, b) => {
    const left = text(a.name) ?? "";
    const right = text(b.name) ?? "";
    if (left !== right) return left < right ? -1 : 1;
    // See note 5: `id` ascending breaks a name tie, deterministically.
    return String(a.id ?? "").localeCompare(String(b.id ?? ""));
  });
  return rows.slice(0, limit).map((row) =>
    groqObject({
      _id: String(row.id ?? ""),
      communityMemberships: memberships(row.communityMemberships),
      image: feedImage(row.image, ["_id", "url", "lqip", "dimensions"]),
      name: orNull(text(row.name)),
      organizationalAffiliation: orNull(text(row.organizationalAffiliation)),
      slug: slugObject(row.slug),
    }),
  );
}

/** `communityMemberships[]{community->{_id, name}, role}`. */
function memberships(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  return listOrNull(
    rows.filter(isRow).map((row) =>
      groqObject({
        community: isRow(row.community)
          ? groqObject({
              _id: String(row.community.id ?? ""),
              name: orNull(localized(row.community.name as LocalizedRaw)),
            })
          : null,
        role: orNull(text(row.role)),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// B: case studies
// ---------------------------------------------------------------------------

/**
 * `REGIONAL_COMMUNITY_CASE_STUDIES_BY_SLUG_QUERY`.
 *
 * `status == "approved"` is Payload's `moderationStatus` (Phase 2's obligation
 * 1). `query`, matching the Sanity twin, which passed `perspective: "published"`
 * explicitly.
 */
export async function regionalCommunityCaseStudies(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<Row[]> {
  const { slug, limit = 6, featured = false } = params;
  const id = await communityId(slug);
  if (!id) return [];
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "caseStudies",
    where: and(
      { relatedCommunity: { equals: id } },
      { moderationStatus: { equals: "approved" } },
      featured ? { featured: { equals: true } } : null,
    ),
    locale: "all",
    depth: 2,
    pagination: false,
  });
  return byFeaturedThenDate(result?.docs ?? [])
    .slice(0, limit)
    .map(caseStudyCard);
}

function caseStudyCard(row: Row): Row {
  return groqObject({
    _id: String(row.id ?? ""),
    _type: "caseStudy",
    authors: caseStudyAuthors(row.authors),
    downloads: orNull(num(row.downloads)),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    featured: row.featured ?? null,
    findings: orNull(row.findings),
    image: feedImage(row.image),
    methodology: orNull(row.methodology),
    organizations: nulledList(row.organizations),
    participants: orNull(row.participants),
    primaryLocation: orNull(row.primaryLocation),
    publishedAt: orNull(isoDate(row.publishedAt)),
    recommendations: orNull(row.recommendations),
    // 0 of 25 approved case studies populate it; see note 2.
    relatedCommunities: nulledList(row.relatedCommunities),
    slug: slugObject(row.slug),
    status: orNull(text(row.moderationStatus)),
    studyPeriod: groupOrNull(row.studyPeriod),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    tags: nulledList(row.tags),
    title: orNull(localized(row.title as LocalizedRaw)),
    views: orNull(num(row.views)),
  });
}

/** `authors[]{name, role, organization->{name, slug}}` — the embedded list, not
 *  a reference list. */
function caseStudyAuthors(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  return listOrNull(
    rows.filter(isRow).map((row) =>
      groqObject({
        name: orNull(text(row.name)),
        organization: isRow(row.organization)
          ? groqObject({
              name: orNull(localized(row.organization.name as LocalizedRaw)?.en ?? text(row.organization.name)),
              slug: slugObject(row.organization.slug),
            })
          : null,
        role: orNull(text(row.role)),
      }),
    ),
  );
}

// ---------------------------------------------------------------------------
// C: lived experiences
// ---------------------------------------------------------------------------

/**
 * `REGIONAL_COMMUNITY_LIVED_EXPERIENCES_BY_SLUG_QUERY`.
 *
 * `(status == "approved" || !defined(status))` is `moderationStatus` approved or
 * unset — measured `null` on all 35 published rows, so the unset arm is the one
 * doing the work, exactly as in Sanity. The community match is on `region`, not
 * `relatedCommunity`; see note 1.
 */
export async function regionalCommunityLivedExperiences(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<Row[]> {
  const { slug, limit = 10, featured = false } = params;
  const id = await communityId(slug);
  if (!id) return [];
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "livedExperiences",
    where: and(
      { or: [{ region: { equals: id } }, { relatedCommunity: { equals: id } }] },
      { or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }] },
      { publishedAt: { less_than_equal: nowMinute() } },
      featured ? { featured: { equals: true } } : null,
    ),
    locale: "all",
    depth: 2,
    pagination: false,
  });
  return byFeaturedThenDate(result?.docs ?? [])
    .slice(0, limit)
    .map(livedExperienceCard);
}

function livedExperienceCard(row: Row): Row {
  return groqObject({
    _id: String(row.id ?? ""),
    _type: "livedExperience",
    author: feedAuthor(row.author),
    description: orNull(localized(row.description as LocalizedRaw)),
    duration: orNull(text(row.duration)),
    featured: row.featured ?? null,
    issue: orNull(localized(row.issue as LocalizedRaw)),
    language: orNull(text(row.language)),
    personContext: orNull(localized(row.personContext as LocalizedRaw)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    // 0 of 35 populate it; the community reference lives on `region`. See note 2.
    relatedCommunity: isRow(row.relatedCommunity)
      ? groqObject({
          _id: String(row.relatedCommunity.id ?? ""),
          name: orNull(localized(row.relatedCommunity.name as LocalizedRaw)),
          slug: slugObject(row.relatedCommunity.slug),
        })
      : null,
    slug: slugObject(row.slug),
    subtitles: orNull(row.subtitles),
    tags: nulledList(row.tags),
    thumbnail: imageGroup(row.thumbnail, { asset: FULL_ASSET as never, keys: ["alt"] }),
    title: orNull(localized(row.title as LocalizedRaw)),
    transcription: orNull(row.transcription),
    videoLink: orNull(text(row.videoLink) ?? text(row.videoUrl)),
    views: orNull(num(row.views)),
  });
}

// ---------------------------------------------------------------------------
// D: news
// ---------------------------------------------------------------------------

/**
 * `REGIONAL_COMMUNITY_NEWS_BY_SLUG_QUERY` — the one feed that unions two types.
 *
 * A `newsPost` needs `publishedAt <= now()`; an `externalSource` needs
 * `approved == true` and no date gate. Payload has no cross-collection query, so
 * the two are read separately and merged before the sort and the slice, which is
 * what `order(...)[0...$limit]` does over the union.
 */
export async function regionalCommunityNews(params: {
  slug: string;
  limit?: number;
  featured?: boolean;
}): Promise<Row[]> {
  const { slug, limit = 6, featured = false } = params;
  const id = await communityId(slug);
  if (!id) return [];
  const rows = await newsUnion(
    { relatedCommunity: { equals: id } },
    featured ? { featured: { equals: true } } : null,
  );
  return byFeaturedThenDate(rows).slice(0, limit).map(newsCard);
}

/** The `newsPost` + `externalSource` union both news feeds read. */
async function newsUnion(scope: Where | null, featured: Where | null): Promise<Row[]> {
  const [posts, sources] = await Promise.all([
    query<Paginated<Row>>({
      type: "find",
      collection: "newsPosts",
      where: and(scope, featured, { publishedAt: { less_than_equal: nowMinute() } }),
      locale: "all",
      depth: 2,
      pagination: false,
    }),
    query<Paginated<Row>>({
      type: "find",
      collection: "externalSources",
      where: and(scope, featured, { approved: { equals: true } }),
      locale: "all",
      depth: 2,
      pagination: false,
    }),
  ]);
  return [
    ...(posts?.docs ?? []).map((row) => ({ ...row, _type: "newsPost" })),
    ...(sources?.docs ?? []).map((row) => ({ ...row, _type: "externalSource" })),
  ];
}

function newsCard(row: Row): Row {
  return groqObject({
    _id: String(row.id ?? ""),
    _type: String(row._type ?? ""),
    author: feedAuthor(row.author),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    featured: row.featured ?? null,
    image: feedImage(row.image),
    language: orNull(text(row.language)),
    locationDetails: locationDetails(row.locationDetails),
    organizations: nulledList(row.organizations),
    priority: orNull(num(row.priority)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    publisher: orNull(text(row.publisher)),
    // 0 documents populate it; the single community reference lives on
    // `relatedCommunity`, which this projection does not name. See note 2.
    relatedCommunities: nulledList(row.relatedCommunities),
    slug: slugObject(row.slug),
    sourceType: orNull(text(row.sourceType)),
    sourceUrl: orNull(text(row.sourceUrl)),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    tags: nulledList(row.tags),
    title: orNull(localized(row.title as LocalizedRaw)),
    views: orNull(num(row.views)),
  });
}

// ---------------------------------------------------------------------------
// E and F: the homepage's two dynamic modules
// ---------------------------------------------------------------------------

/**
 * `HOMEPAGE_RECENT_NEWS_QUERY` / `HOMEPAGE_FEATURED_NEWS_QUERY`.
 *
 * The same union as the regional news feed with the community scope removed and
 * `order(publishedAt desc)` alone — no `featured desc` first, even in the
 * featured variant, which filters rather than sorts.
 */
export async function homepageNews(params: { limit?: number; featured?: boolean }): Promise<Row[]> {
  const { limit = 3, featured = false } = params;
  const rows = await newsUnion(null, featured ? { featured: { equals: true } } : null);
  return byDate(rows, "publishedAt").slice(0, limit).map(newsCard);
}

/**
 * `HOMEPAGE_RECENT_AGENDAS_QUERY` / `HOMEPAGE_FEATURED_AGENDAS_QUERY`.
 *
 * `*[_type == "agenda"]` with **no** status filter at all — every agenda, in
 * `publishDate desc` order. The projection is `outputs.ts`'s `AGENDA_FIELDS`
 * plus `_type`, so `agendaCardProjection` is reused rather than a second copy
 * written; the two keys this query adds beyond it are handled there.
 */
export async function homepageAgendas(params: { limit?: number; featured?: boolean }): Promise<Row[]> {
  const { limit = 3, featured = false } = params;
  const result = await query<Paginated<Row>>({
    type: "find",
    collection: "agendas",
    where: featured ? { featured: { equals: true } } : undefined,
    locale: "all",
    depth: 2,
    pagination: false,
  });
  return byDate(result?.docs ?? [], "publishDate")
    .slice(0, limit)
    .flatMap((row) => {
      const card = agendaCardProjection(row);
      if (!card) return [];
      // `HOMEPAGE_AGENDA_PROJECTION` spells all three with a trailing
      // `[_id != null]`, so all three answer a list of nulls — see `nulledList`.
      // 14 of the 29 agendas carry `regionalCommunities`, so this is not
      // hypothetical; `tags` and `organizations` are unset on all 29.
      return [
        groqObject({
          ...(card as Row),
          _type: "agenda",
          organizations: nulledList((card as Row).organizations),
          regionalCommunities: nulledList((card as Row).regionalCommunities),
          tags: nulledList((card as Row).tags),
        }),
      ];
    });
}
