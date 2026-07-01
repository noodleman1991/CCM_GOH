# CCM Hub — Feature Spec & UI Instructions (current vs. design-handoff)

**Date:** 2026-07-01
**Status:** draft — awaiting user review
**Branch:** feat/redesign-and-comments
**Reference design (target):** `design_handoff_ccm_hub/` — `SPEC.md` (why), `WIREFRAMES.md` (what, §4.1–4.19), `FLOWS.md` (navigation), `SANITY_SCHEMA.md` (CMS), `TAXONOMY.md` (tokens + permissions), `STATES_AND_COPY.md` (states, microcopy, operational data model). Clickable prototype: `CCM Hub Redesign.dc.html`.
**Grounding of "now":** real routes under `app/[locale]/(main)/`, their components under `components/`, `prisma/schema.prisma`, `sanity/`, and saved screenshots in `docs/design/screenshots/`.

## Purpose of this document

One source of truth that, for every feature/screen, puts the **current UI** next to the **design-handoff target**, states the **diff**, describes **how users use it** and **how editors operate it**, and names the **backend infrastructure** that must exist behind it — so the UI instructions are grounded in real features and the infrastructure, not floating mockups. It absorbs three jobs into one spine:

- **Build instruction set** — the per-feature template (Part B) is buildable: now → target → diff → flows → infra → states → UI instructions.
- **Gap audit** — each feature carries a gap-tag (severity · effort); Part C rolls them into one ranked backlog.
- **Product reference** — "what it is / who uses it / user flow / editor flow" per feature, plus the cross-cutting reference (Part A: roles, infra map, design language).

Two features already have dedicated specs — this doc references them rather than duplicating:
- Homepage → `docs/superpowers/specs/2026-06-26-homepage-redesign-design.md`
- Workspace → `docs/superpowers/specs/2026-06-25-workspace-redesign-design.md`

---

## How to read a feature block (the template)

Every feature in Part B uses this fixed template:

```
## <Feature name>            [gap: 🔴/🟠/🟢 severity · effort: S/M/L]
Route(s): app/[locale]/(main)/<route>        Status: live / partial / missing
Handoff ref: WIREFRAMES §4.x · FLOWS · screenshot: <file>.png

WHAT IT IS      — one paragraph: purpose + who uses it
────────────────────────────────────────────────────────────
UI NOW          — grounded in real code + screenshot
UI TARGET       — the handoff intent
THE DIFF        — concrete bullets: what actually changes
────────────────────────────────────────────────────────────
USER FLOW       — how a user uses it, step by step
EDITOR FLOW     — how an editor/CMS operates it (or "n/a")
────────────────────────────────────────────────────────────
INFRA BEHIND IT — Sanity <types> · Prisma <models> · API <routes> · Algolia
                  EXISTS vs. MISSING  (→ points to Part A2)
STATES          — empty / loading / error / gated  (→ Part A + STATES_AND_COPY)
────────────────────────────────────────────────────────────
UI INSTRUCTIONS — concrete build directives, reusing Part A3 tokens/components
```

**Gap severity:** 🔴 far from target or missing infra · 🟠 partial / needs rework · 🟢 close, polish only.
**Effort:** S (≤1 day) · M (a few days) · L (a week+ / new infra).

---

# PART A — Cross-cutting reference

*Read once; every feature block in Part B refers back here instead of repeating it.*

## A1. Roles & permissions

The handoff models **4 conceptual roles** (Visitor · Member · Collaborator · Editor) with **region-scoped** editor powers (`TAXONOMY.md §17`). The app implements roles at **two independent layers**:

**Layer 1 — Global role** (`prisma User.role`, resolved via Clerk session in `lib/authz.ts::getActor()`):

| Handoff role | Real `Role` enum | Notes |
|---|---|---|
| Visitor | *(no row / unauthenticated)* | public GROQ filters `status == 'published'` |
| Member | `community_member` (default) | anyone signed in |
| — | `community_editor` | present in enum, **not** in the staff set |
| Editor / moderator | `team_editor` | staff |
| Admin | `admin` | staff |

- **Staff = `{team_editor, admin}` only** (`lib/authz-core.ts::STAFF_ROLES`). `community_editor` exists in the enum but is **not** treated as staff by `isStaff()` — a latent gap to resolve (see Part C).
- Global capability gate `can(actor, action)` in `lib/authz-core.ts` covers `comment:approve`, `comment:remove`, `moderation:view`, `report:resolve`. `GET /api/me/role` exposes `{ isStaff }` to the client.

**Layer 2 — Collaboration membership role** (`prisma CollaborationRole`: `VIEWER · COMMENTER · EDITOR · OWNER`, `lib/collaboration/authz.ts`) — per-workspace, maps to the handoff's "Collaborator" and its lead/collaborator split. Global staff can *moderate* a workspace but do **not** implicitly read `MEMBERS`-visibility files.

> **⚠️ Infra gap vs. handoff:** there is **no region-scoped editor** in code — no `reviewRegion` field, no "NAWA editor can't publish SSA" enforcement. Region exists only as content taxonomy (`Community.regionalName`, content `region`) and as a *filter*, never as an authz boundary. If the handoff's regional-convenor model is required, it's net-new infra (a `reviewRegion` on `User` + a region check in the publish/moderation path). Tracked in Part C.

**How to read the per-feature permission notes:** each feature block states the *minimum role* for each action against **Layer 1** (global) unless it's a workspace action, in which case it cites **Layer 2** (membership). "Editor" in a feature block means `team_editor|admin` today (region-unscoped).

## A2. Data-model & infra map (Sanity | Prisma | API | Algolia)

The boundary rule (from `STATES_AND_COPY.md §6`, and matched by the real code): **published & curated content → Sanity** (system of record); **live / frequent / private interaction → Prisma/Postgres**. They join on **`User.sanityPersonId` → Sanity `author._id`** (one-way, optional, no auto-backfill — set on profile edit / in Studio). Search is **Algolia** (indices: `case_studies`, `users`, …), fed by `/api/search/*` sync + Sanity/Clerk webhooks. Every feature's INFRA row points at this map.

**Sanity (30 doc types) — the content system of record**

| Group | Types |
|---|---|
| Content hub (outputs) | `caseStudy`, `caseStudyDraft`, `livedExperience`, `researchOutput` |
| News & editorial | `newsPost`, `post`, `report`, `externalSource` |
| Events & agenda | `event`, `agenda` |
| People & org | `author`, `organization`, `project`, `team` |
| Taxonomy (facets) | `tag`, `category`, `topic`, `expertise-area`, `work-type`, `regional-community` |
| Site structure | `homepage`, `page`, `regional-community-page`, `docs-chapter` |
| CMS-curated app UI | `site-announcement`, `moderation-settings`, `profile-prompt`, `onboarding-content` |
| Internal | `funding-application`, `dataset` |

**Sanity blocks (47) — the page-builder vocabulary** (homepage & pages are composed from these, per the homepage-redesign spec): heroes (`hero-1/2`); layout (`split-*`, `grid-*` incl. `grid-case-study/grid-news/grid-lived-experience/grid-agenda`, `carousel-*` incl. `lived-experiences-carousel`); data widgets (`teamGrid`, `peopleWidget`, `regionMap`, `eventsCalendar`); editorial (`section-header`, `info-box`, `timeline*`, `faqs`, `breakBlock`, `separatorBlock`); `newsletter`; insert blocks (`manual-content-insert`, `dynamic-content-insert`); base (`block-content`, `link`, `button-variant`, `section-padding`, `background-option`, `layout-variants`); reference lists (`regionalCommunityList`, `documentReferenceList`, `allPosts`).

**Prisma (34 models) — the interaction system of record**

| Concern | Models |
|---|---|
| Identity | `User`, `Account`, `Session` |
| Community membership | `Community`, `UserCommunity` |
| Profile curation | `RecentWork`, `ProfilePromptAnswer` |
| Workspace / collaboration | `Collaboration`, `CollaborationMember`, `CollaborationThread`, `CollaborationFile`, `CollaborationFileAnnotations`, `CollaborationMedia`, `CollaborationDoc`, `Plan`, `PlanStage`, `Task`, `WorkspaceOutput`, `JoinRequest` |
| Comments & moderation | `Comment`, `CommentFlag`, `CommentReport`, `Reaction`, `Mention` |
| Messaging | `Conversation`, `ConversationParticipant`, `Message`, `MessageReport`, `UserBlock` |
| Notifications | `Notification`, `NotificationPreference` |
| Social graph | `Follow` (polymorphic: `REGION` · `THEME` · `PROJECT`), `ContactRequest`, `Rsvp` |
| Analytics / system | `DownloadEvent`, `report_metadata`, `RateLimit` |

> Note: the handoff's `STATES_AND_COPY §6` operational model is **already substantially built** — `Follow`, `JoinRequest`, `ContactRequest`, `Rsvp`, `Task`, `Notification`, `Conversation`/`Message`, `Comment` all exist as real tables. Divergence: the workspace uses `Collaboration*` naming (not `Project*`); threads are `CollaborationThread` + `Comment`, not a separate `Thread`/`Post` pair.

**API route groups (`app/api/*`)** — content workflow (`case-studies/{drafts,revisions,submit}`, `lived-experiences/submit`, `agendas`, `events`), `collaborations/[id]/{files,media,threads}`, `comments`, `communities`/`community/*`, `messages`, `notifications` (+`/unsubscribe`), `profile/*`+`users/*`+`user/me`, `search/*` (Algolia sync/webhooks), `maps/*` (region GeoJSON + feature lists), `follow`-related, `account` (export/delete), `onboarding/*`, `webhooks/{sanity,clerk}`, `draft-mode/*`+`cache/revalidate`+`dynamic-content` (ISR), `analytics/*`+`reports/*`, `newsletter`, `health`.

## A3. Design-language reference (reuse, don't redesign)

