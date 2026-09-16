/**
 * The Payload half of `lib/content/news.ts`.
 *
 * Seventeen answers, seventeen unchanged shapes. `news.ts` picks between this
 * file and its own GROQ through `activeBackend("news")`; the `safe()` wrappers,
 * and the deliberate *absence* of one on the six reads whose call sites already
 * carry a try/catch, all stay in the domain module — so a failure degrades, or
 * throws, in exactly the same place on either backend.
 *
 * Measured against `production_2` (published perspective, control
 * `count(*[_type=="agenda"])` = 29 on every query) and the development Payload
 * database, 2026-09-07:
 *
 * | | Sanity | Payload |
 * |---|---|---|
 * | `newsPost` published | 4 | 4 rows, `_status: published` |
 * | distinct `publishedAt` | 4 | 4 |
 * | `externalSource` (all approved) | 1 | 1 |
 * | posts carrying `tags` | 1 (2 tags) | 1 (the same 2) |
 * | posts carrying `relatedCommunity` | 1 (`oceania`) | 1 |
 * | `image` populated | 1 | 1 |
 * | `organizations`, `projects`, `sources`, `locationDetails`, `location`, `priority`, `views`, `meta_title`, `meta_description`, `ogImage` | **0** | 0 |
 * | `language` | 3 x `"en"`, 1 x null | **not modelled** — see below |
 *
 * ---------------------------------------------------------------------------
 * 1. `language` is not a Payload field, and six queries sort by it
 * ---------------------------------------------------------------------------
 *
 * `payload/collections/news-posts.ts` drops `language` deliberately: the field
 * was Sanity's Lane-A "one document per language" marker, and the real data
 * already breaks that intent — the three seed documents set `language: "en"`
 * and populate only `title.en`, while the newest document sets no `language`
 * and populates `title.en` **and** `title.fr` on the same row. Payload's
 * `localized: true` captures both shapes without the marker. The plan lists it
 * among the four things "genuinely unanswerable from Payload", to be accepted
 * rather than worked around.
 *
 * That has three consequences, and each is pinned by a test:
 *
 * **a. The projected field.** `NEWS_POST_FIELDS` names `language`, so GROQ
 * emits it. This reader emits `null` for every row. Nothing renders it:
 * `NewsPostCard` and the detail page take no such prop, and `lib/news-utils.ts`
 * declares `language?: string` on its own `NewsPost` without reading it. The
 * one `language` that IS rendered — `ExternalSourceCard`'s `language` badge —
 * belongs to `externalSource`, where Payload **does** model the field.
 *
 * **b. `order(language == $language desc, publishedAt desc)`, six times.** On
 * Sanity the term is true for the three `"en"` documents and false for the
 * null one, so a caller passing `language: "en"` gets those three first. On
 * Payload the field does not exist, so the term is **constant false** and the
 * order collapses to `publishedAt desc`. The two backends therefore disagree
 * — but only for a caller that passes a language, and **no caller does**:
 * `getFeaturedNews(3)`, `getRegularNews({limit: 50})` and
 * `getAllNews(parseNewsFilters(...))` are every call site in the repository,
 * and `NewsFiltersType` has no `language` key. The divergence is real,
 * unreachable, and written down here rather than discovered later.
 *
 * **c. `getNewsPosts(locale)`'s `language == $language` filter.** Same field,
 * same absence — Payload cannot express it, so the locale argument narrows
 * nothing. `getNewsPosts` has **zero call sites** (documented as dead in
 * `news.ts` itself), so this is unreachable too.
 *
 * ---------------------------------------------------------------------------
 * 2. `ContentTag.value` is flattened, on both backends
 * ---------------------------------------------------------------------------
 *
 * `news.ts:189` binds a bare `value` inside `tags[]->{…}`, and `tag.value` is a
 * Sanity `slug` field — so that projection hands consumers
 * `{_type:"slug", current:"climate-change"}` while Payload's `tags.value` is a
 * flat `text` column. `getApprovedExternalSources`'s tag projection has the
 * same bare binding. Both now project `"value": value.current` on the Sanity
 * side, so the two stores answer the same string.
 *
 * **Unlike `/lived-experiences`, this changes nothing rendered.** Task 9 found
 * that flattening fixed tag filtering there, because `page-client.tsx:82`
 * compared `tag.value` against a URL parameter. On the news surfaces the tag
 * filter is fed by `getNewsTags()`, which **already** projects `value.current`
 * — so `NewsFilters` has always compared a string against a string and has
 * always worked. Nothing on `/news` or `/news/[slug]` reads a news post's tag
 * `value` at all (grepped): the card reads `tags[0].color` and `tags[0].title`,
 * the detail page reads `tag._id`, `tag.label` and `tag.color`.
 *
 * ---------------------------------------------------------------------------
 * 3. Images: why the group carries the media row as well as the asset
 * ---------------------------------------------------------------------------
 *
 * This is the first swapped module whose images are resolved by a **component**
 * rather than by the reader. `news-post-card.tsx:83` calls `imageUrl(image)`
 * and the detail page calls `imageUrl(newsPost.image, {width: 1200, height: 675})`,
 * both on the whole projected group — so the same object has to resolve at two
 * different boxes and the reader cannot pre-resolve it.
 *
 * `payload-image-source.resolveMedia` refuses any object carrying `_id`,
 * `_ref` or `_type`, because a *dereferenced Sanity asset* looks enough like a
 * media row to be accepted and silently answered without its transform (Task 4
 * measured 56 such lines on the homepage). And this projection must carry
 * `asset._id`: `news-post-card.tsx:81` renders the image only
 * `{image?.asset?._id && …}`, so dropping it would blank every news card.
 *
 * So the group is emitted as **both** shapes at once, which `resolveMedia`
 * already documents as supported ("a flat `ContentImage`… the seam's own
 * backend-neutral type"):
 *
 *   - `asset` is Sanity's `asset->{_id, url, mimeType, metadata{lqip, dimensions}}`,
 *     byte-for-byte the projection the renderers read;
 *   - the group itself carries the `media` row's own `url`, `mimeType`,
 *     `width`, `height`, `lqip` and `sizes`, which is what `resolveMedia`
 *     unwraps first — before it ever recurses into `asset` and finds the `_id`.
 *
 * The alternative was to let `imageUrl` fall through to Sanity's builder, which
 * would have produced `cdn.sanity.io` URLs on a route claiming to be served by
 * Payload — a parity run that passes because the swap did not happen.
 *
 * **The image `src` therefore differs between backends, deliberately.** That is
 * the swap, not a regression; the harness does not normalise media URLs.
 *
 * ---------------------------------------------------------------------------
 * 4. Dates: Sanity keeps the authored spelling, Postgres always emits millis
 * ---------------------------------------------------------------------------
 *
 * These strings ARE rendered raw, in three places: `<time datetime>` on both
 * cards, and the detail page's `publishedTime`/`modifiedTime`, which become
 * `<meta property="article:published_time">` and `article:modified_time`.
 *
 * A Sanity `datetime` field returns **the string an editor authored**. Postgres
 * round-trips through `Date` and always emits milliseconds. Measured, and the
 * two collections disagree with each other:
 *
 * | | Sanity | Payload |
 * |---|---|---|
 * | `newsPost._updatedAt` x4 | `…:49Z`, `…:50Z`, `…:51Z`, `…:53Z` | `.000Z` |
 * | `newsPost.publishedAt` x3 | `2024-01-15T00:00:00Z` | `.000Z` |
 * | `newsPost.publishedAt` x1 | `2026-05-20T08:19:37.159Z` | `.159Z` |
 * | `externalSource.publishedAt` x1 | `2026-03-25T09:46:00.000Z` | `.000Z` |
 *
 * **No function of the instant yields both `…00Z` and `…00.000Z`,** so the rule
 * is per collection and it is a reproduction of observed spelling, not a
 * principle:
 *
 * - `newsPost` trims a zero-millisecond suffix. For `_updatedAt` that is right
 *   by construction — it is a Sanity *system* field and those are always
 *   seconds-precision. For `publishedAt` it reproduces all four values,
 *   including the real `.159Z`, which the trim leaves alone.
 * - `externalSource` does not trim: its one document really was authored with
 *   `.000Z`, through the Studio's date picker.
 *
 * The consequence, stated rather than hidden: **a news post authored through
 * the Studio in future would carry `.000Z` in Sanity and be trimmed to `Z`
 * here**, differing by three characters in a `datetime` attribute that every
 * parser reads as the same instant. The alternative was to leave the trim off
 * and diff on every news route today. Phase 4 removes the comparison.
 *
 * ---------------------------------------------------------------------------
 * 5. What GROQ emits that Payload does not store
 * ---------------------------------------------------------------------------
 *
 * `projects` (0/4, and the `project` type has 0 live documents), `priority`
 * and `views` (both 0/4) have no Payload column and are answered `null` —
 * which is what a GROQ projection of an unset field returns. Nothing is
 * reconstructed and **no migration is needed**.
 *
 * `noindex` is the one place the two stores cannot be made identical:
 * Payload's checkbox carries `defaultValue: false`, so an unset document reads
 * `false` where Sanity reads `null`. Both are falsy, `generateMetadata` emits
 * no `robots` tag either way, and the value is not a client prop.
 *
 * The mirror case is Payload's empty containers. An unset `hasMany`
 * relationship, `array` or `select` reads `[]`, and an unset `group` reads an
 * object of nulls, where GROQ's `organizations[]->{…}` / `sources[]{…}` /
 * `locationDetails{…}` all return `null`. Every one of them is collapsed back
 * to `null` here.
 *
 * ---------------------------------------------------------------------------
 * 6. Ordering
 * ---------------------------------------------------------------------------
 *
 * `publishedAt` is 4/4 **distinct**, so unlike case studies there is no tie to
 * break. `id asc` is applied anyway, on both backends, matching Task 7's
 * decision: it changes nothing today and it is what stops a future third
 * document with a duplicated timestamp from making the harness flicker.
 *
 * The ordering is computed here rather than delegated to Payload's `sort`,
 * because three of its terms need semantics Postgres does not give for free:
 * the constant-false `language` term (note 1b), a date comparison by *instant*
 * rather than by text (the two stores spell the same instant differently), and
 * GROQ's codepoint ordering for the `id` tie-break.
 */
