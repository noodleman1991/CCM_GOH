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
MessagePrivacy FOLLOWERS/CONTACTS tiers (needs enum migration — batch with next
migration release) · THEME follow surface (product decision) · nonce-based CSP
(architectural; unsafe-inline stays until then).