**Every UI instruction in Part B must build from these — polish = consistency with this existing language, not a new one.**

- **Colours — `lib/ccm-colors.ts`.** `CCM` named palette (midnight `#0B3160` · sea `#205596` · water `#4186C3` · sky `#9BC6DA` · primary `#4974CA` · secondary `#90E0F4` · amber `#E0A53F` · slate `#8595AC`). `COLOR` taxonomy map + resolver fns: `regionColor`, `statusColor`, `taskColor`, `intentColor`, `projectColor`, `layerColor`. **Never hard-code a hex** — resolve through these so a tag's colour is identical everywhere (matches `TAXONOMY §16`).
- **Layout tokens — `lib/design-tokens.ts`.** `SECTION_SPACING_Y`/`spacingY()`, `HEADING_SCALE`/`heading()`, `CONTAINER_WIDTH`/`containerWidth()`, `CARD_ASPECT`/`cardAspect()` (+`CARD_ASPECT_SOURCE` for Sanity CDN dims), `GRID_GAP`/`gridGap()`. Use tokens, not ad-hoc classes.
- **Theme — `tailwind.config.ts`.** Fonts via CSS vars (`--font-heading` Poppins/Lalezar-ar, `--font-body` Lato/Tajawal-ar); radius via `--radius` (`rounded-lg` base); `fade-up` animation for skeleton shimmer.
- **Shared components — reuse before building:**
  - `components/ui/section-header.tsx` — `SectionHeader` (colour bar + title + subtitle + "view all")
  - `components/ui/card.tsx` — `Card*` family
  - `components/ui/pill-filter-group.tsx` — `PillFilterGroup` + `PillOption` (accessible fieldset, counts, RTL)
  - `components/ui/filter-chip.tsx` — `FilterChip`, `RemovableChip`
  - `components/ui/section-container.tsx` — responsive width+spacing wrapper
  - content cards: `CaseStudyCard`, `LivedExperienceCard`, `NewsPostCard`, `ExternalSourceCard`, `PostCard`, `NewsCard`
- **Unified discovery — `components/discovery/discovery-bar.tsx` + `lib/discovery/registry.ts`.** `DISCOVERY_REGISTRY` is a per-type config (`caseStudy · newsPost · livedExperience · agenda · report · user`) declaring facets/sorts/time-frame/dataSource; `DiscoveryBar` renders search + sort + time-frame pills + facet groups + removable-chip summary + clear-all, URL-stateful. **Any list/gallery filter UI should be this component driven by a registry entry**, not a hand-rolled filter bar.
- **States — `STATES_AND_COPY.md §1`:** loading = skeleton (never centred spinner); empty = illustration + Poppins headline + slate sub + one primary action; error = amber left-rule inline card + "Try again"; gated = muted card + the unlocking action. Status colours **always** paired with a label (a11y).

---

# PART B — Per-feature specs

## Cluster 1 — Discovery

### 1.1 Home  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/page.tsx` → `components/pages/homepage.tsx` · **Status:** partial (mid-migration)
**Handoff ref:** WIREFRAMES §4.1 · screenshots: `homepage-en-desktop.png` (now) vs `handoff-home-design.png` (target). **Has its own spec:** `2026-06-26-homepage-redesign-design.md` — this block is the summary; that spec governs the build.

**WHAT IT IS** — The public front door. A visitor's first read of "what this hub is" and the launch point into discovery (Explore/Atlas) and collaboration. Composed by editors, not hard-coded.

**UI NOW** — Renders two ways: a **block-builder path** (`homepage.blocks[]` → `<Blocks>`, ~18 block types) *and* a **legacy fixed-field fallback** (`heroWelcome`→Hero1, `globalAgenda`/`howToUse`/`collaboration`→SplitRow, `regionalCommunities`→GridRow, `livedExperiences`→Carousel2, `partnerLogos`→LogoCloud1, `news`→GridRow). Current live layout (screenshot): "Welcome to Connected Climate Minds…" hero → Global Agenda → collaborative-space split → content cards → **7-tile regional grid** → collaborate split → news cards → funder strip → "What is mental health" copy. No events/calendar block; region map + people widget are flag-gated.

**UI TARGET** — Handoff §4.1: hero → explore-by-region **map** → **news list + events calendar (Subscribe)** tandem → **lived-experiences carousel** (video/audio cards) → **Submit-a-story banner** → funder strip. Hero CTAs = **Explore** + **Collaborate**. Everything an editor-placed block.

**THE DIFF**
- Add an **`eventsCalendar` block** (missing entirely) beside the news list.
- Promote `regionMap` + `peopleWidget` from flag-gated hard-coded to **first-class placeable blocks** (drop the flags).
- Replace the "Create an Account" collaborative-space CTA with hero CTAs **Explore / Collaborate**.
- Retire the legacy fixed-field path once the doc is migrated to `blocks[]` (staging-first).
- Lived-experiences section → the `lived-experiences-carousel` block with kind badges.

**USER FLOW** — Visitor lands → scans hero → clicks **Explore** (→ Atlas) or **Collaborate** (→ Collab space); browses region tiles → region page; reads a news/lived card → detail; hits **Submit a story** → sign-in gate → content editor.

**EDITOR FLOW** — Studio → `homepage` doc → add/reorder/configure blocks (each block has its own fields); news/agenda blocks toggle `dynamic-recent` / `dynamic-featured` / manual `columns[]`. Publish → ISR revalidates.

**INFRA BEHIND IT** — **Sanity:** `homepage` doc + block types (`hero-*`, `grid-*`, `carousel-*`, `regionMap`, `peopleWidget`, **`eventsCalendar`** ← *needs wiring as placeable*), resolves `newsPost`/`agenda`/`event`. **API:** `fetchHomepageNews/Agendas`, `/api/home/*`, `cache/revalidate`. **EXISTS:** block builder, dynamic news/agendas, region/people components. **MISSING:** events-calendar block as first-class; flags removed; legacy path retired.

**STATES** — `MissingSanityPage` if no doc. **Missing:** no loading skeleton, no error boundary; empty sections silently omit. Home is "never empty — curated" (STATES §2), so focus on skeleton + error, not empty.

**UI INSTRUCTIONS** — Build the calendar as an `eventsCalendar` block using `Card` + `SectionHeader`, month grid + upcoming list + "Subscribe to calendar" pill (outlined, `rounded-lg`), event dots colour via `layerColor`/`projectColor`. Reuse `lived-experiences-carousel`. Keep block gaps on `SECTION_SPACING_Y` tokens. Validate at 375 + RTL `ar`. (Defer to the homepage-redesign spec for slice order.)

---

### 1.2 Search  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/search/page.tsx` → `GroupedSearch` · **Status:** live

**WHAT IT IS** — Universal search from the sidebar box; groups matches by type so anyone can find content, people, projects and regions in one place.

**UI NOW** — Client Algolia `GroupedSearch`: central box (250ms debounce, clear), **results grouped by type** (Content / News / Agendas / Users) with a header (icon + count + "See all" if >4), up to 4 preview rows each, type-specific row shapes. `SearchSkeleton` while loading; per-group "nothing found"; `SearchErrorBoundary`; `force-dynamic`.

**UI TARGET** — §4.18: `h1 Results for "q" · count` + grouped Content · Projects · People (· Regions); live-as-you-type; each result routes to detail; empty = "Type to search…", no match = "Nothing found".

**THE DIFF** — Very close. Minor: handoff names a **Regions** group (current has Content/News/Agendas/Users — "Projects/Regions" not surfaced); add a global result **count in the h1**; confirm empty-state copy matches ("Type to search…" / "Nothing found").

**USER FLOW** — Type in sidebar box → live grouped previews → "See all {type}" → dedicated list, or a row → its detail.

**EDITOR FLOW** — n/a (no editor surface). Indexing is automatic via `/api/search/*` sync on content publish.

**INFRA BEHIND IT** — **Algolia** indices (`caseStudies`, `news`, `agendas`, `users`) via `lib/algolia`; record shapes `*SearchRecord`. Fed by Sanity/Clerk webhooks + `/api/search/*`. **EXISTS:** all of it. **MISSING:** Projects/Regions groups (if wanted); count in title. ⚠️ *Cross-cutting:* the public search key is currently invalid (403) — see project memory `algolia-search-key-invalid`; user must rotate it. Search wiring is correct.

**STATES** — Loading ✓ (`SearchSkeleton`), empty ✓, error ✓ (boundary). All handled.

**UI INSTRUCTIONS** — Keep the grouped model; reuse `SectionHeader` for group headers with count; ensure the `h1` shows `Results for "{q}" · {total}`. If adding Regions/Projects groups, register their indices and mirror the existing row card. No redesign needed — this is the closest-to-target screen.

---

### 1.3 Case Studies gallery  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/research-and-action/case-studies/page.tsx` · **Status:** partial (gallery only)
**Handoff ref:** WIREFRAMES §4.11 · screenshot: `case-study-en-desktop.png`

**WHAT IT IS** — Browse published impact stories. The flagship discovery surface for the hub's research output.

**UI NOW** — Header + "Submit case study". `CaseStudiesFilters` (topics enum · tags · communities · search). Two modes: **filtered** → flat grid (≤50) + empty/"clear filters"; **unfiltered** → **editorial masonry grouped by regional community**, each a `SectionHeader` + 6-col grid with `variantForIndex()` (feature at 0, wide every 4th, else classic) using `GridCaseStudyComponent`. ISR 60s. Loading skeleton ✓.

**UI TARGET** — §4.11: header + count · **Gallery | Map toggle** · **one shared filter bar** (Region · Theme chips) driving both views. Gallery = masonry of reusable card layouts (Feature · Quote · Wide · Standard). Map = result list (left) + blob map (right), same filter state.

