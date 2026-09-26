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

## Shortcut: `pnpm prod:prepare`

Steps 1 to 6 below are also one command, `pnpm prod:prepare` (scripts/production/prepare.ts): it creates the database, pushes the variables from `.env` to Vercel, runs the Payload migrations, the import, `prisma migrate deploy` and the Algolia settings, in that order, and is safe to re-run. `--only=db,env` picks steps; `--admins=` and `--editors=` set the staff roles. It never sets the production `CONTENT_BACKEND` switches and never deploys: steps 5 and 7 stay by hand. The local `.env` already holds `PAYLOAD_DATABASE_URL`, `PAYLOAD_SECRET` and `INTERNAL_SYNC_SECRET` (generated 2026-09-21).

## 1. Production Payload database (Neon, manual)

- [x] (done 2026-09-21 via `pnpm prod:prepare --only=db`) In the existing Neon project, on the **production** branch, create a second database named `payload_cms`. Not Prisma's `goh`: a Prisma reset drops whatever schema it manages.
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

- [x] (done 2026-09-21: nine applied, `migrate:status` all Yes) Payload migrations (nine, including `push_down_indexes` and `tag_suggestions`):
  ```
  PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate
  PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
  ```
- [x] (done 2026-09-21 from `sanity-production_2-2026-09-21.tar.gz`: 395 assets, 389 documents, 31 drafts) Import, in this order (documents refuse to run after drafts exist):
  ```
  PAYLOAD_DATABASE_URL=<prod> pnpm import:assets -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm import:documents -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm import:drafts -- --allow-production
  PAYLOAD_DATABASE_URL=<prod> pnpm verify:import -- --allow-production
  ```
  Record the verify numbers here: 14/14 database checks, 6/6 archive-only (2026-09-21).
  Gotcha found 2026-09-21: before commit 3bb945381 the importers reused any export directory already unpacked under `.sanity-export-cache/`, so a newer archive was silently ignored. Each archive now unpacks into its own directory; if in doubt, delete the cache folder before importing. To re-apply a newer archive over an earlier run: `pnpm prod:prepare -- --only=import --allow-after-drafts`.
- [ ] Read-only order check (proves SQL order equals the old JavaScript order on this database):
  ```
  PAYLOAD_DATABASE_URL=<prod> pnpm tsx scripts/parity/order-check.ts --allow-production
  ```

## 4. Prisma production migration

- [x] (done 2026-09-21) One migration from this branch is pending in production (`20260917120000_collaboration_creator_set_null`):
  ```
  DATABASE_URL=<prod> pnpm exec prisma migrate deploy
  ```

## 5. Preview deploy with the flag on

- [x] (done 2026-09-21 via `pnpm prod:prepare --only=env`; production has every variable except the two CONTENT_BACKEND switches) In the Vercel **preview** environment set `CONTENT_BACKEND=payload` and `NEXT_PUBLIC_CONTENT_BACKEND=payload`, plus the same Payload/R2 variables as production (pointing at the production Payload database, which carries no traffic yet).
- [ ] `vercel` (preview deploy of the branch).
- [ ] Walk `/en` and `/ar`: home, news, case studies list and one detail, lived experiences, research outputs, communities, about, search. Sign in, open `/dashboard`, open `/admin`.
- [ ] `vercel logs <preview-url>` for the walk: no 500s, no `next/headers` or locale errors.

## 6. Search

- [x] (done 2026-09-21) Push the index settings (adds the tag fields):
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
- [x] (done 2026-09-22: admins amit2@pm.me + hello@spiro-spero.zone, team editors e.lawrance@imperial.ac.uk + nikita.nalawade@kcl.ac.uk) Give the editors their roles in the **production** hub database. Verified 2026-09-21: production has **zero** `team_editor` or `admin` accounts, so until this runs nobody can open `/admin`. Two admins, everyone else team editor:
  ```
  pnpm user:role -- --email=<you> --role=admin --execute --env=.env
  pnpm user:role -- --email=<second admin> --role=admin --execute --env=.env
  pnpm user:role -- --email=<editor> --role=team_editor --execute --env=.env
  pnpm user:role -- --list --env=.env
  ```
- [x] (done 2026-09-22; takes effect on the next production deploy) Set `CONTENT_BACKEND=payload` and `NEXT_PUBLIC_CONTENT_BACKEND=payload` in the Vercel **production** environment.
- [ ] `vercel deploy --prod --yes --archive=tgz` (production deploys are manual by repo rule; the tarball upload is the one that works from this machine). 2026-09-22: refused with "Not authorized" for the CLI; team is active Pro, role OWNER, project not paused, so check Deployment Protection / Spend Management, or deploy from the dashboard. Content was re-imported from a fresh export the same hour, so no re-export is needed unless Sanity is edited before the deploy.
- [ ] Repeat the step 5 walk on the production URL; run step 6's rebuild; open `/admin` as an editor and save one document, confirm it appears on the site.
- [ ] Redeploy the Studio once so editors see the read-only "Suggested tags" field while Sanity is retained.

