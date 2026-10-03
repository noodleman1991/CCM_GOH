# My contributions — design

Date: 2026-10-03 · Status: proposed (user review) · Plan: `docs/superpowers/plans/2026-10-03-my-contributions.md`

## 1. What and why

Members can send four kinds of content to the hub — **case studies, lived experiences, research outputs and events** — and every one lands in the CMS with the same review fields (`submittedBy`, `moderationStatus` = pending / revision / approved / rejected, `reviewNotes`) and the same edit route (`…/submit?edit=<id>`, events `…/suggest?edit=<id>`). The team reviews all four in Moderation → "Waiting for review".

The member's side is uneven:

| Kind | Where a member sees what they sent | Team's note shown | Edit link |
|---|---|---|---|
| Case study (+ unsent drafts) | Dashboard → My submissions | yes | yes |
| Event | `/events/suggest` → Your suggestions | yes | yes |
| Lived experience | **nowhere** | no | only if they kept the URL |
| Research output | **nowhere** | no | only if they kept the URL |

The sign-in "needs changes" alert (`RevisionAlertProvider`) also covers case studies only. So a story sent back for changes is invisible to the person who has to change it.

**Goal:** one place — Dashboard → **My contributions** — where a member sees everything they've sent, what happened to it, what the team said, and the one next step, in their own language.

## 2. Decisions (proposed — confirm on review)

- **M1 — One page, same address.** `/dashboard/submissions` becomes **My contributions** (links in the case-study form and the revision alert keep working). Sidebar/account label "My contributions".
- **M2 — Ordered by what needs doing, not by kind.** Sections, each hidden when empty: **Needs your changes** (revision) → **Drafts** (case-study drafts not yet sent) → **Waiting for review** (pending) → **Published** (approved) → **Not accepted** (rejected, collapsed). Kind chips above (All · Case studies · Lived experiences · Research outputs · Events, each with its count, single choice, `?kind=`), hidden kinds with zero items.
- **M3 — One row for every kind.** Kind eyebrow in that kind's colour (`TYPE_STYLE`), title (2 lines), "Sent 3 days ago" / "Saved…" (relative, in the reader's language), status pill (the tones already used by Your suggestions), the team's note in a soft panel for *Needs changes* and *Not accepted*, and exactly one primary action: **Continue** (draft) · **Make changes** (revision) · **Edit** (pending) · **View** (published, opens the public page). Editors additionally get **Open in admin**.
- **M4 — Dashboard home card.** "Your contributions": the four counts that matter (needs changes · waiting · published · drafts) and up to two *Needs changes* items with their button; replaces today's "Recent submissions" box (approved case studies only). Hidden for members who have sent nothing — replaced by a single "Share your work" line linking to the four forms.
- **M5 — The sign-in alert covers all four kinds.** It reads the same list and names the item ("Your story *Living with the rising tide* needs a few changes").
- **M6 — Events page keeps its list**, rendered with the shared row so both places look and behave the same.
- **M7 — Workspaces (follows opening-collaboration Stage 2).** When a contribution is also a workspace output and the viewer can see workspaces, the row shows "Part of *workspace name*". Not in this plan: workspaces are closed on the live site until Stage 2, so it ships with that plan.
- **M8 — CMS side unchanged.** No new fields, no migration: the four collections already share the review fields; the reader just asks all four.

## 3. Design

### Data
`listMyContributions(clerkUserId): Promise<Contribution[]>` — one read per collection, in parallel, `queryLive` (fresh, never cached — it's the member's own state), `depth: 0`, `select` of the row fields only:

```ts
type ContributionKind = "caseStudy" | "livedExperience" | "researchOutput" | "event";
type ContributionStatus = "draft" | "pending" | "revision" | "approved" | "rejected";
interface Contribution {
  id: string; kind: ContributionKind; title: string; status: ContributionStatus;
  reviewNotes: string | null; date: string | null;          // sent (or saved, for drafts)
  href: string | null;                                       // public page, approved + slug only
  editHref: string | null;                                   // per kind, null when approved/rejected
}
```

Case-study drafts come from `caseStudyDrafts` (`userId`, `lastSaved`) as `status: "draft"`, `editHref: …/submit?draft=<id>`. Unknown/empty `moderationStatus` reads as `pending`. A failed read of one kind leaves the others (logged, that kind absent — never an error page). Pure helpers (`toContribution`, `groupContributions`, `countByStatus`) are unit-tested.

### Page
Server page reads the list, groups it (M2), renders chips + sections with the shared `ContributionRow`. Empty state: "Nothing sent yet" + the four "Share…" links. Four languages, Arabic right-to-left, container-query layout (one column on phones, title + actions side by side from `@content-md`).

## 4. Build order
1. Reader + pure helpers (tests). 2. Row + page (rendered check en/ar, 375/1280, a member with one of each kind). 3. Dashboard card + revision alert. 4. Events list on the shared row; runbook.

## 5. Testing
Unit: mapping per kind (edit/view links, status fallback, drafts), grouping order, counts, one kind failing. Component: row actions per status, team note shown only for revision/rejected, chips filter. Rendered: dev data with one item per kind and status; 0 console errors; no sideways scroll.

## 6. Out of scope
Withdrawing or deleting a submission (needs a new status and an editor flow); comments/likes on rows; notifications about status changes (opening-collaboration spec, Stage 2).

## 7. Risks
- `submittedBy` holds the Clerk user id on all four (verified 2026-10-03 in each submit route → `lib/content/{case-studies,lived-experiences,outputs}.ts` / `submitEvent`); the reader test pins the field name per collection.
- Lived experiences use `approved-or-unset` publicly; for the owner an unset status reads as *Waiting for review*, which is honest.
