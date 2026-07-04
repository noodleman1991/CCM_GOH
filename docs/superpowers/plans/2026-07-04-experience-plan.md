# Experience Plan — editorial reading, chart studio, events, collaboration loop

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or superpowers:executing-plans. Checkbox slices; every slice ends driven-signed-in with screenshot evidence.

**Goal:** Implement the approved mock v5 (artifact 95916254): the editorial reading experience, the pro chart studio, event pages (public + workspace), the collaboration loop (attention surface + notification matrix + Follow contract), and the dashboard pipeline — to the "exciting and simple done right" bar.

**Architecture:** All Sanity schema changes additive; one new Prisma enum value set (notification types) + WorkspaceOutput accepts `event`; the notification fan-out goes through ONE emitter (`lib/notifications/emit.ts`) feeding bell, inbox, workspace Overview and the weekly digest from the same rows. Charts stay server-baked SVG (E8 pipeline) with progressive hydration for tap-for-value.

**Tech Stack:** Next 16 App Router · Sanity (staging `development` dataset) · Prisma on Neon dev branch (`.env.local` URL for ALL CLI runs) · next-intl ×4 · vaul/shadcn · Resend (digest).

## Global Constraints
- NEVER `sanity typegen generate`; hand-edit types. No AI attribution in commits. No `migrate resolve`; Prisma CLI always with the `.env.local` DATABASE_URL; migrations as files, `migrate deploy` to dev only.
- i18n keys land in en/es/fr/ar with real translations. RTL via logical properties only; numerals never flip; `bdi` on user text. ≥44px targets.
- **The bar (standing directive [[exciting-simple-done-right]]):** default output looks finished/editorial with zero config; pro depth one level deeper; one story-gesture per feature; motion (reduced-motion-safe), direct labels, locale formatting are IN scope per slice.
- Definition of done per slice: `tsc` + `vitest` + `prisma migrate status` (dev URL) green **and** the flow driven signed-in in the browser with screenshots to `.superpowers/sdd/`, checkpointed with the user.

## The flows this plan serves (order = build order)
1. **Reader**: lands on a case study → reads an editorial page (figures, pull-quotes, charts with sources) → flips nothing, gets annotations → follows the project → is notified when it publishes next → RSVPs to its event.
2. **Author**: opens the editor (from workspace or /submit) → writes, pastes data → studio makes it beautiful → submits → sees pipeline status → gets revision notes inline → resubmits → published; the workspace shows it all the way.
3. **Team member (recurring work)**: opens dashboard → "what needs me" (tasks due, unread threads, review notes, reader comments) → jumps into the workspace → done items clear.
4. **Organiser**: creates an event from the workspace → edits its page → publishes (moderated) → shares the public URL → attendees RSVP + get reminders → recap posted.

---

### Slice X1 — Editorial rendering (Reader flow, §4.12 + mock A/C)
**Files:** `components/portable-text-renderer.tsx` (figure frame, pull-quote, refs) · `sanity/schemas/blocks/shared/styled-block-content.ts` + image object (`credit` field) · blockquote gains `cite` · NEW PT object `reference` + `references` section renderer · chart/timeline/mermaid renderers get the editorial frame (title/unit/caption/source) · messages ×4.
**Contract:** images render as `<figure>` w/ caption+credit (NEVER italic body text); missing asset → frame collapses (no caption orphan); quotes w/ `cite` render the amber-bar pull-quote; `reference` markers superscript → numbered section. Feature/Report archetypes verified with the new objects.
- [ ] Schema additions (additive) + hand-edit types · renderer + tests for the pure splitters · gates · drive a real case study (the mPareshan page must stop showing caption-orphans) · screenshots en+ar+375 · commit.

### Slice X2 — Data block + chart studio (Author flow, mock D)
**Files:** extend `sanity/schemas/blocks/story-chart.ts` → `dataBlock` semantics (rows, series[], highlight, annotations[], threshold, title/unit/caption/source/alt, view) · editor: NEW `components/forms/editor/data-studio.tsx` (sheet: grid + paste-anything parser + series panel + annotate panel + type gallery incl. region-map) · `pt-convert` round-trip · server render (`lib/story-blocks/*`) gains multi-series line/area/grouped/stacked/donut + region-map (reuse atlas geometry) + annotation layer · `paste-anything` parser TDD (spreadsheet TSV, CSV, "label 72, label 64" text) · reader hydration: tap-for-value, draw-in on scroll (reduced-motion static).
**Story gesture:** highlight-a-series (amber vs calm blues, direct end-labels).
- [ ] Parser + converters TDD · schema + studio + renders · gates · author a chart through the studio signed-in, publish, verify reader render en+ar · screenshots · commit (may split into 2–3 commits: parser/schema → studio UI → renders).

