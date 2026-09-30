# Events across the hub — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **This programme runs inline, no subagents (user).**

**Goal:** Visitors on production find upcoming events — CCM's and other organisations' — on `/events`, their community page, the atlas and the homepage; members suggest events that editors approve, and editors can pause suggestions or stop one person.

**Architecture:** The `events` collection gains who-runs-it fields, tags and outcome bookkeeping; a new `eventSuggestions` global holds the on/off switch and the block list. Suggestions go through one guarded endpoint and the existing moderation workflow (now emailing the sender). One `/events` page (shared filter bar, month groups in the visitor's time zone) replaces `/collaborate/events`; the Content feed, a new community chapter kind, a homepage section and a new atlas layer put events everywhere else.

**Tech Stack:** Next.js 16 App Router, Payload 3.88 (Postgres), next-intl 4 (en/es/fr/ar, Arabic right-to-left), Clerk, vitest + RTL, Playwright MCP for rendered checks.

**Spec:** `docs/superpowers/specs/2026-09-29-events-design.md` (and, for filters, `docs/superpowers/specs/2026-09-30-filters-from-real-content-design.md`, which says events join the shared filter bar).

## Global Constraints

- Only approved events are public (`moderationStatus == "approved"`), everywhere.
- Event pages and `/events` do NOT depend on `FEATURES.engagement`; RSVP still does (spec E5).
- Outside events: badge "External · Organised by X", link to the organiser's site in a new tab with `rel="noopener"` and ↗, no RSVP on the hub (E3).
- Suggestions: signed-in only; site-wide switch; per-person block; at most **5** pending per member; all three checks on the server (§3.3).
- Times are stored as UTC instants and shown in the visitor's own time zone; the form shows the time zone it used (§7).
- No hard-coded filter vocabularies: themes/communities come from tags content carries (filters spec §3.2).
- Four languages for every new message (en/es/fr/ar); Arabic renders right-to-left; mobile first (375 px) with no sideways page scroll.
- Plain user words in UI and admin labels ("Who runs it", "Suggest an event", "Waiting"), never dev-speak.
- Pushing master deploys production and runs Payload `prodMigrations`; Prisma migrations do NOT run on push — so this plan adds no Prisma migration (see Task 1 ruling).
- Commits: no Claude/AI attribution (CLAUDE.md). Push only when the user says so.
- After touching `payload/**`: `curl /admin` must return 200 (admin client-import gotcha).

## Review Focus

1. **More upcoming events than the feed's count** — the Content feed reads `sort: -startAt` with a limit, so a feed of 3 on the homepage would show the three *furthest* events, not the soonest. Expect the soonest. (Test in Task 7.)
2. **An event that has started but not ended** — should still show under upcoming ("happening now"), not vanish into past. (Test in Task 5.)
3. **An outside event with no website** (saved before validation existed, or by an editor clearing it) — the card must fall back to the hub page, never render a dead link. (Test in Task 5.)
4. **A blocked member resubmitting through edit mode** (`editId`) — the block and the switch must also refuse edits, not only new suggestions; revisions (`revision` status) don't count toward the cap of 5. (Test in Task 2.)
5. **Midnight-UTC events in the Americas / Asia** — month grouping and day shown must use the visitor's zone (an event at 00:30 UTC on 1 Feb shows 31 Jan in New York, grouped under January). (Test in Task 5.)

---

## File structure

| File | Responsibility |
|---|---|
| `payload/collections/events.ts` (modify) | `origin`, `organiser`, `organiserName`, `url` relabel + rule, `tags`, `notifiedStatus` |
| `payload/fields/event-rules.ts` (create) | pure `externalNeedsWebsite` validator |
| `payload/globals/event-suggestions.ts` (create) | global: `open`, `blocked[]` |
| `payload/blocks/chapter.ts` (modify) | chapter option `events` |
| `migrations/<ts>_events_across_the_hub.ts` (generated) | the one additive migration |
| `lib/events/suggestion-guard.ts` (create) | pure guard: switch / blocked / cap / signed-in |
| `lib/content/discovery.ts` + `internal/payload/discovery.ts` (modify) | reads/writes: new fields, settings, pending count, my suggestions, block/unblock |
| `app/api/events/submit/route.ts` (modify) | guarded endpoint, human-friendly errors |
| `app/[locale]/(main)/events/suggest/page.tsx` (create) | suggest page + Your suggestions |
| `components/events/suggest-form.tsx` (create) | the form (replaces `event-submit-form.tsx`) |
| `components/events/your-suggestions.tsx` (create) | status list |
| `lib/case-study-emails.ts` → notifier gains `kind` | event outcome emails |
| `payload/moderation/workflows.ts`, `payload/hooks/moderation.ts` (modify) | events notify |
| `lib/actions/event-suggestions.ts` (create) | staff action: stop / allow a person |
| `components/moderation/review-list.tsx`, `lib/moderation/review-items.ts` (modify) | block button on event items |
| `lib/events/listing.ts` (create) | pure: card mapping, upcoming rule, month grouping |
| `lib/filters/adapters.ts` (modify) | `eventToFilterable` |
| `components/filters/filter-bar.tsx` (modify) | `extras` rows (mode, who runs it), preserved in the URL |
| `app/[locale]/(main)/events/page.tsx` (create), `components/events/event-list.tsx` (create, client) | `/events` |
| `app/[locale]/(main)/events/[slug]/page.tsx` (moved) | event page, RSVP only with engagement |
| `next.config.mjs` (modify) | permanent redirects from `/collaborate/events…` |
| `lib/content/feeds/types.ts`, `lib/content/internal/payload/feeds.ts` (modify) | listing link, soonest-first, external href |
| `lib/content/chapters.ts` + messages | `events` chapter |
| `scripts/events/plan.ts`, `scripts/events/add-sections.ts` (create) | put the chapter and "Coming up" on pages |
| `lib/maps/*`, `lib/content/internal/payload/regions.ts`, map routes (modify) | atlas Events layer |
| `messages/{en,es,fr,ar}.json` | all new copy |
| `docs/migration/payload-production-runbook.md` | runbook section |

---

### Task 1: The event record and the suggestions switch

**Files:**
- Create: `payload/fields/event-rules.ts`, `payload/globals/event-suggestions.ts`
- Modify: `payload/collections/events.ts`, `payload/globals/index.ts` (or wherever globals are registered — check `payload.config.ts` `globals:`), `payload/blocks/chapter.ts`
- Generate: `migrations/<timestamp>_events_across_the_hub.ts` (+ `.json`), `payload-types.ts`
- Test: `lib/__tests__/event-rules.test.ts`, `lib/__tests__/events-collection-config.test.ts`

**Interfaces:**
- Produces: `externalNeedsWebsite(value: unknown, { siblingData }: { siblingData: { origin?: string } }): true | string`; event fields `origin: "ccm" | "external"`, `organiser` (→ organizations), `organiserName` (text), `tags` (→ tags, hasMany), `notifiedStatus` (text, hidden); global slug `eventSuggestions` with `open: boolean` (default true) and `blocked: Array<{ userId: string; note?: string }>`; chapter option value `events`.

**Ruling to ledger at start:** spec §3.3 puts the block flag on Prisma `User`. Prisma migrations don't run on push (only Payload `prodMigrations` do), so deploying code that reads a missing column would break suggestions until the user ran `prisma migrate deploy`. The block list lives in the `eventSuggestions` global instead (one place for all three controls, editable in the admin). Cost if wrong: a later move to Prisma.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/event-rules.test.ts
import { describe, expect, it } from "vitest";
import { externalNeedsWebsite } from "@/payload/fields/event-rules";

describe("an outside event needs its organiser's website", () => {
  it("refuses an empty website when another organisation runs it", () => {
    expect(externalNeedsWebsite("", { siblingData: { origin: "external" } })).toBe(
      "Add the event's website — visitors go there for outside events.",
    );
    expect(externalNeedsWebsite(undefined, { siblingData: { origin: "external" } })).not.toBe(true);
  });
  it("accepts a website for an outside event, and no website for a CCM one", () => {
    expect(externalNeedsWebsite("https://example.org/ev", { siblingData: { origin: "external" } })).toBe(true);
    expect(externalNeedsWebsite("", { siblingData: { origin: "ccm" } })).toBe(true);
    expect(externalNeedsWebsite("", { siblingData: {} })).toBe(true);
  });
  it("still refuses a website that isn't a web address", () => {
    expect(externalNeedsWebsite("not a url", { siblingData: { origin: "ccm" } })).not.toBe(true);
  });
});
```

```ts
// lib/__tests__/events-collection-config.test.ts
import { describe, expect, it } from "vitest";
import { Events } from "@/payload/collections/events";
import { EventSuggestions } from "@/payload/globals/event-suggestions";
import { CHAPTER_OPTIONS } from "@/payload/blocks/chapter";

const field = (name: string) => Events.fields.find((f) => "name" in f && f.name === name) as Record<string, unknown> | undefined;

describe("the event record", () => {
  it("says who runs it, defaulting to CCM", () => {
    expect(field("origin")).toMatchObject({ type: "select", defaultValue: "ccm", label: "Who runs it" });
    expect(field("organiser")).toMatchObject({ type: "relationship", relationTo: "organizations" });
    expect(field("organiserName")).toMatchObject({ type: "text" });
  });
  it("carries tags for the filters, and hidden outcome bookkeeping", () => {
    expect(field("tags")).toMatchObject({ type: "relationship", relationTo: "tags", hasMany: true });
    expect(field("notifiedStatus")).toMatchObject({ type: "text", admin: expect.objectContaining({ hidden: true }) });
  });
  it("calls the link the Event website", () => {
    expect(field("url")).toMatchObject({ label: "Event website" });
  });
});

describe("event suggestions settings", () => {
  it("are open by default and editors-only", () => {
    const open = EventSuggestions.fields.find((f) => "name" in f && f.name === "open");
    expect(open).toMatchObject({ type: "checkbox", defaultValue: true });
    expect(EventSuggestions.admin?.group).toBe("Settings");
  });
});

describe("the community page menu", () => {
  it("offers Events", () => {
    expect(CHAPTER_OPTIONS.map((o) => o.value)).toContain("events");
  });
});
```

- [ ] **Step 2: Run** `pnpm exec vitest run lib/__tests__/event-rules.test.ts lib/__tests__/events-collection-config.test.ts` — Expected: FAIL (module not found / `CHAPTER_OPTIONS` not exported).

- [ ] **Step 3: Implement**

```ts
// payload/fields/event-rules.ts
import { urlValidate } from "@/payload/fields/validation";

/** Outside events send visitors to the organiser's site, so they need one (spec §3.1). Pure. */
export function externalNeedsWebsite(value: unknown, args: { siblingData?: { origin?: unknown } }): true | string {
  const empty = value == null || (typeof value === "string" && value.trim() === "");
  if (empty) return args.siblingData?.origin === "external" ? "Add the event's website — visitors go there for outside events." : true;
  return (urlValidate as (v: unknown, a: unknown) => true | string)(value, args);
}
```

In `payload/collections/events.ts`: import `externalNeedsWebsite`; after `slugField(...)` add

```ts
    {
      name: "origin",
      type: "select",
      label: "Who runs it",
      defaultValue: "ccm",
      options: [
        { label: "CCM (a project or community)", value: "ccm" },
        { label: "Another organisation", value: "external" },
      ],
    },
    relationshipField("organiser", "organizations", { label: "Organised by (on the hub)" }),
    {
      name: "organiserName",
      type: "text",
      label: "Organised by (name)",
      admin: { description: "Used when the organisation isn't on the hub." },
    },
```

replace the `url` field with `{ name: "url", type: "text", label: "Event website", validate: externalNeedsWebsite as never }`, add `relationshipField("tags", "tags", { hasMany: true })` after `relatedCommunity`, and after `reviewNotes` add `{ name: "notifiedStatus", type: "text", admin: { hidden: true } }`. Check `relationshipField`'s option name for the label by reading `payload/blocks/shared.ts` first; match it.

```ts
// payload/globals/event-suggestions.ts
import type { GlobalConfig } from "payload";
import { isEditor } from "@/payload/access";

/** Editors' controls over member event suggestions (events spec §3.3). */
export const EventSuggestions: GlobalConfig = {
  slug: "eventSuggestions",
  label: "Event suggestions",
  admin: { group: "Settings" },
  access: { read: isEditor, update: isEditor },
  fields: [
    {
      name: "open",
      type: "checkbox",
      label: "Members can suggest events",
      defaultValue: true,
      admin: { description: "Off: the form says suggestions are paused and nothing new comes in." },
    },
    {
      name: "blocked",
      type: "array",
      label: "People who can't suggest events",
      admin: { description: "Added from the review queue's “Stop this person suggesting events”." },
      fields: [
        { name: "userId", type: "text", required: true, label: "Member id" },
        { name: "note", type: "text", label: "Why (only the team sees this)" },
      ],
    },
  ],
};
```

Register it beside the other globals. In `payload/blocks/chapter.ts` export the list (`export const CHAPTER_OPTIONS`) and add `{ label: "Events", value: "events" }` after News.

- [ ] **Step 4: Run the tests** — Expected: PASS.

- [ ] **Step 5: Migration.** `pnpm exec payload migrate:create events_across_the_hub` (dev env, `.env.local`). Read the generated `up`: expect only ADDs (columns `origin`, `organiser_id`, `organiser_name`, `notified_status`; `events_rels` tag rows; the `event_suggestions` + `event_suggestions_blocked` tables; `ALTER TYPE … ADD VALUE 'events'` on each community block's chapter-kind enum). Anything dropped or renamed → stop and ledger. Run `pnpm exec payload migrate` on dev; `pnpm exec payload generate:types`.

- [ ] **Step 6: Verify** `pnpm exec tsc --noEmit -p .`; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/admin` → `200`; open an event in the admin: "Who runs it" shows, choosing "Another organisation" with an empty website refuses to save with the message above.

- [ ] **Step 7: Commit** — `feat(events): who runs it, tags, and a switch for member suggestions`.

---

### Task 2: One guarded way in

**Files:**
- Create: `lib/events/suggestion-guard.ts`, `lib/__tests__/event-suggestion-guard.test.ts`
- Modify: `lib/content/discovery.ts`, `lib/content/internal/payload/discovery.ts` (reads/writes), `lib/validation/event.ts`, `app/api/events/submit/route.ts`, `lib/validation/error-keys.ts` + `messages/*/forms.errors`
- Test: `lib/__tests__/event-submit-route.test.ts`

**Interfaces:**
- Consumes: Task 1 fields and global.
- Produces:
  - `type SuggestionRefusal = "signIn" | "paused" | "blocked" | "tooMany"`
  - `suggestionRefusal(input: { userId: string | null; open: boolean; blocked: string[]; pendingCount: number; isEdit: boolean }): SuggestionRefusal | null` — `MAX_PENDING_SUGGESTIONS = 5`
  - `getEventSuggestionSettings(): Promise<{ open: boolean; blocked: string[] }>` (live read, no cache; missing global → `{ open: true, blocked: [] }`)
  - `countPendingEventSuggestions(userId: string): Promise<number>` (live; `moderationStatus == "pending"` only)
  - `listMyEventSuggestions(userId: string): Promise<MySuggestion[]>` with `MySuggestion = { id: string; title: string; startAt: string | null; status: "pending" | "approved" | "revision" | "rejected"; reviewNotes: string | null; slug: string | null }`, newest first
  - `EventInput` gains `origin: "ccm" | "external"`, `organiserName: string | null`, `place: { text: string | null; point: [number, number] | null; precision: string | null; countryCode: string | null } | null`

- [ ] **Step 1: Failing guard test**

```ts
// lib/__tests__/event-suggestion-guard.test.ts
import { describe, expect, it } from "vitest";
import { MAX_PENDING_SUGGESTIONS, suggestionRefusal } from "@/lib/events/suggestion-guard";

const base = { userId: "u1", open: true, blocked: [] as string[], pendingCount: 0, isEdit: false };

describe("who may suggest an event", () => {
  it("lets a signed-in member in when suggestions are open", () => {
    expect(suggestionRefusal(base)).toBeNull();
  });
  it("asks visitors to sign in first", () => {
    expect(suggestionRefusal({ ...base, userId: null })).toBe("signIn");
  });
  it("refuses everyone while suggestions are paused — edits too", () => {
    expect(suggestionRefusal({ ...base, open: false })).toBe("paused");
    expect(suggestionRefusal({ ...base, open: false, isEdit: true })).toBe("paused");
  });
  it("refuses a blocked member — edits too", () => {
    expect(suggestionRefusal({ ...base, blocked: ["u1"] })).toBe("blocked");
    expect(suggestionRefusal({ ...base, blocked: ["u1"], isEdit: true })).toBe("blocked");
  });
  it("refuses a sixth waiting suggestion, but not an edit of one already waiting", () => {
    expect(MAX_PENDING_SUGGESTIONS).toBe(5);
    expect(suggestionRefusal({ ...base, pendingCount: 4 })).toBeNull();
    expect(suggestionRefusal({ ...base, pendingCount: 5 })).toBe("tooMany");
    expect(suggestionRefusal({ ...base, pendingCount: 5, isEdit: true })).toBeNull();
  });
});
```

- [ ] **Step 2: Run** → FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
// lib/events/suggestion-guard.ts
/** The server's checks before an event suggestion is saved (events spec §3.3). Pure. */
export const MAX_PENDING_SUGGESTIONS = 5;
export type SuggestionRefusal = "signIn" | "paused" | "blocked" | "tooMany";

export function suggestionRefusal(input: {
  userId: string | null;
  open: boolean;
  blocked: string[];
  pendingCount: number;
  isEdit: boolean;
}): SuggestionRefusal | null {
  if (!input.userId) return "signIn";
  if (!input.open) return "paused";
  if (input.blocked.includes(input.userId)) return "blocked";
  // Only brand-new suggestions add to the queue; "needs changes" isn't pending.
  if (!input.isEdit && input.pendingCount >= MAX_PENDING_SUGGESTIONS) return "tooMany";
  return null;
}
```

- [ ] **Step 4: Run** → PASS.

- [ ] **Step 5: Reads and writes.** In `lib/content/internal/payload/discovery.ts` add (live reads via `queryLive`, as `getApprovedEventForRsvp` does):

```ts
export async function getEventSuggestionSettings(): Promise<{ open: boolean; blocked: string[] }> {
  const row = await queryLive<Row | null>({ type: "findGlobal", slug: "eventSuggestions", depth: 0 }).catch(() => null);
  const blocked = Array.isArray(row?.blocked) ? (row!.blocked as Row[]).map((b) => text(b.userId)).filter((v): v is string => !!v) : [];
  return { open: row?.open !== false, blocked };
}

export async function countPendingEventSuggestions(userId: string): Promise<number> {
  const r = await queryLive<{ totalDocs: number }>({ type: "count", collection: "events", where: and({ submittedBy: { equals: userId } }, { moderationStatus: { equals: "pending" } }) });
  return r.totalDocs;
}

export async function listMyEventSuggestions(userId: string): Promise<MySuggestion[]> {
  const r = await queryLive<Paginated<Row>>({ type: "find", collection: "events", where: { submittedBy: { equals: userId } }, sort: "-createdAt", pagination: false, locale: "all", depth: 0 });
  return r.docs.map((row) => ({
    id: docId(row),
    title: enArm(row.title) ?? text(row.title) ?? "",
    startAt: isoDate(row.startAt),
    status: (text(row.moderationStatus) ?? "pending") as MySuggestion["status"],
    reviewNotes: text(row.reviewNotes),
    slug: text(row.slug),
  }));
}
```

Check first that the seam's `queryLive` supports `findGlobal` and `count` (read `lib/content/internal/payload-source.ts`); if not, add those operation types there with a test beside its existing ones. Add the Sanity-arm stubs in `lib/content/discovery.ts` the way the file's other functions do (`if (onPayload()) return payloadDiscovery.x(...)`; Sanity arm returns `{ open: true, blocked: [] }` / `0` / `[]` — Sanity is not live). Extend `eventFields` with `origin`, `organiserName`, `place` (only when present), and `submitEvent`/`updateEvent` accordingly; extend `eventSubmissionSchema` with `origin: z.enum(["ccm","external"]).default("ccm")`, `organiserName: z.string().trim().max(160).optional().or(z.literal(""))`, `place` (the `PlacePicker` value shape) and a refine: `origin === "external"` requires `url` (path `["url"]`, error key `eventWebsiteRequired`).

- [ ] **Step 6: Failing route test** (`lib/__tests__/event-submit-route.test.ts`; mock `@clerk/nextjs/server`, `@/lib/content/discovery`, `@/lib/rate-limit-route` as the repo's other route tests do — copy the setup from the nearest `*route*.test.ts`):

```ts
it("refuses while suggestions are paused, in the reader's words", async () => {
  settings.mockResolvedValue({ open: false, blocked: [] });
  const res = await POST(req({ title: "Coastal walk", startAt: "2026-11-02T10:00:00.000Z" }));
  expect(res.status).toBe(403);
  expect((await res.json()).error.message).toMatch(/paused/i);
  expect(submitEvent).not.toHaveBeenCalled();
});
it("refuses a blocked member's edit", async () => {
  settings.mockResolvedValue({ open: true, blocked: ["user_1"] });
  const res = await POST(req({ editId: "ev1", title: "Coastal walk", startAt: "2026-11-02T10:00:00.000Z" }));
  expect(res.status).toBe(403);
  expect(updateEvent).not.toHaveBeenCalled();
});
it("refuses a sixth waiting suggestion", async () => {
  settings.mockResolvedValue({ open: true, blocked: [] });
  pending.mockResolvedValue(5);
  expect((await POST(req({ title: "Coastal walk", startAt: "2026-11-02T10:00:00.000Z" }))).status).toBe(429);
});
it("works without the engagement switch and saves who runs it", async () => {
  settings.mockResolvedValue({ open: true, blocked: [] });
  pending.mockResolvedValue(0);
  const res = await POST(req({ title: "Reef day", startAt: "2026-11-02T10:00:00.000Z", origin: "external", organiserName: "Reef Trust", url: "https://reef.example" }));
  expect(res.status).toBe(200);
  expect(submitEvent).toHaveBeenCalledWith(expect.objectContaining({ origin: "external", organiserName: "Reef Trust", url: "https://reef.example" }));
});
it("asks for the website of an outside event", async () => {
  settings.mockResolvedValue({ open: true, blocked: [] });
  pending.mockResolvedValue(0);
  const res = await POST(req({ title: "Reef day", startAt: "2026-11-02T10:00:00.000Z", origin: "external" }));
  expect(res.status).toBe(400);
  expect((await res.json()).error.fields.url).toBeTruthy();
});
```

- [ ] **Step 7: Run** → FAIL. **Step 8: Route.** In `app/api/events/submit/route.ts`: remove the `FEATURES.engagement` check; after auth, `const [settings, pendingCount] = await Promise.all([getEventSuggestionSettings(), countPendingEventSuggestions(userId)])`; `const refusal = suggestionRefusal({ userId, open: settings.open, blocked: settings.blocked, pendingCount, isEdit: Boolean(body.editId) })`; map refusals with `formErrorResponse({ request, formKey: ERROR_KEYS.eventSuggestionsPaused | eventSuggestionsBlocked | eventSuggestionsTooMany, status: 403 | 403 | 429 })`; validation failures → `formErrorResponse({ request, issues: parsed.error, input: body })`. Unauthenticated stays 401. Add the three error keys and `eventWebsiteRequired` to `lib/validation/error-keys.ts` and to `forms.errors` in all four message files:

| key | en | es | fr | ar |
|---|---|---|---|---|
| eventSuggestionsPaused | Event suggestions are paused for now — please try again later. | Las sugerencias de eventos están en pausa por ahora; inténtalo más tarde. | Les suggestions d'événements sont en pause pour le moment — réessayez plus tard. | اقتراحات الفعاليات متوقفة مؤقتًا — يُرجى المحاولة لاحقًا. |
| eventSuggestionsBlocked | You can't suggest events at the moment. | No puedes sugerir eventos en este momento. | Vous ne pouvez pas suggérer d'événements pour le moment. | لا يمكنك اقتراح فعاليات في الوقت الحالي. |
| eventSuggestionsTooMany | You have 5 suggestions waiting — the team will look at those first. | Tienes 5 sugerencias en espera; el equipo las revisará primero. | Vous avez 5 suggestions en attente — l'équipe les examinera d'abord. | لديك 5 اقتراحات قيد الانتظار — سيراجعها الفريق أولًا. |
| eventWebsiteRequired | Add the event's website — visitors go there for outside events. | Añade el sitio web del evento: los visitantes irán allí. | Ajoutez le site de l'événement — les visiteurs s'y rendront. | أضف موقع الفعالية — سيتوجه الزوار إليه. |

- [ ] **Step 9: Run** the route and guard tests → PASS; `tsc` clean.
- [ ] **Step 10: Commit** — `feat(events): suggestions pass one server check — open, not blocked, fewer than 5 waiting`.

---

### Task 3: `/events/suggest` and "Your suggestions"

**Files:**
- Create: `app/[locale]/(main)/events/suggest/page.tsx`, `components/events/suggest-form.tsx`, `components/events/your-suggestions.tsx`, `lib/events/local-time.ts`
- Modify: `app/[locale]/(main)/collaborate/events/new/page.tsx` (redirect), `components/collaboration/workspace-outputs.tsx`, `lib/collaboration/outputs.ts`, `messages/*.json` (`events.suggest.*`)
- Delete: `components/events/event-submit-form.tsx` (after moving its edit-mode logic)
- Test: `lib/__tests__/local-time.test.ts`, `components/events/__tests__/your-suggestions.test.tsx`

**Interfaces:**
- Consumes: Task 2 `listMyEventSuggestions`, `getEventSuggestionSettings`, `countPendingEventSuggestions`, `MySuggestion`, endpoint errors.
- Produces: `localInputToIso(value: string): string` and `zoneLabel(date: Date, locale: string): string` (e.g. "GMT+1"); route `/events/suggest` accepting `?workspace=` and `?edit=` exactly as `/collaborate/events/new` did.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/local-time.test.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { localInputToIso, zoneLabel } from "@/lib/events/local-time";

afterEach(() => vi.unstubAllEnvs());
describe("times the member typed", () => {
  it("become UTC instants from the browser's zone", () => {
    vi.stubEnv("TZ", "America/New_York");
    expect(localInputToIso("2026-11-02T19:30")).toBe("2026-11-03T00:30:00.000Z");
  });
  it("are labelled with the zone the form used", () => {
    expect(zoneLabel(new Date("2026-07-01T12:00:00Z"), "en")).toMatch(/GMT|UTC/);
  });
  it("refuse an empty or broken value", () => {
    expect(localInputToIso("")).toBe("");
    expect(localInputToIso("nope")).toBe("");
  });
});
```

(If `vi.stubEnv("TZ")` doesn't change `Date` after startup in this vitest setup, run this file with `TZ=America/New_York` via a `// @vitest-environment-options` or assert with an offset computed from `new Date().getTimezoneOffset()` instead — ledger which.)

```tsx
// components/events/__tests__/your-suggestions.test.tsx
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { YourSuggestions } from "@/components/events/your-suggestions";

it("shows each suggestion's outcome and the team's note", () => {
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <YourSuggestions
        locale="en"
        items={[
          { id: "a", title: "Reef day", startAt: "2026-11-02T10:00:00.000Z", status: "revision", reviewNotes: "Please add the venue.", slug: "reef-day" },
          { id: "b", title: "Coastal walk", startAt: null, status: "approved", reviewNotes: null, slug: "coastal-walk" },
        ]}
      />
    </NextIntlClientProvider>,
  );
  expect(screen.getByText("Needs changes")).toBeInTheDocument();
  expect(screen.getByText("Please add the venue.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Coastal walk/ })).toHaveAttribute("href", "/events/coastal-walk");
  expect(screen.getByRole("link", { name: /edit/i })).toHaveAttribute("href", "/events/suggest?edit=a");
});
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement** `lib/events/local-time.ts`:

```ts
/** "YYYY-MM-DDTHH:mm" from a datetime-local input, in the browser's zone → ISO UTC; "" when unusable. */
export function localInputToIso(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

/** The short zone name the form shows beside its time fields, e.g. "GMT+1". */
export function zoneLabel(date: Date, locale: string): string {
  const part = new Intl.DateTimeFormat(locale, { timeZoneName: "short" }).formatToParts(date).find((p) => p.type === "timeZoneName");
  return part?.value ?? "UTC";
}
```

`YourSuggestions` (client): list with title (link to `/events/<slug>` when approved and slugged), date (`Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })`), a status pill (`events.suggest.status.{pending|approved|revision|rejected}` = Waiting / Approved / Needs changes / Not accepted), the note under revision/rejected, and **Edit** (`/events/suggest?edit=<id>`) for pending and revision. Uses `Link` from `@/i18n/navigation`, the hub's `Badge` tones, `ccm-*` tokens.

`SuggestForm` (client) — start from `event-submit-form.tsx`, restructured into the human-friendly form pattern used by `components/forms/lived-experience-form.tsx` (`use-form-errors`, `FieldError`, `WhatsLeft`, `readFormError`, `localeHeaders`):
1. **What** — title, short description.
2. **When** — start, optional end (datetime-local), with `zoneLabel` shown: "Times in your time zone (GMT+1)".
3. **Where** — Online / In person / Hybrid as three large choice cards; for in person/hybrid the existing `PlacePicker` (value → `place`) plus optional community picker (existing `regionalCommunityId` select — reuse whatever the case-study form uses to list communities).
4. **Who runs it** — two choice cards: "CCM (a project or community)" / "Another organisation"; external reveals "Organiser's name" and "Event website" (required, inline hint "Visitors go there to sign up").
5. Submit bar: "Send for review"; below it "The team checks every suggestion — usually within a few days."
Success → replace the form with a thank-you panel ("Thanks — the team will check it. You'll see the outcome below and by email.") and refresh the page so Your suggestions shows it. `scope` stays `community` (hidden) — "Who runs it" replaces it for members.

Page `app/[locale]/(main)/events/suggest/page.tsx` (server, `dynamic = "force-dynamic"`): not signed in → a card "Sign in to suggest an event" with the Clerk sign-in link (`/sign-in?redirect_url=/<locale>/events/suggest`); settings closed → "Suggestions are paused" panel (no form); blocked → "You can't suggest events at the moment"; pending ≥ 5 → form hidden with the too-many message; otherwise the form. **Your suggestions** always shows for signed-in members with any. `?edit=` loads via `loadEditableEvent` as before. Header: `BackLink` to `/events`, H1 "Suggest an event", intro "Share a workshop, talk, gathering or online session — by CCM or another organisation."

Redirect `collaborate/events/new/page.tsx` to `/events/suggest` keeping `workspace`/`edit` params (use `redirect` from `@/i18n/navigation` with a query string). Update `workspace-outputs.tsx` (`event: "/events/suggest"`) and `lib/collaboration/outputs.ts` (`route: "/events"`).

Messages `events.suggest.*` in all four languages (title, intro, sections, choice labels, hints, thank-you, status labels, sign-in, paused, blocked, tooMany, yourSuggestions heading, edit). Write es/fr/ar translations in full — no English copies.

- [ ] **Step 4: Run** tests → PASS; `tsc`; eslint on changed files.
- [ ] **Step 5: Rendered check** (dev, Playwright): `/en/events/suggest` and `/ar/events/suggest` at 375 and 1280. Signed-out: the sign-in card. Signed-in (the automation browser has a staff session): fill a suggestion with "Another organisation" and no website → the inline error under Event website; add it → thank-you panel and the item in Your suggestions as "Waiting". No sideways scroll; Arabic right-to-left; 0 console errors. Delete the test event in the admin afterwards.
- [ ] **Step 6: Commit** — `feat(events): suggest an event, and see what happened to it`.

---

### Task 4: Outcome emails and stopping a person

**Files:**
- Modify: `lib/case-study-emails.ts` (notifier gains `kind`), `payload/hooks/moderation.ts` (pass the collection's kind), `payload/moderation/workflows.ts` (`events.notifies = true`), `lib/moderation/review-items.ts` (`submitterId` on items), `components/moderation/review-list.tsx`, `messages/*.json` (`moderation.stopSuggesting`, `allowSuggesting`, confirmations)
- Create: `lib/actions/event-suggestions.ts`, `lib/events/blocked-list.ts`
- Test: `lib/__tests__/moderation-emails-kind.test.ts`, `lib/__tests__/blocked-list.test.ts`, existing `lib/__tests__/moderation*.test.ts` (update the `notifies` assertion for events)

**Interfaces:**
- Consumes: Task 1 `notifiedStatus`, `eventSuggestions.blocked`.
- Produces: `notifySubmissionStatusChange(input: NotifyInput & { kind: "caseStudy" | "event" }, deps?)` (the old name stays as `notifyCaseStudyStatusChange = (i, d) => notifySubmissionStatusChange({ ...i, kind: "caseStudy" }, d)`); `withBlocked(list, userId, note?)` / `withoutBlocked(list, userId)` pure; server actions `stopEventSuggestions(userId: string)` / `allowEventSuggestions(userId: string)` → `{ ok: boolean; error?: string }` (staff only).

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/moderation-emails-kind.test.ts
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn().mockResolvedValue({ email: "m@example.org" }) } } }));
import { notifySubmissionStatusChange } from "@/lib/case-study-emails";

it("tells an event's sender it was approved, and links to their suggestions", async () => {
  const sendEmail = vi.fn().mockResolvedValue({ ok: true });
  const markNotified = vi.fn().mockResolvedValue(undefined);
  const out = await notifySubmissionStatusChange(
    { kind: "event", caseStudyId: "ev1", status: "approved", submittedBy: "u1", title: "Reef day", siteUrl: "https://hub.example" },
    { sendEmail, markNotified },
  );
  expect(out).toMatch(/^sent: approved/);
  const msg = sendEmail.mock.calls[0][0];
  expect(msg.subject).toBe('Your event "Reef day" is on the hub');
  expect(msg.text).toContain("https://hub.example/en/events/suggest");
  expect(markNotified).toHaveBeenCalledWith("ev1", "approved");
});
it("passes the reviewer's note on when changes are asked for", async () => {
  const sendEmail = vi.fn().mockResolvedValue({ ok: true });
  await notifySubmissionStatusChange(
    { kind: "event", caseStudyId: "ev1", status: "revision", submittedBy: "u1", title: "Reef day", reviewNotes: "Add the venue.", siteUrl: "https://hub.example" },
    { sendEmail, markNotified: vi.fn() },
  );
  expect(sendEmail.mock.calls[0][0].text).toContain("Add the venue.");
});
```

```ts
// lib/__tests__/blocked-list.test.ts
import { expect, it } from "vitest";
import { withBlocked, withoutBlocked } from "@/lib/events/blocked-list";
it("adds a person once and removes them", () => {
  const one = withBlocked([], "u1", "spam");
  expect(withBlocked(one, "u1")).toEqual([{ userId: "u1", note: "spam" }]);
  expect(withoutBlocked(one, "u1")).toEqual([]);
});
```

Update the workflow test that asserts only case studies notify: events now notify too (livedExperiences/researchOutputs still don't).

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement.** In `lib/case-study-emails.ts`: add `kind` to the input; `buildStatusEmail` picks copy by kind — event copy (en; the email module is English-only today, like case studies):
  - approved: subject `Your event "${title}" is on the hub`, heading "Your event is live", body `Good news — "${title}" has been approved and now appears on the hub's events.`
  - revision: subject `Your event "${title}" needs a few changes`, body `The team asked for some changes to "${title}" before it can go on the hub.`
  - rejected: subject `Update on your event "${title}"`, body `Thank you for suggesting "${title}". After review, it won't be listed on the hub.`
  - link: `${siteUrl}/${locale}/events/suggest` (case studies keep `/dashboard/submissions`); `sendEmail` kind `"event-status"` (add it to `lib/email/send.ts`'s kind union if it is one).
  In `payload/hooks/moderation.ts` the default `notify` calls `notifySubmissionStatusChange({ ...input, kind: collection === "events" ? "event" : "caseStudy" }, notifyDeps)`. Set `events.notifies: true` and fix the `notifies` doc comment.
  `lib/events/blocked-list.ts`: pure add/remove on `Array<{ userId: string; note?: string }>`. `lib/actions/event-suggestions.ts` (`"use server"`): `isStaff(await getActor())` else `{ ok: false, error: "Only the team can do this." }`; read the global (`getPayload`, `findGlobal`, `overrideAccess: true`), write `updateGlobal` with the new list, `revalidatePath("/[locale]/moderation", "page")`.
  Review queue: `toSubmissionItem` adds `submitterId: text(doc.submittedBy)` for events; the moderation page passes `blockedIds` (from `getEventSuggestionSettings`); `ReviewList` shows, on event items with a submitter, a quiet text button **Stop this person suggesting events** (confirm dialog in the list's existing pattern: "They won't be able to suggest events until you allow them again.") or **Allow again** when already blocked.
- [ ] **Step 4: Run** all moderation tests + new ones → PASS.
- [ ] **Step 5: Rendered check:** `/en/moderation` with a pending test event (created in Task 3's check or via the admin): the stop button shows; clicking it then reloading shows **Allow again**; the global lists the person. Approve the event: the dev log shows `email: sent: approved -> …` or `failed:` (Resend sandbox) — either proves the attempt; `notifiedStatus` = approved on the record. Clean up.
- [ ] **Step 6: Commit** — `feat(events): senders hear the outcome; the team can stop one person suggesting`.

---

### Task 5: `/events`

**Files:**
- Create: `lib/events/listing.ts`, `app/[locale]/(main)/events/page.tsx`, `components/events/event-list.tsx` (client), `components/events/event-tile.tsx`
- Modify: `lib/content/discovery.ts` + `internal/payload/discovery.ts` (list projection gains `origin`, `organiser`, `relatedCommunity`, `place`, `tags`, `recordingUrl`, `coverImage`; a `getAllApprovedEvents()` reading `pagination: false`), `lib/filters/adapters.ts` (`eventToFilterable`), `components/filters/filter-bar.tsx` (`extras`), `lib/filters/params.ts` (keep unknown params? — no: extras are appended by the bar itself), `messages/*.json` (`events.*`, `filters.whenOptions.upcoming/past` if missing, `filters.mode`, `filters.origin`)
- Test: `lib/__tests__/event-listing.test.ts`, `lib/__tests__/filters-adapters.test.ts` (add), `components/filters/__tests__/filter-bar.test.tsx` (add or create)

**Interfaces:**
- Consumes: Task 1 fields; engine `applyFilters`/`buildOptions` (`lib/filters/core.ts`), `parseFilterParams` (`lib/filters/params.ts`).
- Produces:
  - `type EventTileData = { id: string; title: string; startAt: string; endAt: string | null; mode: "online" | "in_person" | "hybrid"; place: string | null; href: string; external: boolean; organiser: string | null; recordingUrl: string | null; image: string | null }`
  - `toEventTile(event: ContentEvent, locale: string): EventTileData | null` (null when no start date)
  - `isUpcoming(e: { startAt: string; endAt: string | null }, now: Date): boolean` — true while `endAt ?? startAt` ≥ now
  - `groupByMonth<T extends { startAt: string }>(items: T[], locale: string, timeZone: string): Array<{ key: string; label: string; items: T[] }>`
  - `eventToFilterable(e: ContentEvent, locale: string): FilterableItem` — `date` = `endAt ?? startAt` (so "upcoming" in the engine means not yet over)
  - `FilterBar` prop `extras?: Array<{ param: string; label: string; options: FilterOption[]; value: string | null }>`

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/event-listing.test.ts
import { describe, expect, it } from "vitest";
import { groupByMonth, isUpcoming, toEventTile } from "@/lib/events/listing";

const ev = (o: Record<string, unknown> = {}) => ({
  _id: "e1", title: "Reef day", description: null, scope: "community", startAt: "2026-11-02T10:00:00.000Z", endAt: null,
  mode: "in_person", locationName: "Suva", url: null, linkedProject: null, slug: "reef-day", origin: "ccm", organiserName: null, organiser: null, ...o,
}) as never;

describe("an event card", () => {
  it("opens the hub page for CCM events", () => {
    expect(toEventTile(ev(), "en")).toMatchObject({ href: "/events/reef-day", external: false, place: "Suva" });
  });
  it("opens the organiser's site for outside events, naming the organiser", () => {
    expect(toEventTile(ev({ origin: "external", url: "https://reef.example", organiserName: "Reef Trust" }), "en")).toMatchObject({
      href: "https://reef.example", external: true, organiser: "Reef Trust",
    });
  });
  it("prefers the hub organisation's name over the typed one", () => {
    expect(toEventTile(ev({ origin: "external", url: "https://r.example", organiser: { name: "Pacific Climate Network" }, organiserName: "PCN" }), "en")?.organiser).toBe("Pacific Climate Network");
  });
  it("falls back to the hub page when an outside event has no website", () => {
    expect(toEventTile(ev({ origin: "external", url: null }), "en")).toMatchObject({ href: "/events/reef-day", external: false });
  });
  it("says Online instead of a place for online events, and skips undated ones", () => {
    expect(toEventTile(ev({ mode: "online" }), "en")?.place).toBeNull();
    expect(toEventTile(ev({ startAt: null }), "en")).toBeNull();
  });
});

describe("upcoming", () => {
  const now = new Date("2026-11-02T12:00:00.000Z");
  it("includes an event that started but hasn't ended", () => {
    expect(isUpcoming({ startAt: "2026-11-02T10:00:00.000Z", endAt: "2026-11-02T16:00:00.000Z" }, now)).toBe(true);
  });
  it("excludes one that is over", () => {
    expect(isUpcoming({ startAt: "2026-11-02T10:00:00.000Z", endAt: null }, now)).toBe(false);
  });
});

describe("months", () => {
  it("group by the visitor's time zone", () => {
    const groups = groupByMonth([{ startAt: "2026-02-01T00:30:00.000Z" }, { startAt: "2026-02-10T12:00:00.000Z" }], "en", "America/New_York");
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([["January 2026", 1], ["February 2026", 1]]);
  });
});
```

Add to `filters-adapters.test.ts`:

```ts
it("an event is filtered by its community's region and its tags, and stays 'upcoming' until it ends", () => {
  const item = eventToFilterable({ _id: "e1", title: "Reef day", startAt: "2026-11-02T10:00:00.000Z", endAt: "2026-11-02T16:00:00.000Z", relatedCommunity: { slug: "oceania" }, tags: [{ value: "youth", category: "audience", label: { en: "Youth" } }] } as never, "en");
  expect(item.regions).toEqual(["oce"]);
  expect(item.date).toBe("2026-11-02T16:00:00.000Z");
  expect(item.tags[0].slug).toBe("youth");
});
```

(Use the region code `slugToShortCode("oceania")` actually returns — check `lib/maps/region-codes.ts` before fixing the literal.)

Filter bar test: rendering with `extras=[{ param: "mode", label: "Where", options: [{ value: "online", label: "Online", count: 2 }], value: null }]` and clicking a Themes chip pushes a URL that keeps `mode` when set, and clicking Online pushes `?mode=online` (mock `next/navigation` as the existing filter-bar test does, or create the test with that mock).

- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `lib/events/listing.ts` (pure; `groupByMonth` uses `Intl.DateTimeFormat(locale, { timeZone, year: "numeric", month: "long" })` for label and a `timeZone`-aware `YYYY-MM` key via `formatToParts`), the adapter, and the bar's `extras` (rendered as extra `FilterRow`s after Themes, single-choice chips; `go()` appends `param=value` for each extra with a value; the clear button also drops extras). Reader: extend `eventListProjection` with `origin`, `organiserName`, `organiser: { name } | null` (depth 1), `relatedCommunity: { slug } | null`, `place`, `tags` (value/label/category, as the case-study list does), `recordingUrl`, `coverImage`; add `getAllApprovedEvents()` (sort `startAt`, `pagination: false`) — keep the existing `getEvents({limit})` for its other callers.
- [ ] **Step 4: Page.** `app/[locale]/(main)/events/page.tsx` (server): read all approved events, map with `eventToFilterable`, `parseFilterParams(sp, {...})` + `mode`/`origin` params; filter; options with `buildOptions`; mode/origin counts computed on the list filtered by everything else. Pass tiles to `<EventList upcoming past locale />` (client): it groups upcoming by month in `Intl.DateTimeFormat().resolvedOptions().timeZone`, shows past (newest first, 12, "Show more") under "Past events" with **Watch the recording** when set. Header: H1 "Events", subtitle "Workshops, talks and gatherings from across the network — and beyond.", **Suggest an event** button (always visible; the suggest page handles sign-in). Tile (`event-tile.tsx`): date block (day number + short month, in the visitor's zone, client-side), title, "Online" or place, time, badge **CCM** or **External · Organised by X**; external → `<a target="_blank" rel="noopener">` with ↗ (mirrored in RTL with `rtl:-scale-x-100`); FilterBar `whenOptions={["upcoming","past"]}`; empty → the shared empty message plus "Suggest an event". Metadata title/description from `events.*`.
- [ ] **Step 5: Run** tests → PASS; `tsc`; eslint changed files.
- [ ] **Step 6: Rendered check** with two dev events created in the admin (one CCM in person in Oceania tagged Youth, one external online with a website, one past with a recording): `/en/events` and `/ar/events` at 375 and 1280 — month header, both badges, the external tile opens a new tab to the website, filters (Region, Communities, Where, Who runs it) narrow and their counts equal results, past section shows Watch the recording; no sideways scroll; 0 console errors.
- [ ] **Step 7: Commit** — `feat(events): one events page — CCM and outside events, by month, in your time zone`.

---

### Task 6: Event pages move to `/events/[slug]`, free of the engagement switch

**Files:**
- Move: `app/[locale]/(main)/collaborate/events/[slug]/page.tsx` → `app/[locale]/(main)/events/[slug]/page.tsx`
- Delete: `app/[locale]/(main)/collaborate/events/page.tsx`, `…/collaborate/events/[slug]/page.tsx`, `…/collaborate/events/new/page.tsx` (redirects replace them)
- Modify: `next.config.mjs` (redirects), `components/events/event-card.tsx`, `components/blocks/events/events-calendar-client.tsx`, `lib/content/system.ts` + `lib/content/internal/payload/system.ts` (sitemap prefix `/events`), `lib/content/feeds/types.ts` (`KIND_LISTING.events = "/events"`), `lib/content/internal/payload/feeds.ts` (`href: (s) => \`/events/${s}\``), `app/[locale]/(main)/collaborate/page.tsx` (link), any test fixtures asserting the old paths (`lib/__tests__/content-feed-resolve.test.ts`, `lib/__tests__/issue-report.test.ts`)
- Test: `lib/__tests__/events-redirects.test.ts`

**Interfaces:** Produces the public URL scheme `/events`, `/events/<slug>`, `/events/suggest`.

- [ ] **Step 1: Failing test**

```ts
// lib/__tests__/events-redirects.test.ts
import { expect, it } from "vitest";
import config from "@/next.config.mjs";

it("old event addresses go to their new homes, permanently", async () => {
  const rules = await config.redirects();
  const find = (s: string) => rules.find((r: { source: string }) => r.source === s);
  expect(find("/:locale(en|es|fr|ar)/collaborate/events")).toMatchObject({ destination: "/:locale/events", permanent: true });
  expect(find("/:locale(en|es|fr|ar)/collaborate/events/new")).toMatchObject({ destination: "/:locale/events/suggest", permanent: true });
  expect(find("/:locale(en|es|fr|ar)/collaborate/events/:slug")).toMatchObject({ destination: "/:locale/events/:slug", permanent: true });
});
```

(If importing `next.config.mjs` in vitest pulls plugins that fail, extract the redirect list to `lib/redirects/events.mjs`, import it in both, and test that — ledger it.)

- [ ] **Step 2: Run** → FAIL. **Step 3:** add the three rules (the `new` rule before the `:slug` rule; query strings pass through), move the page, delete the old ones, update the listed links. In the moved page: remove the `FEATURES.engagement` redirect; show RSVP/share only when `FEATURES.engagement`; for `origin: "external"` show "Organised by X" and a primary **Go to the event's website ↗** button instead of RSVP; `BackLink` → `/events`. Keep the ICS route as is.
- [ ] **Step 4: Run** the new test and the fixtures' suites → PASS; `rg "collaborate/events" app components lib` returns only the redirect-rule file/comments.
- [ ] **Step 5: Rendered check:** `/en/collaborate/events` → 308 → `/en/events`; `/en/collaborate/events/<slug>` → `/en/events/<slug>`; the event page renders with engagement off (unset `NEXT_PUBLIC_FEATURE_ENGAGEMENT` in the dev shell's env is the default for prod — confirm `.env.local`'s value and note which was tested) with no RSVP; external event page shows the website button. 0 console errors.
- [ ] **Step 6: Commit** — `feat(events): event pages live at /events and no longer need the engagement switch`.

---

### Task 7: Community Events chapter and homepage "Coming up"

**Files:**
- Modify: `lib/content/chapters.ts` (`events` kind, anchor `events`, message `events`), `messages/*.json` (`regional.sectionTitles.events`, `home.comingUp`, `events.allEvents`, `events.suggestShort`), `lib/content/internal/payload/feeds.ts` (soonest-first read for upcoming events; external href), the Content feed renderer (find with `rg "contentFeed" components/blocks -l`) for the two footer links on single-kind events feeds
- Create: `scripts/events/plan.ts`, `scripts/events/add-sections.ts`
- Test: `lib/__tests__/chapters.test.ts` (add), `lib/__tests__/content-feed-events.test.ts`, `scripts/events/__tests__/plan.test.ts`

**Interfaces:**
- Consumes: Task 1 chapter option; Task 6 `/events` paths.
- Produces: `planEventSections(sections: Row[], target: "community" | "homepage"): { sections: Row[]; changed: boolean; reason?: string }` — community: appends `{ blockType: "contentFeed", heading: {en:"Events", es:"Eventos", fr:"Événements", ar:"الفعاليات"}, kinds: ["events"], fill: "automatic", sort: "upcomingSoonest", filters: { upcomingOnly: true }, count: 6, layout: "grid", viewAll: { show: true }, chapter: { kind: "events" } }`; homepage: inserts after the first section `{ blockType: "contentFeed", heading: {en:"Coming up", es:"Próximamente", fr:"À venir", ar:"قريبًا"}, kinds: ["events"], fill: "automatic", sort: "upcomingSoonest", filters: { upcomingOnly: true }, count: 3, layout: "grid", viewAll: { show: true } }`; `changed: false, reason: "already has an events feed"` when any `contentFeed` with `kinds` including `events` exists (unless `replace`). Check the real `contentFeed` block field names (`filters` group vs top-level `upcomingOnly`) in `payload/blocks/content-feed.ts` before fixing the literals.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/content-feed-events.test.ts — mock the payload-source `query` as feeds tests do
it("an upcoming events feed asks the database for the soonest first", async () => {
  await fetchFeedCards(["events"], { ...NO_FILTERS, upcomingOnly: true }, { locale: "en", now: new Date("2026-11-01T00:00:00Z") }, 3);
  expect(query).toHaveBeenCalledWith(expect.objectContaining({ collection: "events", sort: ["startAt", "id"], limit: 3 }));
});
it("an outside event's card opens its website", async () => {
  query.mockResolvedValue({ docs: [{ id: "e1", slug: "reef", title: { en: "Reef" }, startAt: "2026-11-02T10:00:00Z", origin: "external", url: "https://reef.example" }] });
  const [card] = await fetchFeedCards(["events"], NO_FILTERS, { locale: "en" }, 3);
  expect(card.card.href).toBe("https://reef.example");
});
```

```ts
// chapters.test.ts
it("names the Events chapter and anchors it at #events", () => {
  const [c] = groupIntoChapters([{ chapter: { kind: "events" } }], (k) => k);
  expect(c).toMatchObject({ id: "events", kind: "events", label: "events" });
});
```

```ts
// scripts/events/__tests__/plan.test.ts
import { planEventSections } from "../plan";
it("appends the Events chapter to a community page once", () => {
  const first = planEventSections([{ blockType: "communityHeader" }], "community");
  expect(first.changed).toBe(true);
  expect(first.sections.at(-1)).toMatchObject({ kinds: ["events"], chapter: { kind: "events" }, count: 6 });
  expect(planEventSections(first.sections, "community")).toMatchObject({ changed: false, reason: "already has an events feed" });
});
it("puts Coming up second on the homepage", () => {
  const out = planEventSections([{ blockType: "hero" }, { blockType: "contentFeed", kinds: ["newsPosts"] }], "homepage");
  expect(out.sections[1]).toMatchObject({ kinds: ["events"], count: 3, heading: { en: "Coming up" } });
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** In `feeds.ts` `find()`: when `kind === "events" && filters.upcomingOnly`, sort `["startAt", "id"]` (ascending) — pass a `sortAsc` flag from `fetchFeedCards`; `toCard`: `href = kind === "events" && row.origin === "external" && safeUrl(row.url) ? row.url : config.href(slug)` (reuse the agenda's http(s) check), and mark the card external so the renderer opens a new tab (add `external?: boolean` to `TypedCardItem` if the card component supports `target`; otherwise add it there with a test). Chapter: add `events` to `CHAPTER_KINDS`, `CHAPTER_MESSAGE.events = "events"`, `ANCHOR.events = "events"`. Feed renderer: a single-kind `events` feed shows **All events →** (`/events`) and **Suggest an event** (`/events/suggest`). Script `add-sections.ts` — copy the shape of `scripts/communities/move-to-sections.ts`: flags `--execute`, `--revert` (removes the events feeds this script adds: `contentFeed` with `kinds == ["events"]`), `--only=<slug>`, `--replace`, `--production`; `--homepage` / `--communities` (default both); English first then es/fr/ar onto the same rows with `toLocaleData` / `withIdsFrom`; prints a table per page; ends with the cache-clear hint.
- [ ] **Step 4: Run** tests → PASS. **Step 5:** dev dry run, then `--execute` on dev; `--revert` then `--execute` again to prove both.
- [ ] **Step 6: Rendered check:** `/en/communities/oceania` and `/ar/communities/oceania` at 375/1280 — Events in the page menu, the chapter lists the upcoming dev event, links work; a community with none upcoming has no Events chapter (empty-feed rule); homepage `/en` shows "Coming up" second with 3 soonest. 0 console errors.
- [ ] **Step 7: Commits** — `feat(events): an Events chapter for communities and Coming up on the homepage`, `feat(scripts): put the events sections on the pages`.

---

### Task 8: Events on the atlas

**Files:**
- Modify: `lib/maps/region-facets.ts` (`eventCount` facet, default layers, destination, colour), `lib/maps/cluster-pins.ts` (`FacetContentType` gains `"event"`, `layerColorKeyFor`), `lib/ccm-colors.ts` (an `event` layer colour from the existing palette — reuse the events accent used by event cards), `lib/content/internal/payload/regions.ts` (`SHAPES.event`, upcoming-only), `app/api/maps/region-items/route.ts` (`FACET_TO_TYPE`, `ALL_TYPES`), `app/api/maps/region-data/route.ts` and `region-pins/route.ts` (whatever lists facets/types), `messages/*.json` (`map.facetEvents`)
- Test: `lib/maps/__tests__/region-facets.test.ts` (add), `lib/__tests__/atlas-events.test.ts`

**Interfaces:**
- Consumes: Task 1 fields; `rows()` in `regions.ts`.
- Produces: `FacetId` `"eventCount"`; `SHAPES.event = { collection: "events", moderation: "approved", region: null, relatedCommunity: true, relatedCommunities: false, countryField: "place.countryCode", image: "coverImage", cardPlace: "place", pinPlace: "place", dates: ["startAt"], geo: ["place.point", "place.countryCode"], upcomingOnly: true }` (extend `TypeShape.dates` to allow `"startAt"` and add optional `upcomingOnly`).

**Ruling to ledger at start:** the atlas's When filter has past-year / past-3-years / earlier, not upcoming. The Events layer shows upcoming events only (not-yet-ended); "earlier" therefore shows none. Cost if wrong: past events would need their own When option on the atlas.

- [ ] **Step 1: Failing tests**

```ts
// lib/__tests__/atlas-events.test.ts — mock payload-source `query` like atlas-theme-options.test.ts
it("counts only upcoming approved events, by the pins' own rules", async () => {
  query.mockResolvedValue({ docs: [] });
  await getRegionFacetCounts("event", { theme: null, q: "", when: NO_WHEN });
  const call = query.mock.calls[0][0];
  expect(call.collection).toBe("events");
  expect(JSON.stringify(call.where)).toContain('"moderationStatus":{"equals":"approved"}');
  expect(JSON.stringify(call.where)).toMatch(/"(endAt|startAt)"/);
});
it("pins an in-person event at its point and skips region-only and online ones", async () => {
  query.mockResolvedValue({ docs: [
    { id: "a", title: { en: "A" }, slug: "a", mode: "in_person", place: { point: [178.4, -18.1], precision: "exact", countryCode: "FJI" }, startAt: "2099-01-01T00:00:00Z" },
    { id: "b", title: { en: "B" }, slug: "b", mode: "in_person", place: { precision: "region" }, startAt: "2099-01-01T00:00:00Z" },
    { id: "c", title: { en: "C" }, slug: "c", mode: "online", startAt: "2099-01-01T00:00:00Z" },
  ] });
  const pins = await getRegionPinRows("event", { region: "all", slug: "", regionCountries: [], themeSlug: null, q: "", when: NO_WHEN });
  expect(pins.filter((p) => p.point).map((p) => p._id)).toEqual(["a"]);
});
```

```ts
// region-facets.test.ts
it("has an Events layer, on by default, linking to the events page for that region", () => {
  expect(FACETS.map((f) => f.id)).toContain("eventCount");
  expect(DEFAULT_LAYERS).toContain("eventCount");
  expect(atlasDestination("eventCount", "oceania")).toBe("/events?region=oce");
});
```

(Use the region-code helper for the query value; `atlasDestination` receives a community slug — convert with `slugToShortCode`.)

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** `SHAPES.event` as above; in `rows()` when `shape.upcomingOnly`, add `{ or: [{ endAt: { greater_than_equal: now } }, { and: [{ endAt: { exists: false } }, { startAt: { greater_than_equal: now } }] }] }` to the `Where`; pins: region-precision places produce no point (check how `geoPoint`/precision is already handled for lived experiences and reuse; online events have no `place` so no pin, but stay in `region-items` via `relatedCommunity`). Facet wiring in the facets module, the three routes and the explorer's legend (label `map.facetEvents`: Events / Eventos / Événements / الفعاليات).
- [ ] **Step 4: Run** tests + the full maps suites → PASS; `tsc`.
- [ ] **Step 5: DB consistency (dev):** for each region, `region-data` eventCount equals `region-items?facet=eventCount` length (the script used in the filters work). **Rendered check:** `/en/atlas` and `/ar/communities/oceania` at 375/1280 — the Events chip, the Fiji pin, count equals pins+list; 0 console errors.
- [ ] **Step 6: Commit** — `feat(atlas): an Events layer — upcoming events where they happen`.

---

### Task 9: Runbook and wrap-up

**Files:** Modify `docs/migration/payload-production-runbook.md`.

- [ ] **Step 1:** Section "2026-09-30 events across the hub": what shipped (by visitor/member/editor); **one migration** `<name>` (additive; list what it adds); after the push: `/admin` loads; **Settings → Event suggestions** exists and is on; the user runs `scripts/with-prod-env.sh pnpm exec tsx scripts/events/add-sections.ts --production` (dry run) then `--execute`, then clears the site cache; checklist (`/en/events`, an old `/collaborate/events` link redirects, `/en/events/suggest` signed in, a community's Events chapter, homepage Coming up, atlas Events chip); the email caveat (Resend domain unverified → only the in-hub list is reliable).
- [ ] **Step 2:** Full suite, `tsc`, eslint on every changed file; `curl /admin` 200.
- [ ] **Step 3: Commit** — `docs(runbook): events across the hub`.
