# Editing that feels natural — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Editors start from the real site: "Edit" opens the admin on that exact section with live preview on, plain words say what is live, moderators clear one queue on `/moderation`, and community leads edit and publish only their own community.

**Architecture:** Site edit links carry the section row and a `from` path. A `ui` field at the top of every Sections list reads them in the admin, collapses the other rows through Payload's own `SET_ALL_ROWS_COLLAPSED` form action, scrolls to the row and turns live preview on. A second `ui` field on every drafts-enabled document shows the publish state. `/moderation` gains a merged "Waiting for review" tab built on the existing `runModerationAction` and comment actions. Leads are Prisma `community_editor`s listed in a new `leadIds` field on the community record; Payload access functions scope them to those records.

**Tech Stack:** Next.js 16, React 19, Payload 3.88 (`@payloadcms/ui` hooks `useFormFields`, `useLivePreviewContext`, `useDocumentInfo`, `useField`), Prisma, next-intl 4, vitest + RTL.

**Spec:** `docs/superpowers/specs/2026-09-29-editor-experience-design.md`

## Global Constraints

- Branch `master`; commits `type(scope): sentence`; never any Claude/AI attribution.
- Admin client components import only pure modules and `@payloadcms/ui` — never `lib/content`, `next/headers` or `server-only` (admin client-import gotcha); `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/admin` must print `200` after every admin-component change, after `pnpm exec payload generate:importmap`.
- Payload **field** access functions return booleans only (never a `Where`).
- Migrations additive only; dev DB only (host contains `lucky-waterfall`, loaded from `.env.local`); never `git checkout migrations/index.ts`.
- Exact editor wording (English admin): **Save without publishing** (was "Save Draft"), **Discard my changes** (was "Revert to published"), **Publish changes** unchanged, **Editing** as the locale label; banner lines **"Everything you see is live."**, **"Visitors still see the published version. You have unpublished changes."**, **"Not published yet — visitors can't see this."**; translation line **"Not translated yet: ES, AR — visitors see English"** / **"Translated ✓"**; back link **"← Back to the page"**.
- Leads: may edit + publish only communities whose `leadIds` holds their user id; never `members`, `slug`, `region`, `leadIds`; never create/delete communities; no other collection or global except creating media.
- Site messages ship in en/es/fr/ar; Arabic stays RTL.
- Gates per task: focused tests, `npx tsc --noEmit -p .`, eslint on changed files only, rendered check where the task says; full suite (`pnpm exec vitest run`, currently 279 files / 3461 tests) before each task's last commit.

## Review Focus

1. **A `from` value that is not a same-site path** (`https://evil.example`, `//evil.example`, `javascript:…`) — the Back link must not render. Pinned in Task 1 (`safeFrom`) and Task 2 (`backPath`).
2. **A row number past the end of the list** (section deleted since the link was made) — nothing collapses, no crash, the editor opens normally. Pinned in Task 2 (`parseSectionTarget` + component guard `row < rows.length`).
3. **A lead opening another community or a page by URL** — the server refuses (no data returned, update denied), not just a hidden menu. Pinned in Task 7 (access tests, including a Local API check on dev).
4. **Removing a lead who also leads a second community** — they keep `community_editor`; a `team_editor` or `admin` is never demoted. Pinned in Task 7 (`nextRole` tests).
5. **A submission with no title in the reader's language / no picture / no sender** — the queue row still renders (English title, no image, "Unknown sender"). Pinned in Task 5 (`toSubmissionItem` tests).

---

### Task 1: Edit links carry the way back

**Files:** Create `lib/cms/edit-links.ts`; Modify `components/pages/homepage.tsx:217`, `components/pages/community-sections.tsx:80`, `app/[locale]/(main)/[...slug]/page.tsx:90`, `app/[locale]/(main)/page.tsx` (pass `returnTo`), `app/[locale]/(main)/communities/[slug]/page.tsx` (pass `returnTo`); Test `lib/__tests__/cms-edit-links.test.ts`

**Interfaces:** Produces `safeFrom(from: string | null | undefined): string | null`; `sectionEditHref(base: string, row: number, from: string): string`; `documentEditHref(collection: string, id: string, from: string): string`. Consumed by Tasks 2, 4, 8.

- [ ] **Step 1: Failing test**

```ts
import { describe, expect, it } from "vitest";
import { documentEditHref, safeFrom, sectionEditHref } from "@/lib/cms/edit-links";

describe("edit links", () => {
  it("accepts only same-site paths as the way back", () => {
    expect(safeFrom("/en/about")).toBe("/en/about");
    expect(safeFrom("/ar/communities/oceania?x=1")).toBe("/ar/communities/oceania?x=1");
    for (const bad of ["https://evil.example", "//evil.example", "javascript:alert(1)", "about", "", null, undefined, "/\\evil.example"]) {
      expect(safeFrom(bad)).toBeNull();
    }
  });
  it("opens a section with the way back", () => {
    expect(sectionEditHref("/admin/collections/pages/p1", 2, "/en/about")).toBe("/admin/collections/pages/p1?from=%2Fen%2Fabout#sections-row-2");
  });
  it("opens a document with the way back", () => {
    expect(documentEditHref("newsPosts", "n 1", "/fr/news/x")).toBe("/admin/collections/newsPosts/n%201?from=%2Ffr%2Fnews%2Fx");
  });
  it("drops a way back that isn't same-site", () => {
    expect(sectionEditHref("/admin/globals/homepage", 0, "https://evil.example")).toBe("/admin/globals/homepage#sections-row-0");
  });
});
```

- [ ] **Step 2:** `pnpm exec vitest run lib/__tests__/cms-edit-links.test.ts` — Expected: FAIL, cannot find `@/lib/cms/edit-links`.
- [ ] **Step 3: Implement** `lib/cms/edit-links.ts`:

```ts
/**
 * Links from the site into the admin (editor-experience spec §3.1–3.2).
 * Pure — the admin's section-focus component parses the same shape.
 */

/** A same-site path to return to, or null. Rejects absolute and protocol-relative URLs. */
export function safeFrom(from: string | null | undefined): string | null {
  if (typeof from !== "string" || !from.startsWith("/")) return null;
  if (from.startsWith("//") || from.startsWith("/\\")) return null;
  return from;
}

const withFrom = (path: string, from: string) => {
  const back = safeFrom(from);
  return back ? `${path}?from=${encodeURIComponent(back)}` : path;
};

/** The admin page for one section of a Sections list, with the way back. */
export function sectionEditHref(base: string, row: number, from: string): string {
  return `${withFrom(base, from)}#sections-row-${row}`;
}

