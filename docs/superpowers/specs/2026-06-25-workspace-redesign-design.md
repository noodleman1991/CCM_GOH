# Workspace Redesign — Design Spec

**Date:** 2026-06-25
**Status:** approved for planning
**Branch:** feat/redesign-and-comments

## Problem

The collaboration **workspace** is a tab-shell over 6 features (plan, docs, threads, files, media, members) with no stated purpose. An audit found: creation drops you into an empty shell (no seeded content); the "overview" is a description field + four count tiles that read "0"; the Plan is an empty void where a "stage" is an unlabeled column; every empty state is a single "No X yet." line; and the components ignore the app's design system. The intent — that workspaces produce hub content — lives **only in code comments**. Users literally cannot tell what a workspace is for, what the stages mean, or what to do first.

The layout also stacks a workspace left-rail beside the app's existing global sidebar (two sidebars).

## What a workspace IS (the decision that drives everything)

**A workspace is a team's staging ground to propose → draft → publish content into the hub.** It produces one or more **outputs** — `caseStudy`, `livedExperience`, `researchOutput`, events (more types later). Purpose varies per workspace; stages/tasks are customizable, not fixed; but every workspace uses the same toolset (plan, docs, threads, files, members). The through-line is: **a workspace produces hub content.**

The connection to that content is the **spine** of the redesign: a workspace links to real Sanity **drafts** of its outputs, and surfaces their live status (draft → in review → published) using the **Phase-6 review→publish pipeline**. The workspace is the staging ground; **Sanity is the system of record** for the output content.

## Layout (single sidebar, top tabs)

