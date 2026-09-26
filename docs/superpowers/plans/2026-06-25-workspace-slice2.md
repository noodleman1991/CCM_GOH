# Workspace Redesign — Slice 2 Implementation Plan (Layout + first-run + plan clarity)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Parent plan: `docs/superpowers/plans/2026-06-25-workspace-redesign.md` (see its "Slice 2" outline + Global Constraints).

**Goal:** Make the collaboration workspace legible at first glance: (1) the global app sidebar collapses to an icon rail on `/collaborations/[id]` routes so the workspace owns the screen, restoring on exit; (2) the in-shell left rail becomes horizontal **top tabs** with a real workspace **header** (breadcrumb + inline-editable title + status badge); (3) new workspaces are **seeded** with 3 starter stages + a starter doc so they're never empty; (4) the Plan tab gains framing + **task assignment** to a member; (5) **real empty states** land across Docs/Threads/Files/Media. All in the existing CCM design language, mobile-first.

**Scope of Slice 2:** S2.1–S2.5 below. Slice 1 (Tasks 1–8: outputs spine + Home/Outputs) is DONE and committed.

## Global Constraints (inherited — read the parent plan)

- Green gate every task: `pnpm typecheck && pnpm test && pnpm build`. Rendered-UI validation on dev for UI tasks (375 + RTL `ar`) where reachable.
- Prisma migrations are **additive/nullable, file-only**; apply to the **Neon dev branch** via `prisma migrate deploy` (env `NEON_DEV_DB_STRING`). NEVER `prisma migrate dev`. Regenerate with `pnpm exec prisma generate`.
- **Finding:** The `Task` model ALREADY has `assigneeId String?` + `assignee User? @relation("TaskAssignee", …, onDelete: SetNull)` + `@@index([assigneeId, status])` (schema lines 806–812), and `getPlan` already selects the assignee. **S2.4 needs NO migration** — it exposes the existing column via a server action + UI. (If a future field were needed, it would follow the additive/nullable/file-only + dev-deploy recipe; not required here.)
- Server actions follow the established shape: `"use server"` + `getActor()` + `authorizeCollab(id, action)` + Zod + `type Result<T> = ({ ok: true } & T) | { ok: false; error: string }`. Plan edits use the existing `collab:editPlan` capability (EDITOR+).
- Reuse `lib/design-tokens`, `lib/ccm-colors`, `components/ui/section-header`, `components/ui/card`, `components/ui/breadcrumb`, `components/ui/inline-text`, `components/ui/select`. Do not hand-roll.
- Honor mobile-UX directives: mobile-first, drawers over shrunk desktop. Top tabs become a horizontal scroll on small screens; the existing mobile section drawer stays or is folded into the scroll row.
- NO AI attribution in commits (repo CLAUDE.md). One commit per task, `feat(workspace): …`.

---

## Architecture decisions (grounding)

- **S2.1 route-scoped sidebar collapse (no global leak):** Two pieces, both inherently scoped to the route:
  1. `components/app-sidebar.tsx` derives `collapsible` from the current path with the already-imported `usePathname()` from `@/i18n/navigation`: `isWorkspaceRoute ? "icon" : "offcanvas"`. Because this is computed from the live pathname on every render, it never persists — leaving the route flips it back. (Default app behavior is `offcanvas`, which fully hides; on collab routes we want an **icon rail**, hence `"icon"`.)
  2. `components/collaboration/workspace-sidebar-collapse.tsx` (NEW, client) is rendered by the collab detail page. On mount it records the current `open` value from `useSidebar()` and calls `setOpen(false)` (collapse); on unmount it restores the recorded value. We do NOT mutate any module-level/global store; everything is component-lifecycle-scoped. The `sidebar_state` cookie the provider writes is the pre-existing behavior; off-collab routes use `offcanvas`, so a stale `open=false` cookie only means the rail starts collapsed and the user toggles it back exactly as before.
  - Net: on a workspace page the app sidebar is an icon rail; navigating away restores the previous expanded/collapsed state and `offcanvas` behavior. No other route is affected because both signals are route/lifecycle derived.

