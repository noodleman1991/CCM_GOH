# Page builder foundation (CMS project 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give editors one clear, picture-led section library in the Payload admin — the 12 code-only sections made addable, a new mixed "Content feed" section (Automatic / Automatic + my picks / Only my picks), a reusable shared-layout "Sections" field, per-section translation status, a "What will show now" panel, and live preview with real drafts — without changing anything visitors see on existing pages.

**Architecture:** Payload block definitions gain labels, picker groups and thumbnails; new blocks map to the front-end components that already exist through the existing adapter (`mapBlock` in `lib/content/internal/payload/blocks.ts`). A content-feed engine (`lib/content/internal/payload/feeds.ts` + pure helpers in `lib/content/feeds/`) turns settings into the site's existing mixed card shape (`TypedCardItem`). Preview uses Payload live preview, drafts on pages/homepage, and a new staff-only draft-mode route.

**Tech Stack:** Next.js 16 App Router, React 19, Payload 3.88 (Postgres), `@payloadcms/live-preview-react@3.88.0` (new), next-intl 4, zod 3, vitest (+ jsdom, @testing-library/react), Tailwind/shadcn.

**Spec:** `docs/superpowers/specs/2026-09-28-page-builder-foundation-design.md`. Read it first; §2 lists the programme decisions D1–D6 that bind this work.

## Global Constraints