import "server-only";
import { imageGroup } from "@/lib/content/internal/image-shape";
import { groqObject, localized, orNull } from "@/lib/content/internal/localized";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { portableText } from "@/lib/content/internal/payload/rich-text";
import { query, queryLive } from "@/lib/content/internal/payload-source";
import type { PayloadFindQuery } from "@/lib/content/internal/payload-source";
import type {
  DynamicNewsOptions,
  NewsExternalSource,
  NewsExternalSourceFilters,
  NewsFilterCommunity,
  NewsFilterTag,
  NewsIndexDoc,
  NewsListFilters,
  NewsOgData,
  NewsPost,
  NewsPostImage,
  RelatedNewsItem,
} from "@/lib/content/news";
import type { Locale, Localized } from "@/lib/content/types";

interface Paginated<T> {
  docs: T[];
}

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/**
 * A Payload `date` column as the ISO string every `lib/content/` type declares,
 * spelled the way Sanity spells it for THIS collection. See note 4.
 */
function isoDate(value: unknown, trimZeroMillis = true): string | undefined {
  const raw = value instanceof Date ? value.toISOString() : text(value);
  return trimZeroMillis ? raw?.replace(/\.000Z$/, "Z") : raw;
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** `order(<date> desc)`, by instant rather than by string — the two stores
 *  spell the same instant differently. A row with no date sorts last, as
 *  GROQ's descending order puts it. */
function byNewestFirst(a: string | undefined, b: string | undefined): number {
  const left = a ? Date.parse(a) : Number.NaN;
  const right = b ? Date.parse(b) : Number.NaN;
  if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
  if (Number.isNaN(right)) return -1;
  return right - left;
}

/** An unset Payload container, as the `null` GROQ projects for it. */
function listOrNull<T>(rows: T[] | undefined): T[] | null {
  return rows && rows.length > 0 ? rows : null;
}

// ---------------------------------------------------------------------------
// GROQ's `match`, for the one pattern shape this module builds
// ---------------------------------------------------------------------------

/**
 * Payload cannot express `lower(title.en) match $p || lower(title.es) match $p …`.
 *
 * A `where` on a localized field resolves against ONE locale — measured in
 * `payload/regions.ts`: `locale: "all"` silently means "the default locale" for
 * a query — so the predicate is applied here, over the `{en,es,fr,ar}` object
 * the read already returns.
 */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * One whitespace-separated glob of the pattern, against one tokenized text.
 *
 * `news.ts` always builds `*${q.toLowerCase()}*`, so the common case is a
 * single glob wildcarded at both ends: "some word contains q". A multi-word `q`
 * splits into several globs, the first carrying the leading `*` and the last
 * the trailing one, and every glob must match some word — which is what GROQ's
 * `match` does with a multi-token pattern.
 */
function matchesGlob(words: string[], glob: string): boolean {
  const prefixWild = glob.startsWith("*");
  const suffixWild = glob.endsWith("*");
  const core = tokenize(glob.replace(/^\*+/, "").replace(/\*+$/, "")).join("");
  if (core.length === 0) return true;
  return words.some((word) => {
    if (prefixWild && suffixWild) return word.includes(core);
    if (prefixWild) return word.endsWith(core);
    if (suffixWild) return word.startsWith(core);
    return word === core;
  });
}

/** `lower(<field>) match $pattern` over several fields — true when ANY of them
 *  matches, which is what the `||` chain in the GROQ says. */
function matchesSearch(values: (string | null | undefined)[], pattern: string): boolean {
  const globs = pattern.toLowerCase().split(/\s+/).filter(Boolean);
  if (globs.length === 0) return true;
  return values.some((value) => {
    if (!value) return false;
    const words = tokenize(value);
    return globs.every((glob) => matchesGlob(words, glob));
  });
}

/** The eight arms `news.ts`'s search predicate names: title and excerpt, in
 *  all four locales. */
function searchableText(row: Row): (string | undefined)[] {
  const title = localized(row.title as LocalizedRaw);
  const excerpt = localized(row.excerpt as LocalizedRaw);
  return [title?.en, title?.es, title?.fr, title?.ar, excerpt?.en, excerpt?.es, excerpt?.fr, excerpt?.ar];
}

// ---------------------------------------------------------------------------
// Sub-projections
// ---------------------------------------------------------------------------

/**
 * `image{ asset->{…}, alt, caption }`, plus the media row itself.
 *
 * The shape, the flattened media row emitted beside it and the reason both are
 * emitted at once all live in `internal/image-shape.ts` — which is also where
 * `alt` collapsing to a bare string is explained (Sanity declares it
 * `type: "string"` on `newsPost` and on `externalSource`). `caption` is
 * projected by the GROQ and declared by **neither** schema, so it is `null` on
 * every document in both stores.
 */
function imageProjection(group: unknown, opts: { caption: boolean }): NewsPostImage | null {
  return imageGroup(group, {
    asset: ["_id", "url", "mimeType", "lqip", "dimensions"],
    keys: opts.caption ? ["alt", "caption"] : ["alt"],
  }) as unknown as NewsPostImage | null;
}

/** `ogImage{ asset->{_id, url} }` — a narrower asset projection than the one
 *  above, and no `alt`/`caption`, exactly as the GROQ writes it. The media row
 *  is still flattened on: `generateMetadata` reads `ogImage.asset.url`
 *  directly, but a future caller passing it to `imageUrl` must not silently
 *  fall through to Sanity. */
function ogImageProjection(group: unknown): NewsPost["ogImage"] | null {
  return imageGroup(group, { asset: ["_id", "url"] }) as unknown as NewsPost["ogImage"] | null;
}

/** Sanity's `slug` field, as the object a bare `slug` projection returns. */
function slugObject(value: unknown): { current: string } | undefined {
  const slug = text(value);
  return slug ? ({ _type: "slug", current: slug } as unknown as { current: string }) : undefined;
}

interface TagRow {
  id?: unknown;
  label?: LocalizedRaw;
  value?: string | null;
  color?: string | null;
  category?: string | null;
}

/**
 * `tags[]->{ _id, label, "value": value.current, color, category }`.
 *
 * `fields` names which keys the caller's GROQ actually projects: the detail and
 * list queries take all five, `getRelatedNews` and `DYNAMIC_NEWS_FIELDS` take
 * `{_id, label, color}`, and `NEWS_INDEX_FIELDS` takes `{label}` alone. A key a
 * projection does not name must be absent, not null.
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
    return Object.fromEntries(fields.map((field) => [field, all[field]]));
  });
  return listOrNull(tags);
}

const FULL_TAG_FIELDS = ["_id", "label", "value", "color", "category"] as const;
const CARD_TAG_FIELDS = ["_id", "label", "color"] as const;

interface AuthorRow {
  id?: unknown;
  name?: string | null;
  image?: unknown;
  bio?: unknown;
  organizationalAffiliation?: string | null;
}

/** `author->{_id, name, image, bio, organizationalAffiliation}`.
 *
 *  `bio` is Portable Text on 2 of 95 authors and is **not modelled** in Payload
 *  (Phase-2 obligation 9, "preserved in the archive only"). It is 0/4 on the
 *  authors these news posts use, and it is projected but rendered nowhere, so
 *  it is answered `null` rather than reconstructed. */
function authorProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const author = row as AuthorRow;
  return {
    _id: String(author.id ?? ""),
    name: orNull(text(author.name)),
    image: imageProjection(author.image, { caption: false }),
    bio: null,
    organizationalAffiliation: orNull(text(author.organizationalAffiliation)),
  };
}