- **S2.2 top tabs + header:** Replace the in-shell `<aside>` left `NavList` with a horizontal tab bar built on the workspace `nav[]` array (keep the array as the single source). Both desktop + mobile render a horizontally-scrollable tab row (`overflow-x-auto`), so there is no separate desktop/mobile nav divergence to maintain. A header band above the tabs carries: a Breadcrumb (`Workspaces / <title>`), the inline-editable `<InlineText>` title (already present — moved into the header band), and the visibility/status Badge. Active-tab styling reuses ccm tokens (`text-ccm-sea`, underline bar in `border-ccm-water`).

- **S2.3 seed on create:** Extend `createCollaboration` to also create the `Plan` + 3 ordered `PlanStage`s ("To do" / "In progress" / "Done") and one `CollaborationDoc` ("Welcome" with a short starter Portable Text body). Reuses the exact Prisma create shapes from `lib/actions/plans.ts` (`plan` + `planStage.create` with `order`) and `lib/actions/docs.ts` (`collaborationDoc.create` with `order`, `content`). Seeding is best-effort and must never block workspace creation (wrap in try/catch).

- **S2.4 task assignment:** New server action `assignTask(collaborationId, taskId, assigneeId | null)` (EDITOR+, `collab:editPlan`), TDD'd like `plans.test.ts`. The Plan tab gains: a `SectionHeader` with "what a stage is" subtitle, an onboarding empty-state card (shown when there are 0 stages and the user can edit), and a per-task assignee control (a compact `Select` of workspace members; reuses the `members` already passed to the shell). `getPlan` already selects the assignee; thread `assigneeId` through the page projection → shell → plan props.

- **S2.5 empty states:** Replace the bare `<p>` "No X yet" lines in Docs/Threads/Files/Media with a shared, friendly empty-state card (icon + heading + one-line guidance + the existing add affordance where the user can edit). One small presentational component `components/collaboration/workspace-empty-state.tsx` (reuses `Card`).

---

## File Structure (Slice 2)

- `components/app-sidebar.tsx` — derive `collapsible` from pathname (S2.1).
- `components/collaboration/workspace-sidebar-collapse.tsx` (NEW) — lifecycle collapse/restore (S2.1).
- `app/[locale]/(main)/collaborations/[id]/page.tsx` — mount the collapse component; thread task `assigneeId` through the plan projection (S2.1, S2.4).
- `components/collaboration/workspace-shell.tsx` — top tabs + header; pass `members` to Plan; widen plan task type (S2.2, S2.4).
- `lib/actions/collaboration.ts` — seed stages + doc in `createCollaboration` (S2.3).
- `lib/collaboration/seed.ts` (NEW) — pure seed constants/helper (S2.3) — unit-testable.
- `lib/__tests__/collaboration-seed.test.ts` (NEW) — seed-helper tests (S2.3).
- `lib/actions/plans.ts` — `assignTask` action (S2.4).
- `lib/__tests__/plans.test.ts` — add `assignTask` tests (S2.4).
- `components/collaboration/workspace-plan.tsx` — framing + empty-state + assignee control (S2.4).
- `components/collaboration/workspace-empty-state.tsx` (NEW) — shared empty state (S2.5).
- `components/collaboration/workspace-docs.tsx` / `workspace-threads.tsx` / `workspace-files.tsx` / `workspace-media.tsx` — use the empty state (S2.5).
- `messages/{en,es,fr,ar}.json` — `collaboration.emptyState.*`, `plan.*` framing/assignee, `collaboration.breadcrumbHome`.

---

## Task 1 (S2.1): Route-scoped sidebar auto-collapse to an icon rail

**Files:** Modify `components/app-sidebar.tsx`; Create `components/collaboration/workspace-sidebar-collapse.tsx`; Modify `app/[locale]/(main)/collaborations/[id]/page.tsx`.

