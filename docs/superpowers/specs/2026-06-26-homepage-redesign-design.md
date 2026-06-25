# Homepage Redesign — Design Spec

**Date:** 2026-06-26
**Status:** approved for planning
**Branch:** feat/redesign-and-comments
**Reference design:** `design_handoff_ccm_hub/CCM Hub Redesign.dc.html` (home screen `ccm-home-lived-ill`) + WIREFRAMES §4.1. Saved screenshots: `docs/design/screenshots/handoff-home-design.png` + `-top.png`.

## Problem

The homepage doesn't match the handoff §4.1 design, and — more fundamentally — it is **not properly CMS-driven**. It is a **fixed named-fields** Sanity document (`heroWelcome`, `news`, …), not a freeform page-builder. Two of its newest sections (the region map and the People widget) are **hard-coded components with no editable field** and sit behind feature flags. The handoff home (hero → explore-by-region map → news + events calendar → lived-experiences carousel → submit banner → funder strip) can't be composed by an editor today, and there is **no events/calendar block at all**.

## Hard constraints (from the user)

- **Everything is a registered, reusable Sanity block.** No hard-coded homepage sections. Each section an editor can place, configure, and reorder.
- **Adapt existing blocks** wherever one fits; only build new where none exists.
- **Hero CTAs are "Explore" and "Collaborate"** (→ the Atlas/explore surface and the Collab space), not "Create account / Read the Global Agenda".
- Staging-first for any content migration (Sanity `development` dataset); never mutate `production_2` for testing.
- Green gate every slice; rendered-UI validation (375 + RTL `ar`); reuse the app design language (`lib/design-tokens`, `lib/ccm-colors`, `SectionHeader`, `ui/card`); no AI attribution in commits.

## Decisions (locked)

1. **Convert the homepage to a freeform `blocks[]` builder** — like `page` docs. The `homepage` document gets a `blocks[]` array of the registered block types, rendered through the shared `<Blocks>` renderer (`components/blocks/index.tsx` componentMap). Editors drag/reorder/add any block. The existing fixed-field content is migrated into `blocks[]` on staging.
2. **The currently-hard-coded sections become real blocks**: `region-map` and `people-widget` get Sanity schemas + registration so they're placeable + configurable (un-gate the map). They already exist as components.
3. **New reusable `events-calendar` block**: full month calendar (event days tinted) + an upcoming-events list + **inline RSVP** per event + a Subscribe/iCal link. Backed by the existing `lib/events.ts fetchApprovedEvents()` + the `event` Sanity doc + `lib/actions/rsvp.ts`.
4. **Lived-experiences carousel**: adopt the already-built `lived-experiences-carousel` block (cards + play overlay + VideoModal + arrows) in place of the testimonial `carousel-2` currently wired to `homepage.livedExperiences`.

## Target §4.1 home, section → block

| Section | Verdict | Block |
|---|---|---|
| Hero (Explore / Collaborate CTAs, blob accent) | ADAPT `hero-1` — fix CTAs, add blob accent | `hero-1` |
| Explore by region (clickable region map, "Open the Atlas") | ADAPT `region-map` → make a real CMS block, un-gate | `region-map` (new schema) |
| News & updates (media list) | ADAPT `grid-row` + `grid-news` (list-layout variant) | `grid-row` |
| Events (month calendar + list + inline RSVP) | **BUILD** | `events-calendar` (new) |
| Lived experiences carousel ("View all") | ADAPT — wire the existing block in | `lived-experiences-carousel` |
| Share your lived experience (submit banner) | ADAPT `cta-1` | `cta-1` |
| Funder / partner strip | KEEP | `logo-cloud-1` |
| People in your region (existing E2 widget) | ADAPT → make a real CMS block | `people-widget` (new schema) |

## Architecture

- **`homepage` schema** (`sanity/schemas/documents/homepage.ts`): add a `blocks[]` array `of:` the registered homepage-eligible block types (hero-1/hero-2, split-row, grid-row, carousel-1/2, lived-experiences-carousel, timeline-row, cta-1, logo-cloud-1, faqs, form-newsletter, region-map, people-widget, events-calendar, section-header). Keep the SEO/meta + `language` + `slug` fields. The fixed content fields are retained read-only during the migration, then removed after the soak (dual-field transition; like the agenda→researchOutput pattern).
- **Render path**: `components/pages/homepage.tsx` renders `<Blocks blocks={homepage.blocks} />` (the shared renderer) instead of the fixed section list. The dynamic resolvers (`resolveNewsSection`/`resolveAgendasSection`) move into the relevant blocks' own data-fetch (grid-row already supports dynamic mode).
- **Block registration**: each new/promoted block = a Sanity schema in `sanity/schemas/blocks/**` + a `componentMap` entry in `components/blocks/index.tsx` + the type added to the homepage `blocks[]` `of:` list. (region-map + people-widget already have components — add schemas.)
- **Content migration** (`scripts/`): a staging-gated, idempotent, dry-run/`--apply` script that reads each per-locale homepage doc's fixed fields and writes an equivalent ordered `blocks[]`, refusing prod, backing up first (mirrors the Phase-6 migration scripts).

