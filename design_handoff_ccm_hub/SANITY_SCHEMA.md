# CCM Hub — Sanity Schema & Content Operations

The build-ready content model for the prototype in `CCM Hub Redesign.dc.html`. Every type, field, taxonomy value, block and workflow state here is taken from the prototype's data — not a generic template. Code is **Sanity v3 / TypeScript** (`defineType`/`defineField`). Drop each block into `schemaTypes/` and register it in `schemaTypes/index.ts`.

> **Conventions**
> - IDs/slugs are lowercase-kebab. Taxonomy uses fixed `list` options so editors can't free-type values that break the hub's color/filter maps.
> - All public, reader-facing copy is **localized** (see §3) and **versioned** (see §4).
> - "Publishes to hub" types go through the **review workflow** (§6); internal types skip it.

---

## 1. Type inventory (mirrors the prototype)

| Sanity type | Hub content type | Publishes to hub? | Layouts | Localized | Versioned |
|---|---|---|---|---|---|
| `caseStudy` | Case study | ✅ | Story / Feature / Report | ✅ | ✅ |
| `livedExperience` | Lived experience (video/audio/written) | ✅ | Story | ✅ | — |
| `newsPost` | News / blog post | ✅ | Brief / Feature / Story | ✅ | — |
| `researchOutput` | Research output / toolkit | ✅ | Report / Story | ✅ | ✅ |
| `event` | Event / open meeting | ✅ | — | ✅ | — |
| `fundingApplication` | Funding / grant application | ❌ internal | — | partial | ✅ |
| `dataset` | Dataset / evidence | ❌ internal | — | — | ✅ |
| `project` | Project (collab space + public page) | ✅ public page | — | ✅ | — |
| `region` | Regional community (7 fixed) | ✅ | — | ✅ | — |
| `person` | Member / contributor profile | ✅ profile | — | partial | — |
| `thread` / `comment` | Community discussion & content comments | ✅ | — | — | — |
| `annotation` | Document annotation (PDF/report) | internal | — | — | — |

**Shared building blocks** (objects, not documents): `blockContent` (§5), `localeString` / `localeText` / `localeBlock` (§3), `documentVersion` (§4), `taxonomy` fields (§2), `connection` (§7).

---

## 2. Taxonomy (single source of truth)

These are the exact option sets the hub's filters and color map depend on. Define once and reference everywhere.

```ts
// schemaTypes/taxonomy.ts
export const REGIONS = [
  { title: 'Europe & Northern America',        value: 'enam' },
  { title: 'Latin America & the Caribbean',    value: 'lac'  },
  { title: 'Northern Africa & Western Asia',   value: 'nawa' },
  { title: 'Sub-Saharan Africa',               value: 'ssa'  },
  { title: 'Central & Southern Asia',          value: 'csa'  },
  { title: 'Eastern & South-Eastern Asia',     value: 'esea' },
  { title: 'Oceania',                          value: 'oce'  },
] as const;

export const THEMES = [
  { title: 'Displacement', value: 'displacement' },
  { title: 'Livelihoods',  value: 'livelihoods'  },
  { title: 'Youth',        value: 'youth'        },
  { title: 'Indigenous',   value: 'indigenous'   },
];

export const POPULATIONS = [
  { title: 'Children & youth', value: 'youth' },
  { title: 'Women',            value: 'women' },
  { title: 'Indigenous peoples', value: 'indigenous' },
  { title: 'Farmers & rural livelihoods', value: 'farmers' },
  { title: 'Displaced & migrants', value: 'displaced' },
];

export const ATLAS_LAYERS = [
  { title: 'Case studies',       value: 'cases'    },
  { title: 'Lived experiences',  value: 'lived'    },
  { title: 'Active projects',    value: 'projects' },
  { title: 'Contributors',       value: 'people'   },
];

export const LANGS = [
  { title: 'English',  value: 'en' },
  { title: 'Français', value: 'fr' },
  { title: 'العربية',  value: 'ar' },
  { title: 'Español',  value: 'es' },
];

// the layout archetypes (meaning encoded in shape — see WIREFRAMES §case detail)
export const LAYOUTS = [
  { title: 'Story — cover + narrative',     value: 'story'   },
  { title: 'Feature — bold split cover',    value: 'feature' },
  { title: 'Report — dossier + sidebar',    value: 'report'  },
];
```