**Interfaces:** `<WorkspaceSidebarCollapse />` client component (no props) collapses on mount, restores on unmount. `AppSidebar` renders an icon rail while on a `/collaborations/[id]` route.

- [x] **Step 1: Collapse to icons on collab routes.** In `components/app-sidebar.tsx` (`usePathname` already imported), add:
  ```tsx
  const isWorkspaceRoute = /^\/collaborations\/[^/]+$/.test(pathname)
  const collapsible = isWorkspaceRoute ? "icon" : "offcanvas"
  ```
  Pass `collapsible={collapsible}` to the returned `<Sidebar variant="inset" {...props}>`.

- [x] **Step 2: Lifecycle collapse/restore component.** Create `components/collaboration/workspace-sidebar-collapse.tsx`:
  ```tsx
  "use client";
  import { useEffect } from "react";
  import { useSidebar } from "@/components/ui/sidebar";

  /** Route-scoped: collapses the app sidebar to an icon rail while a workspace is
   *  open, restoring the prior state on exit. Mounted only by the collab detail
   *  page, so it's bounded to that route's lifecycle. */
  export function WorkspaceSidebarCollapse() {
    const { setOpen, open, isMobile } = useSidebar();
    useEffect(() => {
      if (isMobile) return; // mobile uses a drawer; nothing to collapse
      const prev = open;
      setOpen(false);
      return () => setOpen(prev);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
  }
  ```

- [x] **Step 3: Mount on the page.** In `app/[locale]/(main)/collaborations/[id]/page.tsx`, import + render above `<WorkspaceShell>` inside a fragment.

- [x] **Step 4: Green gate.** `pnpm typecheck && pnpm test` → pass.

- [x] **Step 5: Rendered validation (if dev reachable).** Open `/collaborations/<id>`: app rail is icon-only; navigate away: rail restores. Mobile (375) uses the drawer, untouched. Flag if dev unreachable.

- [x] **Step 6: Commit.** `git commit -m "feat(workspace): collapse app sidebar to an icon rail on workspace routes"`

---

## Task 2 (S2.2): Top tabs + workspace header (breadcrumb + title + status)

**Files:** Modify `components/collaboration/workspace-shell.tsx`; Modify `messages/{en,es,fr,ar}.json` (add `collaboration.breadcrumbHome`).

- [x] **Step 1: i18n.** Add `collaboration.breadcrumbHome`: en `"Workspaces"`, es `"Espacios de trabajo"`, fr `"Espaces de travail"`, ar `"مساحات العمل"`.

- [x] **Step 2: Rework layout to header + top tabs.** In `workspace-shell.tsx`:
  - Import `Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator` from `@/components/ui/breadcrumb` and `Link` from `@/i18n/navigation`.
  - Replace `<header>` + the `grid lg:grid-cols-[200px_1fr]` wrapper with: (a) a header band — `<Breadcrumb>` (`Workspaces` link → separator → `<BreadcrumbPage><bdi>{title}</bdi></BreadcrumbPage>`), then the `<InlineText>` title + visibility `<Badge>` in a flex row; (b) a horizontal tab bar driven by the `nav` array:
    ```tsx
    <div className="mb-6 border-b">
      <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label={t("nav.sections")}>
        {nav.map((item) => {
          const Icon = item.icon; const active = section === item.id;
          return (
            <button key={item.id} onClick={() => setSection(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn("flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors",
                active ? "border-ccm-water font-medium text-ccm-sea" : "border-transparent text-muted-foreground hover:text-foreground")}>
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {item.count !== undefined && <span className="text-xs">{item.count}</span>}
            </button>
          );
        })}
      </nav>
    </div>
    ```
  - Move the section-content switch into a plain `<div className="min-w-0">` under the tab bar. Keep the `overview` description `<InlineText>` + `<WorkspaceHome>` as-is.
  - Remove the now-unused mobile `<Drawer>` nav + `NavList` + the `Drawer/DrawerContent/DrawerTrigger/Menu` imports if unused (let typecheck/lint confirm).