**Rollback:** set both `CONTENT_BACKEND` variables back to `sanity` (or remove them) and `vercel --prod` again. Keep Sanity read-only for one release for exactly this reason.

## 7b. Media direct from R2 (optional, saves Vercel image and function cost)

Today every CMS image and PDF is fetched through Payload's handler at `/payload-api/<slug>/file/<name>` (a Vercel function streaming the object out of R2) and, for images, Vercel's image optimizer on top. Both bill. With a public hostname on the bucket, the browser fetches objects from Cloudflare directly: free egress, edge-cached, and `next/image` leaves them alone (lib/images/next-image-loader.ts). One variable switches it and unsetting it switches back.

CMS uploads currently live in the shared `ccm-collab` bucket under `cms/` (verified 2026-09-21: the bucket holds nothing else yet, but its `members/` prefix is designed to stay private). Public access on R2 is per bucket, so give the CMS its own bucket first.

- [x] (done 2026-09-21) Cloudflare dashboard, R2: create bucket `ccm-cms` in the same account (EU jurisdiction like the existing one).
- [x] (done 2026-09-21, `cdn.connectingclimateminds.org`, TLS live) On `ccm-cms`, Settings, add a **custom domain** on a hostname that is not the hub's own (for example `cdn.connectingclimateminds.org`; the zone has to be on Cloudflare DNS). The `r2.dev` hostname works for a preview but is rate-limited and not for production.
- [x] (done 2026-09-21, token "R2 ccm-collab Token" now covers both buckets) Extend the R2 API token used by `R2_ACCESS_KEY_ID` to cover `ccm-cms` (object read and write).
- [x] (done 2026-09-21: 3759 objects, 0 failed, all carrying the one-year immutable Cache-Control) Copy the objects across (server-side, re-runnable, nothing deleted):
  ```
  pnpm r2:copy-cms -- --to=ccm-cms
  pnpm r2:copy-cms -- --to=ccm-cms --execute
  ```
- [ ] Point Payload at the new bucket and switch on direct serving, in Vercel production (and preview). Both local env files already carry these two lines (2026-09-21); the Vercel side still needs them:
  ```
  PAYLOAD_R2_BUCKET=ccm-cms
  NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL=https://cdn.connectingclimateminds.org
  ```
- [ ] Deploy. Open a content page: image `src` attributes now start with the public hostname and the network panel shows no `/_next/image` or `/payload-api/media` requests for CMS images.
- [x] (done 2026-09-21 by the copy itself; the dry run reports 3759 already carrying the policy) Stamp the cache policy on the copied objects (new uploads get it automatically):
  ```
  PAYLOAD_R2_BUCKET=ccm-cms pnpm r2:cache-control
  PAYLOAD_R2_BUCKET=ccm-cms pnpm r2:cache-control -- --execute
  ```
- [ ] After a week with no missing images, delete the `cms/` prefix from `ccm-collab` by hand.

Old URLs keep working: with the host set, proxy.ts answers `/payload-api/<media|files>/file/<name>` with a 308 to the same object on the public hostname (lib/uploads/legacy-upload-redirect.ts), and the Content Security Policy lists the host under img-src, media-src and connect-src. One deploy-time caveat: pages cached before the switch keep old URLs until they revalidate, which the redirect covers.

SVG note: on the hub's origin, SVGs were served with a sandboxing header. On the bucket's hostname a script inside an SVG would run on that hostname instead, which holds no session; Payload's own SVG validation still runs on upload. Keep the public hostname off the hub's cookie domain if that ever changes.

## 8. After the first week

- [ ] Phase 4: remove the backend switch and the Sanity readers, decommission the Studio.
- [ ] PostHog: build the three dashboards (traffic vs Plausible, onboarding funnel, submission funnel); check event volume against the free tier.
- [ ] Backlog from the hardening plan (research-output and lived-experience search indices, newsletter double opt-in, CSP nonce, …).

## Who can enter /admin

Role comes from the hub database (`User.role`): `admin` and `team_editor` may use the admin and the moderation queue; `community_editor` and `community_member` may not, and see an explanation at `/admin/login`. The only difference between the two staff roles: `admin` also sees the **System** group (Users, raw case-study drafts). The dev database has three team editors (amit2@pm.me, e.lawrance@imperial.ac.uk, nikita.nalawade@kcl.ac.uk) and no admin; production has none of either until step 7 runs. Sign-in is Clerk's; there are no Payload passwords. Change a role with:

```
pnpm user:role -- --list
pnpm user:role -- --email=someone@example.org --role=team_editor --execute --env=.env
```

(`--env=.env` targets production; without it the script uses the dev database.)

## Where things live in /admin (2026-09-21 arrangement)

The nav is grouped by task, in this order. Team editors see the first six groups; admins also see System.