/** The admin page for one document, with the way back. */
export function documentEditHref(collection: string, id: string, from: string): string {
  return withFrom(`/admin/collections/${collection}/${encodeURIComponent(id)}`, from);
}
```

- [ ] **Step 4:** Re-run — Expected: 4 passed.
- [ ] **Step 5: Use it in the three builders.** Add an optional `returnTo?: string` prop to `Homepage` (`components/pages/homepage.tsx`) and `CommunitySections` (`components/pages/community-sections.tsx`), then:
  - homepage.tsx: `editHref={canEdit ? (index) => sectionEditHref("/admin/globals/homepage", index, returnTo ?? "/") : undefined}`
  - community-sections.tsx: `editHref={canEdit ? (i) => sectionEditHref(\`/admin/collections/regionalCommunities/${communityId}\`, rows[i], returnTo ?? "/") : undefined}`
  - `[...slug]/page.tsx`: `editHref={canEdit ? (i) => sectionEditHref(\`/admin/collections/pages/${page.id}\`, i, \`/${locale}/${slug}\`) : undefined}`
  - `app/[locale]/(main)/page.tsx`: pass `returnTo={\`/${locale}\`}` to `<Homepage>`; `communities/[slug]/page.tsx`: pass `returnTo={\`/${locale}/communities/${slug}\`}` to `<CommunitySections>`.
  Update `lib/__tests__/pages-route-edit.test.tsx`'s expected href to `/admin/collections/pages/p1?from=%2Fen%2Fabout#sections-row-2`, and any homepage/community edit-href expectations the suite reports.
- [ ] **Step 6:** Full suite, tsc, eslint changed files. **Commit** — `feat(cms): edit links remember the page you came from`.

---

### Task 2: The editor opens on the section you clicked

**Files:** Create `payload/components/section-focus-target.ts` (pure), `payload/components/section-focus.tsx` (client); Modify `payload/fields/sections.ts` (prepend the `ui` field); Test `lib/__tests__/section-focus-target.test.ts`, extend `lib/__tests__/payload-pages-sections.test.ts`

**Interfaces:** Consumes Task 1's URL shape (`?from=…#sections-row-N`). Produces `parseSectionTarget(hash: string): { field: "sections" | "sectionsByLanguage"; row: number } | null`; `backPath(search: string): string | null`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/section-focus-target.test.ts
import { describe, expect, it } from "vitest";
import { backPath, parseSectionTarget } from "@/payload/components/section-focus-target";

describe("section focus target", () => {
  it("reads the section row from the link", () => {
    expect(parseSectionTarget("#sections-row-3")).toEqual({ field: "sections", row: 3 });
    expect(parseSectionTarget("#sectionsByLanguage-row-0")).toEqual({ field: "sectionsByLanguage", row: 0 });
  });
  it("ignores anything else", () => {
    for (const h of ["", "#", "#sections-row-", "#sections-row--1", "#sections-row-2x", "#other-row-1"]) expect(parseSectionTarget(h)).toBeNull();
  });
  it("offers the way back only to a same-site path", () => {
    expect(backPath("?from=%2Fen%2Fabout")).toBe("/en/about");
    expect(backPath("?from=https%3A%2F%2Fevil.example")).toBeNull();
    expect(backPath("?from=%2F%2Fevil.example")).toBeNull();
    expect(backPath("")).toBeNull();
  });
});
```

Append to `lib/__tests__/payload-pages-sections.test.ts` inside its `describe`:

```ts
  it("opens on the section an edit link names", () => {
    const focus = named(pages.fields, "sectionFocus");
    expect(focus?.type).toBe("ui");
    expect(focus?.admin?.components?.Field).toBe("@/payload/components/section-focus#SectionFocus");
  });
```

- [ ] **Step 2:** Run both files — Expected: FAIL (module missing; `sectionFocus` undefined).
- [ ] **Step 3: Implement.**

`payload/components/section-focus-target.ts`:

```ts
/** Pure parsing for section-focus.tsx — no imports, safe in the admin bundle. */
export function parseSectionTarget(hash: string): { field: "sections" | "sectionsByLanguage"; row: number } | null {
  const m = /^#(sections|sectionsByLanguage)-row-(\d+)$/.exec(hash);
  return m ? { field: m[1] as "sections" | "sectionsByLanguage", row: Number(m[2]) } : null;
}

export function backPath(search: string): string | null {
  const from = new URLSearchParams(search).get("from");
  if (!from || !from.startsWith("/") || from.startsWith("//") || from.startsWith("/\\")) return null;
  return from;
}
```

`payload/components/section-focus.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useFormFields, useLivePreviewContext } from "@payloadcms/ui";
import { backPath, parseSectionTarget } from "./section-focus-target";

/**
 * Opens the editor on the section an "Edit this section" link named: every
 * other row folds, the row scrolls into view, live preview turns on, and a
 * "Back to the page" link returns to the site (editor-experience spec §3.2).
 * Renders nothing when the page was opened any other way.
 */
export function SectionFocus() {
  const [target, setTarget] = useState<ReturnType<typeof parseSectionTarget>>(null);
  const [from, setFrom] = useState<string | null>(null);
  useEffect(() => {
    setTarget(parseSectionTarget(window.location.hash));
    setFrom(backPath(window.location.search));
  }, []);

  const rows = useFormFields(([fields]) => (target ? fields[target.field]?.rows : undefined));
  const dispatch = useFormFields(([, d]) => d);
  const { setIsLivePreviewing } = useLivePreviewContext();
  const done = useRef(false);

  useEffect(() => {
    if (!target || done.current || !rows || target.row >= rows.length) return;
    done.current = true;
    dispatch({
      type: "SET_ALL_ROWS_COLLAPSED",
      path: target.field,
      updatedRows: rows.map((r, i) => ({ ...r, collapsed: i !== target.row })),
    });
    setIsLivePreviewing(true);
    requestAnimationFrame(() =>
      document.getElementById(`${target.field}-row-${target.row}`)?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }, [target, rows, dispatch, setIsLivePreviewing]);

  if (!from) return null;
  return (
    <a href={from} style={{ display: "inline-block", marginBottom: "1rem", fontWeight: 600 }}>
      ← Back to the page
    </a>
  );
}
```

In `payload/fields/sections.ts`, `sectionsField` returns `[focus, toggle, shared, perLanguage]` with:

```ts
  const focus: Field = {
    name: "sectionFocus",
    type: "ui",
    admin: { components: { Field: "@/payload/components/section-focus#SectionFocus" } },
  };
```

- [ ] **Step 4:** Run both test files — Expected: PASS. `pnpm exec payload generate:importmap`; `/admin` → 200.
- [ ] **Step 5: Rendered check** (dev server on 3001, staff session in the browser): from `/en/about` click the third section's "Edit this section" → the About editor opens with only that row expanded and scrolled into view, live preview open, "← Back to the page" at the top returning to `/en/about`; same from `/en/communities/oceania` and the homepage. Open `/admin/collections/pages/<id>#sections-row-99` → opens normally, nothing collapsed. If Clerk sign-in is not available in the automation browser, record "rendered check owed (signed-in)" in the ledger and verify the component with the unit tests plus `/admin` 200.
- [ ] **Step 6:** Full suite; **Commit** — `feat(cms): the editor opens on the section you clicked, with live preview on`.

---

### Task 3: Plain words — buttons, publish state, translations

**Files:** Create `payload/components/publish-state-message.ts` (pure), `payload/components/publish-state.tsx` (client), `payload/fields/publish-state.ts`; Modify `payload.config.ts` (i18n + add the field to every drafts-enabled collection/global), `payload/components/translation-status.ts` (`statusLine`); Test `lib/__tests__/publish-state.test.ts`, update the existing `statusLine` tests.

**Interfaces:** Produces `publishStateMessage({ hasPublishedDoc, unpublishedVersionCount }): string`; `withPublishState<T extends { fields: Field[]; versions?: unknown }>(config: T): T`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/publish-state.test.ts
import { describe, expect, it } from "vitest";
import { publishStateMessage } from "@/payload/components/publish-state-message";
import { statusLine } from "@/payload/components/translation-status";
import config from "@payload-config";

describe("publish state", () => {
  it("says in words what visitors see", () => {
    expect(publishStateMessage({ hasPublishedDoc: false, unpublishedVersionCount: 0 })).toBe("Not published yet — visitors can't see this.");
    expect(publishStateMessage({ hasPublishedDoc: true, unpublishedVersionCount: 2 })).toBe("Visitors still see the published version. You have unpublished changes.");
    expect(publishStateMessage({ hasPublishedDoc: true, unpublishedVersionCount: 0 })).toBe("Everything you see is live.");
  });
  it("sits at the top of every document that has drafts", async () => {
    const c = await config;
    for (const item of [...c.collections, ...(c.globals ?? [])]) {
      const drafts = typeof item.versions === "object" && item.versions && "drafts" in item.versions && item.versions.drafts;
      if (!drafts) continue;
      expect([item.slug, "name" in item.fields[0] ? item.fields[0].name : null]).toEqual([item.slug, "publishState"]);
    }
  });
  it("renames the draft buttons", async () => {
    const t = (await config).i18n?.translations as Record<string, Record<string, Record<string, string>>>;
    expect(t.en.version.saveDraft).toBe("Save without publishing");
    expect(t.en.version.revertToPublished).toBe("Discard my changes");
    expect(t.en.general.locale).toBe("Editing");
  });
});

describe("translation line", () => {
  it("says what is missing in words", () => {
    expect(statusLine({ en: "complete", es: "missing", fr: "complete", ar: "missing" }).text).toBe("Not translated yet: ES, AR — visitors see English");
    expect(statusLine({ en: "complete", es: "complete", fr: "complete", ar: "complete" }).text).toBe("Translated ✓");
  });
});
```

- [ ] **Step 2:** Run — Expected: FAIL (module missing; first field not `publishState`; translations undefined; old status wording).
- [ ] **Step 3: Implement.**

`payload/components/publish-state-message.ts`:

```ts
export function publishStateMessage({ hasPublishedDoc, unpublishedVersionCount }: { hasPublishedDoc: boolean; unpublishedVersionCount: number }): string {
  if (!hasPublishedDoc) return "Not published yet — visitors can't see this.";
  if (unpublishedVersionCount > 0) return "Visitors still see the published version. You have unpublished changes.";
  return "Everything you see is live.";
}
```

`payload/components/publish-state.tsx`:

```tsx
"use client";
import { useDocumentInfo } from "@payloadcms/ui";
import { publishStateMessage } from "./publish-state-message";

/** One line at the top of a drafts-enabled document: what visitors see right now. */
export function PublishState() {
  const { hasPublishedDoc, unpublishedVersionCount } = useDocumentInfo();
  const live = hasPublishedDoc && !unpublishedVersionCount;
  return (
    <p
      role="status"
      style={{
        margin: "0 0 1rem",
        padding: "0.6rem 0.9rem",
        borderRadius: "0.5rem",
        background: live ? "var(--theme-success-100)" : "var(--theme-warning-100)",
        color: live ? "var(--theme-success-800)" : "var(--theme-warning-800)",
        fontWeight: 600,
      }}
    >
      {publishStateMessage({ hasPublishedDoc: Boolean(hasPublishedDoc), unpublishedVersionCount: unpublishedVersionCount ?? 0 })}
    </p>
  );
}
```

`payload/fields/publish-state.ts`:

```ts
import type { Field } from "payload";

const field: Field = { name: "publishState", type: "ui", admin: { components: { Field: "@/payload/components/publish-state#PublishState" } } };

/** Puts the publish-state line first on any collection or global with drafts. */
export function withPublishState<T extends { fields: Field[]; versions?: unknown }>(config: T): T {
  const v = config.versions;
  const drafts = typeof v === "object" && v !== null && "drafts" in v && Boolean((v as { drafts?: unknown }).drafts);
  return drafts ? { ...config, fields: [field, ...config.fields] } : config;
}
```

In `payload.config.ts`: wrap the `collections` array and `globals` array with `.map(withPublishState)`, and add

```ts
  i18n: {
    translations: {
      en: {
        version: { saveDraft: "Save without publishing", revertToPublished: "Discard my changes" },
        general: { locale: "Editing" },
      },
    },
  },
```

In `translation-status.ts`, replace `statusLine`'s `text` with:

```ts
  const missing = entries.filter(([, s]) => s === "missing").map(([l]) => l.toUpperCase());
  const text = missing.length === 0 ? "Translated ✓" : `Not translated yet: ${missing.join(", ")} — visitors see English`;
```

(keep `spoken` as it is).

- [ ] **Step 4:** Run the new test and the suite's translation-status tests; update their old expected strings to the new wording. `generate:importmap`; `/admin` 200. If `migrate:create` is needed (ui fields store nothing — expect none), run `pnpm exec payload migrate:create probe` only to confirm "No schema changes", then delete the probe files and its index entry.
- [ ] **Step 5: Rendered check** (signed-in, or owed as in Task 2): a page with a pending draft shows the amber "Visitors still see…" line; after Publish it turns green "Everything you see is live."; buttons read "Save without publishing" / "Discard my changes"; locale picker reads "Editing: English".
- [ ] **Step 6:** Full suite; **Commit** — `feat(cms): the admin says in plain words what is live and what isn't`.

---

### Task 4: "Edit" on content pages, for staff

**Files:** Create `components/cms/staff-edit-link.tsx`; Modify the five detail pages: `app/[locale]/(main)/news/[slug]/page.tsx` (`newsPosts`, `newsPost._id`), `lived-experiences/[slug]/page.tsx` (`livedExperiences`, `le._id`), `research-and-action/case-studies/[slug]/page.tsx` (`caseStudies`, `caseStudy._id`), `research-and-action/research-outputs/[slug]/page.tsx` (`researchOutputs`, `ro._id`), `collaborate/events/[slug]/page.tsx` (`events`, `event._id`); messages `blocks.editPage` in 4 locales; Test `lib/__tests__/staff-edit-link.test.tsx`

**Interfaces:** Consumes `documentEditHref`. Produces `<StaffEditLink collection id from />` (async server component).

- [ ] **Step 1: Failing test**

```tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("next-intl/server", () => ({ getTranslations: async () => (k: string) => `t:${k}` }));
import { StaffEditLink } from "@/components/cms/staff-edit-link";
afterEach(cleanup);

describe("staff edit link", () => {
  it("links staff to the document in the admin, with the way back", async () => {
    staff.mockReturnValue(true);
    render(await StaffEditLink({ collection: "newsPosts", id: "n1", from: "/en/news/x" }));
    expect(screen.getByRole("link").getAttribute("href")).toBe("/admin/collections/newsPosts/n1?from=%2Fen%2Fnews%2Fx");
    expect(screen.getByRole("link").textContent).toContain("t:editPage");
  });
  it("shows nothing to visitors", async () => {
    staff.mockReturnValue(false);
    const { container } = render((await StaffEditLink({ collection: "newsPosts", id: "n1", from: "/en/news/x" })) ?? <></>);
    expect(container.innerHTML).toBe("");
  });
});
```

- [ ] **Step 2:** Run — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `components/cms/staff-edit-link.tsx`:

```tsx
import "server-only";
import { Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getActor, isStaff } from "@/lib/authz";
import { documentEditHref } from "@/lib/cms/edit-links";

/** Staff-only "Edit" button at the top of a content page (editor-experience spec §3.1). */
export async function StaffEditLink({ collection, id, from }: { collection: string; id: string; from: string }) {
  if (!id || !isStaff(await getActor())) return null;
  const t = await getTranslations("blocks");
  return (
    <a
      href={documentEditHref(collection, id, from)}
      className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-ccm-sea/30 bg-white px-3 py-1 text-sm font-semibold text-ccm-sea hover:bg-ccm-sea/5"
    >
      <Pencil className="size-3.5" aria-hidden="true" />
      {t("editPage")}
    </a>
  );
}
```

Messages (`blocks.editPage`): en "Edit this page", es "Editar esta página", fr "Modifier cette page", ar "تعديل هذه الصفحة".
In each of the five pages, render `<StaffEditLink collection="…" id={…} from={\`/${locale}/…/${slug}\`} />` as the first child of the page's outermost returned element (paths: `/news/${slug}`, `/lived-experiences/${slug}`, `/research-and-action/case-studies/${slug}`, `/research-and-action/research-outputs/${slug}`, `/collaborate/events/${slug}`).

- [ ] **Step 4:** Run — Expected: PASS. tsc; eslint changed files.
- [ ] **Step 5: Rendered check:** each of the five pages loads 200 for a visitor with no "Edit" button (curl + grep the HTML for `/admin/collections/` → absent).
- [ ] **Step 6:** Full suite; **Commit** — `feat(cms): staff get an Edit button on news, stories, case studies, outputs and events`.

---

### Task 5: One "Waiting for review" queue on `/moderation`

**Files:** Create `lib/moderation/review-items.ts` (pure), `lib/moderation/review-queue.ts` (server), `lib/actions/review.ts` (server action), `components/moderation/review-list.tsx` (client); Modify `app/[locale]/(main)/moderation/page.tsx`, `components/comments/moderation-queue.tsx` (new first tab), `app/api/me/role/route.ts` (count), `components/staff-nav.tsx` (badge), messages ×4; Test `lib/__tests__/review-items.test.ts`, `lib/__tests__/review-action.test.ts`

**Interfaces:** Produces `type ReviewItem`; `toSubmissionItem(collection: ModeratedCollection, doc: Record<string, unknown>, locale: string): ReviewItem`; `commentItem(c: QueueItem): ReviewItem`; `mergeReviewItems(...lists: ReviewItem[][]): ReviewItem[]`; `getReviewQueue(locale: string): Promise<ReviewItem[]>`; `getReviewCount(): Promise<number>`; `reviewSubmission(input: { collection: string; id: string; action: string; reviewNotes?: string }): Promise<{ ok: boolean; error?: string }>`.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/review-items.test.ts
import { describe, expect, it } from "vitest";
import { commentItem, mergeReviewItems, toSubmissionItem } from "@/lib/moderation/review-items";

describe("review items", () => {
  it("shows a submission in the reader's language, falling back to English", () => {
    const item = toSubmissionItem("caseStudies", { id: "c1", title: { en: "Drought", fr: "Sécheresse" }, summary: { en: "Short" }, coverImage: { url: "/m/c.jpg" }, submittedBy: { name: "Ana" }, createdAt: "2026-09-01T00:00:00.000Z" }, "fr");
    expect(item).toMatchObject({ kind: "submission", collection: "caseStudies", id: "c1", title: "Sécheresse", summary: "Short", imageUrl: "/m/c.jpg", sender: "Ana", adminHref: "/admin/collections/caseStudies/c1" });
    expect(item.kind === "submission" && item.actions).toEqual(["approve", "revision", "reject"]);
  });
  it("still renders with no title in any language, no picture and no sender", () => {
    const item = toSubmissionItem("events", { id: "e1", createdAt: "2026-09-02T00:00:00.000Z" }, "ar");
    expect(item).toMatchObject({ title: "(untitled)", imageUrl: null, sender: null, summary: null });
  });
  it("lists everything newest first", () => {
    const a = toSubmissionItem("events", { id: "e1", title: "A", createdAt: "2026-09-01T00:00:00.000Z" }, "en");
    const b = commentItem({ id: "k1", targetType: "page", targetId: "x", authorName: null, authorId: null, body: "hi", createdAt: "2026-09-03T00:00:00.000Z", reason: null, reportCount: 0 });
    const c = toSubmissionItem("caseStudies", { id: "c1", title: "C", createdAt: "2026-09-02T00:00:00.000Z" }, "en");
    expect(mergeReviewItems([a, c], [b]).map((i) => i.key)).toEqual(["comment:k1", "caseStudies:c1", "events:e1"]);
  });
});
```

```ts
// lib/__tests__/review-action.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
const run = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("@/payload/components/moderation-actions-server", () => ({ runModerationAction: (i: unknown) => run(i) }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
import { reviewSubmission } from "@/lib/actions/review";
beforeEach(() => { staff.mockReset(); run.mockReset(); });

describe("reviewing a submission from the site", () => {
  it("refuses anyone who isn't staff", async () => {
    staff.mockReturnValue(false);
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "approve" })).toEqual({ ok: false, error: "Only the team can review submissions." });
    expect(run).not.toHaveBeenCalled();
  });
  it("uses the same moderation action as the admin buttons", async () => {
    staff.mockReturnValue(true);
    run.mockResolvedValue({ ok: true, message: "done", status: "approved" });
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "reject", reviewNotes: "Duplicate" })).toEqual({ ok: true });
    expect(run).toHaveBeenCalledWith({ collection: "events", id: "e1", action: "reject", reviewNotes: "Duplicate" });
  });
  it("passes the workflow's own refusal through", async () => {
    staff.mockReturnValue(true);
    run.mockResolvedValue({ ok: false, error: "Reject needs a note." });
    expect(await reviewSubmission({ collection: "events", id: "e1", action: "reject" })).toEqual({ ok: false, error: "Reject needs a note." });
  });
});
```

- [ ] **Step 2:** Run both — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement.**

`lib/moderation/review-items.ts`:

```ts
/** The site's "Waiting for review" list: submissions and held comments in one shape. Pure. */
import { MODERATION_WORKFLOWS, type ModeratedCollection, type ModerationAction } from "@/payload/moderation/workflows";
import type { QueueItem } from "@/lib/comments/moderation-queue";

