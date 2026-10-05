# Dashboard, profiles and onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- A dashboard about *your week*: your RSVPs, your community's events, what needs you — with no repeated parts.
- Profiles that tell a person's story before their work.
- Onboarding that asks for the personal details profiles now show.

**Architecture:**
- **Data:** small pure modules (`buildYourWeek`, `pickCommunityEvents`, `nextProfileStep`, `profileSections`) decide what shows and in what order; they get their own unit tests. Server pages gather the data and pass it to presentational components that reuse the hub's existing pieces (`EventTile`, `RsvpButton`, `TypedCard`, `ContributionsCard`, `RegionSectionSpine`).
- **Onboarding:** the new step follows the existing step-global pattern.

**Tech Stack:** Next.js 16 App Router, Prisma (read/write existing models only), Payload 3 (one new global), next-intl 4, Tailwind 4 container queries, vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-05-dashboard-profile-onboarding-design.md`

## Global Constraints

- **Database:**
  - No Prisma schema change.
  - One Payload change only: the global `onboardingAboutYou` (additive migration).
- **Personal data (standing rule):**
  - Email and phone never reach a page, prop or API response.
  - Member records pass through `withoutContact`.
  - Emails show only via `RevealEmail`.
  - RSVPs are never shown to anyone but the member.
  - The lived-experience statement shows only when the member opted in (existing show-settings).
- **No hardcoded vocabularies.** Looking-for and focus-topic options come from `onboardingAboutYou` (CMS), with a fallback list only when the global is empty.
- **Dashboard sections hide when empty.** One warm empty state for a brand-new member — never a page of blank boxes.
- **Layout:**
  - Container queries (`@content-md/page:`) for layout; phone-first.
  - Arabic: right-to-left, `<bdi>` around user text, arrows `rtl:-scale-x-100`.
- **Copy:** four languages, written in full, human tone.
- **Times** (greeting, event dates) are formatted client-side in the viewer's zone (`useBrowserTimeZone` from `components/events/local-when.tsx`).
- **Commits and lint:** no AI attribution lines in commits; lint changed files only.

## Review Focus

- **A brand-new member** with no community, no RSVPs, no tasks and no contributions: the dashboard shows the header, one welcoming Your week empty state with three ways in, and "Coming up across the hub" — no empty boxes. Test in Task 1 and the rendered check in Task 3.
- **An RSVP to an event that has since passed or been unpublished:** it doesn't appear in Going or Your week, and nothing crashes. Test in Task 1.
- **A visitor on a profile with almost nothing filled in:** only the header and Communities render, with no "Add…" prompts (those are owner-only). Test in Task 4.
- **The owner of an empty profile:** each empty section shows its one "Add…" link to the right Edit-profile anchor. Test in Task 4.
- **Skipping every optional onboarding field:** completing onboarding still works and saves nothing for them (no empty strings stored as content). Test in Task 5.

---

### Task 1: Your week and community events — the data

**Files:**
- Create: `lib/dashboard/your-week.ts` (pure), `lib/dashboard/community-events.ts` (pure), `lib/dashboard/data.ts` (server-only)
- Test: `lib/__tests__/your-week.test.ts`, `lib/__tests__/community-events.test.ts`

**Interfaces:**
- Consumes:
  - `EventTileData` and `toEventTile`, `isUpcoming` from `lib/events/listing.ts`;
  - `getAllApprovedEvents()` (`lib/content/discovery`);
  - `Contribution` (`lib/contributions/model`);
  - `myTasks()` → `Array<{ id; title; status; collaborationId; collaborationTitle }>`;
  - `prisma.rsvp` (`userId`, `eventId`, `status`).
- Produces:
  ```ts
  // lib/dashboard/your-week.ts
  export type WeekItem =
    | { kind: "changes"; id: string; title: string | null; contributionKind: Contribution["kind"]; href: string }
    | { kind: "going"; id: string; title: string; startAt: string; href: string; external: boolean }
    | { kind: "task"; id: string; title: string; detail: string; href: string }
    | { kind: "community"; id: string; title: string; startAt: string; href: string; external: boolean };
  export function buildYourWeek(input: { going: EventTileData[]; community: EventTileData[]; tasks: Array<{ id: string; title: string; collaborationId: string; collaborationTitle: string }>; changes: Contribution[]; now: Date; limit?: number }): WeekItem[];
  // lib/dashboard/community-events.ts
  export function pickCommunityEvents(events: ContentEvent[], communitySlug: string | null, now: Date, limit?: number): EventTileData[];
  export function pickGoingEvents(events: ContentEvent[], goingIds: Set<string>, now: Date): EventTileData[];
  // lib/dashboard/data.ts
  export async function getDashboardEvents(userId: string, communitySlug: string | null): Promise<{ going: EventTileData[]; community: EventTileData[] }>;
  ```

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/your-week.test.ts
import { describe, expect, it } from "vitest";
import { buildYourWeek } from "@/lib/dashboard/your-week";

const now = new Date("2026-11-01T09:00:00Z");
const ev = (id: string, startAt: string, o = {}) => ({ id, title: id, startAt, endAt: null, mode: "online" as const, place: null, href: `/events/${id}`, external: false, organiser: null, recordingUrl: null, image: null, ...o });
const changes = [{ id: "c1", kind: "livedExperience" as const, title: "Rising tide", status: "revision" as const, reviewNotes: "Add a place.", date: null, href: null, editHref: "/lived-experiences/submit?edit=c1", adminHref: "" }];

describe("your week", () => {
  it("puts what needs you first, then what's coming soonest, then tasks", () => {
    const week = buildYourWeek({
      going: [ev("b", "2026-11-05T10:00:00Z"), ev("a", "2026-11-02T10:00:00Z")],
      community: [ev("x", "2026-11-03T10:00:00Z")],
      tasks: [{ id: "t1", title: "Draft the survey", collaborationId: "w1", collaborationTitle: "The best project" }],
      changes,
      now,
    });
    expect(week.map((w) => `${w.kind}:${w.id}`)).toEqual(["changes:c1", "going:a", "going:b", "task:t1"]);
    expect(week[0]).toMatchObject({ href: "/lived-experiences/submit?edit=c1" });
    expect(week[3]).toMatchObject({ href: "/collaborations/w1?tab=plan", detail: "The best project" });
  });
  it("suggests the community's next event when you're going to nothing", () => {
    const week = buildYourWeek({ going: [], community: [ev("x", "2026-11-03T10:00:00Z"), ev("y", "2026-11-04T10:00:00Z")], tasks: [], changes: [], now });
    expect(week.map((w) => `${w.kind}:${w.id}`)).toEqual(["community:x"]);
  });
  it("is empty for a brand-new member, and never longer than the limit", () => {
    expect(buildYourWeek({ going: [], community: [], tasks: [], changes: [], now })).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => ev(`e${i}`, `2026-11-${String(i + 2).padStart(2, "0")}T10:00:00Z`));
    expect(buildYourWeek({ going: many, community: [], tasks: [], changes: [], now, limit: 6 })).toHaveLength(6);
  });
});
```

