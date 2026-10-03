# Opening collaboration — Stage 0 + Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single hidden engagement switch with a CMS setting the team controls, then open Stage 1: notifications, "open to collaborate", and Ask to connect that actually connects people.

**Architecture:** A Payload global `collaborationSettings` holds four settings; a pure `collaborationAccess(settings, role)` turns them into what one viewer may see and do. Servers read it through `getCollaborationAccessFor(actor)`, and client components through `useCollaboration()`, which reads a private `/api/me/collaboration` endpoint with SWR, the same way the staff nav reads `/api/me/role`. The env switch survives only as a dev override. Stage 1 features hang off the `people` and `notifications` keys.

**Tech Stack:** Next.js 16 App Router, Payload 3 (global + migration), Prisma (read/write existing tables only — no schema change), SWR, next-intl 4, vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-03-opening-collaboration-design.md`. Stages 2 (workspaces) and 3 (messages) get their own plans after Stage 1 has been live.

## Global Constraints

- **No Prisma schema change.** Prisma migrations don't run on deploy. Use existing columns and enums only: `User.openToCollaboration`, `User.collaborationInterests`, `ContactRequest`, `Follow` (REGION `targetId` = community slug, e.g. `oceania`), `NotificationType` `REQUEST` / `OUTPUT_STATUS` / `FOLLOWED_PUBLISH`.
- **The one schema change is the Payload global,** created with `pnpm exec payload migrate:create collaboration_settings`. Its migration must be additive (one table). It runs on deploy.
- **Defaults equal today's live state:**
  - `notifications: false`, `people: false`, `workspaces: "off"`, `messages: false`.
  - A failed settings read means everything off — never on.
- **Dev override:** `NEXT_PUBLIC_FEATURE_ENGAGEMENT=true` (dev's `.env.local` today) forces everything on, so local development behaves as before.
- **Roles** (`Role` enum): `community_member`, `community_editor` (community leads), `team_editor`, `admin`. "Team" means `team_editor` or `admin`; "leads" means team plus `community_editor`.
- **Server actions keep refusing before any database work** when their key is off (same contract as `engagement-flag-gates.test.ts`).
- **Copy:** all four languages, written in full, human tone. Say "connect", not "contact request".
- **Commits:** no AI attribution lines. **Lint:** changed files only.
- **Push = production deploy.** The user pushes; the agent never pushes.

## Review Focus

- **Settings read throws or the global is empty:** everything stays hidden, and no page redirects in a loop. Test in Task 1.
- **Signed-out visitor with `people` on:** sees the "Open to collaborate" chip and badges, but no Ask to connect and no dashboard card. Test in Task 4.
- **Asking to connect with someone who has since turned "open" off:** the request is refused with a kind message, not created. Test in Task 4.
- **A connection that is still PENDING or was DECLINED:** never shows either email. Test in Task 5.
- **Approving the same event twice, or two events in one region on one day:** a follower gets one "new event" notification, not two. Test in Task 6.

---

### Task 1: The Collaboration setting and the access model

**Files:**
- Create: `payload/globals/collaboration-settings.ts`, `lib/collaboration/access.ts` (pure), `lib/collaboration/access-server.ts` (server-only), `app/api/me/collaboration/route.ts`, `hooks/use-collaboration.ts`
- Modify: `payload/globals/index.ts` (import, export, add to `globals` under `// System` after `EventSuggestions`), `migrations/` (generated), `payload-types.ts` (`pnpm exec payload generate:types`)
- Test: `lib/__tests__/collaboration-access.test.ts`, `lib/__tests__/collaboration-settings-read.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // lib/collaboration/access.ts
  export type WorkspaceAudience = "off" | "team" | "leads" | "members";
  export interface CollaborationSettings { notifications: boolean; people: boolean; workspaces: WorkspaceAudience; messages: boolean }
  export interface CollaborationAccess { notifications: boolean; people: boolean; workspaces: { see: boolean; create: boolean }; messages: boolean }
  export const ALL_OFF: CollaborationSettings;
  export const ALL_ON: CollaborationSettings; // workspaces "members"
  export function toSettings(row: unknown): CollaborationSettings;   // tolerant parser, unknown → ALL_OFF values
  export function collaborationAccess(s: CollaborationSettings, role: string | null): CollaborationAccess;
  export function devOverride(): boolean; // process.env.NEXT_PUBLIC_FEATURE_ENGAGEMENT === "true" | "1"
  // lib/collaboration/access-server.ts
  export async function getCollaborationSettings(): Promise<CollaborationSettings>;
  export async function getCollaborationAccessFor(actor: Actor): Promise<CollaborationAccess>;
  // hooks/use-collaboration.ts  ("use client")
  export function useCollaboration(): CollaborationAccess; // ALL_OFF-access until loaded; dev override → all on immediately
  ```
- `GET /api/me/collaboration` → `CollaborationAccess` JSON, `Cache-Control: private, max-age=60`.

- [ ] **Step 1: Failing pure test**

