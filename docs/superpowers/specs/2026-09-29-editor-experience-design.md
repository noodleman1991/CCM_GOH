# Editing that feels natural — design

**Programme:** follows CMS projects 1–4 (page builder on shared Sections). Next after this: events (member/external events, submission permission). Project 5 (content forms) stays queued.

**Date:** 2026-09-29 · **Status:** approved in conversation (parts 1 and 2), awaiting written-spec review

## 1. Who and why

Three kinds of editor, none of whom build pages from scratch (user, 2026-09-29):

- **Community leads** — keep their own regional community's page up to date.
- **Team members** — quick fixes: a heading, a photo, a link, on a page they are looking at.
- **Moderators** — decide on member submissions and held comments.

Today every one of them must learn Payload's admin: find the right collection among ~23, find the section inside a long form, understand "Publish" vs "Save draft", and check four collections plus the site's `/moderation` page for work. Leads cannot be given access at all — the only editing roles are site-wide.

**Success:** someone who has never seen the admin can (a) fix a heading or photo in under a minute starting from the site, (b) as a lead, publish their community's update without asking anyone, (c) as a moderator, clear everything waiting from one screen.

**Assumptions (stated, not asked):** Payload's visual look stays; we change what it shows and says. No page-building wizard.

## 2. Roles after this project

| Role (Prisma `User.role`) | Admin access | Can edit | Moderates |
|---|---|---|---|
| `community_member` | none | own submissions, profile, workspaces | — |
| `community_editor` → shown as **Community lead** | only "Your community" | the communities they are assigned to, except members, page address and leads | — |
| `team_editor` | full | everything | yes |
| `admin` | full + admin users | everything | yes |

`community_editor` exists today with no rights at all; this project gives it this meaning. Collaboration-workspace roles (Owner/Editor/Commenter/Viewer) are unchanged.

## 3. Design

### Part 1 — editing starts on the site

**3.1 Edit buttons for whoever may edit.** "Edit this section" already shows to staff on the homepage, community pages and regular pages. It now also shows to a community's leads on that community's page (and nowhere else). Detail pages of news posts, agendas, lived experiences, case studies and events get one "Edit" button at the top, for staff.

**3.2 The editor opens where you clicked.** The link carries the section (`#sections-row-N`, as today). A small admin client component on the Sections field reads it and:
- opens that row, scrolls to it, and collapses every other row and every "More options" group;
- opens Live preview beside the form (Payload's live-preview toggle, set on load);
- shows a **"← Back to the page"** link to the URL the editor came from (passed as `?from=`, same-origin paths only).

**3.3 Plain buttons and a status line.** Payload's labels are overridden through the admin i18n translations (English admin):
- "Save draft" → **Save without publishing**; "Revert to published" → **Discard my changes**; "Publish changes" stays.
A banner at the top of every drafts-enabled document says either **"Everything you see is live."** or **"Visitors still see the published version. You have unpublished changes."**, from the document's `_status` and whether a newer draft exists.

**3.4 Languages in words.** The locale picker reads **"Editing: English ▾"**. The existing per-row translation status wording becomes "Not translated yet — visitors see English".

### Part 2 — leads, the admin home, one review queue

**3.5 Community lead access.**
- `regionalCommunities` gains **Community leads** (`leads`, hasMany relationship to Payload `users`, staff-only field — editable and readable by `hasEditorRole` only, boolean field access).
- Assigning: staff pick people who have signed in to the hub. Because a Payload user only exists after a first admin sign-in, the picker searches hub members (Prisma `User`, by name/email) through a small staff-only admin component, and saving creates the Payload `users` row if needed and sets the Prisma role to `community_editor` (never lowering `team_editor`/`admin`). Removing a person from every community returns them to `community_member`. One hook, run in the same request as the save.
- The Clerk strategy admits `community_editor` into the admin (today it admits only `hasEditorRole`).
- Access, all enforced on the server:
  - `regionalCommunities.read/update` for a lead: a `Where` limiting to documents whose `leads` contains the user (collection access may return a `Where`); `create/delete`: staff only.
  - Field-level `update` on `members`, `slug`, `leads` (and `region`): staff only — boolean functions only (see the field-access gotcha).
  - Every other collection and global: unchanged (`isEditor`), so a lead is refused on the server, not just hidden.
  - Media/files uploads: leads may create (to add a photo), not delete others'.
- Admin navigation for a lead: every collection except `regionalCommunities` and `media` is `admin.hidden` for them; `regionalCommunities` is labelled **"Your community"**.
- On the site: `isStaff` stays staff-only; a new `canEditCommunity(actor, communityId)` decides the community page's edit buttons.

**3.6 A friendly admin home.** The existing `EditorDashboard` (`beforeDashboard`) becomes role-aware:
- **Staff:** shortcut cards — Edit the homepage · Pages · Communities · **Waiting for review (n)** → `/moderation` · **Recent changes** (last 10 edits across pages/homepage/communities: who, what, when, links; from the versions tables).
- **Leads:** one card per community they lead — name, last published date, **Edit** and **View on site**.
- Staff navigation groups renamed in plain words: **Site pages · Hub content · People & organisations · Settings**.

**3.7 One review queue on the site.** `/moderation` gets a new first tab, **Waiting for review**:
- One list, newest first, of: items with `moderationStatus: pending` in the four moderated collections (case studies, events, lived experiences, research outputs) and held comments (today's pending tab).
- Each row: type badge, sender, time, readable preview (title, summary, picture) and in-place actions **Approve**, **Ask for changes**, **Reject** (the last two require a note, chosen from short presets or typed — the existing `reviewNotes` rule), and **Open in the admin**.
- Actions call the existing `runModerationAction` (the same code the admin buttons use), so emails, search indexing and cache clearing behave exactly as today; comments keep their existing actions.
- The count shows as a badge on the site's staff menu entry.
- The flagged/reported comment tabs stay.

## 4. Build order (slice by slice, each rendered-checked before the next)

1. 3.2 editor opens on the section (+ Back link) — the core gesture.
2. 3.3 + 3.4 wording, status banner, language label.
3. 3.1 edit buttons on detail pages.
4. 3.7 review queue.
5. 3.6 admin home.
6. 3.5 lead access (last: most sensitive).

## 5. Testing

- Unit: the row-opening component's URL parsing (row index, `from` accepted only as a same-origin path); status-banner states; queue merge/sort across collections + comments; `canEditCommunity`; lead access functions (lead of A can read/update A, not B; cannot update `members`/`slug`/`leads`; cannot read pages/homepage; staff unaffected); role hook (assign → `community_editor`, remove from all → `community_member`, never demotes staff).
- Rendered (dev, Playwright, 1280 and 375, en and ar): click Edit on a community section → admin opens on that row with preview; publish; Back returns. Queue approve/reject on dev data. Signed-in lead session: sees only their community; direct URL to another community or `/admin/collections/pages` refused.
- Full suite, `tsc`, eslint on changed files; `/admin` 200 after every admin-component change (admin client-import gotcha).

## 6. Out of scope

True inline (type-on-the-page) editing; restyling the admin; leads moderating their region's submissions; leads editing members; page-building wizards; events changes (next project).

## 7. Risks

- **Payload internals for 3.2/3.3** (opening a row, toggling live preview, label overrides) may shift between Payload versions → keep them in one small component, covered by a rendered check.
- **Lead access leaks** → server-side access functions are the gate and have direct tests; hidden navigation is convenience only.
- **Role hook and Prisma/Payload drift** → the hook writes both in one place; the Clerk strategy already re-syncs role on sign-in.
