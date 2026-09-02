# Payload Migration — Phase 1: The Content Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route every Sanity read and write in the application through a backend-agnostic `lib/content/` layer, so that Phase 3 can swap the backend by changing one directory instead of 180 files.

**Architecture:** Sanity stays the backend throughout. Each domain gets a module in `lib/content/` exporting named async functions with types we own — no GROQ, no `sanity.types.ts`, no Sanity client in any signature. Exactly one directory, `lib/content/internal/`, knows Sanity exists. The phase ends with a test that fails if anything outside it imports Sanity, which is what makes "insulated" a verifiable claim rather than an aspiration.

**Tech Stack:** Next.js 16.2.6+, React 19, TypeScript 5.9, Vitest 4, next-intl 4, Sanity client v7.

**Spec:** `docs/superpowers/specs/2026-09-02-sanity-to-payload-migration-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-02-payload-phase-0-prerequisites.md` — all exit criteria met.

## Global Constraints

- **The site must be byte-identical at every commit.** This phase moves code; it changes no behaviour. Any rendered difference is a bug, not an improvement.
- **No Sanity types in any `lib/content/` public signature.** Not `sanity.types.ts` imports, not `SanityDocument`, not `PortableTextBlock` from `@portabletext/types` in exported types. Portable Text bodies are typed as `RichText` (see Task 1) so Phase 3 can redefine that one alias.
- **Preserve each call site's existing failure behaviour exactly.** A read that already
  degraded (had a `try/catch` returning an empty state) keeps degrading, via `safe()`. A read
  that threw **keeps throwing** — do not wrap it in `safe()` as a drive-by improvement.

  This resolves a contradiction in an earlier draft, which said "every read wraps in
  `safe()`" while also demanding the site be byte-identical. Those conflict for any call
  site that previously threw, and byte-identical wins — for a substantive reason, not just
  process purity. Silently converting a throw into an empty render turns a loud 500 into a
  page that renders a blank section and looks fine. That is *worse* than the outage it
  imitates fixing: nobody notices the content is gone.

  Where a throwing read arguably *should* degrade, list it in the task report. Converting it
  is a deliberate resilience change and gets its own commit after Phase 1, where it can be
  reviewed as the behaviour change it is.

  Writes always throw — a failed submission must not silently succeed.
- **Never run `sanity typegen generate`.** It renames exported types and breaks `tsc`.
- **`pnpm lint` is not a gate** (~656 pre-existing errors). Lint only changed files: `pnpm exec eslint <paths>`.
- **`pnpm typecheck` and `pnpm test` are gates** and must be green before every commit.
- **Never include Claude/AI attribution in commit messages** (`CLAUDE.md`).
- **Locales are `en` (default), `es`, `fr`, `ar` (RTL).**

## Starting inventory

Re-measured 2026-09-02 after Phase 0, by matching **import statements** rather than call
expressions. The original figure in this plan counted only files calling `cachedFetch` /
`client.fetch` and undercounted the real surface by roughly a third.

| | Count |
|---|---|
| **Files importing Sanity outside the seam** | **128** |
| — of those, importing the image builder (`urlFor`) | 30 |
| — importing generated types from `sanity.types.ts` | 28 |
| — importing the client / fetch layer | 15 |
| — Studio, draft-mode and Presentation plumbing | 11 |
| Named fetch helpers left in `sanity/lib/fetch.ts` | 27 (verified: all 27 are claimed by Tasks 3–10, none orphaned) |
| Write paths (submissions, uploads, moderation) | 16 |

**Tasks 3–10 cover reads and writes only.** The image builder and the generated types are
separate surfaces, and they must be insulated too — otherwise Phase 3's backend swap still
has to touch 30 image call sites and 28 typed components, which defeats the point. Tasks
10a and 10b cover them. Run the coverage check in Task 11 Step 0 before starting Task 11:
it fails loudly if any file remains unclaimed.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/content/types.ts` | Shared content types owned by us — `Locale`, `Localized`, `RichText`, `ContentImage`, `ContentFile`, `ContentTag`, `ContentRegion`, `ContentKind`, `SearchRecord` |
| `lib/content/internal/safe.ts` | `safe()` — degrade-on-failure wrapper for reads |
| `lib/content/internal/sanity-source.ts` | **The only file that imports the Sanity client.** Phase 3 adds `payload-source.ts` beside it |
| `lib/content/lived-experiences.ts` | Lived-experience reads and writes |
| `lib/content/case-studies.ts` | Case-study reads and writes |
| `lib/content/news.ts` | News posts |
| `lib/content/outputs.ts` | Agendas and research outputs |
| `lib/content/pages.ts` | Pages, regional community pages, homepage |
| `lib/content/regions.ts` | Regional communities, map data, region art |
| `lib/content/onboarding.ts` | Onboarding content, profile prompts |
| `lib/content/taxonomy.ts` | Tags, work types, expertise areas, authors, organizations |
| `lib/content/discovery.ts` | Cross-type discovery, dynamic queries, follows |
| `lib/content/system.ts` | Sitemap feeds, search sync, site announcement, illustrations, docs chapters |
| `lib/__tests__/content-layer-boundary.test.ts` | Fails if anything outside `lib/content/internal/` imports Sanity |

---

### Task 1: Content layer foundation

**Files:**
- Create: `lib/content/types.ts`
- Create: `lib/content/internal/safe.ts`
- Create: `lib/content/internal/sanity-source.ts`
- Test: `lib/__tests__/content-safe.test.ts`

**Interfaces:**
- Consumes: `cachedFetch` from `@/sanity/lib/cached-fetch`.
- Produces — every later task depends on these exact names:
  - `type Locale = "en" | "es" | "fr" | "ar"`
  - `type Localized<T = string> = Partial<Record<Locale, T>>`
  - `type RichText = unknown[]` (Portable Text today; Lexical in Phase 3)
  - `interface ContentImage { url: string; alt?: string; caption?: string }`
  - `interface ContentTag { id: string; label: Localized; value?: string; color?: string }`
  - `interface ContentRegion { id: string; name: Localized; slug: string }`
  - `interface ContentFile { url: string; filename: string; bytes?: number }`
  - `type ContentKind = "caseStudy" | "livedExperience" | "researchOutput" | "newsPost" | "agenda" | "event"`
  - `interface SearchRecord { objectID: string; kind: ContentKind; title: string; excerpt?: string; url: string; locale: Locale }`
  - `safe<T>(label: string, fallback: T, fn: () => Promise<T>): Promise<T>`
  - `query<T>(groq: string, params?: Record<string, unknown>): Promise<T>`
  - `queryPreviewable<T>(groq: string, params?: Record<string, unknown>): Promise<T>`

**Three read primitives, and picking the wrong one is this phase's most repeated defect.**
It has caused four separate real bugs so far, none of which `tsc`, the test suite, or a
rendered check would catch:

| Primitive | Perspective | Cache | Use when the original called… |
|---|---|---|---|
| `query` | forced `published` | 1-hour revalidate | `client.fetch`, or `cachedFetch`/`sanityFetch` **with** an explicit `perspective` |
| `queryPreviewable` | omits `perspective`/`stega`, so `cachedFetch` consults `draftMode()` | 1-hour when not previewing | `sanityFetch`/`cachedFetch` **without** `perspective`/`stega` |
| `queryRaw` | `raw`, authenticated | none | `writeClient.fetch`, or any read feeding a write |

`sanity/lib/cached-fetch.ts` only consults `draftMode()` when **both** `perspective` and
`stega` are absent. Passing them — as `query` always does — pins the read to published
forever. Thirteen of the original helpers omitted them, which is what made editors in the
Presentation tool see their own drafts. Converting those to `query` silently ends draft
preview for pages, regional community pages, the homepage, and the moderation dashboards.

**Do not reach for `queryPreviewable` everywhere.** `draftMode()` is a Next dynamic API;
calling it on a statically-rendered route throws `draftMode was called outside a request
scope`. That is precisely why the seam's default forces `published`. Use it only where the
original omitted the fields.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/content-safe.test.ts`:

```ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { safe } from "@/lib/content/internal/safe";

afterEach(() => vi.restoreAllMocks());

describe("safe", () => {
  it("returns the resolved value when the fetch succeeds", async () => {
    await expect(safe("demo", [], async () => [1, 2])).resolves.toEqual([1, 2]);
  });

  it("returns the fallback when the fetch throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      safe("demo", [], async () => {
        throw new Error("upstream 402");
      }),
    ).resolves.toEqual([]);
  });

  it("logs the label and the error so outages are diagnosable", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const boom = new Error("upstream 402");
    await safe("lived-experiences", null, async () => {
      throw boom;
    });
    expect(spy).toHaveBeenCalledWith("[content:lived-experiences]", boom);
  });

  it("preserves the fallback's type, including null", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      safe("demo", null, async () => {
        throw new Error("x");
      }),
    ).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/content-safe.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/content/internal/safe"`.

- [ ] **Step 3: Write the shared types**

Create `lib/content/types.ts`:

```ts
/**
 * Content types owned by the application, not by the CMS.
 *
 * Nothing here imports from sanity.types.ts or @sanity/*. That is the point:
 * when the backend changes in Phase 3, these definitions stay put and only
 * lib/content/internal/ is rewritten.
 */

export type Locale = "en" | "es" | "fr" | "ar";

export const LOCALES: readonly Locale[] = ["en", "es", "fr", "ar"] as const;
export const DEFAULT_LOCALE: Locale = "en";

/** A value translated into some subset of the supported locales. */
export type Localized<T = string> = Partial<Record<Locale, T>>;

/**
 * A rich-text body. Portable Text today, Lexical after Phase 3 — callers must
 * treat it as opaque and hand it to a renderer rather than walking it.
 */
export type RichText = unknown[];

export interface ContentImage {
  url: string;
  alt?: string;
  caption?: string;
}

export interface ContentTag {
  id: string;
  label: Localized;
  value?: string;
  color?: string;
}

export interface ContentRegion {
  id: string;
  name: Localized;
  slug: string;
}

export interface ContentFile {
  url: string;
  filename: string;
  bytes?: number;
}

/** Every content type the app indexes, links to, or comments on. */
export type ContentKind =
  | "caseStudy"
  | "livedExperience"
  | "researchOutput"
  | "newsPost"
  | "agenda"
  | "event";

/** One Algolia record. Each domain module produces these for its own kind. */
export interface SearchRecord {
  objectID: string;
  kind: ContentKind;
  title: string;
  excerpt?: string;
  url: string;
  locale: Locale;
}

/** Resolve a localized value, falling back to English then to any present value. */
export function localize(value: Localized | string | undefined, locale: Locale): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  return value[locale] ?? value[DEFAULT_LOCALE] ?? Object.values(value)[0] ?? "";
}
```

- [ ] **Step 4: Write the degradation wrapper**

Create `lib/content/internal/safe.ts`:

```ts
/**
 * Wrap a content read so an upstream failure degrades to an empty state
 * instead of taking the page down.
 *
 * The 2026-07-28 quota outage (Sanity returning 402 plan_limit_reached) took
 * out every content page at once because reads threw. Reads degrade; writes
 * do not — a submission that silently fails is worse than one that errors.
 */
export async function safe<T>(
  label: string,
  fallback: T,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[content:${label}]`, error);
    return fallback;
  }
}
```

- [ ] **Step 5: Write the Sanity source**

Create `lib/content/internal/sanity-source.ts`:

```ts
/**
 * The single seam between the content layer and Sanity.
 *
 * This is the ONLY file under lib/content/ permitted to import from @/sanity
 * or @sanity/*; lib/__tests__/content-layer-boundary.test.ts enforces that.
 * Phase 3 adds payload-source.ts beside this file and switches the domain
 * modules over one at a time.
 */
import { cachedFetch } from "@/sanity/lib/cached-fetch";

/**
 * Run a GROQ query. Callers pass a plain string rather than a `defineQuery`
 * literal: the generated result types are deliberately not used here, because
 * lib/content/ types its own returns and must not depend on sanity.types.ts.
 */
