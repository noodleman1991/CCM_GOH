# Sanity Studio — conventions & feature policy

This is the editing layer for the Connecting Climate Minds Hub. It's intentionally
opinionated so the editing experience stays consistent and the schema stays
maintainable. Read this before adding a content type, a block, or a plugin.

## i18n — two lanes (DO NOT add a third mechanism)

The site uses **two** internationalisation patterns, on purpose. Keep using these;
do not introduce a new i18n mechanism.

- **Lane A — document internationalisation** (one document per language + a
  `language` field). Used for page-/body-heavy types: `page`, `homepage`,
  `regionalCommunityPage`, `post`, `onboardingContent`. Registered in
  `sanity.config.ts` under `documentInternationalization`. Slug uniqueness via
  `sanity/lib/isUniqueOtherThanLanguage.ts`.
- **Lane B — field-level localized object** `{ en, es, fr, ar }`. Used for
  single-document / short-string / reference types: `case-study`,
  `regionalCommunity.name`, `tag`, `faq`, `testimonial`, plus the inline
  localized `title`/`description` on `agenda`/`report`. Build these with the
  shared helper `sanity/schemas/shared/localized-field.ts` (`createLocalizedField`).

Renderers resolve either shape with `getLocalizedText` / `getLocalizedField` in
`lib/localization-utils.ts` (string-tolerant, falls back to `en` then any
available language). When sorting localized tags, use `sortTagsByLabel`.

## Schema conventions

- **Field groups** for any document with more than ~8 fields — group by concern
  (Details / Contact / Location / SEO / Settings), with a sensible `default`
  group. Tiny docs (≤ a few fields) don't need groups.
- **Descriptions** on non-obvious fields — write them for the editor, in plain
  language. The first group of a complex doc should orient the editor.
- **Validation** via the shared helpers in `sanity/schemas/shared/validation.ts`
  (`urlRule`, `emailRule`, `requiredUrlRule`, `requiredString`). Every title +
  slug should be `required()`; every `url` field should use `urlRule`; emails use
  `emailRule`. Validation messages should sound human.
- **Previews** — give every type a `preview` with a meaningful title + subtitle +
  media so the document lists are scannable. Show status / language counts where
  useful (see `agenda`).
- **initialValue** — set sensible defaults (status enums, booleans) so new docs
  start in a valid, useful state.
- **Block style controls** — content blocks get a consistent pair: **section
  padding** + (where a real background is wanted) **background-option** with the
  "Light text for a dark background" toggle. Do NOT re-add a `colorVariant`-style
  picker — it was a no-op and was removed. Section width/spacing/headings are
  governed by `lib/design-tokens.ts`, not per-block options.

## Sanity features — USE

- `structureTool` with the custom desk in `sanity/structure.ts` (organised by
  purpose + filtered views, e.g. case studies by status).
- `presentationTool` (live preview / draft mode).
- `visionTool` (GROQ debugging) — dev convenience.
- `documentInternationalization` (Lane A).
- `@sanity/code-input` (code blocks where needed).
- Custom **document actions** (the case-study approve / request-revision / reject
  / preview actions in `sanity/actions`) — extend this pattern for editorial
  workflows when genuinely needed.
- Field `group` + `fieldset`, `validation` with custom messages, custom `preview`
  media/subtitle, `initialValue` templates, conditional `hidden`.

## Sanity features — AVOID (unless explicitly decided)

- A **second i18n mechanism** — the two-lane model is the standard. No
  `internationalizedArray*` (retired), no ad-hoc per-component localisation.
- **Scheduled publishing / workflow plugins** — not adopted; the case-study
  action workflow covers current needs.
- **AI assist** — not enabled.
- **Heavy custom input components** beyond what already exists (the admin key
  inputs on `expertise-area` / `work-type`). Prefer schema config over bespoke
  React inputs.
- **Restructuring already-grouped docs into nested objects** purely for tidiness
  — if a doc is already grouped, a write-migration isn't worth the risk (see the
  onboarding-content decision).

## Data safety

The dataset is currently **public** (read). Never rely on a field being private:
sensitive reads (e.g. case-study `reviewNotes`, `submittedBy`) must go through
authenticated server routes (`writeClient` + Clerk), never the browser client.
Public-facing GROQ must filter to approved/published content. Before trimming any
schema option list, scan the dataset for stored usage of the values first.