- Branch: `master` (the repo's only branch). Commits `type(scope): sentence`; **never** any Claude/AI co-author or attribution line.
- Visitors see **no change** on existing pages: existing blocks keep their `slug` and field names (relabel only); no stored data changes except the additive migration (Task 6).
- Section labels, groups and order exactly as spec §3.1: groups `Openings`, `Text & media`, `Content`, `Maps`, `Calls to action`, `Logos & quotes`.
- Content feed kinds exactly: `caseStudies`, `newsPosts`, `events`, `livedExperiences`, `researchOutputs`, `agendas`. Fill modes exactly: `automatic` ("Automatic — newest items that match"), `automaticWithPicks` ("Automatic, with my picks first"), `picksOnly` ("Only the items I pick"). Count 1–24, default 6. Layouts `grid` (default) / `carousel` / `list`. Sorts `newest` (default) / `featuredFirst` / `upcomingSoonest` / `myOrder`.
- Region codes are the fixed seven (`REGION_OPTIONS`, already used by `payload/collections/regional-communities.ts`); any region value passed to Postgres must pass `isRegionCode` (bad values make the enum query throw).
- Published-only reads: collections with drafts (`caseStudies`, `newsPosts`, `livedExperiences`, and after Task 6 `pages` + the `homepage` global) must filter `_status: { equals: "published" }` outside draft mode — `draft: false` alone is NOT published-only (it returns main-table draft rows).
- Admin client components import ONLY pure modules — never `lib/content/**`, `next/headers`, `server-only`, `lib/authz` — or `/admin` 500s. After any `payload/**` change: `pnpm exec payload generate:importmap` (commit `app/(payload)/admin/importMap.js` if it changes), start `pnpm dev`, confirm `curl -s -o /dev/null -w "%{http_code}" --max-time 180 localhost:3000/admin` prints `200`, then `pkill -f "next dev"` (memory-tight machine).
- Dev database only, through `scripts/payload-import/lib/runtime.ts` guards; never production. Migrations: `pnpm exec payload migrate:create <name>`; the generated SQL must be additive only — anything else: delete the generated files and stop (BLOCKED). Before `pnpm exec payload migrate`, prove the host is dev (contains `lucky-waterfall`, from `.env.local`); a stale-marker prompt "You've run Payload in dev mode…" may appear — answering yes only filters the dev marker in memory.
- Site text goes in `messages/{en,es,fr,ar}.json`; admin labels and descriptions are English (the admin is English-only). Plain words everywhere, no dev-speak.
- Design language: reuse `ccm-*` tokens, shadcn components, `TypedCard`; mobile-first; RTL-correct; tap targets `min-h-11`.
- Gates per task: focused tests `npx vitest run <files>`; `npx tsc --noEmit -p .` prints nothing; `npx eslint <changed files>` no new errors (the repo-wide lint is not green — lint only your files); full `npx vitest run` once before the task's last commit.

## Review Focus

1. **A picked item that has since been unpublished, deleted, or un-approved** must never render and never break the feed; the admin panel lists it as "not shown". Pinned in Task 4 (`mergeFeed` skips missing picks) and Task 5 (`resolveContentFeed` drops picks the published query didn't return).
2. **Region filter values that aren't one of the seven codes** (stale data, typos in stored JSON) must be ignored, not sent to Postgres (enum throws). Pinned in Task 4 (`buildFeedWhere` test "drops unknown region codes").
3. **A new, never-published page under drafts** must not be visible to the public at its URL. Pinned in Task 6 (pages reader test "a draft-only page is not found outside draft mode").
4. **The preview route used as an open redirect** (`/api/preview?path=//evil.com`) must be refused. Pinned in Task 10 (route test "refuses protocol-relative and absolute paths").
5. **"Featured only" with Events chosen**: events have no featured flag — they must be excluded (not crash, not all-included) and the admin says so. Pinned in Task 4 (`buildFeedWhere` test) and Task 5 (admin description asserted in the block test).

---

### Task 1: Section picker — plain names, groups, pictures

**Files:**
- Create: `payload/blocks/picker.ts`
- Create: `public/admin/sections/*.svg` (18 files, listed below)
- Modify: `payload/blocks/hero-1.ts`, `section-header.ts`, `split-row.ts`, `grid-row.ts`, `cta-1.ts`, `logo-cloud-1.ts`, `carousel-2.ts`, `content-grid.ts`
- Test: `lib/__tests__/payload-section-picker.test.ts`

**Interfaces:**
- Produces: `SECTION_GROUPS` const, `type SectionGroup`, `pickerAdmin(key: SectionPictureKey, group: SectionGroup, alt: string): Block["admin"]`, `SECTION_PICTURES` (record of key → `/admin/sections/<key>.svg`).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/payload-section-picker.test.ts
import { describe, expect, it } from "vitest";
import type { Block } from "payload";
import { hero1 } from "@/payload/blocks/hero-1";
import { sectionHeader } from "@/payload/blocks/section-header";
import { splitRow } from "@/payload/blocks/split-row";
import { gridRow } from "@/payload/blocks/grid-row";
import { cta1 } from "@/payload/blocks/cta-1";
import { logoCloud1 } from "@/payload/blocks/logo-cloud-1";
import { carousel2 } from "@/payload/blocks/carousel-2";
import { contentGrid } from "@/payload/blocks/content-grid";
import { SECTION_GROUPS } from "@/payload/blocks/picker";

const expected: Array<[Block, string, string, string]> = [
  [hero1, "hero1", "Hero", "Openings"],
  [sectionHeader, "sectionHeader", "Section heading", "Openings"],
  [splitRow, "splitRow", "Text + image", "Text & media"],
  [gridRow, "gridRow", "Link cards", "Content"],
  [cta1, "cta1", "Call to action", "Calls to action"],
  [logoCloud1, "logoCloud1", "Logo strip", "Logos & quotes"],
  [carousel2, "carousel2", "Testimonials", "Logos & quotes"],
];

describe("section picker", () => {
  it.each(expected)("%s keeps its slug and gets a plain name, group and picture", (block, slug, label, group) => {
    expect(block.slug).toBe(slug);
    expect(block.labels?.singular).toBe(label);
    expect(block.admin?.group).toBe(group);
    const thumb = block.admin?.images?.thumbnail as { url: string; alt: string };
    expect(thumb.url).toMatch(/^\/admin\/sections\/[a-z0-9-]+\.svg$/);
    expect(thumb.alt.length).toBeGreaterThan(10);
  });

  it("marks the old regional content section as old, pointing to Content feed", () => {
    expect(contentGrid.labels?.singular).toBe("Content section (old)");
  });

  it("describes grid-row's automatic mode as an old setting", () => {
    const mode = (gridRow.fields as Array<{ name?: string; admin?: { description?: string } }>).find((f) => f.name === "mode");
    expect(mode?.admin?.description).toBe("Old automatic setting — use a Content feed section instead.");
  });

  it("has the six groups in order", () => {
    expect(SECTION_GROUPS).toEqual(["Openings", "Text & media", "Content", "Maps", "Calls to action", "Logos & quotes"]);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL** (`@/payload/blocks/picker` missing).

Run: `npx vitest run lib/__tests__/payload-section-picker.test.ts`

- [ ] **Step 3: Create `payload/blocks/picker.ts`**

```ts
import type { Block } from "payload";

/** The admin block picker's groups, in the order editors see them (spec §3.1). */
export const SECTION_GROUPS = ["Openings", "Text & media", "Content", "Maps", "Calls to action", "Logos & quotes"] as const;
export type SectionGroup = (typeof SECTION_GROUPS)[number];

export const SECTION_PICTURES = {
  hero: "/admin/sections/hero.svg",
  "hero-with-image": "/admin/sections/hero-with-image.svg",
  "section-heading": "/admin/sections/section-heading.svg",
  "text-image": "/admin/sections/text-image.svg",
  "image-carousel": "/admin/sections/image-carousel.svg",
  timeline: "/admin/sections/timeline.svg",
  faqs: "/admin/sections/faqs.svg",
  "content-feed": "/admin/sections/content-feed.svg",
  "events-calendar": "/admin/sections/events-calendar.svg",
  people: "/admin/sections/people.svg",
  "link-cards": "/admin/sections/link-cards.svg",
  "region-map": "/admin/sections/region-map.svg",
  atlas: "/admin/sections/atlas.svg",
  "call-to-action": "/admin/sections/call-to-action.svg",
  "share-story": "/admin/sections/share-story.svg",
  newsletter: "/admin/sections/newsletter.svg",
  "logo-strip": "/admin/sections/logo-strip.svg",
  testimonials: "/admin/sections/testimonials.svg",
} as const;
export type SectionPictureKey = keyof typeof SECTION_PICTURES;

/** Picker group + picture for a block. The picture is a small schematic of the section's shape. */
export function pickerAdmin(key: SectionPictureKey, group: SectionGroup, alt: string): NonNullable<Block["admin"]> {
  return { group, images: { thumbnail: { url: SECTION_PICTURES[key], alt } } };
}
```

- [ ] **Step 4: Relabel the existing blocks** (slug and fields untouched). For each, add `labels` and `admin` (merge with any existing `admin`):

| File | `labels.singular` / `labels.plural` | `pickerAdmin(key, group, alt)` |
|---|---|---|
| `hero-1.ts` | "Hero" / "Heroes" | `("hero", "Openings", "A large heading with text, buttons and an image beside it")` |
| `section-header.ts` | "Section heading" / "Section headings" | `("section-heading", "Openings", "A heading and short intro that starts a new part of the page")` |
| `split-row.ts` | "Text + image" / "Text + image rows" | `("text-image", "Text & media", "Text on one side and an image on the other")` |
| `grid-row.ts` | "Link cards" / "Link cards" | `("link-cards", "Content", "A row of cards you write yourself, each linking somewhere")` |
| `cta-1.ts` | "Call to action" / "Calls to action" | `("call-to-action", "Calls to action", "A short message with one or two buttons")` |
| `logo-cloud-1.ts` | "Logo strip" / "Logo strips" | `("logo-strip", "Logos & quotes", "A row of partner logos")` |
| `carousel-2.ts` | "Testimonials" / "Testimonials" | `("testimonials", "Logos & quotes", "Quotes from people, one at a time")` |

In `grid-row.ts`, set the `mode` field's `admin.description` to exactly `"Old automatic setting — use a Content feed section instead."`. In `content-grid.ts`, set `labels: { singular: "Content section (old)", plural: "Content sections (old)" }` (no picture, no group — it's being retired).

- [ ] **Step 5: Draw the 18 pictures** in `public/admin/sections/`. Each is a hand-written SVG, `viewBox="0 0 480 270"`, background `#EEF4FB` (ccm mist), shapes in `#0B3160` (midnight), `#205596` (sea), `#4186C3` (water), rounded rects (rx 8), no text except where noted. Use this template and vary the inner shapes:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 270" role="img" aria-label="Hero">
  <rect width="480" height="270" rx="16" fill="#EEF4FB"/>
  <rect x="32" y="70" width="200" height="22" rx="6" fill="#0B3160"/>
  <rect x="32" y="104" width="170" height="10" rx="5" fill="#4186C3" opacity=".5"/>
  <rect x="32" y="122" width="150" height="10" rx="5" fill="#4186C3" opacity=".5"/>
  <rect x="32" y="156" width="90" height="28" rx="14" fill="#205596"/>
  <rect x="262" y="48" width="186" height="174" rx="12" fill="#205596" opacity=".35"/>
</svg>
```

Shapes per file: `hero` (as template), `hero-with-image` (full-bleed image block with heading overlay), `section-heading` (one bar + one thin line centred), `text-image` (text lines left, image right), `image-carousel` (three image tiles + dots), `timeline` (vertical line with 4 dots and text bars), `faqs` (4 stacked rows with a chevron circle each), `content-feed` (3 cards each with image top + two lines + a small coloured type chip), `events-calendar` (7×5 day grid with 3 highlighted days), `people` (5 circles in a row + name bars), `link-cards` (3 plain cards with an arrow circle), `region-map` (simplified world blob with 4 pins), `atlas` (map blob with a side panel of bars), `call-to-action` (wide band with heading + two pill buttons), `share-story` (band with illustration circle + one pill), `newsletter` (heading + input rect + button pill), `logo-strip` (6 small rounded rects in a row), `testimonials` (large quote mark + text bars + avatar circle). Each file's `aria-label` = the section's plain name.

- [ ] **Step 6: Run test — expect PASS**; then `npx tsc --noEmit -p .`, eslint on the changed files.

- [ ] **Step 7: Admin check** — `pnpm exec payload generate:importmap`; `pnpm dev` → `/admin` 200 → stop server.

- [ ] **Step 8: Commit**

```bash
git add payload/blocks public/admin/sections lib/__tests__/payload-section-picker.test.ts "app/(payload)/admin/importMap.js"
git commit -m "feat(cms): sections get plain names, groups and pictures in the block picker"
```

---

### Task 2: Six hand-written sections become addable

**Files:**
- Create: `payload/blocks/hero-2.ts`, `faqs.ts`, `timeline-row.ts`, `carousel-1.ts`, `submit-story-banner.ts`, `form-newsletter.ts`
- Modify: `payload/blocks/index.ts` (export them), `lib/content/internal/payload/blocks.ts` (`mapBlock` cases)
- Test: `lib/__tests__/payload-new-manual-blocks.test.ts`

**Interfaces:**
- Consumes: `pickerAdmin` (Task 1); field helpers `localizedText`, `localizedTextarea`, `localizedRichText` (`payload/fields/localized.ts`), `backgroundOptionField`, `sectionPaddingField`, `linksArrayField`, `imageField` (`payload/blocks/shared.ts`).
- Produces: blocks `hero2` (slug `"hero2"`), `faqs` (`"faqs"`), `timelineRow` (`"timelineRow"`), `carousel1` (`"carousel1"`), `submitStoryBanner` (`"submitStoryBanner"`), `formNewsletter` (`"formNewsletter"`); `mapBlock` outputs `_type` `"hero-2" | "faqs" | "timeline-row" | "carousel-1" | "submit-story-banner" | "form-newsletter"` with props matching the components.

- [ ] **Step 1: Write the failing test** (follow `lib/__tests__/payload-page-blocks.test.ts` conventions; reuse its `MEDIA` fixture shape)

```ts
// lib/__tests__/payload-new-manual-blocks.test.ts
import { describe, expect, it } from "vitest";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { hero2, faqs, timelineRow, carousel1, submitStoryBanner, formNewsletter } from "@/payload/blocks";

const MEDIA = { id: "m1", url: "https://cdn.example/x.webp", mimeType: "image/webp", lqip: "data:image/webp;base64,AA", width: 1200, height: 800, sizes: {} };
const one = (row: Record<string, unknown>) => {
  const out = pageBlocks([row] as never);
  expect(out).toHaveLength(1);
  return out![0] as Record<string, unknown>;
};

describe("new hand-written sections", () => {
  it("defines each with a plain name and group", () => {
    expect([hero2, faqs, timelineRow, carousel1, submitStoryBanner, formNewsletter].map((b) => [b.slug, b.labels?.singular, b.admin?.group])).toEqual([
      ["hero2", "Hero with image", "Openings"],
      ["faqs", "FAQs", "Text & media"],
      ["timelineRow", "Timeline", "Text & media"],
      ["carousel1", "Image carousel", "Text & media"],
      ["submitStoryBanner", "Share-your-story banner", "Calls to action"],
      ["formNewsletter", "Newsletter signup", "Calls to action"],
    ]);
  });

  it("maps hero-2", () => {
    const b = one({ id: "h", blockType: "hero2", tagLine: "Tag", title: "Title", body: null, links: [], padding: null, background: null });
    expect(b._type).toBe("hero-2");
    expect(b.title).toBe("Title");
    expect(b.tagLine).toBe("Tag");
  });

  it("maps faqs to {_id,title,body}", () => {
    const b = one({ id: "f", blockType: "faqs", faqs: [{ id: "q1", title: "Why?", body: null }], padding: null });
    expect(b._type).toBe("faqs");
    expect(b.faqs).toEqual([{ _id: "q1", title: "Why?", body: null }]);
  });

  it("maps timeline-row", () => {
    const b = one({ id: "t", blockType: "timelineRow", timelines: [{ id: "a", title: "2020", tagLine: "Start", body: null }], padding: null });
    expect(b._type).toBe("timeline-row");
    expect((b.timelines as unknown[])).toHaveLength(1);
  });

  it("maps carousel-1 images to the component's asset shape", () => {
    const b = one({ id: "c", blockType: "carousel1", title: null, description: null, size: "two", indicators: "dots", images: [{ id: "i", asset: MEDIA, alt: "A" }], padding: null, background: null });
    expect(b._type).toBe("carousel-1");
    const img = (b.images as Array<{ alt: string; asset: { metadata: { lqip: string; dimensions: { width: number } } } }>)[0];
    expect(img.alt).toBe("A");
    expect(img.asset.metadata.lqip).toBe(MEDIA.lqip);
    expect(img.asset.metadata.dimensions.width).toBe(1200);
  });

  it("maps submit-story-banner and form-newsletter", () => {
    expect(one({ id: "s", blockType: "submitStoryBanner", title: "Share", subtitle: "Tell us", ctaLabel: "Start", illustration: null, padding: null })._type).toBe("submit-story-banner");
    const n = one({ id: "n", blockType: "formNewsletter", consentText: "OK?", buttonText: "Join", successMessage: "Thanks", padding: null });
    expect(n._type).toBe("form-newsletter");
    expect(n.buttonText).toBe("Join");
  });

  it("an unfilled optional image is null, never an empty object", () => {
    expect(one({ id: "s2", blockType: "submitStoryBanner", title: "x", illustration: { asset: null } }).illustration).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (exports missing).

- [ ] **Step 3: Define the blocks.** Fields mirror the component props (facts §F). Example — `payload/blocks/faqs.ts`:

```ts
import type { Block } from "payload";
import { localizedText, localizedRichText } from "@/payload/fields/localized";
import { sectionPaddingField } from "@/payload/blocks/shared";
import { pickerAdmin } from "@/payload/blocks/picker";

export const faqs: Block = {
  slug: "faqs",
  interfaceName: "FaqsBlock",
  labels: { singular: "FAQs", plural: "FAQ sections" },
  admin: pickerAdmin("faqs", "Text & media", "Questions that open to show their answers"),
  fields: [
    {
      name: "faqs",
      label: "Questions",
      type: "array",
      minRows: 1,
      labels: { singular: "Question", plural: "Questions" },
      fields: [localizedText("title", { required: true, label: "Question" }), localizedRichText("body", { label: "Answer" })],
    },
    sectionPaddingField("padding"),
  ],
};
```

The others, same pattern (all text via `localized*`, labels in plain words):
- `hero2` — `backgroundOptionField("background")`, `localizedText("tagLine", { label: "Small line above the title" })`, `localizedText("title")`, `localizedRichText("body")`, `linksArrayField("links", { maxRows: 2 })`, `sectionPaddingField("padding")`; picker `("hero-with-image", "Openings", "A full-width image with a heading on top")`; labels "Hero with image".
- `timelineRow` — array `timelines` (label "Steps", singular "Step") of `localizedText("title")`, `localizedText("tagLine", { label: "Date or label" })`, `localizedRichText("body")`; `sectionPaddingField`; picker `("timeline", "Text & media", "Steps or dates along a line")`.
- `carousel1` — `localizedText("title")`, `localizedTextarea("description")`, `backgroundOptionField`, `sectionPaddingField`, array `images` (min 1) of `imageField("image")`'s inner shape flattened: `{ name: "asset", type: "upload", relationTo: "media", required: true }` + `localizedText("alt", { label: "Describe the image" })`; select `size` (`one`/`two`/`three`, labels "One at a time"/"Two at a time"/"Three at a time", default `one`); select `indicators` (`none`/`dots`/`count`, default `dots`); picker `("image-carousel", "Text & media", "Several images you can swipe through")`.
- `submitStoryBanner` — `localizedText("title")`, `localizedTextarea("subtitle")`, `localizedText("ctaLabel", { label: "Button text" })`, `imageField("illustration")`, `sectionPaddingField`; picker `("share-story", "Calls to action", "An invitation to share a story, with a button")`.
- `formNewsletter` — `localizedTextarea("consentText", { label: "Consent note" })`, `localizedText("buttonText")`, `localizedText("successMessage", { label: "Message after signing up" })`, `sectionPaddingField`; picker `("newsletter", "Calls to action", "An email box to join the newsletter")`.

Export all six from `payload/blocks/index.ts`.

- [ ] **Step 4: Add `mapBlock` cases** in `lib/content/internal/payload/blocks.ts`. Reuse the existing helpers the `hero1Block` projection uses for padding, background, links, rich text and images (read `hero1Block` first and call the same functions). Each case returns `{ _type, _key: blockKey(row), ...props }` with prop names exactly the component's (facts §F). Example:

```ts
case "faqs":
  return {
    _type: "faqs",
    _key: blockKey(row),
    padding: padding(row.padding),            // the same helper hero1Block uses
    faqs: rows(row.faqs).map((f) => ({ _id: String(f.id ?? ""), title: text(f.title) ?? null, body: richOrNull(f.body) })),
  };
```

For `carousel1` images map each item to `{ alt, asset: { _id, url, metadata: { lqip, dimensions: { width, height } } } }` from the upload row (the same fields the existing image projection reads). An image group whose `asset` is null maps to `null`.

- [ ] **Step 5: Run — expect PASS**; also run `npx vitest run lib/__tests__/payload-page-blocks.test.ts` (must stay green).

- [ ] **Step 6: Gates + commit**

```bash
git add payload/blocks lib/content/internal/payload/blocks.ts lib/__tests__/payload-new-manual-blocks.test.ts
git commit -m "feat(cms): hero with image, FAQs, timeline, image carousel, story banner and newsletter become sections"
```

---

### Task 3: Four built-in automatic sections become addable

**Files:**
- Create: `payload/blocks/events-calendar.ts`, `people-widget.ts`, `region-map.ts`, `atlas-embed.ts`, `payload/fields/regions.ts`
- Modify: `payload/collections/regional-communities.ts` (import the moved `REGION_OPTIONS`), `payload/blocks/index.ts`, `lib/content/internal/payload/blocks.ts`
- Test: `lib/__tests__/payload-new-auto-blocks.test.ts`

**Interfaces:**
- Produces: blocks `eventsCalendar` → `_type "events-calendar"` `{ title, description, upcomingLimit, padding }`; `peopleWidget` → `"people-widget"` `{ title, description, limit, region }`; `regionMap` → `"region-map"` `{ title, description }`; `atlasEmbed` → `"atlas-embed"` `{ region, showBreakdown }`.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/payload-new-auto-blocks.test.ts
import { describe, expect, it } from "vitest";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { eventsCalendar, peopleWidget, regionMap, atlasEmbed } from "@/payload/blocks";

const one = (row: Record<string, unknown>) => (pageBlocks([row] as never) ?? [])[0] as Record<string, unknown> | undefined;

describe("built-in automatic sections", () => {
  it("are named and grouped", () => {
    expect([eventsCalendar, peopleWidget, regionMap, atlasEmbed].map((b) => [b.slug, b.labels?.singular, b.admin?.group])).toEqual([
      ["eventsCalendar", "Events calendar", "Content"],
      ["peopleWidget", "People", "Content"],
      ["regionMap", "Region map", "Maps"],
      ["atlasEmbed", "Atlas", "Maps"],
    ]);
  });

  it("maps events calendar with a default upcoming limit", () => {
    expect(one({ id: "e", blockType: "eventsCalendar", title: "Events", description: null, upcomingLimit: null })).toMatchObject({ _type: "events-calendar", title: "Events", upcomingLimit: 6 });
  });

  it("maps people with an optional region", () => {
    expect(one({ id: "p", blockType: "peopleWidget", title: null, limit: 12, region: "ssa" })).toMatchObject({ _type: "people-widget", limit: 12, region: "ssa" });
  });

  it("drops an atlas whose region isn't one of the seven (the component needs a valid one)", () => {
    expect(one({ id: "a", blockType: "atlasEmbed", region: "xx", showBreakdown: true })).toBeUndefined();
    expect(one({ id: "a2", blockType: "atlasEmbed", region: "lac", showBreakdown: false })).toMatchObject({ _type: "atlas-embed", region: "lac", showBreakdown: false });
  });

  it("drops a people region that isn't a valid code (shows everyone instead)", () => {
    expect(one({ id: "p2", blockType: "peopleWidget", region: "nowhere" })).toMatchObject({ region: null });
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Define the blocks** (plain labels and descriptions):
- `eventsCalendar` — `localizedText("title")`, `localizedTextarea("description")`, `{ name: "upcomingLimit", type: "number", label: "How many upcoming events", min: 1, max: 24, defaultValue: 6 }`, `sectionPaddingField`; picker `("events-calendar", "Content", "A calendar of upcoming events, filled automatically")`; `admin.description` on the block not available — put the "filled automatically" hint on the `upcomingLimit` field: `admin: { description: "Events appear here automatically once approved." }`.
- `peopleWidget` — `localizedText("title")`, `localizedTextarea("description")`, `{ name: "limit", type: "number", label: "How many people", min: 1, max: 48, defaultValue: 12 }`, `{ name: "region", type: "select", label: "Only people from this region (optional)", options: REGION_OPTIONS }`; picker `("people", "Content", "Members of the hub, filled automatically")`.
- `regionMap` — `localizedText("title")`, `localizedTextarea("description")`; picker `("region-map", "Maps", "A world map of the hub's regions")`.
- `atlasEmbed` — `{ name: "region", type: "select", required: true, label: "Region", options: REGION_OPTIONS }`, `{ name: "showBreakdown", type: "checkbox", label: "Show the breakdown panel", defaultValue: true }`; picker `("atlas", "Maps", "The interactive atlas for one region")`.
`REGION_OPTIONS` is currently a local `const` in `payload/collections/regional-communities.ts:31`. Move it verbatim to a new `payload/fields/regions.ts` (`export const REGION_OPTIONS = [...]`, keep its comment about matching `lib/content/taxonomy-options.ts`), import it back into `regional-communities.ts`, and import it here. Use `isRegionCode` from `lib/maps/region-codes.ts`.

- [ ] **Step 4: `mapBlock` cases** — use `isRegionCode` (the existing guard) for `region`; `atlasEmbed` with an invalid region returns `undefined` (dropped, same as unknown blocks); `upcomingLimit ?? 6`, `limit ?? 12`.

- [ ] **Step 5: PASS + gates + commit**

```bash
git add payload/blocks payload/fields/regions.ts payload/collections/regional-communities.ts lib/content/internal/payload/blocks.ts lib/__tests__/payload-new-auto-blocks.test.ts
git commit -m "feat(cms): events calendar, people, region map and atlas become sections"
```

---

### Task 4: Content feed — kinds and the pure engine

**Files:**
- Modify: `lib/cards/type-style.ts` (add the `agenda` kind), `messages/{en,es,fr,ar}.json` (its label, next to the other `labelKey`s — find their namespace with `grep -rn '"researchOutput"' messages/en.json`)
- Create: `lib/content/feeds/types.ts`, `lib/content/feeds/engine.ts`
- Test: `lib/__tests__/content-feed-engine.test.ts`

**Interfaces:**
- Produces:

```ts
// lib/content/feeds/types.ts
export const FEED_KINDS = ["caseStudies", "newsPosts", "events", "livedExperiences", "researchOutputs", "agendas"] as const;
export type FeedKind = (typeof FEED_KINDS)[number];
export type FeedFill = "automatic" | "automaticWithPicks" | "picksOnly";
export type FeedSort = "newest" | "featuredFirst" | "upcomingSoonest" | "myOrder";
export type FeedLayout = "grid" | "carousel" | "list";
export interface FeedPick { kind: FeedKind; id: string }
export interface FeedFilters { regions: string[]; communityIds: string[]; tagIds: string[]; featuredOnly: boolean; upcomingOnly: boolean }
export interface FeedSettings {
  kinds: FeedKind[]; fill: FeedFill; picks: FeedPick[]; filters: FeedFilters;
  sort: FeedSort; count: number; layout: FeedLayout;
  heading: string | null; intro: string | null;
  viewAll: { show: boolean; href: string | null; label: string | null };
}
export interface FeedContext { locale: "en" | "es" | "fr" | "ar"; communityId?: string | null; now?: Date }
/** A card plus what the engine needs to sort it; `key` is `${kind}:${id}`. */
export interface FeedCard { key: string; kind: FeedKind; featured: boolean; date: string | null; startAt: string | null; card: import("@/lib/cards/type-style").TypedCardItem }
export interface FeedResult { items: import("@/lib/cards/type-style").TypedCardItem[]; skipped: Array<{ pick: FeedPick; reason: "unpublished" }> }
export const KIND_HAS_FEATURED: Record<FeedKind, boolean> = { caseStudies: true, newsPosts: true, events: false, livedExperiences: true, researchOutputs: true, agendas: true };
export const KIND_LISTING: Record<FeedKind, string> = {
  caseStudies: "/research-and-action/case-studies", newsPosts: "/news", events: "/collaborate/events",
  livedExperiences: "/lived-experiences", researchOutputs: "/research-and-action/research-outputs", agendas: "/research-and-action/agendas",
};
```

```ts
// lib/content/feeds/engine.ts (pure — no I/O)
export function normalizeFeedSettings(raw: unknown): FeedSettings;
export function kindsToQuery(settings: FeedSettings): FeedKind[];             // drops events when featuredOnly
export function sortCards(cards: FeedCard[], sort: FeedSort, now: Date): FeedCard[];
export function mergeFeed(args: { settings: FeedSettings; pickedCards: Map<string, FeedCard>; automatic: FeedCard[]; now: Date }): FeedResult;
export function viewAllLink(settings: FeedSettings, locale: string): { href: string; labelKey: string | null; label: string | null } | null;
```

(Verify the listing routes in `KIND_LISTING` against `app/[locale]/(main)` before committing; correct any that differ.)

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/content-feed-engine.test.ts
import { describe, expect, it } from "vitest";
import { normalizeFeedSettings, kindsToQuery, sortCards, mergeFeed, viewAllLink } from "@/lib/content/feeds/engine";
import type { FeedCard } from "@/lib/content/feeds/types";

const NOW = new Date("2026-09-28T12:00:00Z");
const c = (kind: FeedCard["kind"], id: string, over: Partial<FeedCard> = {}): FeedCard => ({
  key: `${kind}:${id}`, kind, featured: false, date: "2026-09-01T00:00:00Z", startAt: null,
  card: { type: "caseStudy", id, title: id, href: `/x/${id}` }, ...over,
});
const base = normalizeFeedSettings({ kinds: ["caseStudies"] });

describe("normalizeFeedSettings", () => {
  it("fills safe defaults", () => {
    expect(base).toMatchObject({ fill: "automatic", sort: "newest", count: 6, layout: "grid", viewAll: { show: true } });
  });
  it("clamps count to 1–24 and drops unknown kinds and region codes", () => {
    const s = normalizeFeedSettings({ kinds: ["caseStudies", "nope"], count: 99, filters: { regions: ["ssa", "atlantis"] } });
    expect(s.kinds).toEqual(["caseStudies"]);
    expect(s.count).toBe(24);
    expect(s.filters.regions).toEqual(["ssa"]);
  });
  it("defaults kinds to case studies when none are valid", () => {
    expect(normalizeFeedSettings({ kinds: [] }).kinds).toEqual(["caseStudies"]);
  });
});

describe("kindsToQuery", () => {
  it("excludes events when 'featured only' is on (events have no featured flag)", () => {
    expect(kindsToQuery(normalizeFeedSettings({ kinds: ["events", "newsPosts"], filters: { featuredOnly: true } }))).toEqual(["newsPosts"]);
  });
});

describe("sortCards", () => {
  const a = c("newsPosts", "a", { date: "2026-09-10T00:00:00Z" });
  const b = c("newsPosts", "b", { date: "2026-09-20T00:00:00Z", featured: true });
  const e = c("events", "e", { date: null, startAt: "2026-10-01T00:00:00Z" });
  const past = c("events", "p", { date: null, startAt: "2026-09-01T00:00:00Z" });
  it("newest first, events by start date", () => {
    expect(sortCards([a, b, e], "newest", NOW).map((x) => x.key)).toEqual(["events:e", "newsPosts:b", "newsPosts:a"]);
  });
  it("featured first, then newest", () => {
    expect(sortCards([e, a, b], "featuredFirst", NOW).map((x) => x.key)).toEqual(["newsPosts:b", "events:e", "newsPosts:a"]);
  });
  it("soonest upcoming events first, then the rest newest first", () => {
    expect(sortCards([a, past, b, e], "upcomingSoonest", NOW).map((x) => x.key)).toEqual(["events:e", "newsPosts:b", "newsPosts:a", "events:p"]);
  });
});

describe("mergeFeed", () => {
  const auto = [c("caseStudies", "1"), c("caseStudies", "2"), c("caseStudies", "3")];
  const picked = new Map([["caseStudies:2", c("caseStudies", "2")], ["newsPosts:9", c("newsPosts", "9")]]);
  const settingsWith = (over: object) => normalizeFeedSettings({ kinds: ["caseStudies", "newsPosts"], count: 3, ...over });

  it("automatic ignores picks", () => {
    expect(mergeFeed({ settings: settingsWith({ fill: "automatic", picks: [{ kind: "newsPosts", id: "9" }] }), pickedCards: picked, automatic: auto, now: NOW }).items.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });
  it("automatic with picks puts picks first and never repeats an item", () => {
    const r = mergeFeed({ settings: settingsWith({ fill: "automaticWithPicks", picks: [{ kind: "newsPosts", id: "9" }, { kind: "caseStudies", id: "2" }] }), pickedCards: picked, automatic: auto, now: NOW });
    expect(r.items.map((i) => i.id)).toEqual(["9", "2", "1"]);
  });
  it("only picks keeps the editor's order with 'my order'", () => {
    const r = mergeFeed({ settings: settingsWith({ fill: "picksOnly", sort: "myOrder", picks: [{ kind: "caseStudies", id: "2" }, { kind: "newsPosts", id: "9" }] }), pickedCards: picked, automatic: [], now: NOW });
    expect(r.items.map((i) => i.id)).toEqual(["2", "9"]);
  });
  it("skips picks that are unpublished or deleted, and reports them", () => {
    const r = mergeFeed({ settings: settingsWith({ fill: "picksOnly", picks: [{ kind: "caseStudies", id: "gone" }, { kind: "newsPosts", id: "9" }] }), pickedCards: picked, automatic: [], now: NOW });
    expect(r.items.map((i) => i.id)).toEqual(["9"]);
    expect(r.skipped).toEqual([{ pick: { kind: "caseStudies", id: "gone" }, reason: "unpublished" }]);
  });
  it("an empty result is an empty list", () => {
    expect(mergeFeed({ settings: settingsWith({ fill: "picksOnly", picks: [] }), pickedCards: new Map(), automatic: [], now: NOW }).items).toEqual([]);
  });
});

describe("viewAllLink", () => {
  it("links to the kind's listing when exactly one kind is shown", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts"] }), "fr")).toEqual({ href: "/fr/news", labelKey: "feed.viewAll.newsPosts", label: null });
  });
  it("needs both an editor link and label for a mixed feed", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts", "events"] }), "en")).toBeNull();
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts", "events"], viewAll: { show: true, href: "/en/atlas", label: "See all" } }), "en")).toEqual({ href: "/en/atlas", labelKey: null, label: "See all" });
  });
  it("respects 'show a View all link' off", () => {
    expect(viewAllLink(normalizeFeedSettings({ kinds: ["newsPosts"], viewAll: { show: false } }), "en")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement.** Add `"agenda"` to `TypedCardType` and `TYPE_STYLE` (`{ color: "#5B6C8F", labelKey: "agenda" }`) and its label in all four locales ("Agenda" / "Agenda" / "Agenda" / "أجندة") beside the other type labels. Then `types.ts` exactly as above and `engine.ts`:

```ts
import { FEED_KINDS, KIND_HAS_FEATURED, KIND_LISTING, type FeedCard, type FeedKind, type FeedResult, type FeedSettings, type FeedSort } from "@/lib/content/feeds/types";
import { isRegionCode } from "@/lib/maps/region-codes";

const clamp = (n: unknown, lo: number, hi: number, dflt: number) => (typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt);
const strs = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0) : []);
const oneOf = <T extends string>(v: unknown, all: readonly T[], dflt: T): T => (all.includes(v as T) ? (v as T) : dflt);

export function normalizeFeedSettings(raw: unknown): FeedSettings {
  const r = (raw ?? {}) as Record<string, any>;
  const kinds = strs(r.kinds).filter((k): k is FeedKind => (FEED_KINDS as readonly string[]).includes(k));
  const f = (r.filters ?? {}) as Record<string, unknown>;
  const v = (r.viewAll ?? {}) as Record<string, unknown>;
  return {
    kinds: kinds.length ? kinds : ["caseStudies"],
    fill: oneOf(r.fill, ["automatic", "automaticWithPicks", "picksOnly"] as const, "automatic"),
    picks: (Array.isArray(r.picks) ? r.picks : [])
      .filter((p: any) => p && (FEED_KINDS as readonly string[]).includes(p.kind) && typeof p.id === "string")
      .map((p: any) => ({ kind: p.kind as FeedKind, id: p.id })),
    filters: {
      regions: strs(f.regions).filter((code) => isRegionCode(code)),
      communityIds: strs(f.communityIds),
      tagIds: strs(f.tagIds),
      featuredOnly: f.featuredOnly === true,
      upcomingOnly: f.upcomingOnly === true,
    },
    sort: oneOf(r.sort, ["newest", "featuredFirst", "upcomingSoonest", "myOrder"] as const, "newest"),
    count: clamp(r.count, 1, 24, 6),
    layout: oneOf(r.layout, ["grid", "carousel", "list"] as const, "grid"),
    heading: typeof r.heading === "string" && r.heading.trim() ? r.heading : null,
    intro: typeof r.intro === "string" && r.intro.trim() ? r.intro : null,
    viewAll: { show: v.show !== false, href: typeof v.href === "string" && v.href ? v.href : null, label: typeof v.label === "string" && v.label ? v.label : null },
  };
}

export function kindsToQuery(s: FeedSettings): FeedKind[] {
  return s.filters.featuredOnly ? s.kinds.filter((k) => KIND_HAS_FEATURED[k]) : s.kinds;
}

const when = (x: FeedCard) => x.startAt ?? x.date ?? "";
const newest = (a: FeedCard, b: FeedCard) => when(b).localeCompare(when(a)) || a.key.localeCompare(b.key);

export function sortCards(cards: FeedCard[], sort: FeedSort, now: Date): FeedCard[] {
  const list = [...cards];
  if (sort === "featuredFirst") return list.sort((a, b) => Number(b.featured) - Number(a.featured) || newest(a, b));
  if (sort === "upcomingSoonest") {
    const t = now.toISOString();
    const upcoming = list.filter((x) => x.startAt && x.startAt >= t).sort((a, b) => a.startAt!.localeCompare(b.startAt!));
    const rest = list.filter((x) => !(x.startAt && x.startAt >= t)).sort(newest);
    return [...upcoming, ...rest];
  }
  return list.sort(newest);
}

export function mergeFeed({ settings, pickedCards, automatic, now }: { settings: FeedSettings; pickedCards: Map<string, FeedCard>; automatic: FeedCard[]; now: Date }): FeedResult {
  const skipped: FeedResult["skipped"] = [];
  const picks: FeedCard[] = [];
  if (settings.fill !== "automatic") {
    for (const pick of settings.picks) {
      const card = pickedCards.get(`${pick.kind}:${pick.id}`);
      if (card) picks.push(card);
      else skipped.push({ pick, reason: "unpublished" });
    }
  }
  const ordered = settings.fill === "picksOnly" && settings.sort !== "myOrder" ? sortCards(picks, settings.sort, now) : picks;
  const seen = new Set<string>();
  const out: FeedCard[] = [];
  const add = (x: FeedCard) => { if (!seen.has(x.key) && out.length < settings.count) { seen.add(x.key); out.push(x); } };
  ordered.forEach(add);
  if (settings.fill !== "picksOnly") sortCards(automatic, settings.sort === "myOrder" ? "newest" : settings.sort, now).forEach(add);
  return { items: out.map((x) => x.card), skipped };
}

export function viewAllLink(s: FeedSettings, locale: string) {
  if (!s.viewAll.show) return null;
  if (s.kinds.length === 1) return { href: `/${locale}${KIND_LISTING[s.kinds[0]]}`, labelKey: `feed.viewAll.${s.kinds[0]}`, label: null };
  if (s.viewAll.href && s.viewAll.label) return { href: s.viewAll.href, labelKey: null, label: s.viewAll.label };
  return null;
}
```

(If `sortCards` newest case in the test expects `events:e` first because its `startAt` 2026-10-01 is later than 2026-09-20 — yes, `when()` uses `startAt` for events.)

- [ ] **Step 4: PASS + gates + commit**

```bash
git add lib/cards/type-style.ts lib/content/feeds messages lib/__tests__/content-feed-engine.test.ts
git commit -m "feat(feeds): a content feed engine — automatic, picks first, or only picks — with safe defaults"
```

---

### Task 5: Content feed — data, section, and rendering

**Files:**
- Create: `lib/content/internal/payload/feeds.ts` (server: per-kind queries → `FeedCard`), `lib/content/feeds/resolve.ts` (server: `resolveContentFeed`), `payload/blocks/content-feed.ts`, `components/blocks/content-feed.tsx`
- Modify: `payload/blocks/index.ts`, `lib/content/internal/payload/blocks.ts` (`mapBlock` case → `_type "content-feed"` carrying the raw settings), `components/blocks/index.tsx` (registry key `"content-feed"`), `messages/{en,es,fr,ar}.json` (`feed.viewAll.<kind>` labels)
- Test: `lib/__tests__/content-feed-resolve.test.ts`, `lib/__tests__/content-feed-block.test.tsx`

**Interfaces:**
- Consumes: Task 4 engine + types; `query` from `lib/content/internal/payload-source.ts` (cached, published perspective), `MODERATION` rules and `and` from `lib/content/internal/payload/system.ts` (export them if not already exported); the image/text helpers `system.ts` imports (`text`, `localized`, `isoDate`, `imageUrl`, `blurDataURL`) from the same modules.
- Produces:
  - `fetchFeedCards(kinds: FeedKind[], filters: FeedFilters, ctx: FeedContext, limit: number): Promise<FeedCard[]>` and `fetchPickedCards(picks: FeedPick[], ctx: FeedContext): Promise<Map<string, FeedCard>>` in `lib/content/internal/payload/feeds.ts`.
  - `resolveContentFeed(raw: unknown, ctx: FeedContext): Promise<FeedResult>` in `lib/content/feeds/resolve.ts` (Payload-only: on the Sanity backend returns `{ items: [], skipped: [] }` and `console.warn`s once).
  - Block `contentFeed` (slug `"contentFeed"`), component `ContentFeed(props: { settings: unknown; communityId?: string | null; locale: string; isRTL?: boolean })`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/content-feed-resolve.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d) }));
vi.mock("@/lib/content/internal/backend", () => ({ activeBackend: () => "payload" }));

import { resolveContentFeed } from "@/lib/content/feeds/resolve";

const row = (id: string, over: Record<string, unknown> = {}) => ({ id, slug: `s-${id}`, title: { en: `T ${id}` }, publishedAt: "2026-09-01T00:00:00Z", featured: false, ...over });

beforeEach(() => query.mockReset());

describe("resolveContentFeed", () => {
  it("queries only published, approved rows and turns them into cards", async () => {
    query.mockResolvedValue({ docs: [row("1"), row("2")] });
    const r = await resolveContentFeed({ kinds: ["caseStudies"] }, { locale: "en" });
    expect(r.items.map((i) => i.title)).toEqual(["T 1", "T 2"]);
    const where = JSON.stringify(query.mock.calls[0][0].where);
    expect(where).toContain('"_status":{"equals":"published"}');
    expect(where).toContain("moderationStatus");
  });

  it("uses this community by default on a community page", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["newsPosts"] }, { locale: "en", communityId: "c-9" });
    expect(JSON.stringify(query.mock.calls[0][0].where)).toContain("c-9");
  });

  it("drops a pick the published query didn't return and reports it", async () => {
    query.mockResolvedValueOnce({ docs: [row("9")] }); // picked newsPosts by id
    const r = await resolveContentFeed({ kinds: ["newsPosts"], fill: "picksOnly", picks: [{ kind: "newsPosts", id: "9" }, { kind: "newsPosts", id: "gone" }] }, { locale: "en" });
    expect(r.items.map((i) => i.id)).toEqual(["9"]);
    expect(r.skipped).toEqual([{ pick: { kind: "newsPosts", id: "gone" }, reason: "unpublished" }]);
  });

  it("never sends a region the database would refuse", async () => {
    query.mockResolvedValue({ docs: [] });
    await resolveContentFeed({ kinds: ["caseStudies"], filters: { regions: ["ssa", "atlantis"] } }, { locale: "en" });
    const where = JSON.stringify(query.mock.calls[0][0].where);
    expect(where).toContain("ssa");
    expect(where).not.toContain("atlantis");
  });
});
```

```tsx
// lib/__tests__/content-feed-block.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { contentFeed } from "@/payload/blocks/content-feed";

describe("content feed section (admin)", () => {
  const fields = contentFeed.fields as Array<{ name?: string; admin?: { description?: string; condition?: unknown } ; options?: Array<{ value: string; label: string }> }>;
  it("is named and grouped", () => {
    expect([contentFeed.slug, contentFeed.labels?.singular, contentFeed.admin?.group]).toEqual(["contentFeed", "Content feed", "Content"]);
  });
  it("offers the three plain fill choices", () => {
    expect(fields.find((f) => f.name === "fill")?.options).toEqual([
      { value: "automatic", label: "Automatic — newest items that match" },
      { value: "automaticWithPicks", label: "Automatic, with my picks first" },
      { value: "picksOnly", label: "Only the items I pick" },
    ]);
  });
  it("shows picks only when they're used", () => {
    const picks = fields.find((f) => f.name === "picks");
    const condition = picks?.admin?.condition as (d: unknown, s: { fill?: string }) => boolean;
    expect(condition({}, { fill: "automatic" })).toBe(false);
    expect(condition({}, { fill: "picksOnly" })).toBe(true);
  });
  it("tells editors events have no featured flag", () => {
    const filters = fields.find((f) => f.name === "filters") as unknown as { fields: Array<{ name: string; admin?: { description?: string } }> };
    expect(filters.fields.find((f) => f.name === "featuredOnly")?.admin?.description).toBe("Events have no featured flag, so they won't appear when this is on.");
  });
});
```

- [ ] **Step 2: Run both — expect FAIL.**

- [ ] **Step 3: `lib/content/internal/payload/feeds.ts`** — one config row per kind, then the two fetchers:

```ts
import "server-only";
import { query } from "@/lib/content/internal/payload-source";
import type { FeedCard, FeedContext, FeedFilters, FeedKind, FeedPick } from "@/lib/content/feeds/types";
// + text, localized, isoDate, imageUrl, blurDataURL, and, MODERATION — import from the same modules system.ts uses

type Kind = {
  collection: string; card: import("@/lib/cards/type-style").TypedCardType; href: (slug: string) => string;
  moderation: keyof typeof MODERATION; drafts: boolean; date: string; featured: boolean;
  region: string | null; community: { field: string; many: boolean } | null; tags: string | null; image: string | null;
};
const KINDS: Record<FeedKind, Kind> = {
  caseStudies:      { collection: "caseStudies", card: "caseStudy", href: (s) => `/research-and-action/case-studies/${s}`, moderation: "approved", drafts: true, date: "publishedAt", featured: true, region: "region", community: { field: "relatedCommunity", many: false }, tags: "tags", image: "image" },
  newsPosts:        { collection: "newsPosts", card: "newsPost", href: (s) => `/news/${s}`, moderation: "none", drafts: true, date: "publishedAt", featured: true, region: "region", community: { field: "relatedCommunity", many: false }, tags: "tags", image: "image" },
  livedExperiences: { collection: "livedExperiences", card: "livedExperience", href: (s) => `/lived-experiences/${s}`, moderation: "approved-or-unset", drafts: true, date: "publishedAt", featured: true, region: "region", community: { field: "relatedCommunity", many: false }, tags: "tags", image: null },
  researchOutputs:  { collection: "researchOutputs", card: "researchOutput", href: (s) => `/research-and-action/research-outputs/${s}`, moderation: "approved", drafts: false, date: "publishDate", featured: true, region: "region", community: { field: "relatedCommunities", many: true }, tags: "tags", image: "coverImage" },
  events:           { collection: "events", card: "event", href: (s) => `/collaborate/events/${s}`, moderation: "approved", drafts: false, date: "startAt", featured: false, region: null, community: { field: "relatedCommunity", many: false }, tags: null, image: "image" },
  agendas:          { collection: "agendas", card: "agenda", href: (s) => `/research-and-action/agendas/${s}`, moderation: "none", drafts: false, date: "publishDate", featured: true, region: null, community: { field: "regionalCommunities", many: true }, tags: "tags", image: "image" },
};
```

(Verify each field name against its collection file before committing — the facts table says events have no `tags`/`featured`/`region` and agendas no `region`; the event `image` and href paths must match the collection and routes. Correct the table where the collection differs.)

`whereFor(kind, filters, ctx)` builds `and(MODERATION[k.moderation], k.drafts ? { _status: { equals: "published" } } : undefined, { slug: { exists: true } }, regions && k.region ? { [k.region]: { in: regions } } : undefined, communityIds.length || ctx.communityId ? { [k.community.field]: { in: communityIds.length ? communityIds : [ctx.communityId] } } : undefined, tagIds.length && k.tags ? { [k.tags]: { in: tagIds } } : undefined, filters.featuredOnly && k.featured ? { featured: { equals: true } } : undefined, filters.upcomingOnly && kind === "events" ? { startAt: { greater_than_equal: (ctx.now ?? new Date()).toISOString() } } : undefined)`. A kind without a region field is skipped entirely when region filters are set (it can't match a region). `fetchFeedCards` runs one `query({ type: "find", collection, where, locale: ctx.locale, depth: 1, limit, sort: `-${k.date}` })` per kind in parallel and maps each row to `FeedCard` `{ key: `${kind}:${id}`, kind, featured: !!row.featured, date: kind === "events" ? null : isoDate(row[k.date]), startAt: kind === "events" ? isoDate(row.startAt) : null, card: { type: k.card, id, title: text(localized(row.title)?.[ctx.locale]) ?? text(localized(row.title)?.en) ?? text(row.title) ?? "", href: `/${ctx.locale}${k.href(slug)}`, excerpt, image: imageUrl(img, { width: 800 }) || null, imageLqip: blurDataURL(img) ?? null, date, event: kind === "events" ? { startAt } : undefined, quote: kind === "livedExperiences" } }`. `fetchPickedCards` groups picks by kind and queries `{ id: { in: ids } }` AND the same published/approved conditions (no other filters), returning a `Map` keyed `kind:id`.

- [ ] **Step 4: `lib/content/feeds/resolve.ts`**

```ts
import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { fetchFeedCards, fetchPickedCards } from "@/lib/content/internal/payload/feeds";
import { kindsToQuery, mergeFeed, normalizeFeedSettings } from "@/lib/content/feeds/engine";
import type { FeedContext, FeedResult } from "@/lib/content/feeds/types";

let warned = false;
export async function resolveContentFeed(raw: unknown, ctx: FeedContext): Promise<FeedResult> {
  if (activeBackend() !== "payload") {
    if (!warned) { warned = true; console.warn("[content-feed] only available on the Payload backend"); }
    return { items: [], skipped: [] };
  }
  const settings = normalizeFeedSettings(raw);
  const now = ctx.now ?? new Date();
  const [automatic, pickedCards] = await Promise.all([
    settings.fill === "picksOnly" ? Promise.resolve([]) : fetchFeedCards(kindsToQuery(settings), settings.filters, { ...ctx, now }, settings.count * 2),
    settings.fill === "automatic" ? Promise.resolve(new Map()) : fetchPickedCards(settings.picks, ctx),
  ]);
  return mergeFeed({ settings, pickedCards, automatic, now });
}
```

- [ ] **Step 5: `payload/blocks/content-feed.ts`** — fields exactly per spec §3.2 and Global Constraints:

```ts
import type { Block } from "payload";
import { localizedText, localizedTextarea } from "@/payload/fields/localized";
import { pickerAdmin } from "@/payload/blocks/picker";
import { REGION_OPTIONS } from "@/payload/fields/regions";

const KIND_OPTIONS = [
  { value: "caseStudies", label: "Case studies" }, { value: "newsPosts", label: "News" }, { value: "events", label: "Events" },
  { value: "livedExperiences", label: "Lived experiences" }, { value: "researchOutputs", label: "Research outputs" }, { value: "agendas", label: "Agendas" },
];
const hasEvents = (_: unknown, s: { kinds?: string[] }) => (s?.kinds ?? []).includes("events");

export const contentFeed: Block = {
  slug: "contentFeed",
  interfaceName: "ContentFeedBlock",
  labels: { singular: "Content feed", plural: "Content feeds" },
  admin: pickerAdmin("content-feed", "Content", "Cards of case studies, news, events and more — chosen automatically or by you"),
  fields: [
    localizedText("heading", { label: "Heading (optional)" }),
    localizedTextarea("intro", { label: "Intro (optional)" }),
    { name: "kinds", label: "What to show", type: "select", hasMany: true, required: true, defaultValue: ["caseStudies"], options: KIND_OPTIONS },
    { name: "fill", label: "How to fill it", type: "radio", defaultValue: "automatic", options: [
      { value: "automatic", label: "Automatic — newest items that match" },
      { value: "automaticWithPicks", label: "Automatic, with my picks first" },
      { value: "picksOnly", label: "Only the items I pick" },
    ] },
    { name: "picks", label: "My picks", type: "relationship", hasMany: true,
      relationTo: ["caseStudies", "newsPosts", "events", "livedExperiences", "researchOutputs", "agendas"],
      admin: { description: "Drag to set the order. Only published items can be shown.", condition: (_: unknown, s: { fill?: string }) => s?.fill === "automaticWithPicks" || s?.fill === "picksOnly" } },
    { name: "filters", label: "Filters (optional)", type: "group", admin: { description: "Leave empty to show everything that matches." }, fields: [
      { name: "regions", label: "Region", type: "select", hasMany: true, options: REGION_OPTIONS },
      { name: "communities", label: "Community", type: "relationship", relationTo: "regionalCommunities", hasMany: true },
      { name: "tags", label: "Themes and tags", type: "relationship", relationTo: "tags", hasMany: true },
      { name: "featuredOnly", label: "Featured only", type: "checkbox", admin: { description: "Events have no featured flag, so they won't appear when this is on." } },
      { name: "upcomingOnly", label: "Upcoming events only", type: "checkbox", admin: { condition: hasEvents } },
    ] },
    { name: "sort", label: "Order", type: "select", defaultValue: "newest", options: [
      { value: "newest", label: "Newest first" }, { value: "featuredFirst", label: "Featured first" },
      { value: "upcomingSoonest", label: "Soonest upcoming (events)" }, { value: "myOrder", label: "My order (only with 'Only the items I pick')" },
    ] },
    { name: "count", label: "How many", type: "number", min: 1, max: 24, defaultValue: 6 },
    { name: "layout", label: "Layout", type: "select", defaultValue: "grid", options: [
      { value: "grid", label: "Grid" }, { value: "carousel", label: "Carousel" }, { value: "list", label: "List" },
    ] },
    { name: "viewAll", label: "'View all' link", type: "group", fields: [
      { name: "show", label: "Show a View all link", type: "checkbox", defaultValue: true },
      { name: "href", label: "Link (needed when showing more than one kind)", type: "text" },
      localizedText("label", { label: "Link text (needed when showing more than one kind)" }),
    ] },
  ],
};
```

(Use Payload's collapsible for "Filters (optional)" if the group-in-collapsible layout reads better in the admin; keep the field names `filters.*` stable — the resolver reads them.) The `mapBlock` case normalises Payload's polymorphic relationship value `{ relationTo, value }` into `{ kind: relationTo, id: String(value?.id ?? value) }` and relationship arrays into id arrays, and emits `{ _type: "content-feed", _key, settings: { heading, intro, kinds, fill, picks, filters: { regions, communityIds, tagIds, featuredOnly, upcomingOnly }, sort, count, layout, viewAll: { show, href, label } } }`.

- [ ] **Step 6: `components/blocks/content-feed.tsx`** (async server component) — calls `resolveContentFeed(settings, { locale, communityId })`; returns `null` when `items` is empty; renders heading (`h2`, `font-heading text-2xl text-ccm-midnight`), intro, then:
- `grid`: `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` of `<TypedCard item variant="grid" />`;
- `carousel`: horizontal snap strip `flex snap-x snap-mandatory gap-4 overflow-x-auto` with `min-w-[80%] sm:min-w-[45%] lg:min-w-[30%] snap-start` items (same pattern FreshContent uses on mobile);
- `list`: `divide-y` of `<TypedCard variant="row" />`;
- then the `viewAllLink(...)` as a `min-h-11` link (label via `useTranslations("feed")` for `labelKey`, else the editor label).
Register `"content-feed": ContentFeed` in `components/blocks/index.tsx` (pass `settings`, `communityId` from the block props; the registry spreads block props, so the component takes `settings`).
Add messages `feed.viewAll.{caseStudies,newsPosts,events,livedExperiences,researchOutputs,agendas}` in all four locales (en: "All case studies", "All news", "All events", "All lived experiences", "All research outputs", "All agendas"; translate es/fr/ar in the same register as `forms.errors`).

- [ ] **Step 7: PASS + gates + commit**

```bash
git add lib/content/internal/payload/feeds.ts lib/content/internal/payload/system.ts lib/content/feeds payload/blocks components/blocks lib/content/internal/payload/blocks.ts messages lib/__tests__/content-feed-*.ts*
git commit -m "feat(feeds): a Content feed section — any mix of content, automatic or hand-picked, as grid, carousel or list"
```

---

### Task 6: Drafts for pages and the homepage; new sections on pages; one migration

**Files:**
- Modify: `payload/collections/pages.ts` (add the 11 new blocks to `blocks`; `versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 }`), `payload/globals/homepage.ts` (same `versions`), `lib/content/internal/payload/pages.ts` and `lib/content/internal/payload/homepage.ts` (published-only outside draft mode)
- Create: `migrations/<timestamp>_page_sections_and_drafts.ts` (+ `.json`, generated), update `migrations/index.ts`
- Test: `lib/__tests__/payload-pages-drafts.test.ts`

**Interfaces:**
- Consumes: all new blocks (Tasks 2, 3, 5).

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/payload-pages-drafts.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import config from "@/payload.config";

vi.mock("next/headers", () => ({ draftMode: async () => ({ isEnabled: false }) }));

describe("pages and homepage keep drafts private", () => {
  it("pages and the homepage have drafts", async () => {
    const c = await config;
    expect(c.collections.find((x) => x.slug === "pages")?.versions).toMatchObject({ drafts: expect.anything() });
    expect(c.globals.find((g) => g.slug === "homepage")?.versions).toMatchObject({ drafts: expect.anything() });
  });

  it("offers every new section on pages", async () => {
    const c = await config;
    const blocksField = c.collections.find((x) => x.slug === "pages")!.fields.find((f) => "name" in f && f.name === "blocks") as { blocks: Array<{ slug: string }> };
    expect(blocksField.blocks.map((b) => b.slug)).toEqual(expect.arrayContaining(["hero2", "faqs", "timelineRow", "carousel1", "contentFeed", "eventsCalendar", "peopleWidget", "regionMap", "atlasEmbed", "submitStoryBanner", "formNewsletter"]));
  });
});
```

Also extend the pages reader's existing test file (find it: `ls lib/__tests__ | grep -i "pages"`) with: **"a draft-only page is not found outside draft mode"** — mock the query layer so it returns nothing when the where contains `_status: published`, and assert the reader passes `_status: { equals: "published" }` when `draftMode` is off and omits it when on.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement.** Add the blocks to `pages.blocks` (keep the existing seven first, then the new ones in spec §3.1 order). Add `versions` to pages and the homepage global. In the two readers, when not in draft mode add `_status: { equals: "published" }` to the where (pages) / use `draft: false` + check `_status === "published"` for the global (a global has one row; outside draft mode, if the latest saved version isn't published, read the published version via `findGlobal` with `draft: false` — confirm the global's published read returns the published version, not the latest draft; add a test).

- [ ] **Step 4: Migration (DEV only).** `pnpm exec payload migrate:create page_sections_and_drafts`. Read the generated SQL: it may contain ONLY new block tables for pages (`pages_blocks_<new slugs>` and their locales/rels tables), the `_pages_v*` version tables, `_status`/`version_*` columns for pages and the homepage, and the homepage version tables. Append a backfill so existing documents stay published: `UPDATE "pages" SET "_status" = 'published' WHERE "_status" IS NULL;` and the same for the homepage table. Anything else (drops, renames, other tables) → delete the generated files and report BLOCKED. Prove the DB host is dev (`lucky-waterfall`), then `pnpm exec payload migrate`. Confirm `migrate:status` shows it ran.

- [ ] **Step 5: Verify on dev** — `pnpm dev`; `/admin` 200; the homepage and two existing pages (e.g. `/en/about`) still return 200 with their usual content (`curl -s localhost:3000/en/about | grep -c "<h1"` ≥ 1). Stop the server.

- [ ] **Step 6: Gates + commit**

```bash
git add payload/collections/pages.ts payload/globals/homepage.ts lib/content/internal/payload/pages.ts lib/content/internal/payload/homepage.ts migrations payload-types.ts lib/__tests__/payload-pages-drafts.test.ts "app/(payload)/admin/importMap.js"
git commit -m "feat(cms): pages and the homepage get drafts, and pages can use every new section"
```

---

### Task 7: The reusable Sections field (shared layout with a per-language opt-out)

**Files:**
- Create: `payload/fields/sections.ts`
- Test: `lib/__tests__/payload-sections-field.test.ts`

**Interfaces:**
- Consumes: `cloneFieldList` from `payload/fields/block-slot.ts`.
- Produces: `sectionsField(opts: { blocks: Block[]; required?: string[]; tablePrefix: string }): Field[]` returning `[layoutPerLanguage checkbox, sections (unlocalized blocks), sectionsByLanguage (localized blocks)]`; `requiredSectionsValidator(required: string[], labels: Record<string, string>)`. Not applied to any collection in this project.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/payload-sections-field.test.ts
import { describe, expect, it } from "vitest";
import type { Block } from "payload";
import { sectionsField, requiredSectionsValidator } from "@/payload/fields/sections";

const hero: Block = { slug: "hero1", labels: { singular: "Hero", plural: "Heroes" }, fields: [{ name: "title", type: "text", localized: true }] };
const map: Block = { slug: "atlasEmbed", labels: { singular: "Atlas", plural: "Atlases" }, fields: [{ name: "region", type: "text" }] };

describe("sectionsField", () => {
  const [toggle, shared, perLanguage] = sectionsField({ blocks: [hero, map], tablePrefix: "demo" }) as any[];

  it("has the opt-out switch, a shared list and a per-language list", () => {
    expect(toggle).toMatchObject({ name: "layoutPerLanguage", type: "checkbox", defaultValue: false, label: "This page has its own layout in each language" });
    expect(shared).toMatchObject({ name: "sections", type: "blocks" });
    expect(shared.localized).toBeFalsy();
    expect(perLanguage).toMatchObject({ name: "sectionsByLanguage", type: "blocks", localized: true });
  });

  it("shows exactly one list depending on the switch", () => {
    expect(shared.admin.condition({ layoutPerLanguage: false })).toBe(true);
    expect(perLanguage.admin.condition({ layoutPerLanguage: false })).toBe(false);
    expect(perLanguage.admin.condition({ layoutPerLanguage: true })).toBe(true);
  });

  it("gives each list its own copy of every block, with distinct table names", () => {
    expect(shared.blocks[0]).not.toBe(perLanguage.blocks[0]);
    expect(shared.blocks[0].dbName).toBe("demo_s_hero1");
    expect(perLanguage.blocks[0].dbName).toBe("demo_l_hero1");
  });

  it("keeps text translatable inside the shared list", () => {
    expect(shared.blocks[0].fields[0].localized).toBe(true);
  });
});

describe("required sections", () => {
  const validate = requiredSectionsValidator(["atlasEmbed"], { atlasEmbed: "Atlas" });
  it("refuses to save without a required section", () => {
    expect(validate([{ blockType: "hero1" }])).toBe("This page always keeps its Atlas. You can move it, but not remove it.");
  });
  it("accepts it anywhere in the list", () => {
    expect(validate([{ blockType: "hero1" }, { blockType: "atlasEmbed" }])).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement**

```ts
// payload/fields/sections.ts
import type { Block, BlocksField, CheckboxField, Field } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";

const copy = (block: Block, dbName: string): Block => ({ ...block, dbName, fields: cloneFieldList(block.fields) });

export function requiredSectionsValidator(required: string[], labels: Record<string, string>) {
  return (value: unknown): true | string => {
    const present = new Set((Array.isArray(value) ? value : []).map((b: any) => b?.blockType));
    const missing = required.find((slug) => !present.has(slug));
    return missing ? `This page always keeps its ${labels[missing] ?? missing}. You can move it, but not remove it.` : true;
  };
}

/** One section list shared by all languages (text translated), with a per-page switch to give each language its own list. */
export function sectionsField({ blocks, required = [], tablePrefix }: { blocks: Block[]; required?: string[]; tablePrefix: string }): Field[] {
  const labels = Object.fromEntries(blocks.map((b) => [b.slug, String(b.labels?.singular ?? b.slug)]));
  const validate = required.length ? requiredSectionsValidator(required, labels) : undefined;
  const toggle: CheckboxField = { name: "layoutPerLanguage", type: "checkbox", defaultValue: false, label: "This page has its own layout in each language" };
  const shared: BlocksField = {
    name: "sections", type: "blocks", label: "Sections",
    blocks: blocks.map((b) => copy(b, `${tablePrefix}_s_${b.slug}`)),
    admin: { condition: (data) => !data?.layoutPerLanguage },
    ...(validate ? { validate: (v: unknown) => validate(v) } : {}),
  };
  const perLanguage: BlocksField = {
    name: "sectionsByLanguage", type: "blocks", localized: true, label: "Sections (this language)",
    blocks: blocks.map((b) => copy(b, `${tablePrefix}_l_${b.slug}`)),
    admin: { condition: (data) => Boolean(data?.layoutPerLanguage) },
    ...(validate ? { validate: (v: unknown) => validate(v) } : {}),
  };
  return [toggle, shared, perLanguage];
}
```

(Payload's condition signature is `(data, siblingData)`; the test calls `condition(data)`.)

- [ ] **Step 4: PASS + gates + commit**

```bash
git add payload/fields/sections.ts lib/__tests__/payload-sections-field.test.ts
git commit -m "feat(cms): a reusable Sections field — one layout for every language, with a per-page switch"
```

---

### Task 8: Translation status on each section

**Files:**
- Create: `payload/components/translation-status.ts` (pure), `payload/components/section-row-label.tsx` (client)
- Modify: every block that has translatable text (`payload/blocks/*.ts` from Tasks 1–5): `admin.components.Label: "@/payload/components/section-row-label#SectionRowLabel"`
- Test: `lib/__tests__/translation-status.test.ts`

**Interfaces:**
- Produces: `translationStatus(block: unknown, locales: readonly string[]): Record<string, "complete" | "missing">` (pure); `SectionRowLabel` client component.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/translation-status.test.ts
import { describe, expect, it } from "vitest";
import { translationStatus } from "@/payload/components/translation-status";

const L = ["en", "es", "fr", "ar"] as const;

describe("translationStatus", () => {
  it("marks a language missing when any translatable text lacks it", () => {
    const block = { blockType: "hero1", title: { en: "Hi", es: "Hola", fr: "", ar: null }, body: { en: "x", es: "y", fr: "z", ar: "w" } };
    expect(translationStatus(block, L)).toEqual({ en: "complete", es: "complete", fr: "missing", ar: "missing" });
  });
  it("looks inside nested lists", () => {
    const block = { faqs: [{ title: { en: "Q", es: "P", fr: "Q", ar: "س" } }, { title: { en: "Q2", es: "", fr: "Q2", ar: "س" } }] };
    expect(translationStatus(block, L)).toEqual({ en: "complete", es: "missing", fr: "complete", ar: "complete" });
  });
  it("a section with no translatable text is complete everywhere", () => {
    expect(translationStatus({ region: "ssa" }, L)).toEqual({ en: "complete", es: "complete", fr: "complete", ar: "complete" });
  });
  it("ignores values whose English is empty (nothing to translate)", () => {
    expect(translationStatus({ title: { en: "", es: "" } }, L).es).toBe("complete");
  });
});
```

- [ ] **Step 2: FAIL. Step 3: Implement the pure function**

```ts
// payload/components/translation-status.ts — pure: no imports from lib/content or next/headers
const LOCALE_KEYS = ["en", "es", "fr", "ar"];
const isLocaleMap = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LOCALE_KEYS.includes(k));
const filled = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : v != null && !(Array.isArray(v) && v.length === 0));

export function translationStatus(block: unknown, locales: readonly string[]): Record<string, "complete" | "missing"> {
  const status = Object.fromEntries(locales.map((l) => [l, "complete"])) as Record<string, "complete" | "missing">;
  const walk = (v: unknown) => {
    if (isLocaleMap(v)) {
      if (!filled(v.en)) return;
      for (const l of locales) if (!filled(v[l])) status[l] = "missing";
      return;
    }
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(block);
  return status;
}
```

- [ ] **Step 4: The row label** — `payload/components/section-row-label.tsx` (`"use client"`; imports only `react`, `@payloadcms/ui` hooks, and `./translation-status`):
  - `useRowLabel()` for the block's index/path and `blockType`; `useDocumentInfo()` for `id`, `collectionSlug` / `globalSlug`.
  - Fetch once per document (module-level `Map` cache keyed by `${slug}:${id}:${updatedAt}`): `GET /payload-api/{collections/<slug>/<id> | globals/<slug>}?locale=all&depth=0&draft=true`.
  - Find the block by the row's `id` in the fetched `sections`/`sectionsByLanguage`/`blocks` arrays; show `"{label} · EN ✓ · ES missing · FR ✓ · AR missing"` (✓ for complete, the word "missing" for missing; `aria-label` spells it out). New unsaved sections show just the label.
  - Never throws: any fetch error shows just the label.
  Register it on each block with text via `admin.components.Label`. Run `pnpm exec payload generate:importmap`.

- [ ] **Step 5: PASS + gates + admin 200 check + commit**

```bash
git add payload/components/translation-status.ts payload/components/section-row-label.tsx payload/blocks "app/(payload)/admin/importMap.js" lib/__tests__/translation-status.test.ts
git commit -m "feat(cms): every section shows which languages are still missing"
```

---

### Task 9: "What will show now" for content feeds

**Files:**
- Create: `app/api/admin/feed-preview/route.ts`, `payload/components/feed-preview.tsx` (client)
- Modify: `payload/blocks/content-feed.ts` (add a `ui` field `whatWillShow` with `admin.components.Field: "@/payload/components/feed-preview#FeedPreview"`)
- Test: `lib/__tests__/feed-preview-route.test.ts`

**Interfaces:**
- Consumes: `resolveContentFeed` (Task 5), `getActor`/`isStaff` (`lib/authz`, `lib/authz-core`).
- Produces: `POST /api/admin/feed-preview` body `{ settings: unknown; locale?: string; communityId?: string | null }` → 200 `{ items: Array<{ title, kind, href }>, skipped: Array<{ kind, id }> }` | 403.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/feed-preview-route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
const actor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
vi.mock("@/lib/authz-core", () => ({ isStaff: (a: { role?: string } | null) => a?.role === "admin" }));
const resolve = vi.fn();
vi.mock("@/lib/content/feeds/resolve", () => ({ resolveContentFeed: (s: unknown, c: unknown) => resolve(s, c) }));
import { POST } from "@/app/api/admin/feed-preview/route";

const req = (body: unknown) => new Request("http://x/api/admin/feed-preview", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

beforeEach(() => { actor.mockReset(); resolve.mockReset(); });

describe("feed preview", () => {
  it("is staff only", async () => {
    actor.mockResolvedValue({ role: "member" });
    expect((await POST(req({ settings: {} }) as never)).status).toBe(403);
  });
  it("returns titles, kinds and skipped picks for staff", async () => {
    actor.mockResolvedValue({ role: "admin" });
    resolve.mockResolvedValue({ items: [{ type: "newsPost", id: "1", title: "A", href: "/en/news/a" }], skipped: [{ pick: { kind: "caseStudies", id: "x" }, reason: "unpublished" }] });
    const res = await POST(req({ settings: { kinds: ["newsPosts"] }, locale: "en" }) as never);
    expect(await res.json()).toEqual({ items: [{ title: "A", kind: "newsPost", href: "/en/news/a" }], skipped: [{ kind: "caseStudies", id: "x" }] });
  });
  it("answers a plain error instead of crashing", async () => {
    actor.mockResolvedValue({ role: "admin" });
    resolve.mockRejectedValue(new Error("db down"));
    const res = await POST(req({ settings: {} }) as never);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Couldn't load the preview. Try again in a moment." });
  });
});
```

- [ ] **Step 2: FAIL. Step 3: Route**

```ts
// app/api/admin/feed-preview/route.ts
import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { isStaff } from "@/lib/authz-core";
import { resolveContentFeed } from "@/lib/content/feeds/resolve";

const LOCALES = ["en", "es", "fr", "ar"] as const;

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  try {
    const body = (await request.json().catch(() => ({}))) as { settings?: unknown; locale?: string; communityId?: string | null };
    const locale = (LOCALES as readonly string[]).includes(body.locale ?? "") ? (body.locale as (typeof LOCALES)[number]) : "en";
    const result = await resolveContentFeed(body.settings, { locale, communityId: body.communityId ?? null });
    return NextResponse.json({
      items: result.items.map((i) => ({ title: i.title, kind: i.type, href: i.href })),
      skipped: result.skipped.map((s) => ({ kind: s.pick.kind, id: s.pick.id })),
    });
  } catch {
    return NextResponse.json({ error: "Couldn't load the preview. Try again in a moment." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Admin panel** — `payload/components/feed-preview.tsx` (`"use client"`; imports only `react` and `@payloadcms/ui`): read the sibling feed fields with `useFormFields` using the ui field's `path` parent; debounce 500 ms; `POST /api/admin/feed-preview` with the current values normalised the same way `mapBlock` does (relationship `{relationTo, value}` → `{kind, id}`); render a compact list "Showing now:" with each title + kind + an "Open" link; "Not shown (unpublished): …"; empty → "Nothing matches — try fewer filters."; error → the server sentence. Add the `ui` field to `contentFeed` at the end; `pnpm exec payload generate:importmap`.

- [ ] **Step 5: PASS + gates + admin 200 + commit**

```bash
git add app/api/admin/feed-preview payload/components/feed-preview.tsx payload/blocks/content-feed.ts "app/(payload)/admin/importMap.js" lib/__tests__/feed-preview-route.test.ts
git commit -m "feat(cms): each content feed shows what will appear right now"
```

---

### Task 10: Live preview

**Files:**
- Modify: `package.json` / `pnpm-lock.yaml` (`pnpm add @payloadcms/live-preview-react@3.88.0`), `payload/collections/pages.ts`, `payload/globals/homepage.ts` (`admin.livePreview`), `app/[locale]/(main)/layout.tsx` (mount the refresher in draft mode)
- Create: `app/api/preview/route.ts`, `components/preview/refresh-on-save.tsx`, `lib/preview/safe-path.ts`
- Test: `lib/__tests__/preview-route.test.ts`

**Interfaces:**
- Produces: `GET /api/preview?path=/<locale>/<slug>` → staff: enables draft mode and redirects to `path`; non-staff: 403; unsafe path: 400. `safePreviewPath(raw: string | null): string | null`.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/preview-route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
const actor = vi.fn();
const enable = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
vi.mock("@/lib/authz-core", () => ({ isStaff: (a: { role?: string } | null) => a?.role === "admin" }));
vi.mock("next/headers", () => ({ draftMode: async () => ({ enable }) }));
import { GET } from "@/app/api/preview/route";
import { safePreviewPath } from "@/lib/preview/safe-path";

const req = (path: string) => new Request(`http://hub.test/api/preview?path=${encodeURIComponent(path)}`);
beforeEach(() => { actor.mockReset(); enable.mockReset(); });

describe("safePreviewPath", () => {
  it("accepts site paths", () => { expect(safePreviewPath("/en/about")).toBe("/en/about"); });
  it("refuses protocol-relative and absolute paths", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "", null]) expect(safePreviewPath(bad as never)).toBeNull();
  });
});

describe("GET /api/preview", () => {
  it("is staff only", async () => {
    actor.mockResolvedValue(null);
    expect((await GET(req("/en/about") as never)).status).toBe(403);
    expect(enable).not.toHaveBeenCalled();
  });
  it("refuses unsafe paths even for staff", async () => {
    actor.mockResolvedValue({ role: "admin" });
    expect((await GET(req("//evil.com") as never)).status).toBe(400);
  });
  it("turns on draft mode and redirects staff to the page", async () => {
    actor.mockResolvedValue({ role: "admin" });
    const res = await GET(req("/fr/about") as never);
    expect(enable).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://hub.test/fr/about");
  });
});
```

- [ ] **Step 2: FAIL. Step 3: Implement**

```ts
// lib/preview/safe-path.ts
export function safePreviewPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\") || raw.includes("://")) return null;
  return raw;
}
```

```ts
// app/api/preview/route.ts
import { NextResponse } from "next/server";
import { draftMode } from "next/headers";
import { getActor } from "@/lib/authz";
import { isStaff } from "@/lib/authz-core";
import { safePreviewPath } from "@/lib/preview/safe-path";

export async function GET(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const path = safePreviewPath(new URL(request.url).searchParams.get("path"));
  if (!path) return NextResponse.json({ error: "Bad path" }, { status: 400 });
  (await draftMode()).enable();
  return NextResponse.redirect(new URL(path, request.url), 307);
}
```

`components/preview/refresh-on-save.tsx`:

```tsx
"use client";
import { RefreshRouteOnSave } from "@payloadcms/live-preview-react";
import { useRouter } from "next/navigation";

export function RefreshOnSave() {
  const router = useRouter();
  return <RefreshRouteOnSave refresh={() => router.refresh()} serverURL={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />;
}
```

In `app/[locale]/(main)/layout.tsx`, render `<RefreshOnSave />` only when `(await draftMode()).isEnabled`.

Live preview config on pages (and the homepage global with path `/${locale}`):

```ts
admin: {
  livePreview: {
    url: ({ data, locale }) => `${process.env.NEXT_PUBLIC_SITE_URL}/api/preview?path=${encodeURIComponent(`/${locale?.code ?? "en"}/${data?.slug ?? ""}`)}`,
    breakpoints: [
      { label: "Phone", name: "phone", width: 375, height: 667 },
      { label: "Tablet", name: "tablet", width: 768, height: 1024 },
      { label: "Desktop", name: "desktop", width: 1280, height: 800 },
    ],
  },
},
```

(Check how the site maps a page slug to its URL — `[...slug]` route — and the homepage path; adjust the path builder to match. The admin iframe is same-origin, so the Clerk session reaches `/api/preview`; the CSP already allows `frame-ancestors 'self'`.)

- [ ] **Step 4: PASS + gates + admin 200 + a dev check** — with the dev server running and signed out, `curl -s -o /dev/null -w "%{http_code}" "localhost:3000/api/preview?path=/en/about"` → `403`; `?path=//evil.com` → `403` (not signed in — the staff check comes first). Stop the server.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml payload/collections/pages.ts payload/globals/homepage.ts "app/[locale]/(main)/layout.tsx" app/api/preview components/preview lib/preview lib/__tests__/preview-route.test.ts "app/(payload)/admin/importMap.js"
git commit -m "feat(cms): live preview for pages and the homepage, staff only"
```

---

### Task 11: End-to-end check, runbook, and the signed-in checklist

**Files:**
- Create then delete: `scripts/zz-page-builder-e2e.tmp.ts`
- Modify: `docs/migration/payload-production-runbook.md` (new section "2026-09-28 page builder foundation")

- [ ] **Step 1: Full gates** — `npx vitest run`; `npx tsc --noEmit -p .`; eslint on every file changed since the plan's first commit (`git diff --name-only <first-commit>^..HEAD -- '*.ts' '*.tsx'`).

- [ ] **Step 2: Dev round trip** (guarded runtime, DEV only) — create a page `zz-page-builder-check` (drafts: create as draft, then publish) whose `blocks` contain one of each new section: Hero with image, FAQs (2 questions), Timeline (2 steps), Image carousel (1 existing media id), Share-your-story banner, Newsletter signup, Events calendar, People, Region map, Atlas (`ssa`), and three Content feeds: (a) Automatic case studies, count 3; (b) mixed news + lived experiences, "Automatic, with my picks first", 1 pick; (c) "Only the items I pick" with one real pick and one unpublished pick. Then start `pnpm dev` and `curl` `/en/zz-page-builder-check` (adjust to the pages route) → 200; assert the HTML contains each section's recognisable heading/text and that feed (c) shows exactly one card. Before publishing, confirm the page URL returns the not-found status signed out (draft invisible). Delete the page; confirm zero leftovers. Delete the script.

- [ ] **Step 3: Runbook** — append "2026-09-28 page builder foundation": (1) deploy (`vercel --prod`); `prodMigrations` applies `page_sections_and_drafts` on boot — confirm with `PAYLOAD_DATABASE_URL=<prod> PAYLOAD_SECRET=<prod> pnpm exec payload migrate:status`; (2) nothing else to run; (3) the signed-in checklist:
  1. Open a page in the admin → "Add section" shows six groups with pictures and plain names.
  2. Add a Content feed → switch "How to fill it" → "My picks" appears only for the two pick modes; the "What will show now" panel lists items and updates.
  3. Pick an item, unpublish it elsewhere → the panel lists it under "Not shown".
  4. Each section's row shows "EN ✓ · ES missing …" and updates after translating.
  5. Open Live preview → phone/tablet/desktop; edit a heading → the preview updates after the autosave; the public page (signed out, other browser) still shows the published version until you Publish.

- [ ] **Step 4: Commit**

```bash
git add docs/migration/payload-production-runbook.md
git commit -m "docs(runbook): page builder foundation — deploy steps and the signed-in checklist"
```
