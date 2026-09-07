/**
 * The Payload half of `lib/content/regions.ts`.
 *
 * Seven answers, seven unchanged shapes. `regions.ts` picks between this file
 * and its own GROQ through `activeBackend("regions")`; the `safe()` wrappers,
 * the fallbacks and the deliberate *absence* of a wrapper on the five atlas
 * queries all stay in the domain module, so a failure degrades (or doesn't) in
 * exactly the same place on either backend.
 *
 * ---------------------------------------------------------------------------
 * The atlas trust contract, restated in Payload
 * ---------------------------------------------------------------------------
 *
 * `lib/maps/content-filter.ts` is the single author of the shared GROQ
 * predicates: counts, cards and pins must describe the SAME set of documents,
 * or a region claims 17 and lists 15. That file emits GROQ strings, which
 * Payload cannot execute, so this module re-expresses the same four
 * predicates — status, theme, free text, region attribution — and does it in
 * ONE place (`whereFor`), for the same reason: a per-function copy is how the
 * contract drifts.
 *
 * Three of the four are ordinary Payload `Where` clauses. The fourth is not,
 * and neither are the date window, the geotag requirement or the ordering:
 *
 * **Free text.** GROQ's `[title.en, title.es, title.fr, title.ar] match $q + "*"`
 * searches all four locales at once. Payload resolves a localized field
 * against the ONE locale a read names, and `locale: "all"` does not widen the
 * query — measured on `caseStudies`, `title like "climate"` returns 17 at
 * `locale: "all"` and the same 17 at `locale: "en"`, i.e. "all" silently means
 * "default locale" for a `where`. There is no `Where` that spans locales, so
 * the predicate is applied here instead, over the `{en,es,fr,ar}` object the
 * read already returns. `matchesGroq` reproduces `match`'s semantics rather
 * than approximating them with `includes()` — see its own note.
 *
 * **The date window and the ordering.** Both are over
 * `coalesce(publishedAt, publishDate, _createdAt)`, and Postgres cannot be
 * asked for that through Payload's query API: `sort` names one column, and no
 * `Where` composes three. Both are therefore computed here from the same
 * `effectiveDate()`, so the filter and the order can never disagree.
 *
 * **The geotag requirement.** `defined(coalesce(studyLocation, place.point,
 * locationCountryCode, place.countryCode))` names, per type, fields two of the
 * five collections do not declare — and Payload *rejects* a `where` on an
 * undeclared path (verified: `locationCountryCode` on `newsPosts` throws "The
 * following path cannot be queried"), where GROQ quietly returns null. So the
 * per-type field map below is not a convenience; naming a foreign field is an
 * error rather than a no-op, which is also why `whereFor` builds its region
 * disjunction branch by branch.
 *
 * The cost of the three in-memory predicates is bounded and known: the whole
 * dataset is 27 case studies, 35 lived experiences, 4 news posts and 29
 * research outputs. Each reader fetches one type's rows through `query()`
 * (published-only, cached an hour, exactly as the GROQ twin) and narrows them
 * here.
 *
 * ---------------------------------------------------------------------------
 * `WhenFilter` is read for its bound params, not its GROQ
 * ---------------------------------------------------------------------------
 *
 * `lib/maps/date-filter.ts` hands over `{ filter, params }` where `filter` is
 * a GROQ fragment and `params` carries `whenFrom` (>=) or `whenTo` (<) or
 * neither. The bound params are backend-neutral and the fragment is not, so
 * this module reads the params and ignores the string. That keeps
 * `regions.ts`'s exported signatures identical — which is the point of the
 * seam — and keeps ONE definition of the bucket boundaries, in `whenFilter()`,
 * rather than a second copy here that could drift by a year.
 *
 * ---------------------------------------------------------------------------
 * Two Sanity behaviours preserved deliberately, including one defect
 * ---------------------------------------------------------------------------
 *
 * **`livedExperience.region` holds a community reference, not a region code**
 * (Phase-2 obligation 10). `regionMatchFilter`'s first branch, `region ==
 * $region`, therefore never matches a lived experience in Sanity, and the
 * highlights projection's `coalesce(region, relatedCommunity->slug.current, …)`
 * short-circuits on that truthy reference and never reaches the slug — so a
 * lived experience gets no usable `regionKey` and is dropped by
 * `region-items`. That is today's behaviour on the live site. It is
 * reproduced, not fixed: the region-code branch is omitted for that type (a
 * branch that cannot match is the same set), and `regionKey` is emitted as the
 * related community's id, which `isRegionCode`/`RC_SLUG_TO_REGION` reject
 * exactly as they reject Sanity's `{_ref}` object. Fixing it would change what
 * the homepage renders, which this phase must not do.
 *
 * **`agenda` has no `relatedCommunities`.** The GROQ names that field for
 * every type, and `agenda` declares `regionalCommunities` instead, so in
 * Sanity the branch is null and an agenda matches no region. Preserved by
 * omitting the branch rather than "helpfully" pointing it at the field Payload
 * does have. No runtime path reaches it either way: `FACET_TO_CONTENT_TYPE`
 * only ever produces `caseStudy`, `livedExperience`, `newsPost` and
 * `researchOutput`.
 */
