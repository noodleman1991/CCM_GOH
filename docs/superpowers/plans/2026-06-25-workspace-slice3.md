# Workspace Redesign — Slice 3 Implementation Plan (Design-language pass)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Parent plan: `docs/superpowers/plans/2026-06-25-workspace-redesign.md` (see its "Slice 3" outline + Global Constraints). Prior slice: `docs/superpowers/plans/2026-06-25-workspace-slice2.md` (top tabs + header + empty states — DONE).

**Goal:** Normalize the visual language across EVERY workspace tab so the workspace reads as one consistent surface. This is a **consistency pass, NOT a redesign** (standing user directive: "polish = consistency with the EXISTING design language"). Two concerns: (S3.1) replace ad-hoc `rounded-lg border` divs + raw brand/hex color classes with the shared `SectionHeader` / `Card` / ccm tokens; and (S3.2) give every tab a header carrying short "what this tab is for" explanatory copy, with consistent spacing per the mobile-UX + design-uniformity directives.

**Scope of Slice 3:** S3.1 + S3.2 below, expressed as 5 tasks (one per logical tab group), each ending in a green-gate + commit. **No data flow, server action, or component-contract changes** — preserve all props and behavior. If a bug is spotted while normalizing, NOTE it in the report; do not fix inline (keep a clean styling diff).

## Global Constraints (inherited — read the parent plan)

