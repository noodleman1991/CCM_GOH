# Page builder foundation (CMS programme, project 1)

Date: 2026-09-28 · Status: approved in conversation, awaiting spec review · Branch: `master`

## 1. Why

Editing the hub in the Payload CMS is confusing. Three audits (2026-09-27)
found:

- **Three different ways to build a page, each edited differently:**
  - the homepage is 11 fixed sections that can't be added, removed or
    reordered;
  - regional communities are split across two content types in two menu
    groups; their layout is fixed in code, so the section order set in the CMS
    is ignored, and some fields are never shown;
  - regular pages have a real section list, but with technical names
    ("Hero1", "Cta1", "Carousel2", "Grid Row"), no pictures, and a separate
    list per language that editors rebuild four times.
- **Three vocabularies for "fill this automatically"** (`gridRow.mode`,
  `contentGrid.mode`, and none at all on the newer blocks). Twelve ready-made
  sections exist in the site's code (`components/blocks/index.tsx`) but have no
  CMS definition, so they can't be added anywhere.
- Hand-picking content works in some places and **silently does nothing** in
  others. There is no preview anywhere.

**Success:** an editor can build or change any page by adding, reordering and
removing plainly named sections, choose between automatic and hand-picked
content in one consistent way, and see the result live, without a developer.

## 2. The programme and its decisions

Five projects, each with its own spec, plan and check-in. This spec is
project 1.

| # | Project | Depends on |
|---|---|---|
| 1 | **Page builder foundation** (this spec) | — |
| 2 | Homepage onto the builder (starts from today's 11 sections, so nothing looks different on day one) | 1 |
| 3 | Regional communities as one document on the builder, with data migration | 1 |
| 4 | Regular pages onto shared layouts, keeping per-language layouts where they genuinely differ | 1 |
| 5 | Content forms cleanup: tabs, plain help text, legacy fields hidden, Approve = publish, pin/reorder, list search, dashboard | — |

Order: 1 → 2 → 3 → 4, then 5.

**Decisions made in the conversation (binding on all five projects):**

- D1 **One builder everywhere.** Homepage, regional community pages and regular
  pages are all an ordered list of sections that editors add, reorder and
  remove, with live preview. Each starts from a preset of today's layout. A
  section can be marked required where a page must always keep it.
- D2 **Languages: shared layout with an opt-out.** One section list per page,
  with only the text translated. A per-page switch gives each language its own
  layout for pages that genuinely differ.
- D3 **Content feed: any mix of kinds**, three ways to fill it: Automatic /
  Automatic + my picks first / Only my picks.
- D4 **One document per regional community** (project 3).
- D5 **Approve = publish** for submitted content types (project 5).
- D6 **The section library** as in §3.1 (approved as shown).

## 3. Project 1 scope

### 3.1 The section library

When an editor clicks "Add section" in the admin block picker, they see plain
names, a small picture of each, and these groups:

| Group | Section (label) | Source today | CMS definition |
|---|---|---|---|
| Openings | Hero | `hero1` | exists; relabel |
| Openings | Hero with image | front-end `hero-2` | **new** |
| Openings | Section heading | `sectionHeader` | exists; relabel |
| Text & media | Text + image | `splitRow` | exists; relabel |
| Text & media | Image carousel | front-end `carousel-1` | **new** |
| Text & media | Timeline | front-end `timeline-row` | **new** |
| Text & media | FAQs | front-end `faqs` | **new** |
| Content | **Content feed** | new (§3.2) | **new** |
| Content | Events calendar | front-end `events-calendar` | **new** |
| Content | People | front-end `people-widget` | **new** |
| Content | Link cards | `gridRow` with hand-written `gridCard` columns | exists; relabel |
| Maps | Region map | front-end `region-map` | **new** |
| Maps | Atlas | front-end `atlas-embed` | **new** |
| Calls to action | Call to action | `cta1` | exists; relabel |
| Calls to action | Share-your-story banner | front-end `submit-story-banner` | **new** |
| Calls to action | Newsletter signup | front-end `form-newsletter` | **new** |
| Logos & quotes | Logo strip | `logoCloud1` | exists; relabel |
| Logos & quotes | Testimonials | `carousel2` | exists; relabel |

Rules:

- **Relabel only.** Existing blocks change `labels`, add `imageURL`,
  `imageAltText` and a picker group, but **keep their `slug` and field names**,
  so stored data is untouched and no migration is needed for them.
- **New blocks** get a Payload definition whose fields match the props the
  existing front-end component already takes, so the components render them
  unchanged. Where a component's prop names differ from the stored field
  names, an adapter maps them in the same place today's blocks are adapted.
- Front-end-only `fresh-content` and `lived-experiences-carousel` are **not**
  added separately. They are Content feed configurations (§3.2); their
  components stay for the rendering they do today.
- **Pictures:** one small schematic SVG per section in `public/admin/sections/`
  (for example `public/admin/sections/content-feed.svg`). They are drawn with
  the site's `ccm-*` palette, show the section's shape rather than a
  screenshot, are about 480×270, and each has alt text.
- **Picker grouping:** each block declares one of the six groups. If the
  installed Payload version does not support block groups, fall back to
  ordering the picker by group, with the group name as a label prefix
  ("Content · Content feed"). The plan confirms which applies.
- **"(old)" pieces stay working.** `gridRow`'s automatic mode (`mode` =
  dynamic-recent/dynamic-featured) and the regional `contentGrid` ("Content
  section") keep rendering exactly as today until projects 2 and 3 convert
  them. In the admin, `contentGrid` gets the label "Content section (old)" and
  `gridRow`'s mode field the description "Old automatic setting: use a
  Content feed section instead". Nothing is removed in this project.

### 3.2 The Content feed section

**Fields (admin, in order).** Labels and help are in plain words:

1. **Heading** (localized text, optional) and **Intro** (localized textarea,
   optional).
2. **What to show:** a multi-select of kinds, at least one: Case studies, News,
   Events, Lived experiences, Research outputs, Agendas. Default: Case studies.
3. **How to fill it:** a radio with three options:
   - "Automatic: newest items that match"
   - "Automatic, with my picks first"
   - "Only the items I pick"

   Default: Automatic.
4. **My picks:** a relationship to the six collections, hasMany, drag to order,
   published items only. Shown only when the fill mode isn't Automatic.
5. **Filters (optional)**, a collapsible closed by default:
   - Region: multi-select of the fixed seven.
   - Community: relationship to regional communities, hasMany.
   - Themes and tags: relationship to tags, hasMany.
   - Featured only: checkbox.
   - Upcoming events only: checkbox, shown only when Events is chosen.
6. **Order:** Newest first (default) / Featured first / Soonest upcoming (shown
   only with Events) / My order (shown only with "Only the items I pick").
7. **How many:** a number, 1–24, default 6.
8. **Layout:** Grid (default) / Carousel / List.
9. **"View all" link:**
   - A checkbox "Show a View all link", default on.
   - When exactly one kind is chosen, the link goes to that kind's listing page
     with the same filters applied where the listing supports them, and the
     label comes from messages.
   - Otherwise an editor-set link and label (localized) appear, and the link
     only shows if both are set.
10. **What will show now:** a read-only admin panel (§3.5).

**On a regional community page** (from project 3): the feed defaults to "this
community" as its community filter. The editor can clear it. Project 1 builds
the context hook; project 3 supplies the context.

**The engine.** `resolveContentFeed(settings, context): Promise<TypedCardItem[]>`
lives in `lib/content/feeds/` and returns the existing mixed card shape
(`TypedCardItem`, `lib/cards/type-style.ts`).

- **Automatic:** query each chosen kind with the filters and published/approved
  rules, reusing the multi-kind region/tag filtering that already exists in
  `lib/content/internal/payload/discovery.ts` rather than writing new queries.
  Then merge and sort, and take the first *count*.
- **Automatic with picks first:** picks in the editor's order, then automatic
  items not already picked, up to *count*.
- **Only picks:** picks in the editor's order (or sorted, if an order other
  than My order is chosen), up to *count*.