**THE DIFF**
- **Add the Map view + Gallery|Map toggle** (missing) — reuse the Atlas blob map (§2.1) with a result list, sharing filter state.
- Move filtering onto the **unified `DiscoveryBar`** (registry type `caseStudy`) instead of the bespoke `CaseStudiesFilters` — gets Region/Theme chips, sort, time-frame, removable-chip summary for free.
- Masonry variant is **hard-coded** (`variantForIndex`) — consider an editorial/CMS control, or at least keep but document it.
- Add a **result count** in the header.

**USER FLOW** — Land → (optionally) filter by region/theme/search → browse masonry or **switch to Map** → click a card → detail. "Submit case study" → editor.

**EDITOR FLOW** — Author submits via `/api/case-studies/submit` (draft) → editor reviews → publish; `featured` drives sort; `relatedCommunity` drives the region grouping.

**INFRA BEHIND IT** — **Sanity:** `caseStudy` (+`caseStudyDraft`), `fetchCaseStudiesByRegion` / `fetchFilteredCaseStudies` (injection-safe GROQ), `fetchCaseStudyTags/Communities`. **API:** `case-studies/{submit,drafts,revisions}`. **Map:** `/api/maps/*`. **EXISTS:** gallery, filters, submit pipeline. **MISSING:** map view; DiscoveryBar adoption; count.

**STATES** — Loading ✓, empty ✓ ("No case studies… Check back soon" / filtered "clear filters"). Matches STATES §2 ("No case studies match these filters"). Map view will need its own empty caption.

**UI INSTRUCTIONS** — Replace `CaseStudiesFilters` with `DiscoveryBar` config `caseStudy` (facets region·topic·tags·year; sorts relevance·newest·oldest·region·az; timeFrame on). Add a `Gallery | Map` segmented control (reuse `FilterChip` styling); Map view = left result list + right blob map (Atlas map component), region dots via `regionColor`. Keep masonry variants; colour tags via `statusColor`/tag colour resolver. Cards stay `GridCaseStudyComponent`.

---

### 1.4 Case study detail  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/research-and-action/case-studies/[slug]/page.tsx` · **Status:** live
**Handoff ref:** WIREFRAMES §4.12 · screenshot: `case-study-en-desktop.png`

**WHAT IT IS** — Read one published case study. The reference implementation for public content layouts (reused by news/research).

**UI NOW** — Back-link · layout-aware header (Feature=navy panel, Story/Report=standard) · featured image · body via `PortableTextRenderer` (Report = article + sticky "At a glance" sidebar; Story/Feature = centered `max-w-prose`) · study-details cards (authors/orgs/projects/period) · `RelatedContent` · **`CommentIsland`** (lazy, ISR-safe, `targetType:"caseStudy"`). Renders the layout **pre-set in the CMS** (`layout` enum story/feature/report). ISR 300s.

**UI TARGET** — §4.12: same three archetypes **chosen by dominant content**, with a **layout switcher + one-line use-case caption** and a **Mobile toggle** in the prototype; public **comments thread + composer**; logged-out can read, must sign in to comment.

**THE DIFF**
- The switcher/Mobile toggle in the handoff is a **prototype/editor affordance** — production correctly renders the CMS-set `layout`. **No runtime toggle needed** on the public page; ensure the *editor* lets authors pick layout with the use-case caption (→ Content editor §4.4).
- Confirm all three archetypes render faithfully (Feature navy split, Report sticky panel) at mobile + RTL.
- i18n gap: "Study Period" label is hard-coded, not `t()`.

**USER FLOW** — Open from gallery/search/related → read → (signed-in) comment → follow related links.

**EDITOR FLOW** — Author sets `layout` + blocks in Studio/editor; publish. Editor/staff can moderate comments (`comment:remove`, per A1).

**INFRA BEHIND IT** — **Sanity:** `fetchCaseStudyBySlug`, `layout`/`studyPeriod`/`content` (Portable Text). **Prisma/API:** `Comment` + `/api/comments` (CommentIsland). **EXISTS:** all three layouts, comments, related. **MISSING:** nothing structural; polish (i18n label, RTL/mobile QA).

**STATES** — 404 via `notFound()`; comment island handles its own loading. Gated: logged-out read-only, sign-in to comment (STATES §2). **Missing:** no page skeleton (ISR mitigates).

**UI INSTRUCTIONS** — Leave the public page layout-driven. i18n the "Study Period" label. QA each archetype at 375 + `ar`. Any layout-switcher work belongs in the **Content editor** block (§4.4), where the author picks Story/Feature/Report with the use-case caption from TAXONOMY §5.

---

### 1.5 News list  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/news/page.tsx` · **Status:** live
**Handoff ref:** WIREFRAMES §4.14 · screenshot: `news-list-en-desktop.png`

**WHAT IT IS** — Global + regional news and updates, mixing first-party posts and curated external sources.

**UI NOW** — Header · `NewsFilters` (communities · tags · **time-frame pills** Any/1m/3m/1y/3y · search). Two modes: **unfiltered** → `NewsHeroSection` (3 featured cards) + latest feed (CCM + external merged, date-sorted); **filtered** → results grid + count + summary + clear. Cards: `NewsPostCard` (featured badge) / `ExternalSourceCard` ("External ↗"). `mergeNewsFeed`. Loading skeleton ✓, empty ✓ both modes. URL-stateful.

**UI TARGET** — §4.14: header · filter **All · Global · region chips** · **lead story (large) + latest list**; region filter recomputes lead+list; "To build" = news **detail** template (done, §1.6).

**THE DIFF** — Very close; the current version is arguably richer (external sources, time-frame). Align: handoff wants a **single large lead** vs the current 3-card featured hero — decide (keep 3-card or single lead). Optionally move `NewsFilters` → `DiscoveryBar` (`newsPost` registry) for consistency; add explicit **Global** chip alongside region chips.

**USER FLOW** — Land → featured + latest → filter by region/tag/time → card → detail (external cards leave-site).

**EDITOR FLOW** — Editor authors `newsPost` (or curates `externalSource`) in Studio; `featured` promotes into the hero. Publish → list.

**INFRA BEHIND IT** — **Sanity:** `newsPost`, `externalSource`; `fetchFeaturedNews/RegularNews/AllNews`, `fetchApprovedExternalSources`, `mergeNewsFeed`. **EXISTS:** all. **MISSING:** DiscoveryBar adoption (optional); Global chip.

**STATES** — Loading ✓, empty ✓ ("No news available yet" / filtered clear). STATES §2 region-empty copy ("No updates in {region} yet · Follow this region") not yet used — add when region filter yields empty.

**UI INSTRUCTIONS** — Optionally swap `NewsFilters` for `DiscoveryBar` config `newsPost` (facets siteVsExternal·source·tags·region; sorts newest·oldest·relevance; timeFrame on). Add a **Global** pill. Consider single-lead layout to match §4.14, or keep the 3-card hero and note the intentional divergence. Region-empty → STATES §2 copy + "Follow region" CTA (ties to Follow infra).

---

### 1.6 News detail  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/news/[slug]/page.tsx` · **Status:** live

**WHAT IT IS** — Read one news post; the handoff's "to build" news detail, now built.

**UI NOW** — Back-link · header (featured badge, title, subtitle, date/author/location/reading-time, tags) · featured image · excerpt block-quote card · body Portable Text (`max-w-prose`) · orgs/projects card · **Sources card** (link list) · related-news 3-grid (shared tags) · `CommentIsland` (`targetType:"newsPost"`). ISR 300s.

**UI TARGET** — §4.14 "to build": news template (**Standard/Feature/Brief**), author/date meta, connection chips.

**THE DIFF** — Built as a **single centered layout** (no Standard/Feature/Brief archetype switch like case studies have). If the News template archetypes are wanted, add `layout` to `newsPost` and branch like §1.4. Otherwise it's complete. Connection chips → present as related-news; TAXONOMY §14 relation types (about/part-of/…) not surfaced as labelled chips.

**USER FLOW** — Open from list/search/related → read → sources/related → (signed-in) comment.

**EDITOR FLOW** — Author `newsPost` + `sources[]` in Studio; publish. Related auto-derived from shared tags.

**INFRA BEHIND IT** — **Sanity:** `fetchNewsBySlug`, `fetchRelatedNews`, `sources[]`, `content`. **Prisma/API:** `Comment` + `/api/comments`. **EXISTS:** all. **MISSING:** optional layout archetypes; labelled connection chips (TAXONOMY §14).

**STATES** — 404 via `notFound()`; comments island self-manages. **Missing:** page skeleton (ISR mitigates).

**UI INSTRUCTIONS** — If archetypes wanted: add `newsPost.layout` (brief/feature/story per TAXONOMY §4) and branch the header/body like the case-study page, reusing the same layout components — do **not** build parallel ones. Otherwise ship as-is; optionally render TAXONOMY §14 relations as labelled `FilterChip`-style connection chips.

---


## Cluster 2 — Atlas & Regional

### 2.1 Atlas & Explore  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/atlas/page.tsx` → `components/atlas/atlas-explorer.tsx` · **Status:** live (drill stubbed)
**Handoff ref:** WIREFRAMES §4.10 · screenshot: `map-community-hero-en-desktop.png`, `d-content-card-map.png`

**WHAT IT IS** — Geo-faceted discovery: one map + facet rail to explore all content/people across the 7 regions. The "Explore" hero CTA lands here.

**UI NOW** — Header · **facet chips** (6, wired: case studies · lived · members · news · agendas · reports) as `FilterChip`s · **custom in-house SVG choropleth** (`region-choropleth.tsx`, 7 regions from `region-geometry.json`, intensity shading white→sea, keyboard-accessible, `role="img"`) · right/below **data panel** (`region-data-panel.tsx`: ranked list unselected; label+count selected) · below, selected-region **drill grid** (`RegionContentCards`, ≤12 cards) + "Explore {Region} →" deep-link. API-driven counts. ISR/cache 300s.

