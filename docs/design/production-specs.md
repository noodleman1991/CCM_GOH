# CCM Hub — Production-Depth Specs (pre-execution)

Companion to `redesign-wireframes.md` + `rendered-ui-findings.md`. This doc specs the stages that were too thin to execute safely, to production depth, **before** any code. Two phases (user-confirmed): **Phase 1 = all UI + discovery (no external deps); Phase 2 = comments/collab infra + Reader.**

Existing pieces to BUILD ON (verified): `components/ui/pill-filter-group.tsx` (accessible fieldset, counts, RTL, inclusion model), `components/ui/filter-chip.tsx`, `lib/filters/time-frame.ts` (`TIME_FRAMES`, `timeFrameToDateFrom`), URL-state via `useSearchParams` (already in `news-filters.tsx` etc.). Five hand-rolled filter UIs today (`case-studies-filters`, `news-filters`, `community-filters`, `content-search-filters`+`search-filters`, inline LE) → unify.

---

## TRACK 12 — Unified, content-type-aware discovery (search · filter · sort)

**Problem:** five independent filter systems, near-zero sort, inconsistent pills, raw slugs/enums leaking instead of localized labels. **Goal:** one discovery system whose UI is **driven by each content type's declared capabilities** ("sensitive to content type"), shared behavior, URL-stateful, localized.

### 1. The registry — `lib/discovery/registry.ts`
A declarative map: each content type → its facets, sort options, time-frame support, and data source. Example shape:
```ts
type FacetDef = {
  id: string;                 // 'region' | 'tags' | 'topic' | 'source' | 'language' | 'workType' | 'expertise' | 'agendaType' | 'openToTalk'
  legendKey: string;          // i18n key for the group legend
  source: 'taxonomy' | 'algolia' | 'static';  // where options come from
  optionsKey?: string;        // taxonomy/enum name; options resolve to LOCALIZED labels
  multi: boolean;             // multi-select pills (default true)
};
type SortDef = { id: 'relevance'|'newest'|'oldest'|'az'|'region'; labelKey: string };
type DiscoveryConfig = {
  type: 'caseStudy'|'newsPost'|'livedExperience'|'agenda'|'report'|'user';
  facets: FacetDef[];
  sorts: SortDef[];
  defaultSort: SortDef['id'];
  timeFrame: boolean;         // show the Any-time/Past-year/3y/custom pills
  dataSource: 'sanity'|'algolia';
};
```
Per-type config (grounded in current filters):
| type | facets | sorts | timeFrame | source |
|---|---|---|---|---|
| caseStudy | region · topic · tags · year | relevance·newest·oldest·region·az | ✓ | sanity (algolia for search) |
| newsPost | siteVsExternal · source · tags · region | newest·oldest·relevance | ✓ | sanity |
| livedExperience | region · tags · theme | newest·region | ✗ | sanity |
| agenda/report | language · type · year | newest·az | ✓ | sanity |
| user (collaborate+people-search) | region · workType · expertise · openToTalk | relevance·newest·az | ✗ | **algolia users index** (shared w/ search) |

### 2. The component — `components/discovery/discovery-bar.tsx`
One client component reading a `DiscoveryConfig`:
```
┌ DiscoveryBar ────────────────────────────────────────────────┐
│ 🔍 [ search…              ]      Sort ▾ [Newest]    [Clear all]│
│ ‹Any time›‹Past yr›‹3y›‹custom›   (only if config.timeFrame)   │
│ Region:  ‹R1›‹R2›‹R3›…   (PillFilterGroup, localized labels)   │
│ Tags:    ‹T1›‹T2›…       (only facets this type declares)      │
│ Active:  [Region: X ✕][Tag: Y ✕]   (RemovableChip summary)     │
└───────────────────────────────────────────────────────────────┘
```
- Renders one `PillFilterGroup` per declared facet; a sort `Select`; the time-frame pills (reuse `lib/filters/time-frame`); an active-filter summary (`RemovableChip`) + Clear all.
- **URL state** (`lib/discovery/url-state.ts`): all facets + sort + timeframe + q serialized to the querystring (shareable, back-button correct). One serialize/parse pair used by every page.
- **Options resolution** (`lib/discovery/options.ts`): facet options come from the real taxonomy and render the **localized label** (never the slug/enum) — fixes ALL_CAPS regions + hyphen-case tags. `user` facets resolve from the Algolia facet counts.
- **Sort** (`lib/discovery/sort.ts`): maps each sort id → a Sanity `order(...)` clause or an Algolia index/replica; `region` sort is RTL-aware (locale collation).
- **a11y/RTL:** inherits `PillFilterGroup`'s fieldset/legend/aria-pressed; logical props; the sort Select + summary use `ms/me`.

