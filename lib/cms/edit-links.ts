/**
 * Links from the site into the admin (editor-experience spec §3.1–3.2).
 * Pure — the admin's section-focus component parses the same shape.
 */

/** A same-site path to return to, or null. Rejects absolute and protocol-relative URLs. */
export function safeFrom(from: string | null | undefined): string | null {
  if (typeof from !== "string" || !from.startsWith("/")) return null;
  if (from.startsWith("//") || from.startsWith("/\\")) return null;
  return from;
}

const withFrom = (path: string, from: string) => {
  const back = safeFrom(from);
  return back ? `${path}?from=${encodeURIComponent(back)}` : path;
};

/** The admin page for one section of a Sections list, with the way back. */
export function sectionEditHref(base: string, row: number, from: string): string {
  return `${withFrom(base, from)}#sections-row-${row}`;
}

/** The admin page for one document, with the way back. */
export function documentEditHref(collection: string, id: string, from: string): string {
  return withFrom(`/admin/collections/${collection}/${encodeURIComponent(id)}`, from);
}