**UI TARGET** — §4.10: `[L facet rail: Data layer · Theme chips · Region list(+counts)] [R blob map]` with **one shared filter state** (layer · theme · region · q) driving map counts + caption + results; clicking a blob filters; **region→country drill** zooms to pinned content; results title + "Open in Case Studies →".

**THE DIFF**
- **Theme chips missing** — facets are content-*type* layers only; add a **Theme** facet dimension (displacement/livelihoods/youth/indigenous) to the rail.
- **`q` (search) not part of the shared state** — handoff wants layer·theme·region·**q** unified; add search into the Atlas filter state.
- **Region→country drill is stubbed** — `iso-to-region.ts` exists but unused; no country geometry/zoom. Either build the country layer (L effort) or **explicitly de-scope** it (log the cut, per no-silent-caps).
- Choropleth uses one sea→white gradient for **all** regions; handoff colours each region (`regionColor`). Decide: keep intensity-shading (defensible) or add per-region hue.
- `FACET_DESTINATION` deep-links are **hard-coded URLs** — brittle; centralize.

**USER FLOW** — Land (from Explore CTA) → pick a layer → read map intensity → click a region → see its top items → "Explore {Region} →" into the filtered listing, or a card → detail.

**EDITOR FLOW** — n/a (no editor surface). Counts derive from published Sanity content + Prisma members automatically.

**INFRA BEHIND IT** — **API:** `/api/maps/region-data` (facet→per-region counts; Sanity GROQ + Prisma member counts), `/api/maps/region-items` (region+facet→≤12 items). **Sanity:** `caseStudy`·`newsPost`·`livedExperience`·`agenda`·`report`·`researchOutput` grouped by `regionalCommunity` slug (`RC_SLUG_TO_REGION`). **Prisma:** `Community`(REGIONAL)·`UserCommunity`. **Config:** `lib/maps/region-codes.ts`, `region-facets.ts`. **EXISTS:** map, 6 facets, drill grid, counts. **MISSING:** theme facet, q in state, country drill, per-region colour.

**STATES** — Loading ✓ (skeleton on card fetch). Empty: unselected→ranked list; 0-count→"No content for this layer" (STATES §2: "Nothing tagged here yet… be the first"). Error: graceful (empty counts, map still renders). **Missing:** no skeleton on facet-toggle; `RegionContentCards` 0 → `null` (should show empty caption).

**UI INSTRUCTIONS** — Add a **Theme** `PillFilterGroup` to the facet rail; fold search `q` into the shared Atlas state (URL). Add an empty caption to `RegionContentCards` (STATES §2 copy) instead of `null`. Decide country-drill: if building, add country geometry keyed by `iso-to-region.ts` and zoom-on-select showing pins; if not, **remove the dead `iso-to-region` reference and note the de-scope in Part C**. Keep the accessible choropleth; if colouring per region, resolve via `regionColor`. Centralize `FACET_DESTINATION` into the discovery registry.

---

### 2.2 Regional community  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/communities/[slug]/page.tsx` → `components/templates/regional-community-template.tsx` · **Status:** partial
**Handoff ref:** WIREFRAMES §4.13 · screenshot: `community-en-desktop.png`, `map-community-hero-en-desktop.png`

**WHAT IT IS** — A region's public home: its agenda, content, lived experience, team, members, discussion, and a region-focused map. The destination behind the homepage region tiles.

**UI NOW** — Template-driven (`regionalCommunityPage` doc, `useTemplate` flag). Renders: `titleHero` + **`FollowButton`** (per-user) · optional welcome hero · why-join CTA · **agendas grid** · **case-studies grid** · **news grid** (incl. external) · **lived-experiences carousel** · **team grid** (Prisma dynamic or Sanity manual) · logo cloud · **region members block** (Prisma, privacy-filtered, ≤12). Featured-first-then-recent fallback per grid; `dynamic-with-pinned` dedupe. ISR 120s. Also has `contentFlow[]` (non-template) + legacy modes.

**UI TARGET** — §4.13: navy hero + blobs (stats, Get involved / **Open workspace**) · public/member split · agenda · region cases · **featured story from blocks** · lived video wall · team · **community discussion (thread list → thread)** · **embedded Atlas focused on this region**.

**THE DIFF**
- **Community discussion rail is MISSING** — no thread list, no "Start the first thread". Wire to the threads/comments infra (→ Cluster 5).
- **Embedded region-focused Atlas is MISSING** — `regionMap` query referenced but the region-embed of the §2.1 map isn't rendered. Embed `atlas-explorer` pre-filtered to `slug`.
- **Member-gated sections not enforced** — handoff wants public/member split (members see workspace, post composer); today all sections are public. Add the "Join this community to take part" strip for visitors (STATES §2).
- **"Open workspace" / Get-involved** in hero absent (only Follow). Add membership-gated workspace entry + stats.
- Dedicated **Featured Story** block not present (welcomeHero/whyJoin approximate it).

**USER FLOW** — From a home tile / map → region hero → Follow (1-click) → browse agenda/cases/lived/team/members; **(target)** members open the workspace + post in discussion; visitors see a join strip.

**EDITOR FLOW** — Studio `regionalCommunityPage` (per-locale, slug): configure each grid (mode/title/max/manual refs), heroes, logo cloud, or hand-compose `contentFlow[]`. Team grid dynamic pulls Prisma; agendas featured-first.

**INFRA BEHIND IT** — **Sanity:** `regionalCommunityPage` + `regionalCommunity`; `fetchSanityRCPageBySlug`, `fetchRegionalCommunity{Agendas,CaseStudies,LivedExperiences,News}BySlug`, `mergePinnedWithDynamic`. **Prisma:** `Community`·`UserCommunity` (team + members via `getRegionMembers`), `Follow`. **API:** `/api/communities/*`, `/api/community/*`. **EXISTS:** all grids, follow, members, team. **MISSING:** discussion rail, region Atlas embed, member-gating, workspace entry.

**STATES** — Grids render only if data (empty→hidden, matches STATES §2 "section hidden if empty"). Members 0→`null`. **Missing:** loading skeletons (Suspense fallback null); empty-discussion "Start the first thread"; visitor gated strip.

**UI INSTRUCTIONS** — Add a **Community discussion** section (`SectionHeader` + thread list → thread route; empty = "Start the first thread") using the Cluster 5 thread model. Embed `atlas-explorer` with `region={slug}` prefilter below content. Add a visitor **"Join this community to take part"** gated strip (muted `Card` + Follow/Get-involved) and reveal member-only actions when `UserCommunity` membership exists. Add hero stats + membership-gated **Open workspace** link. All grids stay on their existing card components; colour region accents via `regionColor`. Validate 375 + RTL.

---


## Cluster 3 — Lived Experiences

### 3.1 Lived Experiences index  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/lived-experiences/page.tsx` → `page-client.tsx` · **Status:** live
**Handoff ref:** WIREFRAMES §4.15 · screenshot: `lived-exp-en-desktop.png`

**WHAT IT IS** — The wall of first-person stories (video/audio/written) grounding the research in lived reality. Was a **dead sidebar link** in the handoff; now fully built.

**UI NOW** — Hero (title + intro + illustration) + **"Share your experience"** · discovery bar (search · Filters · sort · "{n} videos") · story cards **grouped by regional community** (`video-card.tsx`), each card = thumbnail (video poster / initials) + title + tags. Fetches `livedExperience` (approved or legacy no-status). Suspense skeleton (3 groups). URL-stateful (regions/tags/search). ISR 60s.

**UI TARGET** — §4.15: hero + "Share your story" · **featured carousel (‹ ›)** · **all-stories grid with kind badge (Video/Audio/Written)**. Empty → "Be the first to share".

**THE DIFF**
- **No featured carousel** at the top — add a `lived-experiences-carousel` above the grid (reuse the homepage/region carousel block).
- **Kind badges missing** — cards don't show Video/Audio/Written; add a badge from `format`.
- Grouping-by-region is a reasonable superset of the handoff's flat grid — keep, but ensure the featured carousel spans regions.

**USER FLOW** — Land → (target) skim featured carousel → browse by region / filter → open a story → **Share your experience** → sign-in gate → submit flow.

**EDITOR FLOW** — Member submits via `/lived-experiences/submit` → `/api/lived-experiences/submit` (draft) → editor reviews → publish. Consent required before leaving draft (TAXONOMY §18: `consentObtained`).

**INFRA BEHIND IT** — **Sanity:** `livedExperience` (`format`, `videoUrl`, `tags[]`, `region`, `thumbnail`), grouped by `regionalCommunity`. **API:** `/api/lived-experiences/submit`. **EXISTS:** gallery, filters, submit, player. **MISSING:** featured carousel, kind badges.

**STATES** — Loading ✓ (skeleton 3 groups). **Missing:** empty-state ("No stories here yet… Share yours" STATES §2) — currently groups just omit; add a global empty when zero stories. Gated: submit requires sign-in.

**UI INSTRUCTIONS** — Add a **featured carousel** at top using `lived-experiences-carousel` (arrows, sea accents). Add a **kind badge** (Video/Audio/Written) to `video-card.tsx` from `format`, colour via a neutral chip. Add the global empty state (STATES §2 copy + "Share a story"). Consider adopting `DiscoveryBar` (`livedExperience` registry: region·tags·theme) for filter-UI consistency. Keep region grouping.

---

### 3.2 Lived Experience detail  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/lived-experiences/[slug]/page.tsx` · **Status:** live

**WHAT IT IS** — One story, told with dignity — person-first header, the media (video/audio/written), and context.

**UI NOW** — Back-link · **person header** (avatar, title, issue/context — "dignity first") · tags · `LivedExperiencePlayer` (medium-aware) · body · related community · **`CommentIsland`** · `RelatedContent`. `max-w-4xl`, RTL-aware, i18n via `getLocalizedValue`. ISR 300s.

**UI TARGET** — §4.15 detail: kind chip · title · who·place · media (video poster / audio player / written prose) · body · "Part of: {region}". Medium drives layout.

