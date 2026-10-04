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

1. Before deploy — optional pre-check, not a required manual step. `payload.config.ts` sets `prodMigrations`, so production applies any pending migration automatically on the first boot after the deploy in step 2; this only confirms what is pending:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
   ```
   Expect both migrations above listed as not yet run. After step 2's deploy, run the same command again and confirm both show as applied.

   A manual `pnpm exec payload migrate` can hit an interactive "dev mode … data loss" prompt when a stale dev marker is present on the target database; production carried no such marker as of 2026-09-26, so the automatic apply on deploy is expected to go through cleanly without it. If the prompt appears anyway, read what the marker is warning about before answering it — don't answer blind.

2. Deploy first (manual, by the user — never run by the agent). The conversion in step 3 reads the `original_language` column, which only exists once the migrations have run on the first boot after this deploy — so it must come after it:
   ```
   vercel --prod
   ```
   Then re-run step 1's `migrate:status` and confirm both migrations now show as applied. Don't start step 3 until they do.

3. Topic → tag conversion, after the deploy and the `migrate:status` check above. Dry run first, against production (read-only; needs `--production` — or the repo-wide `--allow-production` — to pass `scripts/case-studies/topic-to-tags.ts`'s own dev-database guard; either flag works for both the dry run and the execute):
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

## 2026-09-27 live fixes

Three live-bug fixes on `master` (not a feature branch — this repo's only branch). Full test suite (3203 tests), `tsc --noEmit`, and lint of the changed files all green; verified on the dev server (rendered markup + `curl`) before writing this section. Two of the three audited bugs did not actually reproduce on dev — see the notes under each heading; nothing beyond bug 1's steps below needs to run against production for this batch.

### Bug 1 — atlas embed hidden on regional community pages

Root cause: `scripts/payload-import/lib/transform.ts`'s `buildRegionalCommunityPage` wrote an explicit `enabled: false` for every regional page's `atlasEmbed`, even though no Sanity source document ever set the field (the schema's own comment says "unset" means shown). `lib/content/internal/payload/regional-community.ts` already maps a stored `false` back to `null` on the read side, which is why the atlas was still actually rendering on dev — but the stored value was wrong and the admin checkbox showed unticked, which would confuse an editor and would misfire again the moment the read-side mitigation is ever simplified away. Fixed at all three layers: the transform now leaves `enabled` unset for a missing source value; the field gets `defaultValue: true`; a kept script (`scripts/regional-pages/show-atlas.ts`) turns the checkbox back on for any page where it is explicitly `false`.

This shipped an additive Postgres migration, not yet on production: `20260927_094948_atlas_embed_enabled_default` (`ALTER TABLE regional_pages ALTER COLUMN atlas_embed_enabled SET DEFAULT true`, plus the versions table's mirror column — both nullable columns, no backfill, no data loss).

1. Before deploy — optional pre-check, same as the 2026-09-26 section above:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
   ```
   Expect `20260927_094948_atlas_embed_enabled_default` listed as not yet run.

2. Deploy first (manual, by the user):
   ```
   vercel --prod
   ```
   Then re-run `migrate:status` and confirm the migration now shows as applied.

3. Data fix, after the deploy. Dry run first (read-only; needs `--production` or `--allow-production`):
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/regional-pages/show-atlas.ts --production
   ```
   Read the printed table — every regional community page it lists has the atlas explicitly hidden today. If that list looks right (it was all seven on dev), execute:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/regional-pages/show-atlas.ts --production --execute
   ```

4. Manual check: open a regional community page in production (e.g. `/en/communities/sub-saharan-africa`) and confirm the atlas section renders. It likely already does, same as on dev (the read-side mitigation above) — this step is to confirm the checkbox itself now shows correctly ticked in the admin UI for a page you open there.

### Bug 2 — Central & Southern Asia regional page: did not reproduce

