# CCM Hub — States, Microcopy & Operational Data

Closes the last build gaps: every screen's **non-happy-path states**, the **real copy** (microcopy, empty states, errors, notifications), and the **operational data model** for the live features that don't live in Sanity (messaging, tasks, RSVP, follows, notifications, contact requests). Companion to `WIREFRAMES.md`, `SANITY_SCHEMA.md`, `TAXONOMY.md`, `FLOWS.md`.

---

## 1. Universal states

Every data-backed surface implements these four. The prototype shows the **loaded/full** state only.

| State | Pattern | Visual |
|---|---|---|
| **Loading** | skeleton, not spinner | grey blocks at the real layout's shape (card = image bar + 2 text lines; list row = avatar circle + 2 lines); shimmer via the existing `fade-up`-style pulse; never a centred spinner on content |
| **Empty** | illustration slot + headline + one action | uses the hub's static illustration placeholder, a Poppins headline, a slate sub-line, one primary button |
| **Error** | inline, recoverable | amber `#E0A53F` left-rule card, plain-language cause, a "Try again" button; never a raw error code |
| **Permission / gated** | explain + sign-in or request | muted card explaining why, with the action that unlocks it (Sign in / Request to join) |

Skeleton counts match the `hint-placeholder-count` already in the prototype (e.g. cases gallery = 6, people = 3, threads = 3).

---

## 2. Per-screen empty & gated states (real copy)

