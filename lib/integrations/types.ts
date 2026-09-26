/**
 * Shared shape for an imported academic "work" (publication / project), mapped
 * from ORCID or OpenAlex into something that prefills a RecentWork entry. The
 * user reviews these before saving — nothing is written automatically.
 */
export interface ImportedWork {
  title: string;
  /** Publication / venue / journal name, used as the description. */
  description: string;
  /** External URL (DOI, landing page) if available. */
  link: string | null;
  /** Publication year (start date) if available. */
  year: number | null;
  /** Stable id from the source, for de-duping across imports. */
  sourceId: string;
}

/** A normalised affiliation (employment / education) for org/position prefill. */
export interface ImportedAffiliation {
  organization: string;
  role: string | null;
}

export interface ImportResult {
  works: ImportedWork[];
  affiliations: ImportedAffiliation[];
}