export type ReviewItem =
  | {
      kind: "submission";
      key: string;
      collection: ModeratedCollection;
      id: string;
      title: string;
      summary: string | null;
      imageUrl: string | null;
      sender: string | null;
      createdAt: string;
      actions: ModerationAction[];
      notesRequired: ModerationAction[];
      adminHref: string;
    }
  | { kind: "comment"; key: string; comment: QueueItem; createdAt: string };

type Row = Record<string, unknown>;
const isRow = (v: unknown): v is Row => typeof v === "object" && v !== null && !Array.isArray(v);

function text(v: unknown, locale: string): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (isRow(v)) return text(v[locale], locale) ?? text(v.en, "en");
  return null;
}

function imageOf(doc: Row): string | null {
  for (const key of ["coverImage", "image", "thumbnail"]) {
    const v = doc[key];
    const url = isRow(v) ? (typeof v.url === "string" ? v.url : isRow(v.asset) && typeof v.asset.url === "string" ? v.asset.url : null) : null;
    if (url) return url;
  }
  return null;
}

function senderOf(doc: Row): string | null {
  const by = doc.submittedBy;
  if (isRow(by)) return text(by.name, "en") ?? text(by.email, "en");
  return text(by, "en") ?? text(doc.submitterName, "en");
}

export function toSubmissionItem(collection: ModeratedCollection, doc: Row, locale: string): ReviewItem {
  const workflow = MODERATION_WORKFLOWS[collection];
  const actions = (Object.keys(workflow.actions) as ModerationAction[]).filter((a) => workflow.actions[a].visibleWhen.includes("pending"));
  const id = String(doc.id ?? "");
  return {
    kind: "submission",
    key: `${collection}:${id}`,
    collection,
    id,
    title: text(doc.title, locale) ?? "(untitled)",
    summary: text(doc.summary, locale) ?? text(doc.description, locale) ?? text(doc.excerpt, locale),
    imageUrl: imageOf(doc),
    sender: senderOf(doc),
    createdAt: typeof doc.createdAt === "string" ? doc.createdAt : new Date(0).toISOString(),
    actions,
    notesRequired: actions.filter((a) => workflow.actions[a].requiresNotes),
    adminHref: `/admin/collections/${collection}/${encodeURIComponent(id)}`,
  };
}