import "server-only";
import type { CollectionSlug, Where } from "payload";
import { blurDataURL, imageUrl } from "@/lib/content/internal/payload-image-source";
import { query, queryPreviewable } from "@/lib/content/internal/payload-source";
import type { PayloadLocale } from "@/lib/content/internal/payload-source";
import type { WhenFilter } from "@/lib/maps/date-filter";
import type { FacetContentType } from "@/lib/maps/cluster-pins";
import type { RegionCode } from "@/lib/maps/region-codes";
import { RC_SLUG_TO_REGION } from "@/lib/maps/region-codes";
import type { ThemeOption } from "@/lib/maps/region-facets";
import type {
  RegionArt,
  RegionFacetCountRow,
  RegionHighlightItemRow,
  RegionItemRow,
  RegionPinRow,
} from "@/lib/content/regions";

interface Paginated<T> {
  docs: T[];
}

const LOCALES: PayloadLocale[] = ["en", "es", "fr", "ar"];

type LocalizedRaw = Partial<Record<PayloadLocale, string | null>> | null | undefined;

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** A relationship at `depth: 1` is the related document; at `depth: 0` it is
 *  its id. Both are read the same way so a change of depth cannot silently
 *  turn an id into `null`. */
function relatedId(value: unknown): string | null {
  if (typeof value === "string") return text(value);
  if (value && typeof value === "object") return text((value as { id?: unknown }).id);
  return null;
}

function relatedSlug(value: unknown): string | null {
  if (value && typeof value === "object") return text((value as { slug?: unknown }).slug);
  return null;
}

/**
 * A Payload `point` field, as a Sanity geopoint.
 *
 * Payload stores a point as PostGIS and serialises it the GeoJSON way — a
 * two-element `[longitude, latitude]` array. Sanity's `geopoint` is an object
 * with named `lat`/`lng`, and that is what `RegionPinRow.point` declares and
 * what `app/api/maps/region-pins/route.ts` reads (`projectPoint(r.point.lat,
 * r.point.lng)`).
 *
 * Handing the array through unconverted is not a type error and does not
 * throw: `point.lat` is simply `undefined`, `projectPoint` returns null, and
 * the pin is dropped. Measured before this conversion existed — 24 case-study
 * pins on Sanity against 8 on Payload for the global map, and 3 against 0 for
 * Oceania — with the survivors being exactly the country-precision rows, which
 * reach the map through their country's centroid instead of their own point.
 * A silent two-thirds loss of the pin layer, invisible to any test that only
 * checks the row count.
 */
