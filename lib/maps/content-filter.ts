/**
 * The atlas trust contract: counts, cards and pins must describe the SAME set
 * of documents. These fragments are the ONE source of the shared GROQ
 * predicates — region-data (counts), region-items (cards) and region-pins
 * (pins) all compose their filters from here, like they already share
 * `whenFilter()` for dates. Do not re-inline these strings in a route: a
 * one-route drift silently breaks the contract (a region claiming 17 while
 * listing 15) or, worse, leaks non-approved content.
 *
 * Every fragment starts with " && " so it drops into a `*[_type == $type ...]`
 * filter chain; empty string when the filter doesn't apply. Values are always
 * bound GROQ params ($themeSlug, $q, $region, $slug) — never interpolated.
 */

/** Public-visibility gate per content type: caseStudy/researchOutput are
 *  approved-only; livedExperience also admits legacy docs with no status;
 *  newsPost/agenda/report have no review workflow (always public). */
export function statusFilter(type: string): string {
  if (type === "caseStudy" || type === "researchOutput") return ' && status == "approved"';
  if (type === "livedExperience") return ' && (status == "approved" || !defined(status))';
  return "";
}

/** Theme facet: matches when a dereferenced tag slug equals the (already
 *  CMS-validated) theme slug, passed as the bound `$themeSlug` param. */
export function themeFilter(theme?: string | null): string {
  return theme ? " && $themeSlug in tags[]->value.current" : "";
}

/** Free-text facet on the localized titles, bound as `$q`. */
export function qFilter(q?: string | null): string {
  return q ? ' && [title.en, title.es, title.fr, title.ar] match $q + "*"' : "";
}

/** Region attribution: a doc belongs to a region via its `region` short code
 *  OR any referenced community — the singular `relatedCommunity` ref
 *  (caseStudy/livedExperience/newsPost) or the plural `relatedCommunities[]`
 *  (agenda/report) — OR, when it carries no ref at all, a COUNTRY code that
 *  implies a region via `lib/maps/iso-to-region.ts`'s REGION_MEMBERSHIP
 *  (caseStudy's `locationCountryCode` / livedExperience+newsPost's
 *  `place.countryCode`). That third branch is what makes country-backfilled-
 *  but-unreferenced docs (e.g. 35 livedExperience docs with no
 *  `relatedCommunity`) actually count/card/pin for their implied region —
 *  without it a per-region view silently showed 0 for content that DID exist,
 *  just unreferenced (verified root cause, 2026-08-05). GROQ returns null/[]
 *  for fields a type doesn't define, so unused branches are harmless no-ops.
 *  Binds `$region` + `$slug` + `$regionCountries` (build the latter with
 *  `alpha3sForRegion` from `lib/maps/iso-to-region.ts`).
 *
 *  `scope: "all"` drops the predicate entirely (the global map view wants
 *  every region's geotagged docs) — kept HERE, not as an inline '' in a
 *  route, so the trust contract still has one author for region matching. */
export function regionMatchFilter(scope: "region" | "all" = "region"): string {
  if (scope === "all") return "";
  return " && (region == $region || relatedCommunity->slug.current == $slug || $slug in relatedCommunities[]->slug.current || coalesce(locationCountryCode, place.countryCode) in $regionCountries)";
}
