# Human-friendly forms: shared error system + case study form redesign

Date: 2026-09-26 · Status: approved in conversation, awaiting spec review · Branch: `feat/payload-migration`

## 1. Why

Users of the hub's submission forms get stuck and lose work. The case study
form is the worst case, audited on 2026-09-25/26:

- Errors appear only on Preview/Submit, stay after being fixed, arrive as a
  vague toast ("Please fix the highlighted issues") with no jump to the
  problem, and some (co-author name/email, organisation length) are computed
  but never shown. Server rejections surface as "Validation failed".
- "Submit for review" can be disabled with no visible reason (a hover-only
  tooltip, absent on touch).
- Client and server require different things (the client wants a 100-char
  summary and a topic; the server wants neither).
- Drafts silently lose the place and the cover image; Save draft is hidden on
  phones; edits to a submitted-but-in-review case study are not saved.
- Typing markdown mostly works, but pasted markdown is not converted, and
  strikethrough / inline code / code blocks are shown while typing and then
  dropped on save.
- Four overlapping location systems (place search; country + city boxes with
  "Find on map" showing raw coordinates; regional community; region tags).
  Published case studies show coordinates ("51.51, -0.13") instead of a place
  name, and new submissions never get `region` set.
- Classification is a required Topic menu (16 options fixed in code, against
  the rule that vocabularies come from the CMS) plus a 68-pill tag wall with
  no search or grouping; the tags error says "select a topic".
- Language: a four-language switch covers only the title and summary; the
  story follows the page's direction, so Arabic writing on the English site is
  left-to-right.

Across the hub the same problems recur in ~10 forms and 37 API routes that
reply with their own, often English-only, developer-worded errors.

**Success:** a first-time contributor, in any of the four languages, can
finish a submission without getting stuck, always knows what is missing and
how to fix it, and never loses work. Already-published content keeps
displaying and filtering correctly.

## 2. Scope and order

Four projects, each designed, checked and shipped separately:

1. **Shared error system** (this spec, §4).
2. **Case study form redesign** on top of it (this spec, §5–§7).
3. Every other form moved onto the system: lived experience, research output,
   events first; then profile edit, recent work, onboarding, account,
   newsletter, collaboration. *Own spec later.*
4. CMS (Payload admin) messages: friendly field messages for editors and
   replacing Payload's generic wording ("The following fields are invalid").
   *Own spec later.*

This spec covers projects 1 and 2 in full.

## 3. Decisions (from the conversation)

| # | Decision |
|---|---|
| D1 | **Tags only.** The separate Topic is dropped; tags come from the CMS in a searchable picker grouped by category. The first theme tag picked is the main theme. |
| D2 | **Location** is required to submit, satisfied by *either* a place *or* a regional community. With a community but no place, the form nudges: "Add a specific place so this appears as a pin on the map — without one it only shows on the community's page." Drafts need neither. |
| D3 | **Language:** the author picks the language they write in; title, summary and story are in that language with the right direction. If not English, a short English title and one-line English summary are also required. Other translations are optional under "Add translations". |
| D4 | **Shape:** one scrolling page in a clearer order, plus a "What's left" checklist (side panel on desktop, bottom bar on phones) that jumps to each missing item. |
| D5 | **Location is by search only.** The search replaces the country/city boxes and "Find on map". |
| D6 | Project order 1 → 2 → 3 → 4. |

## 4. Project 1: the shared error system

### 4.1 Messages

- A new `forms` namespace in `messages/{en,es,fr,ar}.json` holds every
  validation message, written as a plain sentence that says what to do:
  "Add a title so readers know what this is about", not
  "String must contain at least 5 character(s)".
