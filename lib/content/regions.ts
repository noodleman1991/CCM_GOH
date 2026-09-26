import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import * as payloadRegions from "@/lib/content/internal/payload/regions";
import { safe } from "@/lib/content/internal/safe";
import { query, queryPreviewable } from "@/lib/content/internal/sanity-source";
import { qFilter, regionMatchFilter, statusFilter, themeFilter } from "@/lib/maps/content-filter";
import type { WhenFilter } from "@/lib/maps/date-filter";
import type { RegionCode } from "@/lib/maps/region-codes";
import { RC_SLUG_TO_REGION } from "@/lib/maps/region-codes";
import { FALLBACK_THEMES, type ThemeOption } from "@/lib/maps/region-facets";
import type { FacetContentType } from "@/lib/maps/cluster-pins";

/**
 * Normalizer decision: `toTag`/`toRegion` (lib/content/internal/normalize.ts)
 * are declined for every projection in this module. None of the six queries
 * below dereference a `tag[]->{ _id, label, value, color }` or
 * `region->{ _id, name, "slug": slug.current }` shape — they return flat
 * item/pin/count rows keyed by `_id`/`code`/`slug` with no `label`/`name`
 * field at all, or (themes/art) slug-keyed CMS records with their own
 * bespoke shapes. A genuine mismatch, not a shortcut.
 *
 * `getRegionalCommunities()`, sketched in this task's brief interface list,
 * is NOT implemented here: no call site under app/api/maps, lib/maps,
 * components/atlas or components/regions fetches the plain regionalCommunity
 * list (that domain's 7 fixed regions are addressed via the hardcoded
 * REGION_CODES/RC_SLUG_TO_REGION tables in region-codes.ts, unrelated to this
 * migration). A same-named, differently-shaped function already exists in
 * `lib/content/news.ts` (Task 4) for the news filter dropdown — see the Task
 * 7 report for the full reasoning.
 */

// ---------------------------------------------------------------------------
// Which store answers
//
// Phase 3 moves this module to Payload behind `CONTENT_BACKEND` (or
// `CONTENT_BACKEND_REGIONS` for this module alone). Every export keeps its
// signature; the branch is one line inside each. Note where the branch sits
// relative to `safe()`: INSIDE it for the two wrapped reads, so a Payload
// failure degrades to the same fallback the Sanity one does, and at the top
// for the five atlas queries, which are deliberately unwrapped so their
// callers keep pooling / propagating / isolating failures exactly as they do
// today. `activeBackend()` is read per call, so a test or a preview deployment
// can flip it after this module is imported.
// ---------------------------------------------------------------------------

const DOMAIN = "regions";

function onPayload(): boolean {
  return activeBackend(DOMAIN) === "payload";
}

// ---------------------------------------------------------------------------
// Atlas theme facet (lib/maps/themes.ts, re-exported from there so its five
// existing importers keep their import path). Original called `client.fetch`
// directly → `query()` (forces published).
// ---------------------------------------------------------------------------

interface RawThemeTagRow {
  slug: string | null;
  label: Partial<Record<"en" | "es" | "fr" | "ar", string>> | null;
}

/**
 * Server-side fetch of the CMS-driven Atlas theme facet: any `tag` document
 * flagged `useAsTheme` becomes a selectable theme, ordered by the tag's
 * orderRank. Falls back to `FALLBACK_THEMES` (see lib/maps/region-facets.ts)
 * when the CMS has none flagged, or when the fetch itself fails — the Atlas
 * theme facet should never hard-fail the page.
 */
export async function getThemeOptions(): Promise<ThemeOption[]> {
  return safe("region-themes", FALLBACK_THEMES, async () => {
    const options = onPayload() ? await payloadRegions.getThemeOptions() : await sanityThemeOptions();
    return options.length > 0 ? options : FALLBACK_THEMES;
  });
}

async function sanityThemeOptions(): Promise<ThemeOption[]> {
  const rows = await query<RawThemeTagRow[]>(
    `*[_type == "tag" && useAsTheme == true] | order(orderRank) {
        "slug": value.current,
        label
      }`,
  );

  return rows
    .filter(
      (r): r is { slug: string; label: Partial<Record<"en" | "es" | "fr" | "ar", string>> } =>
        typeof r?.slug === "string" && r.slug.length > 0 && r.label != null && typeof r.label === "object",
    )
    .map((r) => ({
      slug: r.slug,
      label: {
        en: r.label.en,
        es: r.label.es,
        fr: r.label.fr,
        ar: r.label.ar,
      },
    }));
}

