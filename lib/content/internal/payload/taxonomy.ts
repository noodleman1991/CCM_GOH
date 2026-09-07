/**
 * The Payload half of `lib/content/taxonomy.ts`.
 *
 * Same six answers, same six shapes, read from Payload instead of Sanity.
 * Nothing above the seam learns which store answered: `taxonomy.ts` picks
 * between this file and its own GROQ through `activeBackend("taxonomy")`, and
 * the exported signatures are unchanged on both paths.
 *
 * ---------------------------------------------------------------------------
 * Four places the two stores do not line up, and what is done about each
 * ---------------------------------------------------------------------------
 *
 * **1. `label` on `workType`/`expertiseArea` is a different shape in each
 * store, and `taxonomy.ts`'s `fromInternationalizedArray()` must NOT be
 * applied here.** Sanity stores those labels as `internationalizedArrayString`
 * — an array of `{_key, value}` pairs, a third i18n lane distinct from the
 * `{en,es,fr,ar}` object lane `tag` uses. Payload has one lane: both
 * collections declare `label` with `localizedText()` (`localized: true`), and
 * Task 12's importer did the array-to-object unwrap on the way in. Verified in
 * the dev database (2026-09-07, 6 workTypes / 5 expertiseAreas, all four
 * locales populated on every one): a read at `locale: "all"` hands back
 * `{en, es, fr, ar}` directly. So the conversion Sanity needs is already done
 * in storage, and running it again would key the object by locale codes it
 * would have to invent.
 *
 * **2. A localized field read at `locale: "all"` can carry explicit nulls, and
 * its keys arrive in the wrong order.** Sanity omits an unset field from its
 * projection and serializes an object's keys alphabetically; Payload returns
 * the locale key with `null` (`description: {en: null}` on most tags) in
 * `payload.config.ts`'s locale order. Both are handled by the shared
 * `localized()` in `lib/content/internal/localized.ts` — see that file's header
 * for why key order is load-bearing and why the rule lives in one place.
 *
 * **3. Sorting a localized field cannot be delegated to Payload at
 * `locale: "all"`.** `sort: "label"` with every locale requested does not sort
 * by `label.en` (measured: it returned "Community Action" before
 * "Adaptation"). `locale: "en"` sorts correctly but would drop the other three
 * locales from the result, which `ContentTag.label` needs. So the tag list is
 * sorted here, by `label.en`, with the codepoint comparison GROQ's
 * `order(label.en asc)` uses — `localeCompare` is a different order and would
 * silently reorder the list. Checked against the oracle: Sanity's first three
 * tags by `label.en` are Adaptation, Air Quality, Central & Southern Asia, and
 * so are Payload's.
 *
 * **4. `orderRank` is null on some rows, and both stores put those last.**
 * GROQ's `order(orderRank asc)` sorts nulls last (verified: the two authors
 * with no `orderRank` are positions 94 and 95 of 95), and Postgres `ORDER BY …
 * ASC` defaults to NULLS LAST. They agree, so `sort: "orderRank"` is left to
 * Payload. All 24 organizations have a null `orderRank` in both stores, so
 * their relative order is unspecified in both — noted rather than fixed,
 * because inventing an order here would be a behaviour change, not parity.
 */
import "server-only";
import { localized } from "@/lib/content/internal/localized";
import type { LocalizedRaw } from "@/lib/content/internal/localized";
import { query } from "@/lib/content/internal/payload-source";
import { imageUrl } from "@/lib/content/internal/payload-image-source";
import type { Author, Organization, TaxonomyOption } from "@/lib/content/taxonomy";
import type { ContentTag, Localized } from "@/lib/content/types";

/** Payload's `find` result, narrowed to the part every reader here uses. */
interface Paginated<T> {
  docs: T[];
}

