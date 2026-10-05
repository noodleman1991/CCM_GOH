# Dashboard, profiles and onboarding — design

Date: 2026-10-05 · Status: proposed (user review) · Plan: `docs/superpowers/plans/2026-10-05-dashboard-profile-onboarding.md`

## 1. What and why

**User request (2026-10-05):**
- Rearrange the dashboard to be more interesting, with **no repetitions**, and **events in the dashboard**: your RSVPs and events from your community.
- Give profile pages **more room for relevant, personal content**.
- Make the matching changes to onboarding.

### What's there today (seen on dev, 2026-10-05)

**Dashboard** — the same things appear two or three times:
- **Edit Profile** sits in the header *and* in the Manage Profile card.
- The **Quick Actions** grid repeats the sidebar: Collaborate = "Find people", Workspaces = "Start a project", Account Settings and Messages = the account menu. Submit Case Study covers only one of the four kinds a member can share.
- **Recent Work** is profile content.
- A big **"Profile 17% complete"** band takes the top of the page and says nothing specific.
- **For you** is a list of bare, truncated titles.
- **No events at all** — not the member's RSVPs, not their community's.

**Profile** — the same facts appear twice, the personal ones hardly at all:
- **Repeated:**
  - skills (header chips *and* a Skills card);
  - work (the header line *and* a work card);
  - location (the header *and* the stats card);
  - communities (stats, side card *and* a tab);
  - "Recent Work" and "Contributions" as tabs *and* as section headings.
- **The stats card** is mostly those duplicates.
- **Members' own words have no home:** a member's motivation, what they're looking for, languages, collaboration interests and prompts appear only if filled, scattered or not at all.

**Onboarding** asks for name, location, work, privacy and recent work. It never asks the personal fields the profile could show:
- headline, pronouns, languages;
- what brought them here;
- what they're looking for, focus topics;
- a prompt.

## 2. Decisions (proposed — confirm on review)

- **D1 — One idea per place.** Everything has one home:
  - **sidebar**: going places;
  - **dashboard**: what's next for *me*;
  - **profile**: who I am;
  - **My contributions**: what I sent.

  Duplicates are removed, not restyled.
