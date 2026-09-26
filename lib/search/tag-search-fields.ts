/**
 * Tags → the three search-record fields (tag audit, 2026-09-17).
 *
 * Before this the case_studies and agendas indices held ZERO tag values: their
 * readers projected `tags[]->{name}`, a field a tag never had, and news kept
 * the English label only, so a search in Arabic never matched a tag. Every
 * index-doc reader now returns `{ _id, label, value }` per tag, and this one
 * function turns that into:
 *
 *   tags      — one display label per tag (English, else the first present),
 *               the `tags` facet the list filters and chips already use
 *   tagLabels — every language's label, searchable so /ar finds "حرارة"
 *   tagSlugs  — the stable `value`, a filterOnly facet for ?tags= deep links
 */
export type IndexTag = {
  _id?: string | null;
  label?: Record<string, string | null | undefined> | null;
  value?: string | null;
};

export type TagSearchFields = { tags: string[]; tagLabels: string[]; tagSlugs: string[] };

const LOCALE_ORDER = ["en", "es", "fr", "ar"] as const;

function present(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function tagSearchFields(input: readonly IndexTag[] | null | undefined): TagSearchFields {
  const tags = new Set<string>();
  const tagLabels = new Set<string>();
  const tagSlugs = new Set<string>();
  for (const tag of input ?? []) {
    const label = tag?.label ?? {};
    const ordered = [
      ...LOCALE_ORDER.map((l) => label[l]),
      ...Object.entries(label)
        .filter(([l]) => !(LOCALE_ORDER as readonly string[]).includes(l))
        .map(([, v]) => v),
    ].filter(present);
    if (ordered.length === 0) continue; // a tag with no label has nothing to search or show
    tags.add(ordered[0]);
    for (const l of ordered) tagLabels.add(l);
    if (present(tag.value)) tagSlugs.add(tag.value);
  }
  return { tags: [...tags], tagLabels: [...tagLabels], tagSlugs: [...tagSlugs] };
}