/** `author->{_id, name, image{asset->{_id, url}}}` — `DYNAMIC_NEWS_FIELDS`'s
 *  narrower author, which projects the image's asset rather than the raw
 *  reference and takes neither `bio` nor the affiliation. */
function dynamicAuthorProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const author = row as AuthorRow;
  return {
    _id: String(author.id ?? ""),
    name: orNull(text(author.name)),
    image: ogImageProjection(author.image),
  };
}

interface OrganizationRow {
  id?: unknown;
  name?: LocalizedRaw | string | null;
  slug?: string | null;
  logo?: unknown;
}

/** `name` on `organization` is localized in Payload and a plain string in the
 *  Sanity schema, the same split `image.alt` has — so the `en` arm is the
 *  string both stores answer. 0/4 news posts carry an organization. */
function organizationName(value: unknown): string | null {
  return orNull(localized(value as LocalizedRaw)?.en ?? text(value));
}

function organizationsProjection(rows: unknown, opts: { full: boolean }): Row[] | null {
  if (!Array.isArray(rows)) return null;
  const organizations = rows.filter(isRow).map((raw) => {
    const organization = raw as OrganizationRow;
    if (!opts.full) return { _id: String(organization.id ?? ""), name: organizationName(organization.name) };
    return {
      _id: String(organization.id ?? ""),
      name: organizationName(organization.name),
      slug: orNull(slugObject(organization.slug)),
      logo: ogImageProjection(organization.logo),
    };
  });
  return listOrNull(organizations);
}

