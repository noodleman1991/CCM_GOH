# One filter system from real content — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atlas, case studies, news, lived experiences and research outputs all filter by the same Region · Communities · Themes · When · Search, with every option taken from the tags content actually carries and counted.

**Architecture:** Every list is small (case studies 27, news ≈50, lived experiences 35, research outputs 29 on dev), so each page loads its published items once, turns them into a common `FilterableItem`, and runs ONE pure engine (`lib/filters/core.ts`) for both the results and the option counts — the same rules everywhere, and a count can never disagree with its results. URLs use one vocabulary (`region`, `communities`, `themes`, `when`, `q`), with old parameters mapped. The atlas keeps its own map APIs but takes its theme/community options from the same "tags in use" rule.

**Tech Stack:** Next.js 16 App Router (server pages, one client filter bar), next-intl 4, Payload 3.88, vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-09-30-filters-from-real-content-design.md`

## Global Constraints

- Branch `master`; commits `type(scope): sentence`; no Claude/AI attribution. **Pushing deploys production — push only when the user says so.**
- Axes: **Region** = the 7 region codes, matching an item's own region OR its community's region; **Communities** = tags with `category === "audience"`; **Themes** = tags with `category` `"topic"` or `"impact"`; location/method tags are never offered.
- Within an axis values match ANY; axes combine with AND. Search is a case-insensitive substring over title + summary in the page's language (English fallback).
- An option is shown only when ≥1 item carries it; each shows a count computed with that axis's own selection removed (standard facet counts); a tag carried by **more than 90%** of the page's items is not offered; options sort by count desc, then label.
- URL parameters everywhere: `region`, `communities`, `themes`, `when`, `q` (comma-separated). Old ones map: `tags=`/`theme=`/`topics=` → `themes`/`communities` by the tag's category; `regions=` and `communities=<regional-community slug>` → `region`.
- Filter vocabulary comes from the CMS only; no hard-coded theme list (`FALLBACK_THEMES` removed).
- UI reuses the atlas's labelled rows (`components/atlas/atlas-filters.tsx` `FilterRowGroup`/`FilterRow`, `components/ui/filter-chip.tsx` `FilterChip`); four languages; RTL; phone rows scroll sideways.
- Gates per task: focused tests, `npx tsc --noEmit -p .`, eslint on changed files, rendered check (dev :3001, 1280 and 375, en and ar) for UI tasks, full suite before the task's last commit (currently 297 files / 3510 tests).

## Review Focus

1. **A URL naming a tag that no longer exists or is unused** (old bookmark) — it's ignored, the page shows results, no crash. Pinned in Task 2 (`parseFilterParams` drops unknown values).
2. **A selection whose combination matches nothing** (e.g. Youth × Drought in one region) — an empty state with "Clear filters", and every option still shows its count so the visitor can back out. Pinned in Task 1 (facet counts ignore the axis's own selection) and Task 4's rendered check.
3. **Arabic page with English-only tag labels** — the label falls back to English, never blank. Pinned in Task 1 (`labelFor`).
4. **Items with neither region nor community** — they appear with no Region filter and disappear when one is set; counts agree. Pinned in Task 1.
5. **The 90% rule on a small list** (e.g. 4 news posts, 1 tagged) — a tag on 1 of 4 is offered; a tag on 4 of 4 is not. Pinned in Task 1.

---

### Task 1: The filter engine (pure)

**Files:** Create `lib/filters/core.ts`; Test `lib/__tests__/filters-core.test.ts`

**Interfaces — Produces:**
```ts
export type Axis = "communities" | "themes";
export interface FilterTag { slug: string; category: string | null; label: Partial<Record<"en" | "es" | "fr" | "ar", string>> }
export interface FilterableItem { id: string; tags: FilterTag[]; regions: string[]; date: string | null; text: Partial<Record<string, string>> }
export interface ActiveFilters { regions: string[]; communities: string[]; themes: string[]; when: string | null; q: string }
export interface FilterOption { value: string; label: string; count: number }
export interface FilterOptions { regions: FilterOption[]; communities: FilterOption[]; themes: FilterOption[] }
export const EMPTY_FILTERS: ActiveFilters;
export function axisOf(category: string | null): Axis | null;
export function applyFilters(items: FilterableItem[], active: ActiveFilters, opts?: { now?: Date; locale?: string }): FilterableItem[];
export function buildOptions(items: FilterableItem[], active: ActiveFilters, opts: { locale: string; regionLabel: (code: string) => string; now?: Date }): FilterOptions;
export function isFiltering(active: ActiveFilters): boolean;
```

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { applyFilters, axisOf, buildOptions, EMPTY_FILTERS, isFiltering, type FilterableItem } from "@/lib/filters/core";

const tag = (slug: string, category: string, en = slug, ar?: string) => ({ slug, category, label: { en, ...(ar ? { ar } : {}) } });
const youth = tag("youth", "audience", "Youth", "الشباب");
const drought = tag("drought", "topic", "Drought");
const trauma = tag("trauma", "impact", "Trauma");
const place = tag("oceania-tag", "location", "Oceania");
const item = (id: string, tags: FilterableItem["tags"], regions: string[], date: string | null = "2026-05-01", title = id): FilterableItem => ({ id, tags, regions, date, text: { en: title } });

const items = [
  item("a", [youth, drought, place], ["oce"]),
  item("b", [drought], ["ssa"]),
  item("c", [youth, trauma], ["oce"], "2020-01-01"),
  item("d", [], [], null, "Floods and farmers"),
];
const label = (c: string) => c.toUpperCase();

describe("filter engine", () => {
  it("puts audience tags under Communities, topic and impact under Themes, nothing else", () => {
    expect([axisOf("audience"), axisOf("topic"), axisOf("impact"), axisOf("location"), axisOf(null)]).toEqual(["communities", "themes", "themes", null, null]);
  });
  it("matches any value within an axis and all axes together", () => {
    const f = (over: object) => applyFilters(items, { ...EMPTY_FILTERS, ...over }).map((i) => i.id);
    expect(f({ themes: ["drought", "trauma"] })).toEqual(["a", "b", "c"]);
    expect(f({ themes: ["drought"], communities: ["youth"] })).toEqual(["a"]);
    expect(f({ regions: ["oce"] })).toEqual(["a", "c"]);
    expect(f({ q: "FLOOD" })).toEqual(["d"]);
  });
  it("filters by when, leaving undated items out once a period is chosen", () => {
    const now = new Date("2026-09-30T00:00:00Z");
    expect(applyFilters(items, { ...EMPTY_FILTERS, when: "past-year" }, { now }).map((i) => i.id)).toEqual(["a", "b"]);
    expect(applyFilters(items, { ...EMPTY_FILTERS, when: "earlier" }, { now }).map((i) => i.id)).toEqual(["c"]);
  });
  it("offers only tags in use, counted with the axis's own choice set aside, never location tags", () => {
    const o = buildOptions(items, { ...EMPTY_FILTERS, themes: ["drought"] }, { locale: "en", regionLabel: label });
    expect(o.themes).toEqual([{ value: "drought", label: "Drought", count: 2 }, { value: "trauma", label: "Trauma", count: 1 }]);
    expect(o.communities).toEqual([{ value: "youth", label: "Youth", count: 1 }]);
    expect(o.regions).toEqual([{ value: "oce", label: "OCE", count: 1 }, { value: "ssa", label: "SSA", count: 1 }]);
  });
  it("falls back to English labels", () => {
    expect(buildOptions(items, EMPTY_FILTERS, { locale: "ar", regionLabel: label }).communities[0].label).toBe("الشباب");
    expect(buildOptions(items, EMPTY_FILTERS, { locale: "ar", regionLabel: label }).themes.find((t) => t.value === "drought")!.label).toBe("Drought");
  });
  it("leaves out a tag nearly everything carries (over 90%)", () => {
    const common = tag("mh", "topic", "Mental health");
    const many = Array.from({ length: 10 }, (_, i) => item(`m${i}`, i < 10 ? [common] : [], ["oce"]));
    const few = [item("n1", [common], []), item("n2", [], []), item("n3", [], []), item("n4", [], [])];
    expect(buildOptions(many, EMPTY_FILTERS, { locale: "en", regionLabel: label }).themes).toEqual([]);
    expect(buildOptions(few, EMPTY_FILTERS, { locale: "en", regionLabel: label }).themes).toEqual([{ value: "mh", label: "Mental health", count: 1 }]);
  });
  it("knows when anything is being filtered", () => {
    expect(isFiltering(EMPTY_FILTERS)).toBe(false);
    expect(isFiltering({ ...EMPTY_FILTERS, q: "x" })).toBe(true);
  });
});
```

