# Prod-readiness gap closure — 2026-08-18

Audit of all program plans (hub-comments master plan, phase-6 master plan + promotion runbook,
i18n sweep, 11-track roadmap) against the codebase at `a8ad0c57d` (feat/redesign-and-comments).
Gates at start: tsc 0 · vitest 606/606. Each slice below ships green + its own commit.

## Verified already done
Sentry (DSN-gated) · /api/health · CI blocking typecheck/test/build · Sanity webhook
isValidSignature + Clerk svix · sitemap incl. researchOutput + hreflang · CDN caching
(cached-fetch, useCdn, live draft-only) · DSAR export core · account deletion (cascade,
sole-owner transfer, R2 sweep, Algolia users) · dashboard My-tasks · request-to-join ·
events iCal · map pin layer · EmbedPDF annotations · DownloadEvent IP/UA dropped.

## Status (2026-08-18)
All seven slices SHIPPED as commits cc39dc720..04a49956d (security · rate-limit
rollout · Turnstile widget · GDPR · consent honesty · feature gaps · quality
debt + legal parity). Gates green per slice: tsc 0, vitest 606/606, eslint
clean on changed files. Remaining user actions listed at the bottom.

## Wave 3 status (2026-08-20)
User authorized DB actions. Migrations APPLIED to the live lucky-waterfall DB
(tiers/USER-follows/authorEmail-drop + comment bodyRich; stray empty
issue_reports migration dir removed — it broke deploy with P3015). PUBLIC-
workspace flow rendered-validated end-to-end via a temporary visibility flip
(explore link → read-only shell with all tabs, notice, zero edit affordances;
one leak found+fixed: the overview add-output tile now gates on canEdit).
SHIPPED: rich comment composer (sanitized Portable Text — text-level marks +
safe links only, plain body re-derived server-side for moderation/@mentions;
signed-in only, anon keeps textarea+Turnstile; 7 sanitizer tests) · workspace
visibility toggle (OWNER; copy-then-flip-then-delete R2 re-homing between
public/ and members/ prefixes, rollback on copy failure) · notification
snippets as keys+params (structured JSON snippets localized at render; old
prose rows still render verbatim) · i18n round 2 (dashboard ~42 strings with
the hardcoded TOPIC map replaced by CMS-taxonomy translations; profile/account
~45 incl. Zod factories + a whole missing recent-work namespace; grid/metadata
leftovers 13 files + dead nav-projects deleted).

## Slices
1. **Security-critical**: untrack supabase-users.json (692 emails+password hashes; history
   rewrite = separate user decision); lock down Sanity webhook debug GET + drop ACAO `*`;
   wire assertEnv() into instrumentation register; hash anon rate-limit keys; prod CSP
   `unsafe-eval` → `wasm-unsafe-eval` (pdfium needs wasm; dev keeps eval for HMR).
2. **Rate-limit rollout**: assertRateLimit on submission/upload/presign/issue-report/
   profile/account write routes.
3. **Turnstile client widget** in comment-section → anonymous comments actually reachable.
4. **GDPR**: retention cron (DownloadEvent + RateLimit purge, per privacy-policy retention
   section); stop collecting anon authorEmail; erasure sweep for researchOutput/event/
   livedExperience + Resend contact; broaden DSAR export; List-Unsubscribe headers;
   emailWeeklyDigest toggle in settings.
5. **Consent honesty**: Plausible gated on analytics consent; toggle made real.
6. **Feature gaps**: LE detail layout archetypes (project + render); researchOutput listing
   page + research-and-action hub links; Algolia sync emits region/themes/populations
   (facets already configured); grouped-search agenda/researchOutput mislabel fix.
7. **Quality debt**: web manifest fixed + wired (branding, icon paths, metadata.manifest);
   vitest config consolidation (delete dead vite.config.ts); framer-motion → motion/react
   dedupe; remove `install` no-op dep; delete orphaned screenshots + .migration-backup +
   placeholder icons; .env.example backfill.

## Explicitly NOT in scope (user-gated / external)
Prod promotion (runbook exists) · git history rewrite for supabase-users.json ·
Sanity dataset ACL · Algolia search-key rotation · R2 CORS · Resend domain verification ·
~~MessagePrivacy FOLLOWERS/CONTACTS tiers~~ (SHIPPED 2026-08-19 with a USER
follow target; migration file 20260819120000 awaits `migrate deploy` — the
local DB holds real accounts, so applying it is user-gated) · ~~THEME follow
surface~~ (SHIPPED: atlas theme row) · nonce-based CSP — RESOLVED AS WON'T-DO:
per-request nonces force every page dynamic, which is incompatible with this
site's ISR/static pages (baked HTML can't carry a fresh nonce). 'unsafe-inline'
for scripts stays by design until the rendering strategy changes; 'unsafe-eval'
already removed in production.
