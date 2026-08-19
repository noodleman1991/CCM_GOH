import type { ImportedWork } from "./types";

/**
 * OpenAlex — free, no API key required. Fetches a researcher's works by their
 * ORCID iD. Best complement to ORCID's own record (broad coverage). The mapping
 * is the testable core; the fetch is a thin wrapper.
 *
 * Docs: https://docs.openalex.org/api-entities/works
 */

const OPENALEX_BASE = "https://api.openalex.org";
// OpenAlex asks callers to identify themselves via a mailto for the polite pool.
const MAILTO = process.env.OPENALEX_MAILTO || "hello@connectingclimateminds.org";

/** Normalise an ORCID iD to the canonical https URL OpenAlex expects. */
export function normalizeOrcidId(input: string): string | null {
  const m = input.trim().match(/(\d{4}-\d{4}-\d{4}-\d{3}[\dX])/i);
  if (!m) return null;
  return `https://orcid.org/${m[1].toUpperCase()}`;
}

/** Subset of an OpenAlex work object that the mapper reads. */
interface OpenAlexWork {
  id?: string | null;
  title?: string | null;
  display_name?: string | null;
  doi?: string | null;
  publication_year?: number | null;
  primary_location?: {
    source?: { display_name?: string | null } | null;
    landing_page_url?: string | null;
  } | null;
  host_venue?: { display_name?: string | null } | null;
}

/** Map one OpenAlex work object → our ImportedWork. */
export function mapOpenAlexWork(w: OpenAlexWork | null | undefined): ImportedWork | null {
  const title: string = w?.title || w?.display_name || "";
  if (!title) return null;
  const venue =
    w?.primary_location?.source?.display_name ||
    w?.host_venue?.display_name ||
    "";
  const link: string | null = w?.doi || w?.primary_location?.landing_page_url || w?.id || null;
  return {
    title,
    description: venue || "",
    link,
    year: typeof w?.publication_year === "number" ? w.publication_year : null,
    sourceId: String(w?.id || link || title),
  };
}

/** Fetch + map a researcher's works from OpenAlex by ORCID iD. */
export async function fetchOpenAlexWorks(orcid: string, limit = 25): Promise<ImportedWork[]> {
  const id = normalizeOrcidId(orcid);
  if (!id) return [];
  const url =
    `${OPENALEX_BASE}/works?filter=author.orcid:${encodeURIComponent(id)}` +
    `&per_page=${Math.min(limit, 50)}&sort=publication_date:desc&mailto=${encodeURIComponent(MAILTO)}`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const json = await res.json();
  const works: OpenAlexWork[] = Array.isArray(json?.results) ? json.results : [];
  return works.map(mapOpenAlexWork).filter((w): w is ImportedWork => w !== null);
}
