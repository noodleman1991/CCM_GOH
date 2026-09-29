# Regular pages on shared layouts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all 9 regular pages from per-language section lists onto the shared Sections list (English's layout where languages differ, About keeping its journey heading), with a dry-run-first move script and an instant fallback.

**Architecture:** `pages` gains `sectionsField` after its (now hidden) `blocks` list. A pure planner aligns each language's list to English's by block type (longest common subsequence) and rebuilds each section with project 2's field-by-field `planSection`, so every language keeps its text wherever a section lines up. The pages reader prefers the Sections list and falls back to the old list; callers keep receiving `blocks`.

**Tech Stack:** Next.js 16, Payload 3.88 (Postgres), vitest.

**Spec:** `docs/superpowers/specs/2026-09-29-pages-on-sections-design.md` (decisions P1–P5). Reuses `scripts/homepage/plan.ts` (`planSection`, `LocaleMap`, `Difference`), `scripts/homepage/write.ts` (`toLocaleData`, `withIdsFrom`, `guardExisting`), `lib/content/internal/localize.ts` (`collapseLocales`), `payload/fields/sections.ts`, `payload/globals/homepage.ts` (`HOMEPAGE_SECTIONS`).

## Global Constraints

- Branch `master`; commits `type(scope): sentence`; no Claude/AI attribution.
- Visitors see no change until the script is executed; afterwards only: Toolkits and Impact reports show English's download cards in every language; About shows its journey heading in English too.
- About's English heading, exact: `The Connecting Climate Minds Journey`.
- `pages.blocks` hidden, never deleted. No required sections on pages.
- Never custom `dbName`s for repeated block slugs; declare `sections` **after** `blocks`. If `migrate:create` hits the 63-character limit, map `PAGE_SECTIONS` through `withShortEnumNames`.
- Migrations additive only; dev DB only (`lucky-waterfall`). After a `migrate:create` probe, never `git checkout migrations/index.ts` blindly — delete only the probe's files and its index entry.
- Gates per task: focused tests, `npx tsc --noEmit -p .`, eslint changed files, full suite before the last commit (currently 274 files / 3444 tests).

## Review Focus