function geoPoint(value: unknown): { lat: number; lng: number } | null {
  if (Array.isArray(value) && value.length >= 2) {
    const [lng, lat] = value;
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
    return null;
  }
  if (value && typeof value === "object") {
    const { lat, lng } = value as { lat?: unknown; lng?: unknown };
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Theme options
// ---------------------------------------------------------------------------

interface ThemeTagRow {
  value?: string | null;
  label?: LocalizedRaw;
}

/**
 * The CMS-driven theme facet: any `tag` flagged `useAsTheme`, ordered by the
 * tag's `orderRank`. Returns whatever it finds — the fallback to
 * `FALLBACK_THEMES` for an empty result belongs to `regions.ts`, where it is
 * shared with the Sanity path and with `safe()`'s failure fallback.
 *
 * The four-key label object is built explicitly, key by key, rather than
 * copied: the GROQ twin does the same, and `toEqual` against a three-key
 * object is not the same assertion.
 */
export async function getThemeOptions(): Promise<ThemeOption[]> {
  const result = await query<Paginated<ThemeTagRow>>({
    type: "find",
    collection: "tags",
    locale: "all",
    depth: 0,
    pagination: false,
    sort: "orderRank",
    where: { useAsTheme: { equals: true } },
    select: { value: true, label: true },
  });
  return (result?.docs ?? [])
    .filter((row): row is { value: string; label: Partial<Record<PayloadLocale, string | null>> } => {
      return typeof row?.value === "string" && row.value.length > 0 && row.label != null && typeof row.label === "object";
    })
    .map((row) => ({
      slug: row.value,
      label: {
        en: text(row.label.en) ?? undefined,
        es: text(row.label.es) ?? undefined,
        fr: text(row.label.fr) ?? undefined,
        ar: text(row.label.ar) ?? undefined,
      },
    }));
}

// ---------------------------------------------------------------------------
// Region art
// ---------------------------------------------------------------------------

interface RegionArtRow {
  slug?: string | null;
  /** `welcomeHero` is a localized `blockSlot`, so at `locale: "all"` the whole
   *  slot arrives once per locale. */
  welcomeHero?: Partial<Record<PayloadLocale, { image?: unknown } | null>> | null;
}

/**
 * The regional-spotlight banner art, keyed by region code.
 *
 * Two shape differences from Sanity, neither of which changes the result:
 *
 *   - Sanity holds **one document per language** (28 rows, 7 slugs x 4), so its
 *     query returns up to four rows per region and the last one wins. Payload
 *     holds **one document per region** (7) with localized fields. Verified
 *     against the live dataset: all four language documents of a region point
 *     at the same asset, so "last row wins" and "first locale that has one"
 *     name the same picture — 6 of 7 regions have art in both stores, and
 *     `europe-and-northern-america` has none in either.
 *   - `getRegionArt()` takes no locale and returns one map for the whole site,
 *     so a locale has to be chosen. `en, es, fr, ar` order, first hit wins:
 *     deterministic, and it prefers the default locale rather than whichever
 *     row Postgres returned last.
 *
 * `queryPreviewable`, not `query` — the Sanity twin omits `perspective`, so it
 * falls through to the draft-mode check and an editor previewing a regional
 * page sees their unpublished hero. Swapping in `query` here would silently
 * take that away, which is one of the six Phase-1 bugs this seam exists to
 * prevent.
 */
export async function getRegionArt(): Promise<Partial<Record<RegionCode, RegionArt>>> {
  const result = await queryPreviewable<Paginated<RegionArtRow>>({
    type: "find",
    collection: "regionalCommunityPages",
    locale: "all",
    // The media row behind `welcomeHero.image.asset` carries the url and lqip.
    depth: 2,
    pagination: false,
    select: { slug: true, welcomeHero: true },
  });

  const art: Partial<Record<RegionCode, RegionArt>> = {};
  for (const row of result?.docs ?? []) {
    const code = row.slug ? RC_SLUG_TO_REGION[row.slug] : undefined;
    if (!code) continue;
    for (const locale of LOCALES) {
      const image = row.welcomeHero?.[locale]?.image;
      const url = imageUrl(image);
      if (!url) continue;
      art[code] = { url, lqip: blurDataURL(image) ?? null };
      break;
    }
  }
  return art;
}

// ---------------------------------------------------------------------------
// What each content type declares
// ---------------------------------------------------------------------------

/**
 * Per-type field map. Every entry is a field the collection actually declares:
 * Payload rejects a `where` naming a path a collection does not have, and the
 * per-type GROQ projections (`regionItemPlaceProjection`,
 * `regionPinPlaceProjection`) already encode the same knowledge as a chain of
 * ternaries. Written down once here so counts, cards and pins read it from the
 * same place.
 */
interface TypeShape {
  collection: CollectionSlug;
  /** The public-visibility gate — `statusFilter()`'s three cases. */
  moderation: "approved" | "approved-or-unset" | "none";
  /** What the type's `region` field holds, if it has one at all. `"code"` is
   *  one of the seven short codes; `"reference"` is `livedExperience`, whose
   *  `region` points at a regionalCommunity; `null` is `agenda`, which has no
   *  such field — and naming one Payload does not declare is an error, not a
   *  no-op. */
  region: "code" | "reference" | null;
  /** The singular `relatedCommunity` reference. */
  relatedCommunity: boolean;
  /** The plural reference list, under the name the GROQ actually binds. */
  relatedCommunities: boolean;
  /** Where an ISO alpha-3 country code lives, for the region and geotag rules. */
  countryField: "locationCountryCode" | "place.countryCode" | null;
  /** The card image field. `livedExperience` has neither (its `thumbnail` is
   *  video-only and the GROQ does not project it), so its cards fall back to
   *  the tinted placeholder — preserved. */
  image: "image" | "coverImage" | null;
  /** Which place fields the CARD projection reads. `researchOutput` and
   *  `agenda` deliberately project null, even though pins and counts read
   *  their `place`. */
  cardPlace: "caseStudy" | "place" | "none";
  /** Which place fields the PIN projection reads. */
  pinPlace: "caseStudy" | "place" | "none";
  /** The date fields `coalesce(publishedAt, publishDate, _createdAt)` can find
   *  on this type, in that order. `createdAt` is always the last resort. */
  dates: ("publishedAt" | "publishDate")[];
  /** The fields `defined(coalesce(studyLocation, place.point,
   *  locationCountryCode, place.countryCode))` can find on this type. */
  geo: ("studyLocation" | "place.point" | "locationCountryCode" | "place.countryCode")[];
}

const SHAPES: Record<string, TypeShape> = {
  caseStudy: {
    collection: "caseStudies",
    moderation: "approved",
    region: "code",
    relatedCommunity: true,
    relatedCommunities: false,
    countryField: "locationCountryCode",
    image: "image",
    cardPlace: "caseStudy",
    pinPlace: "caseStudy",
    dates: ["publishedAt"],
    geo: ["studyLocation", "locationCountryCode"],
  },
  livedExperience: {
    collection: "livedExperiences",
    moderation: "approved-or-unset",
    region: "reference",
    relatedCommunity: true,
    relatedCommunities: false,
    countryField: "place.countryCode",
    image: null,
    cardPlace: "place",
    pinPlace: "place",
    dates: ["publishedAt"],
    geo: ["place.point", "place.countryCode"],
  },
  newsPost: {
    collection: "newsPosts",
    moderation: "none",
    region: "code",
    relatedCommunity: true,
    relatedCommunities: false,
    countryField: "place.countryCode",
    image: "image",
    cardPlace: "place",
    pinPlace: "place",
    dates: ["publishedAt"],
    geo: ["place.point", "place.countryCode"],
  },
  researchOutput: {
    collection: "researchOutputs",
    moderation: "approved",
    region: "code",
    relatedCommunity: false,
    relatedCommunities: true,
    countryField: "place.countryCode",
    image: "coverImage",
    cardPlace: "none",
    pinPlace: "place",
    dates: ["publishDate"],
    geo: ["place.point", "place.countryCode"],
  },
  agenda: {
    collection: "agendas",
    moderation: "none",
    region: null,
    relatedCommunity: false,
    // `agenda` declares `regionalCommunities`; the GROQ binds
    // `relatedCommunities`, which it does not have. See the header note.
    relatedCommunities: false,
    countryField: null,
    image: "coverImage",
    cardPlace: "none",
    pinPlace: "none",
    dates: ["publishDate"],
    geo: [],
  },
  // `report` is a `FacetContentType` with zero documents and no Payload
  // collection. Unreachable at runtime (`FACET_TO_CONTENT_TYPE` never produces
  // it); an unknown type resolves to `undefined` here and returns [].
};

/**
 * The fields one read needs: the shared ones, plus whatever this type's shape
 * declares. Only fields the collection actually has — Payload's `select` is
 * validated against the schema, and so is `where`.
 */
function selectFor(shape: TypeShape, opts: { card?: boolean }): Record<string, true> {
  const select: Record<string, true> = { title: true, slug: true };
  // Both kinds of `region` are read: the short code by the region predicate,
  // the reference by the highlights projection, which coalesces it first.
  if (shape.region) select.region = true;
  if (shape.relatedCommunity) select.relatedCommunity = true;
  if (shape.relatedCommunities) select.relatedCommunities = true;
  for (const field of shape.dates) select[field] = true;
  if (opts.card && shape.image) select[shape.image] = true;
  if (shape.cardPlace === "caseStudy" || shape.pinPlace === "caseStudy") {
    select.locationDisplayText = true;
    select.locationText = true;
    select.locationCountryCode = true;
    select.studyLocation = true;
    select.locationPrecision = true;
  }
  if (shape.cardPlace === "place" || shape.pinPlace === "place" || shape.countryField === "place.countryCode") {
    select.place = true;
  }
  if (shape.countryField === "locationCountryCode") select.locationCountryCode = true;
  return select;
}

// ---------------------------------------------------------------------------
// The four shared predicates
// ---------------------------------------------------------------------------

function moderationWhere(shape: TypeShape): Where | null {
  if (shape.moderation === "approved") return { moderationStatus: { equals: "approved" } };
  if (shape.moderation === "approved-or-unset") {
    return { or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }] };
  }
  return null;
}