// ---------------------------------------------------------------------------
// Regional-spotlight banner art (lib/maps/region-art.ts, re-exported from
// there so its importers — the getRegionArt() call sites AND the two
// `import type { RegionArt }` sites — keep their import path). Original
// called `sanityFetch` (== `cachedFetch`) with ONLY `query` — no
// `perspective`/`stega` — so it falls through to cachedFetch's own
// draftMode() check → `queryPreviewable()`, not `query()`.
// ---------------------------------------------------------------------------

export type RegionArt = { url: string; lqip: string | null };

interface RawRegionArtRow {
  slug: string;
  url: string | null;
  lqip: string | null;
}

/**
 * The Regional-spotlight banner art (mock v6 §3): each regional community
 * page's welcome-hero image, keyed by region code. Server-only; the explorer
 * threads the map down as a plain prop. A region without art (or a failed
 * fetch) simply isn't in the map — the spotlight falls back to its
 * sea→midnight gradient + silhouette watermark.
 */
export async function getRegionArt(): Promise<Partial<Record<RegionCode, RegionArt>>> {
  return safe("region-art", {}, async () => {
    if (onPayload()) return payloadRegions.getRegionArt();
    const rows = await queryPreviewable<RawRegionArtRow[]>(
      `*[_type == "regionalCommunityPage" && defined(welcomeHero.image.asset)]{
        "slug": slug.current,
        "url": welcomeHero.image.asset->url,
        "lqip": welcomeHero.image.asset->metadata.lqip
      }`,
    );
    const art: Partial<Record<RegionCode, RegionArt>> = {};
    for (const row of rows ?? []) {
      const code = RC_SLUG_TO_REGION[row.slug];
      if (code && row.url) art[code] = { url: row.url, lqip: row.lqip };
    }
    return art;
  });
}

// ---------------------------------------------------------------------------
// Region content cards (app/api/maps/region-items/route.ts) — the Atlas
// drill-in cards, the homepage "Around the regions" highlights, and the
// no-selection "recent everywhere" row. Each mode fans out one query PER
// requested content type via Promise.all; the route composes/groups/sorts,
// this module only fetches one type's slice. All three call sites used
// `client.fetch` directly → `query()`. The route's own try/catch around each
// Promise.all is untouched, so a rejection here still degrades that branch to
// `{ items: [] }` exactly as before — these functions do not wrap themselves
// in `safe()`, or a single type's failure would stop being pooled with its
// siblings' failures the way the original Promise.all did.
// ---------------------------------------------------------------------------

// Image + LQIP projection: caseStudy/newsPost use `image`, researchOutput uses
// `coverImage`, livedExperience has neither general field (thumbnail is
// video-only) — `image` resolves to null for it, and the card falls back to
// the LocaleMap/tinted placeholder (spec E1).
const REGION_ITEM_IMAGE_PROJECTION = `"image": coalesce(image.asset->url, coverImage.asset->url), "imageLqip": coalesce(image.asset->metadata.lqip, coverImage.asset->metadata.lqip)`;

// Place text + ISO alpha-3, per type's actual schema fields (verified against
// sanity/schemas/documents/{case-study,lived-experience,news-post}.ts):
//   - caseStudy: legacy scalar fields `locationDisplayText` (preferred) or
//     `locationText.city`/`.country`, `locationCountryCode`.
//   - livedExperience / newsPost: the shared `place` object (`place.text`,
//     `place.countryCode`).
//   - researchOutput: no place fields — always null (card omits the line).
function regionItemPlaceProjection(type: string): string {
  return type === "caseStudy"
    ? `"place": coalesce(locationDisplayText, locationText.city, locationText.country), "countryCode3": locationCountryCode`
    : type === "livedExperience" || type === "newsPost"
      ? `"place": place.text, "countryCode3": place.countryCode`
      : `"place": null, "countryCode3": null`;
}

export interface RegionItemRow {
  id: string;
  type: string;
  title: string;
  slug: string | null;
  image: string | null;
  imageLqip: string | null;
  place: string | null;
  countryCode3: string | null;
  date: string | null;
}

export interface RegionHighlightItemRow extends RegionItemRow {
  regionKey: string | null;
}