- [ ] **Step 2:** `pnpm exec vitest run lib/__tests__/filters-core.test.ts` — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `lib/filters/core.ts`:

```ts
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
```

(Note: the `items.length > 4` guard keeps the 90% rule from hiding the only tag on a tiny list — see the Review Focus line 5 test.)

- [ ] **Step 4:** Run the test — Expected: PASS (7 tests). Fix the test's `many` fixture if it is not exactly 10 items all carrying `common`.
- [ ] **Step 5:** tsc, eslint; **Commit** — `feat(filters): one filter engine — results and counts from the same rules`.

---

### Task 2: One URL vocabulary, old links mapped

**Files:** Create `lib/filters/params.ts`; Test `lib/__tests__/filters-params.test.ts`

**Interfaces — Consumes:** `ActiveFilters`, `FilterTag`, `axisOf`, `EMPTY_FILTERS`. **Produces:** `parseFilterParams(sp: Record<string, string | string[] | undefined>, known: { tags: FilterTag[]; communitySlugToRegion: Record<string, string> }): ActiveFilters`; `toSearchParams(a: ActiveFilters): URLSearchParams`.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { parseFilterParams, toSearchParams } from "@/lib/filters/params";

const known = {
  tags: [
    { slug: "youth", category: "audience", label: { en: "Youth" } },
    { slug: "drought", category: "topic", label: { en: "Drought" } },
    { slug: "trauma", category: "impact", label: { en: "Trauma" } },
    { slug: "oceania-tag", category: "location", label: { en: "Oceania" } },
  ],
  communitySlugToRegion: { oceania: "oce", "sub-saharan-africa": "ssa" },
};