export function commentItem(comment: QueueItem): ReviewItem {
  return { kind: "comment", key: `comment:${comment.id}`, comment, createdAt: comment.createdAt };
}

export function mergeReviewItems(...lists: ReviewItem[][]): ReviewItem[] {
  return lists.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}
```

`lib/moderation/review-queue.ts`:

```ts
import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { MODERATED_COLLECTIONS } from "@/payload/moderation/workflows";
import { getQueue, getQueueCounts } from "@/lib/comments/moderation-queue";
import { commentItem, mergeReviewItems, toSubmissionItem, type ReviewItem } from "./review-items";

/** Everything waiting for a decision: pending submissions + held and flagged comments. */
export async function getReviewQueue(locale: string): Promise<ReviewItem[]> {
  const payload = await getPayload({ config });
  const submissions = await Promise.all(
    MODERATED_COLLECTIONS.map(async (collection) => {
      const res = await payload
        .find({ collection, where: { moderationStatus: { equals: "pending" } }, locale: "all", depth: 1, limit: 50, sort: "-createdAt", overrideAccess: true, draft: true })
        .catch(() => ({ docs: [] }));
      return (res.docs as Record<string, unknown>[]).map((d) => toSubmissionItem(collection, d, locale));
    }),
  );
  const [held, flagged] = await Promise.all([getQueue("pending"), getQueue("flagged")]);
  return mergeReviewItems(...submissions, [...held, ...flagged].map(commentItem));
}