- Limits read naturally and carry numbers: "Keep this under {max} characters
  (it's {count} now)".
- Upload messages name the problem and the fix: "This image is {size} MB — the
  limit is {max} MB. Try a smaller photo or a screenshot."
- No developer words in any message (schema, validation, invalid, field names
  like `excerpt.en`).

### 4.2 One rule set per form, shared by browser and server

- Each form's rules are a zod schema in `lib/validation/<form>.ts`, imported
  by both the client form and the API route. The client-only `makeFormSchema`
  in `case-study-form.tsx` is removed.
- Rules reference **message keys**, not English strings (for example
  `{ message: "forms.title.required" }`, with values where needed).
- A small translation step (`lib/validation/messages.ts`) turns a zod error
  into `{ path, key, values }` entries, and those into sentences with
  next-intl on the client or `getTranslations` on the server. So a server
  error comes back in the reader's language.
- Draft variants derive from the same schema (`.partial()` plus relaxations),
  as `caseStudyDraftSchema` already does, so a draft never has stricter or
  different types.

### 4.3 One reply shape from every API route

Every route that rejects input replies with:

```json
{ "error": { "message": "Some details need fixing.", "fields": { "title.en": "Add a title so readers know what this is about" } } }
```

- `message` is a whole-form sentence; `fields` maps form paths to sentences.
  Both are translated using the request's locale.
- A helper `lib/api/form-error.ts` (`formErrorResponse(zodError | fields,
  locale, status)`) builds it. Upload, size and rate-limit rejections use the
  same shape.
- In this project the helper is applied to the case study routes
  (`/api/case-studies/submit`, `/api/case-studies/drafts`) and to the image
  upload route the cover now uses (`/api/uploads/image`, §6.4);
  the other 34 routes move in project 3.

### 4.4 One behaviour in every form

- A hook, `useFormErrors(schema)`:
  - tracks which fields have been touched;
  - validates a field when you leave it;
  - clears an error the moment its value becomes valid;
  - validates everything on Preview or Submit;
  - merges server `fields` into the same state;
  - exposes `focusFirstError()`, which scrolls to and focuses the first field
    in page order that has an error.
- A `FieldError` component renders the sentence under its input, with an id,
  and the input gets `aria-invalid` and `aria-describedby`.
- Nothing turns red while the user is still typing in a field they haven't
  left yet.
- A `WhatsLeft` component takes a list of
  `{ id, label, done, targetId, severity: "required" | "nudge" }`:
  - It renders the checklist; tapping an item focuses its target.
  - Required items gate Submit.
  - Nudges are shown but never block.
  - Desktop: a sticky side panel. Phones: a slim bottom bar ("3 things left ·
    Save draft · Submit") that opens a drawer with the list.

## 5. Project 2: the case study form

### 5.1 Order and wording

1. **Writing in:** English / Español / Français / العربية (D3). This sets
   `dir` and `lang` on the title, summary and story editor.
2. **Cover image:** a large optional drop area near the top.
3. **Your story:**
   - Title.
   - Summary: "One or two sentences about what happened". It shows a live
     count, needs at least 50 characters, and is capped by the existing limit.
   - Story: the body editor.
   - If the writing language isn't English: "English title" and "One-line
     English summary", both required.
   - "Add translations" (collapsed): an optional title and summary per other
     language.
4. **People:** "Who wrote this?" ("Byline" is removed from the UI), then
   organisation. Every co-author's name and email error shows under that
   co-author.
5. **Where & when:** place search (§6.2), then regional community (suggested
   from the place, changeable), then dates ("When did this happen?").
6. **Tags:** the grouped, searchable picker (§6.1).
7. **Presentation:** Story / Feature / Report, each with a small thumbnail of
   the result. It moves here from the top.

The review/preview step stays. It shows the place name, never coordinates.

### 5.2 Required to submit (one rule set, §4.2)

- A title (at least 5 characters) and a summary (at least 50 characters), in
  the writing language.
- If the writing language isn't English, an English title (at least 5
  characters) and a one-line English summary (at least 20 characters).
- A story with at least one paragraph of text.
- At least one author with a name; a co-author's email, if given, must be
  valid.
- At least one theme tag (category `topic`).
- A place **or** a regional community (D2).
- Nudge, never blocking: community without place → the map message in D2.

A draft requires nothing.

### 5.3 "What's left" items

In page order, each in plain words, for example:

- "Add a title"
- "Write a short summary (at least 50 characters)"
- "Write your story"
- "Add an English title" (only when not writing in English)
- "Add who wrote this"
- "Choose at least one theme"
- "Add where this took place"

Nudge: "Add a specific place to appear on the map". The panel also holds the
draft status, Save draft (visible on phones), Preview and Submit.

## 6. Data and behaviour changes

### 6.1 Tags replace Topic

- **Picker:**
  - Tags come from the CMS with their `category`, grouped under user-facing
    headings: `topic` → "Themes", `audience` → "Who it affects",
    `impact` → "Impact", `method` → "Approach", `other` → "Other". The
    headings are translated in `messages/*`.
  - The `location` category is hidden from the picker; region comes from
    location (§6.2).
  - A search box filters across groups.
  - Chosen tags show as removable chips in pick order.
  - "Suggest a tag" (free text, fuzzy-matched) stays under the picker, worded
    "Can't find it? Suggest a new tag for the editors".
- **Main theme:** the first chosen tag whose category is `topic`. The order is
  kept by the `tags` hasMany relationship. Cards and the review step show the
  main theme where they showed Topic.
- **Stored `topic` field:** no longer set by the form and no longer required.
  A Payload migration drops `required` (NOT NULL) on `case_studies.topic`.
- **Converting existing topics** (script, dry run first):
  - Each of the 16 topic values is mapped to an existing theme tag, proposed
    by label similarity and **confirmed by the user from the dry-run table**.
  - Topics with no good match are listed for the user to decide (create a tag
    in the CMS, or map to one). No tag is created automatically.
  - Each case study gets its mapped tag added **first** in its tags, so it
    becomes the main theme, unless that tag is already present.
  - Dev first, then prod after the user has seen the prod dry run.
- **Filters:**
  - The case studies list page's topic filter (`case-studies-filters.tsx`,
    `case-studies/page.tsx`) becomes a theme-tag filter fed by the CMS.
  - Old `?topic=` URLs map to the corresponding tag.
  - The news filters' use of `topicOptions` is checked. If news relies on it,
    it moves to CMS tags the same way; if not, the import is removed.
