# Workspace Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the collaboration workspace make sense — a team's staging ground that produces hub content (case studies, lived experiences, research outputs) shown as linked Sanity drafts with live status, on a redesigned outputs-led Home, in a single-sidebar top-tabs layout.

**Architecture:** Outputs-first, phased. Slice 1 adds the spine: a `WorkspaceOutput` Postgres model linking a workspace to real Sanity output drafts (Sanity = system of record), server actions to create/link/remove outputs (reusing the existing collab authz + the Sanity write client + the Phase-6 review pipeline), and a redesigned Home + Outputs tab. Slices 2–3 (layout/first-run/plan-clarity, then a design-language pass) are outlined here and get their own detailed plans when reached.

**Tech Stack:** Next.js App Router, TypeScript, Prisma (Neon Postgres), Sanity (`writeClient` + `client`), next-intl, Tailwind, shadcn/ui, Vitest.

## Global Constraints

- Green gate every task: `pnpm typecheck && pnpm test && pnpm build`. Rendered-UI validation on dev/staging for UI tasks (Playwright; 375 + RTL `ar`).
- Prisma migrations are **additive/nullable, file-only**; apply to the **Neon dev branch** via `prisma migrate deploy` (env `NEON_DEV_DB_STRING`). NEVER `prisma migrate dev` (hits prod). Regenerate client with `pnpm exec prisma generate`.
- NEVER run `sanity typegen generate` (breaks the build). Add Sanity schema fields + hand-edit `sanity.types.ts`.
- Server actions follow the established shape: `"use server"` + `getActor()` + `authorizeCollab(id, action)` + Zod + `type Result<T> = ({ ok: true } & T) | { ok: false; error: string }`.
- Authz reuses `lib/collaboration/authz.ts` (`CollabAction` union + `canInCollab`) and `authorizeCollab` from `lib/collaboration/service.ts`. New capability `collab:editOutputs` maps to EDITOR+.
- Sanity drafts are created with `writeClient` (`sanity/lib/write-client.ts`, token `SANITY_API_EDITOR_TOKEN`); reads with `client` (`sanity/lib/client.ts`).
- No AI attribution in commits. Commit frequently (one per task minimum).
- Reuse the app design language (`lib/design-tokens`, `lib/ccm-colors`, `components/ui/section-header`, `components/ui/card`) — do not hand-roll.

---

## File Structure (Slice 1)

- `prisma/schema.prisma` — add `model WorkspaceOutput` + `Collaboration.outputs` relation.
- `prisma/migrations/<ts>_workspace_outputs/migration.sql` — additive table.
- `lib/collaboration/authz.ts` — add `collab:editOutputs` to the union + the EDITOR+ switch case.
- `lib/collaboration/outputs.ts` (NEW) — pure helpers: the output-type registry (Sanity type → label/route/create-shape) + status mapping. No DB/Sanity calls → unit-testable in isolation.
- `lib/actions/workspace-outputs.ts` (NEW) — `addOutput` / `removeOutput` server actions.
- `lib/collaboration/service.ts` — add `getOutputs(collaborationId)` reader + `refreshOutputStatuses(collaborationId)` (reads Sanity, updates cached title/status) + a `getActivity(collaborationId)` reader; extend `_count`.
- `lib/__tests__/workspace-outputs.test.ts` (NEW) — action authz/Zod/branch tests.
- `lib/__tests__/collaboration-outputs.test.ts` (NEW) — pure-helper tests.
- `components/collaboration/workspace-outputs.tsx` (NEW) — the Outputs tab + "Add an output" flow.
- `components/collaboration/workspace-home.tsx` (NEW) — the redesigned Home (outputs-led).
- `components/collaboration/workspace-shell.tsx` — add the `outputs` section to nav + render Home/Outputs; pass `outputs` prop.
- `app/[locale]/(main)/collaborations/[id]/page.tsx` — fetch outputs + refresh statuses + activity; pass to shell.
- `messages/{en,es,fr,ar}.json` — new `outputs` namespace.

---

## Task 1: WorkspaceOutput model + migration (dev branch)

**Files:**
- Modify: `prisma/schema.prisma` (Collaboration model + new enum-free model)
- Create: `prisma/migrations/20260625120000_workspace_outputs/migration.sql`

**Interfaces:**
- Produces: Prisma model `WorkspaceOutput { id, collaborationId, sanityId, sanityType, title, status, createdById, createdAt, updatedAt }` with `@@unique([collaborationId, sanityId])`; `Collaboration.outputs WorkspaceOutput[]`.