/** `$themeSlug in tags[]->value.current` — a join onto the tag's slug column. */
function themeWhere(theme: string | null | undefined): Where | null {
  return theme ? { "tags.value": { equals: theme } } : null;
}

/** A `Where` no row satisfies. Every document has an id. */
const MATCHES_NOTHING: Where = { id: { exists: false } };

/**
 * `regionMatchFilter()`, branch by branch, skipping every branch this type has
 * no field for. An empty branch list means the disjunction is false for every
 * document — which is what GROQ computes when all four operands are null — so
 * it is returned as such rather than as "no filter".
 */
function regionWhere(
  shape: TypeShape,
  params: { region: string; slug: string; regionCountries: string[] },
): Where {
  const branches: Where[] = [];
  if (shape.region === "code" && params.region) branches.push({ region: { equals: params.region } });
  if (shape.relatedCommunity && params.slug) branches.push({ "relatedCommunity.slug": { equals: params.slug } });
  if (shape.relatedCommunities && params.slug) branches.push({ "relatedCommunities.slug": { equals: params.slug } });
  // `x in []` is false in GROQ; an empty `in` list is left out rather than sent.
  if (shape.countryField && params.regionCountries.length > 0) {
    branches.push({ [shape.countryField]: { in: params.regionCountries } } as Where);
  }
  if (branches.length === 0) return MATCHES_NOTHING;
  return branches.length === 1 ? branches[0] : { or: branches };
}