- **Sort fields per kind:**
  - Newest: publish date (events: start date).
  - Featured first: featured, then newest. Kinds without a featured flag count
    as not featured.
  - Soonest upcoming: events with a start date from now onward, soonest first;
    other kinds after them, newest first.
- **Featured only** keeps only kinds with a featured flag, and the admin says
  so ("Events have no featured flag, so they won't appear").
- **Upcoming events only** affects events only.
- **Robustness:**
  - A pick that is unpublished, deleted or no longer approved is skipped
    quietly; the admin panel lists it as "not shown: unpublished".
  - An item is never shown twice.
  - An empty result renders nothing: no heading, no empty box.
- **Caching:** feeds go through the existing cached query layer with the same
  content tags, so the existing revalidation hooks refresh them when content
  changes. No new cache mechanism.
- **Backend:** the engine is Payload-only. On the Sanity backend the section
  renders nothing and logs one warning. The plan confirms that production runs
  with `CONTENT_BACKEND=payload`.

**Rendering.** A new `ContentFeed` component renders the cards with the
existing typed card component in the chosen layout (grid, carousel, list),
plus heading, intro and "View all". It follows the site's current design
language, is mobile-first and RTL-correct, and uses `min-h-11` tap targets on
controls.

### 3.3 Sections field and languages

The builder is one reusable field factory, `sectionsField({ blocks, required? })`,
in `payload/fields/sections.ts`. It gives a document:

- **`layoutPerLanguage`**, a checkbox labelled "This page has its own layout in
  each language". Default off.
- **`sections`**, one unlocalized blocks list, shown when that checkbox is off.
  The *text fields* inside each section are localized, so the layout is shared
  and only the words are translated.
- **`sectionsByLanguage`**, a localized blocks list, shown when that checkbox
  is on. Each language has its own list.