```ts
// lib/__tests__/community-events.test.ts
import { describe, expect, it } from "vitest";
import { pickCommunityEvents, pickGoingEvents } from "@/lib/dashboard/community-events";

const now = new Date("2026-11-01T09:00:00Z");
const e = (id: string, startAt: string, community: string | null) => ({ _id: id, title: id, description: null, scope: "community", startAt, endAt: null, mode: "online", locationName: null, url: null, linkedProject: null, slug: id, origin: "ccm", relatedCommunity: community ? { slug: community } : null }) as never;

describe("events for the dashboard", () => {
  const all = [e("past", "2026-10-01T10:00:00Z", "oceania"), e("o2", "2026-11-09T10:00:00Z", "oceania"), e("o1", "2026-11-03T10:00:00Z", "oceania"), e("k1", "2026-11-02T10:00:00Z", "sub-saharan-africa")];
  it("picks your region's next events, soonest first, upcoming only", () => {
    expect(pickCommunityEvents(all, "oceania", now).map((t) => t.id)).toEqual(["o1", "o2"]);
  });
  it("falls back to the hub's next events when you have no community", () => {
    expect(pickCommunityEvents(all, null, now, 2).map((t) => t.id)).toEqual(["k1", "o1"]);
  });
  it("keeps only RSVPs to events that are still coming and still published", () => {
    expect(pickGoingEvents(all, new Set(["past", "o2", "gone"]), now).map((t) => t.id)).toEqual(["o2"]);
  });
});
```

- [ ] **Step 2: Run** `pnpm exec vitest run lib/__tests__/your-week.test.ts lib/__tests__/community-events.test.ts`. Expected: FAIL (modules missing).

- [ ] **Step 3: Implement**

