# Payload Phase 3 — Swap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move every one of `lib/content/`'s 138 exported functions from Sanity to Payload, one domain module at a time behind a flag, without the public site changing.

**Architecture:** Phase 1 put a seam under `lib/content/`; Phase 2 filled Payload behind it. Phase 3 adds `payload-source.ts` beside `sanity-source.ts`, then flips modules across one at a time — each verified by rendering the same route on both backends and diffing the HTML. Write paths, moderation workflows and Algolia sync move last, once reads are proven.

**Tech Stack:** Payload 3.88.0 local API, Next.js 16.3.4, Postgres (Neon), Clerk, Cloudflare R2, Algolia.

**Spec:** `docs/superpowers/specs/2026-09-02-sanity-to-payload-migration-design.md` (§5 Phase 3)

**Inherited from Phase 2:** a populated Payload with the same document ids as Sanity — 347 media, 48 files, 381 published documents, 30 documents carrying a draft version, six migrations, `verifyImport` at 13 database checks + 6 archive-only. `lib/content/internal/` already holds `sanity-source.ts`, `image-source.ts`, `safe.ts`, `normalize.ts`, and the Lexical converter pair.

---

## Global Constraints

- **The public site's rendered output must not change.** This phase swaps a backend, not a design. Every checkpoint is a rendered-HTML comparison, not a green build — a green build is not validation.
- **One domain module at a time**, each behind `CONTENT_BACKEND`, each independently revertible.
- **Payload 3.88.0**, all `@payloadcms/*` pinned to it. Next.js `>=16.2.6`.
- **Clerk stays the sole identity system.** Payload holds content only; Prisma holds users. Roles come from the Prisma `User.role` enum: `community_member | community_editor | team_editor | admin`. Never from a Clerk session claim.
- **Locales: `en` (default), `es`, `fr`, `ar` (RTL).** Four, not two.
- **Never run `sanity typegen generate`** — it renames exported types and breaks `tsc`.
- **Do NOT run `pnpm build`** — its `postbuild` hook runs `sync:search`, which pushes to a **live Algolia index**. Use `node scripts/create-all-outputs-pages.mjs && pnpm exec next build`.
- **`pnpm lint` is not a gate** (~656 pre-existing errors). Lint changed files only.
- **`pnpm typecheck` and `pnpm exec vitest run` are gates.** Baseline entering this phase: **111 test files / 1549 tests**.
- **Sanity stays readable and read-only all phase.** It is the fallback and the oracle. Decommissioning is Phase 4.
- **`printf 'y\n' | pnpm payload migrate`** — a stale dev-push marker makes plain `migrate` stop on an interactive prompt and hang. Never `migrate:fresh`: `payload_cms` carries PostGIS (`spatial_ref_sys`, 8,500 rows).
- **Never include Claude/AI attribution or a `Co-Authored-By` trailer in commit messages** (`CLAUDE.md`).

## The contract being preserved

| | |
|---|---|
| Modules | 16 |
| Callable exports | 138 |
| Exported interfaces / types | 113 / 13 |
| Largest module | `lib/content/pages.ts` at **8,550 lines** — more than half the layer |
| Files performing writes or write-feeding reads | **9** (measured; see below) |
| Studio moderation workflows | 4 (`case-study`, `event`, `lived-experience`, `research-output`) |
| Algolia route groups | 5 (`agendas`, `case-studies`, `counts`, `news`, `users`) + `token` |

**The acceptance test is not "does the schema look like Sanity's" but "can it answer every question `lib/content/` asks".**

## Obligations carried in from Phase 2

Each was measured. Each costs a bug if forgotten.