1. **A page whose languages list the same block type twice in a different order** (two card grids swapped) — alignment must not cross-wire text; the dry run shows headings side by side. Pinned in Task 2 (LCS keeps order; test with a swapped pair).
2. **A language with no list at all** (page never translated) — shares English's sections, text falls back to English, no crash. Pinned in Task 2.
3. **A page with sections in only English and `--revert`** — reverts cleanly. Pinned in Task 4's dev run.
4. **A language requested that the shared sections don't cover** (e.g. `ar` missing a heading) — English text shows, never blank. Pinned in Task 3 (reader fallback test).
5. **Pages whose old `blocks` exist only in one language** (the old reader's `carriesLocale` rule) — once sections exist, the page is found in every language. Pinned in Task 3.

---

### Task 1: Pages get the Sections list

**Files:** Modify `payload/collections/pages.ts`; Create `migrations/<ts>_pages_sections.ts`; Test `lib/__tests__/payload-pages-sections.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const named = (fields: Field[], name: string) => fields.find((f) => "name" in f && f.name === name) as Record<string, any> | undefined;

describe("pages on sections", async () => {
  const pages = (await config).collections.find((c) => c.slug === "pages")!;
  it("has the shared list after the old per-language list, which is hidden", () => {
    const names = pages.fields.map((f) => ("name" in f ? f.name : null));
    expect(names.indexOf("sections")).toBeGreaterThan(names.indexOf("blocks"));
    expect(named(pages.fields, "blocks")?.admin?.hidden).toBe(true);
    expect(named(pages.fields, "sectionsByLanguage")).toMatchObject({ localized: true });
    expect(named(pages.fields, "layoutPerLanguage")?.type).toBe("checkbox");
  });
  it("requires nothing", async () => {
    expect(await named(pages.fields, "sections")!.validate([], { req: { context: {}, t: (k: string) => k }, required: false })).toBe(true);
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3:** In `pages.ts` import `sectionsField` and `HOMEPAGE_SECTIONS`; export `PAGE_SECTIONS = HOMEPAGE_SECTIONS`; give the `blocks` field `admin: { ...existing, hidden: true }`; insert `...sectionsField({ blocks: PAGE_SECTIONS })` right after `blocks`; collection `admin.description`: "The page shows the Sections below, in order. (The old per-language lists are kept hidden as a backup.)".
- [ ] **Step 4: PASS**; `pnpm exec payload migrate:create pages_sections`; audit (no DROP/RENAME; only `pages_*`/`_pages_v_*` new tables, `layout_per_language` columns, rels columns); if the generator throws the 63-char error, add `.map(withShortEnumNames)` to `PAGE_SECTIONS` and retry. Apply on dev (host check), `generate:types`, importmap, `/admin` 200, `/en/about` unchanged.
- [ ] **Step 5:** full suite; **Commit** — `feat(pages): pages get the shared Sections list`.

---

### Task 2: The aligning planner (pure)

**Files:** Create `scripts/pages/plan.ts`; Test `lib/__tests__/pages-move-plan.test.ts`

**Interfaces:** `alignByType(en: string[], other: string[]): Array<number | null>` (for each English index, the aligned index in `other` or null — LCS); `planPageSections(page: Row): { sections: Row[]; mode: "shared" | "aligned"; leftOut: Array<{ lang: string; blockType: string; index: number }>; differences: Difference[]; notes: string[] }`; `ABOUT_HEADING_EN = "The Connecting Climate Minds Journey"`.

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { alignByType, planPageSections } from "@/scripts/pages/plan";

const hero = (title: string) => ({ id: `h-${title}`, blockType: "hero1", title });
const cards = (title: string) => ({ id: `g-${title}`, blockType: "gridRow", title, columns: [] });
const text = (title: string) => ({ id: `s-${title}`, blockType: "splitRow", splitColumns: [{ blockType: "splitContent", title }] });
const heading = (title: string) => ({ id: `sh-${title}`, blockType: "sectionHeader", title });

describe("alignByType", () => {
  it("keeps order and skips what doesn't line up", () => {
    expect(alignByType(["hero1", "gridRow"], ["hero1", "splitRow"])).toEqual([0, null]);
    expect(alignByType(["hero1", "hero1", "logoCloud1"], ["sectionHeader", "hero1", "hero1", "logoCloud1"])).toEqual([1, 2, 3]);
    expect(alignByType(["gridRow", "splitRow"], ["splitRow", "gridRow"])).toEqual([0, null]);
  });
});

describe("planPageSections", () => {
  it("keeps every language's text on a page whose languages match", () => {
    const p = planPageSections({ slug: "feedback", blocks: { en: [hero("Feedback")], es: [hero("Opiniones")], fr: [hero("Avis")], ar: [hero("ملاحظات")] } });
    expect(p.mode).toBe("shared");
    expect(p.sections[0]).toMatchObject({ blockType: "hero1", title: { en: "Feedback", es: "Opiniones", fr: "Avis", ar: "ملاحظات" } });
    expect(p.leftOut).toEqual([]);
  });

  it("takes English's layout where languages differ, keeping text that lines up and listing what's left out", () => {
    const p = planPageSections({ slug: "research-and-action/toolkits", blocks: { en: [hero("Toolkits"), cards("")], es: [hero("Herramientas"), text("A")], ar: [hero("أدوات"), text("B")] } });
    expect(p.mode).toBe("aligned");
    expect(p.sections.map((s) => s.blockType)).toEqual(["hero1", "gridRow"]);
    expect(p.sections[0].title).toEqual({ en: "Toolkits", es: "Herramientas", ar: "أدوات" });
    expect(p.leftOut).toEqual([{ lang: "es", blockType: "splitRow", index: 1 }, { lang: "ar", blockType: "splitRow", index: 1 }]);
  });

  it("keeps About's journey heading in every language", () => {
    const p = planPageSections({
      slug: "about",
      blocks: { en: [hero("Project"), hero("Hub")], es: [heading("El Viaje"), hero("Proyecto"), hero("Hub ES")], ar: [heading("رحلة"), hero("مشروع"), hero("مركز")] },
    });
    expect(p.sections[0]).toMatchObject({ blockType: "sectionHeader", title: { en: "The Connecting Climate Minds Journey", es: "El Viaje", ar: "رحلة" } });
    expect(p.sections[1].title).toEqual({ en: "Project", es: "Proyecto", ar: "مشروع" });
    expect(p.leftOut).toEqual([]);
    expect(p.notes).toContain("About: the journey heading is kept in every language (English added).");
  });

  it("shares English's sections when a language has no list at all", () => {
    const p = planPageSections({ slug: "x", blocks: { en: [hero("Only English")] } });
    expect(p.sections[0].title).toEqual({ en: "Only English" });
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement** `scripts/pages/plan.ts`:

```ts
import type { Block } from "payload";
import * as library from "@/payload/blocks";
import { planSection, type Difference } from "../homepage/plan";

type Row = Record<string, unknown>;
const OTHERS = ["es", "fr", "ar"] as const;
export const ABOUT_HEADING_EN = "The Connecting Climate Minds Journey";
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const BLOCKS = new Map(Object.values(library).filter((b): b is Block => isRow(b) && typeof (b as Block).slug === "string").map((b) => [b.slug, b]));

/** For each English index, the aligned index in `other` (longest common subsequence on block type), or null. */
export function alignByType(en: string[], other: string[]): Array<number | null> {
  const n = en.length, m = other.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = en[i] === other[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: Array<number | null> = new Array(n).fill(null);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (en[i] === other[j]) { out[i] = j; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

/** Per-language copies of one section as the "slot" shape planSection reads: every key a { lang: value } map. */
function merged(perLang: Partial<Record<string, Row>>): Row {
  const keys = new Set(Object.values(perLang).flatMap((r) => (r ? Object.keys(r) : [])));
  return Object.fromEntries([...keys].map((k) => [k, Object.fromEntries(Object.entries(perLang).filter(([, r]) => r).map(([l, r]) => [l, (r as Row)[k]]))]));
}

export function planPageSections(page: Row) {
  const lists = (isRow(page.blocks) ? page.blocks : {}) as Record<string, Row[] | undefined>;
  const en = Array.isArray(lists.en) ? lists.en : [];
  const types = (l: Row[]) => l.map((b) => String(b.blockType));
  const differences: Difference[] = [];
  const notes: string[] = [];
  const leftOut: Array<{ lang: string; blockType: string; index: number }> = [];
  const alignments = Object.fromEntries(OTHERS.map((l) => [l, Array.isArray(lists[l]) ? alignByType(types(en), types(lists[l]!)) : null]));
  const shared = OTHERS.every((l) => !Array.isArray(lists[l]) || types(lists[l]!).join() === types(en).join());

  const sections: Row[] = [];
  // About: the other languages' leading journey heading stays, with English added.
  const about = page.slug === "about";
  if (about) {
    const perLang: Partial<Record<string, Row>> = { en: { blockType: "sectionHeader", title: ABOUT_HEADING_EN } };
    for (const l of OTHERS) {
      const first = lists[l]?.[0];
      if (first?.blockType === "sectionHeader" && alignments[l]![0] !== 0) perLang[l] = first;
    }
    sections.push(planSection(BLOCKS.get("sectionHeader")!, merged(perLang), "about:journey", differences));
    notes.push("About: the journey heading is kept in every language (English added).");
  }

  en.forEach((block, i) => {
    const perLang: Partial<Record<string, Row>> = { en: block };
    for (const l of OTHERS) {
      const j = alignments[l]?.[i];
      if (j !== null && j !== undefined) perLang[l] = lists[l]![j];
    }
    const target = BLOCKS.get(String(block.blockType));
    if (target) sections.push(planSection(target, merged(perLang), `${page.slug}#${i}`, differences));
  });

  for (const l of OTHERS) {
    const list = lists[l];
    if (!Array.isArray(list)) continue;
    const used = new Set(alignments[l]!.filter((j): j is number => j !== null));
    list.forEach((b, j) => {
      if (used.has(j)) return;
      if (about && j === 0 && b.blockType === "sectionHeader") return; // kept above
      leftOut.push({ lang: l, blockType: String(b.blockType), index: j });
    });
  }
  return { sections, mode: (shared ? "shared" : "aligned") as "shared" | "aligned", leftOut, differences, notes };
}
```

(`planSection` builds row lists per language only when row counts match — its existing rule; text inside rows keeps each language's words.)

- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(pages): plan each page's move, aligning languages to English`.

---

### Task 3: The reader prefers the Sections list

**Files:** Modify `lib/content/internal/payload/pages.ts` (`findPage`); Test `lib/__tests__/payload-pages-reader-sections.test.ts`

- [ ] **Step 1: Failing tests**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ draftMode: async () => ({ isEnabled: false }) }));
const q = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => q(d), queryPreviewable: (d: unknown) => q(d) }));
import { findPage } from "@/lib/content/internal/payload/pages";
beforeEach(() => q.mockReset());