The audit flagged this page as `_status: draft`, on the theory that the public route's published-only reader would then 404 it. On investigation this does not reproduce: reading the collection's **main table row** (`draft: false`, which is what the public route actually does) shows all seven regional community pages, including this one, as `_status: "published"`. The `draft: true` read that surfaces `"draft"` for this one page is fetching the *newest version*, not the published state — this collection genuinely carries one extra unpublished draft **version** on top of its published row (`lib/content/internal/payload/regional-community.ts`'s own comment already documents this as an expected Task 13 import artifact, preserving real unpublished edit history from Sanity). Confirmed live: `curl localhost:3000/en/communities/central-and-southern-asia` returns `200` with the full rendered page (real title, atlas markup, sections) — not a 404, and no different from the other six regional pages.

No fix needed: the page is already published, so nothing was published on DEV, and no fallback-on-404 code was added (the route does not 404 for this page today, so that precondition never triggered). Production action: none required for this specific finding; if you want the unpublished draft *edit* (not the published page) reviewed or discarded, that is an editorial decision in the CMS, not a bug fix.

### Bug 3 — homepage "Lived Experiences Stories" carousel: fixed, dev-only, no DB change

Root cause: the homepage's `livedExperiences` slot is a hand-picked `carousel2` block (`payload/blocks/carousel-2.ts`) and its `testimonial` list is empty on all four language documents (0 of 4 — same finding the block's own code comment already recorded). `components/pages/homepage.tsx` rendered `Carousel2` unconditionally whenever the slot existed, so the section showed its heading over zero cards.

Fixed in code only (`lib/content/homepage-lived-experiences.ts`, wired into `components/pages/homepage.tsx`) — no data or schema change, so nothing to run against production beyond deploying the code: when no testimonials are hand-picked, the section now falls back to the latest ~8 published lived experiences (the same automatic feed the regional community template already uses), keeping the slot's own heading. Hand-picked testimonials still win outright if an editor ever picks any. With no lived experiences at all, the section is hidden rather than showing an empty carousel. Verified on dev: the homepage now renders 8 real lived-experience cards under the heading "Stories of grief, resilience, and hope".

## 2026-09-28 page builder foundation

What shipped (CMS project 1 of 5, spec `docs/superpowers/specs/2026-09-28-page-builder-foundation-design.md`): the section picker gets plain names, six groups and pictures; ten code-only sections become addable on pages (hero with image, FAQs, timeline, image carousel, share-your-story banner, newsletter signup, events calendar, people, region map, atlas); a new **Content feed** section (any mix of case studies, news, events, lived experiences, research outputs and agendas — automatic, your picks first, or only your picks); a "What will show now" panel under each feed; translation status on section rows; **drafts** for pages and the homepage; and **live preview** (phone, tablet, desktop) for both.

Visitors see no change on existing pages: existing sections keep their stored names and fields, and the migration marks every existing page and the homepage published.

One additive Postgres migration, applied and verified on dev: `20260928_130239_page_sections_and_drafts`. It creates the new section tables and the pages/homepage version tables, adds `_status` to `pages` and `homepage` (then sets it to `published` on every existing row), adds relation columns to `pages_rels`, and loosens five NOT NULL constraints Payload requires for drafts (`pages.slug`, and the grid agenda/news references in `pages`/`homepage` blocks). Nothing is dropped or renamed.