Constraint to resolve in the plan: a field may not be localized inside an
already-localized list. The factory therefore builds each block config in two
variants, text localized (for `sections`) and plain (for
`sectionsByLanguage`), from one definition. The plan confirms Payload 3.88's
behaviour and the Postgres table naming for both variants.

**Translation status:** each section row in the admin shows a compact status,
"EN ✓ · ES missing · FR ✓ · AR missing", computed from whether the section's
text fields have a value in each locale. It uses a custom row-label component
that reads the document with `locale=all` once per document. The component
imports only pure modules (admin client-import rule). On the site, a missing
translation falls back to English with `lang="en"` on that text.

**Required sections:** when `sectionsField` is given `required: [slug]`, those
sections can't be removed (validation message: "This page always keeps its
{section}. You can move it, but not remove it."). Used by projects 2 and 3.

**In project 1** the factory is built and tested but **not yet applied** to the
homepage, regional communities or pages (projects 2–4). The new sections from
§3.1 are added to the *existing* `pages` blocks list now, so editors can use
them immediately.

### 3.4 Live preview

- Payload `admin.livePreview` is configured on the `pages` collection and the
  `homepage` global:
  - it builds the page URL from the slug and locale;
  - it offers phone (375), tablet (768) and desktop (1280) widths.
- The preview goes through the existing draft-mode routes
  (`app/api/draft-mode/enable`, `.../disable`) and their existing secret
  mechanism. The plan reads those routes and reuses them; if they're
  Sanity-specific, it adds a Payload-authenticated enable path that only signed-in
  editors can use.
- In draft mode the front end mounts Payload's route-refresh-on-save client
  component, so the preview updates as the editor saves drafts. Readers already
  use the draft-aware query (`queryPreviewable`) for pages; the plan confirms
  this for the homepage.
- The public never sees drafts: draft mode needs the secret or an editor
  session.

### 3.5 "What will show now" panel

The panel is a read-only admin component on each Content feed section:

- It calls a new editor-only route (`POST /api/admin/feed-preview`, returning
  403 unless the user is staff) with the section's current settings and
  context.
- It lists the up to *count* titles that would appear right now, each with its
  kind and a link to open it.
- It shows skipped picks ("not shown: unpublished") and an empty state ("Nothing
  matches: try fewer filters").
- It updates on change, debounced 500 ms. Server errors show as a plain sentence
  and never break the editor.

### 3.6 Database

One additive Payload migration for the new block tables (the new section types
in `pages`, the Content feed with its polymorphic picks and filter
relationships). Nothing is altered or dropped. It is generated, checked for
anything non-additive (stop and report if found), and applied to the dev
database only with the usual host check. Production applies it automatically
on boot (`prodMigrations`).

## 4. Testing and verification

- **Unit (engine):**
  - each fill mode;
  - each filter (region, community, tags, featured-only exclusion of
    unflagged kinds, upcoming-only);
  - each sort, including mixed kinds;
  - picks merged with automatic results and de-duplicated;
  - skipped unpublished/deleted picks;
  - empty result;
  - the count bound;
  - the "View all" link rules.
- **Unit (fields):**
  - `sectionsField` produces both variants;
  - required-section validation;
  - translation-status computation;
  - every block has a label, picture, alt text and group.
- **Render (jsdom):** each new section renders its current component from CMS
  data; ContentFeed in grid, carousel and list, in LTR and RTL; the hidden empty
  feed.
- **Admin:** `/admin` returns 200 after each payload change. The feed-preview
  route answers 403 for non-staff and returns titles for staff.
- **Dev database round trip:** create a page using every section type (including
  a mixed feed with picks), preview it, publish it, and check the rendered page
  (200, expected cards, no empty boxes).
- **Signed-in checklist for the user** (the agent can't sign in):
  - the block picker with pictures and groups;
  - live preview updating;
  - the "What will show now" panel;
  - translation status;
  - required-section protection, if demonstrated.

## 5. Out of scope

- Converting the homepage (project 2), regional communities (project 3) and
  existing pages' per-language lists (project 4).
- Content forms, the publish flow, pin/reorder and the dashboard (project 5).
- Removing `gridRow`'s automatic mode or `contentGrid`: they're relabelled
  "(old)" here and removed when their pages are converted.
- The front-end-only `team-grid` and `all-posts` blocks: noted, not added
  (decide in project 4).

## 6. Open items the plan must confirm (not assume)

1. Payload 3.88 support for block picker groups; otherwise use the §3.1
   fallback.
2. Localized fields inside localized blocks, and the two-variant factory
   approach (§3.3), including Postgres table naming.
3. Draft-mode enable route: its secret mechanism and whether it serves Payload
   drafts (§3.4).
4. That `CONTENT_BACKEND=payload` in production (§3.2 backend note).
5. How new block slugs map to the front-end registry keys in
   `components/blocks/index.tsx` (camelCase vs kebab-case adapter).
