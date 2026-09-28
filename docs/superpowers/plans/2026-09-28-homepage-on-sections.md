# Homepage on the page builder, with partner organisations — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the homepage from eleven fixed slots onto the project 1 Sections list (shared layout, hero required, feeds, three new sections), give partner logos real organisation records with their own hub pages, and make every section quick to edit.

**Architecture:** An additive schema change adds the Sections list to the `homepage` global, `showOnSite` to organisations, an organisations source to the logo strip and an organisation filter to the Content feed. A dry-run-first script (`scripts/homepage/move-to-sections.ts`) converts the old slots into sections using a pure, field-definition-driven planner and creates/matches partner organisations; the old slots stay as a hidden backup. The homepage renders its sections through the shared `Blocks` renderer and falls back to the old template while the list is empty.

**Tech Stack:** Next.js 16 App Router, React 19, Payload 3.88 (Postgres), next-intl 4, vitest (+ jsdom, @testing-library/react), Tailwind/shadcn.

**Spec:** `docs/superpowers/specs/2026-09-28-homepage-on-sections-design.md` (decisions H1–H7). Project 1's spec and plan (`…/2026-09-28-page-builder-foundation-*`) describe `sectionsField`, the Content feed and the picker this builds on.

## Global Constraints

- Branch `master` (the repo's only branch). Commits `type(scope): sentence`; **never** any Claude/AI co-author or attribution line.
- Visitors see no change until the move script is executed; after it, only the agreed changes: feed cards (news, agendas, lived experiences), the three new sections (Fresh on the hub, Share-your-story banner, Region map) and linked partner logos.
- The old slot fields and `homepage.blocks` are **hidden, never deleted**. Organisation records are **never deleted** — unclear ones get `showOnSite: false`.
- Only the opening hero is required: any one of `hero1` / `hero2`. Message: `This page always keeps its Hero. You can move it, but not remove it.`
- Section order after the move (spec §3.2): Hero · ★Fresh on the hub · Text+image (Global agenda) · Text+image (How to use) · Agendas feed · Lived experiences feed (or Testimonials) · ★Share-your-story banner · ★Region map · Link cards (Regional communities) · Text+image (Collaboration) · News feed · Text+image (Project info) · Call to action · Logo strip (organisations).
- Region map heading, exact: en `Explore by region`, es `Explorar por región`, fr `Explorer par région`, ar `استكشف حسب المنطقة`.
- Admin client components import only pure modules (never `lib/content/**`, `next/headers`, `server-only`). After any `payload/**` change: `pnpm exec payload generate:importmap`, `pnpm dev`, `/admin` → `200`, stop the server.
- Database: dev only (`lucky-waterfall`, from `.env.local`) through `scripts/payload-import/lib/runtime.ts` guards. Migrations additive only — anything else: delete the generated files and stop. Production is the user's.
- `app/` and `components/` never import `lib/content/internal/**` (the boundary test enforces it) — add a public module under `lib/content/` instead.
- Site text in `messages/{en,es,fr,ar}.json`; admin labels English; plain words.
- Gates per task: focused tests; `npx tsc --noEmit -p .` prints nothing; `npx eslint <changed files>`; full `npx vitest run` before the task's last commit (currently 251 files / 3314 tests green).

## Review Focus

1. **A second run of the move script** must never duplicate or clobber sections an editor has since changed — refused without `--replace`. Pinned in Task 8 (runner guard test).
2. **Arabic/Spanish/French text inside row lists** (link labels, split-column bodies) must survive the move per language, not collapse to English. Pinned in Task 6 (`planSection` row-list test).
3. **A language with a missing translation** on the new homepage shows the English text for that field, never a blank heading. Pinned in Task 3 (`collapseLocales` fallback test + reader test).
4. **A hidden or deleted organisation** picked in a logo strip must disappear from the strip, and its page must 404 — never a broken link. Pinned in Task 4 (logo mapping test) and Task 5 (page reader test).
5. **The move writes a language's text only into that language** — writing English into the Spanish field would make translation status lie. Pinned in Task 8 (`toLocaleData` exact-locale test).

---

### Task 1: One-of required sections, and the homepage schema

**Files:**
- Modify: `payload/fields/sections.ts`, `payload/globals/homepage.ts`, `payload/collections/organizations.ts`, `payload/blocks/logo-cloud-1.ts`, `payload/blocks/content-feed.ts`
- Create: `migrations/<timestamp>_homepage_sections_and_organisations.ts` (+ `.json`, generated), `migrations/index.ts` updated
- Test: `lib/__tests__/payload-sections-field.test.ts` (extend), `lib/__tests__/payload-homepage-sections.test.ts` (new)

**Interfaces:**
- Produces: `sectionsField({ blocks, required?: Array<string | string[]>, tablePrefix })`; `requiredSectionsValidator(required: Array<string | string[]>, labels)`; homepage fields `layoutPerLanguage`, `sections`, `sectionsByLanguage` (table prefix `hp`); `HOMEPAGE_SECTIONS: Block[]` exported from `payload/globals/homepage.ts`; `organizations.showOnSite` (checkbox, default `true`); `logoCloud1.organizations` (hasMany relationship → `organizations`); `contentFeed.filters.organizations` (hasMany relationship → `organizations`).

- [ ] **Step 1: Failing tests**

Append to `lib/__tests__/payload-sections-field.test.ts`:

```ts
describe("one-of required sections", () => {
  const validate = requiredSectionsValidator([["hero1", "hero2"]], { hero1: "Hero", hero2: "Hero with image" });
  it("is satisfied by any section in the group", () => {
    expect(validate([{ blockType: "hero2" }])).toBe(true);
    expect(validate([{ blockType: "faqs" }, { blockType: "hero1" }])).toBe(true);
  });
  it("names the first section of the group when none is present", () => {
    expect(validate([{ blockType: "faqs" }])).toBe("This page always keeps its Hero. You can move it, but not remove it.");
  });
});
```

Create `lib/__tests__/payload-homepage-sections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { HOMEPAGE_SECTIONS } from "@/payload/globals/homepage";

const named = (fields: Field[], name: string) => fields.find((f) => "name" in f && f.name === name) as Record<string, any> | undefined;

describe("homepage on sections", async () => {
  const c = await config;
  const homepage = c.globals.find((g) => g.slug === "homepage")!;

  it("has the shared list, the per-language list and the switch", () => {
    expect(named(homepage.fields, "layoutPerLanguage")?.type).toBe("checkbox");
    expect(named(homepage.fields, "sections")?.type).toBe("blocks");
    expect(named(homepage.fields, "sectionsByLanguage")).toMatchObject({ type: "blocks", localized: true });
  });

  it("requires a hero, either kind", () => {
    const validate = named(homepage.fields, "sections")!.validate as (v: unknown) => true | string;
    expect(validate([{ blockType: "faqs" }])).toBe("This page always keeps its Hero. You can move it, but not remove it.");
    expect(validate([{ blockType: "hero2" }])).toBe(true);
  });

  it("offers the whole library except the old content section", () => {
    const slugs = HOMEPAGE_SECTIONS.map((b) => b.slug);
    expect(slugs).toEqual(expect.arrayContaining(["hero1", "hero2", "contentFeed", "logoCloud1", "regionMap", "submitStoryBanner"]));
    expect(slugs).not.toContain("contentGrid");
  });

  it("hides the eleven old slots and the old blocks list, keeping their data", () => {
    for (const slot of ["heroWelcome", "globalAgenda", "howToUse", "agendasModule", "livedExperiences", "regionalCommunities", "collaboration", "news", "projectInfo", "mentalHealthDefinition", "partnerLogos"]) {
      expect(named(homepage.fields, slot)?.admin?.hidden, slot).toBe(true);
    }
  });

  it("organisations can be hidden from the site, shown by default", () => {
    const orgs = c.collections.find((x) => x.slug === "organizations")!;
    expect(named(orgs.fields, "showOnSite")).toMatchObject({ type: "checkbox", defaultValue: true, label: "Show this organisation on the site" });
  });

  it("the logo strip can list organisations, and a feed can filter by one", async () => {
    const { logoCloud1, contentFeed } = await import("@/payload/blocks");
    expect(named(logoCloud1.fields, "organizations")).toMatchObject({ type: "relationship", relationTo: "organizations", hasMany: true, label: "Partner organisations" });
    const filters = named(contentFeed.fields, "filters")!;
    expect(named(filters.fields, "organizations")).toMatchObject({ type: "relationship", relationTo: "organizations", hasMany: true });
  });
});
```

(If `homepage.fields` has no top-level `blocks` field today, skip it in the hidden check — the test lists only the eleven slots.)

- [ ] **Step 2: Run — expect FAIL** (`npx vitest run lib/__tests__/payload-sections-field.test.ts lib/__tests__/payload-homepage-sections.test.ts`).

- [ ] **Step 3: One-of rule** — in `payload/fields/sections.ts` replace the validator and the `required` type:

```ts
/** A validator that refuses to save a list missing a required section. An
 *  inner array is a group: any one of those sections satisfies it. */
export function requiredSectionsValidator(required: Array<string | string[]>, labels: Record<string, string>) {
  return (value: unknown): true | string => {
    const present = new Set(
      (Array.isArray(value) ? value : []).map((b) => (b && typeof b === "object" ? (b as { blockType?: unknown }).blockType : undefined)),
    );
    const missing = required.find((rule) => (Array.isArray(rule) ? !rule.some((slug) => present.has(slug)) : !present.has(rule)));
    if (!missing) return true;
    const first = Array.isArray(missing) ? missing[0] : missing;
    return `This page always keeps its ${labels[first] ?? first}. You can move it, but not remove it.`;
  };
}
```

and `required?: Array<string | string[]>` in `sectionsField`'s options. The label for the message is the block's `labels.singular` — the hero1 block's is "Hero".

- [ ] **Step 4: Homepage global** (`payload/globals/homepage.ts`):

```ts
import { sectionsField } from "@/payload/fields/sections";
import * as library from "@/payload/blocks";

/** Every section editors can put on the homepage: the whole library except the retired regional one. */
export const HOMEPAGE_SECTIONS: Block[] = [
  library.hero1, library.hero2, library.sectionHeader,
  library.splitRow, library.carousel1, library.timelineRow, library.faqs,
  library.contentFeed, library.eventsCalendar, library.peopleWidget, library.gridRow,
  library.regionMap, library.atlasEmbed,
  library.cta1, library.submitStoryBanner, library.formNewsletter,
  library.logoCloud1, library.carousel2,
];
```

Fields: keep `title` first, then `...sectionsField({ blocks: HOMEPAGE_SECTIONS, required: [["hero1", "hero2"]], tablePrefix: "hp" })`, then the eleven `homepageSlot(...)` calls each given `admin: { hidden: true }` (extend `homepageSlot`'s opts with `hidden?: boolean` and pass it into the group's `admin`), then the meta fields. Set the global's `admin.description`: `"The homepage shows the Sections below, in order. (The old fixed sections are kept hidden as a backup.)"`. Import `Block` from `payload`.

- [ ] **Step 5: Organisations** (`payload/collections/organizations.ts`): add after `name`:

```ts
{ name: "showOnSite", type: "checkbox", defaultValue: true, label: "Show this organisation on the site",
  admin: { position: "sidebar", description: "Off: no page on the hub, and it never appears in a logo strip." } },
```

`admin.defaultColumns: ["name", "type", "showOnSite"]`; `admin.preview: (doc, { locale }) => doc?.slug ? \`/${locale ?? "en"}/organizations/${doc.slug}\` : null` (gives editors a "Preview"/view link).

- [ ] **Step 6: Logo strip** (`payload/blocks/logo-cloud-1.ts`): before `images` add

```ts
{
  name: "organizations",
  label: "Partner organisations",
  type: "relationship",
  relationTo: "organizations",
  hasMany: true,
  filterOptions: { showOnSite: { not_equals: false } },
  admin: { description: "Each logo links to the organisation's page on the hub. Drag to reorder." },
},
```

and give `images` `label: "Other logos (not linked)"` + `admin: { description: "Logos with no organisation on the hub. Prefer Partner organisations." }`.

- [ ] **Step 7: Feed filter** (`payload/blocks/content-feed.ts`, inside `filters.fields` after `tags`):

```ts
{ name: "organizations", label: "Organisation", type: "relationship", relationTo: "organizations", hasMany: true,
  filterOptions: { showOnSite: { not_equals: false } } },
```

- [ ] **Step 8: Run tests — expect PASS**; `npx tsc --noEmit -p .`.

- [ ] **Step 9: Migration (dev only).** `pnpm exec payload migrate:create homepage_sections_and_organisations`. Read the up SQL: allowed — new `homepage_hp_s_*` / `homepage_hp_l_*` / `_homepage_v_*` block tables and their locales/rels, `homepage.layout_per_language` (+ version mirror), `organizations.show_on_site` boolean DEFAULT true, new `organizations_id` columns + indexes on `*_rels` tables, and NOT NULL loosening only if Payload emits it for drafts. Anything dropped/renamed/retyped → delete files, stop. Load dev env the project-1 way (python export of `PAYLOAD_DATABASE_URL`/`PAYLOAD_SECRET` from `.env.local`, refuse unless the host contains `lucky-waterfall`), then `echo y | pnpm exec payload migrate` (the "dev mode" prompt only filters a stale marker in memory) and `migrate:status` shows it applied.

- [ ] **Step 10: Admin check** — `pnpm exec payload generate:importmap`; `pnpm dev`; `/admin` → 200; `/en` → 200 and still the old homepage (sections empty); stop the server. `pnpm exec payload generate:types`.

- [ ] **Step 11: Commit**

```bash
git add payload/fields/sections.ts payload/globals/homepage.ts payload/collections/organizations.ts payload/blocks/logo-cloud-1.ts payload/blocks/content-feed.ts migrations payload-types.ts "app/(payload)/admin/importMap.js" lib/__tests__/payload-sections-field.test.ts lib/__tests__/payload-homepage-sections.test.ts
git commit -m "feat(cms): the homepage gets a Sections list, organisations can be hidden, and logo strips can list organisations"
```

---

### Task 2: Organisation filter in the Content feed engine

**Files:**
- Modify: `lib/content/feeds/types.ts`, `lib/content/feeds/engine.ts`, `lib/content/internal/payload/feeds.ts`, `lib/content/internal/payload/blocks.ts` (`contentFeedSettings`)
- Test: `lib/__tests__/content-feed-engine.test.ts`, `lib/__tests__/content-feed-resolve.test.ts`, `lib/__tests__/content-feed-block.test.ts` (extend each)

**Interfaces:**
- Produces: `FeedFilters.organizationIds: string[]`; `KindConfig.organizations: string | null` per kind (`"organizations"` for caseStudies, newsPosts, researchOutputs, livedExperiences, agendas; `null` for events).

- [ ] **Step 1: Failing tests**

Engine (`content-feed-engine.test.ts`, in `normalizeFeedSettings`):

```ts
it("keeps organisation ids", () => {
  expect(normalizeFeedSettings({ filters: { organizationIds: ["o1", "", 3] } }).filters.organizationIds).toEqual(["o1"]);
});
```

Resolve (`content-feed-resolve.test.ts`):

```ts
it("filters by organisation, leaving out kinds with no organisation link", async () => {
  query.mockResolvedValue({ docs: [] });
  await resolveContentFeed({ kinds: ["caseStudies", "events"], filters: { organizationIds: ["o1"] } }, { locale: "en" });
  expect(calls().map((d) => d.collection)).toEqual(["caseStudies"]);
  expect(whereOf("caseStudies")).toContain('"organizations":{"in":["o1"]}');
});
```

Block (`content-feed-block.test.ts`, in the site describe — add `organizations: [{ id: "o9" }, "o8"]` to the fixture's `filters` and expect `organizationIds: ["o9", "o8"]` in `settings.filters`).

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: Implement**
  - `types.ts`: add `organizationIds: string[];` to `FeedFilters`.
  - `engine.ts` `normalizeFeedSettings`: `organizationIds: strs(f.organizationIds),`.
  - `feeds.ts`: add `organizations: string | null` to `KindConfig`, set per kind as above; in `filterWhere` after tags:

```ts
if (filters.organizationIds.length > 0) {
  if (!config.organizations) return null;
  parts.push({ [config.organizations]: { in: filters.organizationIds } });
}
```

  - `blocks.ts` `contentFeedSettings`: `organizationIds: idList(filters.organizations),` inside `filters`.

- [ ] **Step 4: PASS** (the three files) + gates.

- [ ] **Step 5: Commit** — `git commit -m "feat(feeds): a Content feed can show what's linked to an organisation"` (add the five files).

---

### Task 3: The homepage renders its sections

**Files:**
- Create: `lib/content/internal/localize.ts`
- Modify: `lib/content/internal/payload/homepage.ts` (`toHomepage`), `components/pages/homepage.tsx`
- Test: `lib/__tests__/collapse-locales.test.ts` (new), `lib/__tests__/payload-homepage-reader.test.ts` (new), `lib/__tests__/homepage-render.test.tsx` (new)

**Interfaces:**
- Produces: `collapseLocales(value: unknown, locale: string, opts?: { fallback?: boolean }): unknown` (pure, default `fallback: true`); `toHomepage(...)` now also returns `sections: unknown[]` (mapped blocks, `[]` when none); `HomepageDoc.sections`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/collapse-locales.test.ts
import { describe, expect, it } from "vitest";
import { collapseLocales } from "@/lib/content/internal/localize";

describe("collapseLocales", () => {
  it("picks the language from every {en,es,fr,ar} value, however deep", () => {
    const v = { title: { en: "Hi", fr: "Salut" }, links: [{ title: { en: "Go", fr: "Aller" }, href: "/x" }] };
    expect(collapseLocales(v, "fr")).toEqual({ title: "Salut", links: [{ title: "Aller", href: "/x" }] });
  });
  it("falls back to English per field when the language is missing", () => {
    expect(collapseLocales({ title: { en: "Hi", ar: "" }, body: { en: "B" } }, "ar")).toEqual({ title: "Hi", body: "B" });
  });
  it("without fallback, a missing language is null", () => {
    expect(collapseLocales({ title: { en: "Hi" } }, "es", { fallback: false })).toEqual({ title: null });
  });
  it("leaves ordinary objects alone", () => {
    const v = { padding: { top: true, bottom: null }, root: { children: [] } };
    expect(collapseLocales(v, "fr")).toEqual(v);
  });
});
```

```ts
// lib/__tests__/payload-homepage-reader.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { toHomepage } from "@/lib/content/internal/payload/homepage";

const hero = (title: Record<string, string>) => ({ id: "h1", blockType: "hero1", title });

describe("homepage sections", () => {
  it("renders the shared list in the visitor's language", () => {
    const home = toHomepage({ sections: [hero({ en: "Welcome", es: "Bienvenida" })] }, "es");
    expect((home.sections as Array<{ _type: string; title: string }>)[0]).toMatchObject({ _type: "hero-1", title: "Bienvenida" });
  });
  it("shows English for a field with no translation", () => {
    const home = toHomepage({ sections: [hero({ en: "Welcome" })] }, "ar");
    expect((home.sections as Array<{ title: string }>)[0].title).toBe("Welcome");
  });
  it("uses the language's own list when the per-language switch is on", () => {
    const home = toHomepage(
      { layoutPerLanguage: true, sections: [hero({ en: "Shared" })], sectionsByLanguage: { en: [hero({ en: "EN own" } as never)], fr: [] } },
      "fr",
    );
    // fr's own list is empty → English's own list
    expect((home.sections as Array<{ title: unknown }>)).toHaveLength(1);
  });
  it("is an empty list when nothing is set (the old template then renders)", () => {
    expect(toHomepage({}, "en").sections).toEqual([]);
  });
});
```

(In the per-language case the rows' `title` is a plain string in real data — nested `localized` is stripped inside a localized list — so the test only checks which list is used.)

```tsx
// lib/__tests__/homepage-render.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
vi.mock("@/components/blocks", () => ({ default: ({ blocks }: { blocks: Array<{ _type: string }> }) => <div data-testid="blocks">{blocks.map((b) => b._type).join(",")}</div> }));
vi.mock("@/components/blocks/hero/hero-1", () => ({ default: () => <div data-testid="legacy-hero" /> }));
vi.mock("@/lib/content/pages", () => ({ getHomepageAgendas: vi.fn(), getHomepageNews: vi.fn() }));
vi.mock("@/lib/content/homepage-lived-experiences", () => ({ resolveLivedExperiencesSection: async () => ({ mode: "none" }) }));
import Homepage from "@/components/pages/homepage";

describe("Homepage", () => {
  it("renders the sections through the shared renderer", async () => {
    render(await Homepage({ homepage: { sections: [{ _type: "hero-1", _key: "a" }], heroWelcome: {} } as never, locale: "en" }));
    expect(screen.getByTestId("blocks").textContent).toBe("hero-1");
    expect(screen.queryByTestId("legacy-hero")).toBeNull();
  });
  it("falls back to the old template while there are no sections", async () => {
    render(await Homepage({ homepage: { sections: [], heroWelcome: {} } as never, locale: "en" }));
    expect(screen.getByTestId("legacy-hero")).toBeTruthy();
  });
});
```

(Adjust the lived-experiences mock's return to whatever `resolveLivedExperiencesSection`'s "nothing" mode is called — read `lib/content/homepage-lived-experiences.ts`.)

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: `lib/content/internal/localize.ts`**

```ts
/**
 * A Payload value read with `locale: "all"`, in one language: every object
 * keyed only by language codes becomes that language's value. With
 * `fallback` (the default) a missing or empty value falls back to English —
 * for readers; without it, a missing value is `null` — for writers, so one
 * language's text is never copied into another's field.
 */
const LOCALE_KEYS = new Set(["en", "es", "fr", "ar"]);
type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isLocaleMap = (v: unknown): v is Loose => isObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LOCALE_KEYS.has(k));
const present = (v: unknown) => v !== undefined && v !== null && v !== "";

export function collapseLocales(value: unknown, locale: string, opts: { fallback?: boolean } = {}): unknown {
  const fallback = opts.fallback ?? true;
  if (isLocaleMap(value)) {
    const own = value[locale];
    if (present(own)) return collapseLocales(own, locale, opts);
    return fallback && present(value.en) ? collapseLocales(value.en, locale, opts) : null;
  }
  if (Array.isArray(value)) return value.map((item) => collapseLocales(item, locale, opts));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, collapseLocales(v, locale, opts)]));
  return value;
}
```

- [ ] **Step 4: Reader** — in `toHomepage` add (import `collapseLocales` and `pageBlocks`):

```ts
sections: homepageSections(global, locale),
```

```ts
/** The homepage's sections in one language: the shared list, or — with the
 *  per-language switch on — that language's own list (English's when empty). */
