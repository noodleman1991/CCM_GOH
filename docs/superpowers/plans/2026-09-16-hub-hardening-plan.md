# Hub Hardening Plan — 2026-09-16

Branch `feat/payload-migration`, 608 commits ahead of `master`. Production still runs `a8ad0c5` from 2026-08-15. Sanity is the live backend; Payload is complete in dev and dormant behind `CONTENT_BACKEND`.

This plan merges a 51-agent audit (feature inventory per area, adversarial verification of every claimed gap, a frontend polish sweep of 338 files, four best-practice reviews, two designs) with a completeness critic's corrections. The raw synthesis and the critic's pass are kept verbatim in `2026-09-16-hub-audit-raw.md`; the two designs are `2026-09-16-posthog-integration-design.md` and `2026-09-16-list-reader-pushdown-design.md`.

**How to read it.** Sections 1–4 are findings. Section 5 is the delivery order, one slice per checkpoint. Section 6 is the list of decisions only you can make; several slices wait on one of them.

---

## 0. Already done this week (uncommitted unless stated)

Committed: `7d9f631a5` upload access + random filenames · `eaa9e0865` cache revalidation on every content write · `843806d0a` import/dev runs can no longer reach production Algolia, Resend or R2.

In the working tree, tested and live-verified on a dev server: moderation side effects (email, `notifiedStatus`, `revalidatePath`) run after the write commits; the moderation hook fires paths only, the generic hook owns tags; SVG responses are sandboxed and every file response carries `Cache-Control`; anonymous REST reads are capped at 100 rows and depth 3; GraphQL is disabled and its routes deleted; anonymous `/payload-api` requests are rate-limited 60/min by IP (static files excluded). Gates: `tsc` clean, 137 files / 2406 tests green.

---

## 1. Feature map (92 features)

| Status | Count | Meaning |
|---|---|---|
| working | 37 | all infrastructure present and wired |
| partial | 28 | a path is stubbed, silently falls back, or misbehaves |
| flagged-off | 14 | behind `NEXT_PUBLIC_FEATURE_ENGAGEMENT`, unset in production |
| dead-code | 8 | unreachable or without consumers |
| missing-infrastructure | 5 | UI exists, something it needs does not |

Verified verdicts override the inventory's first pass (33 claims checked, 27 held, 6 refuted). The full per-feature table with evidence is in the raw file; what follows is the part that changes what you do.

**Content.** Case studies, lived experiences, news, static pages, homepage, regional pages, atlas and legal pages work. Case-study submission is *partial*: the outcome email is recorded as sent even when Resend rejects it. Research outputs and agendas are *partial*: agenda download counters never increment (the button posts to the report tracker), the sitemap emits 116 dead agenda URLs, research outputs have no download tracking and no search index. Lived-experience **moderation is dead on both backends** (no reachable action, per the Phase 3 record). Download analytics routes are dead code. Content search indexing is *partial*: the boot manifest checks `ALGOLIA_ADMIN_KEY`, a name nothing reads, so boot always reports Algolia disabled.

**Community.** Comments, follows, the moderation queue, settings and the retention cron work. Everything under the engagement flag (workspaces, threads, files, media, plans, docs, outputs, project pages, events, direct messages, in-app notifications, broadcast) is *flagged-off* but **leaks**: with the flag off, the Collaborate hub still renders create/message/connect buttons that create real rows and then redirect home; server actions are not gated; notification emitters keep writing rows that retention never purges. Contact requests re-open DECLINED and downgrade ACCEPTED to PENDING. Only 3 of 14 notification types email. The weekly digest is blocked by `CASE_STUDY_EMAIL_FROM` being unset, not by `CRON_SECRET` (that claim was refuted: the secret is set on Vercel). Event reminders fail open without a secret.