```ts
// lib/__tests__/collaboration-access.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ALL_OFF, collaborationAccess, devOverride, toSettings } from "@/lib/collaboration/access";

afterEach(() => vi.unstubAllEnvs());

describe("who sees what", () => {
  const s = { notifications: true, people: true, workspaces: "leads" as const, messages: false };
  it("needs a signed-in member for anything personal", () => {
    expect(collaborationAccess(s, null)).toEqual({ notifications: false, people: true, workspaces: { see: false, create: false }, messages: false });
  });
  it("opens workspaces by audience", () => {
    expect(collaborationAccess(s, "community_member").workspaces).toEqual({ see: false, create: false });
    expect(collaborationAccess(s, "community_editor").workspaces).toEqual({ see: true, create: true });
    expect(collaborationAccess({ ...s, workspaces: "team" }, "community_editor").workspaces).toEqual({ see: false, create: false });
    expect(collaborationAccess({ ...s, workspaces: "team" }, "admin").workspaces).toEqual({ see: true, create: true });
    expect(collaborationAccess({ ...s, workspaces: "members" }, "community_member").workspaces).toEqual({ see: true, create: true });
  });
  it("keeps everything off by default", () => {
    expect(collaborationAccess(ALL_OFF, "admin")).toEqual({ notifications: false, people: false, workspaces: { see: false, create: false }, messages: false });
  });
});

describe("reading the setting", () => {
  it("falls back to off for anything missing or odd", () => {
    expect(toSettings(null)).toEqual(ALL_OFF);
    expect(toSettings({ notifications: "yes", workspaces: "everyone" })).toEqual(ALL_OFF);
    expect(toSettings({ notifications: true, people: true, workspaces: "members", messages: true })).toEqual({ notifications: true, people: true, workspaces: "members", messages: true });
  });
  it("lets dev force everything on", () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "true");
    expect(devOverride()).toBe(true);
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "");
    expect(devOverride()).toBe(false);
  });
});
```

- [ ] **Step 2: Run** `pnpm exec vitest run lib/__tests__/collaboration-access.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement the pure module**

```ts
// lib/collaboration/access.ts
/**
 * What the team has opened (Settings → Collaboration) and what that means
 * for one viewer (opening-collaboration spec C1/C7). Pure.
 */
export type WorkspaceAudience = "off" | "team" | "leads" | "members";
export interface CollaborationSettings { notifications: boolean; people: boolean; workspaces: WorkspaceAudience; messages: boolean }
export interface CollaborationAccess { notifications: boolean; people: boolean; workspaces: { see: boolean; create: boolean }; messages: boolean }

export const ALL_OFF: CollaborationSettings = { notifications: false, people: false, workspaces: "off", messages: false };
export const ALL_ON: CollaborationSettings = { notifications: true, people: true, workspaces: "members", messages: true };
const AUDIENCES = new Set<WorkspaceAudience>(["off", "team", "leads", "members"]);
const TEAM = new Set(["team_editor", "admin"]);
const LEADS = new Set(["team_editor", "admin", "community_editor"]);

export function toSettings(row: unknown): CollaborationSettings {
  const r = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const audience = typeof r.workspaces === "string" && AUDIENCES.has(r.workspaces as WorkspaceAudience) ? (r.workspaces as WorkspaceAudience) : "off";
  return { notifications: r.notifications === true, people: r.people === true, workspaces: audience, messages: r.messages === true };
}

export function devOverride(): boolean {
  const v = process.env.NEXT_PUBLIC_FEATURE_ENGAGEMENT;
  return v === "true" || v === "1";
}

export function collaborationAccess(s: CollaborationSettings, role: string | null): CollaborationAccess {
  const signedIn = role !== null;
  const inAudience =
    s.workspaces === "members" ? signedIn
    : s.workspaces === "leads" ? !!role && LEADS.has(role)
    : s.workspaces === "team" ? !!role && TEAM.has(role)
    : false;
  return {
    notifications: s.notifications && signedIn,
    // Badges and the filter are public; asking to connect checks sign-in itself.
    people: s.people,
    workspaces: { see: inAudience, create: inAudience },
    messages: s.messages && signedIn,
  };
}
```

- [ ] **Step 4: Run** it. Expected: PASS.

- [ ] **Step 5: The global** (plain words, as the team will read them)

```ts
// payload/globals/collaboration-settings.ts
import type { GlobalConfig } from "payload";
import { isEditor } from "@/payload/access";