function homepageSections(global: Row, locale: Locale): unknown[] {
  let list: unknown = global.sections;
  if (global.layoutPerLanguage === true && isRow(global.sectionsByLanguage)) {
    const own = global.sectionsByLanguage[locale];
    list = Array.isArray(own) && own.length > 0 ? own : global.sectionsByLanguage.en;
  }
  return pageBlocks(collapseLocales(list, locale)) ?? [];
}
```

- [ ] **Step 5: Renderer** (`components/pages/homepage.tsx`): add `sections?: ComponentProps<typeof Blocks>["blocks"] | null;` to `HomepageDoc`; replace the `homepage.blocks` branch with:

```tsx
// The Sections list (CMS project 2) is the homepage; the fixed template below
// renders only while it is empty — the backup the move script can fall back to.
if (homepage.sections && homepage.sections.length > 0) {
  return (
    <div dir={rtl ? "rtl" : "ltr"}>
      <Blocks blocks={homepage.sections} locale={locale} userId={userId} />
    </div>
  );
}
```

Remove `blocks` from `HomepageDoc`.

- [ ] **Step 6: PASS** + existing homepage reader tests (`npx vitest run lib/__tests__ -t homepage`) + gates.

- [ ] **Step 7: Commit** — `git commit -m "feat(homepage): render the Sections list when it has any, in the visitor's language"`.

---

### Task 4: Logo strip with organisations

**Files:**
- Modify: `lib/content/internal/payload/blocks.ts` (`logoCloud1Block`), `components/blocks/logo-cloud/logo-cloud-1.tsx`
- Test: `lib/__tests__/payload-logo-strip.test.ts` (new), `lib/__tests__/logo-cloud-render.test.tsx` (new)

**Interfaces:**
- Consumes: Task 1's `logoCloud1.organizations`.
- Produces: logo entries gain `href: string | null` and `name: string | null`; organisations come first.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/payload-logo-strip.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { pageBlocks } from "@/lib/content/internal/payload/blocks";

const MEDIA = { id: "m1", url: "https://cdn.example/l.webp", mimeType: "image/webp", lqip: "x", width: 400, height: 200, sizes: {} };
const org = (over: Record<string, unknown> = {}) => ({ id: "o1", name: "Wellcome", slug: "wellcome", type: "foundation", showOnSite: true, logo: { asset: MEDIA, alt: null }, ...over });
const strip = (row: Record<string, unknown>) => (pageBlocks([{ id: "s", blockType: "logoCloud1", ...row }])![0] as { images: Array<Record<string, unknown>> | null });

describe("logo strip organisations", () => {
  it("shows each organisation's logo, named and linked to its page, before other logos", () => {
    const { images } = strip({ organizations: [org()], images: [{ id: "i", asset: MEDIA, alt: "Other" }] });
    expect(images!.map((i) => [i.name ?? i.alt, i.href])).toEqual([["Wellcome", "/organizations/wellcome"], ["Other", null]]);
    expect(images![0]).toMatchObject({ alt: "Wellcome", orgType: "foundation" });
  });
  it("leaves out hidden organisations and ones that no longer exist", () => {
    const { images } = strip({ organizations: [org({ showOnSite: false }), "deleted-id", null] });
    expect(images).toBeNull();
  });
  it("keeps an organisation with no logo, as its name", () => {
    const { images } = strip({ organizations: [org({ logo: null })] });
    expect(images![0]).toMatchObject({ name: "Wellcome", href: "/organizations/wellcome", asset: null });
  });
});
```