A reusable taxonomy field group:

```ts
// schemaTypes/objects/taxonomyFields.ts
import { defineField } from 'sanity'
import { REGIONS, THEMES, POPULATIONS } from '../taxonomy'

export const regionField = defineField({
  name: 'region', title: 'Region', type: 'string',
  options: { list: REGIONS, layout: 'dropdown' },
  validation: (r) => r.required(),
})
export const themesField = defineField({
  name: 'themes', title: 'Themes', type: 'array',
  of: [{ type: 'string' }], options: { list: THEMES },
})
export const populationsField = defineField({
  name: 'populations', title: 'Populations', type: 'array',
  of: [{ type: 'string' }], options: { list: POPULATIONS },
})
export const yearField = defineField({
  name: 'year', title: 'Year', type: 'number',
  validation: (r) => r.min(2015).max(2100),
})
```

---

## 3. Localization (multilingual — EN / FR / AR / ES)

Field-level localization (recommended over document-level for the hub, so one document = one piece of content with all its translations and a single review state). RTL handling for `ar` is a front-end concern (the `dir="rtl"` rules already in the design system).

```ts
// schemaTypes/objects/locale.ts
import { defineType } from 'sanity'
import { LANGS } from '../taxonomy'

const fields = LANGS.map((l, i) => ({
  name: l.value, title: l.title, type: 'string',
  fieldset: i === 0 ? undefined : 'translations',
}))

export const localeString = defineType({
  name: 'localeString', title: 'Localized string', type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields,
})

export const localeText = defineType({
  name: 'localeText', title: 'Localized text', type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: LANGS.map((l, i) => ({ name: l.value, title: l.title, type: 'text', fieldset: i ? 'translations' : undefined })),
})

export const localeBlock = defineType({
  name: 'localeBlock', title: 'Localized rich text', type: 'object',
  fieldsets: [{ name: 'translations', title: 'Translations', options: { collapsible: true, collapsed: true } }],
  fields: LANGS.map((l, i) => ({ name: l.value, title: l.title, type: 'blockContent', fieldset: i ? 'translations' : undefined })),
})
```

> Front end reads `field[lang] ?? field.en` so a missing translation falls back to English rather than rendering blank.

---

## 4. Versions (summary vs full report, across languages)

The user's requirement: *documents can be multilingual and have several versions (e.g. summary + full report), in multiple languages.* A `documentVersion` object models one downloadable/embeddable rendition; a document holds an array of them. Language lives on each version, so "Summary (FR)" and "Full report (EN)" coexist.

```ts
// schemaTypes/objects/documentVersion.ts
import { defineType, defineField } from 'sanity'
import { LANGS } from '../taxonomy'

export const documentVersion = defineType({
  name: 'documentVersion', title: 'Version', type: 'object',
  fields: [
    defineField({ name: 'kind', title: 'Kind', type: 'string',
      options: { list: [
        { title: 'Summary', value: 'summary' },
        { title: 'Full report', value: 'full' },
        { title: 'Brief', value: 'brief' },
        { title: 'Slide deck', value: 'deck' },
      ] }, validation: (r) => r.required() }),
    defineField({ name: 'lang', title: 'Language', type: 'string',
      options: { list: LANGS }, validation: (r) => r.required() }),
    defineField({ name: 'label', title: 'Display label', type: 'string',
      description: 'e.g. "Full report (EN)" — shown on the version × language switcher' }),
    // Either an uploaded file…
    defineField({ name: 'file', title: 'File (PDF/DOCX/XLSX)', type: 'file' }),
    // …or hub-native block content (so it renders in-page & is annotatable):
    defineField({ name: 'body', title: 'In-hub body', type: 'localeBlock' }),
    defineField({ name: 'pages', title: 'Page count', type: 'number' }),
  ],
  preview: {
    select: { kind: 'kind', lang: 'lang', label: 'label' },
    prepare: ({ kind, lang, label }) => ({ title: label || `${kind} (${lang})` }),
  },
})
```