**Identity.** Sign-in, onboarding reminders, public profiles, dashboard, profile editing, integrations import and account settings work. **Onboarding can delete an existing user on email conflict** (`complete/route.ts:301-318`). Clerk `user.deleted` skips the GDPR deletion helper and cascades the user's workspaces. The "add recent work" pages cannot succeed (server-action fetch without cookies). The submissions dashboard's Edit and Continue buttons are inert and View 404s. Member directory `/profiles` is a dead redirect. The manual Clerk sync route has an IDOR on `targetUserId` and no callers.

**Platform.** Search is *partial* with a **privacy gap**: MEMBERS and PRIVATE profiles are indexed and the browser key can read them; the news search webhook's signature check is bypassable (`isValidSignature` not awaited); any signed-in member can trigger a full re-index, and an unset secret matches `Bearer undefined`. Newsletter signup 500s on every submit (`RESEND_AUDIENCE_ID` blank everywhere). Transactional email leaves Resend's sandbox sender because `CASE_STUDY_EMAIL_FROM` is unset in production (the domain itself **is** verified). Turnstile keys are set but production predates the widget commit, so anonymous comments fail today. Sentry has no DSN in any Vercel environment. Cookie consent's only "change preferences" control lives in an unmounted footer, so consent cannot be withdrawn. SEO lacks hreflang, uses `en_US` OG locale everywhere and canonicals without the locale prefix.

**Surfaces the first pass missed** (added by the critic): Sanity Studio and its four moderation actions (how content is approved today), the Payload admin at `/admin` (live in production already), the editors' guide, the chart/mermaid "data & story" editor blocks with their server-side SVG sanitiser, profile prompts, the geocoding proxy, onboarding content routes, `/api/communities` (zero callers), and `/api/me/role`.

---

## 2. Infrastructure gaps that block production (ranked)

1. **Every build writes to production Sanity and re-indexes the live Algolia index.** `package.json` `build` runs `create-all-outputs-pages.mjs` (`createOrReplace` on four Sanity pages with the editor token) and `postbuild` runs a full search sync against `NEXT_PUBLIC_SITE_URL`. pnpm 10 runs `postbuild` by default, so this fires on every Vercel build, including previews, and in CI with `Bearer undefined` when the secret is unset. The Phase 3 record already says "never run it". **Strip both hooks first, make re-index an explicit command, then preview-deploy.**
2. **Outbound email is sent from Resend's sandbox sender.** Set `CASE_STUDY_EMAIL_FROM` in Production and Preview. Pair with Slice 3 (read the `{error}` result) or failures stay invisible. Also: `newsletter/route.ts:5` constructs the Resend client at module scope, so a missing key throws at import.
3. **Production is four weeks stale.** Anonymous comments fail with a misleading message today. Preview after Slice 0, production after Slice 2a.
4. **No error monitoring.** Create the Sentry project; set `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`. Code side in Slice 12.
5. **Newsletter 500s.** Create the audience and set `RESEND_AUDIENCE_ID`, or hide the block (Decision 10).
6. **`INTERNAL_SYNC_SECRET` unset in production.** Set it, and fix the code so an unset secret refuses (Slice 2a).
7. **Environment manifest is wrong in both directions.** `lib/env.ts:16` checks `ALGOLIA_ADMIN_KEY` (dead name) and reports R2 disabled when only the canonical `R2_*` set is present. `.env.example` omits `ADMIN_API_KEY`, `ALGOLIA_INDEX_PREFIX`, `NEXT_PUBLIC_APP_URL`, `OPENALEX_MAILTO`, `ORCID_API_BASE`, `PAYLOAD_REVALIDATE_SECONDS`, `SANITY_REVALIDATE_SECONDS`, `R2_PUBLIC_URL`, `SENTRY_ORG`, `SENTRY_PROJECT`, `CONTENT_BACKEND` and its 17 domain switches. Its Resend comment still says the domain is unverified. (Correction to the first pass: `CLOUDFLARE_R2_BUCKET_NAME`, `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES` **are** read.)
8. **Payload production boot has no assertions.** `PAYLOAD_DATABASE_URL`/`PAYLOAD_SECRET` default to `""`. And the production Payload database does not exist yet (Phase 3 Task 2), which is a prerequisite for Decision 12, not just a missing check.
9. **`NEXT_PUBLIC_APP_URL` is a third base-URL variable** pointing local dev at production. Retire with the add-work pages.
10. **Vercel plan tier.** The hourly reminders cron (`vercel.json`) is rejected on Hobby. Check once; daily is the fallback.
11. For the record: rate limiting runs on the Postgres fallback in production (no Upstash) and the route helper fails **open** when the limiter errors; cron auth is split (digest and retention fail closed, reminders fail open); the Algolia token route mints a real key per hour with no cleanup.

