# Project Public Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every collaboration workspace a visitor-facing public project page (hero · about · team · published outputs · open-calls) with wired Follow / Request-to-join / Message-lead CTAs, shown to non-members instead of the members-only workspace shell.

**Architecture:** The existing route `app/[locale]/(main)/collaborations/[id]/page.tsx` already authorizes `collab:read` and then always renders `WorkspaceShell` (the editing UI). We add a **branch**: if the viewer is **not a member and not staff**, render a new server component `ProjectPublicPage` instead of the shell. A new read-only service projection (`getPublicProject`) returns only public-safe fields and only **published (`approved`) outputs**. CTAs reuse existing infra: `FollowButton` (targetType `PROJECT`), the existing `requestToJoin` / `requestContact` server actions (wrapped in one new client component `ProjectCtaBar`). A MEMBERS-visibility workspace shows a gated variant of the same page (title + "Request to join" only). No schema changes.

**Tech Stack:** Next.js App Router (RSC + server actions), TypeScript, Prisma (Postgres, `@/generated/prisma`), Sanity (outputs), Clerk (`auth`), next-intl (i18n + RTL), Tailwind + CCM design tokens, shadcn `Card`/`Badge`/`Button`, vitest for unit tests.

## Global Constraints

- **No AI attribution in git commits** (CLAUDE.md) — never add `Co-Authored-By: Claude` or similar.
- **Feature flag:** the whole route is gated by `if (!FEATURES.engagement) redirect("/")` — keep that guard.
- **Design language (reuse, don't redesign):** colours via `lib/ccm-colors.ts` resolvers (`projectColor`, `intentColor`, `regionColor`) — never hard-code hex; layout via `lib/design-tokens.ts`; components from `components/ui/*` (`Card`, `Badge`, `Button`, `SectionHeader`); `Link` from `@/i18n/navigation`; wrap user text in `<bdi>` for RTL.
- **Auth boundary:** Sanity = published content; Prisma = interaction state; they join on ids already present. Public page must expose **only** public-safe fields and **only `approved` outputs**.
- **Status colours always paired with a label** (a11y); target size ≥ 44px; validate at 375px width and RTL (`ar`).
- **i18n:** all user-facing strings go through next-intl namespaces (extend `collaboration` / add `projectPublic`); no bare literals in JSX.
- **Tests:** `pnpm test` runs `vitest run`. Unit tests mock `@/lib/prisma` and `@/lib/authz` (see `lib/__tests__/follows.test.ts` for the established pattern).

---

## File Structure

**Create:**
- `lib/collaboration/public.ts` — `getPublicProject(id)` service projection (public-safe fields + published outputs only) + `PublicProject` type.
- `lib/__tests__/collaboration-public.test.ts` — unit tests for `getPublicProject`.
- `components/collaboration/project-public-page.tsx` — server component rendering the public page from a `PublicProject`.
- `components/collaboration/project-cta-bar.tsx` — client component: Follow (reuses `FollowButton`) + Request-to-join (modal) + Message-lead.
- `lib/__tests__/project-cta.test.ts` — unit tests for the request-to-join action wiring already exist for the action; this file tests the new `canRequestToJoin` pure helper.

**Modify:**
- `lib/collaboration/public.ts` — (single file; created above).
- `app/[locale]/(main)/collaborations/[id]/page.tsx` — add the non-member branch → render `ProjectPublicPage`.
- `messages/en.json` (and the other locale files) — add the `projectPublic` namespace strings.

**Reuse (do not modify):**
- `lib/actions/follows.ts` → `followTarget` / `unfollowTarget` / `isFollowing` (via `FollowButton`).
- `lib/actions/requests.ts` → `requestToJoin(collaborationId, message?)`, `requestContact(recipientId, message?)`.
- `components/follow/follow-button.tsx` → `FollowButton` (targetType `"PROJECT"`).
- `lib/collaboration/service.ts` → `getMembershipRole`, `authorizeCollab`.
- `lib/collaboration/outputs.ts` → `outputDetailHref`, `OUTPUT_TYPES`.

---

## Task 1: Public-safe projection helper (`canShowPublicProject`)

A pure predicate that decides whether a viewer should see the public page vs the workspace shell. Extracting it makes the route branch testable without mocking Next.js.

**Files:**
- Create: `lib/collaboration/public.ts`
- Test: `lib/__tests__/collaboration-public.test.ts`

**Interfaces:**
- Produces: `canShowPublicProject(input: { membershipRole: CollaborationRole | null; isStaff: boolean }): boolean` — returns `true` when the viewer is neither a member nor staff (i.e. should get the public page, not the shell).

- [ ] **Step 1: Write the failing test**

```ts
// lib/__tests__/collaboration-public.test.ts
import { describe, it, expect } from "vitest";
import { canShowPublicProject } from "@/lib/collaboration/public";

describe("canShowPublicProject", () => {
  it("shows the public page to a non-member, non-staff viewer", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: false })).toBe(true);
  });

  it("shows the workspace (not public page) to a member", () => {
    expect(canShowPublicProject({ membershipRole: "VIEWER", isStaff: false })).toBe(false);
    expect(canShowPublicProject({ membershipRole: "OWNER", isStaff: false })).toBe(false);
  });

  it("shows the workspace (not public page) to global staff", () => {
    expect(canShowPublicProject({ membershipRole: null, isStaff: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: FAIL — `canShowPublicProject` is not exported / module has no such export.

- [ ] **Step 3: Write the minimal implementation**

```ts
// lib/collaboration/public.ts
import "server-only";
import type { CollaborationRole } from "@/generated/prisma";

/**
 * Viewers who are neither a member nor global staff see the PUBLIC project
 * page instead of the workspace editing shell. Members and staff get the shell.
 */
export function canShowPublicProject(input: {
  membershipRole: CollaborationRole | null;
  isStaff: boolean;
}): boolean {
  return input.membershipRole === null && !input.isStaff;
}
```

Note: `import "server-only"` will make this module server-only; the test runs under vitest's Node environment where `server-only` is a no-op shim if configured. If vitest errors on `server-only`, drop that import from this file — the predicate is pure and does not need it (the data-loading function added in Task 2 is what truly needs server-only, and it lives in the same file, so keep `server-only` and instead add the vitest alias in Step 5 below).

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: PASS (3 tests). If it fails with a `server-only` import error, add this alias to `vitest.config.ts` under `resolve.alias`: `"server-only": new URL("./lib/__tests__/stubs/server-only.ts", import.meta.url).pathname` and create `lib/__tests__/stubs/server-only.ts` containing `export {};`. Re-run.

- [ ] **Step 5: Commit**

```bash
git add lib/collaboration/public.ts lib/__tests__/collaboration-public.test.ts
git commit -m "feat(collab): add canShowPublicProject predicate for public-page branch"
```

---

## Task 2: Public project data projection (`getPublicProject`)

Load only public-safe fields and only **published (`approved`)** outputs. Members' emails, private docs, files, drafts, and internal counts never reach this projection.

**Files:**
- Modify: `lib/collaboration/public.ts`
- Test: `lib/__tests__/collaboration-public.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma`, `safeQuery` from `@/lib/prisma`.
- Produces:
  ```ts
  export type PublicProject = {
    id: string;
    title: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "ARCHIVED"; // real CollaborationStatus enum — NOT Recruiting/Completed
    visibility: "PUBLIC" | "MEMBERS";
    lead: { id: string; name: string; username: string | null; image: string | null };
    members: { name: string; username: string | null; image: string | null; role: string }[];
    outputs: { id: string; sanityType: string; title: string; slug: string | null }[]; // approved only
    counts: { members: number; outputs: number };
  };
  export async function getPublicProject(id: string): Promise<PublicProject | null>;
  ```
- Note: `slug` is not stored on `WorkspaceOutput` today; for v1 emit `slug: null` and link output cards to the type's index route via `OUTPUT_TYPES` when slug is null (handled in Task 4). Do not invent a slug field.

- [ ] **Step 1: Write the failing test**

```ts
// append to lib/__tests__/collaboration-public.test.ts

import { vi, beforeEach } from "vitest";

const findUniqueMock = vi.fn();
const outputsFindManyMock = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    collaboration: { findUnique: (...a: any[]) => findUniqueMock(...a) },
    workspaceOutput: { findMany: (...a: any[]) => outputsFindManyMock(...a) },
  },
  safeQuery: async (fn: () => Promise<any>) => {
    try {
      return { success: true, data: await fn() };
    } catch (e) {
      return { success: false, error: e };
    }
  },
}));