**THE DIFF** — Very close. Add the **kind chip** in the header (consistency with the index badge). Confirm the player renders all three media types (video/audio/written) correctly. "Part of: {region}" present via related community — ensure it's labelled.

**USER FLOW** — Open from index/carousel/related → read/watch/listen → (signed-in) comment → related stories.

**EDITOR FLOW** — Same submit→review→publish pipeline as §3.1.

**INFRA BEHIND IT** — **Sanity:** `fetchLivedExperienceBySlug`, `format`-driven `LivedExperiencePlayer`. **Prisma/API:** `Comment` + `/api/comments`. **EXISTS:** all. **MISSING:** kind chip (cosmetic).

**STATES** — 404 via `notFound()`; comments self-manage. Consistent with §1.4/§1.6.

**UI INSTRUCTIONS** — Add a kind chip to the person header (mirror the index badge). QA `LivedExperiencePlayer` for audio + written paths (not just video). Label the region line "Part of: {region}". No structural change.

---


## Cluster 4 — Collaboration

### 4.1 Collab space  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/collaborate/page.tsx` + `page-client.tsx` · **Status:** partial (People only)
**Handoff ref:** WIREFRAMES §4.6 · screenshot: `collaborate-en-desktop.png`

**WHAT IT IS** — The people-and-projects hub: find collaborators, browse projects, see events. The "Collaborate" hero CTA lands here.

**UI NOW** — **People discovery only**: search pill + filter chips (time · work types · expertise) · **user carousels grouped by regional community** (`UserCarousel`, ≤20 each) · "Start a Collaboration" (flag-gated `FEATURES.engagement`). Server-filtered via `UserService.getUsersForCollaborate` (inclusion model). `CollaborateSkeleton`; empty "No results"+clear; auth-gated (→ `/sign-in?redirect=/collaborate`).

**UI TARGET** — §4.6: Collab space with **Projects / People / Events** tabs; person cards carry **Message / Connect**; project cards show open calls (Seeking/Offering); events with RSVP.

**THE DIFF**
- **Missing Projects and Events tabs** — only People exists; Projects live separately at `/collaborations`, Events nowhere. Unify under a **tabbed Collab space** (People · Projects · Events) per handoff IA.
- **No Message/Connect action on person cards** — add (ties to Messaging + ContactRequest infra).
- Work-type/expertise enums are **hard-coded** in `page-client.tsx` — move to taxonomy/registry.
- Adopt `DiscoveryBar` (`user` registry: region·workType·expertise·openToTalk) for the People filter.

**USER FLOW** — Enter (from Collaborate CTA) → People tab → filter → person card → **Message/Connect** (target); **(target)** Projects tab → project → public page / request to join; Events tab → RSVP.

**EDITOR FLOW** — n/a for discovery. Project creation gated by `FEATURES.engagement` + role.

**INFRA BEHIND IT** — **Prisma:** `User`·`UserCommunity`·`Community` (People); `Collaboration` (Projects); `Rsvp`+`event` (Events). **API/Service:** `UserService.getUsersForCollaborate`; `/api/users/*`. **Algolia** users index for people search (→ registry `user`). **EXISTS:** People discovery. **MISSING:** Projects/Events tabs, card actions, taxonomy-driven filters.

**STATES** — Loading ✓, empty ✓, gated ✓ (auth). STATES §2 People-empty copy ("No one matches yet… post an open call") not yet used — add.

**UI INSTRUCTIONS** — Introduce a tabbed shell **People · Projects · Events** (reuse workspace top-tabs pattern for consistency). People = `DiscoveryBar(user)` + `UserCarousel`/grid + **Message/Connect** on `PersonCard` (respect `allowMessagesFrom`/contactable). Projects tab = surface `/collaborations` list here. Events tab = upcoming `event`s with RSVP. Move enums to taxonomy. Empty → STATES §2 copy.

---

### 4.2 Project public page  [gap: 🔴 · effort: M]
**Route(s):** `app/[locale]/(main)/collaborations/page.tsx` (list) · `.../[id]/page.tsx` (detail=workspace) · **Status:** partial (no public view)
**Handoff ref:** WIREFRAMES §4.7 · FLOWS

**WHAT IT IS** — The public face of a project: what it's about, who's on it, its outputs, and the **Follow / Request-to-join / Offer** entry points — visible to non-members.

**UI NOW** — **List** (`/collaborations`): "Workspaces" grid, visibility badge (PUBLIC/MEMBERS), 3-stat footer (members·threads·files), create button. **Detail** (`[id]`): renders the **`WorkspaceShell`** (the *editing* shell, MEMBERS-gated) — **there is no separate public project page**. `listVisibleCollaborations` = public + own memberships; `authorizeCollab`.

**UI TARGET** — §4.7: a **public project page** (distinct from the workspace) — hero (title, status Active/Recruiting, region, lead) · about · **open calls (Seeking/Offering)** · team · public outputs · **Follow / Request to join / Offer to help / Message lead**; "View public page" from the workspace.

**THE DIFF**
- **The public project page doesn't exist** — non-members either see the members-gated shell or a card. Build a read-only public project page at `[id]` (or `[id]/about`) that renders for visitors, with the workspace behind a membership gate.
- Wire **Follow / Request to join / Offer to help** CTAs (infra exists: `Follow`, `JoinRequest`).
- Surface **open calls** (Seeking/Offering) and public **outputs** (published `WorkspaceOutput`s).
- Add a **visibility picker** (badge is display-only today).

**USER FLOW** — Discover a project (Collab/Atlas/search) → **public page** → read about + outputs → **Request to join** (prompt modal → lead notification) or **Follow** (public updates) or **Message lead** → on accept, enter workspace.

**EDITOR FLOW** — Lead sets visibility, posts open calls, curates which outputs are public; accepts/declines join requests (notification-driven).

**INFRA BEHIND IT** — **Prisma:** `Collaboration`·`CollaborationMember`·`WorkspaceOutput`·**`JoinRequest`**·**`Follow`**·`ContactRequest`. **API:** `/api/collaborations/*`. **EXISTS:** collaboration + membership + join-request tables, output links. **MISSING:** the public page itself; Follow/Request/Offer UI wiring; open-calls model surfacing; visibility picker.

**STATES** — List empty ✓; detail 404 ✓; feature-gated ✓. **Missing:** public-page gated strip for visitors ("This is a private workspace" + Request to join / View public page, STATES §2).

**UI INSTRUCTIONS** — Build a **public project page** (visitor-readable): hero with `projectColor` status badge, about, team grid, public outputs (reuse `GridCaseStudyComponent` etc.), open-calls chips (`intentColor`), and a CTA cluster **Follow · Request to join · Offer to help · Message lead** wired to `Follow`/`JoinRequest`/`ContactRequest`. Keep the `WorkspaceShell` behind membership; add "View public page" ↔ "Open workspace" cross-links. Request-to-join opens the prompt modal (STATES §5 copy).

---

### 4.3 Workspace  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/collaborations/[id]/page.tsx` → `components/collaboration/workspace-shell.tsx` · **Status:** live
**Handoff ref:** WIREFRAMES §4.8 · **Governing spec:** `2026-06-25-workspace-redesign-design.md` (this block summarizes; that spec governs).
**Screenshots:** `workspace-outputs-tab.png`, `w1-inline-editing.png`, `w2-drag-reorder.png`, `w3-docs-tiptap.png`, `w4-files-media-inline.png`, `w5-readonly-viewer.png`, `phase5-workspace-plan.png`

**WHAT IT IS** — A team's staging ground to propose → draft → publish content into the hub. Single sidebar + top tabs; produces linked Sanity **outputs**.

**UI NOW** — `WorkspaceShell` with top tabs **Overview · Outputs · Plan · Docs · Threads · Files · Media · Members** + global-sidebar-collapse on entry. Overview = editable title/desc + outputs grid + plan progress + activity + member count. Outputs = linked Sanity drafts (type/status badges). Plan = stages→tasks (status, assignee, within-stage drag via dnd-kit, inline add). Docs = Tiptap→Portable Text (autosave). Threads = `CommentSection` (polymorphic). Files = R2 upload + EmbedPDF annotator. Media = YouTube. Members = role selector (OWNER). First-run seeds 3 stages + 1 doc.

**UI TARGET** — §4.8: Home / Conversation / Documents; outputs-led; plan; annotations. **Matches the redesign spec closely.**

**THE DIFF** (vs the governing spec — mostly finish-work)
- **Activity feed stubbed** — `getActivity()` not implemented.
- **"Link existing output" picker missing** — `addOutput(mode:'link')` exists but no browse UI (create-only in practice).
- `refreshOutputStatuses()` may not run on every Home load.
- Empty-state i18n keys need all 4 locales confirmed.
- **Group conversation** in the unified inbox not yet integrated (workspace threads exist, but no DM/channel surface — → Cluster 5).

**USER FLOW** — Member opens workspace → Overview → work the Plan / co-author Docs / discuss in Threads / annotate Files → link/create Outputs → submit output for review → editor publishes → output goes live on the hub.

**EDITOR FLOW** — OWNER/EDITOR (Layer-2 role) edit everything; VIEWER read-only. Outputs flow into the Sanity draft→review→publish pipeline (§4.4). Global staff can moderate.

**INFRA BEHIND IT** — **Prisma:** `Collaboration`·`CollaborationMember`·`Plan`·`PlanStage`·`Task`·`CollaborationDoc`·`WorkspaceOutput`·`CollaborationThread`·`CollaborationFile`(+`CollaborationFileAnnotations`)·`CollaborationMedia`. **Storage:** R2. **API:** `/api/collaborations/[id]/{threads,files,media}` (SWR). **EXISTS:** essentially all. **MISSING:** activity feed, link-output picker, inbox group-chat bridge.

**STATES** — First-run seeded ✓; per-tab empty-state onboarding ✓; SWR loading ✓; permissions ✓ (canEdit=OWNER|EDITOR); non-member gate ✓. Matches STATES §2.