/** What members can use beyond reading (opening-collaboration spec C1). Off by default — the live site's state. */
export const CollaborationSettings: GlobalConfig = {
  slug: "collaborationSettings",
  label: "Collaboration",
  admin: { group: "Settings", description: "Open the hub's collaboration tools step by step. Changes apply within a minute." },
  access: { read: () => true, update: isEditor },
  fields: [
    { name: "notifications", type: "checkbox", label: "Notifications in the hub", defaultValue: false, admin: { description: "The dot on the account menu and the Notifications page: replies, mentions, outcomes, event reminders, connections." } },
    { name: "people", type: "checkbox", label: "Open to collaborate and Ask to connect", defaultValue: false, admin: { description: "Asks members if they're open to collaborating, adds the filter in Find people, and lets members ask to connect." } },
    {
      name: "workspaces", type: "select", label: "Workspaces", defaultValue: "off",
      options: [
        { label: "Off", value: "off" },
        { label: "The team only", value: "team" },
        { label: "The team and community leads", value: "leads" },
        { label: "Every member", value: "members" },
      ],
      admin: { description: "Who can see and start workspaces. People already in a workspace can always open it." },
    },
    { name: "messages", type: "checkbox", label: "Direct messages", defaultValue: false, admin: { description: "Members message each other, within each person's own privacy setting. Turn on last." } },
  ],
};
```

Register it in `payload/globals/index.ts`. Confirm `payload.config.ts` wraps every global with `withGlobalRevalidation` (`rg -n withGlobalRevalidation payload.config.ts`); if it doesn't, wrap this one. Then generate the migration and types:

```bash
export PAYLOAD_DATABASE_URL="$(grep -E '^PAYLOAD_DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"')" PAYLOAD_SECRET="$(grep -E '^PAYLOAD_SECRET=' .env.local | head -1 | cut -d= -f2- | tr -d '"')"
echo "$PAYLOAD_DATABASE_URL" | grep -q lucky-waterfall && pnpm exec payload migrate:create collaboration_settings
```

Read the generated `up`. It must only CREATE the global's table and its enum; anything dropped or renamed means stop and ledger it. Then apply it on dev with `(printf 'y\n'; sleep 60) | pnpm exec payload migrate`, and run `pnpm exec payload generate:types`.

- [ ] **Step 6: Failing server-read test**

```ts
// lib/__tests__/collaboration-settings-read.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const query = vi.fn();
vi.mock("@/lib/content/internal/payload-source", () => ({ query: (d: unknown) => query(d) }));
import { getCollaborationAccessFor, getCollaborationSettings } from "@/lib/collaboration/access-server";
import { ALL_OFF } from "@/lib/collaboration/access";

