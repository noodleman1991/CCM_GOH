# Opening collaboration, in stages — design

Date: 2026-10-03 · Status: proposed (user review) · Plan: `docs/superpowers/plans/2026-10-03-opening-collaboration.md` (Stage 0 + Stage 1; Stages 2–3 get their own plans once Stage 1 has been live)

## 1. What and why

The hub has a complete collaboration programme — notifications, contact requests, workspaces, direct messages — and on the live site **all of it is hidden by one switch** (`NEXT_PUBLIC_FEATURE_ENGAGEMENT`, not set on Vercel → off). Nothing gets tried, so nothing gets better.

### What was validated (2026-10-03)

**Live site, switch off:**
- No "Start a project" tile, no Messages in the account menu, no notification dot, no "Message" on people cards, no staff "Send notification".
- `/collaborations`, `/messages` and `/moderation/broadcast` redirect home.
- The words appear only inside the page's translation text, never as links.

**Dev, switch on**, in the workspace "The best project":
- All eight tabs render with 0 console errors: Overview ("What needs you"), Outputs (status per item across all four content kinds), Plan (stages, tasks, assign, @mentions), Docs, Threads, Files (upload, PDF annotation), Media, Members.
- Visibility (Members only / Make public / View public page) and Archive are offered.
- `/messages` (Messages + Notifications tabs) and `/api/notifications` work.

Found while validating:
- **(a)** The Threads tab counts 2 but lists 1; the count includes archived threads.
- **(b)** Two workspace outputs show as "Untitled": case studies attached before they had a title.
- **(c)** The workspace page spent 44 s in application code on dev, beyond compiling. It needs measuring before any member sees it.

**Live usage** (read-only, 2026-10-03):
- 710 members; **0** "open to collaboration".
- 2 workspaces (3 members); 10 contact requests; 2 follows; 12 notifications; 0 RSVPs.

**Why "open to collaboration" is at zero:** it's off by default and only reachable deep in profile edit. "Find people" can't filter by it, and nothing happens when someone is open. Accepting a contact request only sends a notification that, with the switch off, nobody can see. A connection gives the two people no way to reach each other.

## 2. Decisions (proposed — confirm on review)

- **C1 — The team opens things, not a deploy.** A new admin page **Settings → Collaboration** (Payload global `collaborationSettings`, editors can change it) replaces the env switch:
  - `notifications`: on/off
  - `people`: on/off (the open-to-collaborate prompt, the filter, Ask to connect)
  - `workspaces`: off / team / leads / members
  - `messages`: off / on

  Defaults equal today's live state (everything off), so shipping it changes nothing until someone flips a setting.
- **C2 — Stages, each switched on separately and watched before the next:**
  - **Stage 1 — People and notifications:** open to collaborate, Ask to connect, the notification feed.
  - **Stage 2 — Workspaces:** team → community leads → members.
  - **Stage 3 — Direct messages.**
- **C3 — No members-database changes.** Members-database (Prisma) migrations don't run on deploy, so everything reuses existing columns and enums (`openToCollaboration`, `collaborationInterests`, `ContactRequest`, `Follow` REGION, notification types `REQUEST`, `OUTPUT_STATUS`, `FOLLOWED_PUBLISH`). The one schema change is the Payload global, whose migration does run on deploy.
- **C4 — Open to collaborate is asked, not buried:**
  - A friendly dashboard card: "Open to collaborating? Say yes and people working on the same things can ask to connect." with **Yes, I'm open** + an optional "What would you like to work on?" line, or **Not now** (remembered on that device).
  - The same toggle in onboarding's work step.
  - "Find people" gets an **Open to collaborate** chip, and open members sort first.
- **C5 — Ask to connect leads somewhere.**
  - Only shown on members who are open to collaborate.
  - A short note (optional, 300 characters), rate-limited as today (20/hour).
  - The recipient gets a notification and an email with **Accept** / **Not now**.
  - On accept, each sees the other's email on the other's profile ("You're connected") and gets it in the acceptance notification.
  - Accepting is the consent; nothing is shared before it.
- **C6 — Notifications that matter, in the hub:**
  - Turning the setting on shows the dot and the Notifications tab.
  - Added (no new types): the outcome of anything a member sent — any of the four kinds, `OUTPUT_STATUS`, alongside the email; a new event approved in a region they follow — `FOLLOWED_PUBLISH`, at most one a day per region.
  - Existing ones keep working: replies, mentions, RSVP receipt, event reminder.
- **C7 — Workspaces (Stage 2) open by audience:**
  - *team* = team editors and admins; *leads* = + community editors; *members* = everyone signed in.
  - The audience decides who sees "Start a project" and the Workspaces link.
  - Anyone already a member of a workspace can always open it.
  - Before *members*: fix (a)–(c) above and confirm the workspace page loads in under 3 s on production.