function whereFor(
  shape: TypeShape,
  params: {
    theme?: string | null;
    region?: { region: string; slug: string; regionCountries: string[] };
  },
): Where | undefined {
  const parts = [moderationWhere(shape), themeWhere(params.theme)].filter((w): w is Where => w !== null);
  if (params.region) parts.push(regionWhere(shape, params.region));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : { and: parts };
}

// ---------------------------------------------------------------------------
// The predicates Payload cannot express
// ---------------------------------------------------------------------------

/** Words, the way GROQ's `match` splits them: on anything that is not a letter
 *  or a digit, in any script. */
function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

/**
 * GROQ's `match`, for the one pattern shape this module ever builds.
 *
 * `[title.en, …] match $q + "*"` is true when SOME element matches, and an
 * element matches when EVERY token of the pattern matches some token of the
 * text — `*` being a suffix wildcard on the token it is attached to. Because
 * the caller appends a single `*` to the whole of `q`, only the last token
 * carries one; the earlier tokens are exact word matches, not substrings.
 *
 * Reproduced rather than approximated: `title.includes(q)` would match
 * mid-word ("ood" inside "flood") where GROQ does not, and would fail to match
 * a two-word query whose words appear in the other order, where GROQ does.
 */
function matchesGroq(values: (string | null | undefined)[], q: string): boolean {
  const pattern = tokenizeWithWildcards(`${q}*`);
  if (pattern.length === 0) return true;
  return values.some((value) => {
    if (!value) return false;
    const words = tokenize(value);
    return pattern.every(({ token, prefix }) =>
      words.some((word) => (prefix ? word.startsWith(token) : word === token)),
    );
  });
}