/** `relatedCommunity->{_id, name, "slug": slug.current}`. */
function communityProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  return {
    _id: String(row.id ?? ""),
    name: orNull(localized(row.name as LocalizedRaw)),
    slug: orNull(text(row.slug)),
  };
}

/** `locationDetails{city, country, region, coordinates}`.
 *
 *  Payload's `group` always answers, with a null per field, where GROQ returns
 *  `null` for a group nobody filled in — 0/4 here. `coordinates` is projected
 *  by the GROQ and declared by neither schema, so it is `null` whenever the
 *  group itself is present. */
function locationDetailsProjection(row: unknown): Row | null {
  if (!isRow(row)) return null;
  const city = orNull(text(row.city));
  const country = orNull(text(row.country));
  const region = orNull(text(row.region));
  if (city === null && country === null && region === null) return null;
  return { city, country, region, coordinates: null };
}

/** `sources[]{title, url, publisher, date}` — an unset Payload array is `[]`
 *  where GROQ returns `null`. */
function sourcesProjection(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  return listOrNull(
    rows.filter(isRow).map((source) => ({
      title: orNull(text(source.title)),
      url: orNull(text(source.url)),
      publisher: orNull(text(source.publisher)),
      date: orNull(isoDate(source.date)),
    })),
  );
}

// ---------------------------------------------------------------------------
// The news-post projection
// ---------------------------------------------------------------------------

/** `NEWS_POST_FIELDS`, key for key and in the order GROQ emits them. */
function newsPostProjection(row: Row): NewsPost {
  return {
    _id: String(row.id ?? ""),
    _type: "newsPost",
    title: orNull(localized(row.title as LocalizedRaw)),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    slug: orNull(text(row.slug)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    _updatedAt: orNull(isoDate(row.sanityUpdatedAt)),
    featured: orNull(typeof row.featured === "boolean" ? row.featured : undefined),
    image: imageProjection(row.image, { caption: true }),
    author: authorProjection(row.author),
    organizations: organizationsProjection(row.organizations, { full: true }),
    // No Payload column, 0/4 populated in Sanity, and the `project` type has 0
    // live documents. See note 5.
    projects: null,
    locationDetails: locationDetailsProjection(row.locationDetails),
    tags: tagProjection(row.tags, FULL_TAG_FIELDS),
    relatedCommunity: communityProjection(row.relatedCommunity),
    // Note 1a.
    language: null,
    // No Payload column, 0/4 populated in Sanity.
    priority: null,
    views: null,
  } as unknown as NewsPost;
}

/** The relationships `NEWS_POST_FIELDS` dereferences. `depth: 1` resolves all
 *  of them; the image inside `author` needs a second hop, which is why the
 *  detail and list reads run at `depth: 2`. */
const NEWS_POST_DEPTH = 2;

// ---------------------------------------------------------------------------
// Filtering and ordering
// ---------------------------------------------------------------------------

/** `publishedAt <= now()`. A row with no `publishedAt` fails the comparison in
 *  GROQ and is excluded by Payload's `less_than_equal` for the same reason. */
function publishedByNow(): PayloadFindQuery["where"] {
  return { publishedAt: { less_than_equal: new Date().toISOString() } };
}

/** `&&`, flattened. A nested `{and:[{and:[…]}, …]}` means the same thing to
 *  Payload, but the flat form is the one that reads like the GROQ's condition
 *  list — and it is what a test can assert one clause of. */
function and(...clauses: (PayloadFindQuery["where"] | undefined)[]): PayloadFindQuery["where"] {
  const parts: NonNullable<PayloadFindQuery["where"]>[] = [];
  for (const clause of clauses) {
    if (!clause) continue;
    const nested = (clause as { and?: NonNullable<PayloadFindQuery["where"]>[] }).and;
    if (Array.isArray(nested) && Object.keys(clause).length === 1) parts.push(...nested);
    else parts.push(clause);
  }
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : { and: parts };
}

/** The structural half of `NewsListFilters` — everything Payload can express
 *  as a `Where`. `search` is not here; see `matchesSearch`. */
function listWhere(filters: NewsListFilters | undefined): PayloadFindQuery["where"] {
  const clauses: (PayloadFindQuery["where"] | undefined)[] = [publishedByNow()];

  // `count((tags[]->value.current)[@ in $filterTags]) > 0` — "any selected tag
  // matches", which is `in` over the relationship's own `value` column.
  if (filters?.tags?.length) clauses.push({ "tags.value": { in: filters.tags } });
  if (filters?.communities?.length) clauses.push({ "relatedCommunity.slug": { in: filters.communities } });
  if (filters?.dateFrom) clauses.push({ publishedAt: { greater_than_equal: filters.dateFrom } });
  if (filters?.dateTo) clauses.push({ publishedAt: { less_than_equal: filters.dateTo } });

  return and(...clauses);
}

interface SortOptions {
  /** `order(featured desc, …)` — `getAllNews` alone. */
  featuredFirst?: boolean;
  /** The caller's language preference. Constant-false on Payload; note 1b. */
  language?: string;
}

function compareNewsRows(a: Row, b: Row, opts: SortOptions): number {
  // `language == $language desc`. `newsPosts` has no `language` column, so the
  // term is false for both rows and contributes nothing — deliberately written
  // out rather than omitted, so the divergence is visible where it happens.
  if (opts.language) {
    const left = Number(false);
    const right = Number(false);
    if (left !== right) return right - left;
  }
  if (opts.featuredFirst) {
    const left = Number(a.featured === true);
    const right = Number(b.featured === true);
    if (left !== right) return right - left;
  }
  const byDate = byNewestFirst(isoDate(a.publishedAt), isoDate(b.publishedAt));
  if (byDate !== 0) return byDate;
  // Task 7's tie-break. `publishedAt` is 4/4 distinct today, so this never
  // fires; it is here so it cannot start mattering silently.
  return byCodePoint(String(a.id ?? ""), String(b.id ?? ""));
}

/** Every list read in this module: one `find`, then the predicates Payload
 *  cannot express, then the order, then GROQ's slice. */
async function listNewsPosts(
  where: PayloadFindQuery["where"],
  opts: SortOptions & { limit: number; searchPattern?: string; depth?: number; fresh?: boolean },
): Promise<Row[]> {
  const read = opts.fresh ? queryLive : query;
  const result = await read<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
    locale: "all",
    depth: opts.depth ?? NEWS_POST_DEPTH,
    pagination: false,
    where,
  });
  const rows = (result?.docs ?? []).filter((row) =>
    opts.searchPattern ? matchesSearch(searchableText(row), opts.searchPattern) : true,
  );
  return rows.sort((a, b) => compareNewsRows(a, b, opts)).slice(0, opts.limit);
}