```ts
// lib/dashboard/your-week.ts
/** The dashboard's "Your week" (dashboard spec D2): what needs you, then what's coming, soonest first. Pure. */
import type { EventTileData } from "@/lib/events/listing";
import type { Contribution } from "@/lib/contributions/model";

export type WeekItem =
  | { kind: "changes"; id: string; title: string | null; contributionKind: Contribution["kind"]; href: string }
  | { kind: "going"; id: string; title: string; startAt: string; href: string; external: boolean }
  | { kind: "task"; id: string; title: string; detail: string; href: string }
  | { kind: "community"; id: string; title: string; startAt: string; href: string; external: boolean };

export function buildYourWeek(input: {
  going: EventTileData[];
  community: EventTileData[];
  tasks: Array<{ id: string; title: string; collaborationId: string; collaborationTitle: string }>;
  changes: Contribution[];
  now: Date;
  limit?: number;
}): WeekItem[] {
  const limit = input.limit ?? 6;
  const byStart = (a: { startAt: string }, b: { startAt: string }) => a.startAt.localeCompare(b.startAt);
  const changes: WeekItem[] = input.changes
    .filter((c) => c.status === "revision" && c.editHref)
    .map((c) => ({ kind: "changes", id: c.id, title: c.title, contributionKind: c.kind, href: c.editHref! }));
  const going: WeekItem[] = [...input.going].sort(byStart).map((e) => ({ kind: "going", id: e.id, title: e.title, startAt: e.startAt, href: e.href, external: e.external }));
  const tasks: WeekItem[] = input.tasks.map((t) => ({ kind: "task", id: t.id, title: t.title, detail: t.collaborationTitle, href: `/collaborations/${t.collaborationId}?tab=plan` }));
  // Nothing on your calendar: your community's next event, as an invitation.
  const invite: WeekItem[] =
    going.length === 0 && input.community.length > 0
      ? [[...input.community].sort(byStart)[0]].map((e) => ({ kind: "community", id: e.id, title: e.title, startAt: e.startAt, href: e.href, external: e.external }))
      : [];
  return [...changes, ...going, ...tasks, ...invite].slice(0, limit);
}
```

```ts
// lib/dashboard/community-events.ts
/** Which events the dashboard shows (dashboard spec D2). Pure. */
import type { ContentEvent } from "@/lib/content/discovery";
import { isUpcoming, toEventTile, type EventTileData } from "@/lib/events/listing";

function upcomingTiles(events: ContentEvent[], now: Date): EventTileData[] {
  return events
    .map(toEventTile)
    .filter((t): t is EventTileData => t !== null && isUpcoming(t, now))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function pickCommunityEvents(events: ContentEvent[], communitySlug: string | null, now: Date, limit = 3): EventTileData[] {
  const inRegion = communitySlug ? events.filter((e) => e.relatedCommunity?.slug === communitySlug) : events;
  return upcomingTiles(inRegion, now).slice(0, limit);
}

export function pickGoingEvents(events: ContentEvent[], goingIds: Set<string>, now: Date): EventTileData[] {
  return upcomingTiles(events.filter((e) => goingIds.has(e._id)), now);
}
```

```ts
// lib/dashboard/data.ts
import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getAllApprovedEvents } from "@/lib/content/discovery";
import { pickCommunityEvents, pickGoingEvents } from "@/lib/dashboard/community-events";
import type { EventTileData } from "@/lib/events/listing";

/** Your RSVPs (GOING, still coming) and your community's next events — one events read for both. */
export async function getDashboardEvents(userId: string, communitySlug: string | null): Promise<{ going: EventTileData[]; community: EventTileData[] }> {
  const [events, rsvps] = await Promise.all([
    getAllApprovedEvents().catch(() => []),
    safeQuery(() => prisma.rsvp.findMany({ where: { userId, status: "GOING" }, select: { eventId: true } })),
  ]);
  const now = new Date();
  const goingIds = new Set(rsvps.success ? rsvps.data.map((r) => r.eventId) : []);
  return { going: pickGoingEvents(events, goingIds, now), community: pickCommunityEvents(events, communitySlug, now, 3) };
}
```

- [ ] **Step 4: Run** the tests, `tsc`, and eslint on the new files. Expected: PASS.
- [ ] **Step 5: Commit.** `feat(dashboard): your week and community events — the data`

---

### Task 2: Your week and events on the dashboard

**Files:**
- Create:
  - `components/dashboard/your-week.tsx` (client)
  - `components/dashboard/dashboard-events.tsx` (client)
  - `components/dashboard/greeting.tsx` (client)
  - `lib/profile/next-step.ts` (pure)