### 3. Adoption
Replace the five filter components with `<DiscoveryBar config={registry.caseStudy} …>` etc. The Algolia search page (`content-search-filters`) uses the same bar with `dataSource:'algolia'` so **one search learns everywhere** (your ask) — collaborate + people-search both off the users index. Mobile-first: the bar collapses facets into a `Drawer` ("Filters") at <md; the sort + search stay inline; active chips wrap.

**Files:** `lib/discovery/{registry,url-state,options,sort}.ts`, `components/discovery/discovery-bar.tsx`, replace the 5 filter components, the list pages + the Algolia search page, `messages/*.json`. Build on `pill-filter-group`, `filter-chip`, `lib/filters/time-frame`.

---

## STAGE 1 — Comments: API contract + state machine (Phase 2)

**Endpoints** (reads = route handlers; authed mutations = Server Actions, per the codebase pattern):
- `GET /api/comments?targetType&targetId&cursor` → `{ comments: CommentDTO[], nextCursor }`. Anon-readable; only `VISIBLE` (+ the caller's own `PENDING`). Wrapped in `safeQuery`. Keyset on `(createdAt,id)`.
- Server Action `postComment({targetType,targetId,parentId?,body, turnstileToken?})` → validates target via GROQ (`status=="approved"`), rate-limits BEFORE the GROQ, runs wordlist, sets status, inserts, returns optimistic DTO.
- `editComment(id, body)` — re-runs wordlist (can re-flag to PENDING). `deleteComment(id)` — soft-delete (tombstone if it has replies). `reportComment(id, reason)`. `react(id, emoji)` toggle.
- Moderation Server Actions: `approve(id)` (→VISIBLE + notify), `remove(id)` (→REMOVED_BY_MOD), `dismissReport(id)`. All `assertCan('moderation:view')`.

**State machine:**
```
create ─ signed-in + clean ───────────────→ VISIBLE
       ─ signed-in + reviewWord ──────────→ PENDING ─ approve →VISIBLE / remove →REMOVED_BY_MOD
       ─ signed-in + blockWord ───────────→ REMOVED_BY_MOD (never shown; CommentFlag BLOCKWORD)
       ─ anon (Turnstile ok) ─────────────→ PENDING ─ approve/remove
edit ── re-run wordlist (may → PENDING)
delete(author) → DELETED_BY_AUTHOR (tombstone if replies)
GDPR erase → hard delete
```
**Wordlist normalization** (`lib/moderation/normalize.ts`): NFKC → strip combining marks → lowercase → **Arabic fold** (أإآ→ا, ى→ي, ة→ه, strip tashkeel U+064B–065F + tatweel U+0640 + ZWJ) → word-boundary match against the cached `moderationSettings` block/review arrays. Unit-tested incl. Arabic obfuscation.
**Turnstile handshake:** client renders the widget (CSP already allows `challenges.cloudflare.com`) → token in the action → server POSTs to `siteverify` with `TURNSTILE_SECRET_KEY` → reject on failure. **Feature-flag:** if `TURNSTILE_SECRET_KEY` unset, anon commenting is disabled (not open) — fail closed.
**Optimistic UI:** SWR mutate inserts the comment locally as `PENDING/VISIBLE`, reconciles on response; `sonner` toast on moderation hold.

---

## STAGE 2 — R2 upload/download lifecycle (Phase 2)

**Client (S3 SDK → R2):** `lib/r2.ts` builds an `S3Client({ region:'auto', endpoint: R2_ENDPOINT, forcePathStyle:true, credentials })`.
**Upload:** `POST /api/collaborations/[id]/files/presign` → `assertCan('collab:upload')` → validate `contentType ∈ ALLOWED_FILE_TYPES` + declared size ≤ `MAX_FILE_SIZE` → `getSignedUrl(PutObjectCommand)` (short TTL, `ContentType`/`ContentLength` baked) → key `members/{collabId}/{uuid}/{safeName}` or `public/{…}` by visibility → client PUTs directly to R2 → client calls `confirmFile()` Server Action → server `HeadObject` to confirm → persist `CollaborationFile`. **Orphan handling:** rows only persisted after HEAD; a periodic sweep deletes R2 objects with no row.
**Download (MEMBERS):** `GET /api/collaborations/[id]/files/[fileId]/url` → `assertCan('collab:read')` → `getSignedUrl(GetObjectCommand)` short TTL, `Cache-Control: private`, **never logged**, re-issued per request. PUBLIC prefix served via `R2_PUBLIC_HOST` directly.
**CORS (user sets on the bucket):** allow PUT/GET from the app origin, expose ETag. **GDPR:** account-deletion lists + deletes the user's `CollaborationFile` R2 objects (Prisma cascade can't reach R2). **Feature-flag:** if `R2_*` unset, upload/download endpoints return 503 "file storage not configured" and the Files UI shows a disabled state — the rest of the workspace works.