1. Before deploy — optional pre-check:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
   ```
   Expect `20260928_130239_page_sections_and_drafts` listed as not yet run.

2. Deploy (manual, by the user):
   ```
   vercel --prod
   ```
   `prodMigrations` applies the migration on boot. Re-run `migrate:status` and confirm it shows as applied. No script to run afterwards.

3. Quick public check (signed out): the homepage and two existing pages (e.g. `/en/about`, `/fr/about`) look exactly as before.

4. Signed-in checklist (staff account, in the production admin):
   1. Open any page → **Add section**: six groups (Openings, Text & media, Content, Maps, Calls to action, Logos & quotes), each section with a picture and a plain name. The regional "Content section" reads "Content section (old)".
   2. Add a **Content feed**. Switch "How to fill it" between the three choices: "My picks" appears only for the two pick modes, and the picker offers only published items. "Upcoming events only" appears only when Events is ticked.
   3. The **What will show now** panel under the feed lists items and updates about half a second after you change a setting. Pick an item, then unpublish that item in another tab: the panel says one pick isn't shown, and the page still saves.
   4. Section rows show their number and plain name. (The "EN ✓ · ES missing" status appears for sections in shared-layout lists, which pages, the homepage and regional pages move onto in projects 2–4 — today's page lists are per language, so they show no status yet.)
   5. Edit a heading and wait: the page saves a **draft** on its own. Signed out in another browser, the live page still shows the published version until you press **Publish**.
   6. Open **Live preview**: switch phone, tablet and desktop; edit a heading and the preview updates after the autosave. Do the same on the **Homepage**.
   7. Close the preview and visit any page as yourself: if a "draft mode" bar shows, use it to leave draft mode.

5. If anything is wrong after deploy: the new sections and the feed are unused until an editor adds them, so nothing public depends on them. Drafts are the one behaviour change for editors — edits now need **Publish** to go live.

## 2026-09-28 homepage on sections

What shipped (CMS project 2, spec `docs/superpowers/specs/2026-09-28-homepage-on-sections-design.md`): the homepage becomes an ordinary Sections list (one layout for all four languages, the opening hero required), its news / agendas / lived-experience parts become Content feeds, three new sections are added (Fresh on the hub, Share-your-story banner, Region map), partner logos come from organisation records and link to new organisation pages (`/<lang>/organizations/<name>`), organisations can be hidden from the site, and staff see an "Edit this section" button on each homepage section. Rarely used section settings (padding, background, colours) fold into "More options".

One additive migration: `20260928_152904_homepage_sections_and_organisations` — new section tables for the homepage (Payload names the ones that repeat an older table `…_2`), `homepage.layout_per_language`, `organizations.show_on_site` (default on), and new relationship columns. Nothing dropped or renamed; the eleven old homepage sections keep their tables and data as the backup.

**Deploying changes nothing a visitor sees**: until the move script runs, the Sections list is empty and the homepage renders its old sections exactly as today.

1. Pre-check:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status
   ```
   Expect `20260928_152904_homepage_sections_and_organisations` not yet run.

2. Deploy: `vercel --prod`. Re-run `migrate:status`; the migration shows as applied. Load the homepage: unchanged.

3. Dry run on production (reads only):
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/homepage/move-to-sections.ts --orgs --production
   ```
   Read, in order:
   - **Partner logos → organisations**: one line per homepage logo, MATCH (an existing organisation) or CREATE (a new one, its logo taken from the current picture). On dev all 20 were sensible; "Climate Cares" matches "Climate Cares Centre".
   - **Organisation names**: RENAME for clipped names whose full name is certain (Cook → James Cook University, Hopkins → Johns Hopkins University, Salle → La Salle University, Khan → Aga Khan University) and HIDE for unclear fragments ("The University", "Federal University"…). Hidden organisations are never deleted and keep any links from content.
   - **New homepage sections**: 14 rows with each heading in en / es / fr / ar.
   - **Values that differed between languages**: expected only the hero button size (larger in English).

4. Execute:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/homepage/move-to-sections.ts --orgs --production --execute
   ```
   Then clear the cache and load the homepage twice (the first response after a clear can still be the old one):
   ```
   curl -X POST https://<site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'
   ```
   A second run refuses ("The homepage already has 14 sections…") unless `--replace` is given.

