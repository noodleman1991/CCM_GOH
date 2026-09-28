# Regional community pages on the page builder — design

**Programme:** CMS project 3 of 5 (1 builder foundation ✅ → 2 homepage ✅ → **3 regional communities** → 4 pages on shared layouts → 5 content forms). Binding decisions D1–D6: `2026-09-28-page-builder-foundation-design.md` §2. Patterns reused from project 2: `2026-09-28-homepage-on-sections-design.md`.

**Date:** 2026-09-28 · **Status:** approved in conversation, awaiting written-spec review

## 1. What and why

A regional community lives in two content types today, in two admin groups: **Regional communities** (`regionalCommunities`: name, region, members, contact — what every case study, news post and event links to) and **Community pages** (`regionalCommunityPages`: two heroes, a list of "Content section (old)" grids, the atlas switch, a logo slot). The page layout is fixed in code (`components/templates/regional-community-template.tsx`), the section order editors set is only partly respected, a code-built region header replaces the CMS heroes, and the route carries three dead Sanity-era display branches.

Measured on dev (2026-09-28): all 7 pages hold the same six sections in the same order in every language — agendas, case studies, news, lived experiences, team, (testimonials) — many with hand-picked items; the two heroes and the logo slot are empty on all 7; the atlas is on for all 7; community records hold no members.

After this project a community is **one record** edited in one place, its page is an ordinary **Sections** list with drafts and live preview, feeds on it know their community, and the chapter menu is driven by the sections themselves.

**Success:** after the move each community page shows the same chapters and content as today (plus agenda cards that open their document); an editor can reorder a community page, add any section, rename a chapter, or hand-pick items without help; reverting is one command.

## 2. Decisions (user-confirmed 2026-09-28)

| # | Decision |
|---|---|
| C1 | One record per community: `regionalCommunities` absorbs the page (D4). `regionalCommunityPages` is hidden and kept as the backup. |
| C2 | Chapter menu: any section can carry "Show in the page menu as" — standard chapters (Overview, Agendas, Case studies, News, Community voices, Members, Partners) shown in the visitor's language from the site's messages, or Custom (a label per language). |
| C3 | No required sections on community pages. |
| C4 | The region header becomes a **Community header** section (fills itself; optional intro line), placed first by the move. |
| C5 | Same move pattern as project 2: additive migration, dry-run-first script with `--execute`, `--revert`, `--replace`, old data hidden not deleted. |
| C6 | Agenda cards (everywhere) open the agenda's document. |

## 3. Design

### 3.1 The community record

`payload/collections/regional-communities.ts` gains, after its existing fields:
- `...sectionsField({ blocks: COMMUNITY_SECTIONS })` — no required sections. `COMMUNITY_SECTIONS` = the homepage library (`HOMEPAGE_SECTIONS`) plus `communityHeader` and `communityMembers`.
- `meta_title`, `meta_description` (localized), `ogImage`, `noindex` — the same helpers the pages collection uses.
- `versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 }`; read access `publishedOnly` — **the migration marks every existing community `published`** (the shared query layer filters drafts-enabled collections to `_status: published`; without the backfill every community vanishes from the site).
- `admin`: group "Site pages", `defaultColumns: ["name", "region", "_status"]`, `livePreview` at `/<lang>/communities/<slug>` (the project-1 helper, extended to take a path builder), `description: "One record per regional community: its details and its page."`. Existing fields (name, region, cover image, members, contact…) move into a "Details" collapsible so Sections is prominent; stored names unchanged.

`regionalCommunityPages`: `admin.hidden: true`; data untouched.

### 3.2 New sections

- **Community header** (`communityHeader`, group Openings, picture "community-header"): fields `intro` (localized textarea, optional) + More options (padding). Renders the existing `RegionHero` for the page's community (illustration, name, Get involved, Follow), with the intro under the name when set. On a page with no community context it renders nothing.
- **Community members** (`communityMembers`, group Content, picture "people"): fields `title` (localized, optional; default heading from `regional.sectionTitles.members`) + More options. Renders `RegionMembersBlock` for the page's community; when that graph is empty and the community record lists `members`, shows those as the team grid.
- Both are only in `COMMUNITY_SECTIONS` (not offered on the homepage or pages).

### 3.3 Chapter menu