This drives the **Documents tab's version × language chips** and the public output page's download/embed switcher.

---

## 5. Block content (the editor + layout templates)

One portable-text schema powers the block editor and all reader layouts. Block `kind`s mirror `blocksByType` in the prototype: Heading, Paragraph, Pull quote, Image, Key findings, Video, plus structural blocks for connections and embeds.

```ts
// schemaTypes/objects/blockContent.ts
import { defineType, defineArrayMember } from 'sanity'

export const blockContent = defineType({
  name: 'blockContent', title: 'Body', type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'Heading', value: 'h2' },
        { title: 'Subheading', value: 'h3' },
        { title: 'Pull quote', value: 'blockquote' },
        { title: 'Lead paragraph', value: 'lead' }, // larger intro styling
      ],
      lists: [{ title: 'Bullet', value: 'bullet' }, { title: 'Numbered', value: 'number' }],
      marks: {
        decorators: [{ title: 'Bold', value: 'strong' }, { title: 'Italic', value: 'em' }],
        annotations: [
          // a link to another hub document — renders as a "connection" chip inline
          { name: 'internalRef', title: 'Link to hub content', type: 'object',
            fields: [{ name: 'ref', type: 'reference',
              to: [{ type: 'caseStudy' }, { type: 'researchOutput' }, { type: 'project' }, { type: 'event' }, { type: 'newsPost' }] }] },
          { name: 'link', title: 'External link', type: 'object', fields: [{ name: 'href', type: 'url' }] },
        ],
      },
    }),
    // Image with caption + credit (Image block in the editor)
    defineArrayMember({ type: 'image', name: 'figure', options: { hotspot: true },
      fields: [
        { name: 'alt', type: 'string', title: 'Alt text' },
        { name: 'caption', type: 'localeString', title: 'Caption' },
        { name: 'credit', type: 'string', title: 'Credit' },
      ] }),
    // Media embed (Video / audio — Lived experience uses this)
    defineArrayMember({ name: 'mediaEmbed', title: 'Media embed', type: 'object',
      fields: [
        { name: 'provider', type: 'string', options: { list: ['youtube', 'vimeo', 'soundcloud', 'file'] } },
        { name: 'url', type: 'url' }, { name: 'file', type: 'file' },
        { name: 'transcript', type: 'localeText', title: 'Transcript' },
      ] }),
    // Key findings callout (Report layout "at a glance")
    defineArrayMember({ name: 'keyFindings', title: 'Key findings', type: 'object',
      fields: [{ name: 'items', type: 'array', of: [{ type: 'localeString' }] }] }),
    // Embedded dataset/file viewer (EmbedPDF / sheets — real-world collaboration, not gated)
    defineArrayMember({ name: 'embeddedDoc', title: 'Embedded document', type: 'object',
      fields: [{ name: 'dataset', type: 'reference', to: [{ type: 'dataset' }] }] }),
  ],
})
```

The three **layout archetypes** are presentation, not content — the same `blockContent` renders into Story / Feature / Report by a `layout` field on the document (front end picks the template). That's why "switching keeps your content, only the layout changes" in the editor.

---

## 6. Publishable content types + the review workflow

### 6.1 Case study (the flagship — full example)

