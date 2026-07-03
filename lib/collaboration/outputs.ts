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

export type OutputRow = { id: string; sanityId: string; sanityType: string; title: string; status: string };
export type OutputDoc = { _id: string; title?: string; status?: string; slug?: string | null };
export type EnrichedOutput = OutputRow & { slug: string | null };

/** Merge live Sanity docs onto cached workspace-output rows (drafts.-prefix
 *  tolerant on either side). Live title/status win; missing doc keeps the
 *  cached row so the workspace still renders when Sanity is unreachable. */
export function mergeOutputDocs(rows: OutputRow[], docs: OutputDoc[]): EnrichedOutput[] {
  const norm = (id: string) => id.replace(/^drafts\./, "");
  const byId = new Map(docs.map((d) => [norm(d._id), d]));
  return rows.map((row) => {
    const d = byId.get(norm(row.sanityId));
    return {
      ...row,
      title: d?.title || row.title,
      status: d?.status !== undefined ? mapSanityStatus(d.status) : row.status,
      slug: d?.slug ?? null,
    };
  });
}
