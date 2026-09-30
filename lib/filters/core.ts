/**
 * One filter engine for the atlas and every list page (spec 2026-09-30). Pure:
 * the same function decides both the results and the option counts, so a
 * count can never disagree with what the filter returns.
 */
export type Axis = "communities" | "themes";
export interface FilterTag { slug: string; category: string | null; label: Partial<Record<"en" | "es" | "fr" | "ar", string>> }
export interface FilterableItem { id: string; tags: FilterTag[]; regions: string[]; date: string | null; text: Partial<Record<string, string>> }
export interface ActiveFilters { regions: string[]; communities: string[]; themes: string[]; when: string | null; q: string }
export interface FilterOption { value: string; label: string; count: number }
export interface FilterOptions { regions: FilterOption[]; communities: FilterOption[]; themes: FilterOption[] }

export const EMPTY_FILTERS: ActiveFilters = { regions: [], communities: [], themes: [], when: null, q: "" };
const COMMON_SHARE = 0.9;
const YEAR = 365 * 24 * 60 * 60 * 1000;

export function axisOf(category: string | null): Axis | null {
  if (category === "audience") return "communities";
  if (category === "topic" || category === "impact") return "themes";
  return null;
}

export function isFiltering(a: ActiveFilters): boolean {
  return a.regions.length + a.communities.length + a.themes.length > 0 || Boolean(a.when) || a.q.trim().length > 0;
}

function inWhen(date: string | null, when: string | null, now: Date): boolean {
  if (!when) return true;
  if (!date) return false;
  const age = now.getTime() - new Date(date).getTime();
  if (when === "past-year") return age <= YEAR;
  if (when === "past-3-years") return age <= 3 * YEAR;
  if (when === "earlier") return age > 3 * YEAR;
  if (when === "upcoming") return age < 0;
  if (when === "past") return age >= 0;
  return true;
}

const has = (item: FilterableItem, axis: Axis, values: string[]) =>
  values.length === 0 || item.tags.some((t) => axisOf(t.category) === axis && values.includes(t.slug));

function matches(item: FilterableItem, a: ActiveFilters, now: Date): boolean {
  if (a.regions.length > 0 && !item.regions.some((r) => a.regions.includes(r))) return false;
  if (!has(item, "communities", a.communities) || !has(item, "themes", a.themes)) return false;
  if (!inWhen(item.date, a.when, now)) return false;
  const q = a.q.trim().toLowerCase();
  if (q && !Object.values(item.text).some((t) => t?.toLowerCase().includes(q))) return false;
  return true;
}

export function applyFilters(items: FilterableItem[], active: ActiveFilters, opts: { now?: Date; locale?: string } = {}): FilterableItem[] {
  const now = opts.now ?? new Date();
  return items.filter((i) => matches(i, active, now));
}

const labelFor = (t: FilterTag, locale: string) => t.label[locale as keyof FilterTag["label"]] || t.label.en || t.slug;
const sortOptions = (o: FilterOption[]) => o.sort((x, y) => y.count - x.count || x.label.localeCompare(y.label));

export function buildOptions(
  items: FilterableItem[],
  active: ActiveFilters,
  opts: { locale: string; regionLabel: (code: string) => string; now?: Date },
): FilterOptions {
  const now = opts.now ?? new Date();
  // Tags nearly everything carries can't narrow anything — judged on the whole list.
  const share = new Map<string, number>();
  for (const i of items) for (const slug of new Set(i.tags.map((t) => t.slug))) share.set(slug, (share.get(slug) ?? 0) + 1);
  const tooCommon = (slug: string) => items.length > 0 && (share.get(slug) ?? 0) / items.length > COMMON_SHARE && items.length > 4;

  const tagOptions = (axis: Axis): FilterOption[] => {
    const pool = applyFilters(items, { ...active, [axis]: [] }, { now });
    const seen = new Map<string, { tag: FilterTag; count: number }>();
    for (const i of pool) {
      for (const t of new Map(i.tags.map((x) => [x.slug, x])).values()) {
        if (axisOf(t.category) !== axis || tooCommon(t.slug)) continue;
        const e = seen.get(t.slug) ?? { tag: t, count: 0 };
        e.count += 1;
        seen.set(t.slug, e);
      }
    }
    return sortOptions([...seen.values()].map(({ tag, count }) => ({ value: tag.slug, label: labelFor(tag, opts.locale), count })));
  };

  const regionPool = applyFilters(items, { ...active, regions: [] }, { now });
  const regionCounts = new Map<string, number>();
  for (const i of regionPool) for (const r of new Set(i.regions)) regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1);

  return {
    regions: sortOptions([...regionCounts].map(([value, count]) => ({ value, label: opts.regionLabel(value), count }))),
    communities: tagOptions("communities"),
    themes: tagOptions("themes"),
  };
}