- [ ] **Step 1: Add the relation to Collaboration**

In `prisma/schema.prisma`, inside `model Collaboration`, add alongside the existing relations (e.g. after `docs CollaborationDoc[]`):

```prisma
  outputs    WorkspaceOutput[]
```

- [ ] **Step 2: Add the model**

Add near the other collaboration models (after `CollaborationMedia`):

```prisma
/// A hub output (a Sanity draft) a workspace is producing. Sanity is the system
/// of record; title/status are cached for the Home and refreshed on view.
model WorkspaceOutput {
  id              String        @id @default(cuid())
  collaborationId String
  collaboration   Collaboration @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  sanityId        String
  sanityType      String // "caseStudy" | "livedExperience" | "researchOutput"
  title           String        @default("Untitled")
  status          String        @default("draft") // cached Sanity status
  createdById     String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([collaborationId, sanityId])
  @@index([collaborationId])
}
```

- [ ] **Step 3: Write the migration SQL**

Create `prisma/migrations/20260625120000_workspace_outputs/migration.sql`:

```sql
-- Workspace outputs: link a workspace to the Sanity drafts it produces.
CREATE TABLE "WorkspaceOutput" (
    "id" TEXT NOT NULL,
    "collaborationId" TEXT NOT NULL,
    "sanityId" TEXT NOT NULL,
    "sanityType" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceOutput_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WorkspaceOutput_collaborationId_sanityId_key" ON "WorkspaceOutput"("collaborationId", "sanityId");
CREATE INDEX "WorkspaceOutput_collaborationId_idx" ON "WorkspaceOutput"("collaborationId");
ALTER TABLE "WorkspaceOutput" ADD CONSTRAINT "WorkspaceOutput_collaborationId_fkey" FOREIGN KEY ("collaborationId") REFERENCES "Collaboration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 4: Regenerate client + apply to the dev branch**

Run:
```bash
pnpm exec prisma generate
DATABASE_URL="$(node -e 'const p=require("path");const {loadEnvConfig}=require(p.resolve("node_modules/.pnpm/@next+env@16.1.1/node_modules/@next/env/dist/index.js"));loadEnvConfig(process.cwd(),true);process.stdout.write(process.env.NEON_DEV_DB_STRING||"")')" pnpm exec prisma migrate deploy
```
Expected: `All migrations have been successfully applied.`

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260625120000_workspace_outputs
git commit -m "feat(workspace): WorkspaceOutput model + migration (dev branch)"
```

---

## Task 2: Output-type registry + status mapping (pure helpers)

**Files:**
- Create: `lib/collaboration/outputs.ts`
- Test: `lib/__tests__/collaboration-outputs.test.ts`

**Interfaces:**
- Produces:
  - `OUTPUT_TYPES: readonly { type: string; label: string; route: string }[]` — the linkable Sanity types (caseStudy, livedExperience, researchOutput).
  - `isOutputType(v: string): boolean`
  - `outputDetailHref(type: string, slug: string): string` — public detail route for a published output.
  - `mapSanityStatus(status: string | undefined): "draft" | "pending" | "revision" | "approved"` — normalize a Sanity doc status to the cached value (default `"draft"`).

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/collaboration-outputs.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { OUTPUT_TYPES, isOutputType, outputDetailHref, mapSanityStatus } from "@/lib/collaboration/outputs";