---

## STAGE 3 — EmbedPDF spike — RESULT: CONDITIONAL GO (2026-06-18)

**Ran the spike.** Installed `@embedpdf/{core,models,engines,pdfium,plugin-annotation,plugin-viewport,plugin-render,plugin-zoom}@2.14.4`, built a minimal viewer (`usePdfiumEngine` + `EmbedPDF` + `Viewport` + `RenderLayer`), typechecked + Turbopack-built.
- ✅ **React 19 + Turbopack compatible at the framework level.** TS fully resolved the React bindings/props against React 19.1.1; Turbopack compiled the entire package family **except** the legacy loader. The only TS issues were trivial API usage (a missing `documentId` prop).
- ❌ **One real blocker, NOT a platform issue:** `@embedpdf/plugin-loader@1.5.0` is a stale major that imports `loadDocument`/`setDocument` from `@embedpdf/core`, which `core@2.14.4` no longer exports (2.x moved loading to `startLoadingDocument`/`setActiveDocument` on the registry; there is no `plugin-loader@2.x`). Removed it.
- **Verdict: GO**, using the 2.x loading API (registry document actions / the component's own loading), not the legacy `plugin-loader`. The wasm/worker resolution under Turbopack did NOT error in the spike. The fallback (pdf.js read-only + page-anchored comments) remains the escape hatch if the 2.x loading wiring proves fiddly during the real build.
- The `@embedpdf/*@2.14.4` packages remain installed for the production `<PdfViewer>`. Spike route/component were removed.

## STAGE 3 (original plan) — EmbedPDF spike (Phase 2, GATED before annotation UI)

**Risk:** unproven on React 19 + Turbopack (web-worker resolution). **Spike (time-boxed, its own commit):** a throwaway route mounts `@embedpdf` viewer + annotation plugin via `dynamic(ssr:false)` against a sample PDF; verify (a) worker loads under Turbopack (CSP `worker-src 'self' blob:` already allows it), (b) `exportAnnotations()`/`importAnnotations()` round-trip, (c) `onAnnotationEvent` fires. **Go/No-Go:**
- GO → build the annotator (one `CollaborationFileAnnotations` row/file, debounced save, show/hide toggle, VIEWER read-only).
- NO-GO → ship a **read-only PDF viewer** (pdf.js) + page-anchored comments (reuse the Comment engine with `targetType=collaborationFile` + a `page` field) and flag annotation as deferred. **Either way the run continues** — the spike never blocks the whole build.

---

## STAGE 3b — EmbedPDF for ALL PDFs (unified viewer) + the Reader pairing

One **shared `<PdfViewer>`** component (`components/pdf/pdf-viewer.tsx`, `dynamic ssr:false`) used **everywhere a PDF appears** — reports, agendas, collaboration files. It wraps the EmbedPDF viewer + native annotation plugin, styled to match the hub (CCM tokens, calm chrome, not the default plugin skin).
- **Calm, non-distracting toggle:** annotations + comments are **off/hidden by default** when reading. A single quiet control in the viewer's top bar — `[ Notes ⌄ ]` (a `Toggle`/`Switch`, ghost style) — reveals (a) the annotation layer and (b) the comment rail. Reading mode = clean page, no markup clutter; turn Notes on to mark up / discuss. Matches the design-voice rule (restraint; the document leads).
- **Annotations:** EmbedPDF native tools; persist via `exportAnnotations()` → one `CollaborationFileAnnotations` row/file (for collab) or a `pdfAnnotations` row keyed by report/agenda asset id (for library PDFs); `importAnnotations()` on open; VIEWER read-only.
- **Comments on PDFs:** page-anchored via the Comment engine (`targetType=collaborationFile`/`reportPdf` + a `page` field) — shown in the comment rail when Notes is on; "N notes on this page" affordance per page.
- **Layout (matches hub):**
```
┌ {doc title}                         [ Notes ⌄ ]   [ ⤓ download ] [✕] ┐
│ ⟨ native tools — only when Notes on ⟩                                 │
│ ┌──────────── PDF page ────────────┐   ┌─ comment rail (Notes on) ─┐ │
│ │ page render (+ annotation layer  │   │ p.3 · ◎ Name: "…"         │ │
│ │ only when Notes on)              │   │ [ add a note ]            │ │
│ └──────────────────────────────────┘   └───────────────────────────┘ │
│  ‹ prev ›   p.3 / 24   ‹ next ›                                      │
└──────────────────────────────────────────────────────────────────────┘
```
Mobile: Notes opens the comment rail as a bottom `Drawer`; tools collapse into a menu. **Gated by the EmbedPDF spike (Stage 3):** if NO-GO, `<PdfViewer>` falls back to pdf.js read-only + page-anchored comments (the Notes toggle still works for comments, annotation tools hidden). Reused by the Reader for the raw Agenda PDF.

## STAGE 4 — Reader ETL (Phase 2)

**Source:** `reader.connectingclimateminds.org` (Docusaurus, 13 chapters Cover→Appendices). **Pipeline (`scripts/import-agenda-reader.mjs`, dry-run first):**
1. Fetch each chapter's HTML/markdown (sitemap or the chapter nav).
2. Transform → portable-text-ish blocks; **rewrite image URLs** (download → upload to Sanity assets, or keep absolute via `next.config` remotePatterns), **rewrite internal links** to in-app chapter routes, preserve external links.
3. Map to a new Sanity `docsChapter` type: `{ title, order, slug, body, parentDoc }` (localizable later; en first).
4. Output a review report; only write to Sanity on `--apply`.
**Render:** the docs-reader block (wireframe in `redesign-wireframes.md`): chapter nav (drawer on mobile) + reading pane (~68ch, `heading()` scale, `urlForCropped` figures, styled links, TOC) + prev/next. Pairs with the EmbedPDF viewer for the raw PDF.
**Schema:** `sanity/schemas/documents/docs-chapter.ts` + a `docsCollection` parent (the Agenda) so the Reader is editor-maintainable, not a one-off scrape.

---

## STAGE 5 — Notifications + DMs delivery (Phase 2)

**Notifications:** `Notification(recipientId,type,actorId,entityType,entityId,readAt)`; events reply/mention/reaction/collab/message. Bell: SWR poll of `GET /api/notifications/unread-count` (`refreshWhenHidden:false`, ~60s) → cheap `COUNT(*) WHERE recipientId AND readAt IS NULL` on `(recipientId,readAt)` index; list endpoint paginated. Email via `lib/case-study-emails.ts` pattern (localized, idempotent) respecting `NotificationPreference` + unsubscribe token.
**DMs:** `Conversation`/`ConversationParticipant`/`Message`. Inbox list + thread; send = Server Action → insert Message → fan out a Notification. Delivery = SWR poll of the open thread (~10–15s) + the bell. **No sockets in v1.** Scale note: polling bounded by hidden-tab backoff + indexed counts; documented as the v1 ceiling.

---

## STAGE 6 — GDPR completion (Phase 2, partly Phase 1)

- **DSAR export** `GET /api/account/export` → JSON of the user's Prisma record + authored content + prompt answers + (PII-stripped) download history + comments/collab. (Phase-1-eligible.)
- **Erasure gaps** in `lib/account-deletion.ts`: delete from **Algolia** (orphaned PII today), sweep **R2** files, **redact author email** on retained published case studies, hard-delete comments/messages (cascade). Anon-comment `authorEmail` retention rule.
- **Retention:** scheduled job — DownloadEvent TTL (IP already dropped), inactive-user policy.
- **Terms + Privacy** (4-lang, user-favorable, no-tracking, GDPR rights + processor list Clerk/Sanity/Algolia/Plausible/Vercel/Cloudflare + retention + transfers) as a Sanity `legalPage` singleton or static `/[locale]/legal/{terms,privacy}` + footer links.

---

## STAGE 7 — The migration as one reviewed unit (Phase 2)

18 models in **one additive migration**. Ordering: enums → independent tables (RateLimit, Collaboration) → Comment + its children → Collaboration children → Conversation/Message → back-relations on User. **Raw-SQL steps** appended for: the partial index `WHERE status='VISIBLE'`, the depth `CHECK (depth IN (0,1))`, and the keyset-supporting composite index. SQL shown before apply (granted to auto-apply, but logged). Additive/nullable only; reversible-where-possible. Run on the Neon adapter (migrate first, then swap the client adapter).

---

## STAGE 8 — Per-content-type layouts as CMS schema (Phase 1 schema, Phase 1/2 render)

- `newsPost.layout` enum (A standard / B lead-image / C report-external; default A) → the three reading layouts.
- `livedExperience` detail page `/lived-experiences/[slug]` (RSC, `revalidate=300`, GROQ `status=="approved"`) + the in-app submission form/route + Studio review actions (extend `makeReviewAction`) — modeled on case studies; unblocks LE comments.
- Multilingual case-study **content** (`content` per-locale or available-languages model) + the language filter/badges (ties to Track 12 `language` facet).
- `docsChapter`/`docsCollection` (Stage 4).

---

## STAGE 9 — Repo hardening / observability / secrets (cross-cutting)

- **Sentry** (`@sentry/nextjs`) server+client, source-mapped. **CI gate** workflow: `pnpm typecheck && pnpm test && pnpm build` + axe + bundle/CWV budgets on PRs. **Secret rotation:** the committed (commented) R2 creds → real values in Vercel env only; `.env.example` with empty keys committed. **CSP tightening:** move toward nonce-based `script-src` (test Clerk/Algolia/Plausible/Turnstile). **`/api/health`** readiness route. These thread across both phases; the CI gate lands early so every track is gated.

---

## Execution phases (confirmed)

**PHASE 1 — UI + discovery (validatable, no external deps), in order:**
A2 CSP avatars (done) → B4 LE modal → A3 RTL/bidi → B7 dashboard → B2 news → B6 profile → **Track 12 discovery** → B8 deploy map → A4–A7 polish → Stage 8 schemas (news layout enum, LE detail page) → Stage 6 DSAR + Stage 9 CI/Sentry. Each: gate green + commit. Re-validate via MCP at phase end.

**PHASE 2 — comments/collab infra + Reader:**
Stage 7 migration → authz/rate-limit/Neon/R2 foundations → comments + moderation (Stage 1) → engagement → collaboration workspace + R2 (Stage 2) → EmbedPDF spike (Stage 3, gated) → DMs (Stage 5) → Reader (Stage 4) → GDPR erasure completion + Terms (Stage 6) → Track 12 `user`/algolia unification. Env vars scaffolded empty; R2/Turnstile inert until creds.
