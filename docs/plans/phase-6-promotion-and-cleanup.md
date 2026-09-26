# Phase 6 — Promotion runbook + cleanup (B5)

Phase 6's risky changes were built and validated **staging-first** and are
**NOT yet promoted to production**. This is the runbook to promote them (needs an
explicit go-ahead — each step touches prod) and the cleanup that follows a soak.
Nothing here is destructive yet: `agenda` and `researchOutput` (and the legacy
`report` references) intentionally coexist via dual-read until promotion + soak.

## 1. Staging-validated, awaiting prod promotion

| Change | Built/validated on | Prod action to promote |
|---|---|---|
| Prisma region enum → short codes (`20260624120000_region_codes_short`) | Neon dev branch (data preserved) | `prisma migrate deploy` on prod |
| agenda → researchOutput content migration | Sanity `development` dataset (29 docs) | run `scripts/migrate-agenda-to-research-output.mjs --apply` against `production_2` |
| Algolia region/theme facets + reindex | `case_studies_staging` index | `setSettings` + reindex the prod `case_studies` index (sync script, default index name) |

### Pending prod Prisma migrations (applied on dev, NOT prod)
Deploy these together on the next prod release (oldest → newest):
1. `20260618111701_message_delete_report`
2. `20260621172334_recent_work_hide_pin`
3. `20260622120000_user_sanity_person_id`
4. `20260622130000_follows`
5. `20260622140000_join_contact_requests`
6. `20260622150000_event_rsvp`
7. `20260622160000_plans_tasks`
8. `20260623120000_collaboration_docs`
9. `20260624120000_region_codes_short`  ← the Phase-6 enum rename

All are additive/nullable except #9 (a value rename via `ALTER TYPE … RENAME
VALUE`, which preserves rows). Run in a low-traffic window; `prisma migrate
status` first; keep a DB snapshot.

**2026-08-20 addendum:** later migrations through
`20260820120000_comment_body_rich` (messaging tiers + USER follows +
authorEmail drop + bodyRich — all additive except the authorEmail column
drop, which purges anon-comment emails by design) are APPLIED on the
lucky-waterfall instance (`.env.local`). At prod promotion run
`prisma migrate deploy` against the prod `DATABASE_URL` as step 1 — it
applies everything pending in order. Note the stray empty
`20260728120000_issue_reports/` dir was removed (issue reporter is
email-only; the dir broke `migrate deploy` with P3015).

### Promotion order (recommended)
1. **Prisma** `migrate deploy` (region enum + the 8 earlier additive migrations).
   The app already reads short codes everywhere (B3); deploying the rename aligns
   the DB. *No app downtime — the enum values change, code already expects them.*
2. **Sanity** agenda → researchOutput on `production_2` (idempotent; backs up the
   source agendas first; deterministic ids). Then backfill region codes on prod
   content: `scripts/backfill-region-codes.mjs --apply` (point env at prod).
3. **Algolia** reindex prod `case_studies` (faceting + region/theme fields).
4. Smoke-test: /atlas counts + content cards, case-study detail, search facets,
   region member counts. Keep the pre-migration exports as rollback.

## 2. Dual-read paths to KEEP working until retirement

These still query the legacy types and must keep working during the transition
(do NOT remove yet):
- `app/sitemap.ts` — lists `agenda` + `report` URLs (and now should also list
  `researchOutput` once its public route ships — follow-up).
- `app/api/agendas/download/track`, `app/api/reports/download/track` — download
  tracking for the legacy types.
- `app/api/search/agendas/{sync,webhook}` — Algolia agenda index.
- `sanity/queries/homepage-dynamic.ts` — homepage pulls agendas.
- `region-items` API (D) already dual-matches `region` code OR relatedCommunity
  slug — keep until every doc is backfilled on prod.

## 3. Agenda retirement (post-soak — decision: migrate agenda + remove later)

After promotion + a soak window (suggest ≥2 weeks, content team confirms the 29
researchOutput docs read correctly):
1. Point the public agenda routes/queries at `researchOutput` (the Research &
   Action listing + detail), or 301 the old agenda URLs to the new ones.
2. Move agenda download-tracking to the researchOutput version download counters.
3. Once nothing reads `agenda`, archive/remove the `agenda` documents and the
   `agenda` schema type (and the now-unused `report` type + `report` target on
   the connection object). This is the only destructive step — gated on the soak.

## 4. Remaining Phase-6 follow-ups (non-blocking)
- **LE detail archetype rendering** — the `layout` field exists on
  livedExperience (E1) but its detail page (video-first) doesn't render the
  archetypes yet.
- **Map pin layer** — D ships content cards; literal geopoint pins deferred
  (HTML overlay vs MapLibre — lean overlay first).
- **researchOutput public route** — a `/research-and-action/research-outputs/[slug]`
  detail page (the region-items cards + connection chips already link to it).
- **Pre-existing `/atlas` MISSING_MESSAGE i18n** — ~56 warnings unrelated to
  Phase 6 (region labels resolve correctly); fix separately.
- **themes/populations adoption** — fields exist + are Algolia-faceted (empty
  until content is tagged); wire into the discovery filters when content is
  tagged.