- **D2 — The dashboard is "your week".** Top to bottom:
  1. **Header**
     - "Good morning, Amit" (time-of-day, in the member's zone), avatar.
     - A small profile-strength ring that opens **one** specific next step ("Add a headline — it's the first thing people read").
     - Replaces the 17% band and both Edit buttons.
  2. **Your week** — the story gesture: one timeline of what's coming, soonest first.
     - Events you're going to (date tile, *Going*).
     - Tasks due.
     - Anything sent back for changes.
     - Your community's next event if you have nothing.
     - Empty → a warm line and the three best ways in (*Find an event*, *Share your work*, *Find people*).
  3. **Events — Going / In your community** (two short columns, one stacked list on phones).
     - **Going**: your upcoming RSVPs.
     - **In your community**: the next three events in your region, with RSVP right there; outside events open the organiser's site.
     - No community → "Coming up across the hub".
  4. **Your community band** (exists): kept once. Its "Join a regional community" empty state replaces the separate Join card.
  5. **For you**: the same follows-based items as typed cards (kind, image or tint, place). The "Recent community news" box folds in here (news from your region is "for you").
  6. **Your contributions** card (exists).
  7. **Open to collaborate?** card (exists): shown when the team has it on.

  **Removed:** the Quick Actions grid, Recent Work, the separate Join card, the 17% band.
- **D3 — The profile tells a person's story, then their work.** One scrolling page with the existing section menu (chapters), no tabs:
  1. **Header**
     - Photo, name, pronouns, headline.
     - One line of facts: role · organisation · place · member since · languages.
     - Badges: open to collaborate.
     - Actions: Message / Ask to connect / Follow / Show email (protected).
  2. **About** — the member's own words:
     - bio;
     - "What brought me here" (motivation);
     - **Looking for** (chips);
     - **Open to collaborate on…** (interests);
     - **focus topics**;
     - **prompts** (Q&A cards, the most human part);
     - the opt-in lived-experience statement.
  3. **Work**
     - Role at organisation, work bio, skills (once), **recent work** as a timeline, ORCID / LinkedIn / website links (as the member allows).
  4. **On the hub**
     - Contributions (published), events they **organise**, public workspaces.
     - RSVPs are never shown publicly.
  5. **Communities** (once).

  **For the owner:**
  - every empty section shows a gentle "Add …" prompt where it would be;
  - a "See it as others do" switch.
- **D4 — Onboarding gets an "About you" step**, every field optional and skippable:
  - **basic info** adds pronouns, languages and a photo upload;
  - a **new "About you"** step: headline, what brought you here, looking for (chips), focus topics (chips from the CMS list), one prompt (pick a question, answer it), open to collaborate (moves here from work);
  - **work** stays;
  - **privacy** explains that emails are never shown on the site — only revealed to a verified person you allow;
  - the step's words and its **looking-for and focus-topic options** live in a new onboarding global (`onboardingAboutYou`, like the other step globals), so the team edits them — no hardcoded vocabularies (standing rule);
  - the same chips become editable in Edit profile, where they're stored today but have no input.
- **D5 — Personal data protection stays absolute** (memory rule, 2026-10-05):
  - email and phone never reach a page;
  - lived-experience statement and RSVPs stay private unless the member opts in;
  - the profile shows only what the member's show-settings allow.
- **D6 — Admin roles page (optional, needs your yes):**
  - an admins-only **Members & roles** page in the admin;
  - search a member, see their role, change it between member / team editor / admin;
  - a change is logged and needs a confirm;
  - community-lead assignment stays on each community.
  - Writes the members database through a server action (no schema change).

## 3. Design notes

**Data** (no Prisma schema change; one additive Payload global, `onboardingAboutYou`):
- *Your week* merges, in a pure `buildYourWeek(...)`:
  - `prisma.rsvp` (GOING, upcoming events via `getAllApprovedEvents`);
  - `myTasks()` (open tasks assigned to you — tasks have no due date);
  - `listMyContributions` (revision items);
  - region events.
- *In your community* filters `getAllApprovedEvents()` by the member's community slug.
- Profiles reuse `getUserProfile` (already contact-free), `getAnsweredPrompts`, contributions, events organised (`events` where `submittedBy` = member and approved), and public workspaces.

**Layout:**
- Container queries (`@content-md/page:`) so the dashboard works in the sidebar layout.
- Phone-first: Your week is a vertical list; events are one stacked list.

**Copy:** four languages, human tone; time-of-day greeting in the member's language and zone (client-side, like the events page).

## 4. Build order

1. Your week + events on the dashboard (data + UI).
2. Dashboard clean-up (remove duplicates, new header, typed For you).
3. Profile restructure (About / Work / On the hub / Communities, owner prompts).
4. Onboarding "About you" step + basic-info additions.
5. (If approved) admin Members & roles.

Each step is rendered-checked en/ar at 375/1280 before the next.

## 5. Testing

- **Unit:**
  - `buildYourWeek` ordering and empty states;
  - community-event selection;
  - profile section visibility rules (owner vs visitor, empty sections, show-settings);
  - onboarding schema for the new optional fields;
  - roles action (admin only, valid roles, can't demote yourself last admin).
- **Rendered:** a member with RSVPs + a task + a sent-back item; a brand-new member (all empty); a full profile and an empty one, as owner and as visitor.

## 6. Out of scope

- New Prisma fields.
- Public RSVP lists.
- Dashboard customisation (drag/hide sections).
- Badges/gamification.

## 7. Risks

- Removing Quick Actions takes away familiar buttons — every destination stays reachable from the sidebar or the account menu (checked in the plan).
- Profile pages with many sections can get long. Sections render only with content; the chapter menu keeps them navigable.
