# My contributions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One dashboard page — My contributions — where a member sees every case study, lived experience, research output and event they've sent, its status, the team's note and the one next step.

**Architecture:** A pure model (`lib/contributions/model.ts`) maps rows from the four Payload collections (+ case-study drafts) into one `Contribution` shape and groups them by what needs doing. A server reader reads all five sources in parallel with `queryLive`. One `ContributionRow` component renders every kind; the page, the dashboard card, the sign-in revision alert and the events page all use it.

**Tech Stack:** Next.js 16 App Router (server components), Payload 3 via `lib/content/internal/payload-source` (`queryLive`), next-intl 4 (en/es/fr/ar, Arabic RTL), Tailwind 4 container queries (`@content-md/page:`), vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-03-my-contributions-design.md` (M1–M6, M8; M7 "Part of workspace" ships with opening-collaboration Stage 2)

## Global Constraints

- No Prisma schema change and no Payload schema change (the four collections already share `submittedBy`, `moderationStatus`, `reviewNotes`).
- `submittedBy` / `caseStudyDrafts.userId` hold the **Clerk user id** (`auth().userId`).
- Statuses: `draft | pending | revision | approved | rejected`; an empty/unknown `moderationStatus` reads as `pending`.
- Reads use `queryLive` (never the cached `query`) — this is the member's own, changing state.
- One kind failing to read never breaks the page: that kind is absent and the failure is logged.
- All user-facing text in `messages/{en,es,fr,ar}.json` under `dashboard.contributions`; es/fr/ar written in full, human tone — no English copies.
- Arabic right-to-left: logical properties (`ms-`, `me-`, `start-`), `<bdi>` around titles, arrows `rtl:-scale-x-100`.
- Keep the address `/dashboard/submissions`.
- Commit messages: no AI attribution lines (CLAUDE.md).
- Run only changed files through eslint (`pnpm lint` is not green repo-wide).

## Review Focus

- A member with **no** contributions: page shows the friendly empty state with the four "Share…" links; dashboard card shows the single "Share your work" line — test in Task 2 and Task 3.
- A title missing in the page's language (Arabic page, English story): falls back to English, then any language, then "Untitled …" for that kind — test in Task 1.
- An approved item **without a slug**: no View button (never a link to `/…/undefined`) — test in Task 1.
- A rejected item: shows the team's note and **no** edit action — test in Task 2.
- One collection read throwing: the others still render — test in Task 1.

---

### Task 1: The contributions model and reader

**Files:**
- Create: `lib/contributions/model.ts`, `lib/content/internal/payload/contributions.ts`, `lib/content/contributions.ts`
- Test: `lib/__tests__/contributions-model.test.ts`, `lib/__tests__/contributions-reader.test.ts`

**Interfaces:**
- Consumes: `queryLive<T>(descriptor)` from `@/lib/content/internal/payload-source`; `outputDetailHref(type, slug)` from `@/lib/collaboration/outputs` (routes: caseStudy → `/research-and-action/case-studies`, livedExperience → `/lived-experiences`, researchOutput → `/research-and-action/research-outputs`, event → `/events`); `safe(label, fallback, fn)` from `@/lib/content/internal/safe`.
- Produces:
  ```ts
  export type ContributionKind = "caseStudy" | "livedExperience" | "researchOutput" | "event";
  export type ContributionStatus = "draft" | "pending" | "revision" | "approved" | "rejected";
  export interface Contribution { id: string; kind: ContributionKind; title: string | null; status: ContributionStatus; reviewNotes: string | null; date: string | null; href: string | null; editHref: string | null; adminHref: string }
  export const CONTRIBUTION_KINDS: readonly ContributionKind[];
  export const SECTION_ORDER: readonly ContributionStatus[]; // ["revision","draft","pending","approved","rejected"]
  export function toContribution(kind: ContributionKind, row: Record<string, unknown>, locale: string): Contribution | null;
  export function draftToContribution(row: Record<string, unknown>, locale: string): Contribution | null;
  export function groupContributions(items: Contribution[]): Array<{ status: ContributionStatus; items: Contribution[] }>;
  export function countByStatus(items: Contribution[]): Record<ContributionStatus, number>;
  export function countByKind(items: Contribution[]): Record<ContributionKind, number>;
  // lib/content/contributions.ts
  export async function listMyContributions(clerkUserId: string, locale: string): Promise<Contribution[]>;
  ```

- [ ] **Step 1: Write the failing model test**

```ts
// lib/__tests__/contributions-model.test.ts
import { describe, expect, it } from "vitest";
import { countByKind, countByStatus, draftToContribution, groupContributions, toContribution, type Contribution } from "@/lib/contributions/model";

const row = (o: Record<string, unknown> = {}) => ({ id: "s1", title: { en: "Reef day", ar: "يوم الشعاب" }, slug: "reef-day", moderationStatus: "pending", reviewNotes: null, createdAt: "2026-09-01T10:00:00.000Z", ...o });