/** GROQ's string ordering: by code point, not by locale collation. */
function byCodePoint(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

interface TagRow {
  id: string;
  label?: LocalizedRaw;
  /** A flat text column. This is the whole of Phase-2 obligation 4: Sanity
   *  stores `{_type:"slug", current:"…"}` and `taxonomy.ts`'s TAGS_QUERY
   *  already projects `value.current`, so both backends hand back the string
   *  `ContentTag.value` promises. */
  value?: string | null;
  color?: string | null;
}

export async function getTags(): Promise<ContentTag[]> {
  const result = await query<Paginated<TagRow>>({
    type: "find",
    collection: "tags",
    locale: "all",
    depth: 0,
    pagination: false,
    select: { label: true, value: true, color: true },
  });
  return (result?.docs ?? [])
    .map((row) => ({
      id: row.id,
      label: localized(row.label) ?? {},
      value: text(row.value),
      color: text(row.color),
    }))
    .sort((a, b) => byCodePoint(a.label.en ?? "", b.label.en ?? ""));
}

// ---------------------------------------------------------------------------
// Work types / expertise areas
// ---------------------------------------------------------------------------

interface TaxonomyOptionRow {
  id: string;
  key: string;
  label?: LocalizedRaw;
}

/**
 * `isActive == true` and `order asc, key asc` — the same filter and ordering
 * every workType/expertiseArea query in the codebase uses, and the same the
 * GROQ twin uses. Payload takes the two-key sort directly.
 */
async function taxonomyOptions(collection: "workTypes" | "expertiseAreas"): Promise<TaxonomyOption[]> {
  const result = await query<Paginated<TaxonomyOptionRow>>({
    type: "find",
    collection,
    locale: "all",
    depth: 0,
    pagination: false,
    sort: ["order", "key"],
    where: { isActive: { equals: true } },
    select: { key: true, label: true },
  });
  return (result?.docs ?? []).map((row) => ({
    id: row.id,
    value: row.key,
    // `?? {}` and not `localized()`'s `undefined`: `TaxonomyOption.label` is a
    // required `Localized`, and the GROQ twin's `fromInternationalizedArray`
    // returns `{}` for a missing label rather than dropping the key.
    label: localized(row.label) ?? ({} as Localized),
  }));
}

export function getWorkTypes(): Promise<TaxonomyOption[]> {
  return taxonomyOptions("workTypes");
}

export function getExpertiseAreas(): Promise<TaxonomyOption[]> {
  return taxonomyOptions("expertiseAreas");
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

interface AuthorRow {
  id: string;
  name: string;
  slug?: string | null;
  image?: unknown;
  organizationalAffiliation?: string | null;
  userId?: string | null;
}

/**
 * `image.asset->url` in GROQ is the asset's own URL, untransformed. The Payload
 * equivalent is the media row's `url`, which is what `imageUrl()` returns for a
 * request naming no dimensions (its documented tier 3), so the image source is
 * used rather than reaching into `image.asset.url` by hand — one place decides
 * how a Payload image becomes a URL.
 */
function toAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    name: row.name,
    slug: text(row.slug),
    imageUrl: text(imageUrl(row.image)),
    organizationalAffiliation: text(row.organizationalAffiliation),
    userId: text(row.userId),
  };
}

const AUTHOR_SELECT = {
  name: true,
  slug: true,
  image: true,
  organizationalAffiliation: true,
  userId: true,
} as const;

export async function getAuthors(): Promise<Author[]> {
  const result = await query<Paginated<AuthorRow>>({
    type: "find",
    collection: "authors",
    locale: "all",
    // The media row behind `image.asset` has to be resolved for its URL.
    depth: 1,
    pagination: false,
    sort: "orderRank",
    select: AUTHOR_SELECT,
  });
  return (result?.docs ?? []).map(toAuthor);
}

/**
 * Kept named for Sanity on purpose: Prisma's `User.sanityPersonId` column
 * references an author by this id, and Payload preserved Sanity's `_id`
 * verbatim, so the same id answers in both stores.
 */
export async function getAuthorBySanityId(id: string): Promise<Author | null> {
  const row = await query<AuthorRow | null>({
    type: "findByID",
    collection: "authors",
    id,
    locale: "all",
    depth: 1,
    select: AUTHOR_SELECT,
  });
  return row ? toAuthor(row) : null;
}

// ---------------------------------------------------------------------------
// Organizations
// ---------------------------------------------------------------------------

interface OrganizationRow {
  id: string;
  name: string;
  slug?: string | null;
  acronym?: string | null;
  type?: string | null;
  description?: LocalizedRaw;
  logo?: unknown;
  website?: string | null;
}

export async function getOrganizations(): Promise<Organization[]> {
  const result = await query<Paginated<OrganizationRow>>({
    type: "find",
    collection: "organizations",
    locale: "all",
    depth: 1,
    pagination: false,
    sort: "orderRank",
    select: { name: true, slug: true, acronym: true, type: true, description: true, logo: true, website: true },
  });
  return (result?.docs ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: text(row.slug),
    acronym: text(row.acronym),
    type: text(row.type),
    description: localized(row.description),
    logoUrl: text(imageUrl(row.logo)),
    website: text(row.website),
  }));
}