- Modify: `app/[locale]/(main)/dashboard/page.tsx` (read `getDashboardEvents(userId, regionSlug)`; build `yourWeek` with `buildYourWeek`, passing `tasks` from `myTasks()` and `changes` from the `listMyContributions` result already read), `app/[locale]/(main)/dashboard/page-client.tsx` (render the new header, Your week and events), `messages/*.json` (`dashboard.week.*`, `dashboard.events.*`, `dashboard.greeting.*`, `dashboard.nextStep.*`)
- Test: `lib/__tests__/next-profile-step.test.ts`, `components/dashboard/__tests__/your-week.test.tsx`

**Interfaces:**
- Consumes:
  - Task 1 `WeekItem`, `buildYourWeek`, `getDashboardEvents`;
  - `EventTile` (`components/events/event-tile.tsx`: `{ event, locale, timeZone, past? }`);
  - `RsvpButton` (`components/events/rsvp-button.tsx`: `{ eventId }`);
  - `useBrowserTimeZone`;
  - `calculateProfileCompleteness` input fields.
- Produces:
  ```ts
  export type ProfileStep = { key: "photo" | "headline" | "bio" | "aboutYou" | "work" | "community"; href: string } | null;
  export function nextProfileStep(user: { image?: string | null; headline?: string | null; bio?: string | null; motivation?: string | null; lookingFor?: string[]; organization?: string | null; position?: string | null; communityCount: number }): ProfileStep;
  ```

- [ ] **Step 1: Failing tests.**
  - `nextProfileStep` returns the first missing item, in this order:
    1. photo → `/dashboard/profile/edit#photo`
    2. headline → `#headline`
    3. bio → `#bio`
    4. aboutYou (no motivation and no lookingFor) → `#about-you`
    5. work (no organization and no position) → `#work`
    6. community (0) → `/communities`
  - It returns `null` when everything is there.
  - `YourWeek` with English messages:
    - a `changes` item shows "Needs your changes" and links to its `href`;
    - a `going` item shows a date tile and "Going";
    - a `community` item shows "From your community";
    - with no items it shows the empty state's three links: `/events`, `/dashboard/submissions`, `/collaborate?tab=people`.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.**
  - `nextProfileStep` as specified.
  - **`Greeting`** (client):
    - Shows the time-of-day word from `useBrowserTimeZone()` (hour < 12 morning, < 18 afternoon, else evening; before mount, a neutral "Welcome").
    - Shows the member's first name and an avatar.
    - Next to them: a small ring (SVG circle, `stroke-dasharray` from the completeness %) with the `nextProfileStep` sentence as a link, or "Your profile is looking great" with a View my profile link.
  - **`YourWeek`:**
    - A list of rows. Each row has a leading tile: date for events, a pencil for changes, a checklist for tasks.
    - Title (`<bdi>`, two lines), a small status word, and the row is a link.
    - External events open in a new tab with ↗.
    - Empty state: a sentence plus three buttons.
  - **`DashboardEvents`:**
    - Two columns from `@content-md/page:`, stacked on phones.
    - "Going" (EventTile list) and "In your community" (EventTile + `RsvpButton` for CCM events).
    - Its heading is "Coming up across the hub" when there's no community slug.
    - It hides itself when both lists are empty.
  - **Copy:** add en/es/fr/ar for every new key.
- [ ] **Step 4:** Run the tests, `tsc`, and eslint on changed files. **Rendered check** (dev):
  - Seed one Oceania event you RSVP'd to, one Oceania event you didn't, one lived experience sent back, and one task.
  - Check `/en/dashboard` and `/ar/dashboard` at 375 and 1280: the header greets you, Your week order is changes → going → task, the events columns are right, RSVP works from "In your community", and there is no sideways scroll.
  - 0 console errors.
  - Delete the seeds afterwards.
- [ ] **Step 5: Commit.** `feat(dashboard): your week, your events and your community's`

---

### Task 3: One of everything — the dashboard clean-up

**Files:**
- Modify:
  - `app/[locale]/(main)/dashboard/page-client.tsx`:
    - remove the Quick Actions grid, Recent Work, the separate Join card and the completeness band;
    - fold Recent news into For you;
    - render For you as `TypedCard variant="mini"`.
  - `app/[locale]/(main)/dashboard/page.tsx`: stop reading what's no longer shown — recentNews' separate query if it is folded server-side, and recent work.
  - `components/...` regional band: its empty state gains the Join call to action.