describe("a contribution", () => {
  it("links each kind to its own edit form while it can still change", () => {
    expect(toContribution("caseStudy", row(), "en")?.editHref).toBe("/research-and-action/case-studies/submit?edit=s1");
    expect(toContribution("livedExperience", row(), "en")?.editHref).toBe("/lived-experiences/submit?edit=s1");
    expect(toContribution("researchOutput", row(), "en")?.editHref).toBe("/research-and-action/research-outputs/submit?edit=s1");
    expect(toContribution("event", row({ moderationStatus: "revision" }), "en")?.editHref).toBe("/events/suggest?edit=s1");
  });
  it("opens the public page only once approved and slugged", () => {
    expect(toContribution("event", row({ moderationStatus: "approved" }), "en")).toMatchObject({ href: "/events/reef-day", editHref: null });
    expect(toContribution("event", row({ moderationStatus: "approved", slug: null }), "en")?.href).toBeNull();
    expect(toContribution("event", row(), "en")?.href).toBeNull();
  });
  it("offers no edit once declined, but keeps the team's note", () => {
    expect(toContribution("caseStudy", row({ moderationStatus: "rejected", reviewNotes: "Out of scope." }), "en")).toMatchObject({ editHref: null, reviewNotes: "Out of scope." });
  });
  it("reads an unknown status as waiting, and picks the page's language for the title", () => {
    const c = toContribution("livedExperience", row({ moderationStatus: undefined }), "ar");
    expect(c).toMatchObject({ status: "pending", title: "يوم الشعاب" });
    expect(toContribution("livedExperience", row({ title: { fr: "Journée récif" } }), "es")?.title).toBe("Journée récif");
    expect(toContribution("livedExperience", row({ title: null }), "en")?.title).toBeNull();
  });
  it("uses the case study's sent date and points the admin at the right collection", () => {
    expect(toContribution("caseStudy", row({ submittedAt: "2026-09-02T00:00:00.000Z" }), "en")).toMatchObject({ date: "2026-09-02T00:00:00.000Z", adminHref: "/admin/collections/caseStudies/s1" });
  });
  it("turns an unsent case-study draft into a Continue item", () => {
    expect(draftToContribution({ id: "d1", title: { en: "Half done" }, lastSaved: "2026-09-03T00:00:00.000Z" }, "en")).toMatchObject({
      kind: "caseStudy", status: "draft", editHref: "/research-and-action/case-studies/submit?draft=d1", adminHref: "/admin/collections/caseStudyDrafts/d1",
    });
  });
  it("skips rows without an id", () => {
    expect(toContribution("event", row({ id: undefined }), "en")).toBeNull();
  });
});

describe("the list", () => {
  const c = (id: string, status: Contribution["status"], kind: Contribution["kind"] = "caseStudy", date = "2026-09-01T00:00:00.000Z"): Contribution => ({ id, kind, title: id, status, reviewNotes: null, date, href: null, editHref: null, adminHref: "" });
  it("puts what needs changes first, then drafts, waiting, published, declined — newest first inside each", () => {
    const groups = groupContributions([c("a", "approved"), c("b", "revision"), c("c", "pending", "event", "2026-09-01T00:00:00.000Z"), c("d", "pending", "event", "2026-09-05T00:00:00.000Z"), c("e", "rejected"), c("f", "draft")]);
    expect(groups.map((g) => [g.status, g.items.map((i) => i.id)])).toEqual([["revision", ["b"]], ["draft", ["f"]], ["pending", ["d", "c"]], ["approved", ["a"]], ["rejected", ["e"]]]);
  });
  it("counts by status and by kind", () => {
    const list = [c("a", "approved"), c("b", "revision", "event"), c("c", "revision")];
    expect(countByStatus(list)).toEqual({ draft: 0, pending: 0, revision: 2, approved: 1, rejected: 0 });
    expect(countByKind(list)).toEqual({ caseStudy: 2, livedExperience: 0, researchOutput: 0, event: 1 });
  });
});
```

- [ ] **Step 2: Run** `pnpm exec vitest run lib/__tests__/contributions-model.test.ts` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement the model**

```ts
// lib/contributions/model.ts
/**
 * Everything a member has sent to the hub, in one shape (my-contributions
 * spec, 2026-10-03). Pure — the reader feeds it Payload rows.
 */
import { outputDetailHref } from "@/lib/collaboration/outputs";

export type ContributionKind = "caseStudy" | "livedExperience" | "researchOutput" | "event";
export type ContributionStatus = "draft" | "pending" | "revision" | "approved" | "rejected";

export interface Contribution {
  id: string;
  kind: ContributionKind;
  /** In the page's language, else English, else any; null when it has none. */
  title: string | null;
  status: ContributionStatus;
  reviewNotes: string | null;
  /** When it was sent (or saved, for a draft). */
  date: string | null;
  /** The public page — approved and slugged only. */
  href: string | null;
  /** Where the member changes it — null once approved or declined. */
  editHref: string | null;
  /** The admin record, for editors. */
  adminHref: string;
}