| Group | What is in it |
|---|---|
| **Publish** | Case studies, Lived experiences, Research outputs, Events, News posts, Agendas. Member submissions land here; the dashboard's review queue links straight into the pending ones. |
| **Site pages** | Pages, Community pages, Reader chapters, Testimonials, and the Homepage, Site announcement and Hub illustrations singletons. |
| **People & places** | Authors, Organizations, Regional communities, Projects, External sources. |
| **Tags & vocabularies** | Tags, Work types, Expertise areas, Profile prompts. New tags are created here only, never as free text. |
| **Media** | Media (images), Files (PDFs and other downloads). |
| **Onboarding** | The six onboarding copy singletons: Welcome & navigation, then Steps 1–5. |
| **System** | Comment moderation wordlists (all editors); Users and raw case-study drafts (admins only). |

The editing routine, in five steps: clear the review queue on the dashboard first (approve, request revision with a note, or reject; check the submitter's suggested tags against existing ones); for new editorial content create the English document, fill the required fields, pick existing tags, save as draft; switch locale and translate at least title and summary (untranslated fields fall back to English on the site); publish and check the page, which updates within seconds; suggest new tags only through the Tags collection.

## 2026-09-26 human-friendly forms

Task 18's gates (full test suite, `tsc`, lint of the changed files, a real-library run against the dev database, and signed-out rendered checks) all passed on `feat/payload-migration`; see the task report for numbers. This work adds two additive Payload migrations, not yet on production: `20260926_155648_human_friendly_forms` and `20260926_175525_draft_layout_and_suggestions`.

1. Before deploy — optional pre-check, not a required manual step. `payload.config.ts` sets `prodMigrations`, so production applies any pending migration automatically on the first boot after the deploy in step 3; this only confirms what is pending:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
   ```
   Expect both migrations above listed as not yet run. After step 3's deploy, run the same command again and confirm both show as applied.

   A manual `pnpm exec payload migrate` can hit an interactive "dev mode … data loss" prompt when a stale dev marker is present on the target database; production carried no such marker as of 2026-09-26, so the automatic apply on deploy is expected to go through cleanly without it. If the prompt appears anyway, read what the marker is warning about before answering it — don't answer blind.

2. Topic → tag conversion. Dry run first, against production (read-only; needs `--production` — or the repo-wide `--allow-production` — to pass `scripts/case-studies/topic-to-tags.ts`'s own dev-database guard; either flag works for both the dry run and the execute):
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/case-studies/topic-to-tags.ts --production
   ```
   Read the printed tables before doing anything else:
   - "Mapped slugs with no tag (skipped)" — any slug here has no matching tag in production; add it, or fix the mapping in `lib/case-studies/topic-tag-map.ts`, before executing.
   - The "… case studies have an unpublished draft newer than the saved row, with different tags" warning — each one risks a later draft-publish undoing the conversion; note them for the editors.
   - The "Vulnerable Populations" tag re-filing line, and the table of case studies that would change.

   Only once those are clean, execute:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/case-studies/topic-to-tags.ts --production --execute
   ```

   Separately: check the tag with slug `access-to-education` in the production CMS (**Tags & vocabularies** → Tags). On dev it was found with no label in any language (2026-09-26). If it's still nameless in production, name it — English "Access to Education", Spanish "Acceso a la educación", French "Accès à l'éducation", Arabic "الوصول إلى التعليم" — before or right after the conversion.

3. Deploy (manual, by the user — never run by the agent):
   ```
   vercel --prod
   ```
   Then re-run step 1's `migrate:status` and confirm both migrations now show as applied.

4. Re-index case studies — the conversion above changes `tags` on every affected document:
   ```
   curl -X POST -H "Authorization: Bearer $INTERNAL_SYNC_SECRET" -H "content-type: application/json" -d '{}' https://hub.connectingclimateminds.org/api/search/case-studies/sync
   ```
   `scripts/sync-case-studies-to-algolia.mjs` is the older Sanity-era reindex script and reads Sanity, not Payload; the route above is the one this project's Payload cutover actually uses (same shape as step 6's four-collection loop, run here for case studies alone since that is the only collection this work touches).

5. Manual signed-in checks (the agent cannot sign in to verify these itself):
   1. Start a case study, type two letters in the title, tab away — a plain message appears; finish the title — it disappears.
   2. Press Submit with gaps — the page jumps to the first gap; "What's left" lists the rest; on a phone, the bottom bar shows the count.
   3. Choose العربية — title, summary and story are right-to-left; English title and summary appear.
   4. Search "Lagos" — pick — the name shows, with no numbers; the community is suggested.
   5. Paste `## Findings\n- one\n- two` into the story — a heading and a list.
   6. Add a cover image, leave, reopen from the dashboard — the image, place and language are all still there.
   7. Submit, then open it again from the dashboard while it's pending, change a word, wait 2 s, reload — the change is kept and the status is still "In review".