- [x] **Step 3: Green gate + build.** `pnpm typecheck && pnpm test && pnpm build` → pass (watch unused-import lint).

- [x] **Step 4: Rendered validation (if dev reachable).** Header shows `Workspaces / <title>`, editable title, badge; tab row below switches sections; 375 scrolls tabs; `/ar` mirrors. Screenshot `docs/design/screenshots/workspace-tabs.png` if possible.

- [x] **Step 5: Commit.** `git commit -m "feat(workspace): top tabs + header (breadcrumb, inline title, status)"`

---

## Task 3 (S2.3): Seed starter stages + a starter doc on creation

**Files:** Create `lib/collaboration/seed.ts`; Test `lib/__tests__/collaboration-seed.test.ts`; Modify `lib/actions/collaboration.ts`.

**Interfaces:** `STARTER_STAGES` (`["To do","In progress","Done"]`), `STARTER_DOC_TITLE`, `starterDocContent(): unknown[]`, `seedWorkspace(db, collaborationId, actorId): Promise<void>`.

- [x] **Step 1: Failing test.** Create `lib/__tests__/collaboration-seed.test.ts`:
  ```ts
  import { describe, it, expect, vi } from "vitest";
  import { STARTER_STAGES, STARTER_DOC_TITLE, starterDocContent, seedWorkspace } from "@/lib/collaboration/seed";

  describe("workspace seed", () => {
    it("defines the three starter stages in order", () => {
      expect(STARTER_STAGES).toEqual(["To do", "In progress", "Done"]);
    });
    it("starterDocContent is a non-empty portable-text array", () => {
      const c = starterDocContent();
      expect(Array.isArray(c)).toBe(true);
      expect(c.length).toBeGreaterThan(0);
    });
    it("seedWorkspace creates a plan, ordered stages, and a starter doc", async () => {
      const stageCreate = vi.fn(async () => ({ id: "st" }));
      const tx: any = {
        plan: { create: vi.fn(async () => ({ id: "p1" })) },
        planStage: { create: stageCreate },
        collaborationDoc: { create: vi.fn(async () => ({ id: "d1" })) },
      };
      await seedWorkspace(tx, "c1", "u1");
      expect(tx.plan.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ collaborationId: "c1" }) }));
      expect(stageCreate).toHaveBeenCalledTimes(3);
      expect(stageCreate.mock.calls[0][0].data).toEqual(expect.objectContaining({ title: "To do", order: 0 }));
      expect(stageCreate.mock.calls[2][0].data).toEqual(expect.objectContaining({ title: "Done", order: 2 }));
      expect(tx.collaborationDoc.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ collaborationId: "c1", createdById: "u1", title: STARTER_DOC_TITLE }),
      }));
    });
  });
  ```

- [x] **Step 2: Run → FAIL** (`pnpm exec vitest run lib/__tests__/collaboration-seed.test.ts`).

- [x] **Step 3: Implement.** Create `lib/collaboration/seed.ts`:
  ```ts
  import type { PrismaClient } from "@/generated/prisma";

  export const STARTER_STAGES = ["To do", "In progress", "Done"] as const;
  export const STARTER_DOC_TITLE = "Welcome";

  export function starterDocContent(): unknown[] {
    return [{
      _type: "block", _key: "seed0", style: "normal", markDefs: [],
      children: [{ _type: "span", _key: "seed0s", marks: [],
        text: "Welcome to your workspace. Use Docs to draft, Plan to track stages, and Outputs to link the hub content you are producing." }],
    }];
  }

  /** Seed a new workspace so it is never empty: a plan with 3 stages + a starter
   *  doc. Accepts a Prisma client or tx so the caller controls the boundary. */
  export async function seedWorkspace(
    db: Pick<PrismaClient, "plan" | "planStage" | "collaborationDoc">,
    collaborationId: string, actorId: string,
  ): Promise<void> {
    const plan = await db.plan.create({ data: { collaborationId }, select: { id: true } });
    for (let i = 0; i < STARTER_STAGES.length; i++) {
      await db.planStage.create({ data: { planId: plan.id, title: STARTER_STAGES[i], order: i } });
    }
    await db.collaborationDoc.create({
      data: { collaborationId, createdById: actorId, title: STARTER_DOC_TITLE, order: 0, content: starterDocContent() as never },
    });
  }
  ```

