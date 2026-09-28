# Homepage on the page builder, with partner organisations — design

**Programme:** CMS project 2 of 5 (1 builder foundation ✅ → **2 homepage** → 3 regional communities → 4 pages on shared layouts → 5 content forms). Binding decisions D1–D6 are in `2026-09-28-page-builder-foundation-design.md` §2.

**Date:** 2026-09-28 · **Status:** approved in conversation, awaiting written-spec review

## 1. What and why

Today the homepage is eleven fixed slots in the `homepage` global, rendered by a hard-coded template (`components/pages/homepage.tsx`). Editors can't add, remove or reorder anything; three slots carry one-off automatic code (news, agendas, lived experiences); the newer sections never reach the homepage; and the partner logos are 20 loose uploaded pictures that link nowhere.

After this project:

- The homepage is an ordinary **Sections** list (project 1's `sectionsField`): one layout shared by all four languages, the opening hero required, everything else free to add, remove and reorder, with drafts and live preview.
- Its automatic parts are **Content feeds** using the site's card style.
- It gains three new sections: **Fresh on the hub**, a **Share-your-story banner** and the **Region map**.
- **Partner logos come from organisation records** and each links to a new **organisation page** on the hub that shows the organisation and the hub content linked to it.
- Every section is quick to edit: staff get an **Edit** button on each homepage section on the site, and rarely used settings fold into **More options**.

**Success:** the migrated homepage matches today's in every section except the agreed changes (feed cards, three new sections, linked logos); an editor can reorder the homepage, change a feed, or add a partner without help; reverting is one action.

## 2. Decisions (user-confirmed 2026-09-28)

| # | Decision |
|---|---|
| H1 | Automatic parts become Content feeds in the site's typed-card style — news and agendas as **grid**, lived experiences as **carousel**. Hand-made grids stay **Link cards**; hand-picked quotes stay **Testimonials**. |
| H2 | **One shared layout** for all four languages. Per-language text is kept; the few non-text differences are flattened to English and reported. |
| H3 | Only the **opening hero** is required (a Hero or Hero with image must be present; it can move). |
| H4 | The migration also adds **Fresh on the hub**, the **Share-your-story banner** and the **Region map**. |
| H5 | Approach **C**: an additive schema migration adds the sections; a separate, dry-run-first **move script** fills them; the old slots stay in the database, hidden, as the backup; they are deleted in a later clean-up. |
| H6 | Partner logos link to **organisation pages on the hub**; organisations become the logo source. In scope for this project. |
| H7 | Clipped/unused organisation records: **fix names where clear, hide the rest** (never delete); the script lists them for review. |

## 3. Design

### 3.1 The homepage global

- Add `sectionsField({ blocks: HOMEPAGE_SECTIONS, required: [["hero1", "hero2"]], tablePrefix: "hp" })`. `requiredSectionsValidator` gains a one-of form: an inner array means any one of those sections satisfies the rule (a plain string still means exactly that section). The message names the first: "This page always keeps its Hero. You can move it, but not remove it."
- `HOMEPAGE_SECTIONS` = every section in the project 1 library except "Content section (old)".
- The eleven slot groups and the Sanity-era `blocks` field get `admin.hidden: true` (data untouched). The global's admin description explains the Sections list is what the homepage shows.
- `title`, `meta_title`, `meta_description`, `noindex`, `ogImage` stay as they are.
- One additive migration creates the `hp_s_*` / `hp_l_*` block tables, the `layout_per_language` column and version-table mirrors. Nothing dropped or renamed; the same line-by-line check as project 1.

### 3.2 The move script — `scripts/homepage/move-to-sections.ts`

Pure core `planHomepageSections(slots, locales) → { sections, differences, notes }` (unit-tested) plus a thin runner. Dev by default; `--production` needed for production (user runs it); nothing written without `--execute`; refuses when the homepage already has sections unless `--replace`. Writes a **published** version (it is a copy of published content).

Order it builds (the three new ones marked ★):

1. Hero ← `heroWelcome` (hero1, fields copied)
2. ★ Content feed "Fresh on the hub" — case studies, news, lived experiences, research outputs; automatic; 5; grid; heading from `typedCards.freshHeading` in each language
3. Text + image ← `globalAgenda`
4. Text + image ← `howToUse`
5. Content feed ← `agendasModule`: agendas; automatic; count = old `maxItems` (default 3); sort `featuredFirst` if the old mode was dynamic-featured, else `newest`; grid; old title/description kept
6. Lived experiences ← `livedExperiences`: if the slot has hand-picked testimonials → Testimonials (carousel2, copied); otherwise Content feed of lived experiences, automatic, 8, carousel, old heading kept
7. ★ Share-your-story banner — texts left empty so the component shows its translated defaults (`submitStoryBanner.*` messages: "Share your story" / "Submit your story"), linking to `/lived-experiences/submit`
8. ★ Region map — heading "Explore by region" and its es/fr/ar translations, written by the script and shown in the dry run for review
9. Link cards ← `regionalCommunities` (gridRow, manual, copied)
10. Text + image ← `collaboration`
11. Content feed ← `news`: news; automatic (the slot's effective behaviour today — no mode means "latest"); count = old `maxItems` (default 3); grid
12. Text + image ← `projectInfo`
13. Call to action ← `mentalHealthDefinition`
14. Logo strip ← `partnerLogos`, now listing the partner **organisations** (§3.4) in the same order, keeping title, description and layout

Text: every translatable value is copied per language into the shared section's localized fields. Row lists (links, split columns, grid columns, logos) come from English; `differences` lists every non-text value that differed between languages (expected: hero button size; news picks, now moot). The runner prints a per-language before/after table and the differences, and the section list it will write.

Rollback: `--revert` empties the Sections list; the renderer falls back to the old slots immediately.

### 3.3 Rendering

- Reader (`lib/content/internal/payload/homepage.ts`) returns `sections`: the shared list, or — with the per-language switch on — that language's list (English if empty). Localized values are collapsed to the visitor's language with English fallback per field, then mapped by the existing `pageBlocks` adapter.
- `components/pages/homepage.tsx`: sections present → `<Blocks>` (the same renderer as pages); empty → today's fixed-slot template, unchanged. The `homepage.blocks` branch is removed (always empty).
- Feeds resolve per request through the cached query layer; an empty feed hides itself; a failing kind doesn't take the page down (project 1 behaviour).

### 3.4 Organisations

**Records** (`organizations` collection, additive fields):
- `showOnSite` checkbox, default on — hidden records get no page and never appear in a logo strip. Label: "Show this organisation on the site".
- Existing `logo`, `website`, `description` (localized), `type`, `regionalCommunity`, `place` reused.
- Admin: `defaultColumns` name/type/showOnSite; a "View on site" link.

**Partner move** (part of the move script, same dry-run/execute gates): for each of the 20 homepage logos, match an organisation by name (from the logo's alt text minus "Logo") case-insensitively; otherwise create one — name, logo = the uploaded picture, type = the logo's `orgType` if set. The table shows match/create per logo for review before `--execute`.

**Clean-up of the 24 existing records** (same script, separate `--orgs` step): propose a full name where the fragment matches one known name unambiguously (a small curated map in the script, e.g. "Cook University" → "James Cook University"; shown for review), else set `showOnSite: false`. The one record a case study uses keeps its links. Nothing deleted.

**Organisation page** `/[locale]/organizations/[slug]`:
- Header: logo (or initials tile), name, acronym, type, place/region, website link, description (visitor's language, English fallback).
- "On the hub": a Content feed (grid) of everything linked to the organisation — case studies, news, research outputs, lived experiences, agendas — via a new feed filter `organizationIds`; hidden when empty.
- 404 when the record doesn't exist or `showOnSite` is off. Added to the sitemap. Metadata from name/description/logo.

**Logo strip** (`logoCloud1`, used on the homepage and 4 other pages):
- New `organizations` field: ordered, hasMany, only `showOnSite` records offered; label "Partner organisations"; description "Each logo links to the organisation's page on the hub."
- The existing `images` list stays for logos with no organisation, relabelled "Other logos (not linked)"; pages that use it render as today.
- Renderer: organisations first (their logo, alt = name, link to their page; no logo → name chip), then the other logos. Grid-by-type grouping uses the organisation's `type`.

**Feed engine:** `FeedFilters.organizationIds` (normalised like the other id lists); each kind that has an `organizations` relation filters on it; a kind without one is left out when the filter is set.

### 3.5 Easy to edit

- **Edit button (staff only):** in the site, each homepage section gets a small "Edit" link visible only to staff (same `isStaff` gate as the issue reporter), opening `/admin/globals/homepage` at that section (`#` anchor to the section row; the section expands). Keyboard reachable, 44px target, hidden from visitors' DOM.
- **More options:** padding, background, colours, marquee speed and similar presentation settings move into a collapsed "More options" group on every section. Stored field names don't change (a `collapsible` doesn't nest data), so no migration.
- Everything from project 1 applies: pictures in the picker, plain labels, "What will show now", translation status, drafts, live preview.

## 4. Testing

- Unit: `planHomepageSections` (all 11 slots; testimonials edge case; count/sort carry-over; the three new sections' texts per language; differences report); the one-of required rule; reader (shared vs per-language, per-field English fallback); renderer (sections → Blocks; empty → legacy template); organisation matching and name-fix proposals; feed `organizationIds` filter per kind; logo strip mapping (org logo/alt/link, no-logo chip, mixed with other logos); organisation page reader (404 for hidden/missing).
- Migration checked line by line; applied on dev only.
- Dev run: dry run → review tables → execute; homepage screenshots before/after in English and Arabic at 375 and 1280 (scroll-through first, sections fade in); an organisation page; logo links; `--revert` restores the old homepage; `--replace` refusal.
- Full suite, `tsc`, lint of changed files. Signed-in checklist in the runbook (edit buttons, More options, required hero message, logo strip organisation picker).

## 5. Out of scope

Deleting the old slot fields (later clean-up, once production has been stable); regional community pages (project 3); moving other pages to shared layouts (project 4); organisation search indexing; people/member lists on organisation pages.

## 6. Risks

- **Row-list flattening** could drop a per-language link label → the differences report lists every such value before execute.
- **Wrong partner match** → dry-run table; creates rather than guesses when unsure.
- **Production run** is the user's (`--production --execute`), after deploy; until then production renders the old slots, unchanged.