5. Roll back if needed — the old homepage returns at once, nothing is lost:
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/homepage/move-to-sections.ts --production --revert
   ```
   then clear the cache as in step 4. (Organisations created or tidied stay; they are harmless.)

6. Check, signed out: the homepage in English and Arabic shows every old section plus Fresh on the hub, Share your story and Explore by region; the partner logos show at full size and each opens its organisation page; a hidden organisation's page is "not found".

7. Signed-in checklist (staff account):
   1. Each homepage section on the site shows an **Edit this section** button (not visible signed out); it opens the homepage editor.
   2. The homepage editor shows **Sections** with pictures and plain names; removing the only hero shows "This page always keeps its Hero. You can move it, but not remove it."
   3. Section rows show which languages are missing ("EN ✓ · ES missing…").
   4. Each section's **More options** is folded shut and holds padding/background/colours.
   5. The Logo strip's **Partner organisations** picker lists only shown organisations; add one, Publish, and see it in the strip.
   6. An organisation's **Preview** opens its hub page; setting its type (most new partners are "Other") shows on that page.
   7. Live preview shows the homepage sections at phone, tablet and desktop sizes.

## 2026-09-29 regional communities on sections

What shipped (CMS project 3, spec `docs/superpowers/specs/2026-09-28-communities-on-sections-design.md`): each regional community is one record, edited in one place — **Site pages → Regional communities** now holds the community's page as a Sections list (with drafts and live preview), and the old "Community pages" entry is hidden (its data kept as the backup). Two new sections: **Community header** and **Community members**. Any section can start a chapter in the page's sticky menu ("Show in the page menu as"). Feeds on a community page show that community's content by default. Agenda cards (everywhere) open the agenda's PDF when the agenda is public.

One migration: `20260929_063611_community_records_with_pages` — new section tables for communities (a few enum names shortened to fit Postgres's 63-character limit), drafts columns, and **every existing community marked published** (without that, communities would vanish from the whole site). Three "may be empty" loosenings Payload needs for drafts. Nothing dropped or renamed.

**Deploying changes nothing a visitor sees**: until the move script runs, each community's Sections list is empty and its page renders from the old Community page exactly as today.

What visitors will notice after the move (all intended):
- **Hand-picked items now show.** The old pages never displayed hand-picked cards (the old reader dropped them); the moved feeds show the editors' picks first.
- **Logo strips move to a "Partners" chapter at the end** (they had been landing in Overview near the top by mistake).
- A community may gain a News chapter where the new feed finds news linked to it.
- The members heading reads "Community members".

1. Pre-check: `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status` — expect the migration not yet run.
2. Deploy: `vercel --prod`. Re-run `migrate:status`: applied. Check a case study card still shows its community and `/en/atlas` loads.
3. Dry run (reads only; slow over the network — a few minutes):
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/communities/move-to-sections.ts --production
   ```
   Per community: the section list with its chapter and heading in en/es/fr/ar, any picks that no longer exist, and notes (the welcome/why-join heroes and testimonials are not moved — they were never shown).
4. Execute: same command with `--execute`; clear the cache and load a community page twice:
   ```
   curl -X POST https://<site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'
   ```
   `--only=<slug>` moves one community; a community that already has sections is skipped unless `--replace`.
5. Roll back (all, or `--only=<slug>`): same command with `--revert`, then clear the cache — the old page returns at once.
6. Signed-in checklist:
   1. **Site pages → Regional communities** lists the seven communities; "Community pages" is gone from the menu.
   2. A community's editor shows **Sections** (Community header first) and a folded **Details** group with its name, region, members and contact.
   3. Open a section's **Page menu**: pick a standard chapter or **Custom…** with a label per language; the site's menu follows.
   4. A Content feed on a community page shows that community's items without a filter; setting a Community filter shows that community instead.
   5. **Live preview** opens `/…/communities/<slug>` at phone/tablet/desktop sizes.
   6. On the site, each section has **Edit this section** (staff only), opening the community's editor.

## 2026-09-29 pages on shared layouts

What shipped (CMS project 4, spec `docs/superpowers/specs/2026-09-29-pages-on-sections-design.md`): every regular page (About, Feedback and the seven Research & action pages) gets one **Sections** list shared by all four languages — only the words are translated, the layout is edited once. The old per-language lists are hidden in the editor and kept untouched as the backup. Staff see **Edit this section** on each section of a moved page. Agenda/report cards on shared sections keep their record's own translations (this also applies to the homepage and community pages).

One migration: `20260929_102614_pages_sections` — new section tables for pages and a `layout_per_language` column. Nothing dropped or renamed.

**Deploying changes nothing a visitor sees**: until the move script runs, every page's Sections list is empty and it renders from its old per-language list exactly as today.