export async function getReviewCount(): Promise<number> {
  const payload = await getPayload({ config });
  const counts = await Promise.all(
    MODERATED_COLLECTIONS.map((collection) =>
      payload.count({ collection, where: { moderationStatus: { equals: "pending" } }, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0),
    ),
  );
  const comments = await getQueueCounts();
  return counts.reduce((a, b) => a + b, 0) + comments.pending + comments.flagged;
}
```

`lib/actions/review.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { getActor, isStaff } from "@/lib/authz";
import { runModerationAction } from "@/payload/components/moderation-actions-server";

/** Approve / ask for changes / reject from the site's queue — the admin buttons' own action. */
export async function reviewSubmission(input: { collection: string; id: string; action: string; reviewNotes?: string }): Promise<{ ok: boolean; error?: string }> {
  if (!isStaff(await getActor())) return { ok: false, error: "Only the team can review submissions." };
  const res = await runModerationAction(input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/[locale]/moderation", "page");
  return { ok: true };
}
```

`components/moderation/review-list.tsx` (client): for each item, a `Card` like the comment cards in `moderation-queue.tsx`. Submission card: type badge `t(\`types.${collection}\`)`, `<bdi>` sender or `t("unknownSender")`, `<RelativeTime date={createdAt} />`, title (`dir="auto"`, font-semibold), summary (line-clamp-3), `imageUrl` thumbnail (`<img>` 64×64 rounded, `alt=""`), buttons: **Approve** (`action: "approve"`), **Ask for changes** (`"revision"`), **Reject** (`"reject"`, destructive), and an **Open in the admin** link to `adminHref`. Clicking an action in `notesRequired` reveals a note box under the card with preset chips (`t("presets.moreDetail")`, `presets.offTopic`, `presets.duplicate`, `presets.consent`) that fill the textarea, and a **Send** button disabled until the note is non-empty; then `reviewSubmission({ collection, id, action, reviewNotes })`. Comment card: the existing comment card markup with **Approve** (`approveComment`) and **Remove** (`removeComment`). Same `useTransition` + `toast` + `router.refresh()` + `done` set pattern as `ModerationQueue`.

`moderation-queue.tsx`: export `type ModerationTab = QueueTab | "review"` and use it for the `tab` prop; `"review"` goes first in `TABS` (`labelKey: "tabReview"`); when `tab === "review"` render `<ReviewList items={reviewItems} />` instead of the comment list; new props `reviewItems?: ReviewItem[]`, `counts` gains `review`. `moderation/page.tsx`: default tab `"review"` (`rawTab` other than flagged/reported/pending → review); when review, `const reviewItems = await getReviewQueue(locale)`; `counts.review = reviewItems.length`.

`app/api/me/role/route.ts`: return `{ isStaff, reviewCount: isStaff ? await getReviewCount() : 0 }`. `staff-nav.tsx`: type `{ isStaff: boolean; reviewCount?: number }`; after the Moderation label render `{data.reviewCount ? <span className="ms-auto rounded-full bg-ccm-gold px-1.5 text-xs font-bold text-ccm-midnight group-data-[collapsible=icon]:hidden">{data.reviewCount}</span> : null}`.

Messages under `moderation.queue` (en / es / fr / ar):
- `tabReview`: "Waiting for review" / "Pendiente de revisión" / "En attente de relecture" / "بانتظار المراجعة"
- `askChanges`: "Ask for changes" / "Pedir cambios" / "Demander des modifications" / "طلب تعديلات"
- `reject`: "Reject" / "Rechazar" / "Refuser" / "رفض"
- `openInAdmin`: "Open in the admin" / "Abrir en el administrador" / "Ouvrir dans l'administration" / "فتح في لوحة الإدارة"
- `note`: "Note to the sender" / "Nota para quien lo envió" / "Note pour l'expéditeur" / "ملاحظة للمرسل"
- `send`: "Send" / "Enviar" / "Envoyer" / "إرسال"
- `unknownSender`: "Unknown sender" / "Remitente desconocido" / "Expéditeur inconnu" / "مرسل غير معروف"
- `presets.moreDetail`: "Please add more detail." / "Por favor, añade más detalles." / "Merci d'ajouter plus de détails." / "يرجى إضافة مزيد من التفاصيل."
- `presets.offTopic`: "This is outside the hub's focus." / "Esto está fuera del enfoque del hub." / "Ceci sort du champ du hub." / "هذا خارج نطاق اهتمام المنصة."
- `presets.duplicate`: "This has already been shared." / "Esto ya se ha compartido." / "Ceci a déjà été partagé." / "تمت مشاركة هذا من قبل."
- `presets.consent`: "Please confirm you have consent to share this." / "Confirma que tienes consentimiento para compartir esto." / "Merci de confirmer que vous avez le consentement pour partager ceci." / "يرجى تأكيد حصولك على الموافقة لمشاركة هذا."
- `types.caseStudies`: "Case study" / "Estudio de caso" / "Étude de cas" / "دراسة حالة"; `types.events`: "Event" / "Evento" / "Événement" / "فعالية"; `types.livedExperiences`: "Lived experience" / "Experiencia vivida" / "Expérience vécue" / "تجربة معاشة"; `types.researchOutputs`: "Research output" / "Resultado de investigación" / "Résultat de recherche" / "مخرج بحثي"
- `types.comment`: "Comment" / "Comentario" / "Commentaire" / "تعليق"

- [ ] **Step 4:** Run both tests — Expected: PASS. Run the suite's moderation/comment tests; fix any test that asserted the old default tab.
- [ ] **Step 5: Rendered check** (dev; create one pending event through Local API if the dev DB has none, with a script under the workspace that asserts the lucky-waterfall host): as staff `/en/moderation` opens on "Waiting for review" with that event and any held comments, newest first; Reject without a note is impossible (Send disabled); Ask for changes with a preset → toast, row disappears, the admin shows `moderationStatus: revision` with the note; Arabic `/ar/moderation` reads RTL; 375px no overflow. If staff sign-in isn't available to the browser, verify with the Local API that the status and note changed after calling the action through a staff-authenticated request, and ledger the owed visual check.
- [ ] **Step 6:** Full suite; **Commit** — `feat(moderation): one "Waiting for review" queue for submissions and held comments`.

---

### Task 6: A friendly admin home for staff

**Files:** Create `payload/components/recent-changes.ts` (pure); Modify `payload/components/editor-dashboard.tsx`; rename nav groups in `payload/collections/*.ts`, `payload/globals/*.ts`; Test `lib/__tests__/recent-changes.test.ts`, `lib/__tests__/admin-nav-groups.test.ts`

**Interfaces:** Produces `latestChanges(items: Array<{ label: string; href: string; updatedAt: string; kind: string }>, n: number)` (newest first, `n` items).

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/recent-changes.test.ts
import { describe, expect, it } from "vitest";
import { latestChanges } from "@/payload/components/recent-changes";

describe("recent changes", () => {
  it("lists the newest edits first, up to n", () => {
    const items = [
      { label: "About", href: "/admin/collections/pages/a", updatedAt: "2026-09-01T00:00:00.000Z", kind: "Page" },
      { label: "Homepage", href: "/admin/globals/homepage", updatedAt: "2026-09-03T00:00:00.000Z", kind: "Homepage" },
      { label: "Oceania", href: "/admin/collections/regionalCommunities/o", updatedAt: "2026-09-02T00:00:00.000Z", kind: "Community" },
    ];
    expect(latestChanges(items, 2).map((i) => i.label)).toEqual(["Homepage", "Oceania"]);
  });
});
```

```ts
// lib/__tests__/admin-nav-groups.test.ts
import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("admin menu groups", () => {
  it("uses the four plain groups (plus Media)", async () => {
    const c = await config;
    const groups = new Set([...c.collections, ...(c.globals ?? [])].map((x) => x.admin?.group).filter((g): g is string => typeof g === "string"));
    expect([...groups].sort()).toEqual(["Hub content", "Media", "People & organisations", "Settings", "Site pages"]);
  });
});
```

- [ ] **Step 2:** Run — Expected: FAIL (module missing; groups include Publish, People & places, Tags & vocabularies, Onboarding, System).
- [ ] **Step 3: Implement.**
  - Groups: `rg -l 'group: "Publish"' payload | xargs sed -i '' 's/group: "Publish"/group: "Hub content"/'`; same for `"People & places"` → `"People & organisations"`, and `"Tags & vocabularies"`, `"Onboarding"`, `"System"` → `"Settings"`.
  - `payload/components/recent-changes.ts`:

```ts
export type Change = { label: string; href: string; updatedAt: string; kind: string };
export function latestChanges(items: Change[], n: number): Change[] {
  return [...items].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, n);
}
```

  - `editor-dashboard.tsx`: accept `{ user }` (Payload passes `user` in server props). For `community_editor` users, return `<LeadHome user={user} />` (added in Task 8 — until then return `null` for them). For staff, keep the existing review panel but point its heading link to the site queue (`/en/moderation`), and add above it a shortcut row of cards: **Edit the homepage** (`/admin/globals/homepage`), **Pages** (`/admin/collections/pages`), **Communities** (`/admin/collections/regionalCommunities`), **Waiting for review (n)** (`/en/moderation`); and below it **Recent changes**: `payload.find` on `pages` (`select: { title: true, updatedAt: true }`, `sort: "-updatedAt"`, `limit: 5`, `draft: true`, `locale: "en"`, `overrideAccess: true`), the same on `regionalCommunities` (`name`), and `payload.findGlobal({ slug: "homepage", draft: true, depth: 0 })`; map to `Change`s (kinds "Page", "Community", "Homepage"), `latestChanges(all, 8)`, rendered as a list "{kind} · {label} — {relative date}" linking to `href`. Relative date via `Intl.RelativeTimeFormat("en", { numeric: "auto" })` in days.
  - Ruling carried from the spec: "who" made each change is not recorded by Payload today, so Recent changes shows what and when only.
- [ ] **Step 4:** Run tests — Expected: PASS. `/admin` 200; fix any collection test asserting an old group name.
- [ ] **Step 5: Rendered check** (signed-in or owed): the admin home shows the four shortcut cards, the review count, and Recent changes with About/Oceania/Homepage; the left menu shows Site pages · Hub content · People & organisations · Media · Settings.
- [ ] **Step 6:** Full suite; **Commit** — `feat(cms): a friendly admin home — shortcuts, review count, recent changes`.

---

### Task 7: Community leads — access on the server

**Files:** Create `payload/access/leads.ts` (pure), `payload/hooks/sync-lead-roles.ts`; Modify `payload/access/index.ts` (re-export), `payload/auth/clerk-strategy.ts`, `payload/collections/users.ts` (`access.admin`), `payload/collections/regional-communities.ts` (field + access + hook), `payload/collections/media.ts` (`create`), `payload.config.ts` (hide the menu from leads); migration `<ts>_community_leads`; Test `lib/__tests__/community-leads-access.test.ts`

**Interfaces:** Produces `isLead(user: unknown): boolean`; `mayUseAdmin(user: unknown): boolean`; `leadOf(user: unknown): string | null` (the user's Clerk id when a lead); `communityRead: Access`; `communityUpdate: Access`; `staffOnlyField: FieldAccess` (= `isEditorField`); `nextRole(current: string, leadsCount: number): string`; `hideFromLeads<T extends { admin?: { hidden?: unknown } }>(c: T): T`. Field `leadIds` (text, `hasMany: true`) on `regionalCommunities`.

- [ ] **Step 1: Failing tests**

```ts
import { describe, expect, it } from "vitest";
import { communityRead, communityUpdate, hideFromLeads, isLead, mayUseAdmin, nextRole } from "@/payload/access/leads";
import config from "@payload-config";

const lead = { role: "community_editor", clerkId: "u_lead" };
const staff = { role: "team_editor", clerkId: "u_staff" };
const member = { role: "community_member", clerkId: "u_m" };
const req = (user: unknown) => ({ req: { user } }) as never;

describe("community leads", () => {
  it("lets leads and staff into the admin, nobody else", () => {
    expect([mayUseAdmin(lead), mayUseAdmin(staff), mayUseAdmin({ role: "admin" }), mayUseAdmin(member), mayUseAdmin(null)]).toEqual([true, true, true, false, false]);
    expect(isLead(lead)).toBe(true);
    expect(isLead(staff)).toBe(false);
  });
  it("lets a lead read and edit only the communities they lead", () => {
    expect(communityUpdate(req(lead))).toEqual({ leadIds: { in: ["u_lead"] } });
    expect(communityRead(req(lead))).toEqual({ or: [{ _status: { equals: "published" } }, { leadIds: { in: ["u_lead"] } }] });
    expect(communityUpdate(req(staff))).toBe(true);
    expect(communityUpdate(req(member))).toBe(false);
    expect(communityRead(req(member))).toEqual({ _status: { equals: "published" } });
  });
  it("gives the lead role while someone leads anything, and never demotes staff", () => {
    expect(nextRole("community_member", 1)).toBe("community_editor");
    expect(nextRole("community_editor", 1)).toBe("community_editor");
    expect(nextRole("community_editor", 0)).toBe("community_member");
    expect(nextRole("team_editor", 0)).toBe("team_editor");
    expect(nextRole("admin", 3)).toBe("admin");
  });
  it("hides every other admin entry from leads", () => {
    const hidden = hideFromLeads({ slug: "pages", admin: {} }).admin.hidden as (a: { user: unknown }) => boolean;
    expect(hidden({ user: lead })).toBe(true);
    expect(hidden({ user: staff })).toBe(false);
    const kept = hideFromLeads({ slug: "x", admin: { hidden: true } }).admin.hidden as (a: { user: unknown }) => boolean;
    expect(kept({ user: staff })).toBe(true);
  });
  it("keeps members, page address, region and leads staff-only on the record", async () => {
    const rc = (await config).collections.find((c) => c.slug === "regionalCommunities")!;
    const byName = (fields: unknown[]): Record<string, { access?: { update?: (a: unknown) => boolean } }> =>
      Object.fromEntries(
        (fields as Array<Record<string, unknown>>).flatMap((f) =>
          "name" in f ? [[f.name as string, f]] : Array.isArray(f.fields) ? Object.entries(byName(f.fields as unknown[])) : [],
        ),
      );
    const fields = byName(rc.fields as unknown[]);
    for (const name of ["members", "slug", "region", "leadIds"]) {
      expect(fields[name]?.access?.update?.(req(lead))).toBe(false);
      expect(fields[name]?.access?.update?.(req(staff))).toBe(true);
    }
  });
});
```

- [ ] **Step 2:** Run — Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `payload/access/leads.ts`:

```ts
import type { Access, FieldAccess } from "payload";

type U = { role?: string | null; clerkId?: string | null } | null | undefined;
const role = (user: unknown) => (user as U)?.role ?? null;

export const isLead = (user: unknown): boolean => role(user) === "community_editor";
export const mayUseAdmin = (user: unknown): boolean => ["admin", "team_editor", "community_editor"].includes(role(user) ?? "");
const isStaffUser = (user: unknown) => role(user) === "admin" || role(user) === "team_editor";

export function leadOf(user: unknown): string | null {
  return isLead(user) && typeof (user as U)?.clerkId === "string" ? ((user as U)!.clerkId as string) : null;
}

const published = { _status: { equals: "published" } };

export const communityRead: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  const id = leadOf(req.user);
  return id ? { or: [published, { leadIds: { in: [id] } }] } : published;
};

export const communityUpdate: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  const id = leadOf(req.user);
  return id ? { leadIds: { in: [id] } } : false;
};