// ---------------------------------------------------------------------------
// The listing reads
// ---------------------------------------------------------------------------

export async function getFeaturedNews(limit: number, language?: string): Promise<NewsPost[]> {
  const rows = await listNewsPosts(and({ featured: { equals: true } }, publishedByNow()), { limit, language });
  return rows.map(newsPostProjection);
}

export async function getRegularNews(filters?: NewsListFilters): Promise<NewsPost[]> {
  // `(!defined(featured) || featured == false)`.
  const notFeatured: PayloadFindQuery["where"] = {
    or: [{ featured: { exists: false } }, { featured: { equals: false } }],
  };
  const rows = await listNewsPosts(and(listWhere(filters), notFeatured), {
    limit: filters?.limit || 50,
    language: filters?.language,
    searchPattern: filters?.search ? `*${filters.search.toLowerCase()}*` : undefined,
  });
  return rows.map(newsPostProjection);
}

export async function getAllNews(filters?: NewsListFilters): Promise<NewsPost[]> {
  const rows = await listNewsPosts(listWhere(filters), {
    limit: filters?.limit || 50,
    language: filters?.language,
    featuredFirst: true,
    searchPattern: filters?.search ? `*${filters.search.toLowerCase()}*` : undefined,
  });
  return rows.map(newsPostProjection);
}

/**
 * `getNewsPosts(locale?, limit)` — dead code with zero call sites, kept because
 * `news.ts` keeps it. The `language == $language` filter cannot be expressed
 * (note 1c), so the locale narrows nothing here.
 */
export async function getNewsPosts(locale?: Locale, limit: number = 10): Promise<NewsPost[]> {
  void locale;
  const rows = await listNewsPosts(publishedByNow(), { limit });
  return rows.map(newsPostProjection);
}

// ---------------------------------------------------------------------------
// The detail page
// ---------------------------------------------------------------------------

export async function getNewsPostBySlug(slug: string): Promise<NewsPost | null> {
  const result = await query<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
    locale: "all",
    depth: NEWS_POST_DEPTH,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  });
  const row = result?.docs?.[0];
  if (!row) return null;

  // The detail GROQ has NO `publishedAt <= now()` guard — it matches on slug
  // alone. Reproduced as written.
  const content = row.content as Record<string, unknown> | null | undefined;
  const body = content?.en ?? content?.[["en", "es", "fr", "ar"].find((l) => content?.[l]) ?? "en"];

  return {
    ...newsPostProjection(row),
    // `content[]{…}` on an unset body is `null`, and `portableText` answers
    // `[]` — which the renderer treats identically but which is not the same
    // bytes. `content` is `required: true` on the collection, so this is the
    // defensive arm, not the common one.
    content: orNull(body === undefined || body === null ? undefined : portableText(body)),
    sources: sourcesProjection(row.sources),
    meta_title: orNull(text(row.meta_title)),
    meta_description: orNull(text(row.meta_description)),
    // Payload's checkbox defaults to `false` where an unset Sanity field is
    // `null`. Both falsy; see note 5.
    noindex: orNull(typeof row.noindex === "boolean" ? row.noindex : undefined),
    ogImage: ogImageProjection(row.ogImage),
  } as unknown as NewsPost;
}

/** `*[_type == "newsPost" && defined(slug.current)]{ "slug": slug.current }`.
 *  No `publishedAt` guard and no order in the GROQ; `id asc` is applied so
 *  `generateStaticParams` is at least deterministic. */
export async function getNewsSlugs(): Promise<{ slug: string }[]> {
  const result = await query<Paginated<{ id?: unknown; slug?: string | null }> | null>({
    type: "find",
    collection: "newsPosts",
    depth: 0,
    pagination: false,
    sort: "id",
    where: { slug: { exists: true } },
    select: { slug: true },
  });
  return (result?.docs ?? []).filter((row) => text(row.slug)).map((row) => ({ slug: String(row.slug) }));
}