- **Removal:** `lib/content/taxonomy-options.ts` topic options and the `topic`
  field are deleted in a later cleanup, after production is confirmed.
- **Data fix:** "Vulnerable Populations" is re-filed from category `location`
  to `audience`, as a data edit.

### 6.2 Location by search

- **Geocoder:** `geocodeQuery` (`lib/geocoding.ts`) also returns `country` and
  `city` names from Nominatim's `address`, where city is `city`, `town`,
  `village`, `municipality` or `county`, in that order. It also returns an
  automatic precision derived from the result kind:
  - country → `country`;
  - state or region → `region`;
  - city, town or village → `city`;
  - anything else → `exact`.
- **PlacePicker:**
  - Search as you type with suggestions.
  - Picking one shows a small map preview with a pin and the place name.
    There is no precision radio. A "Change" link reopens the search.
  - Hint: "Can't find it? Search for the country or region instead."
  - The editable "display name" stays, as "How should we name this place?",
    prefilled.
- **Removed from the form:** the country and city inputs, "Find on map", and
  every coordinate readout.
- **Regional community:**
  - After a place is picked, the community in the same region (via
    `lib/maps/iso-to-region.ts`) is preselected if exactly one exists.
    Otherwise it's left for the user.
  - It's always changeable, and can be the only location given (D2).
- **On submit** (`submitCaseStudy` → `payloadData`):
  - `studyLocation`, `locationDisplayText`, `locationPrecision` and
    `locationCountryCode` come from the place, as today.
  - `locationText.country` and `locationText.city` are now filled from the
    place's names.
  - `region` is set from the community's region, else from the country code.
    Today it is never set.
- **Readers:**
  - `getStudyLocationText` (`lib/case-study-utils.ts`) prefers
    `locationDisplayText`, then "city, country" from `locationText`, then the
    community name, and **never coordinates**.
  - The search index location name (`payload/hooks/search-sync.ts`) and
    grouped search use the same order.
  - After deploy, case studies are re-indexed so search stops showing
    coordinates.

### 6.3 Languages

- **New field:** `originalLanguage` on `caseStudies`, a select of
  `en | es | fr | ar`, default `en`. A migration adds it and sets `en` on the
  existing rows.
- **Writes:**
  - Title, summary and story are written to the `originalLanguage` locale.
  - The English title and summary go to `en`. When the writing language is
    English they are the same values.
  - Optional translations go to their own locales, following the same pattern
    as `mirrorSubmissionLocales`.
- **Reads:** the detail page, cards and review use the requested locale's body
  when it exists. Otherwise they show the `originalLanguage` body with the
  note "Originally written in {language}", and `dir`/`lang` taken from
  `originalLanguage`.
- **Drafts:** the drafts collection's existing `contentLanguage` field holds
  the writing language.

### 6.4 Drafts