---

## 3. Best-practice findings that matter

All confirmed against source unless marked plausible.

### High

| # | Finding | Where | Fix |
|---|---|---|---|
| H1 | Resend returns `{data, error}` and never throws; every sender but issue-report ignores it, so 403s are logged as sent, `notifiedStatus` is burned, `digestSentAt` is stamped | `lib/notifications/email.ts:103,179`, `lib/case-study-emails.ts:231,237`, `lib/comment-notifications.ts:74` | One `lib/email/send.ts` that destructures `{error}` and returns a typed result; stamp only on success. **Consumer inside `payload/hooks/moderation.ts` and its hook test must be in the file list.** |
| H2 | News search webhook signature check bypassable: `isValidSignature()` not awaited | `app/api/search/news/webhook/route.ts:27` | `await`; test a garbage signature → 401 |
| H3 | Any signed-in member can trigger a full re-index; unset secret matches `Bearer undefined`; GET leaks counts | four `app/api/search/*/sync/route.ts` | `bearerMatches()` helper (false when unset, timing-safe) or staff check; gate GET; consult `liveIndexWritesAllowed()` |
| H4 | Browser search key can read MEMBERS and PRIVATE profiles | `lib/algolia.ts:338-350`, `app/api/search/token/route.ts:62-67` | Index only `profileVisibility === 'PUBLIC'` (Decision 7); `unretrievableAttributes` |
| H5 | Self-webhook and Clerk-sync side effects are un-awaited fetches with no `after()`, no `res.ok`, `localhost:3000` fallback | `app/api/webhooks/clerk/route.ts:168,284,335`, `app/api/profile/route.ts:328-342` | Call the indexer directly inside `after()` |
| H6 | Transient Algolia failure on an approved case study **deletes it from the index** and returns 200 | `app/api/search/case-studies/webhook/route.ts:72-102` | Delete only on transform error; 5xx on write error. Sanity-only, pre-flip. |
| H7 | Every `(main)` route is request-dynamic (`getActor()` + `draftMode()` in the layout), so 11 `revalidate` exports and 8 `generateStaticParams` are dead | `app/[locale]/(main)/layout.tsx:27-28` | Decision 6 |
| H8 | Onboarding deletes the pre-existing user on email conflict | `app/api/onboarding/complete/route.ts:301-318` | 409 + log both ids; never delete in a request path |
| H9 | No route-handler, cron, proxy or component tests; vitest node-only; no coverage | `vitest.config.ts:7` | jsdom for components; route tests for crons and mutating routes; coverage reporter |
| H10 | CI never runs on the feature branch | `.github/workflows/ci.yml:4-6` | run on all branches — **only after 2a is in production** (see gap 1) |
| H11 | 12 modules with zero importers (~1,900 lines) plus 8 dead search components and the legacy header/footer | `lib/services/community.service.ts`, `lib/utils/sanity-prisma-sync.ts`, `lib/user-sync.ts`, … | Delete. `sanity-prisma-sync.ts` is the unassigned Phase 3 reader: deleting it **is** the assignment, and it must land before cutover. |
| H12 | `getLocalizedText` implemented 9 times with different fallbacks; `agenda-utils.ts`/`report-utils.ts` are 259-line clones | `lib/localization-utils.ts:24` and 8 copies | Keep one; codemod the rest |

