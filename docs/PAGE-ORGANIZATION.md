# CCM Hub — Per-Page Feature Description & Ideal Organization

Description of every page (even trivial ones) and how the app's pages ideally organize, given the requested direction (nest Workspaces + Messages under Collaborate; move Messages + Notifications into the avatar; make discover → message → collaborate one continuous motion; contact-privacy relay model). Description only — not a plan.

---

## Part A — Every page, what it does

### Entry & auth
- **`/` (home)** — Sanity-driven homepage from page-builder `blocks[]` (hero, region grid, logo cloud, featured content, optional interactive map). Localized, ISR. The front door.
- **`/sign-in`, `/sign-up`** — Clerk hosted auth in the `(auth)` layout (no sidebar). Pure auth.
- **`/onboarding`** — multi-step post-signup: communities, work types, expertise, prompts; writes `preferredLanguage`. New users are redirected here first. Own minimal layout.

### Research & Action (content library)
- **`/research-and-action/case-studies`** — filterable case-study index (region/tags/communities), grouped by region.
- **`/research-and-action/case-studies/[slug]`** — single case study: styled portable-text body, author, location, tags, related items, comment island. ISR.
- **`/research-and-action/case-studies/submit`** — multi-stage accordion form (basic info → content → authors → tags → location/period); Nominatim geocode; drafts/revisions; per-language title/excerpt.
- **`/research-and-action/*` (agendas, regional/community agendas, toolkits, impact reports)** — grid listings of downloadable outputs (`agenda`/`report`); IP-stripped download tracking; partly build-script generated.

### The Reader
- **`/reader/[[...slug]]`** — Global Agenda as an in-app docs reader: chapter nav (mobile drawer), readable pane capped ~68ch, `heading()` scale, figures, styled links, prev/next. `/reader` = first chapter; `/reader/methods` = that chapter. Structure-only until ETL populates `docsChapter`.

### Lived experiences
- **`/lived-experiences`** — index of approved testimony (`livedExperience`).
- **`/lived-experiences/[slug]`** — single testimony: person header (name·region·role), **Story** (issue + personContext, readable pre-consent), tags, consent-scoped video, comment island.
- **`/lived-experiences/submit`** — testimony submission → Studio review.

### News
- **`/news`** — unified feed of site `newsPost` + approved `externalSource`; search + date chips + Filters; Featured then Latest; ours = no badge, external = source+favicon+↗.
- **`/news/[slug]`** — single article: capped prose, heading hierarchy, hero, key-takeaway callout, tags→filtered links, Share/Back, comment island.

### People & discovery
- **`/collaborate`** — discover people by region/work-type/expertise; searchable; carousels per regional community. The social heart; parent surface for the redesign.
- **`/profiles`** — directory index of public profiles.
- **`/profiles/[username]`** — public profile: header (name·handle·headline·role·location, badges), stats, About/prompts, recent work, contributions, regional communities, contact links. Bidi-safe. Home of the "Message" CTA.
- **`/dashboard/profile/[username]`** — same profile in the authed dashboard context.
- **`/search`** — Algolia InstantSearch across people + content; gated behind client mount (SSR-hang fix).

### Regional communities
- **`/communities/[slug]`** — regional landing page: hero + static locator, why-join CTA, scoped case studies / lived experiences / agendas / news, regional team grid, optional focused interactive map. Template or freeform-block mode.

### Engagement (in-progress program)
- **`/collaborations`** — index of visible workspaces; "New workspace" CTA.
- **`/collaborations/[id]`** — Notion-style workspace shell: Overview · Threads · Files · Media · Members; role-gated; R2 files (presigned), YouTube media, EmbedPDF annotation; drawer nav on mobile.
- **`/messages`** — direct-message inbox: list + thread, SWR-polled, privacy + block enforced, rate-limited. The bare surface the redesign replaces with an avatar-anchored panel.
- **`/moderation`** — role-gated comment queue (pending-anon / flagged / reported); approve/remove/dismiss; notify-on-approve.
- **`/moderation/broadcast`** — staff tool: in-app+email notification to a member, community, region, or everyone.

### Account & dashboard
- **`/dashboard`** — logged-in home: community band, quick actions, entry points; redirects unauthed → sign-in.
- **`/dashboard/profile/edit`** (+ `/work`, `/work/add`) — tabbed profile editor (bio, prompts, work history, language).
- **`/dashboard/submissions`** — your case-study submissions + drafts, with status.
- **`/dashboard/settings`** — notification prefs + DM privacy (`allowMessagesFrom`) + block list.
- **`/dashboard/account`** — account management (deletion → GDPR sweep, data export).

### Platform / trivial
- **`/legal/[doc]`** — Terms / Privacy (4-lang, user-favorable, GDPR-aligned), from `lib/legal/content.ts`.
- **`/[...slug]`** — Sanity catch-all: renders any CMS `page` / RC page from blocks. Powers About, Feedback, editor-authored static pages.
- **`/blog/[slug]`** — legacy `post` rendering (separate from `news`).

---

## Part B — Ideal organization (three spines)

The app today is a flat ~14-item sidebar where discovery, doing, and talking are scattered. The requested direction implies a **three-spine** organization:

### Spine 1 — Explore (content, read-only)
Research & Action · the Reader · Lived Experiences · News · (Regional Communities). The library; every page is list → detail → comment. Group under one "Explore" heading instead of separate top items.

### Spine 2 — Collaborate (people & collaboration)
**Collaborate is the parent.** People (discover) and Workspaces are siblings here — discovering a person and visiting a workspace are one neighborhood. Collapses today's separate `/collaborate` + `/collaborations`. Person cards carry a **Message** action; workspaces carry a **group chat** that surfaces back in the inbox.

### Spine 3 — You (identity & comms, in the avatar)
Messages + Notifications move **out of the sidebar/header into the avatar button** with badges. The avatar is the personal hub: Messages (hovering panel / mobile drawer), Notifications, Profile, Settings, Sign out. Nothing floats in the header — comms follow you rather than being a destination.

### Net effect on the sidebar
- **Removed from the flat list:** Messages (→ avatar), Workspaces (→ under Collaborate), header notification bell (→ avatar).
- **Clarified sidebar:** **Explore (library) · Collaborate (people + workspaces) · Regional Communities**, with everything personal in the avatar.

### Cross-cutting consequences of the requests
- **Contact privacy:** every people-surface exposes **Message**, never an email — Connect is the single contact channel.
- **Message-as-email + reply-by-email:** the inbox is reachable from a user's mail client, reinforcing Messages as ambient (avatar/everywhere), not a page.
- **The Reader** sits in Explore as a peer of Research & Action — content, read chapter-by-chapter, with the same comment capability.
- **Moderation / Broadcast** are staff tools — ideally in a role-gated Staff section (avatar/admin area), not the content sidebar.

**Summary:** a read library (Explore), a people-and-work hub (Collaborate), and an ambient personal layer in the avatar (You) — replacing the flat menu where messaging, workspaces, and notifications float as disconnected islands.