describe("filter URLs", () => {
  it("reads the shared vocabulary, dropping values that don't exist", () => {
    expect(parseFilterParams({ region: "oce,atlantis", communities: "youth,ghost", themes: "drought", when: "past-year", q: " heat " }, known)).toEqual({
      regions: ["oce"], communities: ["youth"], themes: ["drought"], when: "past-year", q: "heat",
    });
  });
  it("maps old links by the tag's kind and old region parameters to region codes", () => {
    expect(parseFilterParams({ tags: "youth,drought,oceania-tag", theme: "trauma", regions: "ssa", communities: "oceania" }, known)).toEqual({
      regions: ["ssa", "oce"], communities: ["youth"], themes: ["drought", "trauma"], when: null, q: "",
    });
  });
  it("ignores an unknown period", () => {
    expect(parseFilterParams({ when: "someday" }, known).when).toBeNull();
  });
  it("writes only what is set", () => {
    expect(toSearchParams({ regions: ["oce"], communities: [], themes: ["drought", "trauma"], when: null, q: "" }).toString()).toBe("region=oce&themes=drought%2Ctrauma");
  });
});
```

- [ ] **Step 2:** Run — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `lib/filters/params.ts`:

```ts
import { axisOf, EMPTY_FILTERS, type ActiveFilters, type FilterTag } from "./core";
import { isRegionCode } from "@/lib/maps/region-codes";

type SP = Record<string, string | string[] | undefined>;
const WHENS = new Set(["past-year", "past-3-years", "earlier", "upcoming", "past"]);
const list = (v: string | string[] | undefined) =>
  (Array.isArray(v) ? v.join(",") : (v ?? "")).split(",").map((s) => s.trim()).filter(Boolean);