## Slices (each ships + validates on staging independently)

### Slice H1 — `blocks[]` foundation + content migration
- Add `blocks[]` to `homepage.ts` (`of:` the homepage-eligible registered blocks). Hand-edit `sanity.types.ts`.
- `homepage.tsx` renders via the shared `<Blocks>` renderer; keep the fixed-field fallback during transition.
- Migration script: fixed fields → `blocks[]` per locale, on the `development` dataset; validate the homepage renders identically from `blocks[]`.
- Green gate + rendered validation on dev/staging.

### Slice H2 — promote hard-coded sections to blocks; hero CTAs
- `region-map`: add a Sanity schema (title/description/defaultFacet already drafted in the existing `region-map.ts` object — promote to a homepage block), register in componentMap (already there), add to `blocks[]`; un-gate (drop the `FEATURES.homepageMap` guard once it's a real block). Keep the choropleth for v1; the blob/bubble visual is a **noted follow-up** (out of scope here to keep the slice shippable).
- `people-widget`: add a Sanity schema (title/description/limit), make it a placeable block; un-gate.
- Hero: fix `hero-1` CTAs to **Explore** (→ `/atlas`) and **Collaborate** (→ the collab space); add the blob accent element (reuse `ccmblob` keyframe / an organic shape) to `hero-1`.

### Slice H3 — `events-calendar` block (full calendar + list + inline RSVP)
- New schema `sanity/schemas/blocks/events/events-calendar.ts` (title, optional region filter, count) + component `components/blocks/events/events-calendar.tsx`: a month grid (`grid-cols-7`, event days tinted from `event.startAt`), an upcoming-events list, inline RSVP per event (reuse `components/events/rsvp-button.tsx` + `lib/actions/rsvp.ts`), and a Subscribe/iCal link. Data via `fetchApprovedEvents()`. Register + add to `blocks[]`.
- Unit tests for any new event-date helpers (month-grid day computation, upcoming filter).
- Green gate + rendered validation.

### Slice H4 — adapt remaining blocks + compose §4.1
- Lived carousel: retype `homepage.livedExperiences` usage to render `lived-experiences-carousel`; add a "View all" link. (As a block it's just placed in `blocks[]`.)
- News list-layout variant on `grid-row`/`grid-news` (thumb + region dot + date + headline media-list).
- Submit-lived-experience banner via `cta-1`.
- Compose the §4.1 home order in `blocks[]` on the staging homepage doc(s) + migrate/author content. Validate the full page (375 + RTL).

## Out of scope (noted follow-ups)

- Blob/bubble region-map visual (keep the choropleth; swap the presentational layer later).
- Hero **feature carousel** (auto-advancing rotating hero) — v1 hero is a single static hero with the Explore/Collaborate CTAs.
- "Open projects" panel (`homeProjects` bind) — data exists; a block can follow.
- Removing the legacy fixed homepage fields — done post-soak after the `blocks[]` migration is validated in prod (dual-field transition).

## Testing & validation

- Unit tests: migration script (dry-run idempotency), events date helpers.
- Rendered validation on dev/staging: each block renders; the composed §4.1 home matches the handoff; editors can reorder blocks in Studio; mobile 375 + RTL `ar`.
- Green gate each slice (`pnpm typecheck && pnpm test && pnpm build`).

## Risks

- **`blocks[]` migration** must preserve the current homepage content — mitigated by the dual-field transition (keep fixed fields until the `blocks[]` render is validated) + a backup-first migration script, staging-only.
- **Per-locale homepage docs** (en/es/fr/ar) — the migration runs per locale; validate all four.
- **Un-gating the region map**: it becomes always-on once it's a real block — confirm the `region-data` API performs on the homepage (it already powers `/atlas`).
- Never `sanity typegen generate` (hand-edit `sanity.types.ts`); never `migrate dev`.