| Screen | Empty state | Gated state |
|---|---|---|
| **Home** | (never empty — curated) | — |
| **Case Studies / gallery** | **"No case studies match these filters."** · *Try removing a filter, or explore the full Atlas.* · [Clear filters] | — |
| **Atlas** | **"Nothing tagged here yet."** · *No {layer} in {region} so far — be the first to add one.* · [Submit a case study] | — |
| **News** | **"No updates in {region} yet."** · *Follow this region to hear when something's posted.* · [Follow region] | — |
| **Lived experiences** | **"No stories here yet."** · *Lived experience grounds the research. Share yours, or invite a community member.* · [Share a story] | — |
| **Collab → People** | **"No one matches yet."** · *Widen your filters, or post what you're looking for so collaborators find you.* · [Post an open call] | — |
| **Collab → Projects** | **"No projects in {region} yet."** · *Start one and invite the community.* · [Start a project] | — |
| **Collab → Events** | **"Nothing scheduled."** · *When your projects or community add events, they show here.* | — |
| **Region page** | section hidden if empty (don't show an empty "Case studies" rail) | member-only sections show a **"Join this community to take part"** strip to visitors |
| **Workspace (all tabs)** | Home: **"No tasks yet — add the first step of your plan."** · Docs: **"No files yet. Upload a draft or dataset to annotate together."** · Conversation: **"No messages yet. Say hello to your team."** | non-member: **"This is a private workspace."** + [Request to join] or [View public page] |
| **Messages** | **"No conversations yet."** · *Your project channels and direct messages appear here.* | — |
| **Notifications** | **"You're all caught up."** · *Requests, replies and approvals will land here.* | — |
| **Profile** | own, sparse: prompts show **"Add a prompt"** placeholders | viewer sees only sections the owner made public |
| **Dashboard** | **"Nothing in progress."** · *Join a project or start a draft to see it here.* · [Explore projects] | — |
| **Search** | **"No results for "{q}"."** · *Try a different term, or browse the Atlas.* (already in prototype) | — |
| **Content editor** | new doc: empty block canvas with **"Start writing, or add a block ↓"** | non-author: read-only |

---

## 3. Microcopy library

### 3.1 Buttons / primary actions
- Create an account · Enter the Collab space · Start a project · Request to join · Follow · Following · Connect · Message · Share a story · Submit for review · Save draft · Publish · Request changes · Approve & publish · RSVP · Add to calendar · Download · Try again · Clear filters

### 3.2 Confirmations (toasts, 3s, sea-green left rule)
- Draft saved · Submitted for review — a {region} editor will take a look · Published — it's live on the hub · Changes requested — the author has been notified · Request sent · You're following {region} · RSVP confirmed · Added to your calendar · Profile updated · Settings saved

### 3.3 Destructive / confirm dialogs
- **Delete this draft?** *This can't be undone.* [Cancel] [Delete draft]
- **Leave this project?** *You'll lose access to its workspace.* [Cancel] [Leave]
- **Withdraw your join request?** [Keep it] [Withdraw]

### 3.4 Errors (plain language)
- **Couldn't save.** *Check your connection and try again.* [Try again]
- **Upload failed.** *That file's too large (max 50 MB) or an unsupported type.*
- **That didn't send.** *Your message wasn't delivered — try again.*
- **You don't have access to this.** *Ask the project lead for an invite.*

### 3.5 Forms
- Required hint: *Required* · Optional fields labelled *(optional)*
- Email taken: *That email's already registered. Sign in instead?*
- Slug auto-note: *This becomes the page's web address.*

---

## 4. Notifications (every type, real strings)

Grouped **Requests · Today · Earlier** (as built). Action types carry Accept/Decline; the rest are informational. `{x}` = interpolated.

| Trigger | Group | String | Action |
|---|---|---|---|
| Join request to a project you lead | Requests | **{name}** asked to join **{project}** | Accept / Decline |
| Collaboration offer on your open call | Requests | **{name}** offered to help with **{call}** | Accept / Decline |
| Contact request | Requests | **{name}** would like to connect | Accept / Decline |
| Reply in a channel you're in | Today | **{name}** replied in **{channel}** | View |
| Annotation resolved | Today | **{name}** resolved your annotation on **p.{n}** | View |
| Comment on your content | Today | **{name}** commented on **{title}** | View |
| Your submission approved | Earlier | A {region} editor **published** **{title}** | View |
| Changes requested | Earlier | **{editor}** requested changes on **{title}** | Open |
| New event in your community | Earlier | New event: **{event}**, {place} | RSVP |
| Someone joined your project | Earlier | **{name}** joined **{project}** | View |

**Delivery channels:** in-app (always) · email digest (daily/weekly per `notificationPrefs`) · per-type email toggles. Account → Notifications controls these.

---

## 5. Follow, request & contact flows (how they actually work)

The user asked what "follow a project" means and how requests are handled. Definitions:

- **Follow a region / theme** — a one-click, no-approval subscription. You receive that region/theme's published news, new outputs and events in your feed/digest. Reversible (Following → unfollow). Stored as a `follow` edge (§6).
- **Follow a project** — subscribe to a **public** project's *public* updates (new outputs, events, milestones it chooses to surface) — **not** workspace access. No approval needed. Distinct from joining.
- **Request to join a project** — wants workspace access. Opens a prompt modal: *"Tell {lead} how you'd like to contribute"* (free text, optional). Creates a `joinRequest` → notification to the lead → lead Accepts (adds to `project.members`, sends confirmation) or Declines (optional reason). The requester sees status: Requested → Member / Not this time.
- **Offer to collaborate** — responds to a project's or person's open call. Same shape as a join request but typed `offer`, carries the call it answers.
- **Contact request** — to a person. Honours `person.visibility.contact` + preference (everyone / members only / no one). If allowed: prompt → notification → Accept opens a DM; Decline silently dismisses. If disallowed: no contact button shown.

All four are **operational edges**, not Sanity content (§6).

---

## 6. Operational data model (NOT in Sanity)

Live, high-write, or permission-sensitive data lives in the app DB (Postgres/Firestore/Convex — your choice) and references Sanity document IDs. Sanity stays the source of truth for *publishable content*; the app DB owns *interaction state*.

```ts
// ——— Identity ———
User { id, sanityPersonId, email, role: 'member'|'editor', reviewRegion?, createdAt }
//   role/editor scope mirrors TAXONOMY §17; sanityPersonId links to the public profile

// ——— Membership & graph ———
ProjectMember { projectId(sanity), userId, role:'lead'|'convenor'|'collaborator'|'advisor', joinedAt }
Follow { userId, targetType:'region'|'theme'|'project', targetId, createdAt }      // §5
JoinRequest { id, projectId, userId, message?, type:'join'|'offer', answersCallId?,
              status:'pending'|'accepted'|'declined', createdAt, decidedBy?, decidedAt? }
ContactRequest { id, fromUserId, toUserId, message?, status, createdAt }

// ——— Workspace (the collab space internals) ———
Plan { projectId, stages:[{ id, title, order }] }
Task { id, projectId, stageId, title, assigneeUserId?, status:'todo'|'doing'|'done', order, updatedAt }
File { id, projectId, name, mime, storageUrl, versions:[{ kind, lang, url }], uploadedBy, createdAt }
Annotation { id, fileId, page, rect{x,y,w,h}, authorUserId, body, resolved, createdAt }
//   ↑ mirrors Sanity `annotation` shape; keep here for realtime, mirror resolved ones if needed

// ——— Messaging ———
Conversation { id, kind:'channel'|'community'|'direct', projectId?, regionId?, memberUserIds[], label, createdAt }
Message { id, conversationId, authorUserId, body, attachments?, createdAt, readBy[] }
//   channels group under their project; community spaces under a region; DMs are direct

// ——— Community participation ———
Thread { id, scope:'community'|'content'|'project', regionId?|contentId?|projectId?, authorUserId, title, createdAt, moderated:boolean }
Post { id, threadId, authorUserId, body, createdAt }
Comment { id, contentId(sanity), authorUserId, body, createdAt, status:'visible'|'hidden' }
RSVP { userId, eventId(sanity), status:'going'|'maybe'|'declined', createdAt }

// ——— Notifications & prefs ———
Notification { id, userId, type, payload{…}, group:'requests'|'today'|'earlier', read, actionable, createdAt }
NotificationPref { userId, channel:'inapp'|'email', frequency:'instant'|'daily'|'weekly', perType:{…} }

// ——— Privacy ———
PrivacySettings { userId, contactable:'everyone'|'members'|'none',
                  sectionVisibility:{ projects, publications, experience, lived, events, contact } }
```

**Boundary rule of thumb:** if it's *published and curated* → Sanity. If it's *live, frequent, or private interaction* → app DB. The two join on `sanityPersonId` / `…Id(sanity)`.

---

## 7. Onboarding copy (sign-up steps)

The 4-step onboarding already in the prototype, with real copy:

1. **Welcome** — *"Where climate & mental-health research connects."* Email + password / SSO. Sub: *"Join researchers, practitioners and people with lived experience across 7 regions."*
2. **Your region** — *"Which community is home?"* (the 7 regions) Sub: *"You'll see its news, events and projects first — you can follow others too."*
3. **You & your work** — role (Researcher / Practitioner / Person with lived experience / Funder / Other) + interests (themes). Sub: *"This helps us suggest collaborators and content."*
4. **How you'd like to take part** — intent chips (Find collaborators / Share research / Share a lived experience / Just exploring). Sub: *"No wrong answer — you can do any of these later."* → **Enter the hub →**

All steps skippable except region; everything editable later in Account.

---

## 8. Accessibility copy & rules

- Every image block requires `alt`; decorative blobs are `aria-hidden`.
- Focus order follows DOM order (sidebar → content); the mobile drawer traps focus while open and returns it to the ☰ button on close.
- Status colours never stand alone — always paired with a label (Draft, In review…) for colour-blind users.
- Target size ≥ 44px (already met). Contrast: body on white = midnight `#0B3160` (AA); slate `#8595AC` only for ≥ 14px secondary text.
- RTL (`ar`) mirrors layout via the design-system `[dir="rtl"]` rules; icons that imply direction (←/→) flip.
