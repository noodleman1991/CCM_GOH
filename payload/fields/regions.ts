/**
 * The fixed seven hub regions as Payload select options.
 *
 * Values match `REGION_OPTIONS` (lib/content/taxonomy-options.ts) and
 * `REGION_CODES` (lib/maps/region-codes.ts) exactly — inlined rather than
 * imported, since Payload code stays out of `lib/content/`. Moved here from
 * payload/collections/regional-communities.ts so blocks can offer the same list.
 */
export const REGION_OPTIONS = [
  { label: "Sub-Saharan Africa", value: "ssa" },
  { label: "Northern Africa & Western Asia", value: "nawa" },
  { label: "Central & Southern Asia", value: "csa" },
  { label: "Eastern & South-Eastern Asia", value: "esea" },
  { label: "Latin America & the Caribbean", value: "lac" },
  { label: "Oceania", value: "oce" },
  { label: "Europe & Northern America", value: "enam" },
];