/** Boolean on purpose — a field access returning a Where is truthy and silently opens the field. */
export const staffOnlyField: FieldAccess = ({ req }) => isStaffUser(req.user);

export function nextRole(current: string, leadsCount: number): string {
  if (current === "admin" || current === "team_editor") return current;
  return leadsCount > 0 ? "community_editor" : "community_member";
}

/** A lead sees only their community (and media) in the admin menu; server access is the real gate. */
export function hideFromLeads<T extends { admin?: { hidden?: unknown } }>(c: T): T {
  const prev = c.admin?.hidden;
  const hidden = (args: { user: unknown }) =>
    isLead(args.user) || (typeof prev === "function" ? Boolean((prev as (a: { user: unknown }) => unknown)(args)) : Boolean(prev));
  return { ...c, admin: { ...c.admin, hidden } };
}
```

  - `regional-communities.ts`: `access: { read: communityRead, readVersions: communityUpdate, update: communityUpdate, create: isEditor, delete: isEditor }`; add `access: { update: staffOnlyField }` to `members`, `region` and the slug field (spread the slugField result: `{ ...slugField("name"), access: { update: staffOnlyField } }`); add after `slugField`:

```ts
    {
      name: "leadIds",
      type: "text",
      hasMany: true,
      label: "Community leads",
      access: { update: staffOnlyField },
      admin: {
        description: "People who can edit and publish this community's page. They get access once this community is published.",
        components: { Field: "@/payload/components/lead-picker#LeadPicker" },
      },
    },