/**
 * `count((tags[]->_id)[@ in $tags]) > 0`, excluding the post itself.
 *
 * The narrower projection is its own type in `news.ts` rather than a `NewsPost`
 * with more optionals, so it is built separately here too.
 */
export async function getRelatedNews(newsId: string, tags: string[], limit: number): Promise<RelatedNewsItem[]> {
  const result = await query<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
    locale: "all",
    depth: 1,
    pagination: false,
    where: and({ id: { not_equals: newsId } }, publishedByNow(), { tags: { in: tags } }),
  });
  return (result?.docs ?? [])
    .sort((a, b) => compareNewsRows(a, b, {}))
    .slice(0, limit)
    .map((row) => ({
      _id: String(row.id ?? ""),
      title: orNull(localized(row.title as LocalizedRaw)),
      subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
      excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
      slug: orNull(text(row.slug)),
      publishedAt: orNull(isoDate(row.publishedAt)),
      featured: orNull(typeof row.featured === "boolean" ? row.featured : undefined),
      // A narrower image than `NEWS_POST_FIELDS`: `asset->{_id, url, metadata{lqip}}`
      // and `alt`, with no `mimeType`, no `dimensions` and no `caption`.
      image: relatedImageProjection(row.image),
      tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    })) as unknown as RelatedNewsItem[];
}

function relatedImageProjection(group: unknown): Row | null {
  return imageGroup(group, { asset: ["_id", "url", "lqip"], keys: ["alt"] });
}

// ---------------------------------------------------------------------------
// The filter wrapper
// ---------------------------------------------------------------------------

/**
 * `*[_type == "tag" && count(*[_type == "newsPost" && references(^._id)]) > 0]`.
 *
 * Sanity issues 68 correlated sub-queries (one per tag) plus one more per
 * surviving tag for the count. Payload gets the same answer from two reads:
 * every published news post's tag list, tallied here, then the tag rows those
 * ids name. `references()` can only be satisfied through `tags` for a tag
 * document — a news post's other references point at authors, organizations
 * and regional communities — so a tally over `tags` is the same set.
 *
 * `order(label.en asc)` is applied here, with GROQ's codepoint comparison:
 * `sort: "label"` at `locale: "all"` does not sort by `label.en` (measured in
 * `payload/taxonomy.ts`) and `locale: "en"` would drop the other three locales
 * that `NewsFilterTag.label` needs.
 */