const uniq = (xs: string[]) => [...new Set(xs)];

/** The shared vocabulary (region, communities, themes, when, q) plus old links
 *  (tags, theme, topics, regions, communities=<regional-community slug>). */
export function parseFilterParams(sp: SP, known: { tags: FilterTag[]; communitySlugToRegion: Record<string, string> }): ActiveFilters {
  const bySlug = new Map(known.tags.map((t) => [t.slug, t]));
  const ofAxis = (slugs: string[], axis: "communities" | "themes") => slugs.filter((s) => bySlug.has(s) && axisOf(bySlug.get(s)!.category) === axis);
  const legacyTags = [...list(sp.tags), ...list(sp.theme), ...list(sp.topics)];
  const communityParam = list(sp.communities);
  const regionFromCommunitySlugs = communityParam.map((s) => known.communitySlugToRegion[s]).filter(Boolean);
  const when = typeof sp.when === "string" && WHENS.has(sp.when) ? sp.when : null;
  return {
    regions: uniq([...list(sp.region), ...list(sp.regions), ...regionFromCommunitySlugs].filter(isRegionCode)),
    communities: uniq(ofAxis([...communityParam, ...legacyTags], "communities")),
    themes: uniq(ofAxis([...list(sp.themes), ...legacyTags], "themes")),
    when,
    q: (typeof sp.q === "string" ? sp.q : typeof sp.search === "string" ? sp.search : "").trim().slice(0, 100),
  } satisfies ActiveFilters;
}

export function toSearchParams(a: ActiveFilters = EMPTY_FILTERS): URLSearchParams {
  const p = new URLSearchParams();
  if (a.regions.length) p.set("region", a.regions.join(","));
  if (a.communities.length) p.set("communities", a.communities.join(","));
  if (a.themes.length) p.set("themes", a.themes.join(","));
  if (a.when) p.set("when", a.when);
  if (a.q) p.set("q", a.q);
  return p;
}
```

- [ ] **Step 4:** Run — Expected: PASS. **Step 5:** tsc, eslint; **Commit** — `feat(filters): one URL vocabulary, old filter links still work`.

---

### Task 3: The shared filter bar

**Files:** Create `components/filters/filter-bar.tsx` (client); messages `filters.*` ×4; Test `lib/__tests__/filter-bar.test.tsx`

**Interfaces — Consumes:** `FilterOptions`, `ActiveFilters`, `toSearchParams`. **Produces:** `<FilterBar options active whenOptions? />` — pushes `?…` via `useRouter().push(pathname + "?" + toSearchParams(next), { scroll: false })`.

- [ ] **Step 1: Failing test**

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), usePathname: () => "/en/research-and-action/case-studies" }));
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => `t:${k}` }));
import { FilterBar } from "@/components/filters/filter-bar";
afterEach(() => { cleanup(); push.mockReset(); });

const options = { regions: [{ value: "oce", label: "Oceania", count: 3 }], communities: [{ value: "youth", label: "Youth", count: 2 }], themes: [] };
const active = { regions: [], communities: [], themes: [], when: null, q: "" };

describe("filter bar", () => {
  it("shows a row per axis that has options, with counts", () => {
    render(<FilterBar options={options} active={active} />);
    expect(screen.getByText("t:region")).toBeTruthy();
    expect(screen.getByText("t:communities")).toBeTruthy();
    expect(screen.queryByText("t:themes")).toBeNull();
    expect(screen.getByRole("button", { name: /Youth/ }).textContent).toContain("2");
  });
  it("adds a choice to the URL, keeping the others", () => {
    render(<FilterBar options={options} active={{ ...active, regions: ["oce"] }} />);
    fireEvent.click(screen.getByRole("button", { name: /Youth/ }));
    expect(push).toHaveBeenCalledWith("/en/research-and-action/case-studies?region=oce&communities=youth", { scroll: false });
  });
  it("offers Clear filters only when something is chosen", () => {
    const { rerender } = render(<FilterBar options={options} active={active} />);
    expect(screen.queryByText("t:clear")).toBeNull();
    rerender(<FilterBar options={options} active={{ ...active, communities: ["youth"] }} />);
    fireEvent.click(screen.getByText("t:clear"));
    expect(push).toHaveBeenCalledWith("/en/research-and-action/case-studies", { scroll: false });
  });
});
```