```ts
// schemaTypes/documents/caseStudy.ts
import { defineType, defineField } from 'sanity'
import { regionField, themesField, populationsField, yearField } from '../objects/taxonomyFields'
import { LAYOUTS } from '../taxonomy'

export const caseStudy = defineType({
  name: 'caseStudy', title: 'Case study', type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'taxonomy', title: 'Taxonomy' },
    { name: 'links', title: 'Connections' },
    { name: 'workflow', title: 'Workflow' },
  ],
  fields: [
    defineField({ name: 'title', type: 'localeString', group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title.en' }, group: 'content', validation: (r) => r.required() }),
    defineField({ name: 'layout', title: 'Layout', type: 'string', options: { list: LAYOUTS }, initialValue: 'story', group: 'content' }),
    defineField({ name: 'heroImage', type: 'image', options: { hotspot: true }, group: 'content',
      fields: [{ name: 'alt', type: 'string' }, { name: 'credit', type: 'string' }] }),
    defineField({ name: 'lead', title: 'Lead / dek', type: 'localeText', group: 'content' }),
    defineField({ name: 'body', title: 'Body', type: 'localeBlock', group: 'content' }),
    defineField({ name: 'versions', title: 'Versions (summary / full / langs)', type: 'array', of: [{ type: 'documentVersion' }], group: 'content' }),

    regionField, themesField, populationsField, yearField, // group: taxonomy (add group on each if desired)

    // authorship & provenance
    defineField({ name: 'authors', title: 'Authors', type: 'array', of: [{ type: 'reference', to: [{ type: 'person' }] }], group: 'content' }),
    defineField({ name: 'authorByline', title: 'Byline (free text, e.g. org)', type: 'string', group: 'content' }),
    defineField({ name: 'project', title: 'Produced by project', type: 'reference', to: [{ type: 'project' }], group: 'links' }),

    // connections to other content (see §7)
    defineField({ name: 'connections', title: 'Related content', type: 'array', of: [{ type: 'connection' }], group: 'links' }),

    // workflow (see §6.3)
    ...workflowFields, // shared, defined once below
  ],
  preview: {
    select: { title: 'title.en', region: 'region', status: 'status', media: 'heroImage' },
    prepare: ({ title, region, status, media }) => ({ title, subtitle: `${region} · ${status}`, media }),
  },
})
```

### 6.2 The other publishable types (same skeleton, key differences only)

- **`livedExperience`** — `format: ['video','audio','written']`; primary block is `mediaEmbed` with `transcript`; `contributor` (reference to `person`, may be consent-gated); `consentObtained: boolean` (required true to publish). Layout fixed to Story. **Submittable by any member or project** (see §8).
- **`newsPost`** — `category: ['research-news','community-update','announcement']`; `region` optional (Global if empty) + `crossPostRegions: [region]` so a post is **tagged to a region and cross-posted globally**; layout list = Brief/Feature/Story; `connections` to the project/event/output it's about.
- **`researchOutput`** — like `caseStudy` but `outputType: ['report','toolkit','dataset-brief','guideline']`; `versions[]` is central (summary/full); default layout Report.
- **`event`** — `start`/`end` datetime, `mode: ['in-person','online','hybrid']`, `location`, `scope: ['Project','Community','Global']`, `linkedProject` (ref), `linkedRegion` (ref), `rsvp` handled app-side. Events can belong to a project **or** a community (both optional refs).

### 6.3 Review workflow (Submit from hub → regional editor approves in Sanity)

A shared `workflow` field group on every publishable type. States mirror the prototype's `stageMeta`: `draft → review → published` (plus `final` for internal docs and `changes` for kickback).

```ts
// schemaTypes/objects/workflow.ts
import { defineField } from 'sanity'

export const STATUS = [
  { title: 'Draft',              value: 'draft'     },
  { title: 'In review',          value: 'review'    },
  { title: 'Changes requested',  value: 'changes'   },
  { title: 'Published',          value: 'published' },
]

export const workflowFields = [
  defineField({ name: 'status', title: 'Status', type: 'string', group: 'workflow',
    options: { list: STATUS, layout: 'radio' }, initialValue: 'draft', validation: (r) => r.required() }),
  defineField({ name: 'submittedBy', title: 'Submitted by', type: 'reference', to: [{ type: 'person' }], group: 'workflow' }),
  defineField({ name: 'reviewRegion', title: 'Reviewing region', type: 'string', group: 'workflow',
    description: 'Which regional editor queue this lands in', options: { list: REGIONS } }),
  defineField({ name: 'reviewNotes', title: 'Reviewer notes', type: 'array', group: 'workflow',
    of: [{ type: 'object', fields: [
      { name: 'reviewer', type: 'reference', to: [{ type: 'person' }] },
      { name: 'approved', type: 'boolean' },
      { name: 'note', type: 'text' },
      { name: 'at', type: 'datetime' },
    ] }] }),
  defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime', group: 'workflow', readOnly: true }),
]
```