export async function query<T>(
  groq: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await cachedFetch({
    query: groq as never,
    params,
    perspective: "published",
    stega: false,
  });
  return data as T;
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/content-safe.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Verify types**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add lib/content/types.ts lib/content/internal/ lib/__tests__/content-safe.test.ts
git commit -m "feat(content): foundation for the backend-agnostic content layer

Shared content types owned by the app rather than the CMS, a degrade-on-
failure wrapper for reads, and a single Sanity seam in
lib/content/internal/sanity-source.ts.

Reads degrade to empty rather than throwing: the July quota outage took
every content page down at once because they threw. Writes still throw."
```

---

### Task 2: Lived experiences — the worked exemplar

Tasks 3–10 repeat this shape. Read this one first.

**Files:**
- Create: `lib/content/lived-experiences.ts`
- Modify: `app/[locale]/(main)/lived-experiences/page.tsx:1-70`
- Modify: `components/blocks/carousel/lived-experiences-carousel-block.tsx`
- Modify: `app/[locale]/(main)/lived-experiences/submit/page.tsx`
- Modify: `lib/lived-experiences/edit.ts`
- Modify: `app/api/lived-experiences/submit/route.ts`
- Test: `lib/__tests__/content-lived-experiences.test.ts`

**Interfaces:**
- Consumes: `safe`, `query` (Task 1); `Localized`, `ContentTag`, `ContentRegion`, `Locale` from `@/lib/content/types`.
- Also produces, for every later task: `toTag()` and `toRegion()` live in
  `lib/content/internal/normalize.ts`, not in this module. They map a raw reference
  projection onto `ContentTag` / `ContentRegion` and would otherwise be re-typed near-verbatim
  in most of the remaining eight domains.
- Produces:
  - `interface LivedExperience { id: string; title: Localized | string; format?: "video" | "audio" | "written"; videoUrl?: string; thumbnailUrl?: string; tags: ContentTag[]; region: ContentRegion | null; rawRegion?: unknown }`
  - `interface LivedExperienceIndex { videos: LivedExperience[]; regionalCommunities: ContentRegion[]; allTags: ContentTag[] }`
  - `getLivedExperienceIndex(): Promise<LivedExperienceIndex>`
  - `getLivedExperiencesByRegion(regionSlug: string): Promise<LivedExperience[]>`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/content-lived-experiences.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/content/internal/sanity-source", () => ({
  query: vi.fn(),
}));

import { query } from "@/lib/content/internal/sanity-source";
import { getLivedExperienceIndex } from "@/lib/content/lived-experiences";

const mockQuery = vi.mocked(query);

beforeEach(() => mockQuery.mockReset());
afterEach(() => vi.restoreAllMocks());

describe("getLivedExperienceIndex", () => {
  it("returns videos, regional communities and tags from the source", async () => {
    mockQuery.mockResolvedValue({
      videos: [{ _id: "v1", title: { en: "A story" }, tags: [], region: null }],
      regionalCommunities: [{ _id: "r1", name: { en: "Oceania" }, slug: "oceania" }],
      allTags: [{ _id: "t1", label: { en: "Anxiety" }, value: "anxiety" }],
    });

    const result = await getLivedExperienceIndex();

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].id).toBe("v1");
    expect(result.regionalCommunities[0].slug).toBe("oceania");
    expect(result.allTags[0].value).toBe("anxiety");
  });

  it("degrades to an empty index when the source fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockRejectedValue(new Error("402 plan_limit_reached"));

    await expect(getLivedExperienceIndex()).resolves.toEqual({
      videos: [],
      regionalCommunities: [],
      allTags: [],
    });
  });

  it("degrades when the source returns null rather than an object", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockQuery.mockResolvedValue(null);

    const result = await getLivedExperienceIndex();
    expect(result.videos).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/content-lived-experiences.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/content/lived-experiences"`.

- [ ] **Step 3: Write the domain module**

Create `lib/content/lived-experiences.ts`. The GROQ is moved verbatim from
`app/[locale]/(main)/lived-experiences/page.tsx:31-56` — do not rewrite it, or the page
stops being byte-identical:

```ts
import { safe } from "@/lib/content/internal/safe";
import { query } from "@/lib/content/internal/sanity-source";
import type { ContentRegion, ContentTag, Localized } from "@/lib/content/types";

export interface LivedExperience {
  id: string;
  title?: Localized | string;
  format?: "video" | "audio" | "written";
  videoUrl?: string;
  thumbnailUrl?: string;
  tags: ContentTag[];
  region: ContentRegion | null;
  /** Legacy docs stored region as a bare short code, so `region->` is null. */
  rawRegion?: unknown;
}

export interface LivedExperienceIndex {
  videos: LivedExperience[];
  regionalCommunities: ContentRegion[];
  allTags: ContentTag[];
}

const EMPTY_INDEX: LivedExperienceIndex = {
  videos: [],
  regionalCommunities: [],
  allTags: [],
};

const INDEX_QUERY = `{
    "videos": *[_type == "livedExperience" && (status == "approved" || !defined(status))] | order(_createdAt desc) {
      _id,
      title,
      format,
      videoUrl,
      tags[]->{ _id, label, value, color },
      "thumbnailUrl": thumbnail.asset->url,
      "region": region->{
        _id,
        name,
        "slug": slug.current
      },
      "rawRegion": region
    },
    "regionalCommunities": *[_type == "regionalCommunity"] | order(order asc, name asc) {
      _id,
      name,
      "slug": slug.current
    },
    "allTags": *[_type == "tag" && count(*[_type == "livedExperience" && references(^._id)]) > 0]
      | order(label.en asc) { _id, label, value, color }
  }`;

interface RawTag {
  _id: string;
  label?: Localized;
  value?: string;
  color?: string;
}
interface RawRegion {
  _id: string;
  name?: Localized;
  slug?: string;
}

const toTag = (t: RawTag): ContentTag => ({
  id: t._id,
  label: t.label ?? {},
  value: t.value,
  color: t.color,
});

const toRegion = (r: RawRegion): ContentRegion => ({
  id: r._id,
  name: r.name ?? {},
  slug: r.slug ?? "",
});

export async function getLivedExperienceIndex(): Promise<LivedExperienceIndex> {
  return safe("lived-experiences", EMPTY_INDEX, async () => {
    const raw = await query<{
      videos?: Array<Record<string, unknown>>;
      regionalCommunities?: RawRegion[];
      allTags?: RawTag[];
    } | null>(INDEX_QUERY);

    if (!raw) return EMPTY_INDEX;

    return {
      videos: (raw.videos ?? []).map((v) => ({
        id: v._id as string,
        title: v.title as Localized | string | undefined,
        format: v.format as LivedExperience["format"],
        videoUrl: v.videoUrl as string | undefined,
        thumbnailUrl: v.thumbnailUrl as string | undefined,
        tags: ((v.tags as RawTag[] | undefined) ?? []).map(toTag),
        region: v.region ? toRegion(v.region as RawRegion) : null,
        rawRegion: v.rawRegion,
      })),
      regionalCommunities: (raw.regionalCommunities ?? []).map(toRegion),
      allTags: (raw.allTags ?? []).map(toTag),
    };
  });
}

export async function getLivedExperiencesByRegion(
  regionSlug: string,
): Promise<LivedExperience[]> {
  const { videos } = await getLivedExperienceIndex();
  return videos.filter((v) => v.region?.slug === regionSlug);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/content-lived-experiences.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Convert the page to use the module**

In `app/[locale]/(main)/lived-experiences/page.tsx`, delete the `client` import, the two
local interfaces, the inline GROQ and the whole `fetchLivedExperiences` function
(lines 1–70), replacing them with:

```ts
import { getLivedExperienceIndex } from "@/lib/content/lived-experiences";
import type { LivedExperience, LivedExperienceIndex } from "@/lib/content/lived-experiences";
```

Then replace the call site `await fetchLivedExperiences()` with
`await getLivedExperienceIndex()`. If `page-client.tsx` imports the old local interfaces,
repoint those imports at `@/lib/content/lived-experiences`.

- [ ] **Step 6: Convert the remaining lived-experience call sites**

Repeat for each, moving its query into `lib/content/lived-experiences.ts` as a new
exported function and adding a test for it in the same style as Step 1:

- `components/blocks/carousel/lived-experiences-carousel-block.tsx`
- `app/[locale]/(main)/lived-experiences/submit/page.tsx`
- `lib/lived-experiences/edit.ts` — **a write path.** Writes throw, so wrap in nothing;
  export as `updateLivedExperience(...)` from the same module.
- `app/api/lived-experiences/submit/route.ts` — write path; export as
  `submitLivedExperience(...)`.

- [ ] **Step 7: Verify no lived-experience file still imports Sanity**

```bash
grep -rn "@/sanity\|@sanity/" \
  "app/[locale]/(main)/lived-experiences" \
  components/blocks/carousel/lived-experiences-carousel-block.tsx \
  lib/lived-experiences/ app/api/lived-experiences/
```

Expected: no output.

- [ ] **Step 8: Verify types and the full suite**

```bash
pnpm typecheck
pnpm test
pnpm exec eslint lib/content "app/[locale]/(main)/lived-experiences" lib/lived-experiences app/api/lived-experiences
```

Expected: clean, green.

- [ ] **Step 9: Verify the rendered page is unchanged**

Run `pnpm dev` and load `/en/lived-experiences`. Confirm against the pre-change page:
the same number of cards in the same order, tag filter chips populate, region grouping is
intact, and legacy short-code regions still appear. Then load `/ar/lived-experiences` and
confirm RTL layout is unaffected.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor(content): route lived experiences through lib/content

First domain moved behind the backend-agnostic content layer. The GROQ
moves verbatim so rendering is unchanged; the page keeps its degrade-to-
empty behaviour, now via safe() rather than a local try/catch.

No lived-experience file imports Sanity any more."
```

---

### Tasks 3–10: the remaining domains

Each follows Task 2 exactly: write the failing test, create `lib/content/<domain>.ts`,
move each query verbatim, convert the call sites, prove no file in the domain imports
Sanity, verify `typecheck` + `test` + a rendered check, commit.

**"Verbatim" means character-exact, including comments.** Task 2's review character-checked
all eight moved queries; the only deviations were two dropped GROQ comments, and those came
from an example in this plan rather than from the implementer. GROQ comments explain why a
projection is shaped the way it is — `rawRegion` exists because legacy documents stored a
bare short code — and that reasoning is exactly what a later reader needs. Move the comments
with the query.

**Reuse `toTag` / `toRegion` from `lib/content/internal/normalize.ts`.** Do not re-declare
them per domain.

Every task below lists its exact file inventory and the exact function signatures it must
produce. Together they partition all 43 direct callers and the 27 remaining
`sanity/lib/fetch.ts` helpers with no overlap and nothing left over.

---

### Task 3: Case studies

**Files:**
- Create: `lib/content/case-studies.ts`
- Modify: `app/[locale]/(main)/research-and-action/case-studies/page.tsx`, `.../case-studies/submit/page.tsx`, `.../case-studies/[slug]/page.tsx`
- Modify: `app/api/case-studies/submit/route.ts`, `app/api/case-studies/drafts/route.ts`, `app/api/case-studies/revisions/route.ts`
- Modify: `lib/case-studies/edit.ts`, `lib/case-study-emails.ts`
- Modify: `sanity/lib/fetch.ts` — move these 11 helpers out: `fetchCaseStudyBySlug`, `fetchApprovedCaseStudies`, `fetchApprovedCaseStudiesByLocale`, `fetchFeaturedCaseStudies`, `fetchCaseStudiesStaticParams`, `fetchCaseStudiesByUser`, `fetchUserSubmissionsAndDrafts`, `fetchCaseStudiesByStatus`, `fetchCaseStudyTranslations`, `fetchApprovedCaseStudiesByRC`, `searchCaseStudies`
- Test: `lib/__tests__/content-case-studies.test.ts`

**Interfaces:**
- Consumes: Task 1 foundation.
- Produces: `getCaseStudyBySlug(slug: string): Promise<CaseStudy | null>`, `getApprovedCaseStudies(locale?: Locale): Promise<CaseStudy[]>`, `getFeaturedCaseStudies(): Promise<CaseStudy[]>`, `getCaseStudySlugs(): Promise<string[]>`, `getCaseStudiesByUser(userId: string): Promise<CaseStudy[]>`, `getCaseStudiesByStatus(status: CaseStudyStatus): Promise<CaseStudy[]>`, `getCaseStudiesByRegion(rcSlug: string): Promise<CaseStudy[]>`, `searchCaseStudies(term: string): Promise<CaseStudy[]>`, `submitCaseStudy(input: CaseStudyInput): Promise<{ id: string }>`, `updateCaseStudy(id: string, patch: Partial<CaseStudyInput>): Promise<void>`, `getCaseStudySearchRecords(): Promise<SearchRecord[]>`.
- `type CaseStudyStatus = "pending" | "rejected" | "revision" | "approved"`.
- `CaseStudy.content` is typed `RichText`, never `PortableTextBlock[]`.

**Rendered check:** `/en/research-and-action/case-studies` (list, filters, pagination), one detail page, and the submit form's draft-save round trip.

---

### Task 4: News

**Files:**
- Create: `lib/content/news.ts`
- Modify: `app/[locale]/(main)/news/[slug]/page.tsx`, `app/[locale]/(main)/news/page.tsx`
- Modify: `lib/news-feed.ts`
- Modify: `app/api/search/news/sync/route.ts`, `app/api/search/news/webhook/route.ts`
- Modify: `sanity/lib/fetch.ts` — move `fetchDynamicNews` out
- Test: `lib/__tests__/content-news.test.ts`

**Interfaces:**
- Produces: `getNewsPosts(locale?: Locale): Promise<NewsPost[]>`, `getNewsPostBySlug(slug: string): Promise<NewsPost | null>`, `getNewsSlugs(): Promise<string[]>`, `getNewsSearchRecords(): Promise<SearchRecord[]>`.

**Rendered check:** `/en/news`, one detail page, and its `og.png` route.

---

### Task 5: Agendas and research outputs

**Files:**
- Create: `lib/content/outputs.ts`
- Modify: `app/[locale]/(main)/research-and-action/research-outputs/submit/page.tsx`
- Modify: `app/api/research-outputs/submit/route.ts`, `lib/research-outputs/edit.ts`
- Modify: `app/api/agendas/download/track/route.ts`, `app/api/reports/download/track/route.ts`
- Modify: `app/api/search/agendas/sync/route.ts`, `app/api/search/agendas/webhook/route.ts`
- Modify: `sanity/lib/fetch.ts` — move `fetchRegionalCommunityAgendas` out
- Test: `lib/__tests__/content-outputs.test.ts`

**Interfaces:**
- Produces: `getAgendas(locale?: Locale): Promise<Agenda[]>`, `getAgendasByRegion(rcSlug: string): Promise<Agenda[]>`, `getAgendaBySlug(slug: string): Promise<Agenda | null>`, `getResearchOutputs(locale?: Locale): Promise<ResearchOutput[]>`, `getResearchOutputBySlug(slug: string): Promise<ResearchOutput | null>`, `submitResearchOutput(input: ResearchOutputInput): Promise<{ id: string }>`, `updateResearchOutput(id: string, patch: Partial<ResearchOutputInput>): Promise<void>`, `getAgendaSearchRecords(): Promise<SearchRecord[]>`, `getResearchOutputSearchRecords(): Promise<SearchRecord[]>`.
- `Agenda.files` is `ContentFile[]`, defined in `lib/content/types.ts` (Task 1). The 42 agenda file attachments depend on it.

**Rendered check:** the agendas listing, one agenda detail page with a working PDF download, and the research-output submit form.

---

### Task 6: Pages, regional community pages and homepage

The largest task. Also the one whose output Phase 2 remodels, so keep the returned shapes close to the rendered props rather than to the Sanity documents.

**Files:**
- Create: `lib/content/pages.ts`
- Modify: `app/[locale]/(main)/[slug]/page.tsx`, `app/[locale]/(main)/communities/[slug]/page.tsx`, `app/[locale]/page.tsx`
- Modify: `components/regions/region-hero.tsx`, `components/templates/regional-community-template.tsx`
- Modify: `sanity/lib/fetch.ts` — move these 10 helpers out: `fetchSanityPageBySlug`, `fetchSanityRCPageBySlug`, `fetchSanityRCPagesStaticParams`, `fetchSanityPagesStaticParams`, `fetchTranslationsForPage`, `fetchHomepageBySlug`, `fetchIndexHomepage`, `fetchTranslationsForHomepage`, `fetchSanityHomepageBySlug`, `fetchSanityHomepageStaticParams`
- Test: `lib/__tests__/content-pages.test.ts`

**Interfaces:**
- Produces: `getPageBySlug(slug: string, locale: Locale): Promise<Page | null>`, `getPageSlugs(): Promise<Array<{ slug: string; locale: Locale }>>`, `getRegionalCommunityPage(slug: string, locale: Locale): Promise<RegionalCommunityPage | null>`, `getRegionalCommunityPageSlugs(): Promise<Array<{ slug: string; locale: Locale }>>`, `getHomepage(locale: Locale): Promise<Homepage | null>`.
- `interface Page { id: string; slug: string; locale: Locale; title: string; blocks: ContentBlock[]; seo: { metaTitle?: string; metaDescription?: string; noindex?: boolean } }`
- `type ContentBlock = { type: string; key: string } & Record<string, unknown>` — deliberately loose. Phase 2 narrows it to the 12 live block types once they are modelled in Payload.
- **`getHomepage` returns the homepage in its CURRENT fixed-slot shape.** Do not call `blocksFromFields` here.

  An earlier draft of this plan had it return a `blocks` array. That was wrong for this phase: `app/[locale]/(main)/page.tsx` renders `<Homepage homepage={homepage} />`, and `components/pages/homepage.tsx` reads the 11 named slots directly. Returning blocks would force that component to be rewritten — a behaviour change, which this phase's first Global Constraint forbids. It is also ahead of spec decision D9, which places the remodel in the **Phase 2 importer**, where `blocksFromFields` runs once over the data rather than on every render.

  Phase 1 moves code. Phase 2 remodels data. Keep them separate, or a rendering regression and a data regression become indistinguishable — the exact failure the insulate-then-swap sequencing exists to prevent.

**Rendered check:** `/en`, `/ar` (RTL), `/en/about`, `/en/communities/oceania`, and the language switcher on each — this task touches every localized route.

---

### Task 6b: The page-domain query files Task 6 could not reach

Task 6 converted the ten `sanity/lib/fetch.ts` helpers it owned, then found five more page-domain files importing Sanity that **no task brief claimed**. Its reviewer confirmed the gap: zero mentions across all 13 briefs, each file substantive (99–212 lines), and all five will fail Task 11's boundary gate.

This is the second coverage gap found in this plan, after the original inventory undercounted the Sanity surface by a third. Both were found by checking a coverage claim rather than trusting it.

**Files:**
- Modify: `lib/content/pages.ts` (extend — do not duplicate what Task 6 built)
- Modify: `app/[locale]/(main)/communities/[slug]/page.tsx` — imports `@/sanity/queries/regional-community-team`
- Modify: `components/pages/homepage.tsx` — imports `@/sanity/queries/homepage-dynamic`
- Modify: `components/templates/regional-community-template.tsx` — imports `regional-community-case-studies`, `regional-community-lived-experiences`, `regional-community-news`
- Delete once orphaned: the five `sanity/queries/regional-community-*.ts` / `homepage-dynamic.ts` files
- Test: extend `lib/__tests__/content-pages.test.ts`

**Interfaces:**
- Consumes: everything Task 6 established in `lib/content/pages.ts`.
- Produces: exported functions for each converted query, named for what they fetch — the regional community's team, its case studies, its lived experiences, its news, and the homepage's dynamic sections.

**Two cautions specific to this task.**

`components/pages/homepage.tsx` is the component the `getHomepage` ruling protects. Convert its *data fetching* only. Do not touch how it consumes the 11 fixed slots, and do not let a blocks-shaped refactor in through this door.

`components/templates/regional-community-template.tsx` was already partly converted by Task 5, which routed its agenda query through `lib/content/outputs.ts`. Read what is already there before adding to it.

Everything else follows the standing rules: GROQ character-exact including comments, the three-primitive table above for each read, preserve existing failure behaviour, writes throw.

---

### Task 7: Regions and maps

**Files:**
- Create: `lib/content/regions.ts`
- Modify: `app/api/maps/region-items/route.ts`, `app/api/maps/region-pins/route.ts`, `app/api/maps/region-data/route.ts`
- Modify: `lib/maps/region-art.ts`, `lib/maps/themes.ts`, `lib/maps/cluster-pins.ts`
- Modify: `components/atlas/region-content-cards.tsx`
- Test: `lib/__tests__/content-regions.test.ts`

**Interfaces:**
- Produces: `getRegionalCommunities(): Promise<ContentRegion[]>`, `getRegionItems(regionCode: string): Promise<RegionItem[]>`, `getRegionPins(): Promise<RegionPin[]>`, `getRegionArt(regionSlug: string): Promise<ContentImage | null>`.

**Rendered check:** `/en/atlas` — pins, clustering, region cards and the theme filters. Note the known gotcha: the `/atlas` page SSR fetch times out beyond 120s in local dev, so verify via the three API routes and the tests rather than a full-page render.

---

### Task 8: Onboarding and taxonomy

**Files:**
- Create: `lib/content/onboarding.ts`, `lib/content/taxonomy.ts`
- Modify: `app/[locale]/onboarding/page.tsx`, `app/api/onboarding/content/route.ts`
- Modify: `lib/utils/sanity-prisma-sync.ts`, `lib/actions/sync-user-management.ts`
- Modify: `sanity/lib/fetch.ts` — move `fetchActiveProfilePrompts` out
- Test: `lib/__tests__/content-onboarding.test.ts`, `lib/__tests__/content-taxonomy.test.ts`

**Interfaces:**
- `onboarding.ts` produces: `getOnboardingContent(locale: Locale): Promise<OnboardingContent | null>`, `getActiveProfilePrompts(): Promise<ProfilePrompt[]>`.
- `taxonomy.ts` produces: `getTags(): Promise<ContentTag[]>`, `getWorkTypes(): Promise<TaxonomyOption[]>`, `getExpertiseAreas(): Promise<TaxonomyOption[]>`, `getAuthors(): Promise<Author[]>`, `getAuthorBySanityId(id: string): Promise<Author | null>`, `getOrganizations(): Promise<Organization[]>`.
- `interface TaxonomyOption { id: string; label: Localized; value: string }`.
- `getAuthorBySanityId` keeps its name through Phase 3 because `User.sanityPersonId` in Prisma references it; renaming it is Phase 4 cleanup, not this phase's business.

**Rendered check:** the full onboarding flow in `en` and `ar`, including field hints and validation messages, which all come from `onboardingContent`.

---

### Task 9: Discovery, collaboration and events

**Files:**
- Create: `lib/content/discovery.ts`
- Modify: `lib/dynamic-queries.ts`, `lib/discovery/options.ts`, `lib/discovery/registry.ts`, `lib/follows/for-you.ts`
- Modify: `components/blocks/all-posts.tsx`
- Modify: `lib/collaboration/public.ts`, `lib/collaboration/service.ts`, `lib/actions/workspace-outputs.ts`
- Modify: `lib/comments/target.ts`, `lib/comments/moderation.ts`
- Modify: `lib/events.ts`, `lib/events/edit.ts`, `lib/actions/rsvp.ts`, `app/api/events/submit/route.ts`, `app/api/cron/event-reminders/route.ts`
- Modify: `sanity/lib/fetch.ts` — move `fetchDynamicCaseStudies`, `fetchDynamicLivedExperiences` out
- Test: `lib/__tests__/content-discovery.test.ts`

**Interfaces:**
- Produces: `getDynamicContent(kind: ContentKind, options: DynamicOptions): Promise<DiscoveryItem[]>`, `getDiscoveryOptions(): Promise<DiscoveryFacets>`, `resolveCommentTarget(type: CommentTargetType, id: string): Promise<CommentTarget | null>`, `getEvents(filter?: EventFilter): Promise<ContentEvent[]>`, `submitEvent(input: EventInput): Promise<{ id: string }>`, `updateEvent(id: string, patch: Partial<EventInput>): Promise<void>`.
- `ContentKind` comes from `lib/content/types.ts` (Task 1); this task does not redeclare it.
- `resolveCommentTarget` is the seam Prisma's polymorphic `Comment.targetId` reaches content through; its signature must not change in Phase 3.

**Rendered check:** the discovery/collaborate filters, a workspace publishing an output, and a comment thread on a case study.

---

### Task 10: System feeds

**Files:**
- Create: `lib/content/system.ts`
- Modify: `app/sitemap.ts`
- Modify: `app/api/webhooks/sanity/route.ts`, `app/api/cache/revalidate/route.ts`
- Modify: `app/api/search/case-studies/sync/route.ts`, `app/api/search/case-studies/webhook/route.ts`
- Modify: `lib/sanity/hub-illustrations.ts` → move to `lib/content/illustrations.ts`
- Modify: `lib/algolia.ts`, `lib/docs.ts`
- Modify: `sanity/lib/fetch.ts` — move `fetchSiteAnnouncement` out; the file should now be empty and is deleted
- **Modify (added mid-phase — orphaned files no other brief claimed):**
  `app/[locale]/(main)/reader/[[...slug]]/page.tsx` (imports `@/sanity/queries/docs-reader`),
  `app/api/communities/route.ts` (`@/sanity/queries/regional-communities`),
  `lib/cards/fresh-items.ts` and `lib/community/region-data.ts` (both import the client directly)
- **Delete:** `app/[locale]/(main)/not-page.tsx` — confirmed to have zero importers. Prove it with a grep before deleting.
- **Delete the entire `sanity/queries/` tree — all 46 files.**

  As of this task, 45 of the 46 already have zero importers anywhere in `app/`, `components/`
  or `lib/`; they survive only by importing each other. The single exception is
  `docs-reader.ts`, which this task converts. The only reference from outside the tree is
  `sanity/lib/fetch.ts` importing `SITE_ANNOUNCEMENT_QUERY` — also this task's, via
  `fetchSiteAnnouncement`.

  Verified: neither `sanity.config.ts`, `sanity/structure.ts`, `sanity/schema.ts` nor
  `sanity/presentation/resolve.ts` references the query tree. The Studio does not need it —
  GROQ queries are a frontend concern, and the Studio is driven by the schema.

  Do this **last**, after `fetch.ts` is deleted, and prove it: `pnpm typecheck` must stay
  clean and the full suite must stay green. If anything still imports the tree, that import
  is an unconverted call site — convert it rather than keeping the file.

A full-tree scan mid-phase found 30 files still importing the Sanity client or query
modules directly, and 10 of them were named in no brief. Five turned out to be consumers of
helpers Tasks 8 and 10 already own — those get fixed when their helper moves, and `tsc` will
find them. The five listed above had no owner at all. This is the third coverage gap in this
plan; all three were found by checking a coverage claim rather than trusting it.
- Test: `lib/__tests__/content-system.test.ts`

**Interfaces:**
- Produces: `getSiteAnnouncement(): Promise<SiteAnnouncement | null>`, `getSitemapEntries(): Promise<SitemapEntry[]>`, `getHubIllustrations(): Promise<Record<string, ContentImage>>`, `getDocsChapters(collection: string): Promise<DocsChapter[]>`, `getSearchIndexRecords(kind: ContentKind): Promise<SearchRecord[]>`.
- `getSearchIndexRecords` is a thin dispatcher: it switches on `kind` and delegates to the
  per-domain producers from Tasks 3, 4 and 5 (`getCaseStudySearchRecords`,
  `getNewsSearchRecords`, `getAgendaSearchRecords`, `getResearchOutputSearchRecords`). It
  must not contain queries of its own — each domain owns its own projection.

**Rendered check:** `/sitemap.xml` contains every expected URL and no `/blog/` entries; the announcement bar renders; `pnpm sync:search` completes and Algolia record counts match the pre-change counts.

- [ ] **Final step of Task 10: delete the old fetch layer**

```bash
git rm sanity/lib/fetch.ts
pnpm typecheck
```

Expected: clean. Any error names a call site Tasks 3–10 missed.

---

### Task 10a: Image URLs

`urlFor` returns a **chainable Sanity builder** — call sites do `urlFor(img).width(800).height(450).url()`. That builder API is Sanity-specific and cannot survive the swap, so it has to become a plain function before Phase 3, not during it.

**Files:**
- Create: `lib/content/images.ts`
- Modify: the 30 files importing `@/sanity/lib/image` (enumerate with the command below)
- Test: `lib/__tests__/content-images.test.ts`

Enumerate them with:

```bash
grep -rlE "from ['\"]@/sanity/lib/image" app components lib --include="*.ts" --include="*.tsx"
```

**Interfaces:**
- Consumes: `ContentImage` from `@/lib/content/types`; the existing `urlFor` / `urlForCropped` internally, via the seam.
- Produces:
  - `imageUrl(image: ContentImage | unknown, opts?: { width?: number; height?: number; crop?: boolean }): string`
  - Returns `""` for a null or unresolvable image rather than throwing — an image is never worth a 500.

Behaviour must match the current builders exactly, including their two special cases, both of which are load-bearing:
- **SVGs bypass the transform pipeline entirely** (they rasterize otherwise). `urlFor` returns the untouched builder when `asset.mimeType === "image/svg+xml"`.
- `imageUrl` without `crop` mirrors `urlFor`: `.format("webp").fit("max")`. With `crop` and both dimensions, it mirrors `urlForCropped`: `.width().height().fit("crop").auto("format")` — note `auto("format")` there versus forced `webp` in the uncropped path. Do not unify them; that difference is deliberate.

`lib/content/images.ts` imports the builder from the seam only. No `@sanity/image-url` type may appear in its exported signature.

**Rendered check:** a case-study card (cropped 800×450), a hero (uncropped), and an SVG partner logo in `logo-cloud-1`. Compare the generated URLs before and after — they must be identical strings.

---

### Task 10b: Generated types

28 files import from `sanity.types.ts`, a 15,156-line generated artifact that disappears when Sanity does. Every one must move to a type we own.

**Files:**
- Modify: the 28 files importing `@/sanity.types` (enumerate with the command below)
- Extend: `lib/content/types.ts` and the domain modules, as needed
- Test: extend `lib/__tests__/content-layer-boundary.test.ts`

Enumerate them with:

```bash
grep -rlE "from ['\"]@/sanity\.types" app components lib --include="*.ts" --include="*.tsx"
```

**Interfaces:**
- Consumes: everything Tasks 1–10 defined.
- Produces: no new runtime API. The deliverable is that no file outside the seam imports `sanity.types.ts`.

Most of these are block components typed against generated block types (`Hero1`, `SplitRow`, `GridRow`, …). Define the block prop types in the module that owns them — a block's props belong beside its renderer, not in `lib/content/types.ts`, which is for content shapes shared across domains.

Where a generated type is used only to type a prop the component immediately destructures, prefer a small local interface naming just the fields actually read. Do not transcribe generated types wholesale; that would recreate the coupling in a new location.

**Do not run `sanity typegen generate`.** `sanity.types.ts` stays on disk, untouched and unread, until Phase 4 deletes it.

**Rendered check:** every block type that carries data — `hero-1`, `split-row`, `cta-1`, `section-header`, `logo-cloud-1`, `grid-row`, `carousel-2` — on the homepage and one regional community page, in `en` and `ar`.

---

### Task 10c: The `next-sanity` display utilities

Sixteen files import from `next-sanity` directly — eleven use `stegaClean`, one uses `groq`, and the rest are Studio/draft plumbing already on the ALLOWED list. Task 11's boundary matcher includes `next-sanity`, so every one of these fails the gate today.

`stegaClean` strips Sanity's stega encoding — invisible metadata embedded in strings so the Presentation tool can offer click-to-edit. It is display-only, and once Sanity is gone there is no stega to strip, so it becomes the identity function. `groq` is a template-literal tag that exists purely for editor syntax highlighting and returns its input unchanged.

Neither is a content read, but both couple a component to the CMS for no structural reason. Wrapping them is the cheapest possible insulation and spares Phase 3 from touching eleven block components.

**Files:**
- Modify: `lib/content/internal/sanity-source.ts` — or a sibling `lib/content/text.ts`, your call; state which and why
- Modify: the eleven `stegaClean` importers — `components/blocks/section-header.tsx`, `all-posts.tsx`, `carousel/lived-experiences-carousel.tsx`, `carousel/carousel-1.tsx`, `split/split-row.tsx`, `cta/cta-1.tsx`, `hero/hero-2.tsx`, `hero/hero-1.tsx`, `events/events-calendar.tsx`, `grid/grid-row.tsx`, `grid/grid-card.tsx`
- Modify: the one `groq` importer (`app/sitemap.ts`)
- Test: `lib/__tests__/content-text.test.ts`

**Interfaces:**
- Produces: `cleanText(value: string | undefined | null): string` — delegates to `stegaClean` today; becomes the identity function in Phase 3. Handle `undefined`/`null` exactly as the current call sites do, which means checking each one rather than assuming.

**Do not change what any component renders.** This is an import swap. If a call site passes something other than a string — `stegaClean` accepts objects and cleans them recursively — do not silently narrow it; either widen `cleanText` to match or leave that call site and say why.

The `groq` tag can simply be deleted at its single call site: it returns its argument unchanged, so the template literal stands alone.

---

### Task 11: Enforce the boundary

This is what makes "insulated" verifiable, and it is the gate for starting Phase 2.

**Files:**
- Test: `lib/__tests__/content-layer-boundary.test.ts`

**Interfaces:**
- Consumes: the completed `lib/content/` directory.
- Produces: a failing test the moment anyone reintroduces a Sanity import outside the seam.

- [ ] **Step 0: Run the coverage check first**

Before writing the test, confirm every Sanity importer has actually been converted:

```bash
grep -rlE "(from|require\()\s*['\"][^'\"]*(@/sanity|@sanity/|next-sanity)" \
  app components lib --include="*.ts" --include="*.tsx" \
  | grep -v "^lib/content/internal/" | grep -v "^lib/__tests__/"
```

Every path it prints must be either converted or on the ALLOWED list below. If it prints
anything else, the earlier tasks are not finished — go back and finish them rather than
widening ALLOWED. Widening ALLOWED to make this pass defeats the entire phase.

- [ ] **Step 1: Write the test**

Create `lib/__tests__/content-layer-boundary.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

/**
 * Phase 1's whole purpose: exactly one directory knows the CMS exists.
 * If this test fails, someone reached around lib/content/ and Phase 3's
 * backend swap just got more expensive.
 */
/**
 * Match IMPORT STATEMENTS only, not any mention of the string "sanity".
 *
 * A plain substring grep flags lib/content/types.ts for the doc comment that
 * explains this very rule — the test would fail on correct code. Anchor on
 * `from "...sanity..."` / `require("...sanity...")` instead.
 */
const grepSanityImports = (paths: string[]): string[] => {
  try {
    const out = execFileSync(
      "grep",
      [
        "-rlnE",
        String.raw`(from|require\()\s*['"][^'"]*(@/sanity|@sanity/|next-sanity)`,
        ...paths,
      ],
      { encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return []; // grep exits 1 when there are no matches
  }
};

/**
 * The only files permitted to import Sanity. Everything here is Sanity's own
 * plumbing — the Studio and its preview machinery — not application code.
 *
 * Do NOT add a file here to make the test pass. If a content file appears in
 * the failure list, convert it; that is the work this phase exists to do.
 */
const ALLOWED = [
  "lib/content/internal/sanity-source.ts",
  // The embedded Studio route and its Presentation/draft-mode plumbing.
  "app/studio/[[...tool]]/page.tsx",
  "app/api/draft-mode/enable/route.ts",
  "components/disable-draft-mode.tsx",
  // <SanityLive/> is rendered ONLY behind `isDraftMode` — it opens the
  // per-visitor live-events stream for the Presentation tool. Draft plumbing,
  // not a content read.
  "app/[locale]/(main)/layout.tsx",
  // Inbound-webhook HMAC verification (`isValidSignature`), not content access.
  // These two routes are replaced wholesale by in-process afterChange hooks in
  // Phase 3 (spec §2, "Search + cache"), so insulating them would be work on
  // code already slated for deletion.
  "app/api/webhooks/sanity/route.ts",
  "app/api/search/news/webhook/route.ts",
];

describe("content layer boundary", () => {
  it("only lib/content/internal/ imports Sanity inside lib/content/", () => {
    const offenders = grepSanityImports(["lib/content"]).filter(
      (f) => !ALLOWED.includes(f),
    );
    expect(offenders).toEqual([]);
  });

  it("no app route or component imports Sanity directly", () => {
    const offenders = grepSanityImports(["app", "components"]).filter(
      (f) => !ALLOWED.includes(f),
    );
    expect(offenders).toEqual([]);
  });

  it("nothing imports the generated sanity.types.ts", () => {
    // The 15,156-line generated artifact disappears with Sanity (Task 10b).
    const offenders = grepSanityImports(["app", "components", "lib"]).filter(
      (f) => !ALLOWED.includes(f) && !f.startsWith("lib/__tests__/"),
    );
    expect(offenders).toEqual([]);
  });

  it("no lib module outside lib/content/internal imports Sanity", () => {
    const offenders = grepSanityImports(["lib"]).filter(
      (f) => !f.startsWith("lib/content/internal/") && !f.startsWith("lib/__tests__/"),
    );
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and fix every offender it names**

Run: `pnpm exec vitest run lib/__tests__/content-layer-boundary.test.ts`

Expected on first run: a list of files Tasks 2–10 missed. Move each one's query into the
right `lib/content/` module — do not add it to `ALLOWED`. `ALLOWED` is for the Studio and
the seam, nothing else.

- [ ] **Step 3: Verify the whole suite**

```bash
pnpm typecheck
pnpm test
```

Expected: clean, green, including the three boundary tests.

- [ ] **Step 4: Full rendered sweep**

Run `pnpm dev` and walk every surface the phase touched, in `en` and `ar`:
homepage, a page, a regional community page, case studies list and detail, lived
experiences, news list and detail, agendas, onboarding, atlas, and one authenticated
dashboard page. Nothing may look or behave differently from before Phase 1.

- [ ] **Step 5: Commit**

```bash
git add lib/__tests__/content-layer-boundary.test.ts
git commit -m "test(content): enforce the content layer boundary

Fails if anything outside lib/content/internal/ imports Sanity. This is
what makes Phase 1's insulation a checked property rather than a claim,
and it is the gate for starting the Payload build in Phase 2."
```

---

## Phase 1 exit criteria

- [ ] `lib/__tests__/content-layer-boundary.test.ts` passes with `ALLOWED` containing only the seam and the Studio config
- [ ] `sanity/lib/fetch.ts` is deleted
- [ ] `pnpm typecheck` clean, `pnpm test` green
- [ ] Every surface in Task 11 Step 4 renders identically to pre-Phase-1
- [ ] No `lib/content/` public signature mentions a Sanity type

## What Phase 2 inherits

One directory to reimplement. `lib/content/internal/sanity-source.ts` gains a sibling
`payload-source.ts`, and each domain module switches over behind a flag — with the
domain tests from Tasks 2–10 as the contract both backends must satisfy.