- Create: `lib/dashboard/for-you-cards.ts` (pure adapter `forYouToCard(item: ForYouItem & { href: string }, extra?: { image?: string | null }) : TypedCardItem`)
- Test:
  - `lib/__tests__/for-you-cards.test.ts`;
  - `lib/__tests__/dashboard-destinations.test.ts`: every destination the removed Quick Actions offered stays reachable from the sidebar or account menu. Assert the hrefs in `components/sidebar-quick-actions.tsx` / `components/user-menu-card.tsx` / `components/app-sidebar.tsx` include `/collaborate?tab=people`, `/dashboard/settings`, `/dashboard`, and that the header links `/dashboard/profile/edit` and `/profiles/<username>`.

- [ ] **Step 1: Failing tests** (adapter mapping per type: case study / lived experience / news / research output → `TypedCardItem` with the right `type` and `href`; the destinations test). **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the removals and the adapter. Delete now-unused imports and the `Contribution`/`RecentWork` types and props if nothing else uses them (`rg`).
- [ ] **Step 4:** Run the tests, the full suite (watch for "Failed to start"), `tsc`, and eslint. **Rendered check** with a seeded member and with a brand-new member (Review Focus 1): en and ar, 375 and 1280, no empty boxes, 0 console errors.
- [ ] **Step 5: Commit.** `refactor(dashboard): one of everything — no repeated actions, typed For you`

---

### Task 4: Profiles that tell a person's story

**Files:**
- Create: `lib/profile/sections.ts` (pure), `components/profile/about-section.tsx`, `components/profile/work-section.tsx`, `components/profile/on-the-hub-section.tsx`, `components/profile/owner-add-link.tsx`
- Modify:
  - `app/[locale]/(main)/profiles/[username]/page.tsx`:
    - one scrolling page;
    - the existing `RegionSectionSpine` as the chapter menu;
    - remove the tabs, the stats card and the duplicated skills/work/location/community blocks;
    - header facts on one line.
  - `messages/*.json` (`profile.sections.*`, `profile.add.*`)
- Test: `lib/__tests__/profile-sections.test.ts`

**Interfaces:**
- Consumes: `ProfileData` (contact-free, `hasPublicEmail`), `getAnsweredPrompts`, `ContributionsBlock`, `listPublicWorkspacesForUser`, `RevealEmail`, `areConnected`.
- Produces:
  ```ts
  export type SectionId = "about" | "work" | "onTheHub" | "communities";
  export type Section = { id: SectionId; hasContent: boolean; addHref: string | null };
  export function profileSections(p: { bio?: string | null; motivation?: string | null; lookingFor: string[]; focusTopics: string[]; collaborationInterests?: string | null; promptCount: number; livedExperienceStatement?: string | null; organization?: string | null; position?: string | null; workBio?: string | null; skillsCount: number; recentWorkCount: number; contributionCount: number; organisedEventCount: number; workspaceCount: number; communityCount: number }, viewer: { isOwner: boolean }): Section[];
  ```
  Visitors get only sections with content. Owners get every section, and an empty one carries `addHref` (`/dashboard/profile/edit#about-you`, `#work`, `/dashboard/submissions`, `/communities`).

- [ ] **Step 1: Failing test.** It covers the visitor-empty and owner-empty cases from Review Focus, plus a full profile (all four sections, no `addHref` for the owner when there is content).
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement** the pure function and the page:
  - **Header:** photo, name, pronouns, headline, then one facts line: position · organisation · city, country · member since · languages, each shown only when allowed and present.
  - **Header badges and actions:** the open-to-collaborate badge, then Message / Ask to connect / Follow / `RevealEmail`, each per the existing rules.
  - **About:** bio, "What brought me here", Looking for chips, Open to collaborate on, focus topics, prompts (`PromptsBlock`), and the lived-experience statement (opt-in).
  - **Work:** role at organisation, work bio, skills once, the recent-work timeline (the existing owner controls), and links (ORCID, LinkedIn, website) as allowed.
  - **On the hub:** `ContributionsBlock`, events the member organises (approved events with `submittedBy` = the member, via `getAllApprovedEvents` filter on a new optional `submittedBy` in the card projection, or a small reader), and public workspaces.
  - **Communities.**
  - **Owner extras:** an "Add …" link inside each empty section, and a "See it as others do" toggle (`?as=visitor`).