- **C8 — Messages (Stage 3)** reuse the existing privacy setting (Everyone / People I follow / My connections) and the existing Report button. Opening them is the last step, after reports have a home in Moderation.

## 3. Design

### Part 1 — the setting and how code reads it (Stage 0)

- **Payload global** `collaborationSettings` (group Settings, read: anyone, update: editors), with fields as C1 and plain-word labels and help:
  - `notifications` (checkbox)
  - `people` (checkbox)
  - `workspaces` (select: off / team / leads / members)
  - `messages` (checkbox)

  Its migration is additive (one table).
- **Server:** `getCollaborationSettings()` (cached, tag-revalidated on save, falls back to all-off on any read failure) and `collaborationAccess(settings, role)` returns, pure and unit-tested:

  ```ts
  type CollaborationAccess = {
    notifications: boolean;
    people: boolean;
    workspaces: { see: boolean; create: boolean };
    messages: boolean;
  };
  ```
- **Client:** the locale layout reads the settings plus the viewer's role once and provides `CollaborationAccessProvider`; `useCollaboration()` replaces `FEATURES.engagement` in client components.
- **Server code paths:** actions, pages and API routes call `getCollaborationAccessFor(actor)`.
  - Every current `FEATURES.engagement` check (19 files) maps to one of the four keys.
  - Server actions stay closed when their key is off: refuse before any database work, as today.
- **The env switch:** `FEATURES.engagement` is deleted. `NEXT_PUBLIC_FEATURE_ENGAGEMENT=true` remains only as a dev override that forces everything on, so local development keeps working.

### Part 2 — Stage 1 (people + notifications)

- **Dashboard card** `OpenToCollaborateCard` (C4)
  - Shown when `people` is on, the member isn't open yet and hasn't said "Not now" on this device.
  - Saves through the existing profile action.
  - After "Yes" it turns into "You're open — edit what you'd like to work on".
- **Onboarding:** a toggle and an interests line in the work-info panel.
- **Find people**
  - `openOnly` in the collaborate filters (`?open=1`), a chip "Open to collaborate (N)".
  - The people query orders `openToCollaboration desc` first.
- **Ask to connect** (C5)
  - On people cards and profiles of open members; existing `requestContact` with the note.
  - The accept/decline UI already exists in the Notifications tab (`respondToContactByTarget`).
  - The acceptance writes the `REQUEST` notification to both with the other's email in the structured snippet.
  - Profiles show "You're connected · email" when an accepted request exists.
- **Notifications** (C6)
  - `notifySubmissionStatusChange` (events spec) also writes an `OUTPUT_STATUS` notification for the submitter.
  - The moderation hook, when an event becomes approved, writes `FOLLOWED_PUBLISH` to followers of its region; deduplicated per member, region and day.
- **Copy:** all four languages, human tone, "connect" not "contact request".

### Part 3 — later stages (own plans)

**Stage 2:**
- Fix (a) thread count without archived threads; (b) "Untitled" outputs fall back to "Untitled case study" plus a "Give it a title" link; (c) measure and cut the workspace page's reads.
- Audience switch; "Start a project" for the audience.
- Leads get a short in-admin guide.

**Stage 3:**
- A Moderation section "Reported messages".
- Then switch messages on.

## 4. Build order

1. **Stage 0:** global, access helper, provider, swap of all 19 gates. Rendered checks:
   - with all off, the live behaviour is identical (sidebar, menus, redirects);
   - with all on (dev override), identical to today's dev.
2. **Stage 1:** card, onboarding toggle, filter, Ask to connect + connected profile, the two new notifications. Rendered checks en/ar, 375/1280.
3. Runbook: how the team turns Stage 1 on, what to watch:
   - open-to-collaborate count;
   - requests sent/accepted;
   - notifications read;
   - each counted with read-only queries, plus PostHog where consent is given.

## 5. Testing

- **Unit:**
  - `collaborationAccess` for every setting × role (team_editor, admin, community_editor, community_member, signed-out);
  - the settings fallback;
  - filter param round-trip;
  - notification fan-out and the per-day dedupe;
  - connected-email visibility (only both sides of an ACCEPTED request).
- **Gate tests:** every server action refuses when its key is off (extend `engagement-flag-gates.test.ts`).
- **Rendered:** both setting extremes on dev, signed in as staff and as a member.

## 6. Out of scope

- Real-time delivery (push, websockets).
- New Prisma models.
- Group messaging.
- Workspaces for signed-out visitors beyond the existing public project page.

## 7. Risks

- **Email** only reaches one verified address until the Resend domain is verified. In-hub notifications don't depend on it, which is why C6 leads with them.
- **Accidental exposure:** the C5 "connected" email is the first place the hub shows one member's email to another. It is strictly mutual-consent and covered by a test.
- **Settings read failing** must fall back to all-off, never all-on (test).
