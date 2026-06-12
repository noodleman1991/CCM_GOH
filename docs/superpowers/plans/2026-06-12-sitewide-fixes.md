# Site-Wide Test & Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the known site-wide issues (collaborate filters/sort, profile-completeness visibility, case-study submission/approval + styling, CMS block image/text/grid fitting, CMS editor UX, onboarding, homepage dynamic content) and establish a real test suite (vitest) with honest reporting of what is and isn't covered.

**Architecture:** Next.js 16.1.1 App Router + React 19, Clerk auth (middleware in `proxy.ts`), Prisma 6 (client generated to `generated/prisma`), Sanity v4 CMS (embedded Studio), next-intl (`en/es/fr/ar`, `ar` RTL), Tailwind v4, pnpm. All filtering on /collaborate is server-driven via URL params. Case studies live entirely in Sanity with a `status` workflow field. Page-builder blocks are Sanity schemas in `sanity/schemas/blocks/` rendered by `components/blocks/` via the dispatcher in `components/blocks/index.tsx`. The site layout has a collapsible (offcanvas, 17.625rem) sidebar and all block content is capped at `max-w-6xl` (1152px) by `components/ui/section-container.tsx`.

**Tech Stack:** vitest (new), @testing-library/react + jsdom (component tests), zod, Prisma.sql, @sanity/image-url.

**Execution notes:**
- Test runner: `pnpm test` (added in Task 1). Typecheck: `pnpm typecheck`.
- NEVER include Claude/AI attribution in commits (CLAUDE.md rule).
- Commit after each task with a conventional message.
- `lib/services/user.service.ts` and `app/[locale]/(main)/collaborate/page-client.tsx` already contain uncommitted in-progress fixes (AND-between-filter-categories; client no longer re-filters carousels). Keep those changes; build on them.
- When adding i18n strings, add the SAME keys to all four files `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/ar.json` (translate sensibly; ar is RTL).

---

### Task 1: Bootstrap vitest test infrastructure

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json` (scripts + devDependencies)
- Create: `lib/__tests__/smoke.test.ts`

- [ ] **Step 1: Install dev deps**

Run: `pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom`

- [ ] **Step 2: Extend vite.config.ts with vitest config**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './')
        }
    },
    test: {
        environment: 'node',
        include: ['**/*.test.{ts,tsx}'],
        exclude: ['node_modules', '.next', 'generated', 'scripts'],
    }
});
```

Component tests opt into jsdom per-file with `// @vitest-environment jsdom` at the top.

- [ ] **Step 3: Add scripts to package.json**

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write smoke test** `lib/__tests__/smoke.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('test infra smoke', () => {
  it('resolves @ alias and runs', () => {
    expect(cn('a', 'b')).toContain('a')
  })
})
```

- [ ] **Step 5: Run** `pnpm test` — expect PASS.
- [ ] **Step 6: Commit** `chore: add vitest test infrastructure`

---

### Task 2: Collaborate page — filter/sort logic fixes + tests

**Files:**
- Modify: `lib/services/user.service.ts` (fuzzy SQL ~448-465, ANY cast ~409, privacy flag ~541, fuzzy fallback ~521)
- Modify: `app/[locale]/(main)/collaborate/page.tsx` (~60-62, ~135-158)
- Modify: `app/[locale]/(main)/collaborate/page-client.tsx` (param building, state sync)
- Create: `lib/collaborate-filters.ts` (pure, testable param logic)
- Modify: `components/collaborate/user-grid.tsx` (~44-49 clamp page)
- Test: `lib/__tests__/collaborate-filters.test.ts`, `lib/services/__tests__/user-redaction.test.ts`
- Delete: `scripts/diag-fuzzy.mjs` (after fix lands)

**Background bugs (verified):**
1. `user.service.ts:448-458` — fuzzy query uses `HAVING ${similarityExpr} >= ${threshold}` with no GROUP BY → invalid Postgres. `scripts/diag-fuzzy.mjs` proves moving the predicate into `WHERE … AND …` fixes it.
2. `user.service.ts:409` — `ANY(${filters.communityIds})` missing `::text[]` cast (lines 414/418 have it).
3. `user.service.ts:541` — hardcodes `getPrivacyWhereClause(true)` instead of `options.isAuthenticated`.
4. Fuzzy path never redacts users (standard path does at line 661) and is dead code (no caller sets `useFuzzySearch`).
5. `page.tsx:135-136` — inverted-feeling condition leaks the "No Regional Community" group whenever filtering to a subset of communities.
6. `page-client.tsx:113-121,139-147` — deselect-all produces no URL params → server shows everyone (UI semantics say it should show no one).
7. `page-client.tsx:87-97` — filter state not re-synced on back/forward nav.
8. `user-grid.tsx:44-49` — `currentPage` never clamped when `users` prop shrinks.

- [ ] **Step 1: Create pure param-codec module + failing tests first**

`lib/collaborate-filters.ts` — extract the URL param encode/decode logic so it's testable and shared by server + client:

```ts
export const NONE_SENTINEL = 'none'

export interface CollaborateFilterState {
  workTypes: string[]
  expertiseAreas: string[]
  communities: string[]
}

/** Encode one filter category into a URL param value.
 *  - all selected -> undefined (omit param, clean URL)
 *  - none selected -> 'none' sentinel (explicit empty selection)
 *  - subset -> comma-joined values */
export function encodeFilterParam(selected: string[], all: string[]): string | undefined {
  if (selected.length === 0) return NONE_SENTINEL
  if (selected.length >= all.length) return undefined
  return selected.join(',')
}

/** Decode a URL param value back to a selection.
 *  - missing/empty -> null (means "all", caller applies no filter)
 *  - 'none' -> [] (explicit empty selection)
 *  - otherwise -> split values */
export function decodeFilterParam(value: string | undefined): string[] | null {
  if (!value) return null
  if (value === NONE_SENTINEL) return []
  return value.split(',').filter(Boolean)
}

export function buildCollaborateParams(
  search: string,
  filters: CollaborateFilterState,
  all: { workTypes: string[]; expertiseAreas: string[]; communities: string[] }
): URLSearchParams {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  const wt = encodeFilterParam(filters.workTypes, all.workTypes)
  if (wt) params.set('workTypes', wt)
  const ea = encodeFilterParam(filters.expertiseAreas, all.expertiseAreas)
  if (ea) params.set('expertiseAreas', ea)
  const cm = encodeFilterParam(filters.communities, all.communities)
  if (cm) params.set('communities', cm)
  return params
}
```

Tests in `lib/__tests__/collaborate-filters.test.ts`: all-selected omits param; empty array yields `'none'`; subset round-trips; `decodeFilterParam(undefined)` is null; `decodeFilterParam('none')` is `[]`.

- [ ] **Step 2: Run tests, see them fail, implement, see them pass.**

- [ ] **Step 3: Fix fuzzy SQL in `user.service.ts`**

Replace the users query (lines 448-458):

```ts
prisma.$queryRaw<(User & { similarity_score: number })[]>`
  SELECT
    u.*,
    ${similarityExpr} as similarity_score
  FROM "User" u
  WHERE ${allConditions}
    AND ${similarityExpr} >= ${similarityThreshold}
  ORDER BY similarity_score DESC, u."lastLoginAt" DESC NULLS LAST, u."profileCompleteness" DESC
  LIMIT ${pageSize}
  OFFSET ${skip}
`,
```

Also: line 409 `AND uc."communityId" = ANY(${filters.communityIds}::text[])` (verify the actual Prisma column type — if `communityId` is text/uuid adjust the cast accordingly by checking `prisma/schema.prisma`); add redaction before returning (`redactUser(user, null)` like line 661); add optional `excludeRegionalCommunities` support to `fuzzySearchUsers` filters:

```ts
if (filters?.excludeRegionalCommunities) {
  filterConditions.push(Prisma.sql`NOT EXISTS (
    SELECT 1 FROM "UserCommunity" uc
    JOIN "Community" c ON c.id = uc."communityId"
    WHERE uc."userId" = u.id AND c.type = 'REGIONAL'
  )`)
}
```

Fix line 541: `const privacyFilter = this.getPrivacyWhereClause(options.isAuthenticated)`.

- [ ] **Step 4: Wire fuzzy search with graceful fallback in `getUsersForCollaborate`**

