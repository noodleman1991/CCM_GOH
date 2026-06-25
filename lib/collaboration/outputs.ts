/** The hub output types a workspace can produce/link (Sanity documents). */
export const OUTPUT_TYPES = [
  { type: "caseStudy", label: "Case study", route: "/research-and-action/case-studies" },
  { type: "livedExperience", label: "Lived experience", route: "/lived-experiences" },
  { type: "researchOutput", label: "Research output", route: "/research-and-action/research-outputs" },
] as const;

const TYPE_SET = new Set(OUTPUT_TYPES.map((o) => o.type));
export function isOutputType(v: string): boolean {
  return TYPE_SET.has(v as (typeof OUTPUT_TYPES)[number]["type"]);
}

export function outputDetailHref(type: string, slug: string): string {
  const def = OUTPUT_TYPES.find((o) => o.type === type);
  return def ? `${def.route}/${slug}` : "#";
}

const STATUSES = new Set(["draft", "pending", "revision", "approved"]);
export function mapSanityStatus(status: string | undefined): "draft" | "pending" | "revision" | "approved" {
  return status && STATUSES.has(status) ? (status as "draft" | "pending" | "revision" | "approved") : "draft";
}