const row = (over: Record<string, unknown> = {}) => ({ id: "p1", slug: "about", title: { en: "About" }, blocks: { en: [{ id: "old", blockType: "hero1", title: "Old" }] }, ...over });

describe("pages on sections", () => {
  it("renders the shared Sections list in the visitor's language when it has any", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [{ id: "s", blockType: "hero1", title: { en: "New", ar: "جديد" } }] })] });
    const p = await findPage("about", "ar");
    expect((p!.blocks as Array<{ title: string }>)[0].title).toBe("جديد");
  });
  it("shows English for a language the shared section doesn't cover", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [{ id: "s", blockType: "hero1", title: { en: "New" } }] })] });
    expect(((await findPage("about", "fr"))!.blocks as Array<{ title: string }>)[0].title).toBe("New");
  });
  it("finds the page in every language once it has sections, even without an old list there", async () => {
    q.mockResolvedValue({ docs: [row({ title: { en: "About" }, blocks: { en: [] }, sections: [{ id: "s", blockType: "hero1", title: { en: "New" } }] })] });
    expect(await findPage("about", "es")).not.toBeNull();
  });
  it("falls back to the old per-language list while there are no sections", async () => {
    q.mockResolvedValue({ docs: [row({ sections: [] })] });
    expect(((await findPage("about", "en"))!.blocks as Array<{ title: string }>)[0].title).toBe("Old");
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3:** In `findPage`, before the `carriesLocale` check: compute `const list = row.layoutPerLanguage === true && isRow(row.sectionsByLanguage) ? (row.sectionsByLanguage[locale]?.length ? row.sectionsByLanguage[locale] : row.sectionsByLanguage.en) : row.sections;` — when `Array.isArray(list) && list.length > 0`, return the page with `blocks: pageBlocks(collapseLocales(list, locale))`, meta via `arm(…, locale)` falling back to English, skipping the `carriesLocale` rule; otherwise the existing path unchanged. Also return `_id: String(row.id)` and `fromSections: true|false` on the raw page (and carry both through `toPage` in `lib/content/pages/page.ts` as `id` / `fromSections` on `Page`).
- [ ] **Step 4: PASS** + existing pages reader tests + gates. **Step 5: Commit** — `feat(pages): read the shared Sections list first, the old per-language list as the fallback`.

---

### Task 4: Move script, edit links, dev run, runbook

**Files:** Create `scripts/pages/move-to-sections.ts`; Modify `app/[locale]/(main)/[...slug]/page.tsx` (staff edit links when `page.fromSections`); runbook.

- [ ] **Step 1: Edit links** — in the route, when `page.fromSections && isStaff(await getActor())`, pass `editHref={(i) => \`/admin/collections/pages/${page.id}#sections-row-${i}\`}` and `editLabel` (`blocks.editSection`) to `<Blocks>`. Test: extend the route's existing test file (or add `lib/__tests__/pages-route-edit.test.tsx` mocking `getPageBySlug`, `getActor`/`isStaff`, `Blocks`) asserting the edit href only for staff and only on the sections path.
- [ ] **Step 2: Runner** — same shape as `scripts/communities/move-to-sections.ts`: guards, `--execute/--replace/--revert/--only=<slug>`, read `pages` (`locale: "all"`, `depth: 0`, `draft: false`); per page `guardExisting(page.sections ?? [], { replace, subject: page.slug })`, `planPageSections(page)`, print mode, sections (type + heading en/es/fr/ar), left-out sections, differences, notes; `--execute` writes English first then es/fr/ar via `toLocaleData` + `withIdsFrom`, `layoutPerLanguage: false`, `_status: "published"`; `--revert` empties `sections` and `sectionsByLanguage` per locale.
- [ ] **Step 3: Dev run** — before (Playwright, scroll first): `/en/about`, `/ar/about`, `/es/research-and-action/toolkits`, `/ar/feedback` at 1280 and 375 (headings list). Dry run → read tables (6 SHARED, 3 ALIGNED; About journey heading; Toolkits/Impact reports left-out lists). `--execute`; clear the cache; load twice; after: same headings on SHARED pages in every language; About heading present in all four (English "The Connecting Climate Minds Journey"); Toolkits/Impact reports show download cards in es/ar with translated banners; RTL; no overflow; 0 console errors. Second run refused; `--revert --only=about` restores the old About; re-execute.
- [ ] **Step 4: Runbook** "2026-09-29 pages on shared layouts": migration pre-check → deploy (unchanged) → dry run → execute → clear cache → rollback → signed-in checklist (page editor shows Sections with translation status; old list hidden; edit buttons; live preview; the per-language switch exists but is off).
- [ ] **Step 5:** full gates; commits — `feat(pages): a dry-run-first script moves every page onto shared sections`, `docs(runbook): pages on shared layouts`.