export const CONTRIBUTION_KINDS: readonly ContributionKind[] = ["caseStudy", "livedExperience", "researchOutput", "event"];
export const SECTION_ORDER: readonly ContributionStatus[] = ["revision", "draft", "pending", "approved", "rejected"];

const COLLECTION: Record<ContributionKind, string> = {
  caseStudy: "caseStudies",
  livedExperience: "livedExperiences",
  researchOutput: "researchOutputs",
  event: "events",
};
const EDIT: Record<ContributionKind, (id: string) => string> = {
  caseStudy: (id) => `/research-and-action/case-studies/submit?edit=${encodeURIComponent(id)}`,
  livedExperience: (id) => `/lived-experiences/submit?edit=${encodeURIComponent(id)}`,
  researchOutput: (id) => `/research-and-action/research-outputs/submit?edit=${encodeURIComponent(id)}`,
  event: (id) => `/events/suggest?edit=${encodeURIComponent(id)}`,
};
const STATUSES = new Set<ContributionStatus>(["pending", "revision", "approved", "rejected"]);

const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const idOf = (v: unknown): string | null => (typeof v === "string" && v ? v : typeof v === "number" ? String(v) : null);

function pickTitle(value: unknown, locale: string): string | null {
  if (typeof value === "string") return text(value);
  if (!value || typeof value !== "object") return null;
  const arms = value as Record<string, unknown>;
  return text(arms[locale]) ?? text(arms.en) ?? Object.values(arms).map(text).find(Boolean) ?? null;
}

export function toContribution(kind: ContributionKind, row: Record<string, unknown>, locale: string): Contribution | null {
  const id = idOf(row.id);
  if (!id) return null;
  const raw = text(row.moderationStatus);
  const status: ContributionStatus = raw && STATUSES.has(raw as ContributionStatus) ? (raw as ContributionStatus) : "pending";
  const slug = text(row.slug);
  return {
    id,
    kind,
    title: pickTitle(row.title, locale),
    status,
    reviewNotes: text(row.reviewNotes),
    date: text(row.submittedAt) ?? text(row.createdAt),
    href: status === "approved" && slug ? outputDetailHref(kind, slug) : null,
    editHref: status === "pending" || status === "revision" ? EDIT[kind](id) : null,
    adminHref: `/admin/collections/${COLLECTION[kind]}/${id}`,
  };
}

/** An unsent case-study draft (`caseStudyDrafts`). */
export function draftToContribution(row: Record<string, unknown>, locale: string): Contribution | null {
  const id = idOf(row.id);
  if (!id) return null;
  return {
    id,
    kind: "caseStudy",
    title: pickTitle(row.title, locale),
    status: "draft",
    reviewNotes: null,
    date: text(row.lastSaved) ?? text(row.updatedAt),
    href: null,
    editHref: `/research-and-action/case-studies/submit?draft=${encodeURIComponent(id)}`,
    adminHref: `/admin/collections/caseStudyDrafts/${id}`,
  };
}

/** Sections in the order of what needs doing; newest first inside each; empty sections left out. */
export function groupContributions(items: Contribution[]): Array<{ status: ContributionStatus; items: Contribution[] }> {
  return SECTION_ORDER.map((status) => ({
    status,
    items: items.filter((i) => i.status === status).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  })).filter((g) => g.items.length > 0);
}

export function countByStatus(items: Contribution[]): Record<ContributionStatus, number> {
  const out: Record<ContributionStatus, number> = { draft: 0, pending: 0, revision: 0, approved: 0, rejected: 0 };
  for (const i of items) out[i.status] += 1;
  return out;
}

export function countByKind(items: Contribution[]): Record<ContributionKind, number> {
  const out: Record<ContributionKind, number> = { caseStudy: 0, livedExperience: 0, researchOutput: 0, event: 0 };
  for (const i of items) out[i.kind] += 1;
  return out;
}
```

- [ ] **Step 4: Run** the model test — Expected: PASS.

- [ ] **Step 5: Write the failing reader test**

```ts
// lib/__tests__/contributions-reader.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const queryLive = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ queryLive: (d: unknown) => queryLive(d) }));
import { readMyContributions } from "@/lib/content/internal/payload/contributions";

beforeEach(() => queryLive.mockReset());

