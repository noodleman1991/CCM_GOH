# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage a freeform, CMS-driven `blocks[]` page-builder matching the handoff §4.1 — every section a registered, reusable Sanity block an editor can place and reorder.

**Architecture:** Convert the `homepage` document from fixed named-fields to a `blocks[]` array (mirroring `page` docs + the shared `<Blocks>` renderer). Slice H1 lays that foundation and migrates the existing fixed-field content into `blocks[]` on the staging dataset; H2–H4 promote the hard-coded sections to blocks, fix the hero CTAs, build the events-calendar block, and compose §4.1.

**Tech Stack:** Next.js App Router, TypeScript, Sanity (`client` + `writeClient`), next-intl, Tailwind, shadcn/ui, Vitest.

## Global Constraints

- Every homepage section is a **registered, reusable Sanity block** — no hard-coded sections.
- Green gate every task: `pnpm typecheck && pnpm test && pnpm build`. Rendered-UI validation on dev/staging (375 + RTL `ar`) for UI tasks.
- NEVER run `sanity typegen generate` (breaks build). Add Sanity schema fields + hand-edit `sanity.types.ts`.
- Content migration is **staging-first** (`NEXT_PUBLIC_SANITY_DATASET=development`); scripts are dry-run/`--apply`, refuse `production_2`, back up first, idempotent (mirror `scripts/migrate-agenda-to-research-output.mjs`). Runs **per locale** (en/es/fr/ar homepage docs).
- Reuse the app design language (`lib/design-tokens`, `lib/ccm-colors`, `components/ui/section-header`, `components/ui/card`).
- Hero CTAs are **Explore** (→ `/atlas`) and **Collaborate** (→ the collab space). [H2]
- No AI attribution in commits; one commit per task minimum.

---

## File Structure (Slice H1)

- `sanity/schemas/documents/homepage.ts` — add a `blocks[]` array field (`of:` the homepage-eligible registered blocks); keep the fixed fields during transition.
- `sanity.types.ts` — hand-add `blocks` to the `Homepage` type + a `HOMEPAGE_BLOCKS_QUERYResult` if needed.
- `sanity/queries/homepage.ts` — add a `blocks[]` projection to `HOMEPAGE_QUERY` / `INDEX_HOMEPAGE_QUERY`.
- `components/pages/homepage.tsx` — render `<Blocks blocks={homepage.blocks} />` when present; fall back to the fixed sections otherwise (transition).
- `scripts/migrate-homepage-to-blocks.mjs` (NEW) — per-locale fixed-fields → `blocks[]` migration (staging).
- `lib/__tests__/homepage-blocks-migration.test.ts` (NEW) — pure mapping helper test (fixed field → block object).
- `lib/homepage/blocks-from-fields.ts` (NEW) — pure helper mapping the homepage fixed fields to an ordered `blocks[]` (unit-testable; reused by the script).

---

## Task 1: Add `blocks[]` to the homepage schema

**Files:**
- Modify: `sanity/schemas/documents/homepage.ts`

**Interfaces:**
- Produces: `homepage.blocks` — an array `of:` the homepage-eligible block types, in the `content` group.

- [ ] **Step 1: Add the field**

In `sanity/schemas/documents/homepage.ts`, add a `blocks` field (before the SEO group), mirroring `page.ts`:

```typescript
defineField({
  name: "blocks",
  title: "Page blocks",
  type: "array",
  group: "content",
  of: [
    { type: "hero-1" },
    { type: "hero-2" },
    { type: "section-header" },
    { type: "split-row" },
    { type: "grid-row" },
    { type: "carousel-1" },
    { type: "carousel-2" },
    { type: "lived-experiences-carousel" },
    { type: "timeline-row" },
    { type: "cta-1" },
    { type: "logo-cloud-1" },
    { type: "faqs" },
    { type: "form-newsletter" },
    { type: "region-map" },
    { type: "people-widget" },
  ],
  description: "Compose the homepage from reusable blocks (drag to reorder). The fixed sections below are legacy and will be removed once blocks are in use.",
}),
```

