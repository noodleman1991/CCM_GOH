import type { ImportedWork, ImportedAffiliation, ImportResult } from "./types";
import { normalizeOrcidId } from "./openalex";

/**
 * ORCID Public API — the researcher-identity source. Reads publicly-visible
 * works + affiliations (employment / education) for a given ORCID iD. No
 * per-user OAuth needed for public data; the Public API base is open.
 *
 * The mapping functions are the tested core; fetchOrcid is a thin wrapper.
 * Docs: https://info.orcid.org/documentation/
 */

const ORCID_PUBLIC_BASE = process.env.ORCID_API_BASE || "https://pub.orcid.org/v3.0";

/** Bare 0000-0000-0000-0000 form for path use. */
export function orcidPath(input: string): string | null {
  const m = input.trim().match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  return m ? m[1].toUpperCase() : null;
}

/** Subsets of the ORCID Public API payloads that the mappers read. */
interface OrcidExternalId {
  "external-id-type"?: string | null;
  "external-id-value"?: string | null;
  "external-id-url"?: { value?: string | null } | null;
}

interface OrcidWorkSummary {
  "put-code"?: number | string | null;
  title?: { title?: { value?: string | null } | null } | null;
  "journal-title"?: { value?: string | null } | null;
  "publication-date"?: { year?: { value?: string | number | null } | null } | null;
  "external-ids"?: { "external-id"?: OrcidExternalId[] | null } | null;
  url?: { value?: string | null } | null;
}

interface OrcidWorksGroup {
  group?: Array<{ "work-summary"?: OrcidWorkSummary[] | null } | null> | null;
}

interface OrcidAffiliationSummary {
  organization?: { name?: string | null } | null;
  "role-title"?: string | null;
}

interface OrcidAffiliationsGroup {
  "affiliation-group"?: Array<{
    summaries?: Array<{
      "employment-summary"?: OrcidAffiliationSummary | null;
      "education-summary"?: OrcidAffiliationSummary | null;
    } | null> | null;
  } | null> | null;
}

/** Map an ORCID `works` group → ImportedWork[]. */
export function mapOrcidWorks(worksGroup: OrcidWorksGroup | null | undefined): ImportedWork[] {
  const groups = worksGroup?.group || [];
  const out: ImportedWork[] = [];
  for (const g of groups) {
    const summary = g?.["work-summary"]?.[0];
    if (!summary) continue;
    const title: string = summary?.title?.title?.value || "";
    if (!title) continue;
    const journal: string = summary?.["journal-title"]?.value || "";
    const year = summary?.["publication-date"]?.year?.value
      ? Number(summary["publication-date"].year.value)
      : null;
    // Prefer a DOI/URL external id, else the work's url.
    const extIds = summary?.["external-ids"]?.["external-id"] || [];
    const doi = extIds.find((e) => String(e?.["external-id-type"]).toLowerCase() === "doi");
    const link =
      doi?.["external-id-url"]?.value ||
      doi?.["external-id-value"] ||
      summary?.url?.value ||
      null;
    out.push({
      title,
      description: journal || "",
      link: link ? (String(link).startsWith("http") ? link : `https://doi.org/${link}`) : null,
      year: Number.isFinite(year as number) ? (year as number) : null,
      sourceId: String(summary?.["put-code"] || title),
    });
  }
  return out;
}

/** Map an ORCID affiliations group (employments/educations) → ImportedAffiliation[]. */
export function mapOrcidAffiliations(group: OrcidAffiliationsGroup | null | undefined): ImportedAffiliation[] {
  const summaries = group?.["affiliation-group"] || [];
  const out: ImportedAffiliation[] = [];
  for (const ag of summaries) {
    const s = ag?.summaries?.[0];
    const summary = s?.["employment-summary"] || s?.["education-summary"];
    if (!summary) continue;
    const org: string = summary?.organization?.name || "";
    if (!org) continue;
    out.push({ organization: org, role: summary?.["role-title"] || null });
  }
  return out;
}

/** Fetch + map public works + affiliations for an ORCID iD. */
export async function fetchOrcid(orcid: string): Promise<ImportResult> {
  const path = orcidPath(orcid);
  if (!path) return { works: [], affiliations: [] };

  const headers = { Accept: "application/json" };
  const [worksRes, empRes, eduRes] = await Promise.all([
    fetch(`${ORCID_PUBLIC_BASE}/${path}/works`, { headers }),
    fetch(`${ORCID_PUBLIC_BASE}/${path}/employments`, { headers }),
    fetch(`${ORCID_PUBLIC_BASE}/${path}/educations`, { headers }),
  ]);

  const works = worksRes.ok ? mapOrcidWorks(await worksRes.json()) : [];
  const employments = empRes.ok ? mapOrcidAffiliations(await empRes.json()) : [];
  const educations = eduRes.ok ? mapOrcidAffiliations(await eduRes.json()) : [];

  return { works, affiliations: [...employments, ...educations] };
}

export { normalizeOrcidId };