1. **`moderationStatus` → `status`.** Payload stores `moderationStatus` (the name `status` collides with Payload's `_status` enum). `lib/content/case-studies.ts` exposes `status?: CaseStudyStatus` and `getCaseStudiesByStatus()` as its **public contract**. The Payload reader maps back.
2. **`query` and `queryPreviewable` differ only inside draft mode.** Someone will try to merge them. Six Phase-1 bugs came from this.
3. **A read feeding a write must not be cached.** Use `queryLive` for read-client originals and `queryRaw` only for write-client originals — conflating them caused an authorization bypass.
4. **`ContentTag.value` is typed `string` but holds `{_type:"slug",current:…}` at runtime.** Fix the type when Payload models it; do not carry the lie forward.
5. **`lqip` → `blurDataURL`.** 347/347 media rows carry it and 25 components render it. The Payload image source must expose it.
6. **`image.alt` lives in the `en` locale**, with `fallback: true` covering es/fr/ar.
7. **Heading anchors change once**, and this is decided: `headingId` is `${slug}-${_key}`, Sanity's random keys cannot survive Lexical, and the minted replacements are content-derived and collision-suffixed. In-page TOC keeps working; externally bookmarked fragments break. Accepted.
8. **`onboardingContent` is six globals**, composed by `composeOnboardingContent` — a deep merge where `fieldLabels` and `validationMessages` arrive from several parts and are merged rather than overwritten. Iterate `ONBOARDING_GLOBAL_SLUGS`; `getOnboardingContent(locale)` is that compose over six `findGlobal` calls.

   46 component read chains resolve against none of them, and this is **decided, not open**: they come from `components/onboarding/types.ts`, which declares `fieldPlaceholders`, `privacyFieldLabels` and `reviewFieldLabels` as **optional** keys that **Sanity never held either** — verified. So they are dead on arrival, not a regression.

   **Task 8 neither serves nor deletes them.** Adding them to the globals would invent content no editor ever wrote; deleting them touches `components/`, which this phase does not change. Record them as dead for Phase 4's cleanup and move on.
9. **`author.bio` is not modelled** — Portable Text on 2 of 95 authors, preserved in the archive only.
10. **`livedExperience.region` holds a `regionalCommunity` reference**, not a region code; `videoUrl` is real and undeclared; `status` is 0/56 populated and unset means approved.
11. **`internalLink` carries a raw `_ref` with no `relationTo`** — Phase 3 resolves references at read time.
12. **The homepage keeps its eleven fixed slots**; `regionalCommunityPage`'s six grid slots are one parameterised `contentGrid`.

---

## File Structure

**Created**
- `lib/content/internal/payload-source.ts` — the four read primitives against Payload's local API, mirroring `sanity-source.ts`'s exports exactly.
- `lib/content/internal/payload-image-source.ts` — `imageUrl()`/`blurDataURL` against `media`, honouring the 11 `imageSizes`.
- `lib/content/internal/backend.ts` — reads `CONTENT_BACKEND`, exposes `activeBackend()` and a per-module override.
- `scripts/parity/render-diff.ts` — renders a route on both backends and diffs the HTML.
- `lib/content/internal/payload/<domain>.ts` — one Payload reader per domain module.

**Modified**
- `lib/content/<domain>.ts` × 16 — each gains a backend branch; **their exported signatures do not change**.
- The 14 write-path files.
- `sanity/actions/*` → Payload hooks + admin components.
- `app/api/search/*` — sync moves in-process.

**Untouched**
- `app/`, `components/` — nothing user-facing changes in this phase.
- `sanity/schemas/**` — Sanity stays readable until Phase 4.

---

## Task 1: Give Sanity a request timeout

**Files:** Modify `sanity/lib/client.ts`; test `lib/__tests__/sanity-client-timeout.test.ts`

**This is a behaviour change and ships alone**, before any swap. `@sanity/client` supports `timeout?: number` and none is set, so a hung upstream blocks server rendering with no ceiling. The 2026-07-28 quota outage took every content page down; a timeout turns that into fast degraded responses through `safe()`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { client } from "@/sanity/lib/client";

describe("the Sanity client", () => {
  it("sets a request timeout, so a hung upstream cannot block rendering forever", () => {
    expect(client.config().timeout).toBe(10_000);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run lib/__tests__/sanity-client-timeout.test.ts`
Expected: FAIL — `undefined` is not `10000`.

- [ ] **Step 3: Add the timeout**

In `sanity/lib/client.ts`, add `timeout: 10_000` to the `createClient({...})` call, with a comment naming the 2026-07-28 outage as the reason.

- [ ] **Step 4: Run it and watch it pass**

- [ ] **Step 5: Commit** — `fix(sanity): cap request time so a hung upstream cannot block rendering`

---

## Task 2: Stand up the production Payload database

**Files:** Create `docs/migration/payload-production-runbook.md`

No code. This is the prerequisite that must exist before a single module swaps, and it is deliberately **not** done during Phase 2 — an empty production database drifting from dev for weeks is worse than none.

- [ ] **Step 1:** Create a second database inside the existing Neon project, on the **production** branch, named `payload_cms`. It must not be Prisma's database (`goh`) — `prisma migrate reset` drops the schema it manages.
- [ ] **Step 2:** Set `PAYLOAD_DATABASE_URL` in the Vercel production environment. Leave the dev value in `.env.local`.
- [ ] **Step 3:** Run the six committed migrations: `printf 'y\n' | pnpm payload migrate`, then confirm `migrate:status` reads Ran for all six.
- [ ] **Step 4:** Run the import in order — `pnpm import:assets`, `pnpm import:documents`, `pnpm import:drafts`. The ordering matters: `importDocuments` refuses to run after drafts exist unless flagged, because a published save takes the `latest` flag and would bury every pending edit.
- [ ] **Step 5:** Run `pnpm verify:import`. Require 13/13 database checks and 6/6 archive-only. Record the numbers in the runbook.
- [ ] **Step 6: Commit** the runbook.

---

## Task 3: The Payload read primitives

**Files:** Create `lib/content/internal/payload-source.ts`, `lib/content/internal/backend.ts`; test `lib/__tests__/payload-source.test.ts`

**Interfaces:**
- Consumes: Payload's local API (`getPayload`), `payload.config.ts` at repo root.
- Produces: `query`, `queryPreviewable`, `queryRaw`, `queryLive` with **the same signatures** `sanity-source.ts` exports, plus `activeBackend(domain?: string): "sanity" | "payload"`.

The four primitives are not interchangeable and their differences are load-bearing:

| primitive | perspective | cache | used for |
|---|---|---|---|
| `query` | published | 1 hour | ordinary reads |
| `queryPreviewable` | decided by `draftMode()` | conditional | anything a preview can show |
| `queryRaw` | raw, write client | none | reads feeding a write |
| `queryLive` | published, read client | none | fresh reads that must not see drafts |

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import * as sanitySource from "@/lib/content/internal/sanity-source";
import * as payloadSource from "@/lib/content/internal/payload-source";

describe("payload-source mirrors sanity-source", () => {
  it("exports every read primitive the seam defines", () => {
    for (const name of ["query", "queryPreviewable", "queryRaw", "queryLive"]) {
      expect(typeof (payloadSource as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("does not drop any export the Sanity source provides", () => {
    const missing = Object.keys(sanitySource).filter((k) => !(k in payloadSource));
    expect(missing).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail** — the module does not exist.
- [ ] **Step 3: Implement `payload-source.ts`.** Each primitive takes a typed query descriptor rather than a GROQ string; keep `queryPreviewable` consulting `draftMode()` and `queryRaw`/`queryLive` uncached. Do **not** collapse the four into fewer.
- [ ] **Step 4: Implement `backend.ts`** — `CONTENT_BACKEND` defaults to `sanity`; `CONTENT_BACKEND_<DOMAIN>` overrides per module so one domain can flip alone.
- [ ] **Step 5: Run the tests and watch them pass.**
- [ ] **Step 6: Commit** — `feat(content): add the Payload read primitives beside the Sanity ones`

---

## Task 4: The Payload image source

**Files:** Create `lib/content/internal/payload-image-source.ts`; test `lib/__tests__/payload-image-source.test.ts`

**Interfaces:** Produces `imageUrl(image, opts)` and `blurDataURL(image)` matching `lib/content/images.ts`'s existing shape.

Two behaviours are load-bearing and were preserved in the Payload schema: **SVGs bypass transforms** (Payload's `canResizeImage` excludes them), and the cropped path uses `auto("format")` while the uncropped path forces `webp`. The 11 `imageSizes` on `media` were derived from `imageUrl()`'s real call sites — read `payload/collections/media.ts`'s header for the mapping.

`blurDataURL` reads `media.lqip`, which is populated 347/347. Nothing regenerates it; if this returns null, 25 components silently lose their placeholders.

- [ ] **Step 1: Write the failing test** asserting `blurDataURL` returns the stored `lqip` and that an SVG returns its original URL unmodified.
- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3: Implement**, mapping each requested `(width,height,crop)` onto the matching named size.
- [ ] **Step 4: Run and watch it pass.**
- [ ] **Step 5: Commit** — `feat(content): add the Payload image source`

---

## Known friction, measured by Phase 2's final review

None of this makes Phase 3 impossible. All of it costs a surprise if discovered mid-task.

**1. `imageUrl()` is parametric; `imageSizes` is a fixed eleven.** The eleven cover today's 36 call sites, but two things fall outside them: `quality` — `lib/content/metadata.ts:72` calls `imageUrl(page.ogImage, { quality: 100 })` for Open Graph — and any *new* width a future caller asks for. Task 4 must decide what happens on a miss: nearest-size-up, an on-demand transform, or a loud failure. Silently returning the original is the one option that is not acceptable, because of the next item.

**2. The WebP regression is real, but at exactly one site — not the thirteen first feared.** `sanity/lib/image.ts:19` returns `imageBuilder.format("webp").fit("max")` **unconditionally** for non-SVGs, so every image is WebP on the wire today. Phase 2's ledger first parked this as "bytes in R2, not on-wire" (wrong), and the final review then called it a regression across ~13 dimension-less call sites (right in principle, too broad in fact).

Measured in Task 4: **all 12 dimension-less component call sites render through `next/image`** with the default loader, none passes `unoptimized`, and `next.config.mjs` sets `images.formats: ['image/avif','image/webp']`. The browser therefore gets AVIF/WebP whatever the stored format is.

The one site that genuinely regresses is **`lib/content/metadata.ts:72`** — the Open Graph image. Crawlers fetch that URL directly, so it never touches `next/image`, and it is also the only caller passing `quality`. It needs a deliberate decision in Task 7 (see below).

**A constraint that follows:** `next.config.mjs`'s `images.remotePatterns` lists `cdn.sanity.io` but **no Payload or R2 host**. Payload image URLs must therefore stay same-origin and relative (`/payload-api/media/file/…`) or the twelve `next/image` sites break. Absolutising a URL for Open Graph — which Open Graph requires — cannot be done globally; it is a per-caller decision.

**3. Four GROQ constructs need mechanical rewrites**, and each is a place a subtle behaviour change hides:
- `references()` — used for reverse lookups
- the one cross-type union at `lib/content/discovery.ts:367`
- `match` full-text search
- `drafts.`-prefixed id handling, which is how draft-awareness is expressed today

**4. Both remodels need explicit reconstruction code.** The homepage's eleven fixed slots and `regionalCommunityPage`'s single parameterised `contentGrid` are deliberate divergences from Sanity's shape, so the readers must rebuild what the components expect. The `contentGrid.contentType` discriminator makes the regional one lossless.

**5. The Postgres 100-argument cap is guarded per-target, not phase-wide.** Two globals hit SQLSTATE 54023 in Phase 2 because a localized table exceeded 100 columns. Nothing stops a third. **Add one generic test** asserting no `*_locales` table exceeds the cap, rather than fixing each occurrence as it appears.

**6. Four things are genuinely unanswerable from Payload** and must be accepted or removed, not worked around: `author.bio` (2/95, projected but rendered nowhere), `newsPost`/`livedExperience.language` (the only reader passes no language; the `caseStudy` equivalent is documented dead code), `onboarding._rev`, and the `report` sitemap line (0 documents).

---

## Task 5: The parity harness

**Files:** Create `scripts/parity/render-diff.ts`, `scripts/parity/routes.ts`; test `lib/__tests__/parity-harness.test.ts`

**This task exists before any module swaps, because it is how every later task is verified.** The spec requires a rendered-page comparison at each checkpoint, and a green build is not validation.

**Interfaces:** Produces `compareRoute(path: string): Promise<{ equal: boolean; diff: string }>` — renders `path` twice, once per backend, and diffs the HTML after normalising away known-volatile output (nonces, timestamps, React ids).

`routes.ts` enumerates a representative route per domain: a case study, a lived experience, a docs chapter, a news post, an agenda index, a regional community page, the homepage, `/atlas`, and one route in each of `es`/`fr`/`ar`.

- [ ] **Step 1: Write the failing test** — `compareRoute` on a route rendered identically twice reports `equal: true`; on deliberately differing HTML it reports the differing element.
- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3: Implement.** Normalise only provably volatile output; **never** normalise away content differences. A harness that cannot fail is worse than none — this phase has already had one verifier that passed while every string in the database said `"WRONG"`.
- [ ] **Step 4: Prove it discriminates** — mutate one heading in the Payload copy and confirm the diff names it.
- [ ] **Step 5: Commit** — `feat(parity): render the same route on both backends and diff it`

---

## Tasks 6–14: swap the domain modules

Each task follows the identical shape below. They are ordered smallest-and-most-foundational first, so the harness and the primitives are exercised early on cheap surfaces.

**The shape, for every domain task:**

- [ ] **Step 1:** Write the Payload reader at `lib/content/internal/payload/<domain>.ts`.
- [ ] **Step 2:** Add the backend branch inside `lib/content/<domain>.ts`. **Exported signatures do not change** — that is the whole point of the seam.
- [ ] **Step 3:** Run the module's existing tests against **both** backends. They are the contract both must satisfy; if a test passes on Sanity and fails on Payload, the reader is wrong, not the test.
- [ ] **Step 4:** Run `compareRoute` on that domain's routes in all four locales. Rendered HTML must match.
- [ ] **Step 5:** Commit, one module per commit, revertible alone.

| Task | Module(s) | Lines | Notes |
|---|---|---|---|
| 6 | `taxonomy.ts`, `taxonomy-options.ts`, `regions.ts` | ~350 | Foundational; everything references tags and regions. Owns the **declaration** of `ContentTag.value` — see below; its own path is already honest. |
| 7 | `system.ts`, `metadata.ts`, `illustrations.ts`, `text.ts` | ~360 | `system.ts` holds the sitemap filters that read `status == "approved"` — they become `moderationStatus`. **`metadata.ts:72` needs an explicit decision:** the OG image is the one true WebP regression, needs `quality`, and needs an *absolute* URL — which the twelve `next/image` sites must not get, since no Payload host is in `remotePatterns`. A full-size PNG as OG also risks crawler size ceilings. `illustrations.ts:59` passes arbitrary natural dimensions and will land on the nearest-size-up path per asset. |
| 8 | `onboarding.ts` | 283 | Composes **six** globals via `composeOnboardingContent`. The 46 unserved component chains are settled in obligation 8 — record as dead, neither serve nor delete. |
| 9 | `lived-experiences.ts` | 630 | The hardest of the small modules — it **writes**. See below. |
| 10 | `news.ts` | 964 | 21 exports, **no writes**. Big because of projection breadth, not data: measured 4 published newsPosts (4 **distinct** `publishedAt`, so no ties) and 1 externalSource (approved). Two real hazards: `language` is `"en"` **or `null`**, and six queries sort `order(language == $language desc, …)` — confirm GROQ's and Payload's null handling agree, or the language-preference ordering silently differs. Also holds one of the three bare-`value` tag projections (`news.ts:189`), so flatten it to match Payload's flat string. |
| 11 | `outputs.ts` | 1,167 | **Writes**, and holds **both** remaining `queryLive` call sites. **Assert the primitive, not just the result.** Also carries the `report` dead end and the download-counter behaviour change — see below. |
| 12 | `case-studies.ts` | 1,561 | The largest non-`pages` module: **30 exports** and heavy writes. The `status` mapping is **bidirectional**, and 2 published case studies are `pending`. See below. |
| 13 | `discovery.ts` | 1,399 | Cross-type search and filtering; the six `status == "approved"` event filters live here. Holds 3 of the 5 `queryLive` call sites. |
| 14 | `pages.ts` | **8,550** | See below — this one does not fit the shape. |

### `ContentTag.value`: the declaration is Task 6's, the violations are Tasks 10 and 11's

Measured, so the work lands in the right place. `ContentTag.value` is declared `string`. In Sanity a tag's `value` is `{_type: "slug", current: "healthcare-systems"}`; in Payload it is a flat `text` column holding what Sanity called `value.current`.

- **`taxonomy.ts` is already honest** — `TAGS_QUERY` projects `"value": value.current`, so `getTags()` really does return a string. Task 6 changes no behaviour here.
- **`news.ts:189` and `outputs.ts:181` bind bare `value`** inside `tags[]->{…}`, so those paths hand consumers the slug *object* while the type promises a string. That is the lie.

So Task 6 owns the type declaration and Tasks 10 and 11 must flatten their projections. **Expect the swap to change runtime shape on those two paths** — Payload returns the flat string either way, so a consumer reading `value.current` breaks, and a consumer rendering `value` directly stops emitting `[object Object]`. The parity harness will show it as a diff; treat that diff as the finding, not as harness noise.

### Ordering ties must be broken deterministically, and the tie-break must reproduce Sanity

`publishedAt` on case studies is a near-total tie: **25 of 28 share `2024-01-01T00:00:00Z`**, and there are only **2 distinct values** across all 28 (measured against `production_2`, control agenda = 29). That timestamp is a backfill default, not an editorial date.

An `order(publishedAt desc)` is therefore unordered in practice, and Sanity and Payload pick different — equally valid — representatives. Task 6 hit this on the homepage region strip. **Left alone it blinds the parity harness on every date-ordered surface**, which is most of case studies, news and outputs.

So: add an explicit secondary sort to **both** backends, and **prefer a tie-break that reproduces what Sanity returns today** — try `_id`/`id` ascending first, then descending, then `_createdAt`. If one reproduces the current output, the phase's "nothing user-facing changes" premise holds exactly and the harness gains determinism for free.

If none reproduces it, say so and stop: choosing an order that changes which case studies appear in the region strips is a visible change and needs a human decision, not an implementer's judgment. Record which tie-break you used and the evidence it matches.

### Task 9 carries writes and a write-time authorization gate

`lived-experiences.ts` is one of the four domain modules that write, so its writes move with it (not with Task 15). It uses `queryRaw` ×2, `uploadFileAsset`, `updateDocument` and `createDocument`.

**`loadEditableLivedExperience` is a write-time authorization gate fed by `queryRaw`** — the exact shape of the Phase-1 bypass. Translate it deliberately:

- It strips a `drafts.` prefix and matches both `$id` and `"drafts." + $id`. **Payload has no `drafts.`-prefixed ids** — a draft is a version of the same id — so that id-juggling collapses into one lookup with drafts visible.
- Its status list is `["pending","revision","draft",null,undefined]`. Sanity's `status` here **conflates a moderation state with a draft state**, which Payload splits into `moderationStatus` and `_status`. Do not map `"draft"` onto `moderationStatus`.
- **Measured, so do not re-derive:** `status` is **0/56 populated** — 0 of 35 published, 0 of 21 drafts, only value `null`. The gate therefore always passes today and its real work is the ownership check that follows. The `"draft"` literal is vestigial.
- **The import carried that faithfully**: `lived_experiences.moderation_status` is `null` on all 35 rows and `_lived_experiences_v.version_moderation_status` is `null` on all 84 draft-version rows. No `defaultValue` was applied — so the gate does **not** flip closed. Preserve that: if a future editor sets `moderationStatus`, an approved document must still be non-reopenable.

Other specifics: `region` holds a `regionalCommunity` **reference**, not the fixed-7 code the Sanity schema declares (42/56 populated, 42 references, 0 strings); `videoUrl` is **56/56 populated and undeclared** in the Sanity schema, read by five modules; `videoFile` uploads resolve to the **`files`** collection, not `media`; and lines 38 and 53 are two of the three bare-`value` tag projections, so this is the module that actually produces a mis-shaped `ContentTag`.

### Two cross-backend differences only the flight payload reveals

Task 9 found both by comparing the RSC flight payload, not the DOM. **Every remaining reader must handle them, and five existing ones do not.**

1. **Locale key order.** Sanity returns a localized object's keys **alphabetically** (`ar,en,es,fr`); Payload returns them in `payload.config.ts`'s locale order (`en,es,fr,ar`). Key order is visible once the object is serialized into the flight payload, so any `Localized` value reaching a client component diffs. Sort the keys.
2. **Unset keys.** GROQ emits `null` for a projected key with no value; Payload omits the key entirely. A projection that names a field must therefore emit `null`, not nothing.

**Audited 2026-09-07, then corrected by Task 10 on measurement.** Affected: `taxonomy`, `system`, `onboarding` (plus `lived-experiences`, which already sorted). **`regions` and `illustrations` were false positives** in my audit — they build no locale map at all: `regions.getThemeOptions` rebuilds `{en,es,fr,ar}` exactly as its Sanity twin does, and `illustrations` emits a string. And `onboarding` was **a live defect, not a latent one** — its two arms already disagreed.

Task 10 also found the rule is broader than locales: **Sanity alphabetises the keys of *every* object it returns, not just a locale map's.** The shared helper therefore exposes `groqObject()` alongside `localized()`.

**Fix it once, in a shared helper under `lib/content/internal/`, not five times.** Five private copies is how the next reader gets it wrong again.

### Task 11: `report` is a dead end, and the download counter changes behaviour

Both measured before dispatch (control `count(*[_type=="tag"])` = 68).

**`report` has 0 documents and no Payload collection.** Payload has 23 collections and none is `reports`. Yet `trackReportDownload` is live — `app/api/reports/download/track/route.ts` calls it — and `components/blocks/grid/grid-report.tsx` no longer references `downloadCount` at all, so the Phase-1 comment claiming it renders publicly is **stale**.

So the Payload arm has nothing to write to. Make it an **explicit, documented no-op or a clear "not modelled" failure — never a silent pretend-success**, and record the route and function for Phase 4 deletion. Do not invent a `reports` collection to satisfy it.

**The download counter starts working, and that is a deliberate, already-documented change.** `outputs.ts:396` records that Sanity's `.patch().commit()` ran against a **read-token** client and its own try/catch swallowed the failure — so `totalDownloadCount` and `file.downloadCount` have **likely never incremented in production**. The seam's `updateDocument` goes through the editor token, so routing through it *fixes* the counter. The download was never gated on that write succeeding, so no user flow changes; the count simply starts reflecting reality. Carry the same behaviour on the Payload arm and say so in the report.

**Both remaining `queryLive` call sites are here** (`outputs.ts:443` and `:484`, the two trackers). They are reads feeding writes, and `queryLive` is not interchangeable with `queryRaw` — conflating them caused the Phase-1 bypass. Assert **which primitive is called**, not merely what it returns.

### Task 12: the status mapping runs both ways, and two documents make it load-bearing

**The mapping is bidirectional, and the write direction is the one that gets forgotten.** Reads map Payload's `moderationStatus` onto the public `status` that `CaseStudyStatus` and `getCaseStudiesByStatus()` expose. But `case-studies.ts:1297` also *writes* `{ ...updatable, status: "pending" }` — that must become `moderationStatus` on the Payload arm, or a resubmission silently writes a field Payload does not have.

**Measured in Payload (2026-09-07): 25 case studies are `approved` + `published`, and 2 are `pending` + `published`.** Those 2 are why gating on publish state alone is a leak, and they are exactly the pair Phase 2's review caught. Any query this module issues must require **approved as well as published** — `publishedAndApproved`, never `publishedOnly`. A reader that filters on `_status` alone exposes them along with their `reviewNotes` and `submittedBy`, which are separately field-gated to editors.

**Six `queryRaw` sites** (`:1013`, `:1059`, `:1235`, `:1270`, `:1332`, `:1353`, `:1368`) plus `createDocument` ×3, `updateDocument` ×3, `deleteDocument` and `uploadFileAsset`. Writes move with this module. **Assert which primitive each write-feeding read calls** — `queryRaw` and `queryLive` return the same shape, so a wrong choice is invisible to a result-based test.

`caseStudyDrafts` is a **separate collection** (1 row) with owner-based access — `read` and `create`/`update`/`delete` are both `ownerOrEditor`, deliberately widened in Phase 2 so a `community_member` can autosave and reopen their own submission. Preserve that; it is the collection's whole purpose.

### Task 13: the cross-type union silently excludes an entire content type

`discovery.ts:366` asks for `_type in ["caseStudy", "livedExperience", "newsPost"]` and gates on:

```
(status == "approved" || (!defined(status) && _type == "newsPost"))
```

**Measured on the published perspective (what the app actually reads): 29 rows — 25 `caseStudy`, 4 `newsPost`, and ZERO `livedExperience`**, while 56 lived experiences have slugs. Control: agenda = 29.

The cause is that `livedExperience.status` is **0/56 populated**, and the unset-status branch is restricted to `newsPost`. So no lived experience can ever match, and the "For You" candidates have silently never included that type. That is a pre-existing production defect, not something the swap introduces.

**This must not be quietly fixed during the swap, and it is not the implementer's call.** Payload's `publishedAndApproved` applies exists-or-approved to `livedExperiences` — using it here would suddenly admit 56 documents into a recommendation surface that has never shown any, which is user-visible. **Reproduce today's behaviour exactly, report the defect, and leave the decision to the user.**

(A first measurement of mine appeared to show a draft leaking into this union. It was an artifact of querying without `perspective=published`; the app's `query()` pins that perspective and the draft does not appear. Recorded so the false positive is not rediscovered.)

Task 13 also holds **five `queryLive` sites** (`:565`, `:650`, `:681`, `:914`, `:947`) — more than the three the earlier count implied — plus `queryRaw` ×2, `createDocument` ×2 and `updateDocument`. Its writes move with it.

### The parity harness keeps a persistent cache, and it can serve stale content

Task 14a's before/after comparison showed one route moving that its refactor could not have touched — `/en/reader/background-context`, domain `system`, which does not import `lib/content/pages` at all. Its Payload arm had converged *towards* Sanity on a link href: the percent-encoding defect fixed in `a1cb62994`, **served stale from the harness's persistent dist cache in the "before" run**. A third targeted run reproduced the "after" hunk byte for byte.

So the harness's `.next-parity-sanity` / `.next-parity-payload` directories survive between runs, and a comparison taken shortly after a code or data fix can show **pre-fix content on one side**.

That cuts both ways: it can invent a difference that is already fixed, and it can hide one that is newly introduced. **When a parity result is surprising, re-run the single route before believing it** — a targeted re-run is cheap and settles it. Task 14a did exactly that, which is why its 40/41 result is trustworthy rather than merely reported.

### The `pages` domain is deliberately incomplete until 14c

14b swapped the page and document readers and **left `blocks[]` empty on the Payload arm on purpose** — mapping Payload blocks into the `_type`/`_key` shape the renderers expect is 14c's job. A test pins that 14c's and 14d's readers stay on Sanity.

**So `CONTENT_BACKEND_PAGES=payload` must not be set until 14c lands.** 14b verified this honestly rather than reporting a false green: on `/{en,es,fr,ar}/about`, every content difference is a **deletion with zero `+` lines**, and no `<title>`, `<meta>` or status differs in any locale — the envelope matches and only `blocks[]` is missing.

Two smaller things it found and correctly declined to fix in someone else's file:

- **`payload/regions.ts`'s `regionArt` map is not key-sorted.** The `groqObject` rule applies to non-locale maps too; it shows as a reversed key order in the flight payload on the four community routes. One call settles it.
- **`metadata.ts` reads `activeBackend("metadata")`, not `"pages"`.** Override **both** when flipping, or the one page carrying an `ogImage` silently loses it.

Also noted and not papered over: `noindex` is a single non-localized boolean in Payload (`false`) where Sanity holds `null` across nine locale arms. Both falsy, rendered `robots` identical.

### Filtering a Payload `select` field with an unknown value throws; GROQ shrugs

Task 13 found this on `region` and it is **not specific to that field**. Payload backs every `select` with a **Postgres enum** — there are **140 enum types** in `payload_cms`, and the region ones hold exactly their 7 declared values. Filtering one with a value outside its set raises at the database, where the equivalent GROQ simply matches nothing and returns an empty list.

So a reader that passes user input, a URL parameter, or a legacy code straight into a `select` filter turns a quiet empty state into a **500**. Task 13 guarded its own path with `isRegionCode`, but **nothing else in the layer checks for this**, and `pages.ts` (Task 14) filters many select-backed fields — `backgroundType`, `gridColumns`, `contentType`, `mode`, `buttonVariant`, paddings.

**Validate against the declared option set before filtering, in every remaining reader.** An unknown value must produce the empty result GROQ produces, not an exception.

### No write path has been executed against Payload

Tasks 9, 11, 12 and 13 each moved their module's writes and each verified them **with mocked primitives only** — correctly, since the database holds 21 in-flight moderation drafts and I told every agent not to write to it. But the gap is now cumulative: `submitLivedExperience`, the two download trackers, the case-study submission and draft-save paths, and `createWorkspaceOutputDraft` have **never run against Payload**.

Two are known to need shapes Sanity never wrote: `createWorkspaceOutputDraft` must mint an `id` and a unique `slug` (`draft-<uuid>`), and `saveCaseStudyDraft` narrows from Sanity's any-shape storage to 17 declared columns.

**Task 18 must exercise the write paths against a database it is safe to write to** — the production Payload database from Task 2 before it carries traffic, or a throwaway copy — and must not claim the writes are verified on the strength of mocked tests.

### Tasks 11 and 13 carry the bypass risk

The five `queryLive` call sites all live in these two modules, and **nothing currently asserts they keep choosing `queryLive` after the swap**. That is the exact gap the Phase-1 authorization bypass fell through: `queryLive` and `queryRaw` return the same shape, so a reader that picks the wrong one is invisible to a result-based test.

Both tasks must add a test that asserts **which primitive was called**, not merely what came back — a spy on the source module, or an injected primitive set. A test that only checks the returned documents cannot fail for this.

Related, and now measured: in Payload, `draft: false` is **not** a published-only filter. The main collection tables carry `_status: 'draft'` rows (`tags`, `authors` and `testimonials` each hold one — the never-published drafts), and a `find` with `draft` falsy applies no status filter at all. A published read needs `draft: false` **and** `where: { _status: { equals: "published" } }`. `payload.count` has no `draft` option, so its distinction rides entirely on that filter.

### Task 14 is different — and the split axis is document type, not block family

`pages.ts` is 8,550 lines for **17 exported functions and 11 interfaces**; the bulk is 21 GROQ fragments. **Measured, so 14a does not start by guessing:**

| group | lines | holds |
|---|---|---|
| page | 113–1207 | `PAGE_QUERY` (~980), slugs, translations |
| regional community page | 1208–2770 | `REGIONAL_COMMUNITY_PAGE_QUERY` (~1470), slugs, `getRegionStats` |
| **homepage** | 2771–7792 | **`HOMEPAGE_QUERY` (2,951) + `INDEX_HOMEPAGE_QUERY` (1,977)**, translations, slugs |
| feeds | 7793–8550 | regional team / case studies / lived experiences / news, homepage news + agendas |

So the natural seam is **document type**, not "block family" — the block projections are inlined inside each document's query rather than living apart.

**The biggest single win is the homepage pair: 87% of `INDEX_HOMEPAGE_QUERY`'s substantive lines appear verbatim in `HOMEPAGE_QUERY`.** Extracting those shared projections is most of the 5,000 lines, and doing it first makes 14c tractable.

- [ ] **14a:** Split by document type into four modules, extracting the shared homepage projections into fragments both queries use. Re-export from `pages.ts` so **no caller changes**. Commit with **no behaviour change** — `compareRoute` must be identical before and after.
- [ ] **14b:** Swap the page/document readers.
- [ ] **14c:** Swap the block projections, family by family, `compareRoute` after each.
- [ ] **14d:** Swap the homepage and `regionalCommunityPage`. **14d reuses 14c's block mappers rather than writing new ones** — every slot's block type is one 14c already handles.

  **The eleven homepage slots, measured from `payload/globals/homepage.ts`** (a `blockSlot` per slot, de-localized for presentation fields, **not** a generic `blocks` array — that ruling is binding):

  | slot | block | | slot | block |
  |---|---|---|---|---|
  | `heroWelcome` | `hero1` | | `collaboration` | `splitRow` |
  | `globalAgenda` | `splitRow` | | `news` | `gridRow` |
  | `howToUse` | `splitRow` | | `projectInfo` | `splitRow` |
  | `agendasModule` | `gridRow` | | `mentalHealthDefinition` | `cta1` |
  | `livedExperiences` | `carousel2` | | `partnerLogos` | `logoCloud1` |
  | `regionalCommunities` | `gridRow` | | | |

  Plus `title`, `meta_title`, `meta_description` (localized), `noindex`, `ogImage`.

  **`regionalCommunityPage`'s six grid slots are one parameterised `contentGrid`**, discriminated by `contentType` with exactly six values — `agendas`, `caseStudies`, `news`, `livedExperiences`, `team`, `testimonials`. That discriminator is what makes the reconstruction lossless: read it to rebuild which slot each grid was.

**14b's hard prerequisite: extract a shared image-shape helper first.** Measured 2026-09-07, and the case is now conclusive rather than cautionary:

- The six existing Payload readers build an asset shape in **20 separate places**, with **no shared helper**.
- They already emit **two competing shapes** — a full one (`{asset:{_id,url,mimeType,metadata:{lqip,dimensions}}, alt, …}`) and an abbreviated one (`{asset:{_id,url}, url, mimeType, width, height, lqip}`) — in the same file.
- **They have already drifted once:** Task 13 found `metadata.dimensions` emitted as `{width,height}` where Sanity emits `{height,width}` — invisible in the DOM, caught only by comparing an API response.
- **`pages.ts` carries 234 `asset->` dereferences and 197 `metadata` references.** Hand-writing the shape per block would multiply 20 drifting copies into hundreds.

This is precisely the locale-key defect again: repeated per reader, silently divergent, and visible only in the flight payload. It was fixed there by extracting `lib/content/internal/localized.ts`. **Do the same for the image shape before 14b swaps anything**, and route the existing 20 sites through it so there is one implementation, not one per block.

The wrapper itself is deliberate and stays: readers emit a Sanity-shaped `asset` so components gating on `asset._id` keep working, and `payload-image-source`'s `resolveMedia` recurses into `object.asset` while `isSanityShaped` tests `_id`/`_ref`/`_type`.

---

## Task 15: Re-point the five external write paths

**The spec says "16 write paths"; the measured figure is 9 files, and only 5 belong to this task.** The other four — `outputs.ts`, `case-studies.ts`, `lived-experiences.ts`, `discovery.ts` — are domain modules, so **their writes move with their own swap** in Tasks 9–13, not here. Splitting a module's reads from its writes across two tasks is what makes a half-moved path write to one backend and read from the other.

**Files:** Modify `app/api/uploads/image/route.ts`, `lib/account-deletion.ts`, `lib/rate-limit.ts`, `lib/actions/sync-user-management.ts`. **Do not touch `app/api/webhooks/sanity/route.ts`** — it is the Sanity webhook receiver and dies in Phase 4; re-pointing it at Payload is meaningless.

**The rule that caused an authorization bypass in Phase 1, restated:** a read feeding a write must not be cached, and `queryRaw` (raw perspective, write client) is not interchangeable with `queryLive` (published, read client). A `drafts.`-prefixed id matching a draft that says `status: "approved"` is exactly how that bypass happened. `queryLive` has 5 call sites today, all inside `outputs.ts` and `discovery.ts`; preserve that distinction when those modules swap.

**`lib/account-deletion.ts` is the highest-risk file in this phase — it is the only code that deletes.** It performs synchronous GDPR erasure: it counts approved submissions (retained, with an audit trail so the UI can tell the user to email the team), then `deleteDocuments([...draftIds, ...submissionIds])`, and also clears R2 objects and Algolia records.

Three things make its translation structural rather than mechanical:

1. **Payload has no `drafts.`-prefixed ids.** A Sanity draft is a separate document; a Payload draft is a *version* of the same id. So `draftIds` has no direct equivalent — deleting a "draft" means deleting a draft **version**, or the document itself when it was never published. Get this wrong and erasure either misses data (a GDPR failure) or removes a published document it should have retained.
2. **`status == "approved"` becomes `moderationStatus`**, and the retention rule depends on it: approved submissions are *kept*. A mis-mapped field that reads as unset would flip retained content into deleted content.
3. **`SUBMITTABLE_TYPES` spans four collections** — `caseStudy`, `livedExperience`, `researchOutput`, `event`. Payload deletes per collection, so one call becomes four, and a partial failure must not leave erasure half-done.

**Do not test this by deleting.** Exercise it against mocks and verify the id/collection resolution by reading. If a real deletion seems necessary to prove it, stop and ask — the database holds 21 in-flight moderation drafts, which are exactly the shape this code removes.

- [ ] **Step 1: Write the failing test** for `lib/actions/sync-user-management.ts`, the only external `queryRaw` caller:

```ts
it("reads through the uncached primitive, so a stale read cannot drive a write", async () => {
  const calls: string[] = [];
  await syncUserManagement({ onPrimitive: (name) => calls.push(name) });
  expect(calls).toContain("queryRaw");
  expect(calls).not.toContain("query");
});
```

- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3:** Re-point that file's read and write to Payload behind the backend flag.
- [ ] **Step 4:** Repeat Steps 1–3 for `app/api/uploads/image/route.ts` (asserting the upload lands in `media` with `sanityAssetId` unset for new uploads), `lib/account-deletion.ts` (asserting every submittable type is covered — `caseStudy`, `livedExperience`, `researchOutput`, `event`), and `lib/rate-limit.ts`.
- [ ] **Step 5:** Run the full suite against both backends.
- [ ] **Step 6: Commit** — one commit per file, each revertible alone.

---

## Task 16: Moderation workflows → Payload

**Files:** Create `payload/hooks/moderation.ts` and admin components; delete `sanity/actions/{case-study,event,lived-experience,research-output}-actions.ts` in Phase 4, not here.

Four Studio actions become Payload `afterChange` hooks plus admin buttons. Preserve the existing email side effects (`lib/case-study-emails.ts`) and the `moderationStatus` vocabulary (`pending`/`rejected`/`revision`/`approved`).

**Anonymous read requires published AND approved.** Gating on `_status` alone was a real security finding in Phase 2 and must not return. Field-level access must also survive: `submittedBy` and `reviewNotes` are editor-only, and Payload **field** access must return a plain boolean — a `Where`-returning helper is truthy there and silently makes the field public.

- [ ] **Step 1: Write the failing test** for `caseStudy`, the richest workflow:

```ts
it("moves a case study pending -> approved and emails the submitter once", async () => {
  const sent: string[] = [];
  const doc = await approveCaseStudy(pendingCaseStudyId, { sendEmail: (to) => sent.push(to) });
  expect(doc.moderationStatus).toBe("approved");
  expect(sent).toHaveLength(1);
});

it("does not email when the status did not change", async () => {
  const sent: string[] = [];
  await approveCaseStudy(alreadyApprovedId, { sendEmail: (to) => sent.push(to) });
  expect(sent).toEqual([]);
});
```

- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3:** Implement the `afterChange` hook, reading the previous value from `previousDoc` so the no-change case is detectable. Preserve `lib/case-study-emails.ts`'s existing templates.
- [ ] **Step 4:** Repeat for `event`, `livedExperience` and `researchOutput`, porting each from its `sanity/actions/*-actions.ts` counterpart.
- [ ] **Step 5:** Add the admin buttons, then move one real document through every state (`pending` → `revision` → `pending` → `approved`, and `pending` → `rejected`).
- [ ] **Step 6: Commit** — one workflow per commit.

---

## Task 17: Algolia sync → in-process hooks

**Files:** Modify `app/api/search/{agendas,case-studies,counts,news,users}/**`; create `payload/hooks/search-sync.ts`.

Sync moves from Sanity webhooks to Payload `afterChange`/`afterDelete` hooks.

**Two live hazards:** `pnpm build`'s `postbuild` pushes to the **live** index — never run it. And the public `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` currently returns 403 on all indices; the admin key works. That key rotation is the user's to do and is a prerequisite for validating search end-to-end.

- [ ] **Step 1: Write the failing test** against a fake index client:

```ts
it("indexes an approved case study and removes a rejected one", async () => {
  const ops: {op: string; id: string}[] = [];
  await onCaseStudyChange({ doc: approved, previousDoc: pending }, fakeIndex(ops));
  await onCaseStudyChange({ doc: rejected, previousDoc: approved }, fakeIndex(ops));
  expect(ops).toEqual([
    { op: "save", id: approved.id },
    { op: "delete", id: rejected.id },
  ]);
});
```

- [ ] **Step 2: Run it and watch it fail.**
- [ ] **Step 3:** Implement `payload/hooks/search-sync.ts` with `afterChange` and `afterDelete`, mapping each indexed type onto its existing record shape so the index schema does not change.
- [ ] **Step 4:** Point `ALGOLIA_INDEX_PREFIX` at a scratch index, run the five sync routes, and diff the resulting records against the live index's current contents. They must match field for field.
- [ ] **Step 5:** Leave the webhook routes in place, returning 410, until Phase 4 deletes them.
- [ ] **Step 6: Commit.**

---

## Task 18: Flip the default and validate

- [ ] **Step 1:** Set `CONTENT_BACKEND=payload` as the default.
- [ ] **Step 2:** Run the full parity suite across every route and all four locales.
- [ ] **Step 3:** Deploy to a Vercel **preview** and validate rendered pages there — the `setRequestLocale` incident proved local probes miss production-only failures, and the proof came from `vercel logs`.
- [ ] **Step 4:** Leave the flag in place for one release as the rollback, then remove it in Phase 4.
- [ ] **Step 5: Commit.**

---

## Blockers Task 18 must clear before flipping the default

**1. JSON-LD gets a relative image URL under Payload.** `app/[locale]/(main)/news/[slug]/page.tsx:120` passes `newsPost.image?.asset?.url` straight into `articleJsonLd`. Under Sanity that is an absolute `cdn.sanity.io` URL; under Payload it is a relative `/payload-api/media/…`. Next absolutises `openGraph.images` but **not** raw JSON-LD, so `Article.image` becomes unusable to crawlers. The same file absolutises `url` one line above via `NEXT_PUBLIC_SITE_URL`, so the pattern is already there. The fix is in `app/`, which Tasks 6–14 do not touch — Task 18 owns it.

**3. Raw `asset.url` bypasses the OG sizing decision in at least two `app/` files.** Task 7 decided the Open Graph image should be the `max1200x675` WebP derivative, because the one document with an `ogImage` is a 3840×2160 PNG that risks crawler size ceilings. But that decision lives in `metadata.ts`'s `generatePageMetadata`, and other routes bypass it:

- `research-outputs/[slug]/page.tsx:40` — `images: ro.image?.asset?.url ? [ro.image.asset.url] : []`
- `news/[slug]/page.tsx:120` — the JSON-LD case in blocker 1 above

Verified **not a regression**: both backends serve the full-size original there, and Next absolutises `openGraph.images` (the parity run shows `http://localhost:3000/payload-api/media/file/oceaniajpg.jpg`). But it means those routes emit a full-size original as their social card on either backend. Task 18 owns whether to route them through the sizing decision; the fixes are in `app/`, which Tasks 6–14 do not touch.

**2. The image group carries a Payload media row beside a Sanity-shaped `asset`.** Task 4's `resolveMedia` refuses an `_id`, and the news card gates on `asset._id`. Task 14 will meet this on every page surface, and the cleaner fix belongs in `payload-image-source` rather than per reader. Settle it before `pages.ts`, not during.

## Open questions for the user, raised by the swap but not caused by it

**1. Case-study filter chips count published-but-unapproved documents.** `getCaseStudyFilterTags` and `getCaseStudyFilterCommunities` count *published* case studies regardless of approval — that is Sanity's `references()` semantics, and Task 12 preserved it. Restricting them to approved would drop the list page from **29 tag chips to 24**, `mental-health-support` from 18 to 16, and the ESEA community from 5 to 4.

They return aggregates only, never a case-study field, so the two pending documents' *content* stays private either way — this is a count that reflects them, not an exposure. **Preserving today's behaviour is correct for this phase**, whose premise is that nothing user-facing changes. Whether to tighten it afterwards is a product decision, not a migration one.

**2. Lived experiences have never appeared in "For You" recommendations.** See the Task 13 section above: the union explicitly lists the type and returns zero of them, because the unset-status branch is news-post-only. Reproduced rather than fixed. Admitting all 56 would be visible.

## A visible change the locale collapse creates: `ogImage` on three URLs

**Measured:** Sanity holds **36 `page` documents and exactly one has an `ogImage`** — `page-toolkits-en`. Payload collapsed those 36 into 9 documents × 4 locales, and **`ogImage` is a single non-localized column**, so the English toolkits image now applies to `es`, `fr` and `ar` too.

At cutover, `/{es,fr,ar}/research-and-action/toolkits` change six `<meta>` tags each: the site default (1200×630) becomes the real image (1200×675). 14b could not have seen this — it verified `/about`, which has no `ogImage` at all.

Three URLs, and arguably an improvement: localized pages gain a real social card instead of a generic fallback. But it **is** a user-visible change, and this phase's premise is that there are none. **Accept it or make `ogImage` localized in Payload (which needs a migration) — the user's call, not an implementer's.**

## Depth is a relationship count, not a nesting count

14c found that 14b's `depth: 1` left every grid-agenda card missing its cover image, type badge and file size. **Payload counts only relationships toward `depth`**, so a page whose blocks reference documents that themselves carry uploads needs **`depth: 3`**.

This is invisible to a unit test — the query succeeds and returns a document, just a hollow one. It surfaced only in the render. **14d inherits it:** the homepage's eleven slots and `regionalCommunityPage`'s `contentGrid` reference the same document types through the same block shapes.

## A GROQ spelling bug that Payload silently fixes

`outputs.ts` uses `tags[]->{…}[_id != null]` in **six places**. That subscript does not filter the array — it applies a boolean to each *projected object*, so GROQ answers `[null, …]`. Verified directly:

```
regionalCommunities[]->{_id,name}[_id != null]  ->  [null]
regionalCommunities[]->{_id,name}               ->  [{_id: "regional-community-…", name: {…}}]
```

So those six sites have silently returned nulls in production. Harmless where the field is unpopulated (tags and organizations are 0/29 on agendas), but **14 of 29 agendas carry `regionalCommunities`**, and those have been dropping real data.

**Payload's arm returns the documents**, so the swap *fixes* it — which makes this a user-visible change at cutover, in the direction of showing content that was being lost. Task 14d fixed it inside `homepageAgendas`; **`getAgendasByRegion` still needs checking, and Task 11's `outputs.ts` arm may already diverge here.**

**Decide before cutover:** accept the fix (content appears where it was silently dropped) or reproduce the nulls to keep the swap invisible. The first is almost certainly right, but it is a behaviour change and belongs to the user.

## The near-miss: one read would have deleted 22 published documents

Task 15 translated GDPR erasure and found the `drafts.` id problem is not theoretical. Sanity's raw perspective returns `X` and `drafts.X` as **two ids**; Payload has **one id and a version history**. So a single drafts-visible read cannot tell "this user has an unpublished draft" from "this user has a published document with newer edits pending".

**Measured: 22 rows are `_status=published` with a `latest` draft version on top — 21 lived experiences and 1 case study.** A `queryRaw` read reports all 22 as `"draft"`. Classifying retention from that one read would have **deleted 22 published documents**, including the published parents of the 21 in-flight moderation drafts.

The fix is to split Sanity's single read into **two, each answering its own question**: `queryRaw` (drafts visible) enumerates what the user authored; `queryLive` (published-only) decides what is retained. Using `queryRaw` for the retention decision is the Phase-1 authorization bypass exactly — the wrong primitive for a decision, invisible in the result shape.

Retention was proved three ways and **none of them by deleting**: unit tests on the partition; a read-only replay of the reader's real descriptors against the live database, where the two reads were observed **disagreeing on a live document**; and the same queries against `production_2`, giving identical erasure sets on both backends.

## Two corrections and a gap from Task 15

- **`lib/rate-limit.ts` was a phantom in my list.** Its only `queryRaw` is `prisma.$queryRaw` — raw SQL against the `RateLimit` table. It never imports the seam. My file list came from a textual grep that matched the name. Three files changed, not four.
- **8 pre-existing test files fail under `CONTENT_BACKEND=payload`** — `content-{case-studies,discovery,illustrations,lived-experiences,onboarding,regions,system,taxonomy}` — because they assert their Sanity arm by leaving the flag *unset* and reading the ambient env. That is **184 failures Task 18 must not read as regressions**; they need per-test flag pinning, not fixes to the readers.
- **`lib/utils/sanity-prisma-sync.ts` is an unswapped external reader in no task's list.** Found by Task 15, owned by nobody. Assign it before cutover.

## Writing to the dev Payload database is allowed — the earlier blanket ban was too broad

Tasks 9–16 were each told not to write to the database. That was over-cautious, and it created a real gap: **no write path had ever executed against Payload**, so every write moved in this phase rests on mocked primitives.

The reasoning that justifies relaxing it:

- `payload_cms` on the **dev** Neon branch is **entirely derived**. Sanity is read-only for the whole phase and remains the system of record; the Phase 0 archive is on disk and checksummed.
- The imports are **idempotent and proven** — repeated runs report `created: 0, skipped: 395` for assets and `created: 0, updated: 382` for documents.
- So the 21 in-flight moderation drafts are a *copy*, not unique work. Worst case is re-running `pnpm import:documents` and `pnpm import:drafts`, which takes minutes.

**The policy, from here:**

- **Writing to the dev Payload database is allowed** when it verifies something mocks cannot — a create that must satisfy real column constraints, a minted `id`/`slug`, an `afterChange` hook actually firing.
- **Prefer a document the test creates and removes** over mutating imported rows.
- **Before a destructive test** (anything that deletes), confirm the affected rows are reproducible by import, and record the counts to restore to: 347 media · 48 files · 381 documents · 30 draft-latest (21 lived experiences · 4 authors · 1 each of caseStudy/tag/newsPost/testimonial/regionalCommunityPage).
- **Still never:** write to Sanity; `migrate:fresh` (PostGIS `spatial_ref_sys`, 8,500 rows); or touch a production Payload database (which does not exist yet — Task 2).
- **Restore and verify afterwards**, and report the counts.

This closes the gap in-phase rather than deferring all write verification to Task 18.

## What the first real writes found, within an hour of lifting the ban

Task 16 was the first task permitted to write. Four findings **no mock could have produced**:

1. **`draft: false` does not publish.** `_status` defaults to `"draft"` and Payload never forces `"published"`, so an approval **read back as approved and stayed invisible to every anonymous caller**. Editors would have approved content that never appeared. This is the single most consequential defect found in Phase 3, and it was invisible to 2,263 passing tests.
2. **An outbound email inside `afterChange` held the write's transaction open** until Neon killed it with `25P03`. Now bounded by a 10s ceiling — **bounded, not fixed**; moving the send out of the transaction is a design decision left to the user.
3. `overrideAccess: false` is genuinely enforced (403 without a user).
4. `revalidateTag` throws outside a request context.

**Task 9's open question, answered: the two resubmission paths disagree.** `updateSubmission` (lived experiences) passes `draft: true`; `updateCaseStudySubmission` passes **no** `draft` flag, so it publishes. Harmless today only because the same write sets `moderationStatus: "pending"`, which fails the public gate. The asymmetry belongs to Tasks 9 and 12 — **Task 18 must decide whether it is intended.**

**`livedExperiences` has no reachable moderation actions.** The field is 0/56 populated and the Studio gate matched nothing, so the Payload port is faithful — but the workflow is **dead today**, on both backends. Worth knowing before anyone reports it as a migration regression.

**A near-miss worth recording:** one real `emails.send` was attempted against a real user's address, because booting Payload re-runs `dotenv` and restored the `RESEND_API_KEY` the script had deleted. The request never completed (that was the transaction hang) and the domain is unverified, so nothing was delivered. The agent disclosed it unprompted and hardened the script — it now deletes the key *after* boot and gives probes a submitter matching no Prisma user. **Any future live test that can send must assume env is restored at boot.**

## Phase 3 exit criteria

- [ ] All 138 exports served by Payload; all 111+ test files green against both backends
- [ ] `compareRoute` reports no difference on every enumerated route in `en`/`es`/`fr`/`ar`
- [ ] The 14 write paths write to Payload; the 4 moderation workflows run as hooks
- [ ] Algolia stays in sync through hooks, verified against a non-production index
- [ ] Sanity is still readable and still untouched — Phase 4 decommissions it
- [ ] A production Payload database exists, migrated, imported and verified

## Owed to Phase 4, discovered during Phase 3

**38 authored onboarding leaves will be lost at decommission, and that is a decision rather than a discovery.** Sanity's English `onboardingContent` populates **104** leaves; the six Payload globals populate **66**. Measured in Task 8: every one of the 38 differences is read by nothing — scalars stored where the schema declares containers, keys no component asks for (`navigationTexts.{finish,next,previous,skip}` has zero readers repo-wide), and three names the components read under a different spelling. **For every path a component actually reads, both backends resolve to the same string, or both to nothing.**

So nothing regresses at cutover. But those 38 leaves are real authored text that exists only in Sanity and in the Phase 0 archive, and deleting the dataset ends them. Confirm that is intended before Phase 4 drops it.

**Dead read chains to clean up:** `fieldPlaceholders` and `reviewFieldLabels` are confirmed absent from **both** stores, which backs the 46 dead read chains in `components/onboarding/types.ts`. Phase 3 neither serves nor deletes them (obligation 8); Phase 4 should delete them from that type.

## Out of scope

- Deleting Sanity, its schemas, or its Studio (Phase 4)
- Removing the Portable Text renderers in favour of native Lexical (Phase 4)
- The homepage and regional-page remodels — the fixed slots and `contentGrid` are preserved deliberately