```tsx
// lib/__tests__/logo-cloud-render.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
vi.mock("next-intl", () => ({ useTranslations: () => (k: string) => k }));
vi.mock("motion/react", () => ({ motion: { div: (p: { children: ReactNode }) => <div>{p.children}</div> }, useReducedMotion: () => true }));
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...r }: { href: string; children: ReactNode }) => <a href={href} {...r}>{children}</a> }));
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
afterEach(cleanup);

describe("LogoCloud1", () => {
  it("links organisation logos to their hub page and names the link", () => {
    render(<LogoCloud1 layout="grid" locale="en" images={[{ name: "Wellcome", alt: "Wellcome", href: "/organizations/wellcome", asset: null }]} />);
    const link = screen.getByRole("link", { name: /Wellcome/ });
    expect(link.getAttribute("href")).toBe("/organizations/wellcome");
  });
  it("shows a name chip when an organisation has no logo", () => {
    render(<LogoCloud1 layout="grid" locale="en" images={[{ name: "Climate Cares Centre", href: "/organizations/climate-cares-centre", asset: null }]} />);
    expect(screen.getByText("Climate Cares Centre")).toBeTruthy();
  });
});
```

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: Mapper** (`blocks.ts`): in `logoCloud1Block` build `images` as

```ts
images: listOrNull([
  ...(Array.isArray(row.organizations) ? row.organizations.map(logoFromOrganization).filter((i): i is Row => i !== null) : []),
  ...(Array.isArray(row.images) ? row.images.filter(isRow).map(logoCloudImage).filter((i): i is Row => i !== null) : []),
]),
```

```ts
/** A partner organisation as a logo: its own logo (or none — the strip shows
 *  its name), named, linked to its hub page. Hidden or deleted ones are left out. */
function logoFromOrganization(value: unknown): Row | null {
  if (!isRow(value) || value.showOnSite === false) return null;
  const name = text(value.name);
  const slug = text(value.slug);
  if (!name || !slug) return null;
  const logo = projectedImage(value.logo);
  return groqObject({
    _key: `org-${String(value.id ?? slug)}`,
    ...(logo ?? { asset: null }),
    alt: name,
    href: `/organizations/${slug}`,
    label: name,
    name,
    orgType: orNull(text(value.type)),
  });
}
```

and in `logoCloudImage` add `href: null, name: null`. Keep other logos' `label`.

- [ ] **Step 4: Component** (`logo-cloud-1.tsx`): extend `LogoImage` with `href?: string | null; name?: string | null`. Wrap each tile/marquee item: when `href` is set render `<Link href={href} className="block rounded-lg outline-offset-4 focus-visible:outline-2 focus-visible:outline-ccm-sea">…</Link>` (import `Link` from `@/i18n/navigation`), `aria-label={name}` on the link. When `asset` is null render a name chip instead of `<Image>`: `<span className="inline-flex h-20 items-center justify-center rounded-lg bg-ccm-mist px-4 text-center text-sm font-bold text-ccm-midnight">{name}</span>`. Keep the grid-by-type grouping (it reads `orgType`).