// import AFTER the mock
import { getPublicProject } from "@/lib/collaboration/public";

describe("getPublicProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when the collaboration is missing", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    expect(await getPublicProject("nope")).toBeNull();
  });

  it("projects public-safe fields, lead, members, and approved-only outputs", async () => {
    findUniqueMock.mockResolvedValueOnce({
      id: "c1",
      title: "Flood recovery study",
      description: "About it",
      status: "ACTIVE",
      visibility: "PUBLIC",
      createdById: "u-lead",
      members: [
        { role: "OWNER", user: { id: "u-lead", username: "lead", firstName: "Ama", lastName: "O", image: null } },
        { role: "EDITOR", user: { id: "u2", username: "co", firstName: "Ben", lastName: null, image: null } },
      ],
      _count: { members: 2, outputs: 3 },
    });
    outputsFindManyMock.mockResolvedValueOnce([
      { id: "o1", sanityType: "caseStudy", title: "Published CS", status: "approved" },
    ]);

    const p = await getPublicProject("c1");
    expect(p).not.toBeNull();
    expect(p!.title).toBe("Flood recovery study");
    expect(p!.status).toBe("ACTIVE");
    expect(p!.lead).toEqual({ id: "u-lead", name: "Ama O", username: "lead", image: null });
    expect(p!.members).toHaveLength(2);
    // the prisma query must have filtered to approved status
    expect(outputsFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ collaborationId: "c1", status: "approved" }) })
    );
    expect(p!.outputs).toEqual([{ id: "o1", sanityType: "caseStudy", title: "Published CS", slug: null }]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: FAIL — `getPublicProject` is not exported.

- [ ] **Step 3: Write the implementation**

```ts
// append to lib/collaboration/public.ts
import { prisma, safeQuery } from "@/lib/prisma";
import type { CollaborationStatus, CollaborationVisibility } from "@/generated/prisma";

export type PublicProject = {
  id: string;
  title: string;
  description: string | null;
  status: CollaborationStatus;
  visibility: CollaborationVisibility;
  lead: { id: string; name: string; username: string | null; image: string | null };
  members: { name: string; username: string | null; image: string | null; role: string }[];
  outputs: { id: string; sanityType: string; title: string; slug: string | null }[];
  counts: { members: number; outputs: number };
};

function displayName(u: { firstName: string | null; lastName: string | null; username: string | null }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "Member";
}

/**
 * Public-safe projection of a collaboration for the visitor-facing project
 * page. Emits ONLY published (`approved`) outputs and never exposes emails,
 * private docs, or files. Returns null if the collaboration doesn't exist.
 */
export async function getPublicProject(id: string): Promise<PublicProject | null> {
  const cr = await safeQuery(() =>
    prisma.collaboration.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true, firstName: true, lastName: true, image: true } },
          },
        },
        _count: { select: { members: true, outputs: true } },
      },
    })
  );
  if (!cr.success || !cr.data) return null;
  const c = cr.data;

  const or = await safeQuery(() =>
    prisma.workspaceOutput.findMany({
      where: { collaborationId: id, status: "approved" },
      orderBy: { createdAt: "asc" },
      select: { id: true, sanityType: true, title: true },
    })
  );
  const outputs = (or.success ? or.data : []).map((o) => ({
    id: o.id,
    sanityType: o.sanityType,
    title: o.title,
    slug: null as string | null,
  }));

  const leadMember = c.members.find((m) => m.user.id === c.createdById) ?? c.members[0] ?? null;
  const lead = leadMember
    ? {
        id: leadMember.user.id,
        name: displayName(leadMember.user),
        username: leadMember.user.username,
        image: leadMember.user.image,
      }
    : { id: c.createdById, name: "Lead", username: null, image: null };

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    status: c.status,
    visibility: c.visibility,
    lead,
    members: c.members.map((m) => ({
      name: displayName(m.user),
      username: m.user.username,
      image: m.user.image,
      role: m.role,
    })),
    outputs,
    counts: { members: c._count.members, outputs: c._count.outputs },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: PASS (all tests from Task 1 + Task 2).

- [ ] **Step 5: Commit**

```bash
git add lib/collaboration/public.ts lib/__tests__/collaboration-public.test.ts
git commit -m "feat(collab): getPublicProject projection (public fields + approved outputs only)"
```

---

## Task 3: Request-to-join eligibility helper (`canRequestToJoin`)

A pure predicate for the CTA bar: only a signed-in non-member may request to join. Keeps the client component logic testable and DRY.

**Files:**
- Modify: `lib/collaboration/public.ts`
- Test: `lib/__tests__/collaboration-public.test.ts`

**Interfaces:**
- Produces: `canRequestToJoin(input: { isSignedIn: boolean; isMember: boolean }): boolean`.

- [ ] **Step 1: Write the failing test**

```ts
// append to lib/__tests__/collaboration-public.test.ts
import { canRequestToJoin } from "@/lib/collaboration/public";

describe("canRequestToJoin", () => {
  it("allows a signed-in non-member", () => {
    expect(canRequestToJoin({ isSignedIn: true, isMember: false })).toBe(true);
  });
  it("blocks anonymous viewers", () => {
    expect(canRequestToJoin({ isSignedIn: false, isMember: false })).toBe(false);
  });
  it("blocks existing members", () => {
    expect(canRequestToJoin({ isSignedIn: true, isMember: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: FAIL — `canRequestToJoin` is not exported.

- [ ] **Step 3: Write the implementation**

```ts
// append to lib/collaboration/public.ts

/** Only a signed-in non-member may request to join a workspace. */
export function canRequestToJoin(input: { isSignedIn: boolean; isMember: boolean }): boolean {
  return input.isSignedIn && !input.isMember;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/collaboration-public.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/collaboration/public.ts lib/__tests__/collaboration-public.test.ts
git commit -m "feat(collab): add canRequestToJoin eligibility predicate"
```

---

## Task 4: i18n strings for the public page

Add the `projectPublic` namespace so no bare literals ship in JSX. English is the reference; other locale files get the same keys (English fallback values are acceptable for the first pass — they will be translated later).

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fr.json`, `messages/es.json`, `messages/ar.json` (same keys)

**Interfaces:**
- Produces: translation keys under `projectPublic.*` consumed by Tasks 5–6.

- [ ] **Step 1: Add the namespace to `messages/en.json`**

Add this object at the top level of `messages/en.json` (alongside the existing namespaces such as `collaboration`):

```json
"projectPublic": {
  "aboutHeading": "About this project",
  "teamHeading": "The team",
  "outputsHeading": "Published outputs",
  "outputsEmpty": "No published outputs yet.",
  "follow": "Follow",
  "following": "Following",
  "requestToJoin": "Request to join",
  "messageLead": "Message the lead",
  "signInToJoin": "Sign in to request to join",
  "openWorkspace": "Open workspace",
  "privateNotice": "This is a private workspace.",
  "requestModalTitle": "Request to join {title}",
  "requestModalHint": "Tell the lead how you'd like to contribute (optional).",
  "requestModalPlaceholder": "I'd like to help with…",
  "requestModalSubmit": "Send request",
  "requestSent": "Request sent — the lead will review it.",
  "requestCancel": "Cancel",
  "statusDraft": "Forming",
  "statusActive": "Active",
  "statusArchived": "Completed"
}
```

- [ ] **Step 2: Mirror the same keys into the other three locale files**

Copy the identical `projectPublic` object into `messages/fr.json`, `messages/es.json`, and `messages/ar.json`. English values are acceptable placeholders for non-English until translated; the keys must exist in every file so `next-intl` does not throw a missing-message error.

- [ ] **Step 3: Verify the JSON parses**

Run: `pnpm exec tsc --noEmit -p tsconfig.json 2>/dev/null; node -e "for (const l of ['en','fr','es','ar']) { JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8')); console.log(l+' ok'); }"`
Expected: `en ok / fr ok / es ok / ar ok` (no JSON parse error).

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/fr.json messages/es.json messages/ar.json
git commit -m "i18n(collab): add projectPublic namespace strings"
```

---

## Task 5: Project CTA bar (client component)

One client component that renders Follow (reusing `FollowButton`), Request-to-join (opens a small modal → `requestToJoin`), and Message-lead (→ `requestContact`, or a sign-in prompt). Anonymous viewers see a sign-in link in place of the join button.

**Files:**
- Create: `components/collaboration/project-cta-bar.tsx`

**Interfaces:**
- Consumes: `FollowButton` from `@/components/follow/follow-button`; `requestToJoin` from `@/lib/actions/requests`; `requestContact` from `@/lib/actions/requests`; `canRequestToJoin` from `@/lib/collaboration/public`; `Dialog*` from `@/components/ui/dialog`; `Button`, `Textarea` from `@/components/ui/*`; `useTranslations` from `next-intl`; `Link` from `@/i18n/navigation`; `toast` from `sonner`.
- Produces: `ProjectCtaBar` component with props:
  ```ts
  {
    projectId: string;
    projectTitle: string;
    leadUserId: string;
    isSignedIn: boolean;
    isMember: boolean;
  }
  ```

- [ ] **Step 1: Write the component**

```tsx
// components/collaboration/project-cta-bar.tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserPlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { FollowButton } from "@/components/follow/follow-button";
import { requestToJoin, requestContact } from "@/lib/actions/requests";
import { canRequestToJoin } from "@/lib/collaboration/public";

export function ProjectCtaBar({
  projectId,
  projectTitle,
  leadUserId,
  isSignedIn,
  isMember,
}: {
  projectId: string;
  projectTitle: string;
  leadUserId: string;
  isSignedIn: boolean;
  isMember: boolean;
}) {
  const t = useTranslations("projectPublic");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [requested, setRequested] = useState(false);
  const [pending, startTransition] = useTransition();

  const mayJoin = canRequestToJoin({ isSignedIn, isMember });

  const submitJoin = () => {
    startTransition(async () => {
      const res = await requestToJoin(projectId, message.trim() || undefined);
      if (res.ok) {
        setRequested(true);
        setOpen(false);
        toast.success(t("requestSent"));
      } else {
        toast.error(res.error);
      }
    });
  };

  const messageLead = () => {
    if (!isSignedIn) return;
    startTransition(async () => {
      const res = await requestContact(leadUserId);
      if (res.ok) toast.success(t("requestSent"));
      else toast.error(res.error);
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Follow — reuses the shared, ISR-safe follow toggle */}
      <FollowButton targetType="PROJECT" targetId={projectId} size="default" />

      {/* Request to join */}
      {mayJoin ? (
        <Button onClick={() => setOpen(true)} disabled={requested || pending} className="gap-1.5">
          <UserPlus className="size-4" aria-hidden="true" />
          {requested ? t("requestSent") : t("requestToJoin")}
        </Button>
      ) : !isSignedIn ? (
        <Button asChild variant="outline" className="gap-1.5">
          <Link href="/sign-in">{t("signInToJoin")}</Link>
        </Button>
      ) : null}

      {/* Message the lead */}
      {isSignedIn && !isMember && (
        <Button variant="outline" onClick={messageLead} disabled={pending} className="gap-1.5">
          <MessageSquare className="size-4" aria-hidden="true" />
          {t("messageLead")}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("requestModalTitle", { title: projectTitle })}</DialogTitle>
            <DialogDescription>{t("requestModalHint")}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("requestModalPlaceholder")}
            maxLength={500}
            rows={4}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {t("requestCancel")}
            </Button>
            <Button onClick={submitJoin} disabled={pending}>
              {t("requestModalSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Verify the component typechecks and its imports resolve**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `components/collaboration/project-cta-bar.tsx`. If `@/components/ui/textarea` or `@/components/ui/dialog` does not exist, add it via `pnpm dlx shadcn@latest add textarea dialog` (they are standard shadcn components; the repo already uses shadcn — see `components.json`) and re-run.

- [ ] **Step 3: Commit**

```bash
git add components/collaboration/project-cta-bar.tsx
git commit -m "feat(collab): ProjectCtaBar (follow + request-to-join modal + message lead)"
```

---

## Task 6: Public page component (`ProjectPublicPage`)

A server component that renders the hero (title + status badge + lead), about, team grid, and published outputs, with the CTA bar. For MEMBERS-visibility workspaces viewed by a non-member, it renders the gated variant (title + private notice + join CTA only).

**Files:**
- Create: `components/collaboration/project-public-page.tsx`

**Interfaces:**
- Consumes: `PublicProject` from `@/lib/collaboration/public`; `ProjectCtaBar` from `./project-cta-bar`; `outputDetailHref`, `OUTPUT_TYPES` from `@/lib/collaboration/outputs`; `projectColor` from `@/lib/ccm-colors`; `Card`, `Badge`, `Avatar*` from `@/components/ui/*`; `getTranslations` from `next-intl/server`; `Link` from `@/i18n/navigation`.
- Produces: `ProjectPublicPage` async server component with props:
  ```ts
  { project: PublicProject; isSignedIn: boolean; isMember: boolean }
  ```

- [ ] **Step 1: Write the component**

```tsx
// components/collaboration/project-public-page.tsx
import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";
import { projectColor } from "@/lib/ccm-colors";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";
import type { PublicProject } from "@/lib/collaboration/public";
import { ProjectCtaBar } from "./project-cta-bar";

// Maps the real CollaborationStatus enum (DRAFT | ACTIVE | ARCHIVED) to a
// label + a projectColor key. ARCHIVED reads as "Completed" on the public page.
function statusMeta(status: PublicProject["status"], t: (k: string) => string): {
  label: string;
  colorKey: "Active" | "Recruiting" | "Completed";
} {
  switch (status) {
    case "DRAFT":
      return { label: t("statusDraft"), colorKey: "Recruiting" };
    case "ARCHIVED":
      return { label: t("statusArchived"), colorKey: "Completed" };
    default:
      return { label: t("statusActive"), colorKey: "Active" };
  }
}

function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "M";
}

export async function ProjectPublicPage({
  project,
  isSignedIn,
  isMember,
}: {
  project: PublicProject;
  isSignedIn: boolean;
  isMember: boolean;
}) {
  const t = await getTranslations("projectPublic");
  const gated = project.visibility === "MEMBERS"; // non-member viewing a private workspace
  const status = statusMeta(project.status, t);

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Hero */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="border-0 text-white" style={{ backgroundColor: projectColor(status.colorKey) }}>
            {status.label}
          </Badge>
        </div>
        <h1 className="text-3xl font-heading font-bold text-ccm-midnight">
          <bdi>{project.title}</bdi>
        </h1>
        <p className="text-sm text-muted-foreground">
          <bdi>{project.lead.name}</bdi>
        </p>
        <ProjectCtaBar
          projectId={project.id}
          projectTitle={project.title}
          leadUserId={project.lead.id}
          isSignedIn={isSignedIn}
          isMember={isMember}
        />
      </header>

      {gated ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("privateNotice")}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* About */}
          {project.description && (
            <section className="space-y-2">
              <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("aboutHeading")}</h2>
              <p className="whitespace-pre-line text-foreground/90">
                <bdi>{project.description}</bdi>
              </p>
            </section>
          )}

          {/* Team */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("teamHeading")}</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {project.members.map((m) => (
                <li key={(m.username ?? m.name) + m.role} className="flex items-center gap-2">
                  <Avatar className="size-9">
                    {m.image && <AvatarImage src={m.image} alt="" />}
                    <AvatarFallback className="bg-ccm-sky/30 text-ccm-sea text-xs">
                      {initials(m.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    <bdi>{m.name}</bdi>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Published outputs */}
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-semibold text-ccm-midnight">{t("outputsHeading")}</h2>
            {project.outputs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("outputsEmpty")}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {project.outputs.map((o) => {
                  const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
                  const href = def ? def.route : "#"; // slug not stored yet → link to the type index
                  return (
                    <li key={o.id}>
                      <Link href={href} className="group block">
                        <Card className="h-full transition-shadow hover:shadow-md">
                          <CardContent className="space-y-1 p-4">
                            {def && <Badge variant="outline">{def.label}</Badge>}
                            <p className="font-medium text-ccm-midnight group-hover:text-ccm-sea">
                              <bdi>{o.title}</bdi>
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: no errors referencing `project-public-page.tsx`. If `@/components/ui/avatar` exports differ, match the imports used in `app/[locale]/(main)/lived-experiences/[slug]/page.tsx` (it imports `Avatar, AvatarFallback`); add `AvatarImage` if present in that file's module.

- [ ] **Step 3: Commit**

```bash
git add components/collaboration/project-public-page.tsx
git commit -m "feat(collab): ProjectPublicPage (hero, about, team, published outputs, gated variant)"
```

---

## Task 7: Wire the route branch

Make the detail route render the public page for non-members/non-staff, and keep the workspace shell for members and staff. This is the integration step that makes the feature reachable.

**Files:**
- Modify: `app/[locale]/(main)/collaborations/[id]/page.tsx`

**Interfaces:**
- Consumes: `canShowPublicProject`, `getPublicProject` from `@/lib/collaboration/public`; `ProjectPublicPage` from `@/components/collaboration/project-public-page`.

- [ ] **Step 1: Add imports**

At the top of `app/[locale]/(main)/collaborations/[id]/page.tsx`, add to the existing import block:

```ts
import { canShowPublicProject, getPublicProject } from "@/lib/collaboration/public";
import { ProjectPublicPage } from "@/components/collaboration/project-public-page";
```

- [ ] **Step 2: Insert the branch after `myRole` is resolved**

Find this existing block:

```ts
  const { userId } = await auth();
  const actor = await getActor();
  const myRole = userId ? await getMembershipRole(id, userId) : null;
```

Immediately after it, insert:

```ts
  // Non-members (and non-staff) get the PUBLIC project page, not the workspace shell.
  if (canShowPublicProject({ membershipRole: myRole, isStaff: isStaff(actor) })) {
    const publicProject = await getPublicProject(id);
    if (!publicProject) notFound();
    return (
      <ProjectPublicPage project={publicProject} isSignedIn={!!userId} isMember={false} />
    );
  }
```

Note: `authorizeCollab(id, "collab:read")` earlier already redirected away any viewer who may **not** read (a non-member of a MEMBERS workspace who is not staff). Confirm the desired product behaviour: the spec wants a **gated public variant** ("This is a private workspace" + Request to join) rather than a redirect. Therefore also do Step 3.

- [ ] **Step 3: Relax the read gate so private workspaces show the gated public page instead of redirecting**

Find:

```ts
  try {
    await authorizeCollab(id, "collab:read");
  } catch {
    redirect("/collaborations");
  }
```

Replace with:

```ts
  // We intentionally do NOT redirect non-members of a private workspace here:
  // they receive the gated public page (title + "This is a private workspace" +
  // Request to join) rendered by ProjectPublicPage below. The public projection
  // exposes only public-safe fields, so this does not leak private content.
  // (Members/staff still fall through to the full workspace shell.)
```

Because the branch in Step 2 returns early for every non-member/non-staff viewer, removing the gate is safe: members and staff never hit `getPublicProject`, and everyone else only ever sees the public projection.

- [ ] **Step 4: Typecheck the route**

Run: `pnpm exec tsc --noEmit -p tsconfig.json`
Expected: no errors. `redirect` may now be unused — if tsc/eslint flags it, remove `redirect` from the `next/navigation` import (keep `notFound`).

- [ ] **Step 5: Commit**

```bash
git add "app/[locale]/(main)/collaborations/[id]/page.tsx"
git commit -m "feat(collab): route non-members to the public project page (gated for private)"
```

---

## Task 8: Cross-link "Open workspace" ↔ "View public page" and full verification

Members viewing their workspace get a "View public page" affordance; the public page's members/lead see "Open workspace". Then verify the whole flow in the running app.

**Files:**
- Modify: `components/collaboration/project-public-page.tsx` (add "Open workspace" link for members/staff — but since members never see this page, this link belongs on the *shell* for the reverse direction; see Step 1).
- Modify: `components/collaboration/workspace-shell.tsx` (add a "View public page" link in the header).

**Interfaces:**
- Consumes: `Link` from `@/i18n/navigation`.

- [ ] **Step 1: Add "View public page" to the workspace shell header**

Open `components/collaboration/workspace-shell.tsx`, find the header band that renders the breadcrumb + title (search for the `‹ Workspaces` breadcrumb or the title element). Add, next to the visibility badge, a link back to the public view (same route, but the component itself is the members view — so link to an explicit public path is not needed since the URL is shared). Instead add a labelled link that opens the public page in a way members can preview it. Since members always resolve to the shell at `/collaborations/[id]`, provide a query flag:

Add to the header actions:

```tsx
<Button asChild variant="ghost" size="sm">
  <Link href={`/collaborations/${collaboration.id}?view=public`}>
    {/* uses existing "collaboration" namespace; add key in Step 2 */}
    {tc("viewPublicPage")}
  </Link>
</Button>
```

- [ ] **Step 2: Honour `?view=public` in the route for members/staff previewing**

In `app/[locale]/(main)/collaborations/[id]/page.tsx`, change the branch condition (Task 7 Step 2) to also trigger when a member explicitly requests the public preview:

```ts
  const sp = await searchParams; // add `searchParams` to the page props if not present
  const forcePublic = sp?.view === "public";
  if (forcePublic || canShowPublicProject({ membershipRole: myRole, isStaff: isStaff(actor) })) {
    const publicProject = await getPublicProject(id);
    if (!publicProject) notFound();
    const viewerIsMember = myRole !== null;
    return (
      <ProjectPublicPage project={publicProject} isSignedIn={!!userId} isMember={viewerIsMember} />
    );
  }
```

Add `searchParams` to the page signature:

```ts
export default async function CollaborationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
```

- [ ] **Step 3: Add "Open workspace" on the public page for members previewing**

In `components/collaboration/project-public-page.tsx`, in the hero actions area (right after `<ProjectCtaBar .../>`), add:

```tsx
{isMember && (
  <div className="mt-2">
    <Button asChild variant="outline" size="sm">
      <Link href={`/collaborations/${project.id}`}>{t("openWorkspace")}</Link>
    </Button>
  </div>
)}
```

Add the `Button` and `Link` imports to the component if not already present (`Link` is imported; add `import { Button } from "@/components/ui/button";`).

- [ ] **Step 4: Add the `viewPublicPage` key to the `collaboration` namespace**

Add `"viewPublicPage": "View public page"` to the `collaboration` object in all four `messages/*.json` files.

- [ ] **Step 5: Typecheck + run the full unit suite**

Run: `pnpm exec tsc --noEmit -p tsconfig.json && pnpm test`
Expected: tsc clean; vitest all green (including the new `collaboration-public.test.ts`).

- [ ] **Step 6: Manual verification in the running app**

Run: `pnpm dev` (app serves on `http://localhost:3001` per project setup).

Verify, capturing what you observe:
1. As an **anonymous** visitor, open a **PUBLIC** workspace's URL `/collaborations/<id>` → you see the **public page** (hero, about, team, published outputs), Follow works after sign-in prompt, "Sign in to request to join" shows.
2. As a **signed-in non-member**, same URL → **Request to join** opens the modal; submitting shows the "Request sent" toast and the workspace owner gets a REQUEST notification (check `/messages` Notifications tab as the owner).
3. As a **member/owner**, same URL → you get the **workspace shell** (not the public page); the header shows **View public page**; clicking it (`?view=public`) shows the public page with an **Open workspace** button.
4. As an **anonymous** visitor, open a **MEMBERS**-visibility workspace → you see the **gated** variant ("This is a private workspace." + Request to join), and **no** about/team/outputs.
5. Check **375px width** and **`ar`** locale (`/ar/collaborations/<id>`): layout holds, text is `bdi`-wrapped, no overflow.

- [ ] **Step 7: Commit**

```bash
git add "app/[locale]/(main)/collaborations/[id]/page.tsx" components/collaboration/project-public-page.tsx components/collaboration/workspace-shell.tsx messages/en.json messages/fr.json messages/es.json messages/ar.json
git commit -m "feat(collab): cross-link public page <-> workspace + verify flow"
```

---

## Self-Review notes (for the executor)

- **Spec coverage (§4.2 diff):** public page exists (Tasks 6–7) ✓; Follow/Request-to-join/Offer/Message-lead wired (Task 5) ✓ — "Offer to help" is represented by Request-to-join's message + Message-lead in v1; a distinct `type:'offer'` open-call surface is **explicitly out of scope for this plan** (log this cut; it belongs to the Collab-space open-calls work, backlog #6). Open-calls (Seeking/Offering) and a **visibility picker** are likewise **out of scope here** and remain in the spec backlog. This plan delivers the visitor-facing page + join/follow/contact CTAs, which is the 🔴 core.
- **Output links:** `WorkspaceOutput` has no `slug`, so output cards link to the **type index route** (`OUTPUT_TYPES[].route`), not the individual document. When a slug is added to `WorkspaceOutput` later, swap in `outputDetailHref(type, slug)` in Task 6 Step 1 — the import is already present.
- **Only `approved` outputs** are public (Task 2) — drafts/pending/revision never leak.
- **No new tables/migrations** — reuses `Follow`, `JoinRequest`, `ContactRequest`, `WorkspaceOutput`, `Collaboration*`.
- **Region-scoped permissions** (spec A1 / backlog #3) are **not** touched here — independent decision, correctly deferred.