function tokenizeWithWildcards(pattern: string): { token: string; prefix: boolean }[] {
  return pattern
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => {
      const prefix = raw.endsWith("*");
      const token = tokenize(prefix ? raw.slice(0, -1) : raw).join("");
      return { token, prefix };
    })
    .filter(({ token }) => token.length > 0);
}

/** `coalesce(publishedAt, publishDate, _createdAt)`, as a string, because that
 *  is what both the GROQ projection and the route's `localeCompare` sort see. */
function effectiveDate(row: Record<string, unknown>, shape: TypeShape): string | null {
  for (const field of shape.dates) {
    const value = text(row[field]);
    if (value) return value;
  }
  return text(row.createdAt);
}

/** `whenFilter()`'s bound params, applied to an effective date. A row with no
 *  date drops out of any bounded bucket, exactly as `defined(<date>) && …`
 *  makes it. */
function withinWhen(date: string | null, when: WhenFilter): boolean {
  const { whenFrom, whenTo } = when.params;
  if (!whenFrom && !whenTo) return true;
  if (!date) return false;
  if (whenFrom) return date >= whenFrom;
  return date < whenTo;
}

/** `defined(coalesce(studyLocation, place.point, locationCountryCode,
 *  place.countryCode))`. */
function hasGeotag(row: Record<string, unknown>, shape: TypeShape): boolean {
  return shape.geo.some((field) => {
    if (field === "studyLocation") return geoPoint(row.studyLocation) !== null;
    if (field === "locationCountryCode") return text(row.locationCountryCode) !== null;
    const place = row.place as Record<string, unknown> | null | undefined;
    if (field === "place.point") return geoPoint(place?.point) !== null;
    return text(place?.countryCode) !== null;
  });
}

// ---------------------------------------------------------------------------
// Projections
// ---------------------------------------------------------------------------

function titleOf(row: Record<string, unknown>): string {
  // `coalesce(title.en, title, "")`. In Payload `title` is always a localized
  // object, never a bare string, so the middle branch cannot fire.
  const title = row.title as LocalizedRaw;
  return text(title?.en) ?? "";
}

function cardPlace(row: Record<string, unknown>, shape: TypeShape): { place: string | null; countryCode3: string | null } {
  if (shape.cardPlace === "caseStudy") {
    const locationText = row.locationText as Record<string, unknown> | null | undefined;
    return {
      place: text(row.locationDisplayText) ?? text(locationText?.city) ?? text(locationText?.country),
      countryCode3: text(row.locationCountryCode),
    };
  }
  if (shape.cardPlace === "place") {
    const place = row.place as Record<string, unknown> | null | undefined;
    return { place: text(place?.text), countryCode3: text(place?.countryCode) };
  }
  return { place: null, countryCode3: null };
}