- [ ] **Step 2: Verify the schema compiles (build the Studio)**

Run: `pnpm build`
Expected: `Compiled successfully` (the Studio schema validates).

- [ ] **Step 3: Commit**

```bash
git add sanity/schemas/documents/homepage.ts
git commit -m "feat(homepage): add blocks[] array to the homepage schema"
```

---

## Task 2: Project `blocks[]` in the homepage query + types

**Files:**
- Modify: `sanity/queries/homepage.ts`
- Modify: `sanity.types.ts` (hand-add `blocks` to `Homepage` / the homepage query result)

**Interfaces:**
- Consumes: the existing `pageBuilder`/`blocks` projection used by `page` queries (reuse it).
- Produces: the homepage query result now includes `blocks` typed like `page.blocks`.

- [ ] **Step 1: Add the projection**

In `sanity/queries/homepage.ts`, find how `page` queries project `blocks[]` (the same projection fragment) and add `blocks[]{ ... }` to both `HOMEPAGE_QUERY` and `INDEX_HOMEPAGE_QUERY`, reusing the page block projection so resolved fields match. If the page projection is a shared fragment, import + spread it; otherwise copy the page query's `blocks[]{...}` block verbatim.

- [ ] **Step 2: Hand-edit sanity.types.ts**

Add `blocks` to the `Homepage` document type (copy the `Page["blocks"]` type union — the homepage `of:` list is a subset of page's plus lived-experiences-carousel/people-widget, both already typed elsewhere). Do NOT run typegen.

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add sanity/queries/homepage.ts sanity.types.ts
git commit -m "feat(homepage): project blocks[] in the homepage query + types"
```

---

## Task 3: Render the homepage via the shared `<Blocks>` renderer

**Files:**
- Modify: `components/pages/homepage.tsx`

**Interfaces:**
- Consumes: `Blocks` (`components/blocks/index.tsx`, props `{ blocks, locale, userId }`), `homepage.blocks`.

- [ ] **Step 1: Render blocks when present**

In `components/pages/homepage.tsx`, import the shared renderer and, when `homepage.blocks?.length`, render it; otherwise keep the existing fixed-section render (transition fallback):

```tsx
import Blocks from "@/components/blocks";
// ...
if (homepage.blocks && homepage.blocks.length > 0) {
  return <Blocks blocks={homepage.blocks} locale={locale} />;
}
// ...existing fixed-section JSX as fallback...
```

- [ ] **Step 2: Verify typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: compiles.

- [ ] **Step 3: Commit**

```bash
git add components/pages/homepage.tsx
git commit -m "feat(homepage): render via the shared Blocks renderer when blocks[] present"
```

---

## Task 4: Pure helper — fixed fields → blocks[]

**Files:**
- Create: `lib/homepage/blocks-from-fields.ts`
- Test: `lib/__tests__/homepage-blocks-migration.test.ts`

**Interfaces:**
- Produces: `blocksFromFields(homepage: Record<string, any>): any[]` — returns an ordered array of block objects (each with `_type` + `_key` + the field's value) for the populated fixed fields, in the §4.1 order: heroWelcome, globalAgenda, regionalCommunities (region context), news, livedExperiences, collaboration, mentalHealthDefinition, partnerLogos. Skips empty fields. Each block reuses the field's existing value verbatim (the field types already match block types).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/homepage-blocks-migration.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { blocksFromFields } from "@/lib/homepage/blocks-from-fields";

describe("blocksFromFields", () => {
  it("maps populated fixed fields to ordered blocks with _type + _key", () => {
    const hp = {
      heroWelcome: { _type: "hero-1", tagLine: "hi" },
      news: { _type: "grid-row", mode: "dynamic-recent" },
      partnerLogos: { _type: "logo-cloud-1", images: [] },
    };
    const blocks = blocksFromFields(hp);
    expect(blocks.map((b) => b._type)).toEqual(["hero-1", "grid-row", "logo-cloud-1"]);
    expect(blocks.every((b) => typeof b._key === "string" && b._key.length > 0)).toBe(true);
  });

  it("skips empty/absent fields", () => {
    expect(blocksFromFields({})).toEqual([]);
    expect(blocksFromFields({ heroWelcome: null })).toEqual([]);
  });

  it("preserves the field value on the block", () => {
    const hp = { heroWelcome: { _type: "hero-1", tagLine: "x" } };
    expect(blocksFromFields(hp)[0]).toMatchObject({ _type: "hero-1", tagLine: "x" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/homepage-blocks-migration.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the helper**

Create `lib/homepage/blocks-from-fields.ts`:

```typescript
// Ordered map of homepage fixed fields → their block _type, in §4.1 order.
const FIELD_ORDER: { field: string; type: string }[] = [
  { field: "heroWelcome", type: "hero-1" },
  { field: "globalAgenda", type: "split-row" },
  { field: "howToUse", type: "split-row" },
  { field: "agendasModule", type: "grid-row" },
  { field: "regionalCommunities", type: "grid-row" },
  { field: "news", type: "grid-row" },
  { field: "livedExperiences", type: "carousel-2" },
  { field: "collaboration", type: "split-row" },
  { field: "projectInfo", type: "split-row" },
  { field: "mentalHealthDefinition", type: "cta-1" },
  { field: "partnerLogos", type: "logo-cloud-1" },
];

let counter = 0;
function key(type: string): string {
  // Deterministic-enough per call; the migration stamps a stable key per field.
  counter += 1;
  return `${type}-${counter}`;
}

export function blocksFromFields(homepage: Record<string, any>): any[] {
  counter = 0;
  const out: any[] = [];
  for (const { field, type } of FIELD_ORDER) {
    const val = homepage?.[field];
    if (val && typeof val === "object") {
      out.push({ ...val, _type: val._type || type, _key: val._key || key(type) });
    }
  }
  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/homepage-blocks-migration.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/homepage/blocks-from-fields.ts lib/__tests__/homepage-blocks-migration.test.ts
git commit -m "feat(homepage): pure helper mapping fixed fields to blocks[]"
```

---

## Task 5: Migration script + run on staging

**Files:**
- Create: `scripts/migrate-homepage-to-blocks.mjs`

**Interfaces:**
- Consumes: `blocksFromFields` logic (inline the same field-order map in the .mjs; the helper is ESM-incompatible with the script's plain-mjs imports, so duplicate the small ordered map with a comment pointing at the helper as the source of truth).

- [ ] **Step 1: Write the script**

Create `scripts/migrate-homepage-to-blocks.mjs` mirroring `scripts/migrate-agenda-to-research-output.mjs`: load env, refuse `production_2`, dry-run by default + `--apply`, back up the source homepage docs first. For each `homepage` doc (all locales), read the fixed fields, build an ordered `blocks[]` (same FIELD_ORDER as the helper, stable `_key` per field e.g. `hero-1-heroWelcome`), and patch `set: { blocks }` only if `blocks` is empty/absent (idempotent). Print per-doc counts.

- [ ] **Step 2: Dry-run on staging**

Run (with `.env.local` `NEXT_PUBLIC_SANITY_DATASET=development`):
`node scripts/migrate-homepage-to-blocks.mjs`
Expected: prints each locale homepage doc + the block count it would write; "DRY RUN".

- [ ] **Step 3: Apply on staging**

Run: `node scripts/migrate-homepage-to-blocks.mjs --apply`
Expected: backs up + writes `blocks[]` to each homepage doc; re-run shows idempotent (0 to change).

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-homepage-to-blocks.mjs
git commit -m "feat(homepage): fixed-fields -> blocks[] migration script (staging)"
```

---

## Task 6: Validate the blocks[] homepage on dev + green gate

**Files:** none (validation).

- [ ] **Step 1: Green gate**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 2: Rendered validation**

Start dev (`pnpm next dev -p 3001`), open `/en`. Confirm the homepage renders from `blocks[]` (the migrated sections appear in order, identical to before). Check `/ar` (RTL) + 375 width. Screenshot to `docs/design/screenshots/homepage-blocks.png`.

- [ ] **Step 3: Commit the screenshot**

```bash
git add docs/design/screenshots/homepage-blocks.png
git commit -m "test(homepage): validate blocks[]-rendered homepage on dev/staging"
```

---

## Slice H2 — Promote hard-coded sections to blocks + hero CTAs (outline)

- **Task H2.1** `region-map` block: promote the existing `region-map.ts` object schema to a homepage block (it's already in componentMap + the homepage `of:` list); drop the `FEATURES.homepageMap` gate in `homepage.tsx` (it's a real block now). Keep the choropleth (blob visual = out of scope).
- **Task H2.2** `people-widget` block: it already has a schema + componentMap entry; ensure it's a placeable homepage block (in the `of:` list ✓); drop the `FEATURES.homepagePeople` gate.
- **Task H2.3** Hero CTAs: set `hero-1`'s links to **Explore** (`/atlas`) + **Collaborate** (collab space) in the migrated hero block content (on staging) + ensure `hero-1` renders two link buttons; add the blob accent element to `hero-1.tsx` (reuse `ccmblob`).

## Slice H3 — events-calendar block (outline)

- **Task H3.1** Schema `sanity/schemas/blocks/events/events-calendar.ts` (title, optional region filter, count) + register (schema.ts + componentMap + homepage `of:`).
- **Task H3.2** Component `components/blocks/events/events-calendar.tsx`: month grid (`grid-cols-7`, event days tinted from `event.startAt`), upcoming list, inline RSVP (reuse `components/events/rsvp-button.tsx` + `lib/actions/rsvp.ts`), Subscribe/iCal link. Data via `lib/events.ts fetchApprovedEvents()`.
- **Task H3.3** Unit tests for month-grid + upcoming-filter date helpers. Green gate + rendered validation.

## Slice H4 — adapt remaining + compose §4.1 (outline)

- **Task H4.1** Lived carousel: place the `lived-experiences-carousel` block on the homepage in place of `carousel-2`; add "View all" link.
- **Task H4.2** News media-list layout variant on `grid-row`/`grid-news`.
- **Task H4.3** Submit-lived-experience banner via `cta-1`.
- **Task H4.4** Compose the §4.1 block order on the staging homepage doc(s) + author/migrate content; validate the full page (375 + RTL).

---

## Self-Review

**Spec coverage:** blocks[] conversion → H1 ✓; promote region-map/people to blocks + un-gate → H2 ✓; hero Explore/Collaborate CTAs → H2.3 ✓; events-calendar block (calendar+list+inline RSVP) → H3 ✓; lived carousel adoption → H4.1 ✓; news list + submit banner → H4.2/H4.3 ✓; compose §4.1 → H4.4 ✓; staging-first migration → H1 Task 5 ✓; per-locale → Task 5 ✓. Out-of-scope (blob map, hero carousel, projects panel, legacy-field removal) not tasked. ✓

**Placeholder scan:** Task 2 references "the page block projection" — at execution, open `sanity/queries/` for the existing `page` `blocks[]{...}` projection and reuse it verbatim (it exists; the audit confirmed page docs use blocks[] + componentMap). Task 5 duplicates FIELD_ORDER intentionally (script is plain .mjs) with a source-of-truth comment. Otherwise concrete.

**Type consistency:** `blocksFromFields` return shape (objects with `_type` + `_key`) matches what `<Blocks>` iterates (`block._type` → componentMap, `block._key`); the homepage `of:` list types match the componentMap keys; FIELD_ORDER types (hero-1/grid-row/cta-1/logo-cloud-1/carousel-2/split-row) are all registered block types. ✓