- [ ] **Step 2:** Run — FAIL. **Step 3: Implement** `components/filters/filter-bar.tsx`:

```tsx
"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterRow, FilterRowGroup } from "@/components/atlas/atlas-filters";
import { SearchInput } from "@/components/ui/search-input";
import { isFiltering, type ActiveFilters, type FilterOptions } from "@/lib/filters/core";
import { toSearchParams } from "@/lib/filters/params";

type Row = "regions" | "communities" | "themes";
const ROWS: Array<[Row, string]> = [["regions", "region"], ["communities", "communities"], ["themes", "themes"]];
const DEFAULT_WHEN = ["past-year", "past-3-years", "earlier"];

/** The hub's one filter bar (spec 2026-09-30): Region · Communities · Themes · When · Search. */
export function FilterBar({ options, active, whenOptions = DEFAULT_WHEN }: { options: FilterOptions; active: ActiveFilters; whenOptions?: string[] }) {
  const t = useTranslations("filters");
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(active.q);
  const go = (next: ActiveFilters) => {
    const qs = toSearchParams(next).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const toggle = (row: Row, value: string) =>
    go({ ...active, [row]: active[row].includes(value) ? active[row].filter((v) => v !== value) : [...active[row], value] });

  return (
    <div className="space-y-3">
      <SearchInput
        containerClassName="max-w-md"
        defaultValue={active.q}
        placeholder={t("search")}
        aria-label={t("search")}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") go({ ...active, q: q.trim() }); }}
        onClear={active.q ? () => go({ ...active, q: "" }) : undefined}
        clearLabel={t("clearSearch")}
      />
      <FilterRowGroup>
        {ROWS.filter(([row]) => options[row].length > 0).map(([row, key]) => (
          <FilterRow key={row} label={t(key)}>
            {options[row].map((o) => (
              <FilterChip key={o.value} label={o.label} count={o.count} active={active[row].includes(o.value)} onClick={() => toggle(row, o.value)} />
            ))}
          </FilterRow>
        ))}
        <FilterRow label={t("when")}>
          {whenOptions.map((w) => (
            <FilterChip key={w} label={t(`whenOptions.${w}`)} active={active.when === w} onClick={() => go({ ...active, when: active.when === w ? null : w })} />
          ))}
        </FilterRow>
      </FilterRowGroup>
      {isFiltering(active) && (
        <button type="button" className="text-sm font-semibold text-ccm-sea hover:underline" onClick={() => go({ regions: [], communities: [], themes: [], when: null, q: "" })}>
          {t("clear")}
        </button>
      )}
    </div>
  );
}
```

Before writing it, open `components/ui/filter-chip.tsx` and `components/ui/search-input.tsx` and use their exact prop names (the atlas uses `label`, `count`, `active`, `onClick` on `FilterChip`, and `containerClassName`, `onClear`, `clearLabel` on `SearchInput`); adjust this component — not the tests — if a name differs.

