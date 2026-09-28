# Regional communities on the page builder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One record per regional community, whose page is an ordinary Sections list with a section-driven chapter menu, feeds that know their community, a Community header and Community members section, and a dry-run-first move from the old Community pages.

**Architecture:** `regionalCommunities` gains the Sections field (project 1's `sectionsField`), page metadata, drafts and live preview; `regionalCommunityPages` is hidden as the backup. Community sections carry an optional chapter; the route groups sections into chapters for the existing sticky menu and passes the community to every section. A pure planner converts each old page into sections; a runner writes them per language (project 2's helpers) with `--execute` / `--revert` / `--replace`.

**Tech Stack:** Next.js 16, React 19, Payload 3.88 (Postgres), next-intl 4, vitest (+ jsdom, @testing-library/react).

**Spec:** `docs/superpowers/specs/2026-09-28-communities-on-sections-design.md` (decisions C1–C6). Project 2's plan (`…/plans/2026-09-28-homepage-on-sections.md`) and its helpers (`scripts/homepage/write.ts`, `lib/content/internal/localize.ts`) are reused.

## Global Constraints

- Branch `master`; commits `type(scope): sentence`; never any Claude/AI attribution.
- Visitors see no change until the move script is executed; after it, only: agenda cards open their document; sections come from the record (same chapters, same content).
- `regionalCommunityPages` is hidden, never deleted; old data untouched.
- No required sections on community pages (C3).
- Chapter kinds and their message keys, exactly: overview→`regional.sectionTitles.overview`, agendas→`agendas`, caseStudies→`caseStudies`, news→`newsUpdates`, voices→`communityVoices`, members→`members`, partners→`partners`; plus `custom` (localized label). Field label: "Show in the page menu as".
- **Never give block usages custom `dbName`s** (Payload's write path resolves block tables by slug); per-list deep copies only (project 2 lesson). Chapter fields are added only to the community copies.
- The migration must set `_status = 'published'` on every existing `regional_communities` row (drafts-enabled collections are read as published-only everywhere).
- Admin client components import only pure modules; after `payload/**` changes: importmap, `/admin` → 200.
- Dev database only (`lucky-waterfall`); migrations additive only (plus the published backfill) — anything else: stop.
- `app/`/`components/` never import `lib/content/internal/**` (boundary test).
- Gates per task: focused tests; `npx tsc --noEmit -p .`; eslint changed files; full `npx vitest run` before the task's last commit (currently 265 files / 3387 tests).

## Review Focus

1. **Communities disappearing site-wide** after drafts are enabled (every content card's community link, the atlas, the regions menu) — pinned in Task 5 (published-backfill test on the migration + reader test that a published read still finds communities).
2. **A hand-picked item that no longer exists** in an old section — the planner keeps the pick (the feed skips it at render) and the dry run lists it; never a crash. Pinned in Task 8.
3. **An editor filter on a community page's feed** must win over the page's own community — pinned in Task 3.
4. **Two chapters of the same kind** must get distinct anchors (`news`, `news-2`) — pinned in Task 1.
5. **A community page with no sections yet** must render today's page unchanged — pinned in Task 7.

---

### Task 1: Chapters (pure) and the chapter field

**Files:**
- Create: `lib/content/chapters.ts` (pure), `payload/blocks/chapter.ts`
- Test: `lib/__tests__/chapters.test.ts`

**Interfaces:**
- Produces:

```ts
// lib/content/chapters.ts
export const CHAPTER_KINDS = ["overview", "agendas", "caseStudies", "news", "voices", "members", "partners", "custom"] as const;
export type ChapterKind = (typeof CHAPTER_KINDS)[number];
export const CHAPTER_MESSAGE: Record<Exclude<ChapterKind, "custom">, string>; // → regional.sectionTitles.<key>
export interface Chapter<T> { id: string | null; kind: ChapterKind | null; label: string | null; blocks: T[] }
export function groupIntoChapters<T extends { chapter?: { kind?: string | null; label?: string | null } | null }>(
  blocks: T[], labelFor: (kind: Exclude<ChapterKind, "custom">) => string,
): Chapter<T>[];
// payload/blocks/chapter.ts
export function withChapter(block: Block): Block; // clone + a collapsed "Page menu" group named `chapter`
```

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/chapters.test.ts
import { describe, expect, it } from "vitest";
import { groupIntoChapters } from "@/lib/content/chapters";
import { withChapter } from "@/payload/blocks/chapter";
import { faqs } from "@/payload/blocks";

const label = (k: string) => `L:${k}`;
const b = (id: string, chapter?: { kind: string; label?: string }) => ({ id, chapter: chapter ?? null });

describe("groupIntoChapters", () => {
  it("starts a chapter at each section that names one; the rest join the chapter above", () => {
    const out = groupIntoChapters([b("a", { kind: "overview" }), b("b"), b("c", { kind: "news" }), b("d")], label);
    expect(out.map((c) => [c.id, c.label, c.blocks.map((x) => x.id)])).toEqual([
      ["overview", "L:overview", ["a", "b"]],
      ["news", "L:news", ["c", "d"]],
    ]);
  });
  it("keeps sections before the first chapter in an unnamed group", () => {
    const out = groupIntoChapters([b("a"), b("b", { kind: "agendas" })], label);
    expect(out[0]).toMatchObject({ id: null, label: null });
    expect(out[0].blocks.map((x) => x.id)).toEqual(["a"]);
  });
  it("uses a custom label and makes an anchor from it", () => {
    const out = groupIntoChapters([b("a", { kind: "custom", label: "Our Partners & Friends" })], label);
    expect(out[0]).toMatchObject({ id: "our-partners-friends", label: "Our Partners & Friends" });
  });
  it("gives repeated chapters distinct anchors", () => {
    const out = groupIntoChapters([b("a", { kind: "news" }), b("b", { kind: "news" })], label);
    expect(out.map((c) => c.id)).toEqual(["news", "news-2"]);
  });
  it("treats 'none' or an empty custom label as no chapter", () => {
    const out = groupIntoChapters([b("a", { kind: "overview" }), b("b", { kind: "none" }), b("c", { kind: "custom", label: "" })], label);
    expect(out).toHaveLength(1);
    expect(out[0].blocks.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("withChapter", () => {
  it("adds a collapsed 'Page menu' group without touching the original", () => {
    const withIt = withChapter(faqs);
    const last = withIt.fields[withIt.fields.length - 1] as { type: string; label: string; fields: Array<{ name: string; fields: Array<{ name: string; label?: string; localized?: boolean }> }> };
    expect(last).toMatchObject({ type: "collapsible", label: "Page menu" });
    const group = last.fields[0];
    expect(group.name).toBe("chapter");
    expect(group.fields.map((f) => f.name)).toEqual(["kind", "label"]);
    expect(group.fields[0].label).toBe("Show in the page menu as");
    expect(group.fields[1].localized).toBe(true);
    expect(faqs.fields.some((f) => "name" in f && f.name === "chapter")).toBe(false);
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement**

```ts
// lib/content/chapters.ts
/** The community page's chapter menu, from its sections (CMS project 3, spec §3.3). Pure. */
export const CHAPTER_KINDS = ["overview", "agendas", "caseStudies", "news", "voices", "members", "partners", "custom"] as const;
export type ChapterKind = (typeof CHAPTER_KINDS)[number];
type Standard = Exclude<ChapterKind, "custom">;

/** Standard chapters' labels: keys under `regional.sectionTitles`. */
export const CHAPTER_MESSAGE: Record<Standard, string> = {
  overview: "overview", agendas: "agendas", caseStudies: "caseStudies", news: "newsUpdates",
  voices: "communityVoices", members: "members", partners: "partners",
};
const ANCHOR: Record<Standard, string> = {
  overview: "overview", agendas: "agendas", caseStudies: "case-studies", news: "news",
  voices: "voices", members: "members", partners: "partners",
};

export interface Chapter<T> { id: string | null; kind: ChapterKind | null; label: string | null; blocks: T[] }

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "section";

export function groupIntoChapters<T extends { chapter?: { kind?: string | null; label?: string | null } | null }>(
  blocks: T[],
  labelFor: (kind: Standard) => string,
): Chapter<T>[] {
  const out: Chapter<T>[] = [];
  const used = new Map<string, number>();
  const anchor = (base: string) => {
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  for (const block of blocks) {
    const kind = block.chapter?.kind ?? null;
    const custom = kind === "custom" ? (block.chapter?.label ?? "").trim() : "";
    const starts = kind && kind !== "none" && (kind !== "custom" || custom) && (CHAPTER_KINDS as readonly string[]).includes(kind);
    if (starts) {
      const k = kind as ChapterKind;
      const label = k === "custom" ? custom : labelFor(k as Standard);
      out.push({ id: anchor(k === "custom" ? slugify(custom) : ANCHOR[k as Standard]), kind: k, label, blocks: [block] });
    } else if (out.length === 0) {
      out.push({ id: null, kind: null, label: null, blocks: [block] });
    } else {
      out[out.length - 1].blocks.push(block);
    }
  }
  return out;
}
```

```ts
// payload/blocks/chapter.ts
import type { Block, Field } from "payload";
import { cloneFieldList } from "@/payload/fields/block-slot";
import { localizedText } from "@/payload/fields/localized";

const CHAPTER_OPTIONS = [
  { label: "Not in the menu", value: "none" },
  { label: "Overview", value: "overview" },
  { label: "Agendas", value: "agendas" },
  { label: "Case studies", value: "caseStudies" },
  { label: "News", value: "news" },
  { label: "Community voices", value: "voices" },
  { label: "Members", value: "members" },
  { label: "Partners", value: "partners" },
  { label: "Custom…", value: "custom" },
];

/** A community-page copy of a section with a "Page menu" setting (spec §3.3).
 *  Only community copies get it, so other pages' storage doesn't change. */
export function withChapter(block: Block): Block {
  const chapter: Field = {
    type: "collapsible",
    label: "Page menu",
    admin: { initCollapsed: true },
    fields: [
      {
        name: "chapter",
        type: "group",
        label: false,
        fields: [
          { name: "kind", type: "select", label: "Show in the page menu as", defaultValue: "none", options: CHAPTER_OPTIONS,
            admin: { description: "Starts a chapter in the menu at the top of the page; the sections below join it until the next chapter." } },
          localizedText("label", { label: "Menu label", admin: { condition: (_: unknown, sibling: { kind?: string }) => sibling?.kind === "custom" } }),
        ],
      },
    ],
  };
  return { ...block, fields: [...cloneFieldList(block.fields), chapter] };
}
```

- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(communities): sections can start a chapter in the page menu`.

---

### Task 2: Community header and Community members sections

**Files:**
- Create: `payload/blocks/community-header.ts`, `payload/blocks/community-members.ts`, `components/blocks/community-header.tsx`, `components/blocks/community-members.tsx`, `public/admin/sections/community-header.svg`
- Modify: `payload/blocks/index.ts`, `payload/blocks/picker.ts` (`"community-header"` picture), `lib/content/internal/payload/blocks.ts` (mapBlock cases), `components/blocks/registry.tsx`
- Test: `lib/__tests__/community-sections.test.tsx`

**Interfaces:**
- Produces: blocks `communityHeader` (slug `"communityHeader"`, `_type "community-header"`, props `{ intro, padding }`), `communityMembers` (`"communityMembers"`, `_type "community-members"`, props `{ title, padding }`). Components receive `communitySlug?: string` (Task 3 passes it) and `locale`.

- [ ] **Step 1: Failing tests**

```tsx
// lib/__tests__/community-sections.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
vi.mock("@/components/regions/region-hero", () => ({ RegionHero: ({ slug }: { slug: string }) => <div data-testid="hero">{slug}</div> }));
vi.mock("@/components/blocks/community/region-members-block", () => ({ RegionMembersBlock: ({ slug }: { slug: string }) => <div data-testid="members">{slug}</div> }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
import CommunityHeader from "@/components/blocks/community-header";
import CommunityMembers from "@/components/blocks/community-members";
import { pageBlocks } from "@/lib/content/internal/payload/blocks";
import { communityHeader, communityMembers } from "@/payload/blocks";

afterEach(cleanup);

describe("community sections", () => {
  it("are named and grouped", () => {
    expect([communityHeader.slug, communityHeader.labels?.singular, communityHeader.admin?.group]).toEqual(["communityHeader", "Community header", "Openings"]);
    expect([communityMembers.slug, communityMembers.labels?.singular, communityMembers.admin?.group]).toEqual(["communityMembers", "Community members", "Content"]);
  });
  it("map to their components' props", () => {
    const [h, m] = pageBlocks([{ id: "h", blockType: "communityHeader", intro: "Hello" }, { id: "m", blockType: "communityMembers", title: null }])!;
    expect(h).toMatchObject({ _type: "community-header", intro: "Hello" });
    expect(m).toMatchObject({ _type: "community-members", title: null });
  });
  it("the header shows the region hero for the page's community, with the intro", async () => {
    render(await CommunityHeader({ communitySlug: "oceania", locale: "en", intro: "Welcome" }));
    expect(screen.getByTestId("hero").textContent).toBe("oceania");
    expect(screen.getByText("Welcome")).toBeTruthy();
  });
  it("renders nothing outside a community page", async () => {
    expect(await CommunityHeader({ locale: "en", intro: "x" })).toBeNull();
    expect(await CommunityMembers({ locale: "en" })).toBeNull();
  });
  it("members shows the community's members", async () => {
    render(await CommunityMembers({ communitySlug: "oceania", locale: "en" }));
    expect(screen.getByTestId("members").textContent).toBe("oceania");
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement**
  - `community-header.ts`: `labels "Community header"`, `pickerAdmin("community-header", "Openings", "The community's own header: its region, name and ways to join")`, fields `moreOptions([localizedTextarea("intro", { label: "Intro line (optional)" }), sectionPaddingField("padding")])`.
  - `community-members.ts`: `labels "Community members"`, `pickerAdmin("people", "Content", "The community's members, filled automatically")`, fields `moreOptions([localizedText("title", { label: "Title (optional)" }), sectionPaddingField("padding")])`.
  - `mapBlock`: `communityHeader` → `{ _key, _type: "community-header", intro: orNull(text(row.intro)), padding }`; `communityMembers` → `{ _key, _type: "community-members", title: orNull(text(row.title)), padding }`.
  - Components (server):

```tsx
// components/blocks/community-header.tsx
import { RegionHero } from "@/components/regions/region-hero";
/** The community's header (CMS project 3): the region hero for the page's community, plus an optional intro line. */
export default async function CommunityHeader({ communitySlug, locale, intro }: { communitySlug?: string; locale: string; intro?: string | null }) {
  if (!communitySlug) return null;
  return (
    <>
      <RegionHero slug={communitySlug} locale={locale} />
      {intro && <p className="mx-auto max-w-prose px-4 pt-2 text-center text-lg text-ccm-midnight/85">{intro}</p>}
    </>
  );
}
```

```tsx
// components/blocks/community-members.tsx
import { RegionMembersBlock } from "@/components/blocks/community/region-members-block";
/** The community's members (CMS project 3). */
export default async function CommunityMembers({ communitySlug, locale }: { communitySlug?: string; locale: string; title?: string | null }) {
  if (!communitySlug) return null;
  return <RegionMembersBlock slug={communitySlug} locale={locale} />;
}
```

  (`RegionMembersBlock` has its own translated heading; the `title` prop is stored for editors and passed through when the block later accepts one — note this in the component's comment is not needed; keep `title` in the props type only.)
  - Register `"community-header"` and `"community-members"` in `registry.tsx`; picture `community-header.svg` in the project-1 style (region blob + name bar + two pill buttons), `SECTION_PICTURES["community-header"]`.

- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(communities): Community header and Community members sections`.

---

### Task 3: Sections know their community

**Files:**
- Modify: `components/blocks/index.tsx` (`context` prop), `components/blocks/content-feed.tsx` (already takes `communityId` — verify only)
- Test: `lib/__tests__/blocks-context.test.tsx`

**Interfaces:**
- Produces: `<Blocks context?: { communityId?: string; communitySlug?: string }>` — every section component receives `communityId` and `communitySlug`.

- [ ] **Step 1: Failing tests**

```tsx
// lib/__tests__/blocks-context.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
vi.mock("@/components/blocks/block-reveal", () => ({ BlockReveal: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock("@/components/blocks/registry", () => ({
  componentMap: { probe: ({ communityId, communitySlug }: { communityId?: string; communitySlug?: string }) => <div data-testid="p">{`${communityId}|${communitySlug}`}</div> },
}));
import Blocks from "@/components/blocks";
afterEach(cleanup);

describe("Blocks context", () => {
  it("passes the page's community to every section", () => {
    render(<Blocks blocks={[{ _type: "probe", _key: "a" }]} locale="en" context={{ communityId: "c1", communitySlug: "oceania" }} />);
    expect(screen.getByTestId("p").textContent).toBe("c1|oceania");
  });
});
```

And in `lib/__tests__/content-feed-resolve.test.ts` add:

```ts
it("an editor's community filter wins over the page's community", async () => {
  query.mockResolvedValue({ docs: [] });
  await resolveContentFeed({ kinds: ["newsPosts"], filters: { communityIds: ["chosen"] } }, { locale: "en", communityId: "page-community" });
  const where = whereOf("newsPosts");
  expect(where).toContain('"chosen"');
  expect(where).not.toContain("page-community");
});
```

- [ ] **Step 2: FAIL** (the first; the second should already pass — if it passes, keep it as a regression pin and note it).
- [ ] **Step 3:** In `Blocks`, accept `context` and spread `communityId={context?.communityId} communitySlug={context?.communitySlug}` onto each `<Component>` (after the block's own props, before `locale`).
- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(blocks): sections receive the page's community`.

---

### Task 4: Agenda cards open their document

**Files:**
- Modify: `lib/content/internal/payload/feeds.ts` (agendas `href` + `depth`)
- Test: `lib/__tests__/content-feed-resolve.test.ts`

- [ ] **Step 1: Failing test**

```ts
it("agenda cards open the agenda's document, or the hub when it has none", async () => {
  query.mockResolvedValue({ docs: [
    { id: "a1", slug: "a-1", title: { en: "A1" }, publishDate: "2026-01-01", files: [{ file: { url: "https://cdn.example/a1.pdf" } }] },
    { id: "a2", slug: "a-2", title: { en: "A2" }, publishDate: "2025-01-01", files: [] },
  ] });
  const r = await resolveContentFeed({ kinds: ["agendas"] }, { locale: "en" });
  expect(r.items.map((i) => i.href)).toEqual(["https://cdn.example/a1.pdf", "/research-and-action"]);
});
```

- [ ] **Step 2: FAIL.** **Step 3:** In `KINDS.agendas`, keep `href` as the fallback and, in `toCard`, for `kind === "agendas"` use the first `files[].file.url` (string, `https?://` or `/`) when present. Ensure the agendas query populates the file (`depth: 1` already populates `files[].file` — the upload is a relation; verify on dev in Task 10).
- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(feeds): agenda cards open the agenda's document`.

---

### Task 5: The community record gets its page

**Files:**
- Modify: `payload/collections/regional-communities.ts`, `payload/collections/regional-community-pages.ts` (`admin.hidden`), `payload/fields/live-preview.ts` (path builder), `payload/globals/homepage.ts` (export reused list only if needed)
- Create: `migrations/<ts>_community_records_with_pages.ts` (generated + published backfill)
- Test: `lib/__tests__/payload-community-record.test.ts`

**Interfaces:**
- Consumes: `sectionsField`, `withChapter`, `HOMEPAGE_SECTIONS`, `communityHeader`, `communityMembers`.
- Produces: `COMMUNITY_SECTIONS: Block[]` (exported from `regional-communities.ts`) = `[communityHeader, ...HOMEPAGE_SECTIONS, communityMembers].map(withChapter)`; record fields `layoutPerLanguage`, `sections`, `sectionsByLanguage`, `meta_title`, `meta_description`, `noindex`, `ogImage`; `livePreviewAt(path: (data, locale) => string): LivePreviewConfig`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/payload-community-record.test.ts
import { describe, expect, it } from "vitest";
import type { Field } from "payload";
import config from "@payload-config";
import { publishedOnly } from "@/payload/access";
import { COMMUNITY_SECTIONS } from "@/payload/collections/regional-communities";
import { readdirSync, readFileSync } from "node:fs";

const named = (fields: Field[], name: string): Record<string, any> | undefined => { // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const f of fields) {
    if ("name" in f && f.name === name) return f as never;
    if ((f.type === "collapsible" || f.type === "row") && "fields" in f) { const inner = named(f.fields, name); if (inner) return inner; }
  }
  return undefined;
};

describe("one record per community", async () => {
  const c = await config;
  const rc = c.collections.find((x) => x.slug === "regionalCommunities")!;
  const pages = c.collections.find((x) => x.slug === "regionalCommunityPages")!;

  it("holds the page: sections, metadata, drafts, preview", () => {
    expect(named(rc.fields, "sections")?.type).toBe("blocks");
    expect(named(rc.fields, "sectionsByLanguage")).toMatchObject({ localized: true });
    expect(named(rc.fields, "sections")?.validate).toBeUndefined(); // nothing required
    for (const f of ["meta_title", "meta_description", "noindex", "ogImage"]) expect(named(rc.fields, f), f).toBeTruthy();
    expect(rc.versions).toMatchObject({ drafts: expect.anything() });
    expect(rc.access.read).toBe(publishedOnly);
    expect(rc.admin.livePreview?.breakpoints?.map((b) => b.width)).toEqual([375, 768, 1280]);
  });

  it("keeps the old Community pages as a hidden backup", () => {
    expect(pages.admin.hidden).toBe(true);
  });

  it("offers the whole library plus the community sections, each with a page-menu setting", () => {
    const slugs = COMMUNITY_SECTIONS.map((b) => b.slug);
    expect(slugs[0]).toBe("communityHeader");
    expect(slugs).toEqual(expect.arrayContaining(["communityMembers", "contentFeed", "atlasEmbed", "logoCloud1"]));
    expect(COMMUNITY_SECTIONS.every((b) => named(b.fields, "chapter"))).toBe(true);
  });

  it("the migration marks every existing community published", () => {
    const file = readdirSync("migrations").find((f) => f.endsWith("_community_records_with_pages.ts"))!;
    expect(readFileSync(`migrations/${file}`, "utf8")).toMatch(/UPDATE "regional_communities" SET "_status" = 'published'/);
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement**
  - `live-preview.ts`: add `export function livePreviewAt(path: (data: Record<string, unknown>, locale: string) => string): LivePreviewConfig` (same breakpoints; url = `${siteOrigin(req)}/api/preview?path=${encodeURIComponent(path(data, locale?.code ?? "en"))}`); keep `livePreview` for pages/homepage.
  - `regional-communities.ts`: wrap the existing data fields (name…orderRank, keep `documentIdField`/`slug` where they are) in `{ type: "collapsible", label: "Details", fields: [...] }` — stored names unchanged; then `...sectionsField({ blocks: COMMUNITY_SECTIONS })`, then `localizedText("meta_title")`, `localizedTextarea("meta_description")`, `{ name: "noindex", type: "checkbox", defaultValue: false }`, `imageField("ogImage")`; `versions: { drafts: { autosave: { interval: 1500 } }, maxPerDoc: 50 }`; `access.read: publishedOnly`; `admin: { group: "Site pages", useAsTitle: "name", defaultColumns: ["name", "region", "_status"], description: "One record per regional community: its details and its page.", livePreview: livePreviewAt((d, l) => `/${l}/communities/${String(d.slug ?? "")}`) }`.
  - `regional-community-pages.ts`: `admin.hidden: true`.
  - Run tests (the migration test still fails).
- [ ] **Step 4: Migration (dev).** `pnpm exec payload migrate:create community_records_with_pages`; audit: only new tables/columns/indexes/constraints for `regional_communities` and its versions/blocks, `_status` columns, NOT NULL loosening for drafts; **no DROP/RENAME** (if any appear: stop). Append inside the up SQL: `UPDATE "regional_communities" SET "_status" = 'published' WHERE "_status" IS NULL OR "_status" = 'draft';`. Apply on dev (host check `lucky-waterfall`, `echo y | pnpm exec payload migrate`). importmap; types.
- [ ] **Step 5: Published check on dev** — `pnpm dev`; `/en/communities/oceania` 200 and unchanged; a case study page that links a community still shows it; `/en/atlas` 200; `/admin` 200. Stop the server.
- [ ] **Step 6: PASS** + full suite, gates. **Step 7: Commit** — `feat(communities): one record per community, holding its page, with drafts and live preview`.

---

### Task 6: Reading a community's sections

**Files:**
- Create: `lib/content/internal/payload/community.ts`, `lib/content/communities.ts` (public)
- Test: `lib/__tests__/community-reader.test.ts`

**Interfaces:**
- Produces: `getCommunity(slug: string, locale: Locale): Promise<CommunityPage | null>` where `CommunityPage = { id: string; slug: string; name: string; sections: unknown[]; meta_title: string | null; meta_description: string | null; noindex: boolean; ogImage: unknown }` (`sections` mapped by `pageBlocks`, chapter groups preserved on each block as `chapter: { kind, label }`).

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/community-reader.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const q = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => q(d), queryPreviewable: (d: unknown) => q(d) }));
import { findCommunity } from "@/lib/content/internal/payload/community";
beforeEach(() => q.mockReset());

const rec = (over = {}) => ({ id: "rc1", slug: "oceania", name: { en: "Oceania", fr: "Océanie" }, meta_title: { en: "O" },
  sections: [{ id: "s1", blockType: "faqs", faqs: [{ id: "q", title: { en: "Q", fr: "QF" } }], chapter: { kind: "overview", label: null } }], ...over });

describe("findCommunity", () => {
  it("returns the shared sections in the visitor's language, keeping chapters", async () => {
    q.mockResolvedValue({ docs: [rec()] });
    const c = await findCommunity("oceania", "fr");
    expect(c).toMatchObject({ id: "rc1", slug: "oceania", name: "Océanie" });
    expect(c!.sections[0]).toMatchObject({ _type: "faqs", chapter: { kind: "overview", label: null } });
    expect((c!.sections[0] as { faqs: Array<{ title: string }> }).faqs[0].title).toBe("QF");
  });
  it("falls back to English per field", async () => {
    q.mockResolvedValue({ docs: [rec()] });
    expect((await findCommunity("oceania", "ar"))!.name).toBe("Oceania");
  });
  it("is null for an unknown community", async () => {
    q.mockResolvedValue({ docs: [] });
    expect(await findCommunity("nowhere", "en")).toBeNull();
  });
  it("has no sections when none are set (the old page then renders)", async () => {
    q.mockResolvedValue({ docs: [rec({ sections: [] })] });
    expect((await findCommunity("oceania", "en"))!.sections).toEqual([]);
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement** — `findCommunity` does `queryPreviewable({ type: "find", collection: "regionalCommunities", where: { slug: { equals: slug } }, locale: "all", depth: 3, limit: 1, pagination: false })`, picks the list like the homepage reader (`layoutPerLanguage` → `sectionsByLanguage[locale]` or English's), `collapseLocales(list, locale)`, then maps each row with `pageBlocks([row])` and re-attaches `chapter: { kind: row.chapter?.kind ?? null, label: row.chapter?.label ?? null }` to the mapped block (mapBlock drops unknown keys). Name/meta via `collapseLocales`. Public `lib/content/communities.ts`: `getCommunity` returns `null` when `activeBackend() !== "payload"`.
- [ ] **Step 4: PASS**, gates (boundary test). **Step 5: Commit** — `feat(communities): read a community's sections in the visitor's language`.

---

### Task 7: The community route

**Files:**
- Create: `components/pages/community-sections.tsx`
- Modify: `app/[locale]/(main)/communities/[slug]/page.tsx`
- Test: `lib/__tests__/community-sections-render.test.tsx`, `lib/__tests__/community-route.test.tsx`

**Interfaces:**
- Consumes: `groupIntoChapters`, `CHAPTER_MESSAGE`, `getCommunity`, `<Blocks context editHref editLabel>`.
- Produces: `CommunitySections({ sections, communityId, communitySlug, locale, userId, canEdit, editLabel })`.

- [ ] **Step 1: Failing tests**

```tsx
// lib/__tests__/community-sections-render.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
vi.mock("@/components/regions/region-section-spine", () => ({ RegionSectionSpine: ({ sections }: { sections: Array<{ id: string; label: string }> }) => <nav data-testid="menu">{sections.map((s) => `${s.id}=${s.label}`).join(",")}</nav> }));
vi.mock("@/components/blocks", () => ({ default: ({ blocks, context }: { blocks: Array<{ _key: string }>; context: { communityId: string } }) => <div data-testid="blocks">{`${blocks.map((b) => b._key).join(",")}@${context.communityId}`}</div> }));
import CommunitySections from "@/components/pages/community-sections";
afterEach(cleanup);

const s = (key: string, kind?: string) => ({ _type: "faqs", _key: key, chapter: kind ? { kind, label: null } : null });

describe("CommunitySections", () => {
  it("draws the menu from chapters and anchors each chapter", async () => {
    const { container } = render(await CommunitySections({ sections: [s("a", "overview"), s("b"), s("c", "news")], communityId: "c1", communitySlug: "oceania", locale: "en" }));
    expect(screen.getByTestId("menu").textContent).toBe("overview=t:overview,news=t:newsUpdates");
    expect([...container.querySelectorAll("section[id]")].map((e) => e.id)).toEqual(["overview", "news"]);
    expect(screen.getAllByTestId("blocks").map((e) => e.textContent)).toEqual(["a,b@c1", "c@c1"]);
  });
  it("shows no menu with a single chapter", async () => {
    render(await CommunitySections({ sections: [s("a", "overview"), s("b")], communityId: "c1", communitySlug: "oceania", locale: "en" }));
    expect(screen.queryByTestId("menu")).toBeNull();
  });
});
```

Route test (`community-route.test.tsx`): mock `getCommunity`, `getRegionalCommunityPage`, `RegionalCommunityTemplate`, `RegionHero`, `CommunitySections`, `auth`, `getActor`; assert (a) sections present → `CommunitySections` rendered, template not; (b) `getCommunity` returns `{ sections: [] }` → `RegionHero` + template rendered as today; (c) no community and no page → `notFound`.

- [ ] **Step 2: FAIL.** **Step 3: Implement**
  - `community-sections.tsx` (server): `const t = await getTranslations({ locale, namespace: "regional" })`; `groupIntoChapters(sections, (k) => t(\`sectionTitles.${CHAPTER_MESSAGE[k]}\`))`; menu = chapters with an id → `RegionSectionSpine` when ≥ 2; render each chapter as `<section id={chapter.id ?? undefined} className="scroll-mt-14">` wrapping `<Blocks blocks={chapter.blocks} locale userId context={{ communityId, communitySlug }} editHref={canEdit ? (i) => \`/admin/collections/regionalCommunities/${communityId}#sections-row-${offset + i}\` : undefined} editLabel />` (offset = index of the chapter's first block in the full list).
  - Route: first `const community = await getCommunity(slug, locale)`; if `community?.sections.length` → `<CommunitySections …>` (with `canEdit = isStaff(await getActor())`, `editLabel` from `blocks.editSection`); else the current `RegionHero`/`RegionalCommunityTemplate` path. Delete the `contentFlow` (`HybridContentFlow`), legacy `blocks`+`RegionalAgendasGrid`, `titleHero` and `listHero` branches and their now-unused imports; `notFound()` when neither a community nor a page exists. `generateMetadata`: when the community has sections, use its `meta_title`/`meta_description`/`ogImage`/`noindex` (falling back to the page's as today).
- [ ] **Step 4: PASS** + full suite (dead-surface tests may reference removed components — update only those assertions) + gates. **Step 5: Commit** — `feat(communities): community pages render their sections with a chapter menu; drop the dead Sanity-era modes`.

---

### Task 8: The move planner (pure)

**Files:**
- Create: `scripts/communities/plan.ts`
- Test: `lib/__tests__/communities-move-plan.test.ts`

**Interfaces:**
- Consumes: `planSection` from `scripts/homepage/plan.ts` (for heroes/logos), `LocaleMap`, `Difference`.
- Produces: `planCommunitySections(page: Row, region: string | null): { sections: Row[]; differences: Difference[]; notes: string[]; picks: Array<{ kind: string; id: string }> }`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/communities-move-plan.test.ts
import { describe, expect, it } from "vitest";
import { planCommunitySections } from "@/scripts/communities/plan";

const grid = (contentType: string, mode: string | null, over: Record<string, unknown> = {}) => ({ id: `g-${contentType}`, blockType: "contentGrid", contentType, mode, maxItems: 4, title: `${contentType} title`, ...over });
const page = (en: unknown[], es?: unknown[]) => ({ slug: "oceania", atlasEmbed: { enabled: true, showBreakdown: false }, sections: { en, es: es ?? en } });

describe("planCommunitySections", () => {
  it("builds header, atlas, then each old section in its order, with chapters", () => {
    const p = planCommunitySections(page([grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "a1" }] }), grid("caseStudies", "dynamic-recent"), grid("news", "dynamic-featured"), grid("livedExperiences", "dynamic-recent"), grid("team", "manual")]), "oce");
    expect(p.sections.map((s) => [s.blockType, (s.chapter as { kind: string } | undefined)?.kind])).toEqual([
      ["communityHeader", "overview"], ["atlasEmbed", undefined], ["contentFeed", "agendas"], ["contentFeed", "caseStudies"],
      ["contentFeed", "news"], ["contentFeed", "voices"], ["communityMembers", "members"],
    ]);
    expect(p.sections[1]).toMatchObject({ region: "oce", showBreakdown: false });
  });

  it("carries fill mode, picks, count and layout", () => {
    const p = planCommunitySections(page([
      grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "a1" }] }),
      grid("caseStudies", "dynamic-with-pinned", { manualItems: [{ blockType: "gridCaseStudy", caseStudy: { id: "c9" } }] }),
      grid("news", "dynamic-featured"),
      grid("livedExperiences", "dynamic-recent"),
    ]), "oce");
    const [, , ag, cs, nw, le] = p.sections;
    expect(ag).toMatchObject({ kinds: ["agendas"], fill: "picksOnly", sort: "myOrder", picks: [{ relationTo: "agendas", value: "a1" }], count: 4, layout: "grid" });
    expect(cs).toMatchObject({ kinds: ["caseStudies"], fill: "automaticWithPicks", picks: [{ relationTo: "caseStudies", value: "c9" }] });
    expect(nw).toMatchObject({ kinds: ["newsPosts"], fill: "automatic", sort: "featuredFirst" });
    expect(le).toMatchObject({ kinds: ["livedExperiences"], fill: "automatic", sort: "newest", layout: "carousel" });
  });

  it("keeps each language's heading", () => {
    const p = planCommunitySections(page([grid("news", "dynamic-recent", { title: "News" })], [grid("news", "dynamic-recent", { title: "Noticias" })]), "oce");
    expect(p.sections.find((s) => s.blockType === "contentFeed")!.heading).toEqual({ en: "News", es: "Noticias" });
  });

  it("skips the atlas when it was switched off, and testimonials with none picked", () => {
    const p = planCommunitySections({ ...page([grid("testimonials", null)]), atlasEmbed: { enabled: false } }, "oce");
    expect(p.sections.map((s) => s.blockType)).toEqual(["communityHeader"]);
    expect(p.notes).toContain("testimonials had nothing picked — no section added.");
  });

  it("keeps hand-picked testimonials", () => {
    const p = planCommunitySections(page([grid("testimonials", null, { manualTestimonials: ["t1"] })]), "oce");
    expect(p.sections.at(-1)).toMatchObject({ blockType: "carousel2", testimonial: ["t1"] });
  });

  it("lists every pick so the dry run can check it still exists", () => {
    const p = planCommunitySections(page([grid("agendas", "manual", { manualItems: [{ blockType: "gridAgenda", agenda: "gone" }] })]), "oce");
    expect(p.picks).toEqual([{ kind: "agendas", id: "gone" }]);
  });
});
```

- [ ] **Step 2: FAIL.** **Step 3: Implement** `scripts/communities/plan.ts`: read the English list `page.sections.en` (row order) and each language's list by position for headings (`title` string per language → `LocaleMap`; `description` rich text dropped with a note); map per the spec §3.5 table: `KIND = { agendas: "agendas", caseStudies: "caseStudies", news: "newsPosts", livedExperiences: "livedExperiences" }`, `CHAPTER = { agendas: "agendas", caseStudies: "caseStudies", news: "news", livedExperiences: "voices" }`, picks from `manualItems[].{agenda|caseStudy|newsPost}` (id or `{id}`) → `{ relationTo, value }`; fill/sort: `manual` → picksOnly + myOrder, `dynamic-with-pinned` → automaticWithPicks + newest, `dynamic-featured` → automatic + featuredFirst, `dynamic-recent`/null → automatic + newest; `count` = `maxItems` clamped 1–24 (default 6); layout carousel for livedExperiences else grid; `team` → `{ blockType: "communityMembers", title, chapter: { kind: "members" } }`; testimonials with `manualTestimonials` → carousel2; header first `{ blockType: "communityHeader", chapter: { kind: "overview" } }`; atlas second when `enabled !== false` and `region` is set: `{ blockType: "atlasEmbed", region, showBreakdown: showBreakdown !== false }`; heroes/logo slot via `planSection` only when they have a title/logos (none today) with the logo strip in chapter partners.
- [ ] **Step 4: PASS**, gates. **Step 5: Commit** — `feat(communities): plan each community page's move onto sections`.

---

### Task 9: The move script

**Files:**
- Create: `scripts/communities/move-to-sections.ts`
- Test: (runner is thin; covered by Task 10's dev run) — add a unit test for any new pure helper it needs.

- [ ] **Step 1:** Runner in the shape of `scripts/homepage/move-to-sections.ts`: guards (`assertPayloadDatabase`, `--production`), flags `--execute`, `--replace`, `--revert`, optional `--only=<slug>`.
  - Read all `regionalCommunityPages` (`locale: "all"`, `depth: 0`, `draft: false`) and all `regionalCommunities` (`locale: "all"`, `depth: 0`).
  - For each page: its community = `page.regionalCommunity`; `guardExisting(community.sections ?? [], { replace })` per community (skip with the message, continue others); `planCommunitySections(page, community.region)`; resolve every pick's title (`find` by id per kind, `draft: false`) and list unresolved ones.
  - Print per community: sections (`#`, section, chapter, en heading / es / fr / ar), unresolved picks, differences, notes. Dry run ends with the usual line.
  - `--execute`: English first via `payload.update({ collection: "regionalCommunities", id, locale: "en", draft: false, data: { layoutPerLanguage: false, sections: toLocaleData(sections, "en"), meta_title/meta_description/noindex/ogImage from the page, _status: "published" }, context: IMPORT_WRITE_CONTEXT })`; read back; each other language with `withIdsFrom`.
  - `--revert`: `sections: []`, `sectionsByLanguage: []` per locale, published.
- [ ] **Step 2:** Dry run on dev: `pnpm exec tsx scripts/communities/move-to-sections.ts`; read the tables for all seven.
- [ ] **Step 3: Commit** — `feat(communities): a dry-run-first script moves each community page onto its record`.

---

### Task 10: Dev run, rendered checks, runbook

- [ ] **Step 1: Before** — `pnpm dev`; Playwright: `/en/communities/sub-saharan-africa` and `/ar/communities/oceania` at 1280 and 375, scroll through first; record chapter menu labels and section headings.
- [ ] **Step 2:** `--execute` on dev; clear the cache (`POST /api/cache/revalidate {"all":true}`); load twice.
- [ ] **Step 3: After** — same views: same chapter menu (Overview · Agendas · Case studies · News & Updates · Community Voices · Members), menu links jump to their chapter, the same feeds' content (hand-picked items where they were), agenda cards open a PDF, members present, atlas present, no horizontal scroll at 375, Arabic right-to-left, console free of new errors; a case study page still shows its community.
- [ ] **Step 4:** second run refused; `--revert` → the old page returns; re-execute.
- [ ] **Step 5: Runbook** "2026-09-28 regional communities on sections": migration pre-check → deploy (unchanged pages) → dry run `scripts/communities/move-to-sections.ts --production` → execute → clear the cache → rollback command → signed-in checklist (one "Regional communities" entry per community under Site pages; Sections with Community header/members; Page menu setting and Custom label; feeds default to the community, a set community filter wins; live preview; Edit this section; Community pages no longer in the menu).
- [ ] **Step 6:** full gates; **Commit** — `docs(runbook): regional communities on sections`.