function toItemRow(row: Record<string, unknown>, type: string, shape: TypeShape): RegionItemRow {
  const image = shape.image ? row[shape.image] : null;
  return {
    id: String(row.id),
    type,
    title: titleOf(row),
    slug: text(row.slug),
    image: shape.image ? (text(imageUrl(image)) ?? null) : null,
    imageLqip: shape.image ? (blurDataURL(image) ?? null) : null,
    ...cardPlace(row, shape),
    date: effectiveDate(row, shape),
  };
}

/**
 * `coalesce(region, relatedCommunity->slug.current, relatedCommunities[0]->slug.current)`.
 *
 * For `livedExperience` the first operand is a community reference, so the
 * coalesce stops there and never reaches the slug — see the header note. The
 * relationship's id is returned so that the caller's `isRegionCode` /
 * `RC_SLUG_TO_REGION` lookups both miss, exactly as they miss on Sanity's
 * `{_ref}` object.
 */
function regionKeyOf(row: Record<string, unknown>, shape: TypeShape): string | null {
  const region = shape.region === "code" ? text(row.region) : relatedId(row.region);
  if (region) return region;
  if (shape.relatedCommunity) {
    const slug = relatedSlug(row.relatedCommunity);
    if (slug) return slug;
  }
  if (shape.relatedCommunities) {
    const list = row.relatedCommunities;
    const first = Array.isArray(list) ? list[0] : undefined;
    const slug = relatedSlug(first);
    if (slug) return slug;
  }
  return null;
}

// ---------------------------------------------------------------------------
// The five atlas reads
// ---------------------------------------------------------------------------

/**
 * One type's candidate rows: the Payload-expressible predicates as a `Where`,
 * everything else applied here. Unwrapped and uncaught, like the GROQ twins —
 * `region-items` pools failures in its own `Promise.all`/`try`, `region-pins`
 * lets them propagate, and `region-data` isolates them per facet. A `safe()`
 * here would quietly take all three of those away.
 */
async function rows(
  type: string,
  opts: {
    theme?: string | null;
    q: string;
    when: WhenFilter;
    region?: { region: string; slug: string; regionCountries: string[] };
    requireGeotag: boolean;
    select: { card?: boolean };
  },
): Promise<{ raw: Record<string, unknown>; date: string | null }[] | null> {
  const shape = SHAPES[type];
  if (!shape) return null;

  const result = await query<Paginated<Record<string, unknown>>>({
    type: "find",
    collection: shape.collection,
    locale: "all",
    // Enough to resolve `relatedCommunity`/`relatedCommunities` to their slugs
    // and an image field to its media row.
    depth: 1,
    pagination: false,
    where: whereFor(shape, { theme: opts.theme, region: opts.region }),
    select: selectFor(shape, opts.select),
  });

  const q = opts.q.trim();
  return (result?.docs ?? [])
    .filter((row) => !opts.requireGeotag || hasGeotag(row, shape))
    .filter((row) => {
      if (!q) return true;
      const title = row.title as LocalizedRaw;
      return matchesGroq([title?.en, title?.es, title?.fr, title?.ar], q);
    })
    .map((row) => ({ raw: row, date: effectiveDate(row, shape) }))
    .filter(({ date }) => withinWhen(date, opts.when));
}

/** `| order(coalesce(…) desc)`, then the GROQ slice. */
function newestFirst<T extends { date: string | null }>(list: T[], limit: number): T[] {
  return [...list].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).slice(0, limit);
}

export async function getRegionHighlightItems(
  type: string,
  params: { theme: string; q: string; when: WhenFilter },
): Promise<RegionHighlightItemRow[]> {
  const shape = SHAPES[type];
  const candidates = await rows(type, { ...params, requireGeotag: true, select: { card: true } });
  if (!candidates || !shape) return [];
  return newestFirst(candidates, 30).map(({ raw }) => ({
    ...toItemRow(raw, type, shape),
    regionKey: regionKeyOf(raw, shape),
  }));
}

