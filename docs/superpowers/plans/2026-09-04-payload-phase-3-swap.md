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
| 11 | `outputs.ts` | 1,167 | Holds 2 of the 5 `queryLive` call sites. **Assert the primitive, not just the result** — see below. |
| 12 | `case-studies.ts` | 1,561 | **Maps `moderationStatus` → the public `status`.** `getCaseStudiesByStatus()` must keep working unchanged. |
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

**Audited 2026-09-07:** only `lib/content/internal/payload/lived-experiences.ts` sorts. `taxonomy`, `regions`, `system`, `illustrations` and `onboarding` all build locale maps **without** sorting. It has not surfaced because those routes' flight payloads do not carry a `Localized` object into a client component — latent, not benign.

**Fix it once, in a shared helper under `lib/content/internal/`, not five times.** Five private copies is how the next reader gets it wrong again.

### Tasks 11 and 13 carry the bypass risk

The five `queryLive` call sites all live in these two modules, and **nothing currently asserts they keep choosing `queryLive` after the swap**. That is the exact gap the Phase-1 authorization bypass fell through: `queryLive` and `queryRaw` return the same shape, so a reader that picks the wrong one is invisible to a result-based test.

Both tasks must add a test that asserts **which primitive was called**, not merely what came back — a spy on the source module, or an injected primitive set. A test that only checks the returned documents cannot fail for this.

Related, and now measured: in Payload, `draft: false` is **not** a published-only filter. The main collection tables carry `_status: 'draft'` rows (`tags`, `authors` and `testimonials` each hold one — the never-published drafts), and a `find` with `draft` falsy applies no status filter at all. A published read needs `draft: false` **and** `where: { _status: { equals: "published" } }`. `payload.count` has no `draft` option, so its distinction rides entirely on that filter.

### Task 14 is different

`pages.ts` is more than half the content layer. **Split it before swapping it**: its bulk is per-block projections, and those are what change. Sub-steps:

- [ ] **14a:** Split `pages.ts` by responsibility — one module per block family, re-exported from `pages.ts` so no caller changes. Commit; no behaviour change.
- [ ] **14b:** Swap the page/document readers.
- [ ] **14c:** Swap the block projections, family by family, `compareRoute` after each.
- [ ] **14d:** Swap the homepage (eleven fixed slots) and `regionalCommunityPage` (one parameterised `contentGrid`).

---

## Task 15: Re-point the five external write paths

**The spec says "16 write paths"; the measured figure is 9 files, and only 5 belong to this task.** The other four — `outputs.ts`, `case-studies.ts`, `lived-experiences.ts`, `discovery.ts` — are domain modules, so **their writes move with their own swap** in Tasks 9–13, not here. Splitting a module's reads from its writes across two tasks is what makes a half-moved path write to one backend and read from the other.

**Files:** Modify `app/api/uploads/image/route.ts`, `lib/account-deletion.ts`, `lib/rate-limit.ts`, `lib/actions/sync-user-management.ts`. **Do not touch `app/api/webhooks/sanity/route.ts`** — it is the Sanity webhook receiver and dies in Phase 4; re-pointing it at Payload is meaningless.

**The rule that caused an authorization bypass in Phase 1, restated:** a read feeding a write must not be cached, and `queryRaw` (raw perspective, write client) is not interchangeable with `queryLive` (published, read client). A `drafts.`-prefixed id matching a draft that says `status: "approved"` is exactly how that bypass happened. `queryLive` has 5 call sites today, all inside `outputs.ts` and `discovery.ts`; preserve that distinction when those modules swap.

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
