/**
 * The admin home's "Needs tags" panel (filters spec §3.6) — pure, safe for any
 * admin component. Visitors filter by Themes (topic + impact tags) and
 * Communities (audience tags); an item without them can't be found that way.
 *
 * Links list the items by id: Payload's list filters can't say "has no
 * audience tag" (`not_in` on a hasMany matches any item with some other tag).
 */
const THEME_CATEGORIES = new Set(["topic", "impact"]);
const COMMUNITY_CATEGORIES = new Set(["audience"]);

export type TagGaps = { total: number; noThemes: string[]; noCommunities: string[] };
export type TagGapCount = TagGaps & { collection: string; label: string };
export type GapLink = { count: number; href: string | null };
export type NeedsTagsRow = { collection: string; label: string; total: number; noThemes: GapLink; noCommunities: GapLink };

const idOf = (t: unknown) =>
  typeof t === "string" || typeof t === "number" ? String(t) : t && typeof t === "object" && "id" in t ? String((t as { id: unknown }).id) : null;

/** The items that lack a theme tag and those that lack a community tag. `categories` maps tag id → category. */
export function countTagGaps(items: Array<{ id?: unknown; tags?: unknown }>, categories: Map<string, string>): TagGaps {
  const noThemes: string[] = [];
  const noCommunities: string[] = [];
  for (const item of items) {
    const id = idOf(item.id) ?? "";
    const kinds = (Array.isArray(item.tags) ? item.tags : []).map((t) => categories.get(idOf(t) ?? "") ?? "");
    if (!kinds.some((k) => THEME_CATEGORIES.has(k))) noThemes.push(id);
    if (!kinds.some((k) => COMMUNITY_CATEGORIES.has(k))) noCommunities.push(id);
  }
  return { total: items.length, noThemes, noCommunities };
}

const link = (collection: string, ids: string[]): GapLink => ({
  count: ids.length,
  href: ids.length ? `/admin/collections/${collection}?where[id][in]=${ids.map(encodeURIComponent).join(",")}` : null,
});

/** One row per content type that is missing something. */
export function needsTagsRows(counts: TagGapCount[]): NeedsTagsRow[] {
  return counts
    .filter((c) => c.noThemes.length > 0 || c.noCommunities.length > 0)
    .map((c) => ({
      collection: c.collection,
      label: c.label,
      total: c.total,
      noThemes: link(c.collection, c.noThemes),
      noCommunities: link(c.collection, c.noCommunities),
    }));
}
