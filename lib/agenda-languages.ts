/**
 * Derive the set of languages an agenda/report is available in, for the Algolia
 * `languages` facet — instead of hardcoding "en". A document is "available" in a
 * language if it has a file in that language OR a non-empty localized title.
 */
type LocalizedTitle = Record<string, string | undefined> | null | undefined;
type AgendaFile = { language?: string } | null | undefined;

const SUPPORTED = ["en", "es", "fr", "ar"] as const;

export function deriveAgendaLanguages(
  files: AgendaFile[] | null | undefined,
  title: LocalizedTitle
): string[] {
  const langs = new Set<string>();

  for (const f of files ?? []) {
    if (f?.language && (SUPPORTED as readonly string[]).includes(f.language)) {
      langs.add(f.language);
    }
  }
  for (const code of SUPPORTED) {
    const v = title?.[code];
    if (typeof v === "string" && v.trim()) langs.add(code);
  }

  // Always return at least "en" so the facet/record is never empty.
  if (langs.size === 0) langs.add("en");

  // Return in canonical order for stable records.
  return SUPPORTED.filter((c) => langs.has(c));
}