**UI INSTRUCTIONS** — Defer to the workspace-redesign spec for build order. Remaining polish: implement `getActivity()` + render the feed; add a "link existing output" picker (browse `WorkspaceOutput`-eligible drafts); ensure `refreshOutputStatuses()` on Home load; complete empty-state translations. Keep the single-sidebar/top-tabs pattern — do **not** reintroduce a second rail.

---

### 4.4 Content editor  [gap: 🟠 · effort: M]
**Route(s):** `components/forms/case-study-*` (form/review/portable-text-editor) + `/api/case-studies/submit` · **Status:** partial (route placement unclear)
**Handoff ref:** WIREFRAMES §4.9 · screenshots: `e1-feature-layout.png`, `e1-report-layout.png`

**WHAT IT IS** — Where authors compose a publishable output (block body + metadata + layout) and push it into the CMS review→publish pipeline. The bridge from workspace to published hub content.

**UI NOW** — Accordion form (`case-study-form.tsx`): basic (multilingual title/excerpt + image) · **Tiptap→Portable Text** content · authors+roles · community+tags · location (geocoded) · study period → **Review** → submit `/api/case-studies/submit` (Clerk auth, Zod, image ≤5MB, creates Sanity draft `status:pending`). Zustand `useCaseStudyStore`. Pipeline: draft→pending→approved→published (cached in `WorkspaceOutput`).

**UI TARGET** — §4.9: block editor with **layout choice (Story/Feature/Report + use-case caption)**, place media/leads, **PDF annotation**, connections, and the draft→review→published pipeline with editor request-changes.

**THE DIFF**
- **No layout/archetype chooser in the editor** — authors can't pick Story/Feature/Report (the public page renders `layout`, but nothing sets it here with the use-case caption). Add it (feeds §1.4).
- **PDF annotation isn't in the editor** — it lives in workspace Files, not the authoring flow. Decide whether the editor needs it or it stays a workspace tool.
- **Inline media in body** — image hero only; Portable Text doesn't embed inline media/video yet.
- **"Request changes" loop** — pipeline supports draft→pending→approved; confirm the `changes` state + `reviewNotes` (TAXONOMY §6/§18) are surfaced to the author.
- Editor is **case-study-shaped**; handoff implies one editor for all publishable types (livedExperience/researchOutput/news). Generalize or document per-type editors.
- **Route placement** (`/submissions`?) unclear — pin it down.

**USER FLOW** — Author (from workspace "create output" or a Submit CTA) → fill blocks + metadata + **pick layout** → Review → Submit for review → editor approves/publishes or requests changes → author revises.

**EDITOR FLOW** — `team_editor|admin` review queue (`/api/case-studies/revisions`) → approve & publish or request changes with notes → status flows; visibility gated (only published is public).

**INFRA BEHIND IT** — **Sanity:** `caseStudyDraft`→`caseStudy` (+`livedExperience`/`researchOutput`), `writeClient`, review actions. **Prisma:** `WorkspaceOutput` (status cache). **API:** `/api/case-studies/{submit,drafts,revisions}`. **EXISTS:** case-study authoring + pipeline. **MISSING:** layout chooser, request-changes surfacing, generalization to other types, inline media, PDF-in-editor decision.

**STATES** — Form/review/submitting/success/errors ✓ (Zod inline). Non-author read-only (STATES §2). **Missing:** author-facing `changes` state view.

**UI INSTRUCTIONS** — Add a **layout chooser** (Story/Feature/Report) with the one-line use-case caption from TAXONOMY §5, writing `layout` on the draft. Surface the **`changes` state + `reviewNotes`** to the author with a "Resubmit" action (STATES §3 copy). If generalizing, factor a shared editor shell parameterized by content type rather than duplicating per type. Reuse `PortableTextEditor`, `Card`, form primitives; keep the accordion + language switcher. Decide PDF-in-editor explicitly and log the choice.

---


## Cluster 5 — Messaging

### 5.1 Messages / Inbox  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/messages/page.tsx` → `components/messaging/inbox.tsx` + `components/notifications/notification-feed.tsx` · **Status:** live (partial)
**Handoff ref:** WIREFRAMES §4.16, §4.19 · STATES §4–5 · screenshots: `phase4-messages-en-1280.png`, `phase4-messages-ar-375.png`, `phase4b-notif-grouping-en.png`, `phase5-requests-group.png`

**WHAT IT IS** — One inbox for both conversations and notifications — where requests, replies, and DMs live together.

**UI NOW** — **Unified** via tabs (Conversations | Notifications) ✓. Conversations = 2-col (`300px|1fr`): **flat** list (avatar + name + last-message + unread dot, ordered `lastMessageAt`) + thread pane (bubbles: mine sea/white, other muted; composer wired; delete/report on hover; mark-read). Notifications = `NotificationFeed` grouped **Requests · Today · Earlier**, Accept/Decline on requests (wired). SWR polling (convos 30s / thread 12s / notifs 60s); no websockets. Auth-gated.

**UI TARGET** — §4.16: segmented Conversations|Notifications (✓); conversations **grouped Project · Community · Direct** with unread badges; notification rows "{actor} {action}" + time, Request rows actionable. Empty = "No conversations yet" / "You're all caught up".

**THE DIFF**
- **Conversation grouping missing** — flat list today; add **Project · Community · Direct** sections (ties workspace channels + region community spaces + DMs).
- **Notification verb copy incomplete** — many types fall back to a generic "activity"; map each `NotificationType` to its specific string (STATES §4 table).
- Bell + sidebar "Notifications" deep-link to the Notifications tab — confirm wired.
- Everything else (unified shell, unread dots, Accept/Decline) matches.

**USER FLOW** — Open inbox → Conversations (pick a channel/DM → read/send) or Notifications (act on a request / jump to the thing). Bell → Notifications tab.

**EDITOR FLOW** — n/a (staff moderation of messages via `MessageReport` is a separate moderation surface, not the inbox).

**INFRA BEHIND IT** — **Prisma:** `Conversation`·`ConversationParticipant`·`Message`·`MessageReport`·`UserBlock` (messaging); `Notification`·`NotificationPreference` (notifs). **API:** `/api/messages` (list convos/messages), `/api/notifications`. **Realtime:** SWR polling. **EXISTS:** unified inbox, DMs, notifications, requests. **MISSING:** conversation grouping, full verb copy, (optional) websockets.

**STATES** — Empty convos ✓ ("No conversations yet"), empty notifs ✓ ("You're all caught up"), loading ✓ (SWR), error ✓ (toast), gated ✓ (sign-in). Matches STATES §2.

**UI INSTRUCTIONS** — Group the conversation list into **Project · Community · Direct** with `SectionHeader`-style dividers + per-group unread counts (derive kind from `Conversation.projectId`/`regionId`/direct). Complete the `NotificationType`→string map (STATES §4), pairing every status colour with a label. Keep the tabbed shell and SWR; consider websockets later (not blocking). Validate RTL at 375 (`phase4-messages-ar-375.png`).

---

### 5.2 Thread / discussion  [gap: 🟠 · effort: M]
**Route(s):** `components/comments/comment-section.tsx` (polymorphic) · `components/collaboration/workspace-threads.tsx` · **no standalone community thread route** · **Status:** partial
**Handoff ref:** WIREFRAMES §4.17 · screenshot: (community discussion — none yet)

**WHAT IT IS** — A discussion thread: posts with reply/react + composer. One model reused for **content comments**, **workspace threads**, and **community (region) discussions**.

**UI NOW** — A strong **polymorphic `CommentSection`** powers: content comments (`caseStudy`/`newsPost`/`livedExperience`/`researchOutput`), workspace threads (`collaborationThread`), and doc annotations (`collaborationFile`). Features: composer, keyset-paginated list, 1-level replies, 👍 reactions, delete/report, PENDING moderation badge, anonymous-readable. `WorkspaceThreads` wraps it for project channels. **Community (region) discussion has no route/UI** — referenced by the region page but unbuilt.

**UI TARGET** — §4.17: `[← region] tag chip · title · posts (avatar, author, time, text, Reply/Like) · reply composer`; the shared thread component for comments + annotations; region page lists threads → open a thread.

**THE DIFF**
- **Community discussion is MISSING** — no `thread/[id]` (or region-scoped) route, no thread list on the region page. Build it on the existing `CommentSection` engine (new `targetType:'community'` scoped to a `regionId`, + a thread list + a thread route).
- **Thread model parity** — `CommentSection` lacks `title`/`tag`/`scope` as first-class (title lives outside; scope inferred from `targetType`; reactions are emoji not semantic "like"). Add thread `title`/`tag`/`scope` for community threads.
- Content/workspace threads already match the target closely.

**USER FLOW** — (content) read → comment/reply/react. (workspace) open channel → discuss. (community, target) region page → thread list → open thread → post/reply → "Start the first thread" when empty.

**EDITOR FLOW** — Staff moderate (`comment:remove`, PENDING queue). Region-scoped moderation is **not** enforced (see A1 gap).

**INFRA BEHIND IT** — **Prisma:** `Comment`(polymorphic `targetType`/`targetId`, `depth`, `status`)·`Reaction`·`CommentReport`·`CommentFlag`; `CollaborationThread`. **API:** `/api/comments` (keyset, SWR-infinite), `/api/collaborations/[id]/threads`. **EXISTS:** content comments, workspace threads, annotations. **MISSING:** community discussion route/list; thread title/tag/scope fields.

**STATES** — Comments: empty ("Be the first to comment"), loading, PENDING badge, deleted tombstone ✓. **Missing:** community empty "Start the first thread"; standalone thread screen states.