/**
 * "Around the regions" (homepage embed, mock v6 §1) per-type slice: the
 * newest 30 geotagged items of `type`, so the route can pick the single
 * newest per region across every type. Moved verbatim from region-items'
 * `mode=highlights` branch — including the `theme`-keyed (not `themeSlug`)
 * param, which does not actually bind `themeFilter()`'s `$themeSlug`
 * reference. That mismatch predates this migration; preserved as-is per the
 * byte-identical mandate rather than fixed here.
 */
export async function getRegionHighlightItems(
  type: string,
  params: { theme: string; q: string; when: WhenFilter },
): Promise<RegionHighlightItemRow[]> {
  if (onPayload()) return payloadRegions.getRegionHighlightItems(type, params);
  return query<RegionHighlightItemRow[]>(
    `*[_type == $type${statusFilter(type)}${themeFilter(params.theme)}${qFilter(params.q)}${params.when.filter} && defined(coalesce(studyLocation, place.point, locationCountryCode, place.countryCode))] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...30]{
      "id": _id,
      "type": _type,
      "title": coalesce(title.en, title, ""),
      "slug": slug.current,
      ${REGION_ITEM_IMAGE_PROJECTION},
      ${regionItemPlaceProjection(type)},
      "date": coalesce(publishedAt, publishDate, _createdAt),
      "regionKey": coalesce(region, relatedCommunity->slug.current, relatedCommunities[0]->slug.current)
    }`,
    { type, theme: params.theme, q: params.q, ...params.when.params },
  );
}

/**
 * `region=all` recent-everywhere per-type slice: the newest `limit` geotagged
 * items of `type`, merged/re-sorted/capped by the route across every
 * requested type. Moved verbatim from region-items' `region === "all"`
 * branch — same `theme`-not-`themeSlug` param mismatch as the highlights
 * query above, preserved as-is.
 */
export async function getRegionRecentItems(
  type: string,
  params: { theme: string; q: string; when: WhenFilter; limit: number },
): Promise<RegionItemRow[]> {
  if (onPayload()) return payloadRegions.getRegionRecentItems(type, params);
  return query<RegionItemRow[]>(
    `*[_type == $type${statusFilter(type)}${themeFilter(params.theme)}${qFilter(params.q)}${params.when.filter} && defined(coalesce(studyLocation, place.point, locationCountryCode, place.countryCode))] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...${params.limit}]{
      "id": _id,
      "type": _type,
      "title": coalesce(title.en, title, ""),
      "slug": slug.current,
      ${REGION_ITEM_IMAGE_PROJECTION},
      ${regionItemPlaceProjection(type)},
      "date": coalesce(publishedAt, publishDate, _createdAt)
    }`,
    { type, theme: params.theme, q: params.q, ...params.when.params },
  );
}

/**
 * Single-region drill-in per-type slice (spec D2/E1): the newest 12 items of
 * `type` belonging to `region`, via the shared trust-contract predicates
 * (lib/maps/content-filter.ts) so counts/cards/pins describe the same set.
 * Moved verbatim from region-items' default (single-region) branch — this is
 * the one region-items call site that correctly binds `themeSlug`.
 */
export async function getRegionFacetItems(
  type: string,
  params: { region: string; slug: string; regionCountries: string[]; theme: string; q: string; when: WhenFilter },
): Promise<RegionItemRow[]> {
  if (onPayload()) return payloadRegions.getRegionFacetItems(type, params);
  return query<RegionItemRow[]>(
    `*[_type == $type${statusFilter(type)}${regionMatchFilter()}${themeFilter(params.theme)}${qFilter(params.q)}${params.when.filter}] | order(coalesce(publishedAt, publishDate, _createdAt) desc)[0...12]{
      "id": _id,
      "type": _type,
      "title": coalesce(title.en, title, ""),
      "slug": slug.current,
      ${REGION_ITEM_IMAGE_PROJECTION},
      ${regionItemPlaceProjection(type)},
      "date": coalesce(publishedAt, publishDate, _createdAt)
    }`,
    {
      type,
      region: params.region,
      slug: params.slug,
      regionCountries: params.regionCountries,
      themeSlug: params.theme,
      q: params.q,
      ...params.when.params,
    },
  );
}

// ---------------------------------------------------------------------------
// Region pins (app/api/maps/region-pins/route.ts) — the map's pin layer, one
// query per requested facet's content type. Original called `client.fetch`
// directly → `query()`. The route has NO try/catch around its Promise.all, so
// a rejection here propagates and fails the request exactly as before — this
// function is a bare, unwrapped query.
// ---------------------------------------------------------------------------