What visitors will notice after the move (all intended):
- **Toolkits and Impact reports** show the three download cards in every language (Spanish, French and Arabic had only text columns, without downloads); the card titles come from the report records in each language.
- **About** shows "The Connecting Climate Minds Journey" heading in English too (the other languages already had it). The English heading has no intro line — add one in the editor if wanted.
- The other seven pages look the same in every language.

1. Pre-check: `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status` — expect the migration not yet run.
2. Deploy: `vercel --prod`. Re-run `migrate:status`: applied. Load `/en/about` and `/ar/research-and-action/toolkits`: unchanged.
3. Dry run (reads only):
   ```
   PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/pages/move-to-sections.ts --production
   ```
   Per page: `SHARED` (same in every language) or `ALIGNED TO ENGLISH`, the section list with its heading in en/es/fr/ar, and for aligned pages which sections of the other languages are left out (they stay in the hidden backup). Expected on dev data: 6 shared, 3 aligned (About, Impact reports, Toolkits).
4. Execute: same command with `--execute`; clear the cache, wait a few seconds, and load a page twice:
   ```
   curl -X POST https://<site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'
   ```
   `--only=<slug>` moves one page (e.g. `--only=research-and-action/toolkits`); a page that already has sections is skipped unless `--replace`.
5. Roll back (all, or `--only=<slug>`): same command with `--revert`, then clear the cache — the old per-language page returns.
6. Signed-in checklist:
   1. **Site pages → Pages → About** shows **Sections** (each row with its translation status); the old "Page blocks" list is not shown.
   2. Switch the editor's language to Arabic: the same sections, Arabic text.
   3. **This page has its own layout in each language** exists and is off.
   4. **Live preview** opens the page at phone/tablet/desktop sizes and follows edits.
   5. On the site, each section has **Edit this section** (staff only), opening that section in the editor.

## 2026-09-29 editing that feels natural

What shipped (spec `docs/superpowers/specs/2026-09-29-editor-experience-design.md`):
- **Editing starts on the site.** "Edit this section" (homepage, community pages, regular pages) opens the editor on that section, folds the others, turns live preview on and shows **← Back to the page**. Staff also get **Edit this page** on news, lived experiences, case studies, research outputs and events.
- **Plain words.** "Save without publishing", "Discard my changes", "Editing: English"; a line at the top of every drafts-enabled document says whether visitors see the latest version; missing translations read "Not translated yet: ES, AR — visitors see English".
- **One review queue.** `/moderation` opens on **Waiting for review**: pending case studies, events, lived experiences, research outputs and held/flagged comments, newest first, with Approve / Ask for changes / Reject (a note is required for the last two; only case-study senders are emailed, as before). The staff menu shows the count.
- **Admin home.** Shortcuts (homepage, pages, communities, review queue), the review panel and Recent changes; menu groups renamed Site pages · Hub content · People & organisations · Media · Settings.
- **Community leads.** Staff add leads on a regional community (**Community leads** → search a member → **Publish**). A lead signs into the admin and sees only their community (and Media): they can edit and publish it, but not its members, address, region or leads, and nothing else in the admin. Adding makes their role `community_editor`; removing them from every community returns them to `community_member`. Staff are never changed.

One migration: `20260929_150919_community_leads` — two new tables for the leads list. Nothing dropped or renamed.

1. Pre-check: `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status` — expect the migration not yet run.
2. Deploy: `vercel --prod`. Re-run `migrate:status`: applied. `/admin` loads; `/en/moderation` opens for staff.
3. Signed-in checklist (staff):
   1. On `/en/about` click a section's **Edit this section** → the editor opens on that section with live preview beside it; **← Back to the page** returns.
   2. The top line reads "Everything you see is live."; change a word → "Visitors still see the published version…"; **Discard my changes** puts it back.
   3. The language picker reads "Editing: English".
   4. The admin home shows the shortcuts, the review count and Recent changes.
   5. `/en/moderation`: "Waiting for review" lists what is pending; Reject needs a note; the item leaves the list after a decision.