### Medium (act on)

M1 IDOR in `/api/sync/clerk` (delete it). M2 onboarding validates `workTypes` as free strings (→ 500), matches P2002 on `error.message`, awaits Clerk outside try/catch. M3 Clerk `user.deleted` skips `deleteUserData()`; `Collaboration.createdBy onDelete: Cascade`. M4 agenda download counters dead and the track routes are unauthenticated read-modify-writes. M5 anonymous comment rate limit keyed on attacker-chosen `authorName`. M6 draft autosave: raw JSON to CMS, no schema, size cap or rate limit. M7 contact-request upsert re-opens DECLINED and downgrades ACCEPTED. M8 no outbound fetch has a timeout (Nominatim, Turnstile, ORCID, OpenAlex). M9 retention cron returns `ok: true` on total failure; digest loop has no per-user try/catch. M10 five GET handlers export `revalidate` but read `searchParams`, so nothing is cached and no `Cache-Control` is sent. M11 ~20 locale-less `redirect()` and 27 hand-built `/${locale}` links. M12 metadata: empty CMS titles render " | Connecting Climate Minds", OG locale `en_US`, no `alternates.languages`, canonical without prefix. M13 the full 110–142 KB message catalogue is serialised to every page. M14 1s/3s `setTimeout` inside the dashboard render. M15 `draftMode()` inside the data layer. M16 ESLint parses gitignored `.next-parity-*` dirs (never finishes). M17 SWR fetcher redefined 12 times. M18 10 exported server actions with no callers are live public endpoints. M19 1,397-line `ProfileEditForm`, 989-line case-study form. M20 case-study/agenda search webhooks accept Bearer only while the setup doc configures no header. Plus 12 one-line lows in the raw file.

---

## 4. Frontend polish (166 findings, 338 files)

By lens: 71 hardcoded English strings, 27 responsive, 24 accessibility, 22 overflow, 17 RTL, 5 char-limit. By severity: 23 high, 78 medium, 65 low.

**Fix once, centrally (Slice 14):**

- **P1 Shared truncation.** ~25 flex children holding user or CMS text lack `min-w-0` + truncation. Give `Badge`, `FilterChip`, `RemovableChip` a max width and `title`; add a `TitleRow` primitive (`min-w-0 flex-1 break-words line-clamp-2` + trailing `shrink-0` slot) and a `QueryEcho` for search-term echoes.
- **P2 One char-limit map** (`lib/validation/limits.ts`) consumed by client zod, server zod, input `maxLength` and a live counter. Today case-study title/excerpt/author/organisation and profile social platform are unbounded on both ends; headline/bio/lived-experience/research-output/onboarding fields are capped server-side only; collaboration `InlineText` has no `maxLength` and returns English error strings. Add a parity test.
- **P3 Logical CSS for RTL.** The document already sets `dir`, so every `isRTL && "flex-row-reverse"` un-mirrors: 48 instances in onboarding alone, plus dashboard, profile edit, sidebar. Delete them; `rtl:-scale-x-100` on directional chevrons; replace literal `→`; direction-agnostic scroll math in the region spine; lint rule.
- **P4 Responsive dialog primitive** (Drawer below `sm`, Dialog above, `max-h-[92dvh]`, safe-area padding): case-study modal, cookie banner (Save unreachable on landscape phones), video modal, PDF dialog; `dvh` for `h-screen` sites; atlas legend to static flow at 360px.
- **Shared i18n/a11y helpers:** `taxonomyLabel`, `regionLabel`, `enumLabel`, `<RelativeTime>` (5 unlocalised `formatDistanceToNow`), locale-required `formatDate`, ICU plurals for every `{n} noun` / `'s'` concatenation (one produces "استودیوies" style output in es/fr/ar), `useFormatter().number()`, `IconButton` with a required label and 40px hit area (10 unlabeled toolbar buttons, a 28px phone nav opener), hover-only reveals → focus-visible and `hover:none`, single `<main>`, `PageHeader`, `FormRow`, skeleton widths, palette → tokens (8 featured badges use `bg-yellow-500`).