- [x] **Step 4: Run → PASS.**

- [x] **Step 5: Call from createCollaboration.** In `lib/actions/collaboration.ts`, after the `collab` row is created:
  ```ts
  import { seedWorkspace } from "@/lib/collaboration/seed";
  // …
  try { await seedWorkspace(prisma, collab.id, actor.id); } catch { /* seed is convenience-only */ }
  ```

- [x] **Step 6: Green gate.** `pnpm typecheck && pnpm test` → pass.

- [x] **Step 7: Commit.** `git commit -m "feat(workspace): seed starter stages + a welcome doc on creation"`

---

## Task 4 (S2.4): Task assignment server action (TDD)

**Files:** Modify `lib/actions/plans.ts`; Test `lib/__tests__/plans.test.ts`.

**Interfaces:** `assignTask(collaborationId, taskId, assigneeId: string | null): Promise<Result>` — EDITOR+ via `collab:editPlan`; `null` clears. No migration (column pre-exists).

- [x] **Step 1: Failing tests.** Add to `lib/__tests__/plans.test.ts` (add `assignTask` to the import):
  ```ts
  describe("assignTask", () => {
    it("is blocked for non-editors", async () => {
      authorizeCollabMock.mockRejectedValueOnce(new Error("Forbidden"));
      const res = await assignTask("c1", "tk1", "u2");
      expect(res.ok).toBe(false);
      expect(db.task.update).not.toHaveBeenCalled();
    });
    it("requests collab:editPlan", async () => {
      await assignTask("c1", "tk1", "u2");
      expect(authorizeCollabMock).toHaveBeenCalledWith("c1", "collab:editPlan");
    });
    it("assigns a member", async () => {
      const res = await assignTask("c1", "tk1", "u2");
      expect(res.ok).toBe(true);
      expect(db.task.update).toHaveBeenCalledWith({ where: { id: "tk1" }, data: { assigneeId: "u2" } });
    });
    it("clears the assignment with null", async () => {
      const res = await assignTask("c1", "tk1", null);
      expect(res.ok).toBe(true);
      expect(db.task.update).toHaveBeenCalledWith({ where: { id: "tk1" }, data: { assigneeId: null } });
    });
  });
  ```

- [x] **Step 2: Run → FAIL.**

- [x] **Step 3: Implement** in `lib/actions/plans.ts`:
  ```ts
  /** Assign a workspace member to a task (or clear with null). EDITOR+. */
  export async function assignTask(collaborationId: string, taskId: string, assigneeId: string | null): Promise<Result> {
    const auth = await canEdit(collaborationId);
    if (!auth.ok) return auth;
    await prisma.task.update({ where: { id: taskId }, data: { assigneeId } });
    return { ok: true };
  }
  ```

- [x] **Step 4: Run → PASS.**

- [x] **Step 5: Commit.** `git commit -m "feat(workspace): assignTask server action (EDITOR+)"`

---

## Task 5 (S2.4): Plan tab — framing, onboarding empty state, assignee control

**Files:** Modify `app/[locale]/(main)/collaborations/[id]/page.tsx`, `components/collaboration/workspace-shell.tsx`, `components/collaboration/workspace-plan.tsx`, `messages/{en,es,fr,ar}.json`.

**Interfaces:** `WorkspacePlan` gains `members: { userId: string; name: string }[]`; tasks carry `assigneeId: string | null`.