- [ ] **Step 5: PASS** + `lib/__tests__/payload-page-blocks.test.ts` still green + gates.

- [ ] **Step 6: Commit** — `git commit -m "feat(logos): partner logos come from organisations and link to their hub pages"`.

---

### Task 5: Organisation pages

**Files:**
- Create: `lib/content/internal/payload/organizations.ts`, `lib/content/organizations.ts`, `app/[locale]/(main)/organizations/[slug]/page.tsx`
- Modify: `lib/content/internal/payload/system.ts` (`SITEMAP_SOURCES` + optional `where`), `lib/content/system.ts` (`CONTENT_SITEMAP_SPECS`), `messages/{en,es,fr,ar}.json` (`organization.*`)
- Test: `lib/__tests__/organization-reader.test.ts`, `lib/__tests__/organization-page.test.tsx`

**Interfaces:**
- Produces: `getOrganization(slug: string, locale: Locale): Promise<Organization | null>` from `lib/content/organizations.ts`, where `Organization = { id: string; name: string; acronym: string | null; type: string | null; website: string | null; description: string | null; logo: Row | null; place: string | null; community: { name: string; slug: string } | null }`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/organization-reader.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d), queryPreviewable: (d: unknown) => query(d) }));
import { findOrganization } from "@/lib/content/internal/payload/organizations";

beforeEach(() => query.mockReset());
const row = { id: "o1", name: "Wellcome", slug: "wellcome", acronym: null, type: "foundation", website: "https://wellcome.org",
  description: { en: "A charity", fr: "Une fondation" }, logo: null, place: { text: "London, UK" }, showOnSite: true,
  regionalCommunity: { name: { en: "Europe & North America" }, slug: "europe-and-north-america" } };

describe("findOrganization", () => {
  it("reads a shown organisation in the visitor's language", async () => {
    query.mockResolvedValue({ docs: [row] });
    expect(await findOrganization("wellcome", "fr")).toMatchObject({ name: "Wellcome", description: "Une fondation", place: "London, UK",
      community: { name: "Europe & North America", slug: "europe-and-north-america" } });
    expect(JSON.stringify(query.mock.calls[0][0].where)).toContain('"showOnSite":{"not_equals":false}');
  });
  it("is null for a hidden or missing organisation (the page 404s)", async () => {
    query.mockResolvedValue({ docs: [] });
    expect(await findOrganization("gone", "en")).toBeNull();
  });
  it("only accepts a website that is a web address", async () => {
    query.mockResolvedValue({ docs: [{ ...row, website: "javascript:alert(1)" }] });
    expect((await findOrganization("wellcome", "en"))!.website).toBeNull();
  });
});
```

```tsx
// lib/__tests__/organization-page.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const notFound = vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); });
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}`, setRequestLocale: () => {} }));
const getOrganization = vi.fn();
vi.mock("@/lib/content/organizations", () => ({ getOrganization: (s: string, l: string) => getOrganization(s, l) }));
vi.mock("@/components/blocks/content-feed", () => ({ default: ({ settings }: { settings: { filters: { organizationIds: string[] } } }) => <div data-testid="feed">{settings.filters.organizationIds.join(",")}</div> }));
import OrganizationPage from "@/app/[locale]/(main)/organizations/[slug]/page";
afterEach(cleanup);

describe("organisation page", () => {
  it("shows the organisation and a feed of what's linked to it", async () => {
    getOrganization.mockResolvedValue({ id: "o1", name: "Wellcome", acronym: null, type: "foundation", website: "https://wellcome.org", description: "A charity", logo: null, place: "London", community: null });
    render(await OrganizationPage({ params: Promise.resolve({ locale: "en", slug: "wellcome" }) }));
    expect(screen.getByRole("heading", { level: 1, name: "Wellcome" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /wellcome\.org/ }).getAttribute("href")).toBe("https://wellcome.org");
    expect(screen.getByTestId("feed").textContent).toBe("o1");
  });
  it("404s when the organisation is hidden or missing", async () => {
    getOrganization.mockResolvedValue(null);
    await expect(OrganizationPage({ params: Promise.resolve({ locale: "en", slug: "x" }) })).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
```

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: Reader** (`lib/content/internal/payload/organizations.ts`):

```ts
import "server-only";
import { queryPreviewable } from "@/lib/content/internal/payload-source";
import { localized, type LocalizedRaw } from "@/lib/content/internal/localized";
import { imageGroup } from "@/lib/content/internal/image-shape";
import type { Locale } from "@/i18n/routing";

type Row = Record<string, unknown>;
export interface Organization {
  id: string; name: string; acronym: string | null; type: string | null; website: string | null;
  description: string | null; logo: Row | null; place: string | null; community: { name: string; slug: string } | null;
}
const text = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : null);
const inLocale = (v: unknown, locale: string) => { const arms = localized(v as LocalizedRaw) as Record<string, string> | undefined; return text(arms?.[locale]) ?? text(arms?.en) ?? text(v); };

/** A shown organisation by slug, in one language; `null` when hidden or missing. */
export async function findOrganization(slug: string, locale: Locale): Promise<Organization | null> {
  const result = await queryPreviewable<{ docs?: Row[] }>({
    type: "find", collection: "organizations", locale: "all", depth: 2, limit: 1, pagination: false,
    where: { and: [{ slug: { equals: slug } }, { showOnSite: { not_equals: false } }] },
  });
  const row = result?.docs?.[0];
  if (!row) return null;
  const community = row.regionalCommunity && typeof row.regionalCommunity === "object" ? (row.regionalCommunity as Row) : null;
  const website = text(row.website);
  return {
    id: String(row.id),
    name: text(row.name) ?? "",
    acronym: text(row.acronym),
    type: text(row.type),
    website: website && /^https?:\/\//i.test(website) ? website : null,
    description: inLocale(row.description, locale),
    logo: imageGroup(row.logo, { asset: ["_id", "url", "mimeType", "lqip", "dimensions"], keys: ["alt"] }),
    place: text((row.place as Row | undefined)?.text),
    community: community && text(community.slug) ? { name: inLocale(community.name, locale) ?? "", slug: String(community.slug) } : null,
  };
}
```

(Check the `Locale` import path other readers use — `lib/content/internal/payload/pages.ts` — and match it.)

Public module (`lib/content/organizations.ts`):

```ts
import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { findOrganization, type Organization } from "@/lib/content/internal/payload/organizations";
import type { Locale } from "@/i18n/routing";
export type { Organization };

/** Organisation pages exist on the Payload backend only; Sanity never had them. */
export async function getOrganization(slug: string, locale: Locale): Promise<Organization | null> {
  if (activeBackend() !== "payload") return null;
  return findOrganization(slug, locale);
}
```

- [ ] **Step 4: Page** (`app/[locale]/(main)/organizations/[slug]/page.tsx`) — server component: `getOrganization`, `notFound()` when null; layout with the site container tokens (`CONTAINER_WIDTH.default`, `SECTION_SPACING_Y.md`):
  - header row: logo (`next/image` via `imageUrl(logo, { width: 320 })`, max-h-24, object-contain) or an initials tile (`size-24 rounded-2xl bg-ccm-mist font-heading text-3xl text-ccm-midnight`), then `<h1>` name (`font-heading text-3xl text-ccm-midnight`), a meta line (acronym · type label via `t(\`type.${type}\`)` · place), community link to `/communities/<slug>` via `Link`, website as `<a href={website} rel="noopener noreferrer" target="_blank">` showing the host (`new URL(website).host`);
  - description paragraph (`max-w-prose`);
  - `<ContentFeed settings={{ heading: t("onTheHub"), kinds: ["caseStudies", "newsPosts", "researchOutputs", "livedExperiences", "agendas"], filters: { organizationIds: [org.id] }, count: 12, layout: "grid", viewAll: { show: false } }} locale={locale} />`.
  `generateMetadata`: title = name, description = description (first 160 chars), `openGraph.images` = logo url when present; 404 metadata when missing.
  Messages `organization.onTheHub` ("On the hub" / "En el hub" / "Sur le hub" / "على المنصة") and `organization.type.{ngo,research,university,government,international,company,community,foundation,other}` in the four locales (English: NGO, Research institution, University, Government agency, International organisation, Private company, Community organisation, Foundation, Other).

- [ ] **Step 5: Sitemap** — `SitemapSource` gains optional `where?: Where`; `"/organizations": { collections: ["organizations"], moderation: "none", lastModified: "updatedAt", where: { showOnSite: { not_equals: false } } }`, and `getContentSitemapRows` ANDs `source.where` into its where. In `lib/content/system.ts` add `{ filter: '_type == "organization" && false', pathPrefix: "/organizations", changeFrequency: "monthly", priority: 0.5 }` (Sanity never had organisation pages, so its arm lists none).

- [ ] **Step 6: PASS** + the sitemap tests (`npx vitest run lib/__tests__ -t sitemap`) + the boundary test + gates. Dev check: `pnpm dev`, `/en/organizations/<an existing slug>` → 200, `/en/organizations/nope` → 404; stop.

- [ ] **Step 7: Commit** — `git commit -m "feat(organisations): each organisation gets a hub page with everything linked to it"`.

---

### Task 6: The move planner (pure)

**Files:**
- Create: `scripts/homepage/plan.ts`
- Test: `lib/__tests__/homepage-move-plan.test.ts`

**Interfaces:**
- Consumes: block definitions from `@/payload/blocks` (pure modules, unsanitized).
- Produces:

```ts
export type LocaleMap = Partial<Record<"en" | "es" | "fr" | "ar", unknown>>;
export interface Difference { section: string; path: string; values: LocaleMap }
export interface SlotPlan { sections: Row[]; differences: Difference[]; notes: string[] }
export function planSection(block: Block, slot: unknown, section: string, differences: Difference[]): Row;
export function planHomepageSections(input: {
  global: Row;                         // the homepage global read with locale "all", depth 0
  organizationIds: string[];           // partner organisations, in logo order (Task 7)
  freshHeading: LocaleMap;             // typedCards.freshHeading per language
}): SlotPlan;
```

Section rows carry `blockType`; translatable values are `LocaleMap`s; everything else is plain.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/homepage-move-plan.test.ts
import { describe, expect, it } from "vitest";
import { planHomepageSections, planSection } from "@/scripts/homepage/plan";
import { hero1, splitRow } from "@/payload/blocks";

const loc = (en: string, rest: Record<string, string> = {}) => ({ en, ...rest });
const slots = {
  heroWelcome: { title: loc("Welcome", { es: "Bienvenida" }), links: { en: [{ id: "l1", title: "Join", href: "/join", buttonVariant: { size: "lg" } }], es: [{ id: "l2", title: "Únete", href: "/join", buttonVariant: { size: "default" } }] }, padding: { top: true } },
  globalAgenda: { splitColumns: { en: [{ blockType: "splitContent", id: "c", title: "Agenda", body: null }], es: [{ blockType: "splitContent", id: "c2", title: "Agenda ES", body: null }] } },
  howToUse: { splitColumns: { en: [] } },
  agendasModule: { title: loc("Research agendas"), mode: "dynamic-featured", maxItems: 4 },
  livedExperiences: { title: loc("Stories"), testimonial: { en: [] } },
  regionalCommunities: { title: loc("Regions"), columns: { en: [] } },
  collaboration: { splitColumns: { en: [] } },
  news: { title: loc("Latest news"), maxItems: null },
  projectInfo: { splitColumns: { en: [] } },
  mentalHealthDefinition: { title: loc("Mental health") },
  partnerLogos: { title: loc("Who is involved"), layout: "marquee", images: { en: [] } },
};
const plan = () => planHomepageSections({ global: slots, organizationIds: ["o1", "o2"], freshHeading: loc("Fresh on the hub", { fr: "Du nouveau" }) });

describe("planHomepageSections", () => {
  it("builds the agreed fourteen sections in order", () => {
    expect(plan().sections.map((s) => s.blockType)).toEqual([
      "hero1", "contentFeed", "splitRow", "splitRow", "contentFeed", "contentFeed", "submitStoryBanner", "regionMap",
      "gridRow", "splitRow", "contentFeed", "splitRow", "cta1", "logoCloud1",
    ]);
  });

  it("keeps each language's text, including inside row lists", () => {
    const hero = plan().sections[0];
    expect(hero.title).toEqual({ en: "Welcome", es: "Bienvenida" });
    expect((hero.links as Array<{ title: unknown }>)[0].title).toEqual({ en: "Join", es: "Únete" });
    const agenda = plan().sections[2];
    expect((agenda.splitColumns as Array<{ title: unknown }>)[0].title).toEqual({ en: "Agenda", es: "Agenda ES" });
  });

  it("reports non-text values that differed between languages (English kept)", () => {
    const p = plan();
    expect((p.sections[0].links as Array<{ buttonVariant: { size: string } }>)[0].buttonVariant.size).toBe("lg");
    expect(p.differences).toContainEqual({ section: "heroWelcome", path: "links[0].buttonVariant.size", values: { en: "lg", es: "default" } });
  });

  it("never copies row ids across", () => {
    expect(JSON.stringify(plan().sections)).not.toMatch(/"id":"l1"|"id":"c"/);
  });

  it("carries the feeds' counts, order and headings", () => {
    const [, fresh, , , agendas, stories, , , , , news] = plan().sections;
    expect(fresh).toMatchObject({ kinds: ["caseStudies", "newsPosts", "livedExperiences", "researchOutputs"], fill: "automatic", count: 5, layout: "grid", heading: { en: "Fresh on the hub", fr: "Du nouveau" } });
    expect(agendas).toMatchObject({ kinds: ["agendas"], count: 4, sort: "featuredFirst", layout: "grid", heading: { en: "Research agendas" } });
    expect(stories).toMatchObject({ kinds: ["livedExperiences"], count: 8, layout: "carousel", heading: { en: "Stories" } });
    expect(news).toMatchObject({ kinds: ["newsPosts"], count: 3, sort: "newest", layout: "grid", heading: { en: "Latest news" } });
  });

  it("keeps hand-picked testimonials as a Testimonials section", () => {
    const p = planHomepageSections({ global: { ...slots, livedExperiences: { title: loc("Stories"), testimonial: { en: ["t1"] } } }, organizationIds: [], freshHeading: loc("x") });
    expect(p.sections[5].blockType).toBe("carousel2");
  });

  it("adds the region map heading in four languages and leaves the banner on its defaults", () => {
    const p = plan();
    expect(p.sections[7]).toMatchObject({ blockType: "regionMap", title: { en: "Explore by region", es: "Explorar por región", fr: "Explorer par région", ar: "استكشف حسب المنطقة" } });
    expect(p.sections[6]).toEqual({ blockType: "submitStoryBanner" });
  });

  it("points the logo strip at the partner organisations, in order", () => {
    expect(plan().sections[13]).toMatchObject({ blockType: "logoCloud1", organizations: ["o1", "o2"], images: [], layout: "marquee", title: { en: "Who is involved" } });
  });

  it("skips a slot that is empty, and says so", () => {
    const p = planHomepageSections({ global: { ...slots, projectInfo: null }, organizationIds: [], freshHeading: loc("x") });
    expect(p.sections.map((s) => s.blockType)).toHaveLength(13);
    expect(p.notes).toContain("projectInfo was empty — no section added.");
  });
});

describe("planSection", () => {
  it("uses English rows when languages have different row counts, and reports it", () => {
    const diffs: never[] = [];
    const row = planSection(hero1, { links: { en: [{ title: "A" }, { title: "B" }], fr: [{ title: "A fr" }] } }, "heroWelcome", diffs);
    expect((row.links as unknown[]).length).toBe(2);
    expect(diffs).toContainEqual(expect.objectContaining({ path: "links", section: "heroWelcome" }));
  });
  it("recurses into nested section lists by their own definitions", () => {
    const row = planSection(splitRow, { splitColumns: { en: [{ blockType: "splitImage", id: "x", image: { asset: "m1", alt: { en: "Pic" } } }] } }, "s", []);
    expect((row.splitColumns as Array<Record<string, unknown>>)[0]).toMatchObject({ blockType: "splitImage", image: { asset: "m1", alt: { en: "Pic" } } });
  });
});
```

(`@/scripts/...` must resolve — if `tsconfig` paths map `@/*` to the repo root, it does; otherwise import with a relative path `../../scripts/homepage/plan`.)

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: Implement `scripts/homepage/plan.ts`**

```ts
import type { Block, Field } from "payload";
import * as library from "@/payload/blocks";

type Row = Record<string, unknown>;
const LOCALES = ["en", "es", "fr", "ar"] as const;
type Lang = (typeof LOCALES)[number];
export type LocaleMap = Partial<Record<Lang, unknown>>;
export interface Difference { section: string; path: string; values: LocaleMap }
export interface SlotPlan { sections: Row[]; differences: Difference[]; notes: string[] }

const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);
const isLocaleMap = (v: unknown): v is Row => isRow(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => (LOCALES as readonly string[]).includes(k));
const BLOCKS: Record<string, Block> = Object.fromEntries(Object.values(library).map((b) => [(b as Block).slug, b as Block]));

/** One language's view of a slot read with locale "all": every language map → that language (null when missing). */
function view(value: unknown, lang: Lang): unknown {
  if (isLocaleMap(value)) return lang in value ? view(value[lang], lang) : null;
  if (Array.isArray(value)) return value.map((v) => view(v, lang));
  if (isRow(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, view(v, lang)]));
  return value;
}

const same = (values: unknown[]) => values.every((v) => JSON.stringify(v ?? null) === JSON.stringify(values[0] ?? null));
const compact = (m: LocaleMap): LocaleMap => Object.fromEntries(Object.entries(m).filter(([, v]) => v !== null && v !== undefined && v !== ""));

/** Build a section's fields from per-language views, by the block's own definitions. */
function build(fields: Field[], views: Record<Lang, Row | null>, ctx: { section: string; path: string; diffs: Difference[] }): Row {
  const out: Row = {};
  for (const field of fields) {
    if (field.type === "collapsible" || field.type === "row") {
      Object.assign(out, build((field as { fields: Field[] }).fields, views, ctx));
      continue;
    }
    if (!("name" in field) || field.name === "id" || field.type === "ui") continue;
    const name = field.name;
    const path = ctx.path ? `${ctx.path}.${name}` : name;
    const per = Object.fromEntries(LOCALES.map((l) => [l, views[l]?.[name]])) as Record<Lang, unknown>;
    if ("localized" in field && field.localized) {
      const map = compact(per);
      if (Object.keys(map).length > 0) out[name] = map;
      continue;
    }
    if (field.type === "group") {
      if (per.en == null) continue;
      out[name] = build(field.fields, Object.fromEntries(LOCALES.map((l) => [l, (per[l] as Row | null) ?? null])) as Record<Lang, Row | null>, { ...ctx, path });
      continue;
    }
    if (field.type === "array" || field.type === "blocks") {
      const en = Array.isArray(per.en) ? (per.en as Row[]) : [];
      const counts = LOCALES.filter((l) => Array.isArray(per[l])).map((l) => (per[l] as unknown[]).length);
      if (!same(counts)) ctx.diffs.push({ section: ctx.section, path, values: Object.fromEntries(LOCALES.filter((l) => Array.isArray(per[l])).map((l) => [l, (per[l] as unknown[]).length])) });
      out[name] = en.map((enRow, i) => {
        const rowViews = Object.fromEntries(LOCALES.map((l) => { const list = per[l]; const r = Array.isArray(list) && list.length === en.length ? (list[i] as Row) : null; return [l, l === "en" ? enRow : r]; })) as Record<Lang, Row | null>;
        const rowFields = field.type === "blocks" ? (BLOCKS[String(enRow.blockType)]?.fields ?? []) : field.fields;
        const built = build(rowFields, rowViews, { ...ctx, path: `${path}[${i}]` });
        return field.type === "blocks" ? { blockType: enRow.blockType, ...built } : built;
      });
      continue;
    }
    // Plain value (select, number, checkbox, relationship, upload, point…): English, differences reported.
    const present = LOCALES.filter((l) => views[l] !== null);
    if (!same(present.map((l) => per[l]))) ctx.diffs.push({ section: ctx.section, path, values: Object.fromEntries(present.map((l) => [l, per[l]])) });
    if (per.en !== undefined && per.en !== null) out[name] = per.en;
  }
  return out;
}