Messages `filters` (en / es / fr / ar): `search` "Search…" / "Buscar…" / "Rechercher…" / "بحث…"; `clearSearch` "Clear search" / "Borrar búsqueda" / "Effacer la recherche" / "مسح البحث"; `region` "Region" / "Región" / "Région" / "المنطقة"; `communities` "Communities" / "Comunidades" / "Communautés" / "المجتمعات"; `themes` "Themes" / "Temas" / "Thèmes" / "المواضيع"; `when` "When" / "Cuándo" / "Quand" / "متى"; `clear` "Clear filters" / "Quitar filtros" / "Effacer les filtres" / "مسح عوامل التصفية"; `results` "{count, plural, one {# result} other {# results}}" / "{count, plural, one {# resultado} other {# resultados}}" / "{count, plural, one {# résultat} other {# résultats}}" / "{count, plural, one {نتيجة واحدة} other {# نتائج}}"; `empty` "Nothing matches these filters." / "Nada coincide con estos filtros." / "Rien ne correspond à ces filtres." / "لا شيء يطابق عوامل التصفية هذه."; `whenOptions.past-year` "Past year" / "Último año" / "L'année passée" / "العام الماضي"; `whenOptions.past-3-years` "Past 3 years" / "Últimos 3 años" / "Les 3 dernières années" / "آخر 3 سنوات"; `whenOptions.earlier` "Earlier" / "Anteriores" / "Plus ancien" / "أقدم"; `whenOptions.upcoming` "Upcoming" / "Próximos" / "À venir" / "القادمة"; `whenOptions.past` "Past" / "Pasados" / "Passés" / "السابقة".

- [ ] **Step 4:** Run — PASS. **Step 5:** tsc, eslint; **Commit** — `feat(filters): the shared filter bar`.

---

### Task 4: Case studies on the shared bar

**Files:** Create `lib/filters/adapters.ts` (pure mappers, grows per page); Modify `app/[locale]/(main)/research-and-action/case-studies/page.tsx`; Test `lib/__tests__/filters-adapters.test.ts`

**Interfaces — Produces:** `toFilterTags(raw: unknown): FilterTag[]` (accepts `{ value: string | { current: string }, category, label }` rows); `regionsOf(...codesOrCommunities: unknown[]): string[]` (collects region codes from `region` strings, `{ region }` objects and community slugs via `slugToShortCode`); `caseStudyToFilterable(cs: CaseStudyListItem, locale): FilterableItem`.