beforeEach(() => { query.mockReset(); vi.unstubAllEnvs(); vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", ""); });

describe("the setting on the server", () => {
  it("reads the global, cached", async () => {
    query.mockResolvedValue({ notifications: true, people: true, workspaces: "team", messages: false });
    expect(await getCollaborationSettings()).toEqual({ notifications: true, people: true, workspaces: "team", messages: false });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ type: "global", slug: "collaborationSettings" }));
  });
  it("hides everything when the read fails", async () => {
    query.mockRejectedValue(new Error("db down"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await getCollaborationSettings()).toEqual(ALL_OFF);
  });
  it("opens everything under the dev override", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_ENGAGEMENT", "true");
    expect((await getCollaborationAccessFor({ id: "u1", role: "community_member" })).workspaces).toEqual({ see: true, create: true });
    expect(query).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run** it. Expected: FAIL. **Step 8: Implement**

```ts
// lib/collaboration/access-server.ts
import "server-only";
import { query } from "@/lib/content/internal/payload-source";
import type { Actor } from "@/lib/authz";
import { ALL_OFF, ALL_ON, collaborationAccess, devOverride, toSettings, type CollaborationAccess, type CollaborationSettings } from "@/lib/collaboration/access";

/** Settings → Collaboration, cached (cleared when saved). A failed read is all off — never all on. */
export async function getCollaborationSettings(): Promise<CollaborationSettings> {
  if (devOverride()) return ALL_ON;
  try {
    return toSettings(await query<unknown>({ type: "global", slug: "collaborationSettings", depth: 0 } as never));
  } catch (error) {
    console.error("[collaboration] settings read failed — everything stays hidden", error);
    return ALL_OFF;
  }
}

export async function getCollaborationAccessFor(actor: Actor): Promise<CollaborationAccess> {
  return collaborationAccess(await getCollaborationSettings(), actor?.role ?? null);
}
```

```ts
// app/api/me/collaboration/route.ts
import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";

/** GET /api/me/collaboration → what this viewer may use (Settings → Collaboration × their role). */
export async function GET() {
  const access = await getCollaborationAccessFor(await getActor());
  return NextResponse.json(access, { headers: { "Cache-Control": "private, max-age=60" } });
}
```

```ts
// hooks/use-collaboration.ts
"use client";
import useSWR from "swr";
import { jsonFetcher } from "@/lib/swr";
import { ALL_OFF, ALL_ON, collaborationAccess, devOverride, type CollaborationAccess } from "@/lib/collaboration/access";

const HIDDEN = collaborationAccess(ALL_OFF, null);
const OPEN = collaborationAccess(ALL_ON, "admin");

/** What this viewer may use. Hidden until known — the server render and first client pass agree. */
export function useCollaboration(): CollaborationAccess {
  const override = devOverride();
  const { data } = useSWR<CollaborationAccess>(override ? null : "/api/me/collaboration", jsonFetcher, { revalidateOnFocus: false });
  return override ? OPEN : (data ?? HIDDEN);
}
```

- [ ] **Step 9: Run** both tests, `pnpm exec tsc --noEmit -p .`, eslint on the new files. Expected: PASS. `curl -s localhost:3001/api/me/collaboration` returns JSON. `curl -s -o /dev/null -w '%{http_code}' localhost:3001/admin` returns 200, and **Settings → Collaboration** appears in the admin.

- [ ] **Step 10: Commit.** `feat(collaboration): a Collaboration setting the team controls, off by default`

---

### Task 2: Every gate reads the setting

**Files:**
- Modify — each `FEATURES.engagement` use, mapped to its key:

| File | Becomes |
|---|---|
| `app/[locale]/(main)/moderation/broadcast/page.tsx` | server: `access.notifications`, else redirect home |
| `app/[locale]/(main)/messages/page.tsx` | server: allowed when `access.notifications \|\| access.messages`; show only the tabs that are on |
| `app/[locale]/(main)/collaborations/page.tsx` | server: `access.workspaces.see`, else redirect home |
| `app/[locale]/(main)/collaborations/[id]/page.tsx` | server: `access.workspaces.see` **or** the viewer is a member of this workspace (existing membership lookup on the page), else redirect home |
| `app/[locale]/(main)/collaborate/page.tsx` (`CreateCollaborationButton`) | server: `access.workspaces.create` |
| `app/[locale]/(main)/collaborate/page-client.tsx:195` ("Start a collaboration" link) | `useCollaboration().workspaces.see` |
| `components/sidebar-quick-actions.tsx:52` ("Start a project") | `useCollaboration().workspaces.create` |
| `components/user-menu-card.tsx:60,113,119` (Messages link + unread badge) | `notifications \|\| messages`; label `userMessages` when messages is on, else a new `userNotifications` ("Notifications") |
| `components/notifications/notification-dot.tsx:23` | `useCollaboration().notifications` |
| `components/staff-nav.tsx:44` (Send notification) | `useCollaboration().notifications` |
| `components/messaging/message-user-button.tsx:22` | `useCollaboration().messages` |
| `components/collaborate/collaborate-user-card.tsx:281` (Message + Connect row) | Message: `messages`; Connect: `people` (Task 4 completes the Connect rule) |
| `lib/actions/collaboration.ts:29` `createCollaboration` | `(await getCollaborationAccessFor(actor)).workspaces.create` — read the actor first, keep "before any database work" |
| `lib/actions/requests.ts:369` `requestContact` | `.people` |
| `lib/actions/messaging.ts:20` `startConversation` | `.messages` |

- Modify: `lib/features.ts`. Remove `engagement`, and point the header comment at `lib/collaboration/access.ts` and Settings → Collaboration. If `FEATURES` ends up with no keys, delete the file and its imports.
- Modify: `messages/*.json` — `userNotifications` next to `userMessages`.
- Test: rename `lib/__tests__/engagement-flag-gates.test.ts` → `lib/__tests__/collaboration-gates.test.ts`. Mock `@/lib/collaboration/access-server` (`getCollaborationAccessFor` resolving to all-off access) instead of `@/lib/features`. Keep its three refusal cases (create workspace, start conversation, request contact) and the RSVP-still-works case. Add one case: with `workspaces: "team"` and a `community_member` actor, `createCollaboration` refuses before the database.

- [ ] **Step 1:** Rename and adjust the gate test as above. Run it. Expected: FAIL (actions still import `FEATURES`).
- [ ] **Step 2:** Make every change in the table. In client components, call `const access = useCollaboration()` at the top of the component (hooks rule), never inside a condition. In server pages:

  ```ts
  const access = await getCollaborationAccessFor(await getActor());
  if (!access.workspaces.see) redirect({ href: "/", locale });
  ```

  On the workspace page, check membership before redirecting:

  ```ts
  if (!access.workspaces.see && !isMember) redirect({ href: "/", locale });
  ```

  Use the page's own membership query; find it with `rg -n "collaborationMember|membership" "app/[locale]/(main)/collaborations/[id]/page.tsx"`.
- [ ] **Step 3:** Run `rg -n "FEATURES.engagement" app components lib`. Expected: no results. Then run the gate test, the full suite (check the log for "Failed to start"), `tsc`, and eslint on every changed file. Expected: PASS.
- [ ] **Step 4: Rendered check — both extremes on dev.**
  1. **All off:** temporarily set `NEXT_PUBLIC_FEATURE_ENGAGEMENT=` in the dev shell, restart the dev server detached, and leave every setting off in the admin.
     - As a member: no "Start a project", no notification dot, no Messages in the account menu, no Message/Connect on people cards.
     - `/en/collaborations`, `/en/messages` and `/en/moderation/broadcast` redirect home.
     - The workspace page `/en/collaborations/cmqqpqyey0003oky2hufx7h7d` still opens for its owner (membership rule).
  2. **Settings changed in the admin** (Settings → Collaboration): notifications on → dot and Notifications tab appear within a minute; workspaces "team" → staff sees "Start a project".
  3. **Restore** `NEXT_PUBLIC_FEATURE_ENGAGEMENT=true`, then confirm dev looks as before.

  Check en and ar at 375 and 1280, with 0 console errors. Reset the global to all off afterwards.
- [ ] **Step 5: Commit.** `refactor(collaboration): every engagement gate reads Settings → Collaboration`

---

### Task 3: Ask members if they're open to collaborate

**Files:**
- Create:
  - `lib/actions/open-to-collaborate.ts` (`"use server"`)
  - `components/collaborate/open-to-collaborate-card.tsx` (client)
- Modify:
  - `app/[locale]/(main)/dashboard/page.tsx` + `page-client.tsx` (render the card at the top of the main column when shown)
  - `components/onboarding/panels/work-info-panel.tsx` (toggle + interests line)
  - `messages/*.json` (`collaborate.openCard.*`)
- Test:
  - `lib/__tests__/open-to-collaborate-action.test.ts`
  - `components/collaborate/__tests__/open-to-collaborate-card.test.tsx`

**Interfaces:**
- Consumes: Task 1 `getCollaborationAccessFor`, `useCollaboration`; `getActor` from `@/lib/authz`; `prisma.user.update`.
- Produces:
  - `setOpenToCollaborate(open: boolean, interests?: string): Promise<{ ok: true } | { ok: false; error: string }>`. It updates only `openToCollaboration` and `collaborationInterests` (trimmed, ≤ 500 characters, empty → null), refuses when signed out or when `people` is off, and revalidates `/[locale]/dashboard` and `/[locale]/profiles/[username]` (layout paths).
  - `OpenToCollaborateCard({ initiallyOpen }: { initiallyOpen: boolean })`.

- [ ] **Step 1: Messages** (en shown; write es/fr/ar in full), under `collaborate.openCard`:

```json
{ "title": "Open to collaborating?", "body": "Say yes and people working on the same things can find you and ask to connect. You choose who you connect with.", "interestsLabel": "What would you like to work on? (optional)", "interestsPlaceholder": "e.g. youth mental health research in East Africa", "yes": "Yes, I'm open", "notNow": "Not now", "done": "You're open to collaborating.", "edit": "Change what you'd like to work on", "turnOff": "Stop showing me as open", "saveError": "That didn't save — please try again." }
```

- [ ] **Step 2: Failing action test**

```ts
// lib/__tests__/open-to-collaborate-action.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: (a: unknown) => update(a) } } }));
const actor = vi.fn();
vi.mock("@/lib/authz", () => ({ getActor: () => actor() }));
const access = vi.fn();
vi.mock("@/lib/collaboration/access-server", () => ({ getCollaborationAccessFor: () => access() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { setOpenToCollaborate } from "@/lib/actions/open-to-collaborate";

beforeEach(() => { update.mockReset(); actor.mockResolvedValue({ id: "u1", role: "community_member" }); access.mockResolvedValue({ people: true }); });

describe("saying you're open to collaborate", () => {
  it("changes only the two fields", async () => {
    expect(await setOpenToCollaborate(true, "  youth research  ")).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ where: { id: "u1" }, data: { openToCollaboration: true, collaborationInterests: "youth research" } });
  });
  it("clears an empty interests line", async () => {
    await setOpenToCollaborate(true, "   ");
    expect(update.mock.calls[0][0].data.collaborationInterests).toBeNull();
  });
  it("refuses when signed out or while the team hasn't opened it", async () => {
    actor.mockResolvedValueOnce(null);
    expect((await setOpenToCollaborate(true)).ok).toBe(false);
    access.mockResolvedValueOnce({ people: false });
    expect((await setOpenToCollaborate(true)).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run** it. Expected: FAIL. **Step 4: Implement:**

```ts
// lib/actions/open-to-collaborate.ts
"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";

/** Show (or stop showing) a member as open to collaborate, with what they'd like to work on. */
export async function setOpenToCollaborate(open: boolean, interests?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in first." };
  if (!(await getCollaborationAccessFor(actor)).people) return { ok: false, error: "Not available yet." };
  const line = (interests ?? "").trim().slice(0, 500);
  await prisma.user.update({ where: { id: actor.id }, data: { openToCollaboration: open, collaborationInterests: line || null } });
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/profiles/[username]", "page");
  return { ok: true };
}
```

- [ ] **Step 5: Failing card test.** It renders with `NextIntlClientProvider` and English messages. It mocks `@/hooks/use-collaboration` returning `{ people: true, … }` and the action module.
  - Clicking **Yes, I'm open** calls `setOpenToCollaborate(true, "")` and then shows `done`.
  - Clicking **Not now** hides the card and writes `localStorage["ccm:open-card-dismissed"] = "1"`, wrapped in try/catch.
  - With `people: false` the card renders nothing.
  - With `initiallyOpen: true` it renders nothing.
- [ ] **Step 6: Implement the card.** It is a white rounded card using the hub's `ccm-*` tokens, with the interests input as an optional textarea (max 500). Buttons are at least 44px tall, with **Yes** primary and **Not now** a ghost button. It is hidden until mounted, so `localStorage` can be read without a hydration mismatch (use `useSyncExternalStore` like `hooks/use-edge-fade` / `useBrowserTimeZone`). The dashboard page passes `initiallyOpen={user.openToCollaboration}` (already loaded there).
- [ ] **Step 7: Onboarding.** In `work-info-panel.tsx`, add the same toggle and interests field to the panel's form state. On save they go out with the panel's existing save call; if that call is the full `/api/profile` PUT, include both fields there. The fields only show when `useCollaboration().people` is true.
- [ ] **Step 8:** Run the tests, `tsc`, and eslint on changed files. **Rendered check** (dev override off, `people` on in the admin): `/en/dashboard` and `/ar/dashboard` at 375 and 1280.
  - **Yes** shows the done state, and the profile shows the existing "Open to collaborate" badge.
  - **Not now**, then a reload, keeps the card hidden.
  - 0 console errors.
  - Reset the test user's flag afterwards.
- [ ] **Step 9: Commit.** `feat(collaborate): ask members if they're open to collaborating`

---

### Task 4: Find people who are open, and ask to connect

**Files:**
- Modify:
  - `lib/collaborate-filters.ts` (`open` flag in params)
  - `app/[locale]/(main)/collaborate/page.tsx` (people query: `openToCollaboration` filter when `open`, ordering open first)
  - `components/collaborate/community-filters.tsx` (an "Open to collaborate" chip with its count)
  - `components/collaborate/collaborate-user-card.tsx` (**Ask to connect** for open members, with an optional note dialog)
  - `lib/actions/requests.ts` (`requestContact` refuses when the recipient isn't open)
  - `messages/*.json` (`collaborate.connect.*`, `collaborate.filters.openOnly`)
- Test: `lib/__tests__/collaborate-filters.test.ts` (add), `lib/__tests__/request-contact-open.test.ts`

**Interfaces:**
- Consumes: Task 1 access; the existing `requestContact(recipientId, message?)`, which returns `{ status: "PENDING" | "ACCEPTED" }`.
- Produces:
  - `CollaborateFilters` gains `open: boolean`.
  - `buildCollaborateParams` writes `open=1`, and `decodeOpenParam(value)` reads it back as a boolean.

- [ ] **Step 1: Failing tests.**
  - The filter round-trips, `{ open: true }` ↔ `?open=1`.
  - `requestContact("u2", "hi")` refuses with `requests.errors.notOpen` when `prisma.user.findUnique` returns `{ openToCollaboration: false }`, and nothing is created.
  - It also refuses when `people` is off (existing case, now through access).
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement.**
  - In `requestContact`, after the actor and rate-limit checks, load the recipient's `openToCollaboration`. If it's false, return `{ ok: false, error: "requests.errors.notOpen" }` before any write.
  - Add `"notOpen": "This person isn't taking new connections right now."` to `requests.errors` in all four languages.
  - In the people query, when `open`, add `openToCollaboration: true` to the `where`, and always order by `[{ openToCollaboration: "desc" }, …existing order]`.
  - The chip shows only when `access.people` is on. Its count comes from a `prisma.user.count({ where: { …current filters, openToCollaboration: true } })` computed with the list.
  - On the card: if `access.people && user.openToCollaboration && signedIn && not self`, show **Ask to connect**. It opens a small dialog with an optional 300-character note and **Send**, then shows "Request sent" or "You're connected" from the returned status.
  - Signed-out viewers see the badge and the chip, but no button.
- [ ] **Step 4:** Run the tests, `tsc`, and eslint on changed files. **Rendered check** with two dev accounts (staff, plus one member set open):
  - the chip filters, and open members come first;
  - Ask to connect → the recipient's Notifications tab shows the request with Accept / Not now;
  - en and ar, 375 and 1280, 0 console errors.
  - Clean up the request rows.
- [ ] **Step 5: Commit.** `feat(collaborate): find people open to collaborating, and ask to connect`

---

### Task 5: A connection shares how to reach each other

**Files:**
- Create: `lib/collaborate/connection.ts` (server-only)
- Modify:
  - `lib/actions/requests.ts` `respondToContactRequest` (on accept, both notifications carry the other's email)
  - `app/[locale]/(main)/profiles/[username]/page.tsx` ("You're connected · email" for the two people only)
  - `components/notifications/notification-feed.tsx` (render the email from the structured snippet)
  - `messages/*.json` (`notifications.snippets.contactAcceptedWithEmail`, `profile.connected`)
- Test: `lib/__tests__/connection-email.test.ts`

**Interfaces:**
- Produces: `connectedEmail(viewerId: string, profileUserId: string): Promise<string | null>`. It returns the profile owner's email only when an ACCEPTED `ContactRequest` exists between the two, in either direction; otherwise it returns null.

- [ ] **Step 1: Failing test.** Mock `prisma.contactRequest.findFirst` and `prisma.user.findUnique`.
  - ACCEPTED in either direction → the email.
  - PENDING, DECLINED or none → null.
  - The viewer's own profile → null; no badge is needed there.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement:**

```ts
// lib/collaborate/connection.ts
import "server-only";
import { prisma } from "@/lib/prisma";

/** The profile owner's email for someone they've accepted a connection with — mutual consent only. */
export async function connectedEmail(viewerId: string, profileUserId: string): Promise<string | null> {
  if (!viewerId || viewerId === profileUserId) return null;
  const link = await prisma.contactRequest.findFirst({
    where: { status: "ACCEPTED", OR: [{ requesterId: viewerId, recipientId: profileUserId }, { requesterId: profileUserId, recipientId: viewerId }] },
    select: { id: true },
  });
  if (!link) return null;
  const user = await prisma.user.findUnique({ where: { id: profileUserId }, select: { email: true } });
  return user?.email ?? null;
}
```

  Check the `User` email column name before writing (`rg -n "email " prisma/schema.prisma | head -3`). Use the real name.

  In `respondToContactRequest`, on accept, load both emails. Write the requester's notification snippet as `structuredSnippet("contactAcceptedWithEmail", { email: <recipient's email> })`, and mark the recipient's own resolved notification with the requester's email the same way. Declining stays as it is.

  In the feed, `contactAcceptedWithEmail` reads "accepted your request to connect — reach them at {email}". The email renders as a `mailto:` link.

  On the profile page, when `connectedEmail(actor.id, profile.id)` is set, show the "You're connected" line with the `mailto:` link beside the open-to-collaborate badge.
- [ ] **Step 4:** Run the tests, `tsc`, and eslint on changed files. **Rendered check:**
  - With the Task 4 accounts, accept a request; both profiles then show the line to each other.
  - A third account sees neither email.
  - en and ar, 0 console errors.
  - Clean up the rows.
- [ ] **Step 5: Commit.** `feat(collaborate): connecting shares how to reach each other`

---

### Task 6: Notifications that matter — outcomes and new events

**Files:**
- Create: `lib/notifications/outcomes.ts` (server-only)
- Modify:
  - `payload/hooks/moderation.ts` (after a status change on any moderated collection, call `notifyOutcomeInHub`; when an **event** becomes approved, call `notifyRegionFollowers`)
  - `components/notifications/notification-feed.tsx` (links: `entityType "contribution"` → `/dashboard/submissions`, `"event"` → `/events/<entityId>`)
  - `messages/*.json` (`notifications.snippets.outcome`, `notifications.snippets.newEventInRegion`)
- Test: `lib/__tests__/notification-outcomes.test.ts`, plus extending `lib/__tests__/payload-moderation.test.ts`

**Interfaces:**
- Consumes: `createNotification({ recipientId, type, actorId?, entityType?, entityId?, snippet? })` and `structuredSnippet(key, params)`. `Follow` rows `{ userId, targetType: "REGION", targetId: <community slug> }`.
- Produces:
  ```ts
  export async function notifyOutcomeInHub(input: { kind: "caseStudy" | "livedExperience" | "researchOutput" | "event"; submittedBy: string | null; title: string; status: "approved" | "revision" | "rejected" }): Promise<void>;
  export async function notifyRegionFollowers(input: { communitySlug: string | null; eventSlug: string; eventTitle: string; now?: Date }): Promise<number>; // recipients written
  ```

- [ ] **Step 1: Failing tests.**
  - **Outcome:**
    - Writes one `OUTPUT_STATUS` with `entityType: "contribution"`, `entityId: kind` and `snippet: structuredSnippet("outcome", { title, status })` to `submittedBy`.
    - Writes nothing when `submittedBy` is null.
    - Writes nothing when the status is `pending`.
  - **Followers:**
    - For `communitySlug: "oceania"` with follows `[u1, u2]`, it writes `FOLLOWED_PUBLISH` for each, with `entityType: "event"`, `entityId: eventSlug` and `snippet: structuredSnippet("newEventInRegion", { title, region: "oceania" })`.
    - If `u1` already has a `FOLLOWED_PUBLISH` with `entityType "event"` whose snippet contains `"region":"oceania"` created within 24h of `now`, only `u2` gets one.
    - It returns 0 when `communitySlug` is null.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement:**

```ts
// lib/notifications/outcomes.ts
import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications/service";
import { structuredSnippet } from "@/lib/notifications/structured";

const DAY = 24 * 60 * 60 * 1000;

/** The sender hears, in the hub, what happened to what they sent (alongside any email). */
export async function notifyOutcomeInHub(input: { kind: "caseStudy" | "livedExperience" | "researchOutput" | "event"; submittedBy: string | null; title: string; status: string }): Promise<void> {
  if (!input.submittedBy || !["approved", "revision", "rejected"].includes(input.status)) return;
  await createNotification({
    recipientId: input.submittedBy,
    type: "OUTPUT_STATUS",
    entityType: "contribution",
    entityId: input.kind,
    snippet: structuredSnippet("outcome", { title: input.title, status: input.status }),
  });
}

/** A new event in a region someone follows — at most one such note per person, region and day. */
export async function notifyRegionFollowers(input: { communitySlug: string | null; eventSlug: string; eventTitle: string; now?: Date }): Promise<number> {
  if (!input.communitySlug) return 0;
  const now = input.now ?? new Date();
  const follows = await safeQuery(() => prisma.follow.findMany({ where: { targetType: "REGION", targetId: input.communitySlug! }, select: { userId: true } }));
  if (!follows.success || follows.data.length === 0) return 0;
  const ids = [...new Set(follows.data.map((f) => f.userId))];
  const recent = await safeQuery(() =>
    prisma.notification.findMany({
      where: { recipientId: { in: ids }, type: "FOLLOWED_PUBLISH", entityType: "event", createdAt: { gte: new Date(now.getTime() - DAY) }, snippet: { contains: `"region":"${input.communitySlug}"` } },
      select: { recipientId: true },
    }),
  );
  const already = new Set(recent.success ? recent.data.map((n) => n.recipientId) : []);
  const to = ids.filter((id) => !already.has(id));
  await Promise.all(
    to.map((recipientId) =>
      createNotification({ recipientId, type: "FOLLOWED_PUBLISH", entityType: "event", entityId: input.eventSlug, snippet: structuredSnippet("newEventInRegion", { title: input.eventTitle, region: input.communitySlug! }) }),
    ),
  );
  return to.length;
}
```

  **Hook wiring.** In `moderationAfterChange`, when `previousDoc.moderationStatus !== doc.moderationStatus`, run both calls deferred, like `notify`. Import them dynamically, and catch and log any failure — never throw. The calls:
  - `notifyOutcomeInHub({ kind: KIND[collection], submittedBy: doc.submittedBy, title: doc.title?.en ?? "", status: doc.moderationStatus })` for every moderated collection;
  - and, for `events` turning `approved`: `notifyRegionFollowers({ communitySlug: <relatedCommunity slug — read it with payload.findByID depth 1 if doc holds an id>, eventSlug: doc.slug, eventTitle: doc.title?.en ?? "" })`.

  Both respect `SKIP_MODERATION_SIDE_EFFECTS`, like the existing side effects. Feed copy:
  - `outcome` — "“{title}” was published" / "needs a few changes" / "wasn't accepted" (choose by `status`).
  - `newEventInRegion` — "New event in {region}: “{title}”" (region label via `navigation.regions` keys from the slug, using `slugToShortCode` + `REGION_I18N_KEY`).
- [ ] **Step 4:** Run the new tests, `payload-moderation`, the full suite, `tsc`, and eslint on changed files. **Rendered check** (notifications on):
  - Approve a dev lived experience sent by the staff test user → the Notifications tab shows the outcome, which links to My contributions.
  - Follow Oceania, approve an Oceania event → "New event in Oceania"; approving a second Oceania event the same day adds nothing.
  - en and ar, 0 console errors.
  - Clean up the test data.
- [ ] **Step 5: Commit.** `feat(notifications): outcomes and new events in regions you follow, in the hub`

---

### Task 7: How the team turns Stage 1 on

**Files:**
- Create: `scripts/collaboration/uptake.ts` (read-only counts, for dev or `--production` via `scripts/with-prod-env.sh`)
- Modify: `docs/migration/payload-production-runbook.md` (section "Opening collaboration — Stage 0 and Stage 1")
- Test: none beyond running the script on dev (it only reads).

- [ ] **Step 1:** The script prints:
  - members, and members open to collaborate;
  - connection requests by status in the last 7 days and in total;
  - notifications created and read in the last 7 days, by type;
  - region follows;
  - the current Settings → Collaboration values.

  It guards with `assertPayloadDatabase` for the Payload read, and checks `DATABASE_URL`'s host before reading Prisma, refusing `misty-dawn` without `--production`.
- [ ] **Step 2:** Runbook section:
  - **What ships:** the setting, all off — no visible change.
  - **The migration:** `collaboration_settings`, additive.
  - **After the push:** `/admin` → Settings → Collaboration exists, all off.
  - **To open Stage 1:** tick "Notifications in the hub" and "Open to collaborate and Ask to connect".
  - **What to watch:** run the uptake script weekly.
  - **When to consider Stage 2:** at least 30 open members and at least 10 accepted connections.
  - **Email caveat:** Resend domain unverified → in-hub first.
- [ ] **Step 3:** Run the script on dev, and the full suite. **Commit.** `docs(runbook): opening collaboration, stage 1` and `feat(scripts): collaboration uptake counts`.