export function planSection(block: Block, slot: unknown, section: string, differences: Difference[]): Row {
  const views = Object.fromEntries(LOCALES.map((l) => [l, isRow(slot) ? (view(slot, l) as Row) : null])) as Record<Lang, Row | null>;
  // A language whose row lists are all missing still contributes its text; rows it lacks fall back per list.
  return { blockType: block.slug, ...build(block.fields, views, { section, path: "", diffs: differences }) };
}

const REGION_MAP_TITLE: LocaleMap = { en: "Explore by region", es: "Explorar por región", fr: "Explorer par région", ar: "استكشف حسب المنطقة" };

const feed = (over: Row): Row => ({ blockType: "contentFeed", fill: "automatic", viewAll: { show: true }, ...over });

export function planHomepageSections({ global, organizationIds, freshHeading }: { global: Row; organizationIds: string[]; freshHeading: LocaleMap }): SlotPlan {
  const differences: Difference[] = [];
  const notes: string[] = [];
  const sections: Row[] = [];
  const slot = (name: string) => (isRow(global[name]) ? (global[name] as Row) : null);
  const copy = (name: string, block: Block) => {
    const s = slot(name);
    if (!s) return notes.push(`${name} was empty — no section added.`);
    sections.push(planSection(block, s, name, differences));
  };
  const heading = (s: Row | null) => (s && isLocaleMap(s.title) ? compact(s.title as LocaleMap) : undefined);
  const count = (s: Row | null, dflt: number) => (typeof s?.maxItems === "number" && s.maxItems > 0 ? Math.min(24, s.maxItems) : dflt);

  copy("heroWelcome", library.hero1);
  sections.push(feed({ heading: compact(freshHeading), kinds: ["caseStudies", "newsPosts", "livedExperiences", "researchOutputs"], count: 5, layout: "grid", sort: "newest" }));
  copy("globalAgenda", library.splitRow);
  copy("howToUse", library.splitRow);
  const agendas = slot("agendasModule");
  if (agendas) sections.push(feed({ heading: heading(agendas), kinds: ["agendas"], count: count(agendas, 3), sort: agendas.mode === "dynamic-featured" ? "featuredFirst" : "newest", layout: "grid" }));
  else notes.push("agendasModule was empty — no section added.");
  const stories = slot("livedExperiences");
  const picked = stories ? (view(stories, "en") as Row).testimonial : null;
  if (Array.isArray(picked) && picked.length > 0) copy("livedExperiences", library.carousel2);
  else if (stories) sections.push(feed({ heading: heading(stories), kinds: ["livedExperiences"], count: 8, sort: "newest", layout: "carousel" }));
  else notes.push("livedExperiences was empty — no section added.");
  sections.push({ blockType: "submitStoryBanner" });
  sections.push({ blockType: "regionMap", title: REGION_MAP_TITLE });
  copy("regionalCommunities", library.gridRow);
  copy("collaboration", library.splitRow);
  const news = slot("news");
  if (news) sections.push(feed({ heading: heading(news), kinds: ["newsPosts"], count: count(news, 3), sort: news.mode === "dynamic-featured" ? "featuredFirst" : "newest", layout: "grid" }));
  else notes.push("news was empty — no section added.");
  copy("projectInfo", library.splitRow);
  copy("mentalHealthDefinition", library.cta1);
  const logos = slot("partnerLogos");
  if (logos) {
    const planned = planSection(library.logoCloud1, logos, "partnerLogos", differences);
    sections.push({ ...planned, organizations: organizationIds, images: [] });
  } else notes.push("partnerLogos was empty — no section added.");

  return { sections, differences, notes };
}
```

Notes for the implementer: in the fixture, `title: loc(...)` at slot level is a language map (the slot container is unlocalized, its text fields are localized); row lists are language maps of arrays. `view()` turns each into one language's plain value, then `build()` re-assembles maps for fields the block declares `localized`. The `testimonial` field name must match `carousel-2.ts` — read it and adjust. If a block's rich-text `body` is present, it passes through as a map of Lexical states (localized field) — no special handling needed.

- [ ] **Step 4: PASS** + gates (lint `scripts/homepage/plan.ts`).

- [ ] **Step 5: Commit** — `git commit -m "feat(homepage): plan the move from fixed slots to sections, keeping every language's text"`.

---

### Task 7: The partner and organisation planner (pure)

**Files:**
- Create: `scripts/homepage/organisations.ts`
- Test: `lib/__tests__/homepage-organisations-plan.test.ts`

**Interfaces:**
- Produces:

```ts
export interface OrgRow { id: string; name: string; type?: string | null; showOnSite?: boolean | null; used?: boolean }
export interface LogoRow { asset: string | null; alt: string | null; orgType?: string | null }
export type PartnerStep = { index: number; name: string; action: "match"; orgId: string } | { index: number; name: string; action: "create"; logo: string | null; type: string } | { index: number; action: "skip"; reason: string };
export function planPartners(logos: LogoRow[], orgs: OrgRow[]): PartnerStep[];
export type OrgFix = { id: string; from: string; action: "rename"; to: string } | { id: string; from: string; action: "hide" } | { id: string; from: string; action: "keep" };
export function planOrganisationFixes(orgs: OrgRow[]): OrgFix[];
export const NAME_FIXES: Record<string, string>;
export const UNCLEAR_NAMES: ReadonlySet<string>;
```

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { planPartners, planOrganisationFixes } from "@/scripts/homepage/organisations";

describe("planPartners", () => {
  const orgs = [{ id: "o1", name: "University of Nigeria" }, { id: "o2", name: "Climate Cares Centre" }];
  it("matches by name from the logo's description, ignoring 'Logo' and case", () => {
    expect(planPartners([{ asset: "m1", alt: "University of Nigeria Logo" }], orgs)).toEqual([{ index: 0, name: "University of Nigeria", action: "match", orgId: "o1" }]);
  });
  it("creates an organisation for an unmatched logo, keeping its picture and type", () => {
    expect(planPartners([{ asset: "m2", alt: "Wellcome Logo ", orgType: "foundation" }], orgs)).toEqual([{ index: 0, name: "Wellcome", action: "create", logo: "m2", type: "foundation" }]);
  });
  it("defaults an unknown type to other", () => {
    expect(planPartners([{ asset: "m3", alt: "Force of Nature Logo" }], orgs)[0]).toMatchObject({ action: "create", type: "other" });
  });
  it("skips a logo with no description, and says why", () => {
    expect(planPartners([{ asset: "m4", alt: "  " }], orgs)[0]).toEqual({ index: 0, action: "skip", reason: "no description to name it by" });
  });
  it("matches the same new partner once when it appears twice", () => {
    const steps = planPartners([{ asset: "a", alt: "Wellcome Logo" }, { asset: "b", alt: "wellcome logo" }], orgs);
    expect(steps.map((s) => s.action)).toEqual(["create", "match"]);
  });
});

describe("planOrganisationFixes", () => {
  it("renames clipped names it knows, hides unclear ones, keeps the rest", () => {
    const fixes = planOrganisationFixes([
      { id: "a", name: "Cook University" }, { id: "b", name: "The University" }, { id: "c", name: "University of Nairobi" },
    ]);
    expect(fixes).toEqual([
      { id: "a", from: "Cook University", action: "rename", to: "James Cook University" },
      { id: "b", from: "The University", action: "hide" },
      { id: "c", from: "University of Nairobi", action: "keep" },
    ]);
  });
  it("never hides an organisation that content links to", () => {
    expect(planOrganisationFixes([{ id: "b", name: "The University", used: true }])[0].action).toBe("keep");
  });
  it("leaves an already-hidden organisation alone", () => {
    expect(planOrganisationFixes([{ id: "b", name: "The University", showOnSite: false }])[0].action).toBe("keep");
  });
});
```


- [ ] **Step 2: FAIL.**

- [ ] **Step 3: Implement**

