# Payload production runbook

Everything between the `feat/payload-migration` branch and a production cutover, in the order it has to happen. Written 2026-09-21 against the state verified that day: production runs the August deploy from `master` on Sanity; the Vercel production environment has none of the Payload, R2, backend-switch or search-sync variables; the dev Payload database (Neon `lucky-waterfall`, `payload_cms`) is complete and verified.

Every command runs from the repo root. `<prod>` means the production value. Commands that can touch production refuse to run without an explicit flag; the flag is spelled out where it is needed.

## 0. Before starting

- [ ] A fresh Sanity export in `backups/sanity-production_2-<date>.tar.gz`. The import always reads the newest archive in that folder. To make one (read-only, ~10 minutes, ~650 MB):
  ```
  SANITY_AUTH_TOKEN=<read token> pnpm exec sanity dataset export production_2 backups/sanity-production_2-$(date +%F).tar.gz
  ```
- [ ] Decide the editorial freeze: no Sanity edits between the export and the flip (step 7), or they are lost.
- [ ] Decide whether the branch is promoted as-is or merged to `master` first. Production's database already matches this branch's Prisma migrations, not `master`'s.
- [ ] Decide whether the engagement features stay hidden at launch (`NEXT_PUBLIC_FEATURE_ENGAGEMENT` unset = hidden).

## 1. Production Payload database (Neon, manual)

- [ ] In the existing Neon project, on the **production** branch, create a second database named `payload_cms`. Not Prisma's `goh`: a Prisma reset drops whatever schema it manages.
- [ ] Take the pooled connection string and change `sslmode=require` to `sslmode=verify-full`.

## 2. Vercel production variables

Set with `vercel env add <NAME> production` (paste the value when prompted), or in the dashboard. Do **not** set the two `CONTENT_BACKEND` variables yet — that is step 7.

| Variable | Value | Needed for |
|---|---|---|
| `PAYLOAD_DATABASE_URL` | from step 1 | Payload reads, writes, `/admin` |
| `PAYLOAD_SECRET` | `openssl rand -hex 32` | Payload's own auth/cookies |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | the values in the local production env file | media and files |
| `INTERNAL_SYNC_SECRET` | `openssl rand -hex 32` | the search rebuild routes refuse without it |
| `CASE_STUDY_EMAIL_FROM` | a verified sender on the domain | otherwise Resend's sandbox sender |
| `RESEND_AUDIENCE_ID` | from Resend, or hide the newsletter block in the CMS | newsletter route answers 503 without it |
| `NEXT_PUBLIC_POSTHOG_KEY` | from the PostHog **EU** project; also switch on "Discard client IP data" there | product analytics (optional at launch) |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | from Sentry | error monitoring (optional) |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | from Upstash | rate limiting (optional; Postgres fallback) |

Already present: `CRON_SECRET`, `SEARCH_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`, Clerk, Sanity, Algolia, `DATABASE_URL`.

## 3. Schema and content into the production Payload database

Run these locally with the production URL in the environment for the command only.

- [ ] Payload migrations (nine, including `push_down_indexes` and `tag_suggestions`):
  ```
  PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate
  PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
  ```
- [ ] Import, in this order (documents refuse to run after drafts exist):
  ```
  PAYLOAD_DATABASE_URL=<prod> pnpm import:assets -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm import:documents -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm import:drafts -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm verify:import -- --allow-production
  ```
  Record the verify numbers here: ___ database checks, ___ archive-only.
- [ ] Read-only order check (proves SQL order equals the old JavaScript order on this database):
  ```
  PAYLOAD_DATABASE_URL=<prod> pnpm tsx scripts/parity/order-check.ts --allow-production
  ```

## 4. Prisma production migration

- [ ] One migration from this branch is pending in production (`20260917120000_collaboration_creator_set_null`):
  ```
  DATABASE_URL=<prod> pnpm exec prisma migrate deploy
  ```

## 5. Preview deploy with the flag on

- [ ] In the Vercel **preview** environment set `CONTENT_BACKEND=payload` and `NEXT_PUBLIC_CONTENT_BACKEND=payload`, plus the same Payload/R2 variables as production (pointing at the production Payload database, which carries no traffic yet).
- [ ] `vercel` (preview deploy of the branch).
- [ ] Walk `/en` and `/ar`: home, news, case studies list and one detail, lived experiences, research outputs, communities, about, search. Sign in, open `/dashboard`, open `/admin`.
- [ ] `vercel logs <preview-url>` for the walk: no 500s, no `next/headers` or locale errors.

## 6. Search

- [ ] Push the index settings (adds the tag fields):
  ```
  pnpm tsx scripts/algolia/push-index-settings.ts --allow-production
  ```
- [ ] After the flip (step 7), rebuild the four live indices from Payload:
  ```
  for r in case-studies news agendas users; do
    curl -X POST -H "Authorization: Bearer $INTERNAL_SYNC_SECRET" -H "content-type: application/json" -d '{}' https://<site>/api/search/$r/sync
  done
  ```
- [ ] Delete the three Sanity search webhooks in Sanity's dashboard once the rebuild is confirmed.

## 7. Cutover

- [ ] Editorial freeze begins. If the export in step 0 is older than an hour, redo steps 0 and 3.
- [ ] Set `CONTENT_BACKEND=payload` and `NEXT_PUBLIC_CONTENT_BACKEND=payload` in the Vercel **production** environment.
- [ ] `vercel --prod` (production deploys are manual by repo rule).
- [ ] Repeat the step 5 walk on the production URL; run step 6's rebuild; open `/admin` as an editor and save one document, confirm it appears on the site.
- [ ] Redeploy the Studio once so editors see the read-only "Suggested tags" field while Sanity is retained.

**Rollback:** set both `CONTENT_BACKEND` variables back to `sanity` (or remove them) and `vercel --prod` again. Keep Sanity read-only for one release for exactly this reason.

## 8. After the first week

- [ ] Phase 4: remove the backend switch and the Sanity readers, decommission the Studio.
- [ ] PostHog: build the three dashboards (traffic vs Plausible, onboarding funnel, submission funnel); check event volume against the free tier.
- [ ] Backlog from the hardening plan (research-output and lived-experience search indices, newsletter double opt-in, CSP nonce, …).

## Who can enter /admin

Role comes from the hub database (`User.role`): `admin` and `team_editor` may use the admin and the moderation queue; `community_editor` and `community_member` may not, and see an explanation at `/admin/login`. Sign-in is Clerk's; there are no Payload passwords. Change a role with:

```
pnpm user:role -- --list
pnpm user:role -- --email=someone@example.org --role=team_editor --execute --env=.env
```

(`--env=.env` targets production; without it the script uses the dev database.)