describe("workspace output helpers", () => {
  it("lists the linkable output types", () => {
    expect(OUTPUT_TYPES.map((o) => o.type).sort()).toEqual(["caseStudy", "livedExperience", "researchOutput"]);
  });
  it("validates output types", () => {
    expect(isOutputType("caseStudy")).toBe(true);
    expect(isOutputType("dataset")).toBe(false);
  });
  it("builds detail hrefs per type", () => {
    expect(outputDetailHref("caseStudy", "x")).toBe("/research-and-action/case-studies/x");
    expect(outputDetailHref("livedExperience", "x")).toBe("/lived-experiences/x");
    expect(outputDetailHref("researchOutput", "x")).toBe("/research-and-action/research-outputs/x");
  });
  it("maps sanity status with a draft fallback", () => {
    expect(mapSanityStatus("approved")).toBe("approved");
    expect(mapSanityStatus(undefined)).toBe("draft");
    expect(mapSanityStatus("weird")).toBe("draft");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/collaboration-outputs.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

Create `lib/collaboration/outputs.ts`:

```typescript
/** The hub output types a workspace can produce/link (Sanity documents). */
export const OUTPUT_TYPES = [
  { type: "caseStudy", label: "Case study", route: "/research-and-action/case-studies" },
  { type: "livedExperience", label: "Lived experience", route: "/lived-experiences" },
  { type: "researchOutput", label: "Research output", route: "/research-and-action/research-outputs" },
] as const;

const TYPE_SET = new Set(OUTPUT_TYPES.map((o) => o.type));
export function isOutputType(v: string): boolean {
  return TYPE_SET.has(v as any);
}

export function outputDetailHref(type: string, slug: string): string {
  const def = OUTPUT_TYPES.find((o) => o.type === type);
  return def ? `${def.route}/${slug}` : "#";
}

const STATUSES = new Set(["draft", "pending", "revision", "approved"]);
export function mapSanityStatus(status: string | undefined): "draft" | "pending" | "revision" | "approved" {
  return status && STATUSES.has(status) ? (status as any) : "draft";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/collaboration-outputs.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/collaboration/outputs.ts lib/__tests__/collaboration-outputs.test.ts
git commit -m "feat(workspace): output-type registry + status mapping helpers"
```

---

## Task 3: collab:editOutputs capability

**Files:**
- Modify: `lib/collaboration/authz.ts` (the `CollabAction` union + the EDITOR+ switch case)
- Test: `lib/__tests__/collaboration-authz.test.ts` (add a case if the file exists; otherwise fold the assertion into Task 4's action test)

**Interfaces:**
- Produces: `CollabAction` now includes `"collab:editOutputs"`; `canInCollab("collab:editOutputs", ctx)` returns true for EDITOR/OWNER.

- [ ] **Step 1: Add to the union**

In `lib/collaboration/authz.ts`, add to the `CollabAction` union next to `collab:editDoc`:

```typescript
  | "collab:editOutputs" // link/create/remove the workspace's hub outputs
```

- [ ] **Step 2: Add to the EDITOR+ switch case**

In `canInCollab`, add `collab:editOutputs` to the existing fall-through group that returns EDITOR+:

```typescript
    case "collab:editPlan":
    case "collab:editDoc":
    case "collab:editOutputs":
      return atLeast(membershipRole, "EDITOR");
```

- [ ] **Step 3: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/collaboration/authz.ts
git commit -m "feat(workspace): collab:editOutputs capability (EDITOR+)"
```

---

## Task 4: addOutput / removeOutput server actions

**Files:**
- Create: `lib/actions/workspace-outputs.ts`
- Test: `lib/__tests__/workspace-outputs.test.ts`

**Interfaces:**
- Consumes: `authorizeCollab` (service), `getActor` (authz), `writeClient` (sanity), `isOutputType`/`mapSanityStatus` (Task 2), Prisma `workspaceOutput`.
- Produces:
  - `addOutput(input: { collaborationId: string; sanityType: string; mode: "create" | "link"; sanityId?: string; title?: string }): Promise<Result<{ outputId: string }>>`
  - `removeOutput(input: { collaborationId: string; outputId: string }): Promise<Result>`
  - `type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string }`

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/workspace-outputs.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

const getActorMock = vi.fn<() => any>();
vi.mock("@/lib/authz", () => ({ getActor: () => getActorMock() }));

const authorizeMock = vi.fn<(...a: any[]) => Promise<void>>(async () => {});
vi.mock("@/lib/collaboration/service", () => ({ authorizeCollab: (...a: any[]) => authorizeMock(...a) }));

const createMock = vi.fn<(...a: any[]) => Promise<any>>(async () => ({ _id: "draft.new" }));
vi.mock("@/sanity/lib/write-client", () => ({ writeClient: { create: (...a: any[]) => createMock(...a) } }));

const db = vi.hoisted(() => {
  const d: any = {
    workspaceOutput: {
      create: vi.fn(async () => ({ id: "wo1" })),
      findFirst: vi.fn(async () => ({ id: "wo1", collaborationId: "c1" })),
      delete: vi.fn(async () => ({})),
    },
  };
  return d;
});
vi.mock("@/lib/prisma", () => ({ prisma: db }));

import { addOutput, removeOutput } from "@/lib/actions/workspace-outputs";

const ACTOR = { id: "u1", role: "community_member" as const };
beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(ACTOR);
  authorizeMock.mockResolvedValue(undefined);
});

describe("addOutput", () => {
  it("requires sign-in", async () => {
    getActorMock.mockResolvedValueOnce(null);
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create" });
    expect(res.ok).toBe(false);
  });

  it("rejects an unknown output type", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "dataset", mode: "create" });
    expect(res.ok).toBe(false);
  });

  it("create mode makes a Sanity draft and links it", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create", title: "X" });
    expect(res.ok).toBe(true);
    expect(createMock).toHaveBeenCalled();
    expect(db.workspaceOutput.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ collaborationId: "c1", sanityType: "caseStudy", sanityId: "draft.new" }) })
    );
  });

  it("link mode requires a sanityId", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "link" });
    expect(res.ok).toBe(false);
  });

  it("link mode links an existing draft without creating one", async () => {
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "link", sanityId: "draft.x" });
    expect(res.ok).toBe(true);
    expect(createMock).not.toHaveBeenCalled();
    expect(db.workspaceOutput.create).toHaveBeenCalled();
  });

  it("propagates an authz failure", async () => {
    authorizeMock.mockRejectedValueOnce(new Error("Not permitted."));
    const res = await addOutput({ collaborationId: "c1", sanityType: "caseStudy", mode: "create" });
    expect(res.ok).toBe(false);
  });
});

describe("removeOutput", () => {
  it("deletes a linked output the workspace owns", async () => {
    const res = await removeOutput({ collaborationId: "c1", outputId: "wo1" });
    expect(res.ok).toBe(true);
    expect(db.workspaceOutput.delete).toHaveBeenCalledWith({ where: { id: "wo1" } });
  });

  it("rejects removing an output from another workspace", async () => {
    db.workspaceOutput.findFirst.mockResolvedValueOnce(null);
    const res = await removeOutput({ collaborationId: "c1", outputId: "nope" });
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/workspace-outputs.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Write the implementation**

Create `lib/actions/workspace-outputs.ts`:

```typescript
"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import { writeClient } from "@/sanity/lib/write-client";
import { isOutputType } from "@/lib/collaboration/outputs";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const addSchema = z.object({
  collaborationId: z.string().min(1),
  sanityType: z.string().min(1),
  mode: z.enum(["create", "link"]),
  sanityId: z.string().min(1).optional(),
  title: z.string().max(200).optional(),
});

export async function addOutput(input: z.infer<typeof addSchema>): Promise<Result<{ outputId: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collaborationId, sanityType, mode, sanityId, title } = parsed.data;
  if (!isOutputType(sanityType)) return { ok: false, error: "Unsupported output type." };

  try {
    await authorizeCollab(collaborationId, "collab:editOutputs");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  let resolvedId = sanityId;
  let resolvedTitle = title || "Untitled";

  if (mode === "create") {
    // Create a Sanity DRAFT of the chosen output type. It enters the existing
    // review pipeline (status pending by default for the moderated types).
    const draft = await writeClient.create({
      _type: sanityType,
      _id: `drafts.`.concat(crypto.randomUUID()),
      title: { en: resolvedTitle },
      status: "pending",
    } as any);
    resolvedId = draft._id;
  } else {
    if (!sanityId) return { ok: false, error: "Pick a draft to link." };
    resolvedId = sanityId;
  }

  const row = await prisma.workspaceOutput.create({
    data: {
      collaborationId,
      sanityId: resolvedId!,
      sanityType,
      title: resolvedTitle,
      status: mode === "create" ? "pending" : "draft",
      createdById: actor.id,
    },
  });
  return { ok: true, outputId: row.id };
}

const removeSchema = z.object({ collaborationId: z.string().min(1), outputId: z.string().min(1) });

export async function removeOutput(input: z.infer<typeof removeSchema>): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const parsed = removeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { collaborationId, outputId } = parsed.data;

  try {
    await authorizeCollab(collaborationId, "collab:editOutputs");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  // Only delete the LINK (not the Sanity draft) and only if it belongs here.
  const row = await prisma.workspaceOutput.findFirst({ where: { id: outputId, collaborationId } });
  if (!row) return { ok: false, error: "Output not found." };
  await prisma.workspaceOutput.delete({ where: { id: outputId } });
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/workspace-outputs.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/actions/workspace-outputs.ts lib/__tests__/workspace-outputs.test.ts
git commit -m "feat(workspace): addOutput/removeOutput server actions"
```

---

## Task 5: service readers — getOutputs, refreshOutputStatuses, getActivity

**Files:**
- Modify: `lib/collaboration/service.ts`

**Interfaces:**
- Consumes: Prisma `workspaceOutput`, Sanity `client`, `mapSanityStatus` (Task 2).
- Produces:
  - `getOutputs(collaborationId: string): Promise<{ id; sanityId; sanityType; title; status; slug?: string }[]>`
  - `refreshOutputStatuses(collaborationId: string): Promise<void>` — fetch `{_id,title,slug,status}` for the linked Sanity docs and update cached `title`/`status`.
  - `getActivity(collaborationId: string): Promise<{ kind: string; actorName: string | null; at: string; summary: string }[]>` — a small recent-activity list (v1: derive from updatedAt of plan tasks / docs / outputs; keep simple).

- [ ] **Step 1: Add getOutputs**

In `lib/collaboration/service.ts` add:

```typescript
export async function getOutputs(collaborationId: string) {
  return prisma.workspaceOutput.findMany({
    where: { collaborationId },
    orderBy: { createdAt: "asc" },
    select: { id: true, sanityId: true, sanityType: true, title: true, status: true },
  });
}
```

- [ ] **Step 2: Add refreshOutputStatuses**

```typescript
import { client } from "@/sanity/lib/client";
import { mapSanityStatus } from "@/lib/collaboration/outputs";

export async function refreshOutputStatuses(collaborationId: string): Promise<void> {
  const rows = await prisma.workspaceOutput.findMany({
    where: { collaborationId },
    select: { id: true, sanityId: true },
  });
  if (rows.length === 0) return;
  const ids = rows.map((r) => r.sanityId);
  // Match both the published id and its draft form.
  const docs: { _id: string; title?: string; status?: string }[] = await client.fetch(
    `*[_id in $ids || ("drafts." + _id) in $ids]{ _id, "title": coalesce(title.en, title), status }`,
    { ids }
  );
  const byId = new Map(docs.map((d) => [d._id.replace(/^drafts\./, ""), d]));
  await Promise.all(
    rows.map((r) => {
      const d = byId.get(r.sanityId.replace(/^drafts\./, ""));
      if (!d) return Promise.resolve();
      return prisma.workspaceOutput.update({
        where: { id: r.id },
        data: { title: d.title || "Untitled", status: mapSanityStatus(d.status) },
      });
    })
  );
}
```

- [ ] **Step 3: Add getActivity (v1, derived)**

```typescript
export async function getActivity(collaborationId: string) {
  // v1: a lightweight recent-changes list from docs + outputs updatedAt.
  const [docs, outputs] = await Promise.all([
    prisma.collaborationDoc.findMany({
      where: { collaborationId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { title: true, updatedAt: true },
    }),
    prisma.workspaceOutput.findMany({
      where: { collaborationId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { title: true, status: true, updatedAt: true },
    }),
  ]);
  const items = [
    ...docs.map((d) => ({ kind: "doc", actorName: null as string | null, at: d.updatedAt.toISOString(), summary: `Doc "${d.title}" updated` })),
    ...outputs.map((o) => ({ kind: "output", actorName: null as string | null, at: o.updatedAt.toISOString(), summary: `Output "${o.title}" is ${o.status}` })),
  ];
  return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 6);
}
```

- [ ] **Step 4: Extend _count in getCollaboration**

In `getCollaboration`, extend the `_count` select to include docs:

```typescript
        _count: { select: { threads: true, files: true, media: true, members: true, docs: true, outputs: true } },
```

- [ ] **Step 5: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/collaboration/service.ts
git commit -m "feat(workspace): getOutputs + refreshOutputStatuses + getActivity readers"
```

---

## Task 6: Outputs tab UI + "Add an output" flow

**Files:**
- Create: `components/collaboration/workspace-outputs.tsx`
- Modify: `messages/{en,es,fr,ar}.json` (new `outputs` namespace)

**Interfaces:**
- Consumes: `addOutput`/`removeOutput` (Task 4), `getOutputs` shape (Task 5), `OUTPUT_TYPES`/`outputDetailHref` (Task 2), `Button`, `Card`, `SectionHeader`.
- Produces: `<WorkspaceOutputs outputs={...} collaborationId={...} canEdit={boolean} />` default export.

- [ ] **Step 1: Add the i18n namespace**

In each `messages/{en,es,fr,ar}.json`, add an `outputs` object. English:

```json
"outputs": {
  "title": "Outputs",
  "subtitle": "The hub content this workspace is producing.",
  "whatMaking": "What are you making?",
  "addOutput": "Add an output",
  "createNew": "Create a new draft",
  "linkExisting": "Link an existing draft",
  "pickType": "Pick a type",
  "empty": "No outputs yet. Add the case study, lived experience, or research output this workspace is working toward.",
  "statusDraft": "Draft",
  "statusPending": "In review",
  "statusRevision": "Needs changes",
  "statusApproved": "Published",
  "remove": "Remove",
  "removeConfirm": "Remove this output from the workspace? The draft itself is not deleted."
}
```
(Translate the values for es/fr/ar; keys identical.)

- [ ] **Step 2: Write the component**

Create `components/collaboration/workspace-outputs.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { OUTPUT_TYPES, outputDetailHref } from "@/lib/collaboration/outputs";
import { addOutput, removeOutput } from "@/lib/actions/workspace-outputs";
import { Link } from "@/i18n/navigation";

type Output = { id: string; sanityId: string; sanityType: string; title: string; status: string };

const STATUS_BADGE: Record<string, { key: string; cls: string }> = {
  draft: { key: "statusDraft", cls: "bg-muted text-muted-foreground" },
  pending: { key: "statusPending", cls: "bg-[#fde9c8] text-[#92610a]" },
  revision: { key: "statusRevision", cls: "bg-[#fde9c8] text-[#92610a]" },
  approved: { key: "statusApproved", cls: "bg-[#d7f0dc] text-[#1d7a36]" },
};

export default function WorkspaceOutputs({
  outputs,
  collaborationId,
  canEdit,
}: {
  outputs: Output[];
  collaborationId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("outputs");
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState(false);

  const create = (sanityType: string) => {
    start(async () => {
      const res = await addOutput({ collaborationId, sanityType, mode: "create", title: "Untitled" });
      if (res.ok) { setAdding(false); location.reload(); }
      else toast.error(res.error);
    });
  };
  const remove = (outputId: string) => {
    if (!confirm(t("removeConfirm"))) return;
    start(async () => {
      const res = await removeOutput({ collaborationId, outputId });
      if (res.ok) location.reload();
      else toast.error(res.error);
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={t("title")} subtitle={t("subtitle")} />

      {outputs.length === 0 && !adding && (
        <Card className="p-6 text-sm text-muted-foreground">{t("empty")}</Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {outputs.map((o) => {
          const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
          const badge = STATUS_BADGE[o.status] ?? STATUS_BADGE.draft;
          return (
            <Card key={o.id} className="space-y-2 p-4">
              <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
                {def?.label ?? o.sanityType}
              </span>
              <p className="font-medium text-ccm-midnight">{o.title}</p>
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{t(badge.key)}</span>
                {canEdit && (
                  <button onClick={() => remove(o.id)} disabled={pending} className="text-xs text-muted-foreground hover:text-destructive">
                    {t("remove")}
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {canEdit && (
        adding ? (
          <Card className="space-y-3 p-4">
            <p className="text-sm font-medium text-ccm-midnight">{t("pickType")}</p>
            <div className="flex flex-wrap gap-2">
              {OUTPUT_TYPES.map((d) => (
                <Button key={d.type} size="sm" variant="outline" disabled={pending} onClick={() => create(d.type)}>
                  {d.label}
                </Button>
              ))}
            </div>
          </Card>
        ) : (
          <Button size="sm" onClick={() => setAdding(true)}>{t("addOutput")}</Button>
        )
      )}
    </div>
  );
}
```

(Note: v1 ships **create** only; "link existing" is added in a follow-up — keep the schema/action's `link` branch but the UI exposes create. The `linkExisting`/`createNew` strings are pre-seeded for that follow-up.)

- [ ] **Step 3: Verify typecheck + build**

Run: `pnpm typecheck && pnpm build`
Expected: compiles.

- [ ] **Step 4: Commit**

```bash
git add components/collaboration/workspace-outputs.tsx messages/en.json messages/es.json messages/fr.json messages/ar.json
git commit -m "feat(workspace): Outputs tab + add-output flow"
```

---

## Task 7: Redesigned Home (outputs-led)

**Files:**
- Create: `components/collaboration/workspace-home.tsx`

**Interfaces:**
- Consumes: outputs (Task 5), plan stages (existing `getPlan`), activity (Task 5), `_count` (members/docs), `OUTPUT_TYPES`, `Card`, `SectionHeader`.
- Produces: `<WorkspaceHome outputs={...} planStages={...} activity={...} counts={...} collaborationId canEdit />` default export.

- [ ] **Step 1: Write the component**

Create `components/collaboration/workspace-home.tsx` rendering, in order: (1) the outputs grid (reuse the output card markup from Task 6 — extract a shared `OutputCard` if it grows, otherwise inline the read-only card), with an "Add an output" affordance linking to the Outputs tab; (2) a Plan-progress block (compute `done/total` from `planStages[].tasks[].status === "DONE"`, a progress bar, per-stage counts); (3) recent activity from `activity`; (4) members count + a link to the Members tab. Use `SectionHeader` for each block and the app cards/tokens.

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";

type Output = { id: string; sanityType: string; title: string; status: string };
type Stage = { id: string; title: string; tasks: { status: string }[] };
type Activity = { kind: string; summary: string; at: string };

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-[#fde9c8] text-[#92610a]",
  revision: "bg-[#fde9c8] text-[#92610a]",
  approved: "bg-[#d7f0dc] text-[#1d7a36]",
};

export default function WorkspaceHome({
  outputs,
  planStages,
  activity,
  memberCount,
  onGoToTab,
}: {
  outputs: Output[];
  planStages: Stage[];
  activity: Activity[];
  memberCount: number;
  onGoToTab: (tab: string) => void;
}) {
  const t = useTranslations("outputs");
  const tCollab = useTranslations("collaboration");
  const allTasks = planStages.flatMap((s) => s.tasks);
  const done = allTasks.filter((x) => x.status === "DONE").length;
  const total = allTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {outputs.map((o) => {
            const def = OUTPUT_TYPES.find((d) => d.type === o.sanityType);
            return (
              <Card key={o.id} className="space-y-2 p-4">
                <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
                  {def?.label ?? o.sanityType}
                </span>
                <p className="font-medium text-ccm-midnight">{o.title}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[o.status] ?? STATUS_BADGE.draft}`}>
                  {t(("status" + o.status.charAt(0).toUpperCase() + o.status.slice(1)) as any)}
                </span>
              </Card>
            );
          })}
          <button onClick={() => onGoToTab("outputs")} className="flex items-center justify-center rounded-lg border border-dashed border-ccm-sea/40 p-4 text-sm font-semibold text-ccm-sea">
            + {t("addOutput")}
          </button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <SectionHeader title={`Plan progress · ${done}/${total}`} />
          <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
            <div className="h-full bg-ccm-sea" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 space-y-1 text-sm">
            {planStages.map((s) => {
              const d = s.tasks.filter((x) => x.status === "DONE").length;
              return (
                <div key={s.id} className="flex justify-between border-b py-1 text-muted-foreground">
                  <span>{s.title}</span>
                  <span>{d}/{s.tasks.length}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <SectionHeader title="Recent activity" />
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {activity.length === 0 ? <p>—</p> : activity.map((a, i) => <div key={i} className="border-b py-1">{a.summary}</div>)}
          </div>
          <button onClick={() => onGoToTab("members")} className="mt-4 text-sm text-ccm-sea">
            {memberCount} {tCollab("nav.members")} →
          </button>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `pnpm typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/collaboration/workspace-home.tsx
git commit -m "feat(workspace): redesigned outputs-led Home"
```

---

## Task 8: Wire into the shell + page; validate on dev

**Files:**
- Modify: `components/collaboration/workspace-shell.tsx` (add `outputs` to the Section type + nav; render `WorkspaceHome` for `overview`/`home` and `WorkspaceOutputs` for `outputs`; accept `outputs`/`activity`/`memberCount` props; pass `onGoToTab=setSection`)
- Modify: `app/[locale]/(main)/collaborations/[id]/page.tsx` (call `refreshOutputStatuses` then `getOutputs` + `getActivity`; pass to shell)

**Interfaces:**
- Consumes: `WorkspaceHome` (Task 7), `WorkspaceOutputs` (Task 6), `getOutputs`/`refreshOutputStatuses`/`getActivity` (Task 5).

- [ ] **Step 1: Page — fetch + refresh**

In `app/[locale]/(main)/collaborations/[id]/page.tsx`, after loading the collaboration, add:

```typescript
import { getOutputs, refreshOutputStatuses, getActivity } from "@/lib/collaboration/service";
// ...
await refreshOutputStatuses(id);
const [outputs, activity] = await Promise.all([getOutputs(id), getActivity(id)]);
```
Pass `outputs={outputs} activity={activity}` to `<WorkspaceShell />`.

- [ ] **Step 2: Shell — nav + render**

In `workspace-shell.tsx`: add `"outputs"` to the `Section` union; add a nav entry `{ id: "outputs", icon: <appropriate lucide icon>, labelKey: "nav.outputs" }` after `plan`; in the section switch, render `<WorkspaceHome ... onGoToTab={setSection} />` for the home/overview section and `<WorkspaceOutputs outputs={outputs} collaborationId={collab.id} canEdit={canEdit} />` for `outputs`. Add `nav.outputs` to the `collaboration.nav` i18n in all 4 locales.

- [ ] **Step 3: Verify green gate**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all pass.

- [ ] **Step 4: Rendered validation on dev**

Start dev (`NEXT_PUBLIC_FEATURE_ENGAGEMENT=true pnpm next dev -p 3001`), open a workspace, confirm: Home shows the outputs section (empty-state card initially), the Outputs tab renders, "Add an output" → pick "Case study" creates a draft + a card appears with an "In review" badge, plan-progress shows `0/0` then real counts when tasks exist. Screenshot to `docs/design/screenshots/workspace-home.png`. Check 375 width + `/ar` RTL.

- [ ] **Step 5: Commit**

```bash
git add components/collaboration/workspace-shell.tsx "app/[locale]/(main)/collaborations/[id]/page.tsx" messages/*.json docs/design/screenshots/workspace-home.png
git commit -m "feat(workspace): wire Home + Outputs into the shell; validate on dev"
```

---

## Slice 2 — Layout + first-run + plan clarity (outline; detailed plan when reached)

- **Task S2.1** Global sidebar auto-collapses to icons on `/collaborations/[id]` routes; restores on exit (route-scoped, not a global state mutation — see spec risk). Reuse the existing `app-sidebar` collapsible state.
- **Task S2.2** Workspace nav becomes horizontal **top tabs** (replace the in-shell left rail); header carries breadcrumb + inline-editable title + status badge. Mobile: tabs → horizontal scroll/drawer.
- **Task S2.3** Creation seeds 3 starter stages (`To do · In progress · Done`) + one starter doc in `createCollaboration` (`lib/actions/collaboration.ts`).
- **Task S2.4** Plan tab: `SectionHeader` + "what a stage is" framing; expose `assigneeId` on tasks (assign a member); onboarding empty-state card.
- **Task S2.5** Real onboarding empty states across Docs/Threads/Files/Media + i18n.

## Slice 3 — Design-language pass (outline; detailed plan when reached)

- **Task S3.1** Adopt `SectionHeader`/`design-tokens`/`ui/card` across every workspace tab (replace ad-hoc `rounded-lg border` divs + raw brand classes).
- **Task S3.2** Per-tab headers carrying explanatory copy; consistent spacing per the mobile-UX/design-uniformity directives. Rendered validation 375 + RTL.

---

## Self-Review

**Spec coverage:** purpose/outputs spine → Tasks 1–8 ✓; layout (collapse + tabs) → Slice 2 ✓; Home outputs-led → Task 7 ✓; plan clarity/seed → Slice 2 ✓; empty states → Slice 2 ✓; design pass → Slice 3 ✓; review pipeline reuse → Task 4 (creates a `pending` draft) ✓; Sanity = source of record + status refresh → Task 5 ✓. Out-of-scope items are not tasked. ✓

**Placeholder scan:** Task 8 says "<appropriate lucide icon>" — at execution pick `Rocket` or `FileOutput` from lucide-react (BookText is taken by docs). Otherwise concrete. The "link existing" UI is explicitly deferred with the action branch retained + strings seeded.

**Type consistency:** `Result<T>` shape identical across actions; `addOutput`/`removeOutput` signatures match Task 4 ↔ Task 6 usage; `getOutputs` select shape (id/sanityId/sanityType/title/status) matches Task 6/7 props; `mapSanityStatus` return union matches the cached `status` values and the `STATUS_BADGE` keys (draft/pending/revision/approved). ✓