describe("reading a member's contributions", () => {
  it("asks each collection for the member's own rows, and drafts by their owner", async () => {
    queryLive.mockResolvedValue({ docs: [] });
    await readMyContributions("user_1", "en");
    const calls = queryLive.mock.calls.map(([d]) => d as { collection: string; where: unknown });
    expect(calls.map((c) => c.collection).sort()).toEqual(["caseStudies", "caseStudyDrafts", "events", "livedExperiences", "researchOutputs"]);
    for (const c of calls.filter((c) => c.collection !== "caseStudyDrafts")) expect(c.where).toEqual({ submittedBy: { equals: "user_1" } });
    expect(calls.find((c) => c.collection === "caseStudyDrafts")?.where).toEqual({ userId: { equals: "user_1" } });
  });
  it("keeps the other kinds when one read fails", async () => {
    queryLive.mockImplementation(async (d: { collection: string }) => {
      if (d.collection === "events") throw new Error("down");
      return { docs: d.collection === "livedExperiences" ? [{ id: "l1", title: { en: "Story" }, moderationStatus: "revision" }] : [] };
    });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const list = await readMyContributions("user_1", "en");
    expect(list.map((c) => [c.kind, c.id, c.status])).toEqual([["livedExperience", "l1", "revision"]]);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

- [ ] **Step 6: Run** it — Expected: FAIL (module not found).

- [ ] **Step 7: Implement the reader and the facade**

```ts
// lib/content/internal/payload/contributions.ts
import "server-only";
import { queryLive } from "@/lib/content/internal/payload-source";
import { draftToContribution, toContribution, type Contribution, type ContributionKind } from "@/lib/contributions/model";

type Row = Record<string, unknown>;
const SOURCES: Array<{ kind: ContributionKind; collection: "caseStudies" | "livedExperiences" | "researchOutputs" | "events" }> = [
  { kind: "caseStudy", collection: "caseStudies" },
  { kind: "livedExperience", collection: "livedExperiences" },
  { kind: "researchOutput", collection: "researchOutputs" },
  { kind: "event", collection: "events" },
];
const SELECT = { title: true, slug: true, moderationStatus: true, reviewNotes: true, createdAt: true } as const;

/** One kind's rows; a failure is logged and leaves that kind out. */
async function rows(collection: string, where: Row, select: Record<string, true>): Promise<Row[]> {
  try {
    const result = await queryLive<{ docs?: Row[] }>({ type: "find", collection: collection as never, where: where as never, pagination: false, locale: "all", depth: 0, select: select as never });
    return result?.docs ?? [];
  } catch (error) {
    console.error(`[my-contributions] ${collection} read failed`, error);
    return [];
  }
}

export async function readMyContributions(clerkUserId: string, locale: string): Promise<Contribution[]> {
  const [sent, drafts] = await Promise.all([
    Promise.all(
      SOURCES.map(async ({ kind, collection }) =>
        (await rows(collection, { submittedBy: { equals: clerkUserId } }, kind === "caseStudy" ? { ...SELECT, submittedAt: true } : SELECT))
          .map((r) => toContribution(kind, r, locale)),
      ),
    ),
    rows("caseStudyDrafts", { userId: { equals: clerkUserId } }, { title: true, lastSaved: true, updatedAt: true }),
  ]);
  return [...sent.flat(), ...drafts.map((r) => draftToContribution(r, locale))].filter((c): c is Contribution => c !== null);
}
```

```ts
// lib/content/contributions.ts
import "server-only";
import { safe } from "@/lib/content/internal/safe";
import { readMyContributions } from "@/lib/content/internal/payload/contributions";
import type { Contribution } from "@/lib/contributions/model";

/** Everything the signed-in member has sent, any kind (my-contributions spec). */
export async function listMyContributions(clerkUserId: string, locale: string): Promise<Contribution[]> {
  return safe("my-contributions", [] as Contribution[], () => readMyContributions(clerkUserId, locale));
}
```

- [ ] **Step 8: Run** both tests, `pnpm exec tsc --noEmit -p .`, eslint on the five files — Expected: PASS / clean.

- [ ] **Step 9: Commit** — `feat(dashboard): read everything a member has sent, in one shape`

---

### Task 2: The row and the My contributions page

**Files:**
- Create: `components/contributions/contribution-row.tsx`, `components/contributions/status-tone.ts`
- Modify: `app/[locale]/(main)/dashboard/submissions/page.tsx` (rewrite), `messages/{en,es,fr,ar}.json` (`dashboard.contributions`), `components/events/your-suggestions.tsx` (import `STATUS_TONE` from the new module instead of its local `TONE`)
- Delete: `components/dashboard/user-submissions-dashboard.tsx` once nothing imports it (`rg -l user-submissions-dashboard`)
- Test: `components/contributions/__tests__/contribution-row.test.tsx`

**Interfaces:**
- Consumes: Task 1 `Contribution`, `groupContributions`, `countByKind`, `CONTRIBUTION_KINDS`, `listMyContributions`; `TYPE_STYLE` from `@/lib/cards/type-style` (`caseStudy`, `livedExperience`, `researchOutput`, `event` each have `color`, `labelKey`); `RelativeTime` from `@/components/ui/relative-time`; `FilterChip` from `@/components/ui/filter-chip` (`label`, `count`, `active`, `onClick`); `isStaff(actor)` / `getActor()` from `@/lib/authz`.
- Produces: `ContributionRow({ item, showAdmin }: { item: Contribution; showAdmin?: boolean })` (client); `STATUS_TONE: Record<ContributionStatus, string>`.

- [ ] **Step 1: Messages (en shown; write es/fr/ar in full)**

```json
"contributions": {
  "title": "My contributions",
  "intro": "Everything you've shared with the hub — what happened to it, and what's next.",
  "sections": { "revision": "Needs your changes", "draft": "Drafts", "pending": "Waiting for review", "approved": "Published", "rejected": "Not accepted" },
  "kinds": { "all": "All", "caseStudy": "Case studies", "livedExperience": "Lived experiences", "researchOutput": "Research outputs", "event": "Events" },
  "kind": { "caseStudy": "Case study", "livedExperience": "Lived experience", "researchOutput": "Research output", "event": "Event" },
  "untitled": { "caseStudy": "Untitled case study", "livedExperience": "Untitled story", "researchOutput": "Untitled research output", "event": "Untitled event" },
  "status": { "draft": "Draft", "pending": "Waiting", "revision": "Needs changes", "approved": "Published", "rejected": "Not accepted" },
  "sent": "Sent {when}",
  "saved": "Saved {when}",
  "teamNote": "From the team",
  "actions": { "continue": "Continue", "makeChanges": "Make changes", "edit": "Edit", "view": "View", "openInAdmin": "Open in admin" },
  "empty": { "title": "Nothing shared yet", "body": "When you share a case study, a story, research or an event, you'll follow it here." },
  "share": { "caseStudy": "Share a case study", "livedExperience": "Share your story", "researchOutput": "Share research", "event": "Suggest an event" }
}
```

Place it under the existing `dashboard` object. Run `python3 -c "import json;[json.load(open(f'messages/{l}.json')) for l in ['en','es','fr','ar']]"` to confirm valid JSON.

- [ ] **Step 2: Write the failing row test**

```tsx
// components/contributions/__tests__/contribution-row.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
import type { Contribution } from "@/lib/contributions/model";
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
import { ContributionRow } from "@/components/contributions/contribution-row";

const item = (o: Partial<Contribution> = {}): Contribution => ({ id: "s1", kind: "livedExperience", title: "Living with the rising tide", status: "pending", reviewNotes: null, date: "2026-09-01T00:00:00.000Z", href: null, editHref: "/lived-experiences/submit?edit=s1", adminHref: "/admin/collections/livedExperiences/s1", ...o });
const show = (i: Contribution, showAdmin = false) => render(<NextIntlClientProvider locale="en" messages={messages}><ContributionRow item={i} showAdmin={showAdmin} /></NextIntlClientProvider>);

describe("a contribution row", () => {
  it("asks for changes with the team's note when sent back", () => {
    show(item({ status: "revision", reviewNotes: "Please add where this happened." }));
    expect(screen.getByText("Needs changes")).toBeTruthy();
    expect(screen.getByText("Please add where this happened.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Make changes/ }).getAttribute("href")).toBe("/lived-experiences/submit?edit=s1");
  });
  it("shows the note but no edit when declined", () => {
    show(item({ status: "rejected", reviewNotes: "Out of scope.", editHref: null }));
    expect(screen.getByText("Out of scope.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /Edit|Make changes/ })).toBeNull();
  });
  it("opens the public page when published, and the admin for editors", () => {
    show(item({ status: "approved", editHref: null, href: "/lived-experiences/rising-tide" }), true);
    expect(screen.getByRole("link", { name: /View/ }).getAttribute("href")).toBe("/lived-experiences/rising-tide");
    expect(screen.getByRole("link", { name: /Open in admin/ }).getAttribute("href")).toBe("/admin/collections/livedExperiences/s1");
  });
  it("names an untitled item by its kind", () => {
    show(item({ title: null }));
    expect(screen.getByText("Untitled story")).toBeTruthy();
  });
});
```

- [ ] **Step 3: Run** it — Expected: FAIL.

- [ ] **Step 4: Implement**

```ts
// components/contributions/status-tone.ts
import type { ContributionStatus } from "@/lib/contributions/model";

/** One set of status colours for every list of member content. */
export const STATUS_TONE: Record<ContributionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-ccm-amber/15 text-ccm-midnight",
  revision: "bg-ccm-sea/10 text-ccm-sea",
  approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-muted text-muted-foreground",
};
```

```tsx
// components/contributions/contribution-row.tsx
"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RelativeTime } from "@/components/ui/relative-time";
import { TYPE_STYLE } from "@/lib/cards/type-style";
import { STATUS_TONE } from "@/components/contributions/status-tone";
import type { Contribution } from "@/lib/contributions/model";
import { cn } from "@/lib/utils";

/** One thing a member sent: kind · title · when · status, the team's note, and the one next step. */
export function ContributionRow({ item, showAdmin = false }: { item: Contribution; showAdmin?: boolean }) {
  const t = useTranslations("dashboard.contributions");
  const color = TYPE_STYLE[item.kind].color;
  const action =
    item.status === "draft" ? { href: item.editHref, label: t("actions.continue") }
    : item.status === "revision" ? { href: item.editHref, label: t("actions.makeChanges") }
    : item.status === "pending" ? { href: item.editHref, label: t("actions.edit") }
    : item.status === "approved" ? { href: item.href, label: t("actions.view") }
    : null;
  const showNote = (item.status === "revision" || item.status === "rejected") && item.reviewNotes;

  return (
    <li className="space-y-2 p-4">
      <div className="flex flex-col gap-3 @content-md/page:flex-row @content-md/page:items-start @content-md/page:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em]" style={{ color }}>
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
            {t(`kind.${item.kind}`)}
          </p>
          <p className="line-clamp-2 font-semibold text-ccm-midnight">
            <bdi>{item.title ?? t(`untitled.${item.kind}`)}</bdi>
          </p>
          {item.date && (
            <p className="text-xs text-muted-foreground">
              {t.rich(item.status === "draft" ? "saved" : "sent", { when: () => <RelativeTime date={item.date!} /> })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_TONE[item.status])}>{t(`status.${item.status}`)}</span>
          {action?.href && (
            <Link href={action.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-ccm-sea hover:underline">
              {action.label}
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          )}
          {showAdmin && (
            // A plain anchor: the admin is not a locale route.
            <a href={item.adminHref} className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:underline">
              {t("actions.openInAdmin")}
            </a>
          )}
        </div>
      </div>
      {showNote && (
        <p className="rounded-lg bg-ccm-sky/15 px-3 py-2 text-sm text-ccm-midnight">
          <span className="font-semibold">{t("teamNote")}: </span>
          {item.reviewNotes}
        </p>
      )}
    </li>
  );
}
```

Note: the "Open in admin" link must not match `/View|Edit/` in the test — its label is distinct. If `t.rich` with a function component is awkward for the `{when}` placeholder, render `t("sent", { when: "" })` and append `<RelativeTime>`; keep the test passing.

- [ ] **Step 5: Run** the row test — Expected: PASS.

- [ ] **Step 6: Rewrite the page** `app/[locale]/(main)/dashboard/submissions/page.tsx`:

```tsx
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { listMyContributions } from "@/lib/content/contributions";
import { CONTRIBUTION_KINDS, countByKind, groupContributions, type ContributionKind } from "@/lib/contributions/model";
import { getActor, isStaff } from "@/lib/authz";
import { ContributionRow } from "@/components/contributions/contribution-row";
import { ContributionKindChips } from "@/components/contributions/kind-chips";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.contributions" });
  return { title: t("title"), description: t("intro") };
}

const SHARE: Record<ContributionKind, string> = {
  caseStudy: "/research-and-action/case-studies/submit",
  livedExperience: "/lived-experiences/submit",
  researchOutput: "/research-and-action/research-outputs/submit",
  event: "/events/suggest",
};

export default async function MyContributionsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ kind?: string }> }) {
  const { locale } = await params;
  const { kind } = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect({ href: "/sign-in?redirect_url=/dashboard/submissions", locale });
  const [t, all, actor] = await Promise.all([
    getTranslations({ locale, namespace: "dashboard.contributions" }),
    listMyContributions(userId!, locale),
    getActor(),
  ]);
  const chosen = CONTRIBUTION_KINDS.includes(kind as ContributionKind) ? (kind as ContributionKind) : null;
  const shown = chosen ? all.filter((c) => c.kind === chosen) : all;
  const groups = groupContributions(shown);
  const counts = countByKind(all);

  return (
    <div className="container max-w-4xl space-y-8 py-8">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-ccm-midnight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("intro")}</p>
      </header>
      {all.length === 0 ? (
        <section className="space-y-4 rounded-2xl border border-dashed border-ccm-midnight/15 bg-white p-8 text-center">
          <h2 className="font-heading text-xl font-bold text-ccm-midnight">{t("empty.title")}</h2>
          <p className="text-muted-foreground">{t("empty.body")}</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {CONTRIBUTION_KINDS.map((k) => (
              <li key={k}><Link href={SHARE[k]} className="inline-flex min-h-11 items-center font-bold text-ccm-sea hover:underline">{t(`share.${k}`)}</Link></li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <ContributionKindChips counts={counts} total={all.length} chosen={chosen} />
          {groups.map((g) => (
            <section key={g.status} aria-labelledby={`section-${g.status}`} className="space-y-3">
              <h2 id={`section-${g.status}`} className="font-heading text-xl font-bold text-ccm-midnight">{t(`sections.${g.status}`)}</h2>
              <ul className="divide-y divide-ccm-midnight/10 rounded-2xl border border-ccm-midnight/10 bg-white">
                {g.items.map((c) => <ContributionRow key={`${c.kind}:${c.id}`} item={c} showAdmin={isStaff(actor)} />)}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
```

Kind chips (client, links keep the URL shareable):

```tsx
// components/contributions/kind-chips.tsx
"use client";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FilterChip } from "@/components/ui/filter-chip";
import { CONTRIBUTION_KINDS, type ContributionKind } from "@/lib/contributions/model";

export function ContributionKindChips({ counts, total, chosen }: { counts: Record<ContributionKind, number>; total: number; chosen: ContributionKind | null }) {
  const t = useTranslations("dashboard.contributions.kinds");
  const router = useRouter();
  const pathname = usePathname();
  const go = (k: ContributionKind | null) => router.push(k ? `${pathname}?kind=${k}` : pathname, { scroll: false });
  return (
    <div role="group" aria-label={t("all")} className="flex flex-wrap gap-1.5">
      <FilterChip label={t("all")} count={total} active={chosen === null} onClick={() => go(null)} />
      {CONTRIBUTION_KINDS.filter((k) => counts[k] > 0).map((k) => (
        <FilterChip key={k} label={t(k)} count={counts[k]} active={chosen === k} onClick={() => go(chosen === k ? null : k)} />
      ))}
    </div>
  );
}
```

Add `components/contributions/kind-chips.tsx` to this task's Files. Point `your-suggestions.tsx` at `STATUS_TONE`. Delete `components/dashboard/user-submissions-dashboard.tsx` when `rg -l "user-submissions-dashboard" app components lib` returns nothing.

- [ ] **Step 7: Run** tests (row + model + reader + `components/events`), `tsc`, eslint on changed files — Expected: PASS / clean.

- [ ] **Step 8: Rendered check** (dev, Playwright, staff session). Create on the dev database (scripted, `submittedBy` = the staff user's Clerk id):
  - one lived experience in `revision` with a note;
  - one research output `pending`;
  - one event `approved` with a slug;
  - one case study `rejected`;
  - one case-study draft.

  Check `/en/dashboard/submissions` and `/ar/dashboard/submissions` at 375 and 1280:
  - sections in the order Needs your changes → Drafts → Waiting → Published → Not accepted;
  - the kind chips filter; each button's link is right; "Open in admin" for staff;
  - Arabic right-to-left; no sideways scroll; 0 console errors.

  Then delete all the test rows and reload: the empty state ("Nothing shared yet" + the four Share links) shows — provided the staff user has no real submissions on dev; if they do, note it in the ledger and check the empty state at 375 with a second dev account instead.

- [ ] **Step 9: Commit** — `feat(dashboard): My contributions — everything you've shared, what happened, what's next`

---

### Task 3: Dashboard card and the sign-in alert for every kind

**Files:**
- Create: `components/contributions/contributions-card.tsx`
- Modify: `app/[locale]/(main)/dashboard/page.tsx` (read `listMyContributions`, pass `contributionsSummary`), `app/[locale]/(main)/dashboard/page-client.tsx` (replace the "Recent submissions" block at the `{/* Recent submissions — the user's own contributions */}` comment with `<ContributionsCard … />`), `app/api/case-studies/revisions/route.ts` (all kinds), `components/submissions/revision-alert-dialog.tsx` (per-kind link + label), `messages/*.json` (`dashboard.contributions.card.*`, `dashboard.contributions.alert.*`)
- Test: `components/contributions/__tests__/contributions-card.test.tsx`, `lib/__tests__/revisions-route.test.ts`

**Interfaces:**
- Consumes: Task 1 `listMyContributions`, `countByStatus`, `Contribution`; Task 2 `ContributionRow`, messages.
- Produces: `ContributionsCard({ counts, needsChanges }: { counts: Record<ContributionStatus, number>; needsChanges: Contribution[] })`; `GET /api/case-studies/revisions` → `{ submissions: Array<{ _id: string; kind: ContributionKind; title: Record<string, string>; reviewNotes?: string; editHref: string }> }` (same `_id`/`title` keys the dialog already reads, plus `kind` and `editHref`).

- [ ] **Step 1: Messages** (en; write es/fr/ar in full) under `dashboard.contributions`:

```json
"card": { "title": "Your contributions", "needsChanges": "Needs changes", "waiting": "Waiting", "published": "Published", "drafts": "Drafts", "seeAll": "See all", "nothingYet": "Share your work — a case study, your story, research or an event.", "shareLink": "Start sharing" },
"alert": { "one": "Your {kind} “{title}” needs a few changes.", "open": "Make changes" }
```

- [ ] **Step 2: Failing card test**

```tsx
// components/contributions/__tests__/contributions-card.test.tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";
import messages from "@/messages/en.json";
vi.mock("@/i18n/navigation", () => ({ Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a> }));
import { ContributionsCard } from "@/components/contributions/contributions-card";

const zero = { draft: 0, pending: 0, revision: 0, approved: 0, rejected: 0 };
const wrap = (ui: React.ReactNode) => render(<NextIntlClientProvider locale="en" messages={messages}>{ui}</NextIntlClientProvider>);

describe("the dashboard card", () => {
  it("invites a member who has shared nothing", () => {
    wrap(<ContributionsCard counts={zero} needsChanges={[]} />);
    expect(screen.getByText(/Share your work/)).toBeTruthy();
    expect(screen.queryByText("Needs changes")).toBeNull();
  });
  it("leads with what needs changes, and links to the full list", () => {
    wrap(<ContributionsCard counts={{ ...zero, revision: 1, approved: 3 }} needsChanges={[{ id: "l1", kind: "livedExperience", title: "Rising tide", status: "revision", reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=l1", adminHref: "" }]} />);
    expect(screen.getByText("Rising tide")).toBeTruthy();
    expect(screen.getByRole("link", { name: /See all/ }).getAttribute("href")).toBe("/dashboard/submissions");
  });
});
```

- [ ] **Step 3: Run** — FAIL. **Step 4: Implement** `ContributionsCard` (client): when every count is 0 → one line `card.nothingYet` + link `card.shareLink` → `/dashboard/submissions`; otherwise a 4-cell count row (needs changes · waiting · published · drafts, needs-changes tinted `bg-ccm-sea/10` when > 0), then up to two `ContributionRow`s from `needsChanges`, then `card.seeAll` → `/dashboard/submissions`. In `dashboard/page.tsx` read `const mine = await listMyContributions(user.id, locale)` (alongside the existing reads in its `Promise.all`), pass `counts={countByStatus(mine)}` and `needsChanges={mine.filter((c) => c.status === "revision").slice(0, 2)}`; remove the `getUserContributions` call and the `contributions` prop if nothing else uses them (`rg -n "contributions" app/[locale]/(main)/dashboard`).

- [ ] **Step 5: Failing route test**

```ts
// lib/__tests__/revisions-route.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: "user_1" })) }));
const list = vi.fn();
vi.mock("@/lib/content/contributions", () => ({ listMyContributions: (...a: unknown[]) => list(...a) }));
import { GET } from "@/app/api/case-studies/revisions/route";

describe("the sign-in revision alert", () => {
  it("lists every kind that needs changes, with its own edit link", async () => {
    list.mockResolvedValue([
      { id: "l1", kind: "livedExperience", title: "Rising tide", status: "revision", reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=l1", adminHref: "" },
      { id: "c1", kind: "caseStudy", title: "Reef", status: "approved", reviewNotes: null, date: null, href: "/x", editHref: null, adminHref: "" },
    ]);
    const body = await (await GET()).json();
    expect(body.submissions).toEqual([{ _id: "l1", kind: "livedExperience", title: { en: "Rising tide" }, reviewNotes: "Add a place.", editHref: "/lived-experiences/submit?edit=l1" }]);
  });
});
```

- [ ] **Step 6: Run** — FAIL. **Step 7: Implement** the route: `const items = (await listMyContributions(userId, "en")).filter((c) => c.status === "revision" && c.editHref)`; map to `{ _id: c.id, kind: c.kind, title: { en: c.title ?? "" }, reviewNotes: c.reviewNotes ?? undefined, editHref: c.editHref }`; keep the 401/500 handling and the header comment (update "case-study" → "any kind"). In `revision-alert-dialog.tsx`, add `kind` and `editHref` to `RevisionSubmission`, link each item to its `editHref` (via `Link` from `@/i18n/navigation`) with `t("alert.open")`, and label it with `dashboard.contributions.kind.<kind>`; keep the "see all" button going to `/dashboard/submissions`.

- [ ] **Step 8: Run** tests, `tsc`, eslint changed files — PASS. **Rendered check:** dev, staff session, with the Task 2 test rows (recreate, then delete): `/en/dashboard` card counts and the needs-changes item; sign out/in (or clear `sessionStorage` `revision-alert-dismissed`) → the alert names the lived experience and its button opens its edit form. en + ar, 375/1280, 0 console errors.

- [ ] **Step 9: Commit** — `feat(dashboard): a contributions card, and the changes alert for every kind`

---

### Task 4: Events list on the shared row, and the runbook

**Files:**
- Modify: `components/events/your-suggestions.tsx` (render `ContributionRow` for each item), `app/[locale]/(main)/events/suggest/page.tsx` (pass `Contribution[]`: map `MySuggestion` → `toContribution("event", { id, title, slug, moderationStatus: status, reviewNotes, createdAt: startAt }, locale)` or read `listMyContributions` and filter `kind === "event"`), `docs/migration/payload-production-runbook.md` (section "2026-10-03 my contributions": no migration; checklist)
- Test: update `components/events/__tests__/your-suggestions.test.tsx` to the shared row's labels ("Needs changes", link "Make changes" → `/events/suggest?edit=a`, approved link "View" → `/events/coastal-walk`).

- [ ] **Step 1:** Update the test to the new labels — run — FAIL.
- [ ] **Step 2:** Implement: read `listMyContributions(userId, locale)` on the suggest page and pass `items={mine.filter((c) => c.kind === "event")}`; `YourSuggestions` keeps its heading and renders `<ul>` of `ContributionRow`. Remove `listMyEventSuggestions` from the page if unused elsewhere (`rg -n listMyEventSuggestions`), keep the reader if other callers remain.
- [ ] **Step 3:** Run the events tests + full suite (`pnpm exec vitest run`, check the log for "Failed to start"), `tsc`, eslint changed files — PASS.
- [ ] **Step 4:** Rendered check `/en/events/suggest` + `/ar/events/suggest` signed in with one event per status; 0 console errors.
- [ ] **Step 5:** Runbook section, then **Commit** — `feat(events): your suggestions use the shared contributions row` and `docs(runbook): my contributions`.