**Why a review step exists (the user's earlier question — what does internal review add):**
1. **Provenance & consent** — confirms authorship, lived-experience consent, and data-sharing permissions before anything is public.
2. **Taxonomy hygiene** — a regional editor checks region/theme/population tags so Atlas & filters stay accurate.
3. **Quality & framing** — light editorial pass (the "framing reads well" / "comment on p.4 wording" notes in the prototype) — *not* a redesign; layout is the author's choice.
4. **Regional ownership** — each region's convenor/editor curates what represents their community.

It does **not** change layout or restyle content — exactly the constraint you set ("no layout stages, drop team review/approval" became a single regional-editor gate).

**Workflow as a Sanity Structure + custom document actions:**
- Desk structure: a **"Review queue"** per region filtering `status == 'review' && reviewRegion == <region>`.
- Custom **document actions**: *Submit for review* (draft→review, sets `submittedBy`, `reviewRegion`), *Request changes* (review→changes, requires a note), *Approve & publish* (review→published, sets `publishedAt`) — gated to the `editor` role (§9).
- A document is only readable by the public GROQ/API when `status == 'published'`.

---

## 7. Connections (how content links across the app)

The user's requirement: *news on a project, news on an event, a report that links to other parts of the app — shown in the front end and wired in the CMS.* A polymorphic `connection` object, plus inline `internalRef` marks in block content (§5).

```ts
// schemaTypes/objects/connection.ts
import { defineType, defineField } from 'sanity'

export const connection = defineType({
  name: 'connection', title: 'Connection', type: 'object',
  fields: [
    defineField({ name: 'relation', title: 'Relation', type: 'string',
      options: { list: ['about', 'part-of', 'output-of', 'follows-up', 'related'] } }),
    defineField({ name: 'target', title: 'Target', type: 'reference',
      to: [{ type: 'caseStudy' }, { type: 'researchOutput' }, { type: 'livedExperience' },
           { type: 'newsPost' }, { type: 'event' }, { type: 'project' }, { type: 'region' }] }),
  ],
  preview: {
    select: { relation: 'relation', title: 'target.title.en' },
    prepare: ({ relation, title }) => ({ title: title || 'Linked content', subtitle: relation }),
  },
})
```

Front end renders these as the "Connections / Part of / Related" chips on detail pages and the project public page; they're bidirectional in queries (GROQ `*[references(^._id)]`).

---

## 8. Collaboration types (project, threads, annotations)

### 8.1 Project (collab space + public page)

```ts
export const project = defineType({
  name: 'project', title: 'Project', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'about', type: 'localeText' }),
    regionField,
    defineField({ name: 'visibility', type: 'string', options: { list: ['Public', 'Private'] }, initialValue: 'Public' }),
    defineField({ name: 'status', type: 'string', options: { list: ['Active', 'Recruiting', 'Completed'] } }),
    defineField({ name: 'lead', type: 'reference', to: [{ type: 'person' }] }),
    defineField({ name: 'members', title: 'Collaborators', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'person', type: 'reference', to: [{ type: 'person' }] },
        { name: 'role', type: 'string', options: { list: ['Lead', 'Convenor', 'Collaborator', 'Lived-experience advisor'] } },
      ] }] }),
    // "looking for / offering" — collaboration calls
    defineField({ name: 'openCalls', title: 'Open calls', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'kind', type: 'string', options: { list: ['seeking', 'offering'] } },
        { name: 'text', type: 'string' },
      ] }] }),
    defineField({ name: 'community', title: 'Home community', type: 'reference', to: [{ type: 'region' }] }),
    // outputs produced by the project (the public-facing side)
    defineField({ name: 'outputs', title: 'Published outputs', type: 'array',
      of: [{ type: 'reference', to: [{ type: 'caseStudy' }, { type: 'researchOutput' }, { type: 'livedExperience' }, { type: 'newsPost' }] }] }),
    defineField({ name: 'linkedEvents', type: 'array', of: [{ type: 'reference', to: [{ type: 'event' }] }] }),
  ],
})
```

Workspace-internal data (plan, tasks, files, messages) is **not** in Sanity — it's operational app state (own DB / realtime service). Sanity holds the *publishable* project record + its outputs. Tasks/plan/messages reference Sanity project & person IDs but live app-side (note this in the data contract).

### 8.2 Threads, comments, annotations

```ts
export const thread = defineType({  // community discussion + content comments
  name: 'thread', type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'scope', type: 'string', options: { list: ['community', 'content', 'project'] } },
    { name: 'region', type: 'reference', to: [{ type: 'region' }] },        // community threads
    { name: 'onContent', type: 'reference', to: [                          // comments on a published item
        { type: 'caseStudy' }, { type: 'newsPost' }, { type: 'livedExperience' }, { type: 'researchOutput' }] },
    { name: 'author', type: 'reference', to: [{ type: 'person' }] },
    { name: 'posts', type: 'array', of: [{ type: 'object', fields: [
      { name: 'author', type: 'reference', to: [{ type: 'person' }] },
      { name: 'body', type: 'text' }, { name: 'at', type: 'datetime' },
    ] }] },
  ],
})

export const annotation = defineType({  // PDF / report annotations (Documents tab)
  name: 'annotation', type: 'document',
  fields: [
    { name: 'onVersion', type: 'string', description: 'documentVersion _key on the parent doc' },
    { name: 'parent', type: 'reference', to: [{ type: 'caseStudy' }, { type: 'researchOutput' }, { type: 'dataset' }] },
    { name: 'page', type: 'number' }, { name: 'rect', type: 'object', fields: [
      { name: 'x', type: 'number' }, { name: 'y', type: 'number' }, { name: 'w', type: 'number' }, { name: 'h', type: 'number' }] },
    { name: 'author', type: 'reference', to: [{ type: 'person' }] },
    { name: 'body', type: 'text' }, { name: 'resolved', type: 'boolean', initialValue: false },
  ],
})
```

> High-traffic threads/comments/annotations are often better in the realtime app DB with only published, moderated threads mirrored to Sanity. Decide per performance needs; the schema above works if you keep them in Sanity.

### 8.3 Person (profile)

```ts
export const person = defineType({
  name: 'person', type: 'document',
  fields: [
    { name: 'name', type: 'string', validation: (r) => r.required() },
    { name: 'slug', type: 'slug', options: { source: 'name' } },
    { name: 'avatar', type: 'image' },
    { name: 'roleTitle', type: 'string' },         // "Researcher · University of Nigeria"
    { name: 'region', type: 'reference', to: [{ type: 'region' }] },
    { name: 'bio', type: 'localeText' },
    { name: 'prompts', title: 'Profile prompts', type: 'array',   // user-chosen Q&A
      of: [{ type: 'object', fields: [{ name: 'q', type: 'string' }, { name: 'a', type: 'string' }] }] },
    { name: 'experience', type: 'array', of: [{ type: 'object', fields: [
      { name: 'role', type: 'string' }, { name: 'org', type: 'string' }, { name: 'years', type: 'string' }] }] },
    { name: 'publications', type: 'array', of: [{ type: 'object', fields: [
      { name: 'title', type: 'string' }, { name: 'venue', type: 'string' }] }] },
    { name: 'collabStatus', title: 'Seeking / offering', type: 'array',
      of: [{ type: 'object', fields: [
        { name: 'kind', type: 'string', options: { list: ['looking', 'offering', 'member'] } },
        { name: 'text', type: 'string' }] }] },
    // privacy: which sections are public (mirrors Account → section visibility)
    { name: 'visibility', type: 'object', fields:
      ['projects','publications','experience','lived','events','contact'].map((k) => ({ name: k, type: 'boolean', initialValue: true })) },
  ],
})
```

---

## 9. Roles & permissions

Three roles (from your spec). Implemented via Sanity **roles** (Growth+ plan) or a custom-action guard reading the user's role document.

| Role | Sanity scope | Can |
|---|---|---|
| **Member** (any signed-in) | no Studio access; app-side only | create drafts (submit from hub), post in threads, comment on published content, RSVP, request to join, be listed as collaborator, follow regions/themes |
| **Project collaborator** | app-side; draft authoring on their project | everything a member can + edit their project's drafts, files, plan/tasks, submit outputs for review |
| **Regional convenor / editor** | Studio access scoped to their region | review queue for their region: Submit↔Changes↔Approve&Publish, edit taxonomy, curate region page, moderate threads |

- Editors only act on documents where `reviewRegion == their region`.
- Publishing (`status → published`) is **editor-only** via the custom document action; members/collaborators can reach `review` but never `published`.
- Public API/website queries filter `status == 'published'` and respect `person.visibility` + `project.visibility`.

---

## 10. Studio structure (desk) — operational view

```
Content
 ├─ ⏳ Review queue            // status == 'review', grouped by reviewRegion
 ├─ ✅ Published              // status == 'published', grouped by type
 ├─ ✍️  My drafts             // status in [draft, changes], by submittedBy == me
 ├─ Case studies / Lived experiences / News / Research outputs / Events
Internal
 ├─ Funding applications      // never public
 ├─ Datasets
Community
 ├─ Regions (7)
 ├─ Projects
 ├─ People
 ├─ Threads & comments (moderation)
```

---

## 11. Front-end data contract (how the prototype binds map to Sanity)

| Prototype bind | Sanity source |
|---|---|
| `this.regions` / region colors | `region` docs (fixed 7) + a static color map in the front end keyed by region `value` |
| `cases[]`, gallery, atlas results | `*[_type=='caseStudy' && status=='published']` (+ `researchOutput`, `livedExperience` for layer toggles) |
| `csLayout` Story/Feature/Report | `caseStudy.layout` |
| `cdBlocks` / `cdReportBlocks` | `body[lang]` portable text → rendered per layout |
| Documents tab version × language chips | `versions[]` (`kind` × `lang`) |
| `newsData`, region filter, cross-post | `newsPost` (`region` + `crossPostRegions`) |
| `livedExp[]` carousel + submit | `livedExperience` (+ member submission flow) |
| Collab People (Seeking/Offering/Member) | `person.collabStatus` |
| Collab Projects (public/private, open calls) | `project.visibility` + `openCalls` |
| Events (scope, linked project/community) | `event` |
| Profile prompts/experience/publications | `person` |
| Notifications (join requests, approvals) | app-side events referencing Sanity IDs |
| Content editor pipeline + reviewers | `status` + `reviewNotes` |
| Connections chips | `connections[]` + `internalRef` marks |
| Threads / content comments | `thread` |
| PDF annotations | `annotation` |

---

### Register everything

```ts
// schemaTypes/index.ts
import { localeString, localeText, localeBlock } from './objects/locale'
import { blockContent } from './objects/blockContent'
import { documentVersion } from './objects/documentVersion'
import { connection } from './objects/connection'
import { caseStudy } from './documents/caseStudy'
import { livedExperience, newsPost, researchOutput, event, fundingApplication, dataset } from './documents/publishable'
import { project, region, person, thread, annotation } from './documents/community'

export const schemaTypes = [
  localeString, localeText, localeBlock, blockContent, documentVersion, connection,
  caseStudy, livedExperience, newsPost, researchOutput, event, fundingApplication, dataset,
  project, region, person, thread, annotation,
]
```

**Not covered here (operational, not CMS):** realtime messaging, task/kanban state, RSVP records, follow relationships, contact-request handling, and notification delivery — these live in the app DB and reference Sanity document IDs. Flagged in `FLOWS.md §6` as backend-wiring tasks.