export interface RegionPinRow {
  _id: string;
  title: string | null;
  slug: string | null;
  point: { lat: number; lng: number } | null;
  precision: string | null;
  countryCode3: string | null;
}

/**
 * Per-type place fields (verified against each document schema — see
 * sanity/schemas/documents/{case-study,lived-experience,news-post,research-output}.ts):
 *   - caseStudy: legacy scalar fields — `studyLocation` (geopoint),
 *     `locationPrecision` (default "city"), `locationCountryCode` (alpha-3).
 *   - livedExperience / newsPost / researchOutput: the shared `place` object —
 *     `place.point` / `place.precision` / `place.countryCode`.
 */
function regionPinPlaceProjection(type: FacetContentType): string {
  return type === "caseStudy"
    ? `"point": studyLocation, "precision": coalesce(locationPrecision, "city"), "countryCode3": locationCountryCode`
    : type === "livedExperience" || type === "newsPost" || type === "researchOutput"
      ? `"point": place.point, "precision": coalesce(place.precision, "city"), "countryCode3": place.countryCode`
      : `"point": null, "precision": null, "countryCode3": null`;
}

/**
 * Geotagged rows for the pin layer, for one content type. Region matching
 * mirrors `getRegionFacetItems`'s tolerant OR (works whether a doc has the
 * singular `relatedCommunity` ref or the plural `relatedCommunities[]` ref —
 * GROQ returns null/[] for a field a type doesn't define). `region === "all"`
 * (the global map view) drops the region predicate via the shared fragment.
 */
export async function getRegionPinRows(
  type: FacetContentType,
  params: { region: string; slug: string; regionCountries: string[]; themeSlug: string | null; q: string; when: WhenFilter },
): Promise<RegionPinRow[]> {
  if (onPayload()) return payloadRegions.getRegionPinRows(type, params);
  return query<RegionPinRow[]>(
    `*[_type == $type${statusFilter(type)}${regionMatchFilter(params.region === "all" ? "all" : "region")}${themeFilter(params.themeSlug)}${qFilter(params.q)}${params.when.filter}]{
      _id, "title": coalesce(title.en, title), "slug": slug.current, ${regionPinPlaceProjection(type)}
    }`,
    {
      type,
      region: params.region,
      slug: params.slug,
      regionCountries: params.regionCountries,
      q: params.q,
      themeSlug: params.themeSlug ?? "",
      ...params.when.params,
    },
  );
}

// ---------------------------------------------------------------------------
// Region data (app/api/maps/region-data/route.ts) — per-facet region counts
// for the choropleth. Original called `client.fetch` directly → `query()`.
// The route wraps its caller (`countsForFacet`) in `Promise.allSettled`,
// degrading just that facet to zeroed counts on rejection — this function
// stays a bare, unwrapped query so that per-facet isolation is untouched.
// ---------------------------------------------------------------------------

export interface RegionFacetCountRow {
  code: string | null;
  rcSlug: string | null;
  rcSlugs: (string | null)[] | null;
  countryCode3: string | null;
}

/**
 * Per-region counts for one facet's content type. `type` is interpolated
 * directly into the query (not bound as `$type`) — moved verbatim from
 * region-data's `countsForFacet`, which built the filter string with a
 * template literal rather than a bound param. No region predicate: the
 * route sums this itself (see `regionMatchFilter`/region-items/region-pins
 * for the per-region equivalent) — `rows.length` doubles as the facet's
 * global total.
 */
export async function getRegionFacetCounts(
  type: FacetContentType,
  params: { theme: string | null; q: string; when: WhenFilter },
): Promise<RegionFacetCountRow[]> {
  if (onPayload()) return payloadRegions.getRegionFacetCounts(type, params);
  const filters = statusFilter(type) + themeFilter(params.theme) + qFilter(params.q);
  return query<RegionFacetCountRow[]>(
    `*[_type == "${type}"${filters}${params.when.filter}]{
           "code": region,
           "rcSlug": relatedCommunity->slug.current,
           "rcSlugs": relatedCommunities[]->slug.current,
           "countryCode3": coalesce(locationCountryCode, place.countryCode)
         }`,
    { q: params.q, themeSlug: params.theme ?? "", ...params.when.params },
  );
}