**UI INSTRUCTIONS** — Add a **community discussion** surface: a thread list block on the region page (§2.2) + a thread route rendering `CommentSection` with a new `community` target scoped to `regionId`, plus thread `title`/`tag` header (tag chip via region/tag colour) and a reply composer. Extend the `Comment` model with `title`/`tag`/`scope` for thread-typed targets (or a light `Thread` table keyed to comments). Reuse the existing composer/list/react — do **not** fork a second comment engine. Empty = "Start the first thread" (STATES §2).

---


## Cluster 6 — Account

### 6.1 Onboarding  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/onboarding/` → `components/onboarding/modern-onboarding-container.tsx` + panels · **Status:** live
**Handoff ref:** WIREFRAMES §4.2 · STATES §7

**WHAT IT IS** — First-run profile setup: turns a Clerk sign-up into a hub member with a region, work profile, and privacy defaults.

**UI NOW** — **6 steps** (not 4): Welcome · Basic Info (name/username[live check]/headline/bio/motivation/age/country/city/language) · Work Info (workTypes·expertise·**region**·org·position·socials) · Recent Work (optional) · Privacy (searchable·visibility·show* toggles) · Review (+ profile prompts). sessionStorage progress-resume; multilingual + RTL; POST `/api/onboarding/complete` maps Sanity IDs→Prisma enums. Auth-gated.

**UI TARGET** — §4.2 / STATES §7: **4 steps** — Welcome → Your region → You & your work (role+interests) → How you'd like to take part (**intent chips**: Find collaborators / Share research / Share a lived experience / Just exploring). Region required; rest skippable.

**THE DIFF**
- Current flow is **richer (6 steps)** — a defensible superset. Not a regression; decide whether to keep the depth or streamline toward the handoff's 4.
- **Intent chips missing** — the "how you'd like to take part" step isn't there; intent is only implicit via `openToCollaboration`/`collaborationInterests` in profile edit. Add the intent step (feeds recommendations).
- No **LinkedIn/ORCID import** during onboarding (exists in profile edit) — optional to pull forward.

**USER FLOW** — Sign up → Welcome → fill steps (region required) → Review → Enter the hub. Refresh mid-flow resumes from sessionStorage.

**EDITOR FLOW** — Onboarding **content** (labels/hints/validation, work types, expertise, prompts) is **CMS-curated** in Sanity (`onboarding-content`, `profile-prompt`) — editors tune copy without code.

**INFRA BEHIND IT** — **Prisma:** `User` (all profile fields) + `UserCommunity`. **Sanity:** `onboarding-content`, `profile-prompt`, work/expertise taxonomies. **API:** `/api/onboarding/{complete,status,content,waive}`, `/api/username/check`. **Clerk:** auth + image sync. **EXISTS:** full flow. **MISSING:** intent step; (optional) import-on-onboard.

**STATES** — Error ✓ (inline + toast), gated ✓, progress-persist ✓. **Missing:** explicit loading (server-fetch + restore).

**UI INSTRUCTIONS** — Add a **"How you'd like to take part"** step with intent chips (`FilterChip` multi-select, STATES §7 copy) writing to a profile intent field. Optionally streamline to match the handoff's 4-step mental model by merging Basic+Work visually while keeping fields. Keep sessionStorage resume, CMS-driven copy, RTL. Region stays required (TAXONOMY §18).

---

### 6.2 Dashboard  [gap: 🟠 · effort: M]
**Route(s):** `app/[locale]/(main)/dashboard/page.tsx` + `page-client.tsx` · **Status:** partial
**Handoff ref:** WIREFRAMES §4.3 · screenshots: `dashboard-en-desktop.png`, `dashboard-en-mobile.png`

**WHAT IT IS** — The signed-in member's home: what's in progress and where to go next.

**UI NOW** — "Welcome back, {name}" + avatar + Edit Profile + **profile-completeness %** · Your Community card (+visit) · **6 quick-action cards** (profile/submit case study/find collaborators/settings/workspaces/messages) · Recent Work timeline (own items) · Recent Submissions (contributions feed) · Regional News (3). Skeleton `loading.tsx`; webhook-sync retry ("Setting up your account…"). Auth-gated.

**UI TARGET** — §4.3: work-in-progress dashboard — **My projects** (open →) · **My tasks** (across projects, stage badges) · **My drafts** (status badge) · **Messages** (unread count) · **Upcoming events**.

**THE DIFF**
- Current dashboard is a **hub-of-links**, not a **work-in-progress** view. Add the real WIP widgets:
  - **My projects** (from `CollaborationMember`) · **My tasks** (assigned `Task`s across workspaces) · **My drafts** (my `WorkspaceOutput`/case-study drafts with status) · **Messages unread count** · **Upcoming events** (my region + RSVPs).
- Keep quick actions + completeness as secondary.

**USER FLOW** — Land after sign-in → see my projects/tasks/drafts/messages/events → click into the work → (or) use quick actions.

**EDITOR FLOW** — n/a (personal surface). Editors may also see a moderation entry (separate).

**INFRA BEHIND IT** — **Prisma:** `CollaborationMember` (my projects), `Task` assignee (my tasks), `WorkspaceOutput`/case-study drafts (my drafts), `Conversation`/`Message` (unread), `Rsvp`+`event` (upcoming), `UserCommunity` (community). **Sanity:** `recentNews`, my authored content. **EXISTS:** community card, contributions, recent work, completeness. **MISSING:** projects/tasks/drafts/unread/events widgets.

**STATES** — Loading ✓ (`loading.tsx`), webhook-delay ✓. STATES §2 empty ("Nothing in progress… Explore projects") not yet used — add per widget. Gated ✓.

**UI INSTRUCTIONS** — Add a WIP grid: **My projects** (project cards → workspace), **My tasks** (task rows with `taskColor` stage badges → workspace Plan), **My drafts** (`statusColor` badges → editor), **Messages** (unread count → inbox), **Upcoming events** (RSVP list). Reuse `Card`/`SectionHeader`. Per-widget empty states (STATES §2). Keep completeness + quick actions below the fold.

---

### 6.3 Profile (public)  [gap: 🟢 · effort: S]
**Route(s):** `app/[locale]/(main)/profiles/[username]/page.tsx` + `components/blocks/profile/*` · **Status:** live
**Handoff ref:** WIREFRAMES §4.4 · screenshots: `profile-en-desktop.png`, `profile-ar-desktop.png`

**WHAT IT IS** — A member's public identity: who they are, their work, and how to collaborate — privacy-controlled by the owner.

**UI NOW** — Hero (avatar + collab ring · name · pronouns · headline · collab badge · work/location · expertise tags) + Edit/Email/Message actions + owner completeness. Body (~13 sections, conditional): About · **Prompts** (CMS hinge-style) · Motivation · Collaboration (openTo·interests·focusTopics·lookingFor) · **Lived experience** (opt-in `showLivedExperience`, redacted server-side) · Work · Skills · Recent work (owner pin/hide) · Contributions. Sidebar: communities · public workspaces · contact links. `loading.tsx`; 404 if unknown; RTL-safe (`bdi`). Message respects `allowMessagesFrom`.

**UI TARGET** — §4.4: hero (avatar/name/role/region/collab chip) + sections: experience · publications/outputs · projects · communities · events · lived · "you control each section" visibility.

**THE DIFF** — Very close / a superset. Minor: no "Shown" badge on projects; **events** section not present (add my public events/RSVPs if wanted); publications = contributions (fine). Visibility toggles correctly live in settings, not on the profile.

**USER FLOW** — Visitor views a profile → reads public sections → Message/Email/Connect (privacy-permitting). Owner sees Edit + completeness + pin/hide controls.

**EDITOR FLOW** — Profile prompts are **CMS-curated** (`profile-prompt`); the member answers them. `sanityPersonId` links a member to their `author` doc for content authorship.

**INFRA BEHIND IT** — **Prisma:** `User` (all profile + `show*` privacy flags) · `UserCommunity` · `RecentWork` · `ProfilePromptAnswer`. **Sanity:** `profile-prompt`, community translations, linked `author`. **API:** `/api/profile/*`, `listPublicWorkspacesForUser`. **EXISTS:** all sections + privacy redaction. **MISSING:** events section; "Shown" badges (cosmetic).

**STATES** — Loading ✓, 404 ✓, sparse-owner prompts ✓ ("Add a prompt"), sections hide when empty ✓ (STATES §2). Privacy-gated per section ✓.

**UI INSTRUCTIONS** — Optionally add an **Events** section (public events / RSVPs) and a "Shown/Hidden" affordance mirroring settings. Keep the lived-experience opt-in redaction and `allowMessagesFrom` gating. No structural change — this screen is close to target.

---

### 6.4 Account settings  [gap: 🔴 · effort: M]
**Route(s):** `app/[locale]/(main)/dashboard/account/page.tsx` → `components/blocks/profile/account-management.tsx` · **Status:** partial (major gaps)
**Handoff ref:** WIREFRAMES §4.5 · screenshot: `phase4a-settings-tabs-en.png`

**WHAT IT IS** — Control center for account, notifications, and privacy — the single place a member manages how they appear and what they receive.

**UI NOW** — **One page, two sections** (no tabs): "Your account" (email update · password change) + "Danger zone" (delete account — type-DELETE, published content survives). GDPR export `/api/account/export`. Clerk-backed. Inline error cards. Auth-gated.

**UI TARGET** — §4.5: **3 tabs** — Profile · Notifications · Privacy & contact — with profile-field editing + **section-visibility toggles**, per-type **notification toggles** (mentions/project/events/requests/digest), and privacy (visibility · who-can-message · require-request · show-email).

**THE DIFF** (biggest account gap)
- **No tab structure** — build **Profile · Notifications · Privacy & contact** tabs.
- **Notifications UI missing** — only a thin `NotificationPreference` (emailOnReply/Mention/Message) exists; build per-type toggles + digest frequency (STATES §4 channels).
- **Privacy UI missing** — `profileVisibility`, `allowMessagesFrom`, `show*` flags exist in Prisma but have **no settings UI** here (scattered in onboarding/edit). Consolidate.
- **Section-visibility toggles missing** — the "you control each section" promise (§4.4) has no home; add here.
- Profile-field editing currently redirects to `/dashboard/profile/edit` — fold into the Profile tab.