```

    (the `LeadPicker` component arrives in Task 8 — in this task register the field **without** `components` and add it in Task 8); `hooks: { afterChange: [syncLeadRoles] }`.
  - `payload/hooks/sync-lead-roles.ts`:

```ts
import type { CollectionAfterChangeHook } from "payload";
import { prisma } from "@/lib/prisma";
import { nextRole } from "@/payload/access/leads";

const ids = (v: unknown) => new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** Keeps Prisma's role in step with who leads what: added → community_editor, removed from all → member. */
export const syncLeadRoles: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  if (doc?._status !== "published") return doc;
  const now = ids(doc.leadIds);
  const before = ids(previousDoc?.leadIds);
  const changed = [...now, ...before].filter((id) => now.has(id) !== before.has(id));
  for (const userId of changed) {
    const leads = await req.payload.count({ collection: "regionalCommunities", where: { leadIds: { in: [userId] }, _status: { equals: "published" } }, overrideAccess: true, req });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user) continue;
    const role = nextRole(user.role, leads.totalDocs);
    if (role !== user.role) await prisma.user.update({ where: { id: userId }, data: { role: role as never } });
  }
  return doc;
};
```

  - `clerk-strategy.ts`: import `mayUseAdmin`; replace `if (!hasEditorRole(actor)) return { user: null };` with `if (!mayUseAdmin(actor)) return { user: null };` and update that comment's first sentence to "Create only for people who may use the admin (staff and community leads)".
  - `users.ts` `access.admin`: `({ req }) => mayUseAdmin(req.user)`.
  - `media.ts` `access.create`: `({ req }) => hasEditorRole(req.user) || isLead(req.user)`.
  - Spec §3.5 names the lead's menu entry "Your community": Payload collection labels can't vary per user, so the menu keeps "Regional communities" and the lead's admin home (Task 8) carries the "Your community" heading — ledger this as a ruling when executing.
  - `payload.config.ts`: `collections: [...].map(withPublishState).map((c) => (c.slug === "regionalCommunities" || c.slug === "media" ? c : hideFromLeads(c)))`, `globals: [...].map(withPublishState).map(hideFromLeads)`.
- [ ] **Step 4:** Run the test — Expected: PASS. `pnpm exec payload migrate:create community_leads` (dev env loaded, host check) → audit: only new `regional_communities_texts`/`_regional_communities_v_texts` (or `leadIds` columns in existing `_texts` tables); no DROP/RENAME → apply with `echo y | pnpm exec payload migrate`; `generate:types`; `/admin` 200.
- [ ] **Step 5: Server-side proof on dev** — a script in the plan workspace (asserts `lucky-waterfall`): set `leadIds: ["u_probe"]` on Oceania (Local API, overrideAccess, published) then, with `user: { role: "community_editor", clerkId: "u_probe", collection: "users" }` and `overrideAccess: false`: `find regionalCommunities` returns Oceania plus the other published ones, `update` of Oceania's `sections` succeeds, `update` of another community throws Forbidden, `update` of Oceania's `slug` leaves the slug unchanged, `find pages` with `draft: true` returns no drafts and `update` of a page throws Forbidden, `updateGlobal homepage` throws Forbidden. Then remove `u_probe`. Every expectation printed; any mismatch stops the task.
- [ ] **Step 6:** Full suite; **Commit** — `feat(cms): community leads can edit and publish only their own community`.

---

### Task 8: Leads — picking them, their home, their edit buttons

**Files:** Create `app/api/admin/members/route.ts`, `payload/components/lead-picker.tsx`, `lib/cms/can-edit-community.ts`; Modify `payload/collections/regional-communities.ts` (register the picker), `payload/components/editor-dashboard.tsx` (lead home), `lib/content/internal/payload/community.ts` + `lib/content/communities.ts` (`leadIds`), `app/[locale]/(main)/communities/[slug]/page.tsx`, `docs/migration/payload-production-runbook.md`; Test `lib/__tests__/can-edit-community.test.ts`, `lib/__tests__/admin-members-route.test.ts`

**Interfaces:** Consumes `leadIds`, `isLead`, `leadOf`. Produces `canEditCommunity(actor: Actor, leadIds: string[]): boolean`; `GET /api/admin/members?q=…|ids=a,b` → `{ members: Array<{ id: string; name: string; email: string | null }> }` (staff only; 403 otherwise).

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/can-edit-community.test.ts
import { describe, expect, it } from "vitest";
import { canEditCommunity } from "@/lib/cms/can-edit-community";

describe("who sees Edit on a community page", () => {
  it("staff always, leads only on their own community, nobody else", () => {
    expect(canEditCommunity({ id: "s", role: "team_editor" }, [])).toBe(true);
    expect(canEditCommunity({ id: "l", role: "community_editor" }, ["l"])).toBe(true);
    expect(canEditCommunity({ id: "l", role: "community_editor" }, ["other"])).toBe(false);
    expect(canEditCommunity({ id: "m", role: "community_member" }, ["m"])).toBe(false);
    expect(canEditCommunity(null, ["x"])).toBe(false);
  });
});
```

