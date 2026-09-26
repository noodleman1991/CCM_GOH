// Maps the legacy homepage fixed fields to an ordered blocks[] array, in §4.1
// order. Used by the staging migration script (scripts/migrate-homepage-to-
// blocks.mjs duplicates FIELD_ORDER because it's plain .mjs). Pure + testable.

const FIELD_ORDER: { field: string; type: string }[] = [
  { field: "heroWelcome", type: "hero-1" },
  { field: "globalAgenda", type: "split-row" },
  { field: "howToUse", type: "split-row" },
  { field: "agendasModule", type: "grid-row" },
  { field: "regionalCommunities", type: "grid-row" },
  { field: "news", type: "grid-row" },
  { field: "livedExperiences", type: "carousel-2" },
  { field: "collaboration", type: "split-row" },
  { field: "projectInfo", type: "split-row" },
  { field: "mentalHealthDefinition", type: "cta-1" },
  { field: "partnerLogos", type: "logo-cloud-1" },
];

export function blocksFromFields(homepage: Record<string, unknown>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  for (const { field, type } of FIELD_ORDER) {
    const val = homepage?.[field];
    if (val && typeof val === "object") {
      const block = val as Record<string, unknown>;
      out.push({
        ...block,
        _type: (block._type as string) || type,
        // Stable key per source field so re-runs converge.
        _key: (block._key as string) || `${type}-${field}`,
      });
    }
  }
  return out;
}