**Highest-severity per-surface items:** written/audio stories render as a **disabled button with no link** (`video-card.tsx:70-78`); English-only country names on region pins; English topic chips although all four catalogues carry the keys; server-rendered event dates in the server's default locale; the workspace header squashes the title to 0 at 360px; card components with inline `{en,es,fr,ar}` dictionaries; `case-studies-listing.tsx` has no importers and should be deleted. The full per-surface list is in the raw file, section 4.

---

## 5. Delivery plan (corrected order)

Gates for every slice: `pnpm tsc --noEmit`, `pnpm vitest run <touched tests>`, eslint on changed files only, and the rendered check named. Each slice ends at a checkpoint you look at before the next starts. Sizes: S ≤ half a day, M ≤ 2 days, L is split before it starts.

**Slice 0 — Commit what is built and defuse the build (S).** Commit the working tree (moderation after-commit, SVG/cache headers, read cap + GraphQL off, proxy rate limit) as separate commits. Remove the `build` prescript and the `postbuild` hook; document the manual re-index command. Checkpoint: you review the commit list and the four curl outputs; **preview deploy**, so every later slice has a URL.

**Slice 1 — Environment truth (S).** `lib/env.ts` (right names; `CLERK_*`, `SEARCH_WEBHOOK_SECRET`, `CRON_SECRET` required in prod; `REQUIRED_WHEN_PAYLOAD`), `.env.example` (add the missing set, rewrite the Resend comment, document `CONTENT_BACKEND`), and the Vercel variables you set: `CASE_STUDY_EMAIL_FROM`, Sentry ×4, `INTERNAL_SYNC_SECRET`, `RESEND_AUDIENCE_ID` or block removal. Test first: every documented key is read somewhere; every read key is documented. Checkpoint: `vercel env ls production` output; Decision 10 resolved.

**Slice 2a — Close the re-index and webhook holes (S).** `await` the news webhook signature; `bearerMatches()` used at all 15 secret comparisons; sync routes staff-or-secret with GET gated and `liveIndexWritesAllowed()`. Test first: garbage signature → 401; non-staff POST → 403; unset secret → 401. Checkpoint: four curls against the preview; **production deploy here**, because it closes the CI/build re-index hole and the live Turnstile failure together.

**Slice 2b — Email that tells the truth (M).** `lib/email/send.ts`, the three senders, weekly digest (stamp only on success, per-user try/catch, summary), Sanity webhook 500 on email error, retention 500 on failure, and the moderation-hook consumer with `payload-moderation-hook.test.ts` as a gate. Checkpoint: a status email lands in a non-owner inbox; Resend dashboard row.

**Slice 3a — Deletions (S, Decision 9).** `/api/sync/clerk` + `lib/user-sync.ts`, `/api/user/me`, `/api/community/*`, `/api/communities`, `/api/search/counts`, `/api/cache/revalidate` or key it, `/profiles`, `dashboard/profile/[username]`, the add-work pages, `sanity-prisma-sync.ts`, dead components (H11).

**Slice 3b — Rate limits and schemas (S).** IP-keyed anon comment limit; limits on report/reaction/follow/export/track routes; drafts route schema, size cap and limit; analytics routes staff-gated; reminders cron fail closed.

**Slice 3c — Contact-request state machine (S).** Never touch ACCEPTED; re-open DECLINED only after N days; rate limit; persist requester state. Own test file.

**Slice 4 — Search privacy (M).** Index PUBLIC profiles only; delete on visibility change; token route rate limit; no delete on transient error; index in `after()`. Checkpoint: anonymous and signed-in search on the preview; a MEMBERS test profile appears in neither.

**Slice 5 — Identity data safety (M).** Onboarding 409 on conflict, `z.enum`, `error.code`, Clerk update and indexing in `after()`; Clerk `user.deleted` → `deleteUserData`; side effects in `after()` with `res.ok`; `sync-image` URL allow-list. **No schema change here.** Checkpoint: both flows watched in Prisma Studio.

