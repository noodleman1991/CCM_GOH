# Events across the hub — design

**Programme:** follows the page-builder projects 1–4 and "editing that feels natural". Content forms (project 5) stays queued.

**Date:** 2026-09-29 · **Status:** approved in conversation (parts 1 and 2), awaiting written-spec review

## 1. What and why

Events exist today but are hard to find and narrow in scope:

- The `events` collection has approval (`moderationStatus`), online / in person / hybrid, a place (point + precision), a joining link, a recording link (recap mode) and a regional community link. A member form at `/collaborate/events/new` accepts any signed-in user; event pages carry RSVPs.
- **Every event page sits behind `FEATURES.engagement`, which is not set on production** — live visitors see no event pages, only the events-calendar section and content feeds.
- There is no way to list an event run by another organisation, no control over who may suggest events, and no events on the atlas or community page menus.

**Goal (user, 2026-09-29):** events in regional communities and across the hub, including relevant events not run by CCM (listed and linked out), with members able to suggest events that editors approve.

**Success:** a visitor on production finds upcoming events on `/events`, on their community's page, on the atlas and on the homepage; an outside event opens its organiser's site; a member suggests an event in under two minutes and learns the outcome; editors can switch suggestions off or stop one person.

**Assumptions (stated):** times show in the visitor's own time zone; RSVPs stay behind the engagement switch; approval uses the existing "Waiting for review" queue.

## 2. Decisions (user-confirmed 2026-09-29)

| # | Decision |
|---|---|
| E1 | Any signed-in member can suggest an event; editors approve each one (no host application). |
| E2 | Editors keep control: a site-wide on/off switch, a per-person block, and a cap on pending suggestions. |
| E3 | Outside events are listed and linked out: "External · Organised by X", the organiser's link, no RSVP on the hub. |
| E4 | Events appear on a hub-wide `/events` page, as an Events chapter on each community page, as an atlas layer, and as a homepage "Coming up" section. |
| E5 | Event pages no longer depend on the engagement switch; RSVP still does. |

## 3. Design

### Part 1 — the event and how it gets in

**3.1 The record.** Additions to `events`:
- `origin` — select, label "Who runs it": **CCM (a project or community)** (`ccm`, default) / **Another organisation** (`external`).
- `organiser` — relationship to `organizations` (optional), label "Organised by (on the hub)"; `organiserName` — text, "Organised by (name)", used when the organisation isn't on the hub.
- `url` (existing) relabelled **Event website**; required when `origin = external` (field validation).
Everything else is reused. One additive migration.

**3.2 Suggesting an event.** `/events/suggest` (not behind the engagement switch; signed-in only, else sign-in prompt), built from the existing `/collaborate/events/new` form, in en/es/fr/ar, RTL for Arabic, following the hub's human-friendly form system. Asks: title, start (and optional end) date and time, online / in person / hybrid, place (for in person/hybrid), who runs it + organiser + website, region/community, short description, optional picture. Saved with `moderationStatus: pending`; the member sees "Thanks — the team will check it" and a **Your suggestions** list (title, date, status: waiting / approved / needs changes / not accepted, with the reviewer's note). `/collaborate/events/new` redirects to `/events/suggest`.

**3.3 Editor controls.**
- A Payload global **Event suggestions** (group Settings) with `open` (checkbox, default on). Off → the form shows "Suggestions are paused" and the submit endpoint refuses.
- Prisma `User.eventSuggestionsBlocked` (boolean, default false). The review queue's event items get **Stop this person suggesting events** / **Allow again** (staff-only server action). A blocked member sees "You can't suggest events at the moment" and the endpoint refuses.
- At most **5** pending suggestions per member; the sixth is refused with a friendly message.
All three checks run on the server in the submit action.

**3.4 The outcome.** The events moderation workflow gains `notifies: true` (as case studies have): approve / ask for changes / not accepted emails the sender with the reviewer's note, through the existing email path. The same outcome shows in **Your suggestions**. Known constraint: the Resend domain is unverified, so emails reach only one address until the user verifies it — the in-hub list is the reliable channel meanwhile.

### Part 2 — where events show up

**3.5 `/events`** (public). Upcoming events grouped by month (visitor's time zone), each card: date block, title, "Online" or city, badge **CCM** or **External · Organised by X**. Filters: region · online/in person · CCM/external · theme — built from CMS taxonomy with a fallback, never hard-coded vocabularies. Past events below, with **Watch the recording** where `recordingUrl` exists. **Suggest an event** button. CCM cards open `/events/[slug]` (the existing page, moved; RSVP shown only with the engagement switch on); external cards open the organiser's website in a new tab (↗, `rel="noopener"`). `/collaborate/events` and `/collaborate/events/[slug]` redirect permanently to `/events` and `/events/[slug]`. Only approved events are listed.

**3.6 Community Events chapter.** `CHAPTER_KINDS` gains `events` (label from `regional.sectionTitles.events` in four languages). The section is a Content feed: kind `events`, upcoming only, soonest first, community context, 6 cards, with **Suggest an event** and **All events** links. The existing empty-feed rule hides the chapter when nothing is upcoming.

**3.7 Atlas layer.** A new **Events** facet: in-person and hybrid events become pins (exact point, or city/country per `place.precision`; `region` precision → no pin), online events appear in the results list only. The existing When filter applies (upcoming / past). Counts follow the same filters as the pins, so the facet number and the pins always agree.

**3.8 Homepage "Coming up".** A Content feed section: kind `events`, upcoming only, soonest first, 3 cards, heading "Coming up" (4 languages), **All events →**.

**3.9 Putting them on the pages.** `scripts/events/add-sections.ts` (dry run by default, `--execute`, `--revert`, `--only=<community slug>`, `--production` for the user): appends the Events chapter to each community's Sections and inserts "Coming up" on the homepage after the first section, writing English first and each language onto the same rows (the established pattern). Refuses a page that already has an events feed unless `--replace`.

## 4. Build order (slice by slice, each rendered-checked before the next)

1. Record additions + migration + editor controls (global, Prisma flag, cap) + `/events/suggest` + Your suggestions + notifications.
2. `/events` page + `/events/[slug]` move + redirects + engagement decoupling.
3. Community Events chapter + homepage "Coming up" + the add-sections script.
4. Atlas Events layer.

## 5. Testing

Unit: origin/website validation; submit guards (switch off, blocked, cap, not signed in); card mapping (CCM vs external link target and badge); month grouping and time-zone formatting; filters built from taxonomy; chapter kind label; atlas pin rules by precision and online; add-sections planner (idempotent, `--revert`). Rendered (dev, Playwright, 375 and 1280, en and ar): `/events` with a CCM and an external event, filters, past with recording; a community page with its Events chapter; homepage Coming up; atlas Events pins and counts. Signed-in checks (suggest form, Your suggestions, review-queue block button) owed to the user where no session is available. Full suite, `tsc`, eslint on changed files; runbook section.

## 6. Out of scope

Importing events from partner calendars (iCal/Eventbrite); host applications; ticketing; recurring events; calendar-file downloads.

## 7. Risks

- **Emails** reach one address until the Resend domain is verified → in-hub status list.
- **Time zones:** stored as UTC instants; a submitter's local time is converted in the browser at submit — the form shows the time zone it used.
- **Spam** → sign-in required, cap of 5 pending, per-person block, site-wide switch, existing rate limiting and Turnstile on forms.