4. Making a lead (staff): open a regional community → **Community leads** → type two letters of their name or email → pick them → **Publish**.
5. Signed-in checklist (lead — ask the person, or use a test account):
   1. The admin home shows "Your community" with **Edit** and **View on site**; the menu shows only Regional communities and Media.
   2. They can change a section and **Publish changes**; Members, the page address, Region and Community leads are read-only.
   3. Opening another community, a page or the homepage by address is refused.
   4. On the site, their community page shows **Edit this section**; other communities don't.
6. Removing a lead: take them out of **Community leads** and **Publish** — they return to a normal member at once.

## 2026-09-30 one filter system

What shipped (spec `docs/superpowers/specs/2026-09-30-filters-from-real-content-design.md`):
- **Every list filters the same way.** Case studies, news, lived experiences, research outputs (new) and the atlas share one bar: **Region**, **Communities** (audience tags), **Themes** (topic and impact tags), **When**, plus search. Several choices per row; choices in a row match any, rows combine. Each choice shows how many items it finds, and only choices that find something are offered — a tag nearly every item carries (e.g. the lived experiences' four generic tags) is left out because it can't narrow anything.
- **Themes come from the tags content carries.** The fixed atlas list (Displacement, Livelihoods, Youth, Indigenous) is gone, and the tag editor's "use as theme" tick is hidden (its data is kept). To add a theme, tag content with a topic or impact tag.
- **Old links keep working.** `?tags=`, `?theme=`, `?topics=` become Themes or Communities by the tag's kind; `?regions=` and `?communities=<community page>` become Region. An unknown value is ignored rather than an error.
- **Needs tags** on the admin home: per content type, how many items visitors can see have no Themes and how many no Communities tag, each linking to exactly those items. Tagging them is editorial — nothing is tagged automatically.

Nothing to run on production: no migration, no script. After the deploy:
1. `/en/atlas`: the Themes and Communities rows list real tags with counts; "Livelihoods" is gone.
2. `/en/research-and-action/case-studies?themes=drought`: the chip's count equals the results shown.
3. An old link, e.g. `/en/news?tags=<a tag>`, still filters.
4. `/admin` (staff): **Needs tags** lists research outputs and agendas (untagged today); a link opens those items.

## 2026-10-02 regions and partners

What shipped (spec `docs/superpowers/specs/2026-09-30-regions-and-partners-design.md`):
- **Atlas Region row.** All seven regions as equal chips, alphabetical in the reader's language, with the map's own counts; choosing one zooms the map and opens the region.
- **Community carousel** (new section). Every regional community as an equal card — its region, tagline, members · stories · upcoming events, member photos (public profiles only) and a line that cycles the newest story, next event and newest member. Moves gently; stops on hover, keyboard focus or the arrows; never moves for visitors who ask for less motion. Taglines: each community's record → Details → Tagline.
- **Partner logos.** Logo strip gains Funded by / Hosted by (grid layout) and a "One line — scrolls sideways" layout.
- **Region map** gains "Show the latest from each region" (on unless turned off).
- **Filter rows.** Long Themes/Communities rows show six chips and "+N more"; on phones each label sits above its row.

Migrations (all additive, run on deploy): `community_tagline`, `community_carousel`, `logo_wall`, `region_map_stories_switch`.

After the push, run these yourself (dry run first, then `--execute`; each saves a backup in `backups/` and can be undone with `--revert --execute`):
1. `scripts/with-prod-env.sh pnpm exec tsx scripts/homepage/regions-and-partners.ts --production` — homepage: the seven-card grid becomes the Community carousel (heading kept in every language), the region map's latest-from-each-region strip goes off, the logo strip becomes the grouped wall with Wellcome (Funded by) and Climate Cares Centre (Hosted by); community pages' logo strips become one line. If it can't find either organisation it says so and leaves that spot empty — pick it in the admin.
2. `scripts/with-prod-env.sh pnpm exec tsx scripts/organisations/trim-logos.ts --production` — most organisation logos are square white files with the logo in a thin band; this saves a trimmed copy of each as a new picture and points the organisation at it (originals kept).
3. Clear the site cache.

Checklist: `/en` — Explore by region with the Region row and no "Around the regions"; the Community carousel moves and stops on hover; "Who is involved" shows Funded by / Hosted by and evenly sized partner logos. A community page — partner logos in one line with arrows. `/ar` the same, right to left.

Notes: Climate Cares Centre has no logo on its organisation record — upload one and it appears in the Hosted by tile. On dev, new uploads go to a bucket the image address doesn't serve, so trimmed logos can only be seen on production.

## 2026-10-03 events across the hub

What shipped (spec `docs/superpowers/specs/2026-09-29-events-design.md`):
- **RSVP** is open to every signed-in member (no longer behind the engagement switch, which is off on the live site).
- **Visitors.** One events page, `/events`: upcoming events by month in the visitor's own time zone, then past ones with their recordings. CCM's own events and other organisations' sit side by side — an outside event carries an External badge, names its organiser and opens the organiser's website in a new tab. Filters: Region, Communities, Themes, Where it happens, Who runs it, When, search. Each event has its page at `/events/<slug>`, open to everyone (only RSVP still waits for the engagement switch); old `/collaborate/events…` links redirect permanently. Community pages can have an **Events** chapter, the homepage a **Coming up** row, and the atlas an **Events** layer — all upcoming only, all silent when there's nothing coming.
- **Members.** "Suggest an event" (`/events/suggest`): a short form in four parts (what, when, where, who runs it), times typed in their own zone. Their suggestions are listed underneath with what happened to each — Waiting, Approved, Needs changes (with the team's note and an Edit link), Not accepted.
- **Editors.** Suggestions arrive in Moderation like case studies; approving, asking for changes or declining emails the sender. From a suggestion, "Stop this person suggesting events" (and "Allow them again"). **Settings → Event suggestions** turns suggestions off for everyone.

Migration: `events_across_the_hub` (additive — event `origin`, organiser, organiser name, tags; the Event suggestions setting; the Events chapter option) **already ran on production** with an earlier push. Nothing new runs on this deploy.

After the push:
1. `/admin` loads, and **Settings → Event suggestions** shows "Members can suggest events" ticked.
2. **Done 2026-10-03** (run before the deploy — production had no events yet, so nothing showed): `scripts/with-prod-env.sh pnpm exec tsx scripts/events/add-sections.ts --production` — dry run: lists the homepage ("Coming up", second, under the hero) and each community page (the Events chapter, after News). Then the same with `--execute`. A page that already shows events is left alone; `--revert --execute` takes away only what it added.
3. Clear the site cache.

Checklist: `/en/events` (and `/ar/events`, right to left); an old `/en/collaborate/events` link lands on `/en/events`; `/en/events/suggest` signed in shows the form; a community page with an upcoming event shows Events in its menu (one with none doesn't); the homepage shows Coming up once an event is coming; `/en/atlas` has an Events chip.

Email caveat: the Resend domain is still unverified, so outcome emails only reach the one verified address — the "Your suggestions" list on `/events/suggest` is the reliable record until the domain is verified.

## 2026-10-04 my contributions

What shipped (spec `docs/superpowers/specs/2026-10-03-my-contributions-design.md`):
- **Dashboard → My contributions** (`/dashboard/submissions`, same address) lists everything a member has sent — case studies, lived experiences, research outputs, events, and unsent case-study drafts — in sections by what needs doing (Needs your changes, Drafts, Waiting for review, Published, Not accepted), with the team's note and one next step each. Editors also see **Open in admin** on every row.
- The dashboard's **Your contributions** card (counts + anything sent back) replaces "Recent submissions".
- The **sign-in alert** about changes now covers every kind and links straight to each item's edit form.
- `/events/suggest` → Your suggestions uses the same rows.

No migration of its own (the setting that can hide it ships with "Opening collaboration", below). To hide the page and the card: Admin → Settings → Collaboration → untick **My contributions page**.

Checklist: sign in as a member who has sent something → `/en/dashboard` shows the card; `/en/dashboard/submissions` lists it with the right section and button; `/ar/…` right to left.