**Slice 5b — `Collaboration.createdBy` (S, Decision 15).** `SetNull` + ownership handoff, Prisma migration; `prisma migrate status` against production first (two-databases note applies).

**Slice 6 — Engagement flag consistency (S–M, Decision 4).** OFF: gate every CTA and the server actions behind it. ON: `?tab=` handling, `MessageReport` in the queue, sidebar entry, notification pagination, retention of unread rows. First jsdom component test. Checkpoint: every remaining CTA on the preview lands somewhere real.

**Slice 7a — Dead links and inert buttons (S).** Submissions dashboard Edit/Continue/View; case-study URL prefix redirect; sitemap agenda specs dropped (Decision 11); agenda search URLs; reader CTA; `follow.contract.USER` key ×4.

**Slice 7b — Recent-work write path (S).** Carry `hidden`/`pinned` through profile save with update-in-place. Data-affecting, so on its own.

**Slice 8 — Agenda download tracking (S–M).** Route agenda buttons to the agenda tracker (or Postgres `DownloadEvent`), delete the `report` family, pass `userId` to `<Blocks>` or drop the unreachable members level. Checkpoint: click twice, see 2.

**Slice 9 — List-reader push-down (L, per design; one domain per checkpoint).** Pre-work: per-test `CONTENT_BACKEND` pinning in the 8 content test files (184 known failures), and `sanity-prisma-sync.ts` deleted (Slice 3a). Then `case-studies` → `discovery` → `page-feeds` → `news` → `outputs` → `system`, with the design's `select` projections, pushed `where`/`sort`/`limit`, the tie-break kept only among tied rows, indexes on `moderationStatus`/`publishedAt`/`featured`, and React `cache()` on the primitives. Checkpoint per domain: the read-only parity diff on the dev database is empty.

**Slice 10a — SEO and the Phase 3 metadata blockers (M).** `localizedAlternates`, canonical with prefix, OG locale map, empty-title guard, `siteUrl()`, `robots.ts`; absorb the two Phase 3 Task 18 items (relative JSON-LD image on news, raw `asset.url` OG on research outputs); `og.png` labels via `getTranslations`. Checkpoint: view-source of `/ar/news/<slug>`.

**Slice 10b — Rendering model (M, Decision 6).** Delete dead `revalidate`/`generateStaticParams`/timeout or move auth and draft mode out of the shared layout; explicit perspective in `cached-fetch`; `Cache-Control` on map APIs; dashboard sleeps → upsert; message-catalogue `pick`; missing `loading.tsx` files.

**Slice 10c — Navigation (S).** `redirect`/`Link` from `@/i18n/navigation`; proxy matcher; `hasLocale` guard; `sanity-button` Link.

**Slice 11 — PostHog and consent re-entry (M, per design; Decisions 1–3, 5).** Opt-in only (no script until Accept), EU host, same-origin reverse proxy, `person_profiles: identified_only`, session recording off, Clerk id not email, server events through the after-commit helper, event taxonomy from the design. Plus: mount the cookie-preferences control in the sidebar footer and on `/legal/privacy`, name the vendor in `lib/legal/content.ts`, label the banner switches. Checkpoint: DevTools network on reject vs accept; reopen preferences; `/ar` banner at 640×360 scrolls to Save.

**Slice 12 — Reliability and observability (S–M).** `lib/errors/report.ts`, error boundaries call it, `AbortSignal.timeout` on every outbound fetch, the ~20 best-effort catch blocks log, reminders idempotent per recipient. Checkpoint: a deliberate error appears in Sentry.

**Slice 13 — Polish primitives (L → 13a limits + form splits, 13b truncation, 13c RTL sweep + lint rule, 13d responsive dialog + `dvh`).** Checkpoint per sub-slice: side-by-side screenshots en/ar at 360px and 1280px.