- [ ] **Step 4:** Run the tests, `tsc`, and eslint. **Rendered check:**
  - a full profile and an empty one, as owner and as visitor;
  - en and ar, 375 and 1280;
  - no duplicated facts;
  - email-scan the HTML for addresses (must be none);
  - 0 console errors.
- [ ] **Step 5: Commit.** `feat(profiles): a person's story first — about, work, on the hub, communities`

---

### Task 5: Onboarding asks about you

**Files:**
- Create:
  - `payload/globals/onboarding-about-you.ts`: title, description, `lookingForOptions` [{ value, label (localized) }], `focusTopicOptions` [{ value, label (localized) }], `promptIntro` (localized); grouped with the other onboarding globals and registered in `ONBOARDING_GLOBALS`.
  - the migration (`pnpm exec payload migrate:create onboarding_about_you`, additive);
  - `components/onboarding/panels/about-you-panel.tsx`;
  - `lib/onboarding/about-you-options.ts`: reader with the fallback list (en labels) used only when the global is empty.
- Modify:
  - `lib/schemas/onboarding-schema.ts`: `aboutYou: { headline?, motivation?, lookingFor: string[], focusTopics: string[], promptId?, promptAnswer?, openToCollaboration?, collaborationInterests? }`, using `LIMITS.profile.*`. Move the open-to-collaborate fields here from workInfo and keep reading the old location for a draft in progress.
  - basic-info panel: pronouns, languages (multi-select of the hub's four languages + free entry), photo (the existing avatar upload component if present; otherwise a link to Edit profile after onboarding — ledger which).
  - `components/onboarding/modern-onboarding-container.tsx`: a step between work_info and recent_work; mapping to the API.
  - `app/api/onboarding/complete/route.ts`: optional fields. Saves only provided, non-empty values. The prompt answer creates a `ProfilePromptAnswer` (order 0) when both id and answer are present.
  - `app/[locale]/onboarding/page.tsx`: load the new fields and the step global.
  - `components/blocks/profile/profile-edit-form.tsx`: Looking for and Focus topics become chip inputs from the same options (they're stored today but have no input); anchors `#about-you`, `#work`, `#photo`, `#headline`, `#bio` for the dashboard's next step.
  - privacy panel copy: emails are never shown on the site — only revealed to a verified person you allow.
- Test:
  - `lib/__tests__/onboarding-about-you.test.ts`: schema; empty values dropped; the prompt answer is saved only with both parts;
  - extend the onboarding API test, if one exists (`rg -l "onboarding/complete" lib/__tests__`).

- [ ] **Step 1: Failing tests.** **Step 2: Run.** Expected: FAIL. **Step 3: Implement** — the global, migration (read the `up`: CREATE only), types, panel, step wiring, API, edit-form chips, and copy in four languages.
- [ ] **Step 4:** Run the tests, `tsc`, and eslint. `curl /admin` must return 200, and **Onboarding → About you** must appear in the admin. **Rendered check:** a fresh dev account through onboarding, once filling About you and once skipping it; the profile then shows the About section (or nothing); en and ar at 375. Delete the test account's data afterwards.
- [ ] **Step 5: Commit.** `feat(onboarding): an About you step — the words your profile now shows`

---

### Task 6 (only if the user says yes to D6): Members & roles in the admin

**Files:**
- Create:
  - `lib/actions/member-roles.ts` (`"use server"`, admin only): `searchMembers(q)` and `setMemberRole(userId, role)`, roles `community_member | team_editor | admin`;
  - `payload/components/members-roles-view.tsx`: an admin custom view, linked from the admin nav for admins only.
- Test: `lib/__tests__/member-roles.test.ts`
  - non-admin refused;
  - unknown role refused;
  - the last admin can't be demoted;
  - a change writes `role` and logs who changed it (`console.info` with both ids; no new table).

- [ ] **Steps:** failing tests → implement → the view (search box, a results list without emails; it shows name, username and current role, plus a role select with a Confirm step) → rendered check as an admin and as a team editor (no access) → commit `feat(admin): members & roles — change a member's role without a script`.

---

### Task 7: Runbook

- [ ] Add a section "Dashboard, profiles and onboarding": what changed for members; the `onboarding_about_you` migration (additive); the team should fill **Onboarding → About you** (options in four languages) after the deploy; checklist (dashboard as a new member and as an active one, a profile as owner/visitor, onboarding once). **Commit:** `docs(runbook): dashboard, profiles and onboarding`.
