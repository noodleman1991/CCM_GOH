/** Pure parsing for section-focus.tsx — no imports, safe in the admin bundle. */
export function parseSectionTarget(hash: string): { field: "sections" | "sectionsByLanguage"; row: number } | null {
  const m = /^#(sections|sectionsByLanguage)-row-(\d+)$/.exec(hash);
  return m ? { field: m[1] as "sections" | "sectionsByLanguage", row: Number(m[2]) } : null;
}

/** The site path "Back to the page" returns to — same-site paths only (see lib/cms/edit-links.ts). */
export function backPath(search: string): string | null {
  const from = new URLSearchParams(search).get("from");
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) return null;
  return from;
}