**Slice 14 — i18n sweep by surface (L → 14a helpers + grep guards that may warn until each surface is done, 14b blocks/cards, 14c case studies/atlas/reader, 14d collab/comments/events/messaging, 14e onboarding/forms/profile/dashboard + pages).** Checkpoint per surface: the `/ar` and `/fr` version of every touched page at 360px shows no English except proper nouns.

**Slice 15 — Quality gates (M).** CI on all branches (after 2a is in production), husky pre-push typecheck, eslint ignores `.next*/**`, delete `.eslintrc.json`, `eslint --fix` + ratchet, `knip` non-blocking, orphan server actions, `getLocalizedText` consolidation, `lib/swr.ts`. Checkpoint: first green CI run on the branch.

**Backlog (value, not launch-blocking):** research-output and lived-experience search indices and status emails; research-output download counts; export includes CMS-authored content; newsletter double opt-in and public unsubscribe; broadcast batching and email kind; remaining notification email kinds; image magic-byte sniff; CSP nonce; `report` type removal from the Sanity schema; community join/leave UI; `Content.author` restrict check on the prod DB.

---

## 6. Decisions for you (recommendation in bold)

1. PostHog alongside or instead of Plausible? **Instead**, after a two-week overlap on preview. One vendor, one consent toggle, one privacy sentence.
2. PostHog host EU? **Yes.**
3. Session recording? **Off at launch.** If later: analytics consent only, masked inputs, never on messages/dashboard/moderation/onboarding/sign-in.
4. Engagement features ON or OFF at launch? Your June note calls them core. **ON only after Slices 2b–5 land**; until then OFF with Slice 6's gating so rows stop being created behind a redirect.
5. Pre-consent analytics load? **Opt-in only** for PostHog; if Plausible stays even briefly, say so in the privacy copy.
6. Rendering model? **Accept dynamic now** and delete the dead ISR config; revisit with `cacheComponents` after the Payload flip.
7. Algolia profile privacy? **Stop indexing non-PUBLIC profiles**; members-only people search already exists as a Prisma query.
8. Onboarding email conflict? **409 + log both ids.**
9. Delete the unused surfaces (Slice 3a list)? **Delete all**; git keeps them.
10. Newsletter: create the Resend audience or hide the block? **Hide the block** until double opt-in and a public unsubscribe exist.
11. Sitemap agenda URLs: build the route or drop the spec? **Drop the spec** and redirect the prefix.
12. When does `CONTENT_BACKEND` flip? **After Slice 9 and the moderation live check, domain by domain**, as the Phase 3 plan describes. Prerequisite: the production Payload database (Phase 3 Task 2).
13. OG/hreflang codes? **`en_GB, es_ES, fr_FR, ar_SA`, `x-default → en`.**
14. Deploy cadence? **Preview after Slice 0, production after Slice 2a, then production after every checkpoint.**
15. `Collaboration.createdBy` cascade → `SetNull` + handoff? **Yes**, in its own slice with a production migration you approve.
16. Vercel plan tier: confirm the hourly cron is accepted; otherwise reminders become daily.
17. *(From Phase 3, still open)* Accept the `ogImage` locale collapse on the three toolkit URLs? **Accept.**
18. *(From Phase 3)* Accept the GROQ subscript fix that makes `regionalCommunities` appear on 14 of 29 agendas at cutover? **Accept.**
19. *(From Phase 3)* Case-study resubmission publishes while lived-experience resubmission stays draft. **Make both draft** unless there is a reason not to.
20. *(From Phase 3)* 38 authored onboarding leaves that nothing reads will be lost at Sanity decommission. **Accept**, after exporting them once.

---

## 7. Not verifiable from the repo

Vercel env *values* and plan tier; live Sanity webhook configuration; whether the Clerk session token exposes `publicMetadata` (the middleware onboarding gate depends on it); whether `docsChapter` documents exist in production; production DB contents for `Content.author`; whether Prisma 6's error message text contains "P2002".
