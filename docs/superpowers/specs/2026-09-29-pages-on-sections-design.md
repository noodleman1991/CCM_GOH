# Regular pages on shared layouts — design

**Programme:** CMS project 4 of 5 (1 builder foundation ✅ → 2 homepage ✅ → 3 regional communities ✅ → **4 pages on shared layouts** → 5 content forms). Binding decisions D1–D6: `2026-09-28-page-builder-foundation-design.md` §2. Patterns reused from projects 2–3 (`…homepage-on-sections-design.md`, `…communities-on-sections-design.md`).

**Date:** 2026-09-29 · **Status:** approved in conversation, awaiting written-spec review

## 1. What and why

Regular pages keep a separate section list per language (`pages.blocks`, localized), so every layout change is made four times and the languages drift. Measured on dev (2026-09-29): 9 pages; 6 have the same structure in all four languages; 3 differ:

- **Toolkits** — English: banner + 3 toolkit download cards; es/fr/ar: banner + 3 plain text columns whose text is still English, no downloads.
- **Impact reports** — English: banner + 3 report download cards; es/fr/ar: translated banner + 3 bare translated title lines.
- **About** — es/fr/ar carry an extra heading ("The Connecting Climate Minds Journey", translated) before the same two sections and logo strip English has.

After this project every page is an ordinary **Sections** list with one layout shared by all languages (only the words translated), like the homepage and community pages.

**Success:** the 6 matching pages look the same in every language after the move; Toolkits and Impact reports show English's download cards in every language, banners still translated; About keeps its journey heading in all four languages; reverting is one command.

## 2. Decisions (user-confirmed 2026-09-29)

| # | Decision |
|---|---|
| P1 | All pages move to the shared layout (`layoutPerLanguage` off). |
| P2 | Pages whose languages differ take **English's layout**; text carries over wherever a section lines up; sections only other languages have are left out (kept in the backup). |
| P3 | **About** keeps its journey heading in all four languages; English gets "The Connecting Climate Minds Journey". |
| P4 | No required sections on regular pages. |
| P5 | Same move pattern: additive migration, dry-run-first script with `--execute`, `--revert`, `--replace`, `--only`; old lists hidden, not deleted. |

Arabic stays right-to-left (site-wide behaviour, unchanged).

## 3. Design

### 3.1 The pages collection

- Add `...sectionsField({ blocks: PAGE_SECTIONS })` **after** the existing `blocks` field (Payload's own `_2` table naming then leaves the old tables intact — project 2 lesson; no custom `dbName`s). `PAGE_SECTIONS` = `HOMEPAGE_SECTIONS` (the full library minus the retired regional section).
- `blocks` gets `admin.hidden: true` (data untouched). Collection description: "The page shows the Sections below, in order. (The old per-language lists are kept hidden as a backup.)"
- Drafts, live preview and the translation status label already exist on pages.
- One additive migration; if Postgres's 63-character limit bites, apply `withShortEnumNames` to the page copies (project 3 helper).

### 3.2 The move script — `scripts/pages/move-to-sections.ts`

Pure planner `planPageSections(page)` (unit-tested) + runner with the project-2/3 gates.

- **Alignment.** English's list is the layout. Each other language's list is aligned to it by block type in order (longest common subsequence on `blockType`); for every aligned pair the section is built with the project-2 field-by-field builder (`planSection`), so translatable values become `{ en, es, fr, ar }` maps and row lists keep each language's text where row counts match. A section in English with no counterpart in a language gets English text only there (shown until translated). A section only another language has is left out and listed.
- **Matching pages** (identical sequences) therefore keep every language's text exactly.
- **About rule** (explicit, by slug, printed in the dry run): prepend a Section heading whose title is `{ en: "The Connecting Climate Minds Journey", es/fr/ar: their own heading's title }`, taking the other languages' heading from their unaligned leading `sectionHeader` (so it is not "left out").
- **Dry run prints** per page: `SHARED` (identical) or `ALIGNED TO ENGLISH`, the section list with headings in en/es/fr/ar, sections left out per language, non-text differences, notes.
- Writes: English first, then each other language onto the same rows (`withIdsFrom`, exact-language `toLocaleData`), `_status: published`. Refuses a page that already has sections unless `--replace`; `--revert` empties `sections`/`sectionsByLanguage`.

### 3.3 Reading and rendering

- The pages reader returns `sections` (shared, or the language's own list with the switch on; per-field English fallback via `collapseLocales`; mapped by `pageBlocks`) when the list has any; otherwise today's per-language `blocks` unchanged. Callers keep receiving `blocks`, so the renderer and metadata don't change.
- Staff "Edit this section" links on the sections path (`/admin/collections/pages/<id>#sections-row-N`).

## 4. Testing

Unit: alignment (identical lists; English-led with a language having extra/missing sections; per-language text through `planSection`; About rule; left-out listing); reader (sections vs blocks fallback; shared vs per-language; English fallback). Migration checked line by line. Dev run: before/after for About, Toolkits and one matching page (Feedback) in English and Arabic at 375 and 1280; second run refused; `--revert` restores. Full suite, `tsc`, lint; runbook section with signed-in checklist.

## 5. Out of scope

Deleting the hidden per-language lists (later clean-up); content forms (project 5); rewriting the English copy of Toolkits/Impact reports cards.

## 6. Risks

- **Mis-alignment** when two sections of the same type are reordered between languages → the dry run shows every heading side by side before execute.
- **Toolkits' es/fr/ar text columns** were English text, so nothing translated is lost; **Impact reports' translated title lines** are dropped (listed) — the cards take titles from the report records.