```ts
const ORG_TYPES = new Set(["ngo", "research", "university", "government", "international", "company", "community", "foundation", "other"]);

/** Clipped names from the old import whose full name is certain. Reviewed in the dry run. */
export const NAME_FIXES: Record<string, string> = {
  "cook university": "James Cook University",
  "hopkins university": "Johns Hopkins University",
  "salle university": "La Salle University",
  "khan university": "Aga Khan University",
};
/** Fragments that could be many organisations — hidden, never guessed. */
export const UNCLEAR_NAMES: ReadonlySet<string> = new Set([
  "the university", "federal university", "policy institute", "technological university",
  "kong university", "university of science", "mind institute", "university of rio grande",
]);

const key = (s: string) => s.trim().replace(/\s+/g, " ").toLowerCase();
const nameFromAlt = (alt: string | null) => (alt ?? "").replace(/\s*logo\s*$/i, "").trim();

export function planPartners(logos: LogoRow[], orgs: OrgRow[]): PartnerStep[] {
  const byName = new Map(orgs.map((o) => [key(o.name), o.id]));
  const created = new Map<string, number>();
  return logos.map((logo, index): PartnerStep => {
    const name = nameFromAlt(logo.alt);
    if (!name) return { index, action: "skip", reason: "no description to name it by" };
    const orgId = byName.get(key(name));
    if (orgId) return { index, name, action: "match", orgId };
    if (created.has(key(name))) return { index, name, action: "match", orgId: `new:${key(name)}` };
    created.set(key(name), index);
    return { index, name, action: "create", logo: logo.asset, type: logo.orgType && ORG_TYPES.has(logo.orgType) ? logo.orgType : "other" };
  });
}

export function planOrganisationFixes(orgs: OrgRow[]): OrgFix[] {
  return orgs.map((org): OrgFix => {
    const k = key(org.name);
    if (NAME_FIXES[k]) return { id: org.id, from: org.name, action: "rename", to: NAME_FIXES[k] };
    if (UNCLEAR_NAMES.has(k) && !org.used && org.showOnSite !== false) return { id: org.id, from: org.name, action: "hide" };
    return { id: org.id, from: org.name, action: "keep" };
  });
}
```

(`new:<key>` is a placeholder id the runner swaps for the id it creates for the first occurrence.)

- [ ] **Step 4: PASS** + gates.

- [ ] **Step 5: Commit** — `git commit -m "feat(organisations): plan partner organisations from the homepage logos and tidy clipped names"`.

---

### Task 8: The move script

**Files:**
- Create: `scripts/homepage/move-to-sections.ts`, `scripts/homepage/write.ts`
- Test: `lib/__tests__/homepage-move-write.test.ts`

**Interfaces:**
- Consumes: `planHomepageSections`, `planPartners`, `planOrganisationFixes`, `collapseLocales` (Task 3).
- Produces (`write.ts`, pure): `toLocaleData(sections: Row[], lang): Row[]` (exact language, no fallback, via `collapseLocales(..., { fallback: false })`); `withIdsFrom(saved: unknown, data: unknown): unknown` (copies `id`s by position into arrays of objects, recursively); `guardExisting(existing: unknown[], flags: { replace: boolean }): string | null` (the refusal message or null).

CLI: `pnpm exec tsx scripts/homepage/move-to-sections.ts [--execute] [--replace] [--revert] [--orgs] [--production]`.