- [x] **Step 1: Thread assignee through the page.** In `page.tsx`, extend the task map: `tasks: s.tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, assigneeId: t.assignee?.id ?? null }))`.

- [x] **Step 2: Shell — pass members + widen types.** In `workspace-shell.tsx`: widen `PlanStageProp` task type to include `assigneeId: string | null`; on `<WorkspacePlan>` add `members={collaboration.members.map((m) => ({ userId: m.userId, name: m.name }))}`.

- [x] **Step 3: Plan i18n.** Add to `plan` in all four locales (translate values):
  ```json
  "heading": "Plan",
  "subtitle": "Break the work into stages, then add tasks under each. Click a task to move it To do → In progress → Done.",
  "emptyTitle": "No stages yet",
  "emptyBody": "Add your first stage (e.g. Discovery, Drafting, Review) to start tracking the work.",
  "assign": "Assign",
  "unassigned": "Unassigned"
  ```

- [x] **Step 4: Plan UI.** In `workspace-plan.tsx`:
  - Accept `members: { userId: string; name: string }[]`; tasks carry `assigneeId: string | null`.
  - Import `SectionHeader`, `WorkspaceEmptyState` (Task 6), the `Select` family, `ListTodo` from lucide, `assignTask`.
  - Render `<SectionHeader title={t("heading")} subtitle={t("subtitle")} />` at the top.
  - When `stages.length === 0 && canEdit`, render `<WorkspaceEmptyState icon={ListTodo} title={t("emptyTitle")} body={t("emptyBody")} />` above the add-stage input. Keep the `stages.length === 0 && !canEdit` early return (can reuse the empty state w/o action).
  - In `SortableTask`, add a compact assignee `Select` for editors (value `assigneeId ?? "none"`, options = `unassigned` + member names; `onValueChange` → `onAssign(task.id, v === "none" ? null : v)`); `h-7 text-xs`, placed before the delete button. Add a parent `onAssign(stageId, taskId, assigneeId)` that optimistically updates state + calls `assignTask`, toasting on failure (mirror `onCycle`).

- [x] **Step 5: Green gate + build.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [x] **Step 6: Rendered validation (if dev reachable).** Plan tab shows the header/subtitle; new workspaces show the 3 seeded stages; empty plan shows the onboarding card + add input; tasks show assignee Selects that persist. 375 + `/ar`.

- [x] **Step 7: Commit.** `git commit -m "feat(workspace): plan framing, onboarding empty state, task assignment UI"`

---

## Task 6 (S2.5): Shared empty state + Docs/Threads/Files/Media empty states

**Files:** Create `components/collaboration/workspace-empty-state.tsx`; Modify the four workspace tab components; Modify `messages/{en,es,fr,ar}.json` (`collaboration.emptyState.*`).

**Interfaces:** `<WorkspaceEmptyState icon={LucideIcon} title={string} body={string} action?={ReactNode} />` — centered `Card` w/ icon chip, title, body, optional action.

- [x] **Step 1: Component.** Create `components/collaboration/workspace-empty-state.tsx`:
  ```tsx
  import type { LucideIcon } from "lucide-react";
  import { Card } from "@/components/ui/card";

  /** Friendly, consistent empty state for workspace tabs (reuses the app Card). */
  export function WorkspaceEmptyState({ icon: Icon, title, body, action }: {
    icon: LucideIcon; title: string; body: string; action?: React.ReactNode;
  }) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-ccm-sky/20 text-ccm-sea">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <p className="font-heading font-semibold text-ccm-midnight">{title}</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{body}</p>
        </div>
        {action}
      </Card>
    );
  }
  ```

- [x] **Step 2: i18n.** Add `collaboration.emptyState` in all four locales (translate):
  ```json
  "emptyState": {
    "docsTitle": "No documents yet",
    "docsBody": "Draft notes, briefs, and write-ups together. Create your first document to get started.",
    "threadsTitle": "No discussions yet",
    "threadsBody": "Start a thread to discuss decisions, share updates, or ask the group a question.",
    "filesTitle": "No files yet",
    "filesBody": "Upload PDFs and documents the team needs. Drag a file here or use the upload button.",
    "mediaTitle": "No media yet",
    "mediaBody": "Add YouTube videos to share talks, demos, or recordings with the workspace."
  }
  ```