```ts
// lib/__tests__/admin-members-route.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const staff = vi.fn();
const findMany = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: async () => ({}), isStaff: () => staff() }));
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findMany: (a: unknown) => findMany(a) } } }));
import { GET } from "@/app/api/admin/members/route";
beforeEach(() => { staff.mockReset(); findMany.mockReset(); });

describe("member search for the lead picker", () => {
  it("is staff-only", async () => {
    staff.mockReturnValue(false);
    expect((await GET(new Request("http://x/api/admin/members?q=ana"))).status).toBe(403);
  });
  it("finds members by name or email, at most 10", async () => {
    staff.mockReturnValue(true);
    findMany.mockResolvedValue([{ id: "u1", firstName: "Ana", lastName: "Li", email: "ana@x.org" }]);
    const res = await GET(new Request("http://x/api/admin/members?q=ana"));
    expect(await res.json()).toEqual({ members: [{ id: "u1", name: "Ana Li", email: "ana@x.org" }] });
    expect(findMany.mock.calls[0][0]).toMatchObject({ take: 10 });
  });
  it("asks for at least two letters", async () => {
    staff.mockReturnValue(true);
    expect(await (await GET(new Request("http://x/api/admin/members?q=a"))).json()).toEqual({ members: [] });
    expect(findMany).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2:** Run both — Expected: FAIL (modules missing).
- [ ] **Step 3: Implement.**

`lib/cms/can-edit-community.ts`:

```ts
import { isStaff, type Actor } from "@/lib/authz-core";

/** Staff, or a community lead listed on this community. */
export function canEditCommunity(actor: Actor, leadIds: string[]): boolean {
  if (isStaff(actor)) return true;
  return !!actor && actor.role === "community_editor" && leadIds.includes(actor.id);
}
```

`app/api/admin/members/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const name = (u: { firstName: string | null; lastName: string | null; email: string | null }) =>
  [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Member";

/** Staff-only member lookup for the admin's lead picker. */
export async function GET(request: Request) {
  if (!isStaff(await getActor())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (ids.length === 0 && q.length < 2) return NextResponse.json({ members: [] });
  const users = await prisma.user.findMany({
    where: ids.length
      ? { id: { in: ids } }
      : { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] },
    select: { id: true, firstName: true, lastName: true, email: true },
    take: 10,
  });
  return NextResponse.json({ members: users.map((u) => ({ id: u.id, name: name(u), email: u.email })) });
}
```

`payload/components/lead-picker.tsx` (client; imports only `@payloadcms/ui` and React): `useField<string[]>({ path })` (path from props); on mount fetch `/api/admin/members?ids=${value.join(",")}` to show names; a text input that, from 2 letters, debounces 250 ms and fetches `?q=`; results as buttons "Name — email" that add the id; each current lead as a chip "Name ×" that removes it; the field's `description` shown under it; `readOnly` (from props) renders chips without controls. `setValue([...new Set([...value, id])])` / `setValue(value.filter((x) => x !== id))`. Register it on `leadIds` (`admin.components.Field: "@/payload/components/lead-picker#LeadPicker"`).

Community reader: add `leadIds: true` to `findCommunity`'s `select`, return `leadIds: Array.isArray(record.leadIds) ? record.leadIds.map(String) : []` on the community object (and its type in `lib/content/communities.ts`). `communities/[slug]/page.tsx`: `const canEdit = canEditCommunity(await getActor(), community.leadIds);`.

`editor-dashboard.tsx` lead home: when `isLead(user)`, `payload.find({ collection: "regionalCommunities", where: { leadIds: { in: [user.clerkId] } }, draft: true, depth: 0, select: { name: true, slug: true, updatedAt: true }, overrideAccess: true, locale: "en" })` → heading "Your community" (or "Your communities"), one card each: name, "Last changed {relative date}", **Edit** (`/admin/collections/regionalCommunities/<id>`) and **View on site** (`/en/communities/<slug>`).

Runbook section "2026-09-29 editing that feels natural": migration pre-check; deploy; how to make someone a lead (open the community → Community leads → search → Publish); signed-in checklist (staff: Edit from site opens the section with preview and Back link; wording; admin home; `/moderation` queue; lead: sees only Your community + Media, can publish their community, cannot open Pages/Homepage/other communities, members/address/leads read-only; removing them returns them to member).

- [ ] **Step 4:** Run both tests — Expected: PASS. `generate:importmap`; `/admin` 200; tsc; eslint changed files.
- [ ] **Step 5: Rendered check:** staff — `/admin/collections/regionalCommunities/<oceania>`: the Community leads picker finds a dev member by two letters, adds them, Publish → Prisma role becomes `community_editor` (check with a read-only query); remove → back to `community_member`. Lead session visual checks (only their community in the menu; their Edit buttons on the site) are owed to the user unless a lead Clerk session is available — ledger it.
- [ ] **Step 6:** Full suite; **Commits** — `feat(cms): staff pick community leads; leads get their own admin home and Edit buttons`, `docs(runbook): editing that feels natural`.