- [ ] **Step 1: Failing tests** (`homepage-move-write.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { guardExisting, toLocaleData, withIdsFrom } from "@/scripts/homepage/write";

describe("writing the move", () => {
  it("writes each language's own text only", () => {
    const sections = [{ blockType: "hero1", title: { en: "Hi", fr: "Salut" } }];
    expect(toLocaleData(sections, "fr")).toEqual([{ blockType: "hero1", title: "Salut" }]);
    expect(toLocaleData(sections, "es")).toEqual([{ blockType: "hero1", title: null }]);
  });
  it("reuses the saved rows' ids so later languages fill the same sections", () => {
    const saved = [{ id: "s1", blockType: "hero1", links: [{ id: "l1", title: "Go" }] }];
    const data = [{ blockType: "hero1", title: "Salut", links: [{ title: "Aller" }] }];
    expect(withIdsFrom(saved, data)).toEqual([{ id: "s1", blockType: "hero1", title: "Salut", links: [{ id: "l1", title: "Aller" }] }]);
  });
  it("refuses to overwrite sections that already exist unless told to", () => {
    expect(guardExisting([{ blockType: "hero1" }], { replace: false })).toBe(
      "The homepage already has 1 section. Nothing was changed. Run with --replace to overwrite them, or --revert to empty the list first.",
    );
    expect(guardExisting([{ blockType: "hero1" }], { replace: true })).toBeNull();
    expect(guardExisting([], { replace: false })).toBeNull();
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: `write.ts`**

```ts
import { collapseLocales } from "@/lib/content/internal/localize";
type Row = Record<string, unknown>;

export function toLocaleData(sections: Row[], lang: string): Row[] {
  return collapseLocales(sections, lang, { fallback: false }) as Row[];
}

export function withIdsFrom(saved: unknown, data: unknown): unknown {
  if (Array.isArray(data)) return data.map((item, i) => withIdsFrom(Array.isArray(saved) ? saved[i] : undefined, item));
  if (data && typeof data === "object") {
    const out: Row = {};
    const s = saved && typeof saved === "object" && !Array.isArray(saved) ? (saved as Row) : {};
    if (typeof s.id === "string" || typeof s.id === "number") out.id = s.id;
    for (const [k, v] of Object.entries(data as Row)) out[k] = withIdsFrom(s[k], v);
    return out;
  }
  return data;
}

export function guardExisting(existing: unknown[], { replace }: { replace: boolean }): string | null {
  if (existing.length === 0 || replace) return null;
  const n = existing.length;
  return `The homepage already has ${n} section${n === 1 ? "" : "s"}. Nothing was changed. Run with --replace to overwrite them, or --revert to empty the list first.`;
}
```

(`lib/content/internal/localize.ts` has no `server-only`, so scripts may import it.)

- [ ] **Step 4: Runner** (`move-to-sections.ts`) — same shape as `scripts/regional-pages/show-atlas.ts`: `loadEnv()`, `assertPayloadDatabase(process.env.PAYLOAD_DATABASE_URL, { action, ...(production ? { allowProduction: true } : {}) })`, `getPayloadInstance()`. Then:

1. `--revert`: `updateGlobal({ slug: "homepage", data: { sections: [], sectionsByLanguage: [], _status: "published" }, context: IMPORT_WRITE_CONTEXT })` for locale `en` (the shared list is unlocalized; clear `sectionsByLanguage` per locale in a loop); print "The homepage is back on its old sections." Exit.
2. Read: `findGlobal({ slug: "homepage", locale: "all", depth: 0, draft: false })`; organisations `find({ collection: "organizations", pagination: false, depth: 0 })`; which organisations content links to (for `used`): for each of caseStudies/newsPosts/researchOutputs/livedExperiences/agendas collect `organizations` ids (`find` with `select: { organizations: true }`, `pagination: false`, `depth: 0`).
3. Guard: `guardExisting(global.sections ?? [], { replace })` → print and exit 1 when non-null (before any write, also in dry run).
4. Partners: logos = the English view of `global.partnerLogos.images` (`collapseLocales(images, "en")` → `{ asset, alt, orgType }`); `planPartners(logos, orgs)`.
5. Org fixes (`--orgs` only): `planOrganisationFixes(orgs.map(o => ({ ...o, used: usedIds.has(o.id) })))`.
6. Sections: `planHomepageSections({ global, organizationIds: <partner ids in logo order, "new:<key>" placeholders for creates>, freshHeading })` where `freshHeading` comes from `messages/<lang>.json` → `typedCards.freshHeading` (read with `fs`).
7. Print: a partner table (`#`, name, match/create/skip, organisation), the org fixes table (with `--orgs`), the section list (`#`, section, heading in en), the per-language heading table for each section (en/es/fr/ar, "—" when missing), `differences` (section, path, values) and `notes`. End a dry run with: "Dry run — nothing was written. Re-run with --execute to apply."
8. `--execute`:
   a. create the new partner organisations (`payload.create({ collection: "organizations", data: { name, type, showOnSite: true, logo: { asset: logoId, alt: name } }, context: IMPORT_WRITE_CONTEXT })`), then replace `new:<key>` placeholders in the logo strip's `organizations` with the created ids;
   b. `--orgs`: apply renames (`update name`, and `slug` left to the slug field's own behaviour) and hides (`showOnSite: false`);
   c. write the sections: `updateGlobal({ slug: "homepage", locale: "en", draft: false, data: { layoutPerLanguage: false, sections: toLocaleData(sections, "en"), _status: "published" }, context: IMPORT_WRITE_CONTEXT })`; read back `findGlobal({ slug: "homepage", locale: "en", depth: 0 })`; for `es`, `fr`, `ar`: `updateGlobal({ slug: "homepage", locale: lang, draft: false, data: { sections: withIdsFrom(saved.sections, toLocaleData(sections, lang)), _status: "published" }, context: IMPORT_WRITE_CONTEXT })`;
   d. print "Done. Clear the site cache so visitors see it:" followed by the `curl -X POST …/api/cache/revalidate -H 'Authorization: Bearer $ADMIN_API_KEY' -d '{"all":true}'` line.

Writes stop at the first error with the error printed; nothing is deleted at any point.

- [ ] **Step 5: PASS** (`homepage-move-write.test.ts`) + gates (lint the three script files).

- [ ] **Step 6: Commit** — `git commit -m "feat(homepage): a dry-run-first script moves the homepage onto sections and sets up partner organisations"`.

---

### Task 9: Easy editing — "More options" and the staff Edit button

**Files:**
- Create: `payload/blocks/more-options.ts`, `components/blocks/section-edit-link.tsx`
- Modify: every block file under `payload/blocks/` that has presentation fields (`hero-1`, `hero-2`, `section-header`, `split-row`, `grid-row`, `cta-1`, `logo-cloud-1`, `carousel-1`, `carousel-2`, `timeline-row`, `faqs`, `submit-story-banner`, `form-newsletter`, `events-calendar`), `components/blocks/index.tsx`, `components/pages/homepage.tsx`, `app/[locale]/(main)/page.tsx`, `messages/{en,es,fr,ar}.json` (`blocks.editSection`)
- Test: `lib/__tests__/payload-more-options.test.ts`, `lib/__tests__/section-edit-link.test.tsx`

**Interfaces:**
- Produces: `moreOptions(fields: Field[], names?: string[]): Field[]` — moves the named presentation fields (default `PRESENTATION_FIELDS`) into one trailing `{ type: "collapsible", label: "More options", admin: { initCollapsed: true } }`; `PRESENTATION_FIELDS = ["padding", "background", "sectionWidth", "stackAlign", "noGap", "motionSpeed", "imagePosition", "cardVariant", "gridColumns", "initialDisplayCount", "indicators"]`. `<Blocks editHref?: (index: number) => string>`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/payload-more-options.test.ts
import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import { fieldAffectsData } from "payload/shared";
import * as library from "@/payload/blocks";

/** The stored shape: every data field's name, however deep, collapsibles flattened. */
function dataNames(fields: Field[], prefix = ""): string[] {
  return fields.flatMap((f) => {
    if (f.type === "collapsible" || f.type === "row") return dataNames((f as { fields: Field[] }).fields, prefix);
    if (!fieldAffectsData(f)) return [];
    const here = `${prefix}${f.name}`;
    return "fields" in f && Array.isArray(f.fields) && f.type !== "array" ? [here, ...dataNames(f.fields, `${here}.`)] : [here];
  }).sort();
}

describe("More options", () => {
  it("folds presentation settings away on every section that has them", () => {
    const hero = library.hero1.fields.find((f) => f.type === "collapsible") as { label: string; fields: Array<{ name?: string }> };
    expect(hero.label).toBe("More options");
    expect(hero.fields.map((f) => f.name)).toEqual(expect.arrayContaining(["padding", "background", "imagePosition"]));
  });
  it("puts the essentials first", () => {
    expect((library.hero1.fields[0] as { name?: string }).name).not.toBe("background");
  });
  it("doesn't change what is stored", () => {
    expect(dataNames(library.hero1.fields)).toEqual(["background", "background.blobAccent", "background.ccmColor", "background.color", "background.gradient", "background.gradient.direction", "background.gradient.endColor", "background.gradient.startColor", "background.image", "background.image.alt", "background.image.asset", "background.lightText", "background.svgPattern", "background.type", "body", "image", "image.alt", "image.asset", "imagePosition", "links", "padding", "padding.bottom", "padding.top", "tagLine", "title"].sort());
  });
});
```

(Before writing the third test's expected list, print `dataNames(hero1.fields)` on the current (pre-change) code and paste that exact list — the assertion is "unchanged", so the list must come from today's definition.)

```tsx
// lib/__tests__/section-edit-link.test.tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionEditLink } from "@/components/blocks/section-edit-link";

describe("SectionEditLink", () => {
  it("links staff to the section in the admin, with a clear name", () => {
    render(<SectionEditLink href="/admin/globals/homepage#sections-row-2" label="Edit this section" />);
    const link = screen.getByRole("link", { name: "Edit this section" });
    expect(link.getAttribute("href")).toBe("/admin/globals/homepage#sections-row-2");
    expect(link.className).toContain("min-h-11");
  });
});
```

- [ ] **Step 2: FAIL.**

- [ ] **Step 3: `payload/blocks/more-options.ts`**

```ts
import type { Field } from "payload";

/** Presentation settings editors rarely need; folded into "More options". */
export const PRESENTATION_FIELDS = ["padding", "background", "sectionWidth", "stackAlign", "noGap", "motionSpeed", "imagePosition", "cardVariant", "gridColumns", "initialDisplayCount", "indicators"];

/** The essentials first, then one collapsed "More options" group. A collapsible
 *  holds no data of its own, so what is stored doesn't change. */
export function moreOptions(fields: Field[], names: string[] = PRESENTATION_FIELDS): Field[] {
  const folded = fields.filter((f) => "name" in f && names.includes(f.name));
  if (folded.length === 0) return fields;
  const rest = fields.filter((f) => !folded.includes(f));
  return [...rest, { type: "collapsible", label: "More options", admin: { initCollapsed: true }, fields: folded }];
}
```

Wrap each listed block's `fields: [...]` as `fields: moreOptions([...])`.

- [ ] **Step 4: Check no schema change** — `pnpm exec payload migrate:create more_options_check`. Expected: the generated migration has no SQL statements (or Payload reports nothing to do). Delete the generated files either way; if it contains statements, stop and report.

- [ ] **Step 5: Edit button**

```tsx
// components/blocks/section-edit-link.tsx
import { Pencil } from "lucide-react";

/** Staff only (the caller decides): a small link from a section on the site to that section in the admin. */
export function SectionEditLink({ href, label }: { href: string; label: string }) {
  return (
    <div className="pointer-events-none relative z-10 mx-auto flex max-w-screen-xl justify-end px-4">
      <a
        href={href}
        className="pointer-events-auto -mb-11 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/90 px-3 text-sm font-bold text-ccm-sea shadow-sm ring-1 ring-ccm-sea/20 hover:bg-white"
      >
        <Pencil className="size-4" aria-hidden />
        {label}
      </a>
    </div>
  );
}
```

`components/blocks/index.tsx`: `BlocksProps` gains `editHref?: (index: number) => string` and `editLabel?: string`; inside the map, when `editHref` is set render `<SectionEditLink href={editHref(i)} label={editLabel ?? "Edit"} />` before the component (use the map's index).

`app/[locale]/(main)/page.tsx`: compute `const canEdit = isStaff(await getActor())` (import from `@/lib/authz`) and pass `canEdit` and the translated label (`(await getTranslations("blocks"))("editSection")`) to `<Homepage>`; `components/pages/homepage.tsx` passes `editHref={canEdit ? (i) => \`/admin/globals/homepage#sections-row-${i}\` : undefined}` and `editLabel` to `<Blocks>` on the sections path only. Messages `blocks.editSection`: en "Edit this section", es "Editar esta sección", fr "Modifier cette section", ar "تعديل هذا القسم".

(The anchor `sections-row-<i>` is the id Payload gives a block row: `${parentPath}-row-${rowIndex}` in `@payloadcms/ui` `BlockRow`. If the admin doesn't scroll to it on load, the link still opens the homepage editor — acceptable per the spec.)

- [ ] **Step 6: PASS** + full suite (block field tests may assert field order — update only assertions about *order*; any assertion about stored names must stay) + importmap + `/admin` 200 + gates.

- [ ] **Step 7: Commit** — `git commit -m "feat(cms): sections show their essentials first, and staff can jump from the homepage to edit a section"`.

---

### Task 10: Dev run, rendered checks, runbook

**Files:**
- Modify: `docs/migration/payload-production-runbook.md` (section "2026-09-28 homepage on sections")

- [ ] **Step 1: Before screenshots** — `pnpm dev`; Playwright: `/en` and `/ar` at 1280×900 and 375×800, scroll the whole page first (sections fade in on scroll), full-page screenshots into `.playwright-mcp/` (git-ignored).

- [ ] **Step 2: Dry run** — `pnpm exec tsx scripts/homepage/move-to-sections.ts --orgs`. Read every table: 14 sections in the agreed order; per-language headings present where today's homepage has them; differences only the expected kind (hero button size, news picks, row-count mismatches); 20 partner rows with plausible match/create; org fixes as in Task 7's lists. Anything surprising → stop and report.

- [ ] **Step 3: Execute on dev** — add `--execute`; then clear the dev cache (`curl -X POST localhost:3000/api/cache/revalidate -H 'content-type: application/json' -d '{"all":true}'`) and load `/en` twice (the first response after a clear may be the stale one).

- [ ] **Step 4: After checks** (Playwright, same four views): every old section's text is present; the three new sections appear in place; feeds show cards (news 3, agendas ≤3–4, stories carousel); the logo strip shows organisation logos, each a link to `/<lang>/organizations/<slug>`; open one organisation page (200, header, "On the hub" feed or no feed when nothing is linked); no horizontal scroll at 375; Arabic is right-to-left; console free of new errors. A hidden organisation's page → 404.

- [ ] **Step 5: Guard + rollback** — run the script again without flags: it refuses with the "already has 14 sections" message. Run `--revert`, clear the cache, `/en` shows the old homepage again; then re-run `--execute` to leave dev on the new homepage.

- [ ] **Step 6: Runbook** — append "2026-09-28 homepage on sections":
  1. Pre-check `migrate:status` (expect `homepage_sections_and_organisations` not yet run).
  2. Deploy `vercel --prod` (the migration applies on boot; the homepage looks unchanged — the list is empty).
  3. Dry run on production: `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec tsx scripts/homepage/move-to-sections.ts --orgs --production`; read the partner table, the org fixes, the section list, the language table and the differences.
  4. Execute: same with `--execute`; then clear the cache: `curl -X POST https://<site>/api/cache/revalidate -H "Authorization: Bearer $ADMIN_API_KEY" -H 'content-type: application/json' -d '{"all":true}'` and load the homepage twice.
  5. Rollback if needed: same command with `--revert`, then clear the cache.
  6. Signed-in checklist: the homepage editor shows Sections with pictures; removing the hero shows "This page always keeps its Hero. You can move it, but not remove it."; each section row shows "EN ✓ · ES …" status; "More options" is collapsed; on the site, each homepage section has an "Edit this section" button (staff only — check signed out too); the logo strip's "Partner organisations" picker lists only shown organisations; an organisation's "Preview" opens its hub page; add a new partner organisation and see it in the strip after Publish.

- [ ] **Step 7: Full gates** — `npx vitest run`, `npx tsc --noEmit -p .`, eslint on every file changed since this plan's first commit.

- [ ] **Step 8: Commit** — `git commit -m "docs(runbook): homepage on sections — deploy, dry run, execute, rollback and the signed-in checklist"`.