export async function getNewsTags(): Promise<NewsFilterTag[]> {
  const posts = await query<Paginated<{ tags?: unknown }> | null>({
    type: "find",
    collection: "newsPosts",
    depth: 0,
    pagination: false,
    select: { tags: true },
  });

  const counts = new Map<string, number>();
  for (const post of posts?.docs ?? []) {
    const ids = Array.isArray(post.tags) ? post.tags : [];
    for (const id of ids) {
      const key = typeof id === "string" ? id : isRow(id) ? String(id.id ?? "") : "";
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return [];

  const result = await query<Paginated<TagRow> | null>({
    type: "find",
    collection: "tags",
    locale: "all",
    depth: 0,
    pagination: false,
    where: { id: { in: [...counts.keys()] } },
  });

  return (result?.docs ?? [])
    // `groqObject`, because this array is a prop of the `NewsFilters` CLIENT
    // component and therefore travels into the RSC flight payload verbatim.
    // Sanity returns `{_id, category, color, label, newsCount, value}` —
    // alphabetical, ignoring the order its own projection wrote them in.
    .map((row) => groqObject({
      _id: String(row.id ?? ""),
      label: localized(row.label) ?? ({} as Localized),
      value: text(row.value) ?? "",
      color: orNull(text(row.color)),
      category: orNull(text(row.category)),
      newsCount: counts.get(String(row.id ?? "")) ?? 0,
    }))
    .sort((a, b) => byCodePoint(a.label.en ?? "", b.label.en ?? "") || byCodePoint(a._id, b._id)) as unknown as NewsFilterTag[];
}

/**
 * `*[_type == "regionalCommunity"] | order(order asc, name.en asc)`.
 *
 * `order` is **0/7 populated** in Sanity (measured) and has no Payload column
 * at all, so GROQ's first sort term is a no-op today and the whole order is
 * `name.en asc`. Verified to produce the identical seven slugs in the identical
 * order on both stores.
 */
export async function getRegionalCommunities(): Promise<NewsFilterCommunity[]> {
  const [communities, posts] = await Promise.all([
    query<Paginated<Row> | null>({
      type: "find",
      collection: "regionalCommunities",
      locale: "all",
      depth: 0,
      pagination: false,
      select: { name: true, slug: true },
    }),
    query<Paginated<{ relatedCommunity?: unknown }> | null>({
      type: "find",
      collection: "newsPosts",
      depth: 0,
      pagination: false,
      select: { relatedCommunity: true },
    }),
  ]);

  const counts = new Map<string, number>();
  for (const post of posts?.docs ?? []) {
    const related = post.relatedCommunity;
    const key = typeof related === "string" ? related : isRow(related) ? String(related.id ?? "") : "";
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return (communities?.docs ?? [])
    // Same reason as `getNewsTags` above: a `NewsFilters` prop.
    .map((row) => groqObject({
      _id: String(row.id ?? ""),
      name: localized(row.name as LocalizedRaw) ?? ({} as Localized),
      slug: text(row.slug) ?? "",
      newsCount: counts.get(String(row.id ?? "")) ?? 0,
    }))
    .sort((a, b) => byCodePoint(a.name.en ?? "", b.name.en ?? "") || byCodePoint(a._id, b._id)) as unknown as NewsFilterCommunity[];
}

// ---------------------------------------------------------------------------
// External sources
// ---------------------------------------------------------------------------

/**
 * `approved == true`, `order(publishedAt desc)`.
 *
 * `externalSources` has no `versions.drafts`, so `query()`'s published filter
 * does not apply to it and `approved` is the whole gate — which is also what
 * the collection's own `read: approvedOnly` access enforces. Unlike `newsPost`,
 * `language` IS modelled here, and it is rendered: `ExternalSourceCard` shows
 * it as a badge.
 */
export async function getApprovedExternalSources(
  filters?: NewsExternalSourceFilters,
): Promise<NewsExternalSource[]> {
  const clauses: (PayloadFindQuery["where"] | undefined)[] = [{ approved: { equals: true } }];
  if (filters?.tags?.length) clauses.push({ "tags.value": { in: filters.tags } });
  if (filters?.communities?.length) clauses.push({ "relatedCommunity.slug": { in: filters.communities } });

  const result = await query<Paginated<Row> | null>({
    type: "find",
    collection: "externalSources",
    locale: "all",
    depth: 1,
    pagination: false,
    where: and(...clauses),
  });

  const pattern = filters?.search ? `*${filters.search.toLowerCase()}*` : undefined;
  return (result?.docs ?? [])
    .filter((row) => (pattern ? matchesSearch(searchableText(row), pattern) : true))
    .sort((a, b) => compareNewsRows(a, b, {}))
    .slice(0, filters?.limit || 20)
    .map((row) => ({
      _id: String(row.id ?? ""),
      _type: "externalSource",
      title: orNull(localized(row.title as LocalizedRaw)),
      excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
      sourceUrl: orNull(text(row.sourceUrl)),
      publisher: orNull(text(row.publisher)),
      // `false`: the one external source really is authored `…:00.000Z`, and
      // `ExternalSourceCard` renders it raw into `<time datetime>`. Note 4.
      publishedAt: orNull(isoDate(row.publishedAt, false)),
      featured: orNull(typeof row.featured === "boolean" ? row.featured : undefined),
      sourceType: orNull(text(row.sourceType)),
      language: orNull(text(row.language)),
      // `image{asset->{_id, url, metadata{lqip, dimensions{width,height}}}, alt}`
      // — no `mimeType` and no `caption`, unlike the news-post projection.
      image: externalImageProjection(row.image),
      organizations: organizationsProjection(row.organizations, { full: false }),
      // `tags[]->{_id, label, title, value, color, category}` — the same bare
      // `value` binding as `NEWS_POST_FIELDS`, flattened for the same reason.
      // `title` is not a field on `tag`, so GROQ emits `null` for it. 0/1
      // external sources carry a tag.
      tags: externalTagProjection(row.tags),
    })) as unknown as NewsExternalSource[];
}

function externalImageProjection(group: unknown): Row | null {
  return imageGroup(group, { asset: ["_id", "url", "lqip", "dimensions"], keys: ["alt"] });
}

function externalTagProjection(rows: unknown): Row[] | null {
  if (!Array.isArray(rows)) return null;
  return listOrNull(
    rows.filter(isRow).map((raw) => {
      const tag = raw as TagRow;
      return {
        _id: String(tag.id ?? ""),
        label: orNull(localized(tag.label)),
        title: null,
        value: orNull(text(tag.value)),
        color: orNull(text(tag.color)),
        category: orNull(text(tag.category)),
      };
    }),
  );
}

// ---------------------------------------------------------------------------
// The dynamic grid insert (dead code, kept because `news.ts` keeps it)
// ---------------------------------------------------------------------------

/** `DYNAMIC_NEWS_FIELDS` — a different, narrower projection from
 *  `NEWS_POST_FIELDS`: a bare `slug` (so the slug **object**, not the string),
 *  the narrow author, `locationDetails` whole rather than projected, and no
 *  `_type`/`excerpt` locale trimming beyond the usual. */
function dynamicNewsProjection(row: Row): NewsPost {
  return {
    _id: String(row.id ?? ""),
    title: orNull(localized(row.title as LocalizedRaw)),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    slug: orNull(slugObject(row.slug)),
    image: externalImageProjection(row.image),
    author: dynamicAuthorProjection(row.author),
    publishedAt: orNull(isoDate(row.publishedAt)),
    organizations: organizationsProjection(row.organizations, { full: false }),
    locationDetails: locationDetailsProjection(row.locationDetails),
    tags: tagProjection(row.tags, CARD_TAG_FIELDS),
    featured: orNull(typeof row.featured === "boolean" ? row.featured : undefined),
  } as unknown as NewsPost;
}

/**
 * `references($regionalCommunityId)`.
 *
 * A news post can reference a `regionalCommunity` through exactly one field,
 * `relatedCommunity`, so the reverse lookup is that equality. Zero call sites;
 * `news.ts` documents it as dead.
 */
export async function getDynamicNews({
  regionalCommunityId,
  mode = "dynamic-featured",
  maxItems = 6,
}: DynamicNewsOptions): Promise<NewsPost[]> {
  const inCommunity: PayloadFindQuery["where"] = { relatedCommunity: { equals: regionalCommunityId } };

  const fetchRows = async (where: PayloadFindQuery["where"], limit: number): Promise<Row[]> => {
    const result = await query<Paginated<Row> | null>({
      type: "find",
      collection: "newsPosts",
      locale: "all",
      depth: NEWS_POST_DEPTH,
      pagination: false,
      where,
    });
    return (result?.docs ?? []).sort((a, b) => compareNewsRows(a, b, {})).slice(0, limit);
  };

  if (mode !== "dynamic-featured") {
    return (await fetchRows(inCommunity, maxItems)).map(dynamicNewsProjection);
  }

  let items = await fetchRows(and({ featured: { equals: true } }, inCommunity), maxItems);
  if (items.length < maxItems) {
    const seen = items.map((item) => String(item.id ?? ""));
    const more = await fetchRows(
      and({ id: { not_in: seen } }, inCommunity),
      maxItems - items.length,
    );
    items = [...items, ...more];
  }
  return items.map(dynamicNewsProjection);
}

// ---------------------------------------------------------------------------
// The OG card
// ---------------------------------------------------------------------------

/** `{ title, "region": relatedCommunity->name.en }`. No moderation or date
 *  guard in the GROQ — it matches on slug alone. */
export async function getNewsOgData(slug: string): Promise<NewsOgData | null> {
  const result = await query<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
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
  const name = community?.name as Localized | null | undefined;
  return {
    title: (localized(row.title as LocalizedRaw) as Record<string, string> | undefined) ?? null,
    region: name?.en ?? null,
  };
}

// ---------------------------------------------------------------------------
// The Algolia index docs — READ ONLY. Nothing here writes an index.
// ---------------------------------------------------------------------------

/**
 * `NEWS_INDEX_FIELDS`, which is a different shape again: a **bare** `slug` (so
 * the slug object), `region`/`themes`/`populations`/`location` that
 * `NEWS_POST_FIELDS` never selects, the narrow `author->{_id, name}`,
 * `tags[]->{label}` alone, and `locationDetails{city, country}` with no region
 * and no coordinates.
 */
function newsIndexProjection(row: Row): NewsIndexDoc {
  const location = row.location;
  return {
    _id: String(row.id ?? ""),
    title: orNull(localized(row.title as LocalizedRaw)),
    subtitle: orNull(localized(row.subtitle as LocalizedRaw)),
    excerpt: orNull(localized(row.excerpt as LocalizedRaw)),
    slug: orNull(slugObject(row.slug)),
    publishedAt: orNull(isoDate(row.publishedAt)),
    _updatedAt: orNull(isoDate(row.sanityUpdatedAt)),
    region: orNull(text(row.region)),
    // An unset Payload `select … hasMany` is `[]` where GROQ returns `null`.
    themes: listOrNull(Array.isArray(row.themes) ? (row.themes as string[]) : undefined),
    populations: listOrNull(Array.isArray(row.populations) ? (row.populations as string[]) : undefined),
    featured: orNull(typeof row.featured === "boolean" ? row.featured : undefined),
    author: isRow(row.author)
      ? { _id: String(row.author.id ?? ""), name: orNull(text(row.author.name)) }
      : null,
    tags: tagProjection(row.tags, ["label"]),
    organizations: organizationsProjection(row.organizations, { full: false })?.map((organization) => ({
      name: organization.name,
    })) ?? null,
    // No Payload column; 0/4 in Sanity. See note 5.
    projects: null,
    // Sanity's `geopoint` is `{_type, lat, lng, alt}`; Payload's `point` is
    // `[lng, lat]`. 0/4 populated in both stores, so this is the shape rule
    // rather than a data migration.
    location: Array.isArray(location) && location.length === 2
      ? { _type: "geopoint", lat: location[1], lng: location[0] }
      : null,
    locationDetails: isRow(row.locationDetails)
      ? (() => {
          const city = orNull(text(row.locationDetails.city));
          const country = orNull(text(row.locationDetails.country));
          return city === null && country === null ? null : { city, country };
        })()
      : null,
    // Note 1a.
    language: null,
  } as unknown as NewsIndexDoc;
}

/** See `getApprovedCaseStudyIndexDocs` for what `fresh` is for. */
export async function getPublishedNewsIndexDocs(
  options: { fresh?: boolean } = {},
): Promise<NewsIndexDoc[]> {
  const rows = await listNewsPosts(publishedByNow(), {
    limit: Number.MAX_SAFE_INTEGER,
    depth: 1,
    fresh: options.fresh,
  });
  return rows.map(newsIndexProjection);
}

export async function getNewsIndexDocsByIds(
  ids: string[],
  options: { fresh?: boolean } = {},
): Promise<NewsIndexDoc[]> {
  // No order in the GROQ; `id asc` for determinism, as everywhere else here.
  const read = options.fresh ? queryLive : query;
  const result = await read<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
    locale: "all",
    depth: 1,
    pagination: false,
    sort: "id",
    where: { id: { in: ids } },
  });
  return (result?.docs ?? []).map(newsIndexProjection);
}

export async function getNewsIndexDocById(id: string): Promise<NewsIndexDoc | null> {
  const result = await query<Row | null>({
    type: "findByID",
    collection: "newsPosts",
    id,
    locale: "all",
    depth: 1,
  });
  return result ? newsIndexProjection(result) : null;
}

export async function getPublishedNewsCount(): Promise<number> {
  return query<number>({ type: "count", collection: "newsPosts", where: publishedByNow() });
}

// ---------------------------------------------------------------------------
// The generic search records
// ---------------------------------------------------------------------------

export interface RawNewsSearchRecordDoc {
  _id: string;
  language?: string;
  title?: Localized | string;
  excerpt?: Localized | string;
  slug: string;
}

/**
 * The raw rows `news.ts` maps into `SearchRecord[]`. The mapping — including
 * the `language`-to-locale fallback — stays in the domain module, so both
 * backends run the identical code over it.
 *
 * `language` is `null` here (note 1a), which routes every record to `/en/…`.
 * That is **the same answer Sanity gives today**: its four values are three
 * `"en"` and one `null`, and `["en","es","fr","ar"].includes(null ?? "")` is
 * false, so the null one already falls back to `en`.
 */
export async function getNewsSearchRecords(): Promise<RawNewsSearchRecordDoc[]> {
  const result = await query<Paginated<Row> | null>({
    type: "find",
    collection: "newsPosts",
    locale: "all",
    depth: 0,
    pagination: false,
    sort: "id",
    where: and({ slug: { exists: true } }, publishedByNow()),
    select: { title: true, excerpt: true, slug: true },
  });
  return (result?.docs ?? []).map((row) => ({
    _id: String(row.id ?? ""),
    language: undefined,
    title: localized(row.title as LocalizedRaw),
    excerpt: localized(row.excerpt as LocalizedRaw),
    slug: String(row.slug ?? ""),
  })) as unknown as RawNewsSearchRecordDoc[];
}