### Slice X3 — Notification spine (Team flow, mock I)
**Files:** NEW `lib/notifications/emit.ts` (typed events → rows; single fan-out) · Prisma migration: NotificationType += `TASK_ASSIGNED, TASK_DUE, OUTPUT_STATUS, THREAD_REPLY, MEMBER_JOINED, FOLLOWED_PUBLISH, EVENT_REMINDER` (file + deploy to dev) · emit call sites: task assign (`lib/actions/plans.ts`), output status change (`refreshOutputStatuses` diff → emit), thread reply (`lib/actions/*thread*`), member joined (`respondToJoin*`), publish fan-out to followers (approve actions), event reminder (cron route `/api/cron/event-reminders`, T-24h) · Settings→Notifications email toggles wired per category.
**Contract:** ONE emitter; bell/inbox unchanged consumers; every event carries `{workspaceId?, entity, actor}` for deep links.
- [ ] Migration file + deploy(dev) · emitter TDD (pure payload builders) · call sites · gates · trigger each event live (assign a task, change a status…) and see it in the bell · commit.

### Slice X4 — "What needs me?" surfaces (Team flow, mock I)
**Files:** workspace Overview rework (`components/collaboration/workspace-home.tsx`): attention list (revision requests w/ notes count, my tasks due, unread threads, new reader comments) from the X3 rows + existing queries · Dashboard (`app/.../dashboard`): same list cross-project + drafts/submissions pipeline (G6) — replaces quick-action-only page · `myTasks` action finally gets UI.
- [ ] Implement · gates · drive: assign yourself a task → it appears on dashboard + overview; clear it → gone · screenshots · commit.

### Slice X5 — Follow contract (Reader flow, mock I)
**Files:** `FollowButton` tooltip copy ("Get notified when this project publishes") · fan-out uses X3 `FOLLOWED_PUBLISH` · "For you" strip on dashboard for region/theme follows (recent content matching follows) · weekly digest email (Resend, cron route, per-user toggle; reuse localized email patterns).
**Rule enforced:** follow types without fan-out don't render a button.
- [ ] Implement · gates · follow the test project with user B?—single-user dev: follow, publish an output via Studio approve, see the notification · commit.

### Slice X6 — Events (Organiser flow, mock F)
**Files:** event schema += `slug, body (styled content), coverImage, recordingUrl, relatedCollaboration(ref)` (additive) · NEW public page `app/[locale]/(main)/collaborate/events/[slug]/page.tsx` (hero date-block, RSVP, add-to-calendar .ics route, share, body via X1 renderer, agenda timeline, part-of chip) · workspace: Outputs picker += Event; `WorkspaceOutput.sanityType` allowlist += event; organiser card (RSVP count, Edit) · comments target allowlist += event · reminders ride X3.
- [ ] Schema + page + ics + workspace wiring · gates · create → approve (Studio) → RSVP → reminder row · screenshots en+ar+375 · commit (2 commits: public page → workspace wiring).

### Slice X7 — Editor completion (Author flow, mock D/E)
**Files:** edit-existing-submission: `/research-and-action/case-studies/submit?edit=<id>` loads the author's own draft/pending doc into the form (server fetch + authz: submitter or workspace member; update instead of create in the API) · workspace output cards "Continue editing →" for non-approved · editor right rail (pipeline status, connections chips, layout, reviewers note) · review notes: comments with `context=review` anchored to block keys, shown inline when status=revision.
- [ ] Implement · gates · drive: reopen the "Workspace link test" pending doc, edit, resubmit · screenshots · commit.

### Slice X8 — Queued polish (task #11 + leftovers)
Sheet quick-actions row (Search · Messages · Notifications w/ unread badges) · drawer/desktop parity check · cases-browse 375/ar validation pass · collapsed-rail mark eyeball fixes if user flags.

## Sequencing & checkpoints
X1 → X2 (the authoring payoff) → X3 (spine) → X4 → X5 → X6 → X7 → X8. User checkpoint with rendered evidence after every slice; plan revisions between slices are expected and cheap.

## Deferred (named, not silent)
Recurring tasks, presence/co-editing locks, AI-assisted chart parsing, per-block comments on public pages, Quote card variant (needs pull-quote field — arrives with X1's `cite`; enable in cases gallery after).