- Green gate every task: `pnpm typecheck && pnpm test && pnpm build`. Run `pnpm test` from INSIDE this worktree (it must see only this repo's test files). The build's Sanity pre-step needs the gitignored `.env.local` copied from the main checkout; do NOT commit it.
- NEVER run `sanity typegen generate` (breaks the build).
- Reuse `lib/design-tokens`, `lib/ccm-colors`, `components/ui/section-header` (`SectionHeader`), `components/ui/card` (`Card`), `components/ui/badge` (`Badge`), `components/collaboration/workspace-empty-state` (`WorkspaceEmptyState`). Do NOT hand-roll new visual styles or invent tokens.
- i18n: per-tab copy goes under the EXISTING `collaboration.*`, `plan.*`, `docs.*`, `outputs.*` namespaces in `messages/{en,es,fr,ar}.json`. The `lib/__tests__/i18n-parity.test.ts` test ENFORCES that all 4 locales share identical leaf keys — every key added to `en` MUST also be added to `es`/`fr`/`ar` (hand-translate; flag es/fr/ar for native review).
- Honor mobile-UX directives: mobile-first, clean block alignment at ALL sizes, slightly more breathing room between stacked blocks (the +7% spacing rhythm is already baked into `design-tokens`; here we just keep consistent `space-y` between a header and its content). RTL-safe (use logical properties `ms/me/ps/pe`, `text-start`, `rtl:` only where mirroring a glyph).
- NO AI attribution in commits (repo CLAUDE.md). One commit per task, `refactor(workspace): …` or `feat(workspace): …`.

---

## Audit — current ad-hoc markup per tab (the substitution map)

Grounded in a read of every component on the Slice-2 tip:

| File | Ad-hoc markup found | Substitution |
| --- | --- | --- |
| `workspace-home.tsx` | Local `STATUS_BADGE` map with **raw hex** (`bg-[#fde9c8] text-[#92610a]`, `bg-[#d7f0dc] text-[#1d7a36]`) duplicated from outputs; inline status-pill `<span>`; raw output-type chip `<span>`; `rounded-lg border border-dashed border-ccm-sea/40` add-output tile; bare `<section>` blocks; plan/activity section titles reuse `nav.*` keys (mislabeled — "Recent activity" shows as "Overview") | Use a shared `OutputStatusPill` + `OutputTypeChip` (Task 1, new `workspace-output-chip.tsx`); keep the dashed add tile as the ONE intentional "add affordance" pattern but align its radius/tokens; add proper `home.*` section-title + subtitle i18n keys |
| `workspace-outputs.tsx` | Same duplicated `STATUS_BADGE` raw-hex map; inline status-pill + type-chip `<span>`s | Replace with the shared `OutputStatusPill` + `OutputTypeChip` from Task 1 |
| `workspace-shell.tsx` | `section === "files"` storage-not-configured branch: `rounded-lg border border-dashed p-8 text-center` ad-hoc div; `MembersSection` rows: `rounded-lg border p-3` ad-hoc divs; Members tab has NO header/explanatory copy | Storage branch → `WorkspaceEmptyState` (icon `ServerOff`); Members rows → `Card`; add a `SectionHeader` (`membersHeading`/`membersSubtitle`) above the members list |
| `workspace-plan.tsx` | Stage columns: `rounded-lg border bg-muted/20 p-3` ad-hoc divs | Replace the stage-column wrapper with `Card` (keep the `bg-muted/20` tint via className) |
| `workspace-docs.tsx` | List container `divide-y rounded-lg border`; NO `SectionHeader`/explanatory copy on the list view | Wrap the list in `Card`; add a `SectionHeader` (`docs.heading`/`docs.subtitle`) above it |
| `workspace-threads.tsx` | List container `divide-y rounded-lg border`; NO `SectionHeader`/explanatory copy | Wrap the list in `Card`; add a `SectionHeader` (`threadsHeading`/`threadsSubtitle`) |
| `workspace-files.tsx` | List container `divide-y rounded-lg border` (the dropzone's dashed border is the intentional drop affordance — KEEP); NO `SectionHeader`/explanatory copy | Wrap the file list in `Card`; add a `SectionHeader` (`filesHeading`/`filesSubtitle`); keep the dropzone as-is (drop affordance) |
| `workspace-media.tsx` | Add-row `rounded-md border p-2`; NO `SectionHeader`/explanatory copy | Keep the add-row (intentional inline-add affordance) but align radius to `rounded-lg`; add a `SectionHeader` (`mediaHeading`/`mediaSubtitle`) |

**Intentional exceptions (do NOT convert):** the dashed dropzone in Files and the dashed "add output" tile in Home are deliberate *affordances* (drag-here / click-to-add), not content cards — they stay dashed but use ccm tokens. Inline add-rows (threads/media/plan) stay as lightweight rows, not Cards.

**Header/explanatory-copy coverage:** Plan + Outputs + Home-outputs already have a `SectionHeader` with a subtitle. Slice 3 ADDS the missing ones: Docs, Threads, Files, Media, Members. Each header carries a one-line "what this tab is for" subtitle. Spacing standard: `space-y-4` between a `SectionHeader` and its content for list tabs (matches Plan/Outputs).

---

## File Structure (Slice 3)

- `components/collaboration/workspace-output-chip.tsx` (NEW) — shared `OutputStatusPill` + `OutputTypeChip` presentational components (kills the duplicated raw-hex `STATUS_BADGE` map). Reused by Home + Outputs.
- `components/collaboration/workspace-outputs.tsx` — use the shared chip/pill (S3.1).
- `components/collaboration/workspace-home.tsx` — use the shared chip/pill; proper section-title i18n; token-align the add tile (S3.1, S3.2).
- `components/collaboration/workspace-plan.tsx` — stage columns → `Card` (S3.1).
- `components/collaboration/workspace-docs.tsx` — list → `Card`; add `SectionHeader` (S3.1, S3.2).
- `components/collaboration/workspace-threads.tsx` — list → `Card`; add `SectionHeader` (S3.1, S3.2).
- `components/collaboration/workspace-files.tsx` — list → `Card`; add `SectionHeader` (S3.1, S3.2).
- `components/collaboration/workspace-media.tsx` — add-row radius; add `SectionHeader` (S3.1, S3.2).
- `components/collaboration/workspace-shell.tsx` — storage branch → `WorkspaceEmptyState`; Members rows → `Card`; add Members `SectionHeader` (S3.1, S3.2).
- `messages/{en,es,fr,ar}.json` — new explanatory-copy keys under `collaboration.*` (Members + threads/files/media header copy where the tab uses the `collaboration` namespace), `docs.*`, and a new `home.*` namespace. `plan.*`/`outputs.*` copy unchanged. (Exact keys listed per task.)

---

## Task 1 (S3.1): Shared output status-pill + type-chip (kill the duplicated raw-hex map)

The single biggest inconsistency: `workspace-home.tsx` and `workspace-outputs.tsx` BOTH declare an identical `STATUS_BADGE` map using raw hex literals (`bg-[#fde9c8] text-[#92610a]`, `bg-[#d7f0dc] text-[#1d7a36]`). Extract ONE shared presentational pair, keeping the SAME visual result (so this is a pure refactor — no pixel change), then point both files at it. This removes the raw-hex duplication that S3.1 explicitly calls out.

**Files:** Create `components/collaboration/workspace-output-chip.tsx`; Modify `workspace-outputs.tsx`, `workspace-home.tsx`.

**Interfaces:**
- `OutputTypeChip({ type }: { type: string })` — the uppercase ccm-sky pill showing the output-type label (resolves `OUTPUT_TYPES`).
- `OutputStatusPill({ status }: { status: string })` — the colored status pill; uses `useTranslations("outputs")` for the label and a shared `STATUS_PILL` map (same classes as today). Defaults to `draft`.

- [ ] **Step 1: Create the shared component.** Create `components/collaboration/workspace-output-chip.tsx`:
  ```tsx
  "use client";

  import { useTranslations } from "next-intl";
  import { OUTPUT_TYPES } from "@/lib/collaboration/outputs";

  /** Status → pill classes. Kept identical to the prior inline map so this is a
   *  pure refactor (no visual change); centralized so Home + Outputs share it
   *  instead of each re-declaring the raw color literals. */
  const STATUS_PILL: Record<string, { key: string; cls: string }> = {
    draft: { key: "statusDraft", cls: "bg-muted text-muted-foreground" },
    pending: { key: "statusPending", cls: "bg-[#fde9c8] text-[#92610a]" },
    revision: { key: "statusRevision", cls: "bg-[#fde9c8] text-[#92610a]" },
    approved: { key: "statusApproved", cls: "bg-[#d7f0dc] text-[#1d7a36]" },
  };

  /** The uppercase output-type chip (case study / lived experience / research output). */
  export function OutputTypeChip({ type }: { type: string }) {
    const def = OUTPUT_TYPES.find((d) => d.type === type);
    return (
      <span className="inline-block rounded-full bg-ccm-sky/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ccm-sea">
        {def?.label ?? type}
      </span>
    );
  }

  /** The colored review-status pill for a workspace output. */
  export function OutputStatusPill({ status }: { status: string }) {
    const t = useTranslations("outputs");
    const badge = STATUS_PILL[status] ?? STATUS_PILL.draft;
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>
        {t(badge.key)}
      </span>
    );
  }
  ```
  (The `bg-[#fde9c8]`/`bg-[#d7f0dc]` literals are retained verbatim to guarantee zero pixel drift; they were never tokens and centralizing them is the achievable normalization. Flag in the report that promoting these to ccm-color tokens is a follow-up if desired.)

- [ ] **Step 2: Use in `workspace-outputs.tsx`.** Remove the local `STATUS_BADGE` const and the inline type-chip + status-pill `<span>`s. Import `{ OutputStatusPill, OutputTypeChip }`. In the output card, replace the type `<span>` with `<OutputTypeChip type={o.sanityType} />` and the status `<span>` with `<OutputStatusPill status={o.status} />`. Keep the surrounding `Card`, the title `<p>`, the remove button, and the `flex items-center justify-between` row unchanged. The add-flow's `OUTPUT_TYPES.map` still uses the `OUTPUT_TYPES` import — KEEP it.

- [ ] **Step 3: Use in `workspace-home.tsx`.** Remove the local `STATUS_BADGE` const and the inline type-chip + status-pill `<span>`s in the outputs grid; import + use `<OutputTypeChip>` / `<OutputStatusPill>`. The `OUTPUT_TYPES` import is no longer needed in Home after this (the chip resolves the label) — remove it if unused (let typecheck/lint confirm).

- [ ] **Step 4: Green gate.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [ ] **Step 5: Commit.** `git commit -m "refactor(workspace): shared output status-pill + type-chip (de-dupe raw-hex map)"`

---

## Task 2 (S3.1 + S3.2): Home — token-align the add tile + proper section titles/copy

The Home outputs section already uses `SectionHeader`. Two normalizations remain: (a) the dashed "add output" tile uses `rounded-lg`; align it to the card radius family (`Card` is `rounded-xl`) so it lines up with the output cards; (b) the Plan-progress and Recent-activity blocks borrow `nav.*` i18n keys, so "Recent activity" mislabels as "Overview" and there is no explanatory copy. Add dedicated `home.*` keys.

**Files:** Modify `components/collaboration/workspace-home.tsx`, `messages/{en,es,fr,ar}.json`.

- [ ] **Step 1: i18n — add a `home` namespace** (sibling of `outputs`, since Home mixes both). In each `messages/{en,es,fr,ar}.json` top level add a `home` object. English:
  ```json
  "home": {
    "planProgress": "Plan progress",
    "planProgressSubtitle": "How far the stages have moved toward done.",
    "activity": "Recent activity",
    "activitySubtitle": "The latest changes across docs and outputs.",
    "viewMembers": "members"
  }
  ```
  es/fr/ar: translate the values (keys identical). Suggested:
  - es: `"Progreso del plan"`, `"Cuánto han avanzado las etapas hacia su finalización."`, `"Actividad reciente"`, `"Los últimos cambios en documentos y resultados."`, `"miembros"`.
  - fr: `"Progression du plan"`, `"Où en sont les étapes par rapport à leur achèvement."`, `"Activité récente"`, `"Les derniers changements dans les documents et les résultats."`, `"membres"`.
  - ar: `"تقدّم الخطة"`, `"مدى تقدّم المراحل نحو الاكتمال."`, `"النشاط الأخير"`, `"أحدث التغييرات في المستندات والمخرجات."`, `"الأعضاء"`.

- [ ] **Step 2: Home — use the new keys + chip components.** In `workspace-home.tsx`:
  - Add `const tHome = useTranslations("home");`.
  - Plan-progress `SectionHeader`: change `title={`${tCollab("nav.plan")} · ${done}/${total}`}` → `title={`${tHome("planProgress")} · ${done}/${total}`}` and add `subtitle={tHome("planProgressSubtitle")}`.
  - Activity `SectionHeader`: change `title={tCollab("nav.overview")}` → `title={tHome("activity")}` and add `subtitle={tHome("activitySubtitle")}`.
  - Members link: change the trailing `{tCollab("nav.members")}` → `{tHome("viewMembers")}` so it reads "3 members →". Keep the `→` and `onGoToTab("members")`.
  - Replace the inline outputs-grid type-chip + status-pill `<span>`s with `<OutputTypeChip>` / `<OutputStatusPill>` (done in Task 1; verify here).
  - Add-output tile: keep dashed (intentional affordance) but change `rounded-lg` → `rounded-xl` to match the `Card` radius so the empty tile lines up with the output cards. Keep `border-dashed border-ccm-sea/40 text-ccm-sea`.
  - Spacing: keep the existing `space-y-8` outer / `mt-3` grid — consistent with the design rhythm.

- [ ] **Step 3: Green gate.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [ ] **Step 4: Commit.** `git commit -m "feat(workspace): Home section titles/copy + token-aligned add tile"`

---

## Task 3 (S3.1): Plan — stage columns → Card

The Plan tab already has its `SectionHeader` + empty state (Slice 2). The only ad-hoc markup is each stage column wrapper: `rounded-lg border bg-muted/20 p-3`. Convert to `Card` to match the rest of the app (Card is `rounded-xl border shadow-sm bg-card`), preserving the muted tint.

**Files:** Modify `components/collaboration/workspace-plan.tsx`.

- [ ] **Step 1: Convert the stage column.** Import `{ Card }` from `@/components/ui/card`. Replace:
  ```tsx
  <div key={stage.id} className="rounded-lg border bg-muted/20 p-3">
  ```
  with:
  ```tsx
  <Card key={stage.id} className="bg-muted/20 p-3 shadow-none">
  ```
  Close with `</Card>` instead of `</div>`. (`shadow-none` keeps the lighter board feel of stage columns vs. content cards; the muted tint is preserved.) Leave the inner header row, DnD list, and add-task row untouched.

- [ ] **Step 2: Green gate.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [ ] **Step 3: Commit.** `git commit -m "refactor(workspace): plan stage columns use the shared Card"`

---

## Task 4 (S3.1 + S3.2): Docs/Threads/Files/Media — SectionHeader + Card lists

Give the four list/collection tabs the header + explanatory copy they lack, and wrap their list containers in `Card` (matching the Outputs/Home card language). Keep every behavior, every empty state, every add affordance.

**Files:** Modify `workspace-docs.tsx`, `workspace-threads.tsx`, `workspace-files.tsx`, `workspace-media.tsx`, `messages/{en,es,fr,ar}.json`.

- [ ] **Step 1: i18n.** Add header copy. Docs uses the `docs.*` namespace; threads/files/media use the `collaboration.*` namespace (that is where their `useTranslations` is scoped). Add:

  Under `docs` (en): `"heading": "Docs"`, `"subtitle": "Draft notes, briefs, and write-ups your team can edit together."`
  Under `collaboration` (en): add
  ```json
  "threadsHeading": "Threads",
  "threadsSubtitle": "Discuss decisions, share updates, and ask the group questions.",
  "filesHeading": "Files",
  "filesSubtitle": "Share PDFs and documents the team needs in one place.",
  "mediaHeading": "Media",
  "mediaSubtitle": "Embed videos — talks, demos, and recordings — for the workspace.",
  "membersHeading": "Members",
  "membersSubtitle": "Everyone in this workspace and what they can do."
  ```
  Translate all values for es/fr/ar (keys identical). Suggested:
  - `docs.heading` — es `"Documentos"`, fr `"Documents"`, ar `"المستندات"`; `docs.subtitle` — es `"Redacta notas, resúmenes y textos que tu equipo puede editar en conjunto."`, fr `"Rédigez des notes, des synthèses et des textes que votre équipe peut modifier ensemble."`, ar `"اكتب الملاحظات والملخصات والنصوص التي يمكن لفريقك تحريرها معًا."`.
  - `threadsHeading` — es `"Hilos"`, fr `"Fils"`, ar `"المناقشات"`; `threadsSubtitle` — es `"Debate decisiones, comparte novedades y haz preguntas al grupo."`, fr `"Discutez des décisions, partagez des nouvelles et posez vos questions au groupe."`, ar `"ناقش القرارات وشارك المستجدات واطرح الأسئلة على المجموعة."`.
  - `filesHeading` — es `"Archivos"`, fr `"Fichiers"`, ar `"الملفات"`; `filesSubtitle` — es `"Comparte en un solo lugar los PDF y documentos que el equipo necesita."`, fr `"Partagez au même endroit les PDF et documents dont l'équipe a besoin."`, ar `"شارك ملفات PDF والمستندات التي يحتاجها الفريق في مكان واحد."`.
  - `mediaHeading` — es `"Multimedia"`, fr `"Médias"`, ar `"الوسائط"`; `mediaSubtitle` — es `"Inserta videos —charlas, demos y grabaciones— para el espacio de trabajo."`, fr `"Intégrez des vidéos — présentations, démos et enregistrements — pour l'espace de travail."`, ar `"أدرج مقاطع الفيديو — العروض والتسجيلات — لمساحة العمل."`.
  - `membersHeading` — es `"Miembros"`, fr `"Membres"`, ar `"الأعضاء"`; `membersSubtitle` — es `"Todas las personas de este espacio de trabajo y lo que pueden hacer."`, fr `"Toutes les personnes de cet espace de travail et ce qu'elles peuvent faire."`, ar `"كل الأشخاص في مساحة العمل هذه وما يمكنهم فعله."`.

  (Note: `membersHeading`/`membersSubtitle` are consumed in Task 5 but added here so the i18n change lands in one place; they still pass parity at this commit.)

- [ ] **Step 2: Docs.** In `workspace-docs.tsx` import `{ SectionHeader }` + `{ Card }`. In the LIST view (the final `return`, NOT the open-doc view nor the empty state — the empty state already centers a card), wrap the list view in a `<div className="space-y-4">` starting with `<SectionHeader title={t("heading")} subtitle={t("subtitle")} />`, then change `<ul className="divide-y rounded-lg border">` to live inside a `Card`: `<Card className="overflow-hidden p-0"><ul className="divide-y">…</ul></Card>`. Keep the `newDoc` button below the Card. Do NOT add a header to the empty-state branch (it owns its own copy).

- [ ] **Step 3: Threads.** In `workspace-threads.tsx`, the list view already wraps in `<div className="space-y-4">`. Import `{ SectionHeader }` + `{ Card }`. Add `<SectionHeader title={t("threadsHeading")} subtitle={t("threadsSubtitle")} />` as the FIRST child of that wrapper (above the empty-state/list conditional) so the header shows whether or not threads exist (consistent with Plan, which shows its header above its empty state). Change `<ul className="divide-y rounded-lg border">` to `<Card className="overflow-hidden p-0"><ul className="divide-y">…</ul></Card>`. Keep the inline add-row `<li>` inside the `<ul>`.

- [ ] **Step 4: Files.** In `workspace-files.tsx`, import `{ SectionHeader }` + `{ Card }`. Add `<SectionHeader title={t("filesHeading")} subtitle={t("filesSubtitle")} />` as the first child of the outer `<div className="space-y-4" …drag handlers>`. KEEP the dashed dropzone (drop affordance) unchanged. Change the file `<ul className="divide-y rounded-lg border">` to `<Card className="overflow-hidden p-0"><ul className="divide-y">…</ul></Card>`. Empty-state branch unchanged.

- [ ] **Step 5: Media.** In `workspace-media.tsx`, import `{ SectionHeader }`. Add `<SectionHeader title={t("mediaHeading")} subtitle={t("mediaSubtitle")} />` as the first child of `<div className="space-y-4">`. Align the add-row radius: change `rounded-md` → `rounded-lg` on the add-row `<div className="flex items-center gap-2 rounded-md border p-2">`. The media grid (video cards) and empty state stay as-is.

- [ ] **Step 6: Green gate + build.** `pnpm typecheck && pnpm test && pnpm build` → pass (watch unused-import lint).

- [ ] **Step 7: Commit.** `git commit -m "feat(workspace): per-tab headers + Card lists across Docs/Threads/Files/Media"`

---

## Task 5 (S3.1 + S3.2): Shell — Members header/cards + storage empty state

Normalize the two remaining ad-hoc spots in the shell: the storage-not-configured branch (ad-hoc dashed div) and the Members tab (header-less, ad-hoc bordered rows).

**Files:** Modify `components/collaboration/workspace-shell.tsx`.

- [ ] **Step 1: Storage branch → WorkspaceEmptyState.** Import `{ WorkspaceEmptyState }` from `./workspace-empty-state` and add `ServerOff` to the existing lucide-react import. Replace:
  ```tsx
  <section className="rounded-lg border border-dashed p-8 text-center">
    <p className="text-muted-foreground">{t("storageNotConfigured")}</p>
  </section>
  ```
  with:
  ```tsx
  <WorkspaceEmptyState icon={ServerOff} title={t("nav.files")} body={t("storageNotConfigured")} />
  ```
  (Reuses the existing `storageNotConfigured` + `nav.files` strings — no new i18n. The empty-state card is the consistent "nothing here" surface.)

- [ ] **Step 2: Members — SectionHeader + Card rows.** Import `{ SectionHeader }` + `{ Card }` (add `Card` to the shell imports). In `MembersSection`, change the returned `<section className="space-y-3">` to `<section className="space-y-4">`, lead with `<SectionHeader title={t("membersHeading")} subtitle={t("membersSubtitle")} />`, then put the member rows in their own `<div className="space-y-3">`. Change each member row from:
  ```tsx
  <div key={m.userId} className="flex items-center gap-3 rounded-lg border p-3">
  ```
  to:
  ```tsx
  <Card key={m.userId} className="flex items-center gap-3 p-3 shadow-none">
  ```
  Close with `</Card>`. (`shadow-none` keeps the list feel; the row contents — avatar, name, role select/badge — are untouched.)

- [ ] **Step 3: Green gate + build.** `pnpm typecheck && pnpm test && pnpm build` → pass.

- [ ] **Step 4: Commit.** `git commit -m "feat(workspace): Members header + Card rows; storage empty state"`

---

## Task 6: Final green gate + rendered validation + report

- [ ] **Step 1: Full green gate.** From inside the worktree: `pnpm typecheck && pnpm test && pnpm build` → all pass. Confirm the i18n-parity test passes (proves all 4 locales gained identical keys).
- [ ] **Step 2: i18n parity sanity.** `node -e` count leaf keys per locale; all equal.
- [ ] **Step 3: Rendered validation (if dev reachable).** Start dev (`NEXT_PUBLIC_FEATURE_ENGAGEMENT=true pnpm next dev -p 3001`), open a workspace, and confirm at **375px** + on **`/ar`** (RTL): every tab shows a header + one-line subtitle; output status pills + type chips render identically to before; Docs/Threads/Files lists sit in a `Card`; Plan stage columns + Members rows are Cards; the storage-not-configured state (if R2 unset) shows the empty-state card; nothing overflows at 375; RTL mirrors (logical spacing, breadcrumb separator flips). Screenshot to `docs/design/screenshots/workspace-slice3-375.png` and `…-ar.png`. If dev is unreachable, FLAG that rendered 375/RTL validation is pending.
- [ ] **Step 4: Report** the plan path, per-tab substitutions, explanatory copy added, i18n keys added (+ es/fr/ar flagged for native review), test + green-gate results, commit SHAs, and any deferred item or spotted-but-unfixed bug.

---

## Self-Review

**Spec coverage:** S3.1 (adopt `SectionHeader`/tokens/`Card`, replace ad-hoc `rounded-lg border` + raw brand/hex classes) → Tasks 1 (de-dupe raw-hex status map into a shared pill), 3 (plan columns → Card), 4 (docs/threads/files lists → Card), 5 (members rows → Card, storage div → empty state) ✓. S3.2 (per-tab explanatory-copy headers + consistent spacing) → Tasks 2 (Home section titles/copy), 4 (docs/threads/files/media headers), 5 (members header) ✓. Plan + Outputs already had headers (Slice 2) — left intact. ✓

**No-contract-change guarantee:** Every task touches only JSX class names / wrapping elements / adds presentational `SectionHeader`s + i18n keys. No prop signatures, server actions, data fetching, or state logic change. The shared chip/pill (Task 1) is a pure extraction with byte-identical classes, so zero pixel drift on the status pills. The `bg-[#fde9c8]`/`bg-[#d7f0dc]` literals are preserved verbatim (centralized, not changed) — promoting them to ccm tokens is flagged as an optional follow-up to avoid a visual change in a consistency-only pass. ✓

**i18n parity:** Every new key (`home.*`, `docs.heading`/`docs.subtitle`, `collaboration.threadsHeading`/`…Subtitle`/`filesHeading`/`…Subtitle`/`mediaHeading`/`…Subtitle`/`membersHeading`/`…Subtitle`) is added to all four locales in the same task that introduces it, so `i18n-parity.test.ts` stays green at every commit. es/fr/ar values are hand-translated and flagged for native review. ✓

**Mobile/RTL:** No fixed widths added; headers + cards are responsive. Spacing uses the existing `space-y-4`/`space-y-8` rhythm (consistent with Plan/Outputs and the +7% token baseline). All new markup uses logical properties already standard in these files (`ms/me`, `text-start`, `<bdi>`); no physical-direction classes introduced. Rendered 375/RTL validation is gated in Task 6 and flagged if dev is unreachable. ✓

**Placeholder scan:** Concrete lucide icon at the one new call site (`ServerOff` for the storage empty state). Concrete i18n values for all locales. Intentional-exception list (dropzone, add tile, inline add-rows) is explicit so a worker doesn't over-convert affordances into Cards. ✓