- A `chapterField()` added to every section in `COMMUNITY_SECTIONS` (and harmless elsewhere): a `group` named `chapter` inside More options with `kind` (select: none (default), overview, agendas, caseStudies, news, voices, members, partners, custom) and `label` (localized text, shown only for custom). Label: "Show in the page menu as".
- Rendering: `groupIntoChapters(blocks)` — a section with a chapter starts that chapter; sections without one join the chapter above; sections before any chapter render without an anchor. Standard kinds resolve their label from `regional.sectionTitles.*` in the visitor's language; custom uses its own label (English fallback). The existing `RegionSectionSpine` renders the menu when there are two or more chapters; each chapter is a `<section id>` anchor (`scroll-mt-14`), ids from the kind (`overview`, `agendas`, …) or a slug of the custom label.

### 3.4 Feed context and agenda cards

- `<Blocks>` gains `context?: { communityId?: string }`, passed to every section component as `communityId`. `ContentFeed` already accepts `communityId` and uses it when the feed sets no community filter (project 1 engine).
- Agenda cards: the feed's agenda mapping sets `href` to the agenda's first file URL (`files[0].file.url`, via the existing media URL helper) when present; otherwise `/research-and-action`. Applies to every feed (homepage included).

### 3.5 The move script — `scripts/communities/move-to-sections.ts`

Pure planner `planCommunitySections(page, locales)` (unit-tested) + runner, same gates as project 2 (dev by default, `--production`, `--execute`, `--replace`, `--revert` with `SKIP_REQUIRED_SECTIONS`-style context not needed since nothing is required). For each community page, write to its linked `regionalCommunity` record:

1. Community header — chapter overview
2. Atlas (`atlasEmbed`, region = the community's region) when `atlasEmbed.enabled !== false`, `showBreakdown` carried — chapter overview
3. Each old `contentGrid` in its stored order, by `contentType`:
   - agendas / caseStudies / news / livedExperiences → Content feed: kinds from the type; heading/intro from the grid's title/description (per language); fill: `manual` → only my picks (order kept), `dynamic-with-pinned` → automatic + my picks first, `dynamic-featured` → automatic, featured first, `dynamic-recent` → automatic, newest; picks from `manualItems` (their kind + id); count from `maxItems` (default 6); layout grid, lived experiences carousel; chapters agendas / caseStudies / news / voices.
   - team → Community members (title carried) — chapter members.
   - testimonials → Testimonials (carousel2) only when it has picked testimonials; otherwise skipped with a note.
4. Welcome hero / why-join hero / logo strip — only when filled (none are today), as Hero / Hero / Logo strip (organisations if its logos match organisation records, else "Other logos"); logos in chapter partners.
5. Page metadata (meta title/description, ogImage, noindex) copied to the record.

Writes English first, then each other language onto the same rows (`withIdsFrom`, exact-language `toLocaleData` from project 2), `_status: published`. Dry run prints per community: the section list with chapter and per-language heading, picks resolved to titles (unresolvable picks listed), and non-text language differences.

### 3.6 The route and reader

- `lib/content/internal/payload/regional-community.ts` gains `communitySections(record, locale)` (shared/per-language, collapse with English fallback, `pageBlocks`) and exposes `sections`, `communityId` and the metadata on what `getRegionalCommunityPage` returns.
- `app/[locale]/(main)/communities/[slug]/page.tsx`: sections present → chapters + `<Blocks context={{ communityId }}>` (staff edit links to `/admin/collections/regionalCommunities/<id>#sections-row-N`); none → today's `RegionHero` + `RegionalCommunityTemplate` path unchanged. The three dead branches (`contentFlow` / legacy `blocks` with the wedged agenda grid / `titleHero`+`listHero`) are deleted. Metadata prefers the record's own fields.

## 4. Testing

Unit: planner (six grid types × modes, chapters, per-language text, picks, atlas on/off, empty heroes skipped); reader (shared vs per-language, English fallback, sections vs fallback); `groupIntoChapters` (implicit joining, custom labels, standard labels per language, one chapter → no menu); Blocks context → feed community default, explicit filter wins; Community header / members rendering (with and without context); agenda card href (file vs fallback); published backfill (communities still returned by the published query after the migration); route (sections path vs fallback path; dead branches gone). Migration checked line by line (additive + the published backfill). Dev run: dry run → execute → two communities in English and Arabic at 375 and 1280, before vs after (same chapters, same content, working menu), second run refused, `--revert` restores. Full suite, `tsc`, lint of changed files; runbook with signed-in checklist.

## 5. Out of scope

Deleting `regionalCommunityPages` and the old template (later clean-up); regular pages (project 4); new member features; community search indexing changes.

## 6. Risks

- **Drafts on a widely-linked collection** → the migration's `published` backfill plus a test that a published read still returns all communities; checked on dev before the move.
- **Picks that no longer resolve** (deleted/unpublished items) → skipped by the feed at render and listed in the dry run.
- **Chapter anchors colliding** (two chapters of the same kind) → the second gets `-2`.