- [x] **Step 3: Use in each tab.**
  - `workspace-docs.tsx`: add `const tc = useTranslations("collaboration")`; when there are no docs, render `<WorkspaceEmptyState icon={FileText} title={tc("emptyState.docsTitle")} body={tc("emptyState.docsBody")} action={canEdit ? <Button …create…> : undefined} />` (keep the list rendering when docs exist).
  - `workspace-threads.tsx`: replace the `noThreads` branch with `<WorkspaceEmptyState icon={MessagesSquare} title={t("emptyState.threadsTitle")} body={t("emptyState.threadsBody")} />`; keep the inline add-row for editors.
  - `workspace-files.tsx`: replace the `noFiles` `<p>` with `<WorkspaceEmptyState icon={FileText} title={t("emptyState.filesTitle")} body={t("emptyState.filesBody")} />` (dropzone stays above for editors).
  - `workspace-media.tsx`: replace the `noMedia` `<p>` with `<WorkspaceEmptyState icon={Film} title={t("emptyState.mediaTitle")} body={t("emptyState.mediaBody")} />` (`Film` from lucide; add-row stays above for editors).
  - Keep the old `noThreads`/`noFiles`/`noMedia`/`docs.empty` keys (still referenced) — don't delete.

- [x] **Step 4: Green gate + build.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [x] **Step 5: Rendered validation (if dev reachable).** Each empty tab shows the centered card + the editor's add affordance. 375 + `/ar`.

- [x] **Step 6: Commit.** `git commit -m "feat(workspace): real empty states across Docs/Threads/Files/Media"`

---

## Task 7: Final green gate + report

- [x] **Step 1: Full green gate.** `pnpm typecheck && pnpm test && pnpm build` → all pass.
- [x] **Step 2: i18n parity.** All four `messages/*.json` parse and share the new keys.
- [x] **Step 3: Report** commit SHAs, sidebar approach + route-scoping rationale, the no-migration finding, top-tabs/header design, seed contents, empty states, test/green-gate results. Flag deferred/unverified items (esp. rendered validation if dev unreachable).

### Validation report (2026-06-28)

**Status: SLICE 2 COMPLETE & VALIDATED.** All six feature commits landed (`5c3a45101` sidebar rail, `62e220d08` top tabs+header, `4032b2140` seed, `bf35f814a` assignTask, `920224288` plan framing/assignee UI, `bde5b7d2e` empty states).

**Green gate (re-run 2026-06-28):**
- `pnpm typecheck` → clean (exit 0).
- Tests → real project suite **295/295 passing** (40 files) via `vitest run lib/__tests__ --exclude '**/.claude/**'`. NOTE: a bare `pnpm test` reports ~378 failures, but **every failure is a vendored/duplicate test file under `.claude/worktrees/agent-*/`** (leftover agent worktrees polluting the default glob: `@sanity/sdk` internal tests `vi is not defined`, plus a stale `case-study-emails.test.ts` worktree copy). The canonical project test passes. Stray worktrees should be removed.
- `pnpm build` → `✓ Compiled successfully in 48s`.
- i18n parity: en/es/fr/ar all parse.

