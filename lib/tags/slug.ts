/**
 * The tag slug rule and the "does this edit change what search sees" rule
 * (tag audit, 2026-09-17).
 *
 * Sanity derived `value` from `label.en` through a slug field; the Payload
 * collection had a free-text `value` and no generator, so every editor-created
 * tag depended on someone hand-typing a slug. `tagSlug` is applied by the
 * collection's beforeValidate hook: it fills an empty `value` from the English
 * label and normalises a typed one.
 */
export function tagSlug(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics: Éducation → Education
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export type TagSearchText = {
  label?: Record<string, string | null | undefined> | string | null;
  value?: string | null;
  /** Anything else on the document (colour, category…) is not in the index. */
  [other: string]: unknown;
};

/**
 * A tag's label or slug is copied into every search record of the content
 * that carries it, so an edit to either must fan out a re-index. Colour,
 * category and description are not in the index.
 */
export function tagSearchTextChanged(previous: TagSearchText | undefined, next: TagSearchText): boolean {
  if (!previous) return true;
  if ((previous.value ?? "") !== (next.value ?? "")) return true;
  return JSON.stringify(normalizeLabel(previous.label)) !== JSON.stringify(normalizeLabel(next.label));
}

function normalizeLabel(label: TagSearchText["label"]): Record<string, string> {
  if (!label) return {};
  if (typeof label === "string") return { _: label };
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(label).sort(([a], [b]) => (a < b ? -1 : 1))) {
    if (typeof v === "string" && v.length > 0) out[k] = v;
  }
  return out;
}