- The app's **global sidebar auto-collapses to icons** when you enter a workspace route, and restores when you leave (a "focus mode"; the global nav stays one click away via the icon rail / a `»` expand affordance). **No second sidebar.**
- The **workspace nav is horizontal top tabs**: `Home · Plan · Outputs · Docs · Threads · Files · Members`. Under a header carrying breadcrumb (‹ Workspaces) + title (inline-editable for editors) + a workspace status badge.
- **Mobile-first:** top tabs collapse to a horizontal scroll / drawer (per the project's mobile-UX directives); never a nested sidebar.
- Reuse the app design language throughout: `SectionHeader`, `lib/design-tokens`, `lib/ccm-colors`, `components/ui/card` — the workspace components currently hand-roll everything and must adopt these.

## Home (replaces the four-zeros overview)

Home answers **"what are we making, and where does it stand?"** Order:
1. **Outputs we're making** — a grid of the linked output drafts; each card shows output type (Case study / Lived experience / Research output / Event), title, and **live status badge** (Draft / In review / Published) pulled from Sanity. Plus a **"+ Add an output"** affordance.
2. **Plan progress** — `done/total` tasks, a progress bar, per-stage counts (e.g. "Draft 2/6").
3. **Recent activity** — a short feed (who did what: moved a card, edited a doc, uploaded a file, added an output).
4. **Members** — avatars + a manage link.

## The outputs spine — data model

New Prisma model linking a workspace to its Sanity output drafts (Sanity is source of record; we cache enough to render the Home without N Sanity fetches, and refresh status on view):

```
model WorkspaceOutput {
  id              String   @id @default(cuid())
  collaborationId String
  collaboration   Collaboration @relation(fields: [collaborationId], references: [id], onDelete: Cascade)
  sanityId        String              // the Sanity document _id of the draft/published output
  sanityType      String              // "caseStudy" | "livedExperience" | "researchOutput" | "event"
  title           String              // cached display title (refreshed on view)
  status          String              // cached: "draft" | "pending" | "revision" | "approved" (Sanity status)
  createdById     String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([collaborationId, sanityId])
  @@index([collaborationId])
}
```
- `Collaboration` gains `outputs WorkspaceOutput[]`.
- Migration is **additive/nullable**, applied to the Neon dev branch first (never `migrate dev` against prod), following the established file-only migration + `migrate deploy` pattern.
- **Status is read from Sanity on Home load** (a single grouped GROQ by `_id in [...]`) and the cached `status`/`title` updated, so badges are live without a per-card fetch. Cache is the fallback if Sanity is unreachable.

### Creating / linking an output ("What are you making?")
- **Create new:** pick a type → create a Sanity **draft** of that type seeded with the workspace title/region (reuse the existing Sanity write client + the Phase-6 types), then insert a `WorkspaceOutput` row. The draft enters the **existing review pipeline** — submit→review→publish is unchanged (the `sanity/actions/*` review actions already exist for caseStudy/livedExperience/researchOutput).
- **Link existing:** pick from the member's existing drafts (or paste an id) → insert a `WorkspaceOutput` row.
- Authz: create/link/remove an output requires EDITOR+ (reuse `canInCollab`/`authorizeCollab`; add a `collab:editOutputs` capability mapped to OWNER/EDITOR).

## Server actions & API

- `lib/actions/workspace-outputs.ts` — `addOutput(collaborationId, {type, mode:'create'|'link', sanityId?})`, `removeOutput(id)`, following the established `"use server"` + `getActor` + `authorizeCollab` + Zod + `Result<T>` shape.
- `lib/collaboration/service.ts` — `getOutputs(collaborationId)` reader; a `getActivity(collaborationId)` reader for the Home feed; extend `_count` so Home shows real plan/docs/output counts.
- Home status refresh: a server function that fetches the linked Sanity docs' `{_id, title, status}` and updates the cached rows.

## Plan clarity (no empty void)

- **Creation seeds** 3 generic starter stages (`To do · In progress · Done`) + one starter doc, so the Plan and Docs tabs are never empty on day one. (Generic per the chosen model — stages are not tied to output type.)
- **Explanatory framing:** the Plan tab gets a `SectionHeader` with a one-line "what a stage is" description; empty/first-run shows an onboarding card, not "No plan yet."
- **Richer tasks:** expose the `assigneeId` the schema already has (assign a member) + add a task **status is already there**; a task can be opened for a small detail (assignee, optional note). Keep it lean — no due dates in v1 unless trivial.
- (Cross-stage drag and full kanban are explicitly **out of scope** for this redesign; noted as a follow-up.)

## Empty states & onboarding (every tab)

Replace each "No X yet." line with a real onboarding card: a one-line explanation of what the tab is for + the primary action. Author the copy in the i18n namespaces (`collaboration`, `plan`, `docs`, and a new `outputs` namespace) across en/es/fr/ar.

## Build approach — outputs-first, phased

Each slice ships independently, ends green (`pnpm typecheck && pnpm test && pnpm build` + rendered-UI validation on dev/staging), is its own commit (no AI attribution), and is validatable before the next.

- **Slice 1 — The spine.** `WorkspaceOutput` model + migration (dev branch) → `addOutput`/`removeOutput`/`getOutputs` + status refresh → the **Outputs tab** + the **redesigned Home** (outputs-led, plan progress, activity, members) → the "What are you making?" create/link flow. Unit tests for the actions (authz + Zod + the create/link branches). This alone fixes "what is this / why".
- **Slice 2 — Layout + first-run + plan clarity.** Global-sidebar auto-collapse inside workspace routes + workspace **top tabs** (replacing the second sidebar) → creation seeds starter stages + starter doc → Plan `SectionHeader` + framing + assignee on tasks → real onboarding empty states across tabs + i18n.
- **Slice 3 — Design-language pass.** Adopt `SectionHeader`/design-tokens/cards across every workspace tab for visual consistency with the app; per-tab headers carrying explanatory copy.

## Out of scope (noted follow-ups)

- Full kanban (cross-stage task drag), task due dates, doc folders/nesting, non-YouTube media — not part of this redesign.
- Events as an output type: the link model supports `sanityType: "event"`, but the create-event-from-workspace flow can follow once the events surface (Phase 5.4) is wired to it.

## Testing & validation

- Unit tests for `workspace-outputs` actions (authz denial for non-editors, Zod rejection, create vs link branches, status mapping) mirroring `collaboration-authz.test.ts`/`lib/__tests__/*` patterns.
- Rendered-UI validation on dev/staging via Playwright: Home renders outputs with live status; sidebar collapses on entering a workspace; tabs work; empty states show onboarding; mobile (375) + RTL (`ar`).
- Green gate each slice.

## Risks

- **Status drift** between the cached `status`/`title` and Sanity — mitigated by refreshing on Home load; cache is fallback only.
- **Sidebar auto-collapse** must not fight the app's existing sidebar state/persistence — implement as a route-scoped collapse that restores prior state on exit, not a global state mutation.
- Additive migration only; risky Sanity writes (creating drafts) use the existing write client and the review pipeline — no new publish path.