- [ ] **Step 1: Failing test** (`lib/__tests__/filters-adapters.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { regionsOf, toFilterTags } from "@/lib/filters/adapters";

describe("filter adapters", () => {
  it("reads tags whether the slug is a string or a slug object", () => {
    expect(toFilterTags([{ value: { current: "youth" }, category: "audience", label: { en: "Youth" } }, { value: "drought", category: "topic", label: { en: "Drought" } }, null])).toEqual([
      { slug: "youth", category: "audience", label: { en: "Youth" } },
      { slug: "drought", category: "topic", label: { en: "Drought" } },
    ]);
  });
  it("collects region codes from codes, region objects and community slugs", () => {
    expect(regionsOf("oce", { region: "ssa" }, { slug: "latin-america-and-the-caribbean" }, null, "nope").sort()).toEqual(["lac", "oce", "ssa"]);
  });
});
```

- [ ] **Step 2:** FAIL. **Step 3: Implement** `lib/filters/adapters.ts` (`toFilterTags`, `regionsOf` as tested; `caseStudyToFilterable` reads `cs._id`, `cs.tags`, `regionsOf(cs.region, cs.relatedCommunity, cs.regionalCommunity)`, `cs.publishedAt ?? cs._createdAt`, and `text` = `{ [locale]: title+summary, en: title+summary }` via `getLocalizedValue`). Open `CaseStudyListItem` in `lib/content/case-studies.ts` first and use the fields it actually has; add a test case for `caseStudyToFilterable` built from a real item captured from `getFilteredCaseStudies({})` on dev.
- [ ] **Step 4:** Page: load `getFilteredCaseStudies({})` once (all approved), the regional communities list (for `communitySlugToRegion`), and the tag list (`getCaseStudyFilterTags()` → `toFilterTags`). `active = parseFilterParams(await searchParams, known)`; `items = all.map(caseStudyToFilterable)`; `visible = applyFilters(items, active)`; `options = buildOptions(items, active, { locale, regionLabel: (c) => tRegions(REGION_I18N_KEY[c]) })`. Render `<FilterBar options active />` in place of `CaseStudiesFiltersWrapper`, and render the existing gallery/map with the case studies whose `_id` is in `visible` (keep order). Show `t('filters.results', { count })` and, when zero, `t('filters.empty')` with the Clear filters link. Keep `view=` working. Remove the now-unused `CaseStudiesFilters` import (leave the component file for now).
- [ ] **Step 5: Rendered check** (1280 + 375, en + ar): bar rows show Region / Communities / Themes / When with counts; choosing Youth then Drought narrows the grid and each chip's count matches what it returns; an old `?tags=youth` link lands on the Youth selection; `?topics=` still maps; Arabic RTL; no overflow.
- [ ] **Step 6:** Full suite; **Commit** — `feat(case-studies): filter with the shared bar, options from real tags`.

---

### Task 5: News on the shared bar

**Files:** Modify `lib/filters/adapters.ts` (+ `newsToFilterable`, `externalToFilterable`), `app/[locale]/(main)/news/page.tsx`; Test: extend `lib/__tests__/filters-adapters.test.ts`

- [ ] **Step 1: Failing test:** `newsToFilterable` maps a news post's `tags`, region from `regionalCommunities`/`communities`, `publishedAt`, title+excerpt; `externalToFilterable` maps an external source with its own tags if any and `publishedAt`. Build fixtures from one real item of each captured on dev.
- [ ] **Step 2:** FAIL. **Step 3:** Implement both mappers.
- [ ] **Step 4:** Page: with filters active, build the full list (`getRegularNews({ limit: 200 })` + featured + `getApprovedExternalSources({ limit: 100 })`), run `applyFilters`, render the existing merged grid (`mergeNewsFeed`) over the visible items; options from `buildOptions` over the full list, tags from `getNewsTags()`. With no filters, keep today's lead story + grid. Replace `NewsFiltersWrapper` with `<FilterBar options active />`. Keep the "Global" (no region) case: items with no region are shown when no Region is chosen (the engine already does this).
- [ ] **Step 5: Rendered check** as Task 4, including an old `?tags=`/`?communities=<slug>` link.
- [ ] **Step 6:** Full suite; **Commit** — `feat(news): filter with the shared bar`.

---

### Task 6: Lived experiences on the shared bar

**Files:** Modify `lib/filters/adapters.ts` (+ `livedExperienceToFilterable`), `app/[locale]/(main)/lived-experiences/page.tsx`, `app/[locale]/(main)/lived-experiences/page-client.tsx` (drop its own region/tag filtering; receive the already-filtered list); Test: extend adapters test.

- [ ] Steps as Task 5: the mapper (tags; region from `region.region` / `region` code / `regionalCommunities`; date; title+description), the page filters server-side with the engine, the client renders what it's given, `FilterBar` replaces the in-page chips. Expect the four generic tags to disappear from Themes (carried by >90%). Rendered check; full suite; **Commit** — `feat(lived-experiences): filter with the shared bar; tags on every story are no longer offered`.

---

### Task 7: Research outputs get filters

**Files:** Modify `lib/filters/adapters.ts` (+ `researchOutputToFilterable`), `app/[locale]/(main)/research-and-action/research-outputs/page.tsx`; Test: extend adapters test.

- [ ] Steps as Task 5: mapper (tags — currently none on dev, so only Region and When rows appear; region from `region`/`relatedCommunities`; date `publishedAt`/`year`; title+summary), `FilterBar` above the list, filtered list, results count, empty state. Rendered check; full suite; **Commit** — `feat(research-outputs): filters — region, when, search, and themes once outputs are tagged`.

---

### Task 8: The atlas takes themes and communities from real content

**Files:** Modify `lib/content/internal/payload/regions.ts` (`getThemeOptions`, `themeWhere`), `lib/content/regions.ts` (drop `FALLBACK_THEMES`), `lib/maps/region-facets.ts` (remove `FALLBACK_THEMES` export), the three map routes (`app/api/maps/region-data|region-items|region-pins/route.ts`), `components/atlas/atlas-explorer.tsx` (Themes and Communities rows); Test: `lib/__tests__/atlas-theme-options.test.ts`

**Interfaces — Produces:** `getThemeOptions(): Promise<ThemeOption[]>` now returns topic+impact tags used by ≥1 approved case study, lived experience, news post or research output (same >90% rule per the combined pool), sorted by use; new `getCommunityOptions(): Promise<ThemeOption[]>` for audience tags. Routes accept `themes` and `communities` (comma lists, validated against those options; old single `theme` still read into `themes`); `themeWhere(themes: string[], communities: string[])` returns `and(themes.length ? { "tags.value": { in: themes } } : null, communities.length ? { "tags.value": { in: communities } } : null)` (null when both empty).

- [ ] **Step 1: Failing test:** with the Payload `query` mocked to return tags (one ticked `useAsTheme` but unused, one used topic, one used audience, one location) and content rows carrying tag ids, `getThemeOptions()` returns only the used topic, `getCommunityOptions()` only the used audience tag, and neither falls back to a fixed list when nothing is used (returns `[]`).
- [ ] **Step 2:** FAIL. **Step 3:** Implement: read tags (`id, value, label, category`) and, per atlas content collection, `tags` of approved/published rows (`select: { tags: true }`, `depth: 0`); count per tag id; build options by category. Replace every `FALLBACK_THEMES` use (`grep -rn FALLBACK_THEMES`) — the atlas shows no Themes row when the list is empty.
- [ ] **Step 4:** Routes: parse `themes`/`communities` (and legacy `theme`), validate against the two option lists, pass both to the readers' theme parameter (change the parameter from `themeSlug: string | null` to `tagFilter: { themes: string[]; communities: string[] }` through `getRegionPinRows`, `getRegionFacetItems`, `getRegionRecentItems`, `getRegionHighlightItems`, the counts reader, and `themeWhere`). Client: the explorer's Theme row becomes **Themes** (multi) and a **Communities** row is added, fed from a new `GET /api/maps/filter-options` (returns `{ themes, communities }` from the two functions, cached like the other map routes); URL params `themes`/`communities`; the old `theme` param is read on first load.
- [ ] **Step 5: Dev database check** (script in the workspace, dev host asserted): for each theme and community option, the region-data totals with that filter equal the sum of region-items for it. **Rendered check** `/en/atlas` and a community page's atlas: rows show real tags (no Livelihoods), selecting Youth updates counts, pins and cards consistently; 375 + ar.
- [ ] **Step 6:** Full suite; **Commit** — `feat(atlas): themes and communities from the tags content carries; the fixed theme list is gone`.

---

### Task 9: Help editors close the tagging gaps

**Files:** Create `payload/components/needs-tags.ts` (pure: `needsTagsRows(counts)`); Modify `payload/components/editor-dashboard.tsx` (panel), `payload/collections/tags.ts` (`useAsTheme` → `admin.hidden: true`); runbook section; Test `lib/__tests__/needs-tags.test.ts`

- [ ] **Step 1: Failing test:** `needsTagsRows([{ collection: "researchOutputs", label: "Research outputs", total: 29, noThemes: 29, noCommunities: 29 }])` → one row with both links: `/admin/collections/researchOutputs?where[tags][exists]=false` for no tags at all, and the counts as given; rows with nothing missing are left out.
- [ ] **Step 2:** FAIL. **Step 3:** Implement the pure builder; in the dashboard (staff branch), count per collection (case studies, lived experiences, news posts, research outputs, agendas, events) published items with no topic/impact tag and with no audience tag (Local API, `depth: 0`, `select: { tags: true }`, joined to the tag categories), render a **"Needs tags"** card (`.ccm-card`): "Research outputs: 29 without themes · 29 without communities →". Hide `useAsTheme` in the tag editor (data kept).
- [ ] **Step 4:** Tests pass; `/admin` 200; signed-in rendered check of the dashboard card (the automation browser currently has a staff session).
- [ ] **Step 5:** Runbook section "2026-09-30 one filter system" (what visitors see, the Needs tags panel, old links keep working, nothing to run on production). Full suite; **Commits** — `feat(cms): a Needs tags panel shows editors what can't be filtered yet`, `docs(runbook): one filter system`.