**Rendered validation (Claude-in-Chrome, dev localhost:3001, signed in as amit2@pm.me, workspace "The best project" `cmqqpqyey0003oky2hufx7h7d`):**
- ✅ **Sidebar auto-collapse (Task 1):** app sidebar renders as an icon-only rail on the workspace route (vs. fully-expanded sidebar in the pre-slice `workspace-outputs-tab.png` baseline).
- ✅ **Top tabs + header (Task 2):** horizontal tab row `Overview · Outputs · Plan · Docs · Threads · Files · Media · Members`; header shows `Workspaces › The best project` breadcrumb + title + "Members only" status badge — replacing the old vertical left-nav.
- ✅ **Plan framing + assignee (Task 5):** Plan tab shows `SectionHeader` ("Break the work into stages… To do → In progress → Done"); task assignee `Select` opens with Unassigned + member; **assigning persisted to the DB** (dev log: `UPDATE "Task" SET "assigneeId"` → 200, control updated to "Amit Lokszinski").
- ✅ **Empty states (Task 6):** Files → "No files yet / Upload PDFs…"; Media → "No media yet / Add YouTube videos…" — both the reusable `WorkspaceEmptyState` card (icon chip + title + body), editor add-affordances preserved above.
- ✅ **Mobile (390px):** rail collapses to a toggle, tabs become a horizontal scroll row, empty-state card full-width — per mobile-UX directives.
- ✅ **RTL (`/ar`):** full mirror — rail on the right, breadcrumb/tabs translated & right-aligned (`نظرة عامة · المخرجات · الخطة …`), status badge top-left, Arabic-Indic numerals (`٠/١`), Lalezar heading font. English user-data (workspace/output titles) correctly stays LTR via `<bdi>`.

**Seed (Task 3) — note:** the seed (3 starter stages + starter doc) fires only on **new** workspace creation; validated structurally by `lib/__tests__/collaboration-seed.test.ts` (green) rather than re-creating a workspace in this pass. "The best project" predates the seed so it carries its own stages (Stage 1 / stage 2). The seed action + test are committed and passing.

**Deferred/none-blocking:** no `docs/design/screenshots/workspace-tabs.png` written (screenshots captured in-session via Claude-in-Chrome). Stray `.claude/worktrees/agent-*/` dirs should be pruned to de-noise `pnpm test`.

---

## Self-Review

**Spec coverage:** S2.1 → Task 1 ✓ (route-derived `collapsible` + lifecycle effect, no global mutation); S2.2 → Task 2 ✓; S2.3 → Task 3 ✓ (plan + 3 stages + welcome doc, best-effort); S2.4 → Tasks 4–5 ✓ (no migration — column pre-exists); S2.5 → Task 6 ✓. Reuses existing design language (SectionHeader/Card/Badge/Breadcrumb/Select/InlineText + ccm tokens) ✓. Mobile-first: tabs are a horizontal scroll row, mobile sidebar stays a drawer, empty states are responsive cards ✓.

**No-migration justification:** `prisma/schema.prisma` lines 806–812 already declare `assigneeId String?`, the `TaskAssignee` relation, and `@@index([assigneeId, status])`; `lib/actions/plans.ts` `myTasks` already queries `assigneeId`; `getPlan` already selects `assignee`. S2.4 is UI + a thin action only. If a column WERE missing it would be additive/nullable/file-only + deployed to the Neon dev branch via `prisma migrate deploy` with `NEON_DEV_DB_STRING`, then `pnpm exec prisma generate` — not needed here.

**Leak-safety (S2.1):** Both signals recompute per render/lifecycle: `collapsible` from `usePathname()` (no persistence) and the collapse/restore from a mount/unmount effect that captures+restores `open`. No module-level state is set. Off-collab routes use `offcanvas`, so a stale cookie only changes the rail's start state, which the user toggles as before — no new cross-route coupling.

**Type consistency:** `Result` reused; `assignTask` signature matches test + UI call; the widened `PlanStageProp` task type (`assigneeId: string|null`) is produced by the page projection and consumed by `WorkspacePlan`; `members: { userId; name }[]` is sliced from the shell's `Member[]`. `WorkspaceEmptyState` `icon: LucideIcon` matches the lucide imports at each call site.

**Placeholder scan:** Concrete lucide icons at every call site (FileText, MessagesSquare, Film, ListTodo). Seed content is concrete Portable Text. es/fr/ar i18n values are translated at implementation — flag in the report if any are machine-approximated.