- `caseStudyDrafts` gains `locationDisplayText`, `locationPrecision` and
  `locationCountryCode` (migration), and the form's place value is saved into
  them.
- The cover image is uploaded to `media` when chosen, through the existing
  `/api/uploads/image` route, not at submit, so its
  reference is stored in the draft. On submit, a draft's existing image is
  reused, not uploaded again. Images that end up unused are acceptable in
  this project; a later cleanup can remove them.
- **Safety copy:** the form mirrors its state to `localStorage` on each change.
  If the server save fails, the status says "Couldn't save — we'll keep trying.
  Your text is safe on this device." On load, a local copy newer than the
  server draft is offered: "Restore your unsaved changes?"
- **Status:** always visible, as "Saved · 12:04", "Saving…" or the failure text
  above.
- **In review:** a submitted case study that is still `pending` or `revision`
  autosaves the user's edits to its own record (same ownership check as
  resubmission), so edits aren't lost before resubmitting.

### 6.5 The story editor

- **Markdown while typing** (TipTap StarterKit, `portable-text-editor.tsx`):
  - `##`, `###`, lists, quotes, bold and italic keep working.
  - `#` is enabled and maps to the same heading level as `##`, since the page
    already has a title.
- **Pasted markdown:** plain-text paste that looks like markdown (lines
  starting with `#`, `-`, `*`, `1.`, `>`, or containing `**…**` or
  `[text](url)`) is parsed into headings, lists, quotes, bold, italic and
  links. Use `@tiptap/markdown` if it fits TipTap 3's setup; otherwise a small
  parse step in `transformPastedText`/`handlePaste`. HTML paste keeps today's
  behaviour.
- **No silent loss:** strikethrough, inline code and code blocks round-trip
  through the Portable Text converter (`editor/pt-convert.ts`): `strike-through`
  and `code` marks, and a `code` block type. They're rendered on the published
  page too.
- **Direction:** the editor's `dir` and `lang` follow the writing language
  (D3), not the page locale.

## 7. Database migrations

All migrations are Payload migrations, generated and applied on the dev
database first, then applied to prod at deploy.

1. `case_studies.topic`: drop NOT NULL.
2. `case_studies.original_language`: new select column, default `en`,
   backfilled to `en`.
3. `case_study_drafts`: add `location_display_text`, `location_precision` and
   `location_country_code`.

Data scripts (dry run, then execute; dev then prod) follow the pattern and
guards of `scripts/payload-import/lib/runtime.ts`:

- converting topics into tags (§6.1), with the mapping table confirmed by the
  user;
- re-filing "Vulnerable Populations";
- re-indexing case studies in search.

How prod migrations run at deploy is confirmed before the first deploy of
this work. It is not assumed.

## 8. Testing and verification

- **Unit:**
  - message translation (every schema message key exists in all four
    languages);
  - the reply shape;
  - `useFormErrors` behaviour (touched, blur, clear, focus order);
  - `WhatsLeft` gating vs nudges;
  - geocoder precision and name mapping;
  - region derivation;
  - `getStudyLocationText` never returning coordinates;
  - pt-convert round-trips for strike, code and code block;
  - markdown paste parsing.
- **Render (jsdom):**
  - the case study form's error flow: blur, fix, error clears, Submit focuses
    the first problem;
  - server `fields` shown under the right inputs;
  - the phone bottom bar;
  - an Arabic form with RTL.
- **Real dev database** (lib-level harness, as used on 2026-09-25):
  - draft with nothing, then reopen;
  - place, image and translations survive a draft;
  - submit with community only (passes, nudge shown), with a place (region
    set, city and country filled);
  - an Arabic original with an English title;
  - topic conversion dry run and execute on dev.
- **Rendered pages:**
  - the published detail page and cards show place names and "Originally
    written in";
  - the list page's tag filter;
  - old `?topic=` URLs.
  - The signed-in form itself cannot be rendered by the agent (Clerk-gated), so
    a short manual checklist is handed to the user after deploy.

## 9. Out of scope

- Case studies' `themes` and `populations` fields: also fixed in code, not set
  by the form and not seen in case study readers. They're confirmed unused,
  then left alone; folding them into tags is a separate decision.
- Dragging the map pin to adjust a place.
- Projects 3 and 4, beyond their listing in §2.
- Cleaning up media left unused by abandoned drafts.