At line 521, when `filters.useFuzzySearch && filters.searchQuery`, await the fuzzy result; if `!result.success`, log and fall through to the standard contains-based path (don't return the error). This makes fuzzy search safe to enable even if pg_trgm is missing in some environment.

- [ ] **Step 5: Fix server page `page.tsx`**

- Parse params with `decodeFilterParam`; `null` means no filter, `[]` (the `none` sentinel) means render the page with an EMPTY `communityUsersMap` and skip all user queries.
- Pass `useFuzzySearch: true` when `search` is set.
- Fix the no-community condition: `const shouldFetchNoCommunity = communitiesFilter === null` (only show the "No Regional Community" carousel when no community filter is active).
- Pass the decoded arrays to the client `initialFilters` (empty array for `none`, full list omitted→client treats as all).

- [ ] **Step 6: Fix client `page-client.tsx`**

- Replace both inline param-building blocks (lines 104-151) with `buildCollaborateParams(...)` from Step 1.
- Sync state on URL-driven prop changes:

```ts
useEffect(() => {
  setFilters({
    communities: initialFilters?.communities ?? [...ALL_COMMUNITY_IDS],
    workTypes: initialFilters?.workTypes ?? [...ALL_WORK_TYPES],
    expertiseAreas: initialFilters?.expertiseAreas ?? [...ALL_EXPERTISE_AREAS],
  })
  setSearchInput(initialSearch || '')
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [JSON.stringify(initialFilters), initialSearch])
```

NOTE: the server must now distinguish "param absent (all)" from "none" when building `initialFilters` — pass `{ workTypes: string[] | null, ... }` style (null = all) and adapt the client types accordingly.
- When a category is explicitly empty (`filters.X.length === 0`), render the existing empty/no-results state instead of carousels.

- [ ] **Step 7: Clamp pagination in `user-grid.tsx`**

```ts
const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
useEffect(() => {
  setCurrentPage(p => Math.min(p, totalPages))
}, [totalPages])
```

- [ ] **Step 8: user-redaction unit tests** `lib/services/__tests__/user-redaction.test.ts` — assert email/phone redacted for non-owner, untouched for owner (read `lib/services/user-redaction.ts` for the exact API first).

- [ ] **Step 9: Run** `pnpm test` and `pnpm typecheck` — both must pass. Delete `scripts/diag-fuzzy.mjs`.

- [ ] **Step 10: Commit** `fix(collaborate): repair fuzzy search SQL, filter semantics, pagination and state sync`

---

### Task 3: Profile completeness — correct math + owner-only visibility

**Files:**
- Modify: `app/[locale]/(main)/dashboard/page.tsx:136-154`
- Modify: `app/api/profile/route.ts:270-288`
- Modify: `components/collaborate/collaborate-user-card.tsx:197-213`
- Modify: `app/[locale]/(main)/profiles/[username]/page.tsx`
- Test: `lib/__tests__/profile-completeness.test.ts`

**Background:** `lib/profile-completeness.ts` weights include `communityMemberships: 5` and `recentWork: 5`, but both call sites omit them → stored % maxes at 90, so the dashboard "complete your profile" nag (shown when `< 100`) never goes away. The compact % indicator is currently rendered on every collaborate card for ALL viewers (`collaborate-user-card.tsx:199-205`); the profile page never shows it. Requirement: % visible ONLY to the profile owner on their own profile (and dashboard), never to other users.

- [ ] **Step 1: Write failing unit tests** `lib/__tests__/profile-completeness.test.ts`: weights sum to 100; a fully-populated input (including communityMemberships + recentWork) returns 100; empty input returns 0; partial inputs return expected weighted values. Read `lib/profile-completeness.ts` first for exact API/field names.
- [ ] **Step 2: Run tests** (the weights-sum and full-input tests should pass against the lib itself — these guard regressions).
- [ ] **Step 3: Fix both call sites** to pass `communityMemberships` and `recentWork` (dashboard/page.tsx fetches the user with those relations already or extend the Prisma include; same for the profile API route which persists `profileCompleteness` to the DB).
- [ ] **Step 4: Remove the indicator from collaborate cards** — delete the `ProfileCompletenessIndicator` block at `collaborate-user-card.tsx:199-205` (keep `lastLoginAt`). Remove now-unused import.
- [ ] **Step 5: Add owner-only indicator on the profile page** — in `app/[locale]/(main)/profiles/[username]/page.tsx`, where `isOwnProfile` is computed (line ~51), render `<ProfileCompletenessIndicator percentage={user.profileCompleteness} />` only when `isOwnProfile` (place near the profile header / edit button at lines ~129-135). Verify `profileCompleteness` is included in the data returned by `UserService.getUserForProfile`; add it if missing.
- [ ] **Step 6: Run** `pnpm test && pnpm typecheck`.
- [ ] **Step 7: Commit** `fix(profile): completeness reaches 100%, indicator owner-only`

---

### Task 4: Case studies — approval mechanism, validation, content styling

**Files:**
- Modify: `sanity/actions/case-study-actions.ts`
- Modify: `app/api/case-studies/submit/route.ts`
- Create: `lib/validation/case-study.ts` (server zod schema + slug util)
- Modify: `app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx:171-177`
- Modify: `app/[locale]/(main)/research-and-action/case-studies/page.tsx:59-125`
- Modify: `app/api/webhooks/sanity/route.ts`
- Modify: `components/forms/case-study-review.tsx:1`
- Modify: `components/forms/case-study-form.tsx` (~429 false promise)
- Test: `lib/__tests__/case-study-validation.test.ts`

**Background bugs (verified):** Studio approve/reject/revision actions import the unauthenticated read `client` (`sanity/lib/client.ts`) → mutations fail silently (errors only console.error'd, `onComplete` never called). Preview action opens `/en/case-studies/${slug}` but the real route is `/en/research-and-action/case-studies/[slug]`. `publishedAt`/`reviewedAt`/`reviewedBy` only set via the custom action, not when editors flip the status dropdown. Submit API has zero validation (`data.title.en.toLowerCase()` 500s on missing title) and ASCII-only slugs. Detail page renders `<PortableText>` raw (no `components` prop) so editor-emitted `image` blocks are dropped and links unstyled — the rich renderer `components/portable-text-renderer.tsx` already exists and is used by the modal. Listing page interpolates URL params directly into GROQ (injection). No `caseStudy` branch in the Sanity webhook revalidation. `case-study-review.tsx` line 1 is `// File: components/forms/case-study-review.t"use client"` — mangled directive.

- [ ] **Step 1: Failing tests first** — `lib/__tests__/case-study-validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { caseStudySubmissionSchema, generateCaseStudySlug } from '@/lib/validation/case-study'

describe('generateCaseStudySlug', () => {
  it('slugifies latin titles', () => {
    expect(generateCaseStudySlug('My Great Study!')).toMatch(/^my-great-study/)
  })
  it('preserves unicode letters (arabic/accents)', () => {
    expect(generateCaseStudySlug('Estudio de São Paulo')).toContain('são-paulo')
    expect(generateCaseStudySlug('دراسة حالة')).not.toMatch(/^-?[0-9a-f]{8}$/)
  })
})

describe('caseStudySubmissionSchema', () => {
  it('rejects missing title', () => {
    expect(caseStudySubmissionSchema.safeParse({}).success).toBe(false)
  })
})
```

- [ ] **Step 2: Implement `lib/validation/case-study.ts`** — zod schema mirroring the client `formSchema` in `components/forms/case-study-form.tsx:46-93` (read it; keep server schema permissive on optional fields but strict on title/content/authors shape), plus:

```ts
export function generateCaseStudySlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 96)
  const suffix = Math.random().toString(36).slice(2, 8)
  return base ? `${base}-${suffix}` : suffix
}
```

- [ ] **Step 3: Run tests — pass.**

- [ ] **Step 4: Harden submit route** — in `app/api/case-studies/submit/route.ts`: parse with `caseStudySubmissionSchema.safeParse`, return 400 with flattened errors on failure; use `generateCaseStudySlug`; remove the phantom `data.subtitle` reference (line ~72, exists in neither form nor schema).

- [ ] **Step 5: Fix Studio document actions** `sanity/actions/case-study-actions.ts` — document actions are React hooks; use the authenticated Studio client:

```ts
import { useClient } from 'sanity'
// inside each action hook:
const client = useClient({ apiVersion: '2024-10-01' })
```

On approve: `status: 'approved'`, `publishedAt: published?.publishedAt || new Date().toISOString()`, `reviewedAt: new Date().toISOString()`. On reject/revision: set `reviewedAt` too. Always call `props.onComplete()` (in finally), and surface failures (rethrow after console.error so Studio shows the error toast). Fix preview URL to `/${locale ?? 'en'}/research-and-action/case-studies/${slug}` (hardcode `en` if no locale context — match existing behavior otherwise).

- [ ] **Step 6: Styling — swap detail-page renderer.** In `app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx:171-177` replace raw `<PortableText value={...} />` with the existing rich renderer used by the modal:

```tsx
import PortableTextRenderer from '@/components/portable-text-renderer'
// ...
<PortableTextRenderer value={caseStudy.content} />
```

(Read `components/blocks/case-study-modal.tsx:139-145` for exact import name/props and mirror it. Keep the `prose` wrapper if the renderer expects it — check how the modal wraps it.)

- [ ] **Step 7: Parameterize listing GROQ** — in the case-studies listing page, replace string interpolation of `topic/tags/communities/search` with GROQ params (`$search` etc., passed via the fetch params object), following the pattern of `searchCaseStudies` in `sanity/queries/grid/grid-case-study.ts`.

- [ ] **Step 8: Webhook revalidation** — add a `caseStudy` case to `app/api/webhooks/sanity/route.ts` mirroring the existing cases (revalidate the listing + detail paths or tags used by those pages).

- [ ] **Step 9: Fix mangled directive** — `components/forms/case-study-review.tsx` line 1 must be exactly `"use client"` (drop the broken comment). Also fix the false promise in the form success screen (`case-study-form.tsx:429`): change copy to point users to their dashboard submissions page for status (no email notifications exist). If the string comes from `messages/*.json`, change it there in all four locales.

- [ ] **Step 10: Run** `pnpm test && pnpm typecheck`.
- [ ] **Step 11: Commit** `fix(case-studies): authenticated approval actions, server validation, rich content rendering, GROQ params`

---

### Task 5: CMS blocks — image sizing/cropping + responsive `sizes`

**Files:**
- Modify: `sanity/lib/image.ts` (add cropped helper)
- Modify: `components/blocks/grid/grid-card.tsx`, `grid-post.tsx`, `grid-agenda.tsx`, `grid-news.tsx`, `grid-case-study.tsx`, `grid-report.tsx`, `grid-external-source.tsx`
- Modify: `components/blocks/hero/hero-1.tsx`, `components/blocks/split/split-image.tsx`, `components/blocks/grid/team-grid.tsx`, `components/blocks/carousel/carousel-1.tsx`, `carousel-2.tsx`, `lived-experiences-carousel.tsx`
- Modify: `components/blocks/all-posts.tsx`, `components/blocks/inserts/manual-content-block.tsx`, `components/blocks/case-study-modal.tsx`
- Modify: `components/blocks/grid/grid-row.tsx` (pass `sizes` to children by column count)
- Modify schemas (enable hotspot): `sanity/schemas/blocks/hero/hero-1.ts`, `sanity/schemas/blocks/grid/grid-card.ts`, `sanity/schemas/blocks/split/split-image.ts`, `sanity/schemas/blocks/carousel/carousel-1.ts`, `sanity/schemas/blocks/inserts/manual-content-insert.ts`

**Background (verified):** `urlFor` in `sanity/lib/image.ts:8-20` forces `fit("max")` which NEVER crops — so editor-set hotspots have no effect anywhere; all cropping is CSS `object-cover` centered. Several card renderers request fixed 400×225 sources, blurry when the grid is 2-col/wide (cards render ~550px+) — especially noticeable because the sidebar is collapsible (offcanvas, content gains ~282px instantly) while `sizes` attrs use raw `vw` that ignore both the sidebar and the `max-w-6xl` (1152px) container cap. Several `fill` images have no `sizes` at all (browser assumes 100vw). Full-res sources (no `.width()`): grid-card.tsx:47, hero-1.tsx:108, split-image.tsx:17, team-grid.tsx:204, carousel-2.tsx:77, lived-experiences-carousel.tsx:131.

- [ ] **Step 1: Add hotspot-aware helper to `sanity/lib/image.ts`**

```ts
/** Hotspot-aware crop: requests an exact aspect from the Sanity CDN so the
 *  editor's hotspot/crop is honored instead of CSS center-cropping. */
export function urlForCropped(source: SanityImageSource, width: number, height: number) {
  return builder.image(source).width(width).height(height).fit('crop').auto('format')
}
```

(Match the existing builder variable name/types in the file. Keep `urlFor` as-is for back-compat.)

- [ ] **Step 2: Enable hotspot in block image schemas** — add `options: { hotspot: true }` to the `image` fields of `hero-1.ts`, `grid-card.ts`, `split-image.ts`, `carousel-1.ts`, `manual-content-insert.ts` (check each file for the exact field def; some may nest options).

- [ ] **Step 3: Compute `sizes` per column-count in `grid-row.tsx` and pass down.**

In `grid-row.tsx` (column mapping at ~132-142), derive a sizes string and pass it to each column component as an optional `imageSizes` prop:

```ts
function sizesForColumns(cols: number): string {
  // content area capped at max-w-6xl (1152px); approximate card width at cap
  const capped = Math.round(1152 / cols)
  return `(min-width: 1152px) ${capped}px, (min-width: 1024px) ${Math.round(100 / cols)}vw, (min-width: 768px) 50vw, 100vw`
}
```

Each grid card component accepts `imageSizes?: string` with its current value as fallback.

- [ ] **Step 4: Card-by-card image fixes** (use `urlForCropped`, bump source widths, add missing `sizes`):

- `grid-card.tsx:45-54`: `urlForCropped(image, 800, variantIs16x9 ? 450 : 533).url()`, keep `fill` + `object-cover`, use `imageSizes` prop.
- `grid-agenda.tsx:89-96`, `grid-news.tsx:186-193`, `grid-case-study.tsx:137-144`, `grid-report.tsx:85-93`, `grid-external-source.tsx:~166`: replace `width(400).height(225)` with `urlForCropped(..., 800, 450)` (or 800×533 for 3:2 variants — match each component's aspect class), use `imageSizes`.
- `grid-post.tsx:91-102`: switch aspect to match siblings (`aspect-[3/2]` default / `aspect-video` for wide — mirror grid-card's variant logic if the variant prop is available, otherwise use `aspect-[3/2]`), `urlForCropped(..., 800, 533)`, use `imageSizes`.
- `hero-1.tsx:106-115`: `urlForCropped(image, 1200, 800)` (or keep intrinsic ratio via `.width(1200)` only if the layout is not fixed-aspect — read the component first), fix `sizes` to `"(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 100vw"`.
- `split-image.tsx:15-24`: `.width(1000)` source; `sizes` → `"(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 100vw"`.
- `team-grid.tsx:203-213`: `urlForCropped(avatar, 320, 320)`.
- `carousel-2.tsx:77`: `urlForCropped(avatar, 80, 80)`.
- `lived-experiences-carousel.tsx:142-147`: add `sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"`; add `.width(800)` to the Sanity thumbnail source (line ~131).
- `all-posts.tsx:164-170`: add `sizes="(min-width: 1024px) 384px, (min-width: 768px) 50vw, 100vw"` and `.width(800)` source.
- `manual-content-block.tsx:82-86`: add a `sizes` attr consistent with its layout.
- `case-study-modal.tsx`: add `sizes` to its hero/fill image (read file for context; modal is ~max-w-3xl → `"(min-width: 768px) 768px, 100vw"`).
- `carousel-1.tsx:98-110`: fix `sizes` so size="one" uses `100vw`-ish and thirds use `33vw`; keep fixed heights but note in the honest report that fixed rem heights crop unpredictably.
- `logo-cloud-1.tsx:75-90`: minor — add `sizes="96px"`.

- [ ] **Step 5: Visual sanity check** — run `pnpm typecheck`. If a dev server is feasible (`pnpm dev`), spot-check a page with grids; otherwise rely on typecheck + report.
- [ ] **Step 6: Commit** `fix(blocks): hotspot-aware cropping, correct image sources and sizes attrs`

---

### Task 6: CMS blocks — text fitting, line clamps, grid 2–5 columns, hooks/i18n cleanups

**Files:**
- Modify: `components/blocks/grid/grid-card.tsx` (clamps, i18n fallback), `grid-agenda.tsx` (clamp-14, hooks order, i18n), `grid-lived-experience.tsx` (hooks order), `grid-report.tsx` (i18n), `components/blocks/all-posts.tsx` (i18n, locale date), `components/blocks/inserts/dynamic-content-block.tsx` (i18n), `components/ui/grid-section-header.tsx` (overflow safety)
- Modify: `sanity/schemas/blocks/shared/layout-variants.ts` (add 5-col), `components/blocks/grid/grid-row.tsx` (5-col mapping + schema parity), `sanity/schemas/blocks/grid/grid-row.ts` (add subtitle/headerImage/initialDisplayCount + 5-col)
- Modify: `components/templates/regional-community-template.tsx` (remove console.logs), `components/blocks/carousel/lived-experiences-carousel.tsx` (remove console.logs)
- Modify: `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/ar.json`
- Test: `components/__tests__/grid-row-columns.test.tsx` (jsdom)

- [ ] **Step 1: Text clamps for uniform cards**
- `grid-card.tsx:62` title: add `line-clamp-2`; `:65` excerpt: add `line-clamp-3`.
- `grid-agenda.tsx:135`: `line-clamp-14` → `line-clamp-6`.
- `components/ui/grid-section-header.tsx:44-50`: add `break-words` to title and subtitle (no clamp — editor-controlled headers should wrap fully).

- [ ] **Step 2: Add 5-column grid option**
- `sanity/schemas/blocks/shared/layout-variants.ts:11-15`: add `"grid-cols-5"` to `COLS_VARIANTS` with a human title like `"5 Cards"`. Retitle existing options to `"2 Cards" / "3 Cards" / "4 Cards"` (values unchanged for back-compat).
- `grid-row.tsx:132-142`: add explicit mapping for `grid-cols-5` → `"grid-cols-2 md:grid-cols-3 lg:grid-cols-5"` (literal string — Tailwind must see it). Verify "wide" cardVariant still caps at 2.
- `sanity/schemas/blocks/grid/grid-row.ts`: add the fields the renderer + GROQ (`sanity/queries/grid/grid-row.ts:17-35`) already support but the schema doesn't expose: `subtitle` (string), `headerImage` (image, hotspot true), `initialDisplayCount` (number, description "How many cards to show before the Show More button"). Match field names exactly to the GROQ projection.

- [ ] **Step 3: jsdom component test** `components/__tests__/grid-row-columns.test.tsx` (`// @vitest-environment jsdom`): render the column-class mapping for each gridColumns value (export the mapping function from grid-row.tsx or test the rendered container class) and assert `lg:grid-cols-5` etc. appear. Keep the test minimal — mock child components if grid-row drags in server-only imports (if it's a server component that can't render in jsdom, extract the mapping into `lib/grid-layout.ts` and unit-test that instead, importing it from grid-row.tsx).

- [ ] **Step 4: Fix conditional-hook violations** — `grid-lived-experience.tsx:130-132` and `grid-agenda.tsx:53-55` call `useTranslations` after early returns; move all hooks above any `return`.

- [ ] **Step 5: i18n the hardcoded strings.** Add a `blocks` namespace to all four `messages/*.json`:

```json
"blocks": {
  "learnMore": "Learn More",
  "downloads": "Downloads",
  "membersOnly": "Members only",
  "signInToDownload": "Please sign in to download",
  "featured": "Featured",
  "viewAll": "View All",
  "noPostsTitle": "No posts yet",
  "noPostsBody": "Check back soon for updates."
}
```

Replace: `grid-card.tsx:75` `"Learn More"` fallback; `grid-agenda.tsx:167` "downloads"; `grid-report.tsx:78,106`; `all-posts.tsx:140-141` empty-state, and `:177` hardcoded `'en-US'` date → use the active locale (`useLocale()` from next-intl or the locale prop if server component — read the component to choose). `dynamic-content-block.tsx:149` "View All". Use `useTranslations('blocks')` in client components / `getTranslations` in server components.

- [ ] **Step 6: Remove debug console.logs** — `regional-community-template.tsx:185-215, 308-328, 377-379` and `lived-experiences-carousel.tsx:309-313`.

- [ ] **Step 7: Run** `pnpm test && pnpm typecheck`.
- [ ] **Step 8: Commit** `fix(blocks): text clamps, 5-column grids, hook order, i18n strings`

---

### Task 7: CMS panel UX for inexperienced editors

**Files:**
- Modify: `sanity/schemas/blocks/grid/grid-card.ts`, `sanity/schemas/blocks/hero/hero-1.ts`, `sanity/schemas/blocks/grid/grid-row.ts`, the shared `link` object schema (find it: `sanity/schemas/objects/link.ts` or similar — grep `name: 'link'` under sanity/schemas)
- Reference for good patterns: `sanity/schemas/blocks/team-grid.ts` (radio modes, conditional hidden, validation messages)

- [ ] **Step 1: grid-card.ts** — add `description` to every field (e.g. image: "Card image. Drag the hotspot to keep the important part visible when cropped."; title: "Keep under ~60 characters — long titles are trimmed to 2 lines."; excerpt: "Short summary, shown up to 3 lines.").
- [ ] **Step 2: hero-1.ts** — add titles + descriptions to `tagLine/title/body` fields (lines 16-27) and the image field ("Shown at half width on desktop; enable the hotspot to control cropping.").
- [ ] **Step 3: link schema** — add descriptions (`title`: "Button text. Required — buttons render empty without it." with a `validation: Rule => Rule.warning()` when missing; `href`: "Full URL (https://…) or internal path starting with /").
- [ ] **Step 4: grid-row.ts** — `gridColumns` description: "How many cards per row on desktop. Note: the 'Wide (16:9)' card style always shows max 2 per row."; `cardVariant` description explaining the override explicitly.
- [ ] **Step 5: Load check** — run `pnpm typecheck`. (Full Studio boot is optional; schema changes are type-checked.)
- [ ] **Step 6: Commit** `feat(studio): field descriptions and clearer labels for non-technical editors`

---

### Task 8: Onboarding — metadata unification, progress persistence, username check

**Files:**
- Create: `lib/onboarding-status.ts` (single source of truth for reading completion)
- Modify: `proxy.ts:91-100`, `app/[locale]/onboarding/layout.tsx:13-24`, `app/api/onboarding/status/route.ts:26`
- Modify: `components/onboarding/modern-onboarding-container.tsx` (persist step + values)
- Modify: `components/onboarding/panels/basic-info-panel.tsx` (username availability)
- Delete: `app/[locale]/onboarding/_actions.ts`, `lib/actions/onboarding.ts` (verify zero imports first with grep)
- Test: `lib/__tests__/onboarding-status.test.ts`

**Background (verified):** Review-before-submit ALREADY exists (`review-panel.tsx:388-394` confirmation checkbox gating submit) — verify it renders, don't rebuild it. Bugs: 4 different Clerk metadata keys are written/read across 5 files (`onboardingCompleted` vs `onboardingComplete`, `publicMetadata` vs `metadata` claim); progress is lost on refresh (`currentStep` is plain useState, no persistence); `/api/username/check` exists but nothing calls it, so a taken username only errors at final submit.

- [ ] **Step 1: Failing tests** `lib/__tests__/onboarding-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isOnboardingComplete } from '@/lib/onboarding-status'

describe('isOnboardingComplete', () => {
  it('reads publicMetadata.onboardingCompleted', () => {
    expect(isOnboardingComplete({ publicMetadata: { onboardingCompleted: true } })).toBe(true)
  })
  it('reads legacy metadata.onboardingComplete', () => {
    expect(isOnboardingComplete({ metadata: { onboardingComplete: true } })).toBe(true)
  })
  it('false when absent', () => {
    expect(isOnboardingComplete({})).toBe(false)
    expect(isOnboardingComplete(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Implement `lib/onboarding-status.ts`**

```ts
type ClaimsLike = Record<string, any> | null | undefined

/** Single source of truth for "has this user finished onboarding".
 *  Checks every key variant that has historically been written. */
export function isOnboardingComplete(claims: ClaimsLike): boolean {
  if (!claims) return false
  return Boolean(
    claims.publicMetadata?.onboardingCompleted ??
    claims.publicMetadata?.onboardingComplete ??
    claims.metadata?.onboardingCompleted ??
    claims.metadata?.onboardingComplete ??
    false
  )
}
```

- [ ] **Step 3: Replace all reads** — `proxy.ts:96`, `onboarding/layout.tsx:20`, `status/route.ts:26` → `isOnboardingComplete(sessionClaims)`. Writes stay `publicMetadata.onboardingCompleted` (current complete/waive routes already do this).

- [ ] **Step 4: Persist progress in `modern-onboarding-container.tsx`** — on step change and on form value change (debounced ~500ms via `form.watch`), write `{ step, values }` to `sessionStorage['onboarding-progress']`; on mount, if present, `form.reset(values)` and restore step (guard with try/catch and schema-shape check; clear the key on successful submit).

- [ ] **Step 5: Username availability** — read `app/api/username/check/route.ts` for its request/response shape, then in `basic-info-panel.tsx` add a debounced (500ms) check on username change showing inline available/taken feedback (don't block typing; just show state and set a form error when taken).

- [ ] **Step 6: Delete dead code** — `grep -r "_actions" app/ components/ lib/` and `grep -rn "lib/actions/onboarding" --include="*.ts*"` to confirm unused, then delete `app/[locale]/onboarding/_actions.ts` and `lib/actions/onboarding.ts`.

- [ ] **Step 7: Run** `pnpm test && pnpm typecheck`.
- [ ] **Step 8: Commit** `fix(onboarding): unified completion check, progress persistence, live username availability`

---

### Task 9: Homepage blocks pull content dynamically (regional-communities pattern)

**Files:**
- Modify: `sanity/schemas/documents/homepage.ts` (add mode config to news + case-study-capable grid sections)
- Create: `sanity/queries/homepage-dynamic.ts` (global recent/featured news + case studies queries)
- Modify: `sanity/queries/homepage.ts` (project the new mode fields)
- Modify: `components/pages/homepage.tsx` (server-side fetch + synthesize grid-row blocks)
- Reference pattern: `components/templates/regional-community-template.tsx:104-179` (fetch + featured-fallback) and `:226-317` (synthesize `_type:'grid-row'` blocks); query style: `sanity/queries/regional-community-news.ts`

**Background:** The homepage (`components/pages/homepage.tsx:24-120`) hard-codes 11 manually-curated sections; the "Latest News" grid-row goes stale unless an editor swaps references. Regional community pages already solve this: a config object (`mode: manual | dynamic-featured | dynamic-recent`, `maxItems`) + server-side GROQ fetch + synthesizing `grid-row` blocks rendered through the same `<Blocks>` dispatcher. DO NOT use the client-side `/api/dynamic-content` contentFlow path (loading skeletons/layout shift).

- [ ] **Step 1: Schema** — in `homepage.ts`, for the `news` section (and `agendasModule` if structurally identical — read the schema first), add:

```ts
defineField({
  name: 'mode',
  title: 'Content Mode',
  type: 'string',
  options: { list: [
    { title: 'Manual — hand-pick items', value: 'manual' },
    { title: 'Dynamic — most recent', value: 'dynamic-recent' },
    { title: 'Dynamic — featured first, fill with recent', value: 'dynamic-featured' },
  ], layout: 'radio' },
  initialValue: 'manual',
  description: 'Dynamic modes keep this section automatically up to date.',
}),
defineField({
  name: 'maxItems',
  title: 'Max items (dynamic modes)',
  type: 'number',
  initialValue: 3,
  hidden: ({ parent }) => parent?.mode === 'manual',
  validation: (Rule) => Rule.min(1).max(12),
}),
```

(Adapt to the homepage schema's existing inline-object structure; the news section is one of the GridRow-shaped objects at lines 53-130.)

- [ ] **Step 2: Queries** — `sanity/queries/homepage-dynamic.ts` with `RECENT_NEWS_QUERY` / `FEATURED_NEWS_QUERY` (and case-study equivalents), copying the projection shape from `sanity/queries/regional-community-news.ts` minus the community filter, ordered by `publishedAt desc`, `[0...$limit]`, language-filtered like the regional query if it does that.

- [ ] **Step 3: Projection** — add `mode` and `maxItems` to the homepage GROQ projection in `sanity/queries/homepage.ts` for the affected sections.

- [ ] **Step 4: Renderer** — in `components/pages/homepage.tsx` (server component): when `news.mode` is dynamic, fetch via the new queries (featured-with-recent-fallback exactly like regional-community-template.tsx:139-179), then synthesize the same grid-row block shape the template builds at :226-317 (e.g. columns of `_type: 'grid-news'` items) and render through the existing `<GridRow>`/`<Blocks>` path the homepage already uses for that section. Manual mode keeps current behavior.

- [ ] **Step 5: Typecheck + test run.** If schema typegen exists (`sanity.types.ts` is generated), regenerate if there's a script for it; otherwise add a narrow local type.
- [ ] **Step 6: Commit** `feat(homepage): dynamic content modes for news/agenda sections`

---

### Task 10: Final verification + honest report

- [ ] **Step 1:** `pnpm test` — all green (record counts).
- [ ] **Step 2:** `pnpm typecheck` — zero errors.
- [ ] **Step 3:** `pnpm build` — must complete (needs env; if env vars missing locally, record exactly which step failed and why).
- [ ] **Step 4:** Write the honest report (chat, not a file): what was fixed (with commits), what was found but NOT fixed, test coverage achieved vs. not (no E2E/Playwright; responsiveness verified statically not in-browser), and remaining recommendations (notifications for case-study status changes, per-community member counts, carousel-1 fixed heights, draft-system consolidation, GROQ-injection audit elsewhere, CI workflow for tests).

---

## Known-but-deferred issues (report, don't fix)

- No email notifications on case-study approval/rejection (Resend wired only to newsletter) — copy fixed in Task 4 instead.
- Two parallel case-study draft systems sharing one localStorage key; server drafts API effectively unreachable from the active form. Needs a product decision.
- `caseStudyDraft` documents readable via public client if dataset is public (`stores/case-study-store.ts:252-254`) — security review recommended.
- Email-conflict path in onboarding complete route silently deletes a conflicting user row (`app/api/onboarding/complete/route.ts:297-324`).
- Per-community member counts on collaborate are capped (20/carousel, 200 global) — true counts need per-community queries.
- carousel-1 fixed rem heights crop unpredictably.
- No CI for lint/typecheck/tests (only Sanity template validator).