export async function getRegionRecentItems(
  type: string,
  params: { theme: string; q: string; when: WhenFilter; limit: number },
): Promise<RegionItemRow[]> {
  const shape = SHAPES[type];
  const candidates = await rows(type, { ...params, requireGeotag: true, select: { card: true } });
  if (!candidates || !shape) return [];
  return newestFirst(candidates, params.limit).map(({ raw }) => toItemRow(raw, type, shape));
}

export async function getRegionFacetItems(
  type: string,
  params: { region: string; slug: string; regionCountries: string[]; theme: string; q: string; when: WhenFilter },
): Promise<RegionItemRow[]> {
  const shape = SHAPES[type];
  const candidates = await rows(type, {
    theme: params.theme,
    q: params.q,
    when: params.when,
    region: { region: params.region, slug: params.slug, regionCountries: params.regionCountries },
    // The single-region query has no `defined(geotag)` predicate — region
    // membership is the filter, and a doc attributed by a community reference
    // alone still belongs on the cards.
    requireGeotag: false,
    select: { card: true },
  });
  if (!candidates || !shape) return [];
  return newestFirst(candidates, 12).map(({ raw }) => toItemRow(raw, type, shape));
}

export async function getRegionPinRows(
  type: FacetContentType,
  params: { region: string; slug: string; regionCountries: string[]; themeSlug: string | null; q: string; when: WhenFilter },
): Promise<RegionPinRow[]> {
  const shape = SHAPES[type];
  const candidates = await rows(type, {
    theme: params.themeSlug,
    q: params.q,
    when: params.when,
    // `region === "all"` is the global map: `regionMatchFilter("all")` drops
    // the predicate entirely.
    region:
      params.region === "all"
        ? undefined
        : { region: params.region, slug: params.slug, regionCountries: params.regionCountries },
    requireGeotag: false,
    select: {},
  });
  if (!candidates || !shape) return [];
  return candidates.map(({ raw }) => {
    const place = raw.place as Record<string, unknown> | null | undefined;
    const point =
      shape.pinPlace === "caseStudy"
        ? geoPoint(raw.studyLocation)
        : shape.pinPlace === "place"
          ? geoPoint(place?.point)
          : null;
    const precision =
      shape.pinPlace === "caseStudy"
        ? (text(raw.locationPrecision) ?? "city")
        : shape.pinPlace === "place"
          ? (text(place?.precision) ?? "city")
          : null;
    const countryCode3 =
      shape.pinPlace === "caseStudy"
        ? text(raw.locationCountryCode)
        : shape.pinPlace === "place"
          ? text(place?.countryCode)
          : null;
    return {
      _id: String(raw.id),
      title: titleOf(raw) || null,
      slug: text(raw.slug),
      point: point ?? null,
      precision,
      countryCode3,
    };
  });
}

export async function getRegionFacetCounts(
  type: FacetContentType,
  params: { theme: string | null; q: string; when: WhenFilter },
): Promise<RegionFacetCountRow[]> {
  const shape = SHAPES[type];
  const candidates = await rows(type, {
    theme: params.theme,
    q: params.q,
    when: params.when,
    // No region predicate: the route sums these itself, and `rows.length`
    // doubles as the facet's global total.
    requireGeotag: false,
    select: {},
  });
  if (!candidates || !shape) return [];
  return candidates.map(({ raw }) => {
    const place = raw.place as Record<string, unknown> | null | undefined;
    const list = shape.relatedCommunities && Array.isArray(raw.relatedCommunities) ? raw.relatedCommunities : null;
    return {
      code: shape.region === "code" ? text(raw.region) : relatedId(raw.region),
      rcSlug: shape.relatedCommunity ? relatedSlug(raw.relatedCommunity) : null,
      rcSlugs: list ? list.map((entry) => relatedSlug(entry)) : null,
      countryCode3: text(raw.locationCountryCode) ?? text(place?.countryCode),
    };
  });
}