**USER FLOW** — Settings → Profile tab (edit fields + section visibility) / Notifications tab (per-type + digest) / Privacy tab (visibility · messaging · show-email) / (danger) delete.

**EDITOR FLOW** — n/a.

**INFRA BEHIND IT** — **Prisma:** `User` (`profileVisibility`·`allowMessagesFrom`·`isSearchable`·`show*`) · `NotificationPreference` (needs per-type expansion). **API:** `/api/account/*`, `/api/profile/*`, `/api/notifications` prefs. **Clerk:** email/password/2FA. **EXISTS:** account/password/delete/export; all privacy **fields**. **MISSING:** tabs, notifications UI, privacy UI, section-visibility UI (the fields exist — this is mostly **UI wiring**, not new data).

**STATES** — Loading ✓ (spinner), error ✓ (inline cards). **Missing:** unsaved-changes guard; "Settings saved" confirmations (STATES §3).

**UI INSTRUCTIONS** — Build a **3-tab settings shell** (reuse the tabs pattern): **Profile** (fields + Save + per-section visibility toggles bound to `show*`/`profileVisibility`), **Notifications** (per-type in-app/email toggles + digest instant/daily/weekly, bound to an expanded `NotificationPreference`), **Privacy & contact** (`profileVisibility` · `allowMessagesFrom` · require-request · show-email/phone/location). Keep account+danger zone. Add "Settings saved" toasts (STATES §3) and an unsaved-changes guard. This is mostly surfacing existing Prisma fields — no new tables except `NotificationPreference` per-type expansion.

---


## Cluster 7 — Meta

### 7.1 About / Feedback  [gap: 🟢 · effort: S]
**Route(s):** sidebar `/about` + `/feedback` → CMS catch-all `app/[locale]/(main)/[...slug]/page.tsx` → `Blocks` · **Status:** live (content-dependent)
**Handoff ref:** WIREFRAMES / FLOWS (§6 "About / Feedback pages" — was a gap, now resolvable)

**WHAT IT IS** — The static/editorial pages (about the hub, how to give feedback). Editor-composed, not bespoke code.

**UI NOW** — Sidebar entries `/about` and `/feedback` (`components/app-sidebar.tsx`) resolve through the **CMS catch-all** `[...slug]` route, which renders any Sanity `page` doc via the `Blocks` page-builder (ISR 120s, `notFound()` if the doc doesn't exist). No dedicated About/Feedback components — they're just CMS pages.

**UI TARGET** — FLOWS §6: "About / Feedback → simple content pages or external links." Low-complexity; the handoff explicitly allows either CMS pages or links.

**THE DIFF**
- **Ensure the `page` docs exist** for `about` + `feedback` in Sanity (else `notFound()`). This is a **content task**, not a build task.
- **Feedback** may want a form (not just prose) — either a `newsletter`-style block or a simple contact form block; `/api/newsletter` exists as a pattern. Decide: prose page vs. form.

**USER FLOW** — Sidebar → About (read) / Feedback (read or submit).

**EDITOR FLOW** — Editor creates/edits the `about` and `feedback` `page` docs in Studio using existing blocks; publish → live via ISR. No developer needed once a form block exists (if wanted).

**INFRA BEHIND IT** — **Sanity:** `page` docs (slug `about`/`feedback`) + block types; `fetchSanityPageBySlug`. **API:** `/api/newsletter` (if a form is used). **EXISTS:** catch-all rendering, block library. **MISSING:** the two `page` docs (content); optional feedback-form block.

**STATES** — `notFound()` if the doc is absent (STATES: treat as content gap, not error). Otherwise inherits block states.

**UI INSTRUCTIONS** — Create `about` + `feedback` `page` docs from existing blocks (hero + `block-content` + `faqs`/`info-box`). For Feedback, if a form is desired, add a small form block posting to an API (mirror `/api/newsletter`); otherwise link to email/external. No new page components — reuse the CMS catch-all + `Blocks`.

---


---

# PART C — Rolled-up gap backlog

Derived from the gap-tags in Part B. **Headline:** the app is far more built than the handoff assumed — most screens are 🟢/🟠 (polish/rework), and the heavy lifts are **net-new surfaces** (public project page, account settings tabs, community discussion) rather than rebuilds. The single biggest *cross-cutting* infra decision is **region-scoped editor permissions** (A1).

## C1. Ranked backlog

Ranked by severity then effort. "Infra missing?" = needs new tables/routes vs. pure UI wiring over existing infra.

| # | Feature | Sev | Effort | The gap in one line | Infra missing? |
|---|---|---|---|---|---|
| 1 | **4.2 Project public page** | 🔴 | M | No visitor-facing project page — detail = the members-gated workspace shell | Mostly UI over existing `Collaboration`/`JoinRequest`/`Follow`; new page |
| 2 | **6.4 Account settings** | 🔴 | M | No tabs; notifications + privacy + section-visibility UIs absent | **No** — fields exist; expand `NotificationPreference`; rest is UI wiring |
| 3 | **A1 Region-scoped editor** | 🔴 | L | Handoff wants region-bounded editors; code has only global staff | **Yes** — `reviewRegion` on `User` + region checks in publish/moderation |
| 4 | **2.2 Regional community** | 🟠 | M | Missing discussion rail, embedded region-Atlas, member gating, workspace entry | Partly (discussion → depends on #6); rest UI |
| 5 | **5.2 Community discussion** | 🟠 | M | No community thread route/list (content + workspace threads exist) | Small — extend `Comment` w/ `title`/`tag`/`scope`; new route |
| 6 | **4.1 Collab space** | 🟠 | M | People-only; no Projects/Events tabs; no card Message/Connect | No — compose existing infra into tabs |
| 7 | **6.2 Dashboard** | 🟠 | M | Hub-of-links, not work-in-progress (projects/tasks/drafts/unread/events) | No — all data exists in Prisma |
| 8 | **2.1 Atlas & Explore** | 🟠 | M | No theme facet, no `q` in shared state, country-drill stubbed | No (unless building country layer = L) |
| 9 | **4.4 Content editor** | 🟠 | M | No layout chooser; request-changes loop unclear; case-study-only | No — Sanity pipeline exists; surface + generalize |
| 10 | **5.1 Messages inbox** | 🟠 | M | Conversations not grouped (Project/Community/Direct); verb copy incomplete | No — group + copy over existing data |
| 11 | **1.1 Home** | 🟠 | M | Needs events-calendar block; region/people blocks flag-gated; legacy path | Small — wire `eventsCalendar` as placeable block |
| 12 | **1.3 Case Studies gallery** | 🟠 | M | No Map view/toggle; bespoke filters not on DiscoveryBar | No — reuse Atlas map + registry |
| 13 | **6.1 Onboarding** | 🟢 | S | Missing intent step; 6 steps vs 4 (superset, fine) | No |
| 14 | **3.1 Lived Experiences index** | 🟢 | S | No featured carousel; no kind badges | No |
| 15 | **1.5 News list** | 🟢 | S | Align lead layout; optional DiscoveryBar; Global chip | No |
| 16 | **1.6 News detail** | 🟢 | S | Optional Standard/Feature/Brief archetypes; connection chips | No |
| 17 | **1.4 Case study detail** | 🟢 | S | i18n a label; QA archetypes at mobile/RTL (switcher belongs in editor) | No |
| 18 | **3.2 Lived Experience detail** | 🟢 | S | Add kind chip; QA audio/written player paths | No |
| 19 | **6.3 Profile** | 🟢 | S | Optional events section; "Shown" badges (superset already) | No |
| 20 | **1.2 Search** | 🟢 | S | Add Projects/Regions groups + count in title; ⚠️ rotate Algolia key | No |
| 21 | **4.3 Workspace** | 🟢 | S | Finish activity feed, link-output picker, i18n empty states | No |
| 22 | **7.1 About / Feedback** | 🟢 | S | Create the two CMS `page` docs; optional feedback form block | No (content task) |

## C2. Cross-cutting threads (touch multiple features)

- **Region-scoped permissions (#3)** — gates the "editor" story on regional community, content editor, moderation. Decide first; everything downstream assumes global-vs-regional.
- **Unify filters on `DiscoveryBar`** — case studies (#12), news (#15), lived (#14), people (#6) each still hand-roll or partially adopt the registry. One sweep to registry-drive them all.
- **Comment/thread engine reuse (#5)** — community discussion, region page (#4), and workspace all ride the one `CommentSection`; extend the model once, reuse everywhere. Do **not** fork.
- **`community_editor` role is inert** — in the enum but not in `STAFF_ROLES` (A1). Decide its capabilities or remove it.
- **Follow / Request / Contact CTAs** — infra exists (`Follow`/`JoinRequest`/`ContactRequest`); wire the buttons on project page (#1), region page (#4), profiles (#19), news region-empty (#15).
- **⚠️ Algolia public search key invalid** (403) — blocks live search (#20); user must rotate the search-only key. Not a code gap.

## C3. Suggested sequencing

1. **Decide region-scoped permissions (#3)** — unblocks the editor/moderation story.
2. **Net-new surfaces** — project public page (#1), account settings tabs (#2), community discussion (#5) — highest user-visible value, build on existing infra.
3. **Compose/enrich** — Collab tabs (#6), dashboard WIP (#7), region page (#4), home calendar (#11), case-study map (#12).
4. **DiscoveryBar sweep** (#12/#15/#14/#6) + **Atlas** theme/q (#8).
5. **Polish pass** — the 🟢 items (carousels, badges, chips, i18n, QA) + create About/Feedback docs.

> No silent caps: the country-drill (#8) and the News archetypes (#16) are **explicit "decide or de-scope"** items — don't let them read as done. Two features already have governing specs (home #11, workspace #21) — defer their build order to those.
