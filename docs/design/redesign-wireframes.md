# CCM Hub — Redesign Wireframes & Design Spec

**Companion to** `rendered-ui-findings.md` (screenshot-validated) + `screenshots/`. This is the **build spec**: annotated wireframes (desktop + mobile, en/ar where RTL matters) for every redesigned surface and every new feature, plus the data model, comment placement, regional-community pages, news-item layouts, and how each is mobile-first.

**Design language:** evolution within CCM (palette sky/water/sea/midnight; tokens `lib/design-tokens.ts` — `heading()/spacingY()/gridGap()/containerWidth()/cardAspect()`; reuse `SectionContainer`/`Card`/`Badge`/`FilterChip`/`Avatar`/shadcn). Logical CSS props only (`ms/me/ps/pe`, `-start/-end`). **Mobile-first**: every surface is designed at 375 first, then enhanced at `md`/`lg`.

**Design VOICE (standing rule — applies to all copy + UI):** simple but not basic; smooth and calm; playful but professional; research-oriented. **Never write copy that performs warmth or "tries to sound human"** (e.g. avoid "their story, in their own words", "we'd love to…", chatty filler). Let the content be the warmth — labels are quiet, plain, and few. Section labels are nouns ("Story", "About", "Discussion"), not narration. Restraint over decoration. Microcopy is short and unsentimental. Motion is subtle. This is a climate × mental-health research community — dignity and calm beat cleverness.

Legend: `▓` filled/primary · `░` muted/surface · `◎` avatar · `▭` image · `[btn]` button · `‹chip›` FilterChip/Badge · `≡` nav/toggle.

---

## PART 1 — REDESIGNED SURFACES

### B4 · Lived-Experience Modal (highest-priority redesign)

**Current (screenshot `lived-exp-modal-en-desktop`):** camera-icon placeholder + "This video requires cookie consent to play" + [Accept All], then a giant title overflowing the bottom edge. No person, story, region, or tags. Impersonal for first-person testimony.

**Proposed — person-centered, story-readable-before-consent. Mobile-first: single column; media is one region inside it, not the whole modal.**

```
MOBILE (375, base)                      DESKTOP (lg ≥1024)
┌───────────────────────────┐          ┌──────────────────────────────────────────────┐
│ [✕]                       │          │ [✕]                                          │
│ ◎  Person Name            │          │ ┌─ media (16:9) ───────┐   ◎ Person Name     │
│    Region · role          │          │ │  ▶ video             │   Region · role     │
│ ┌─ media (16:9) ────────┐ │          │ │   — or —             │   ‹climate›‹mental› │
│ │ ▶ video / consent     │ │          │ │  consent prompt      │                     │
│ │   (scoped here only)  │ │          │ │  (inside frame only) │   Story             │
│ └───────────────────────┘ │          │ └──────────────────────┘   {issue}           │
│ Story                     │          │                            {personContext}    │
│ {issue} {personContext}   │          │                            [Share] [View →]   │
│ ‹climate›‹mental-health›  │          └──────────────────────────────────────────────┘
│ [Share]   [View →]        │          Voice: label is just "Story" (a noun). No
└───────────────────────────┘          performed copy. The text IS the issue/context.
```
- **Regions:** PERSON header (`Avatar` + name `<bdi>` + `relatedCommunity` region + `author.role`), MEDIA frame (consent gate scoped *here only* — `YouTubeConsentGate` wrapping just this box), **Story** (quiet noun label; renders `issue` + `personContext` portable text, **always shown** even pre-consent — no narration around it), TAGS (`Badge`), actions.
- **Data:** all fields already exist on `livedExperience` (`issue`, `personContext`, `author`, `relatedCommunity`, `tags`). No schema change. "View full →" links to the new `/lived-experiences/[slug]` detail page (built in Track 5/LE).
- **Tokens/components:** shadcn `Dialog`, `Avatar`, `Badge`, `heading('md')` for the name, `text-balance` on title, consent gate. Title constrained (`line-clamp-3` + padding), never dominant.
- **Mobile-first:** base = stacked, media after the person header so context leads; `lg:` = 2-col (media inline-start, context inline-end). **RTL:** media moves to inline-start via logical grid; `<bdi>` on the name; tags/actions use `ms/me`.

---

### B7 · Dashboard

**Current (`dashboard-en-desktop`):** "Your Community" floats in the right rail aligned to row 1 only (big empty space below on desktop; buried last on mobile). Redundant "Edit Profile" (header) + "Manage Profile→View Profile" card. Vague "Submit" button. Avatar blank (A2).

**Proposed — community promoted to a full-width band; clear labels; no redundancy. Mobile-first puts the most personal element near the top, not last.**

```
MOBILE (375)                       DESKTOP (lg)
┌─────────────────────────┐        ┌────────────────────────────────────────────────┐
│ Welcome, {name}         │        │ Welcome, {name}                  [Edit profile] │
│ [Edit profile]          │        │ Profile 43% ▓▓▓▓▓░░░░  Complete to connect…     │
│ 43% ▓▓▓▓▓░░░            │        ├──────────── Your Community (full-width) ────────┤
├─ Your Community ────────┤        │ ◎ N. Africa & W. Asia · 4 members      [Visit →]│
│ ◎ Region · 4 members    │        ├─ Quick Actions ─────────────────────────────────┤
│ [Visit community →]     │        │ ┌─────────────┐ ┌─────────────┐                 │
├─ Quick Actions ─────────┤        │ │View public  │ │Submit a     │                 │
│ [View public profile]   │        │ │profile  [→] │ │case study[→]│                 │
│ [Submit a case study]   │        │ └─────────────┘ └─────────────┘                 │
│ [Find collaborators]    │        │ ┌─────────────┐ ┌─────────────┐                 │
│ [Manage account]        │        │ │Find         │ │Manage       │                 │
│ (+ recent submissions   │        │ │collaborators│ │account   [→]│                 │
│    feed if cheap)       │        │ └─────────────┘ └─────────────┘                 │
└─────────────────────────┘        └────────────────────────────────────────────────┘
```
- **Changes:** "Your Community" → full-width band directly under the welcome/progress header at all sizes (fixes desktop float + mobile-last). Header keeps one **Edit profile**; the action card becomes **View public profile** (distinct action). Buttons relabeled verb+object: *Submit a case study · Find collaborators · Manage account*.
- **Tokens/components:** `Card`, `Button` (clear labels), progress bar, `Avatar` (now visible after A2). `gridGap('md')`, `spacingY`.
- **Mobile-first:** base = single column, community band 2nd (right after header); `md:` Quick Actions become 2×2. **RTL:** band + cards mirror; [Visit →] arrow flips via logical icon side.

---

### B2 · News list + cards

**Current (`news-list-en-desktop`):** filter bar (search + date chips + Filters); Featured = 2 text-only sky cards; Latest = 3-col mixing site + external; **"CCM" blue badge** on site cards; external cards show source + logo. RTL: "Featured/Latest News" stay English.

**Proposed — drop CCM badge; ours = no badge (absence = ours); external = source+favicon+↗. Mobile-first single column.**

```
MOBILE (375)                    DESKTOP (lg)
┌──────────────────────┐        ┌─────────────────────────────────────────────┐
│ 🔍 search            │        │ 🔍 search        ‹Any time›‹Past yr›‹5y› [⚙]│
│ ‹Any time›‹Past yr›  │        │ Featured                                    │
│ [⚙ Filters]          │        │ ┌───────────────┐ ┌───────────────┐         │
│ Featured             │        │ │ ▭ img (opt)   │ │ ▭ img (opt)   │         │
│ ┌──────────────────┐ │        │ │ Title         │ │ Title         │         │
│ │ ▭ img? · Title   │ │        │ └───────────────┘ └───────────────┘         │
│ └──────────────────┘ │        │ Latest                                      │
│ Latest               │        │ ┌────────┐ ┌────────┐ ┌────────┐            │
│ ┌──────────────────┐ │        │ │ ▭ img  │ │ ▭ img  │ │ ▭ img  │            │
│ │ ▭ img            │ │        │ │ Title  │ │ Title  │ │↗ Source│ ← external │
│ │ Title            │ │        │ │ date·by│ │ date·by│ │ Title  │   (favicon)│
│ │ date · author    │ │        │ └────────┘ └────────┘ └────────┘            │
│ │ (no CCM badge)   │ │        │   ours: NO badge      external: source+↗    │
│ └──────────────────┘ │        └─────────────────────────────────────────────┘
└──────────────────────┘
```
- **Changes:** remove the `CCM`/`siteBadge` pill entirely; site cards carry no badge; external cards keep `source name + favicon + ↗`. Featured gains an optional image slot (so it's not an empty blue box). Translate "Featured News"/"Latest News".
- **Tokens/components:** `FilterChip` (date range), `Card`, `Badge` (source only), `grid-news`/`grid-external-source`, `urlForCropped` (A4).
- **Mobile-first:** base 1-col; `md:` 2-col; `lg:` 3-col. Chips wrap. **RTL:** card meta row + source row use `ms/me`; headings translated.

---

### B6 · Public profile (containment + sparse state)

**Current (`profile-en-desktop` / `profile-ar-*`):** header (initials/name/@handle/location/age/badges) → 4-stat row → 2-col (About+Skills main; Regional Communities sidebar). Sparse users collapse to name + "Member Since". RTL: "Lockshinsky Amit" reorder, English labels, "months 7", badge overflow risk. Right "Regional Communities" card has lots of empty space; "bio" shows literal placeholder.

**Proposed — bidi-safe, contained, graceful sparse state. Mobile-first single column with the right ordering.**

```
MOBILE (375)                      DESKTOP (lg)
┌────────────────────────┐        ┌──────────────────────────────────────────────┐
│ ◎  Name (bdi)          │        │ ◎  Name (bdi)  (pronouns)        [open chip]  │
│    @handle · headline  │        │    @handle · headline                        │
│    role·location(bdi)  │        │    role · location(bdi) · age                │
│    [open chip]         │        │    ‹worktype›‹expertise›…                    │
│    ‹type›‹expertise›   │        ├─ stats: Member·Location·Communities·Skills ──┤
│ ┌ stats 2×2 ┐          │        │ ┌─ main (2/3) ───────┐ ┌─ sidebar (1/3) ──┐ │
│ About / (sparse: "no   │        │ │ About              │ │ Regional comm.   │ │
│   details yet" + own-  │        │ │ Prompts            │ │  ‹region (wrap)› │ │
│   er prompt)           │        │ │ Collaboration      │ │ Special comm.    │ │
│ Skills                 │        │ │ Work / Recent      │ │ Contact links    │ │
│ Regional communities   │        │ │ Contributions      │ │  ↗ Website (btn) │ │
│ Contact links (↗ btns) │        │ └────────────────────┘ │  ↗ LinkedIn(btn) │ │
└────────────────────────┘        │                        └──────────────────┘ │
                                   └──────────────────────────────────────────────┘
```
- **Changes:** `<bdi>`/`dir="auto"` on name+location (fixes reorder); translate every label (stats, "View Project", "Ongoing", section titles); region/community/contact `Badge`s → `max-w-full whitespace-normal break-words` + logical padding; contact links become clearly-actionable buttons w/ icon + ↗; **graceful sparse state** ("This member hasn't added details yet" + owner completion prompt instead of a lone stat).
- **Mobile-first:** base 1-col, Regional Communities + Contact raised above generic content (not buried); `lg:` 2/3 + 1/3. **RTL:** all of A3 applies here first.

---

### B8 · The map — deploy the interactive block + layer toggles

**Current:** two maps exist — (1) **static locator** (`map-community-hero`, decorative, gold region) on community hero + case-study; (2) **interactive `region-map` block** (facet switcher + data panel, fully built) deployed on **ZERO pages**.

**Proposed — deploy the interactive block on the homepage; add layer toggles. Mobile-first: map + panel stack.**

```
MOBILE (375)                      DESKTOP (lg)
┌──────────────────────────┐      ┌────────────────────────────────────────────────┐
│ ‹Case Studies›‹Lived Exp›│      │ ‹Case Studies›‹Lived Exp›‹Members›‹News›  facet │
│ ‹Members›‹News›          │      │ ( ▢ choropleth  ▢ pins )            layer toggle │
│ ( ▢ choropleth ▢ pins )  │      │ ┌──── choropleth (facet-shaded) ──┐ ┌─ panel ─┐ │
│ ┌─ choropleth ────────┐  │      │ │ regions hover/active, click →   │ │1.Region▓│ │
│ │  facet-shaded       │  │      │ │ community; pins layer optional  │ │2.Region▓│ │
│ └─────────────────────┘  │      │ └─────────────────────────────────┘ │3.Region▒│ │
│ ┌─ data panel ────────┐  │      │                                     └─────────┘ │
│ │ 1.Region ▓ 2. ▓ …   │  │      └────────────────────────────────────────────────┘
│ └─────────────────────┘  │
└──────────────────────────┘
```
- **Changes:** place the existing `region-map` block on the homepage (replacing or above the static 7-up region grid — keep region links as click targets below/in panel). Add a **layer-control** (choropleth on/off + per-content-type pins on/off) beside the facet switcher; pins from the same `/api/maps/region-data` payload (needs geopoints — caseStudy/news have them; LE/agenda/report need a `location` geopoint added). Keep SVG choropleth style (additive layer, no restyle). Static locator stays on community hero + case-study.
- **Mobile-first:** already stacks (map → panel); facet chips wrap. **RTL:** chip row + panel use logical sides; choropleth is geographic (not mirrored), panel text follows `dir`.

---

## PART 2 — NEW BIG FEATURES (wireframed)

### Comments — WHERE they go + how they look

**Placement (mount points):** a lazy, below-the-fold `<CommentSection>` island at the **end of the article body, above the footer**, on: case-study `[slug]`, news `[slug]`, and (once built) lived-experience `[slug]`. ISR pages stay `revalidate=300`; the island is `'use client'` + `dynamic(ssr:false)` + IntersectionObserver — zero server cost, no LCP hit.

```
…end of article body…
├──────────────────────────────────────────────────┤
│  Discussion  (N)                                   │  ← heading, count
│  ┌ compose ─────────────────────────────────────┐ │
│  │ ◎ [ write a comment… ]            [Post]      │ │  ← signed-in: posts immediately
│  └──────────────────────────────────────────────┘ │     anon: name + Turnstile, "held for review"
│  ◎ Name · 2h            ‹reply›‹react 👍 3›‹⋯›    │
│    comment text…                                   │
│      └ ◎ Name · 1h   ‹react›   (one level only)   │  ← depth 0/1 enforced
│  ◎ Name · 5h            ‹reply›‹⋯ report›          │
│  [ Load more ]                                     │  ← keyset pagination
└────────────────────────────────────────────────────┘
```
- **Mobile-first:** full-width stack; compose box sticky-friendly; reply indents minimally (`ms-4`), tombstones for deleted-with-replies. **States:** PENDING (anon/flagged) shows "held for review" to the author only; VISIBLE to all; REMOVED_BY_MOD hidden.
- **Moderation:** wordlist `blockTerms` → never shown; `reviewTerms`/anon → PENDING → in-app `/moderation` queue (below).

### `/moderation` queue (team_editor/admin)

```
┌ Moderation ─────────────────────────────────────────┐
│ ‹Pending (anon) 12›  ‹Flagged 3›  ‹Reported 1›       │  ← tabs
│ ┌──────────────────────────────────────────────────┐│
│ │ ◎ Anon "Name" · on "Case study X" · 2h           ││
│ │   comment text…                                   ││
│ │   reason: held-anon          [Approve][Remove]    ││
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```
Approve → VISIBLE + notify author (in-app + localized email, idempotent). Mirrors the case-study review pattern. Mobile-first: tabs scroll; cards stack.

### Collaboration workspace (Notion/Linear)

```
MOBILE (375)                      DESKTOP (lg)
┌──────────────────────────┐      ┌────────────────────────────────────────────────┐
│ ≡ Workspace name   [⋯]   │      │ ┌─ nav ─────────┐ ┌─ content pane ─────────────┐ │
│ (drawer nav: Overview·   │      │ │ Workspace      │ │  (selected section)        │ │
│  Threads·Files·Media·    │      │ │ • Overview     │ │  Overview: title, members, │ │
│  Members)                │      │ │ • Threads  12  │ │  recent activity           │ │
│ ─ Overview ──────────────│      │ │ • Files     5  │ │  Threads: list → open in   │ │
│  title, members, activity│      │ │ • Media     3  │ │   pane (Comment engine)    │ │
│  [+ New thread]          │      │ │ • Members   8  │ │  Files: cards → PDF opens   │ │
└──────────────────────────┘      │ └────────────────┘ │   EmbedPDF annotator        │ │
                                   │                    └────────────────────────────┘ │
                                   └────────────────────────────────────────────────┘
```
- **Mobile-first:** left-nav collapses to the vaul `Drawer` (native, swipe-close); content pane = full width; sections are route segments (`collaborations/[id]/threads` etc.) so deep-links + lazy-load work.
- **Roles:** OWNER/EDITOR/COMMENTER/VIEWER gate actions. MEMBERS-only files via private R2 prefix + presigned GET.

### EmbedPDF annotator (Files section + all PDFs)

```
┌ file.pdf ──────────────────────────── [annotations: ▣ on] [✕]┐
│ ⟨ native EmbedPDF toolbar: highlight·ink·note·shapes ⟩        │
│ ┌──────────────── PDF page (canvas) ───────────────────────┐ │
│ │  …rendered page with annotation layer…                    │ │
│ └───────────────────────────────────────────────────────────┘ │
│  ‹ prev page ›   p. 3 / 24   ‹ next page ›                    │
└───────────────────────────────────────────────────────────────┘
```
Native plugin tools; `exportAnnotations()`→one `CollaborationFileAnnotations` row/file; `importAnnotations()` on open; **toggle to show/hide annotations** while reading; PDF bytes never mutated; VIEWER read-only. Same viewer reused for reports/agendas (Track 5 "EmbedPDF for all PDFs").

### Messaging & Workspaces — full redesign spec (2026-06-18, user-driven)

> This section supersedes the old thin "Notifications + DMs" sketch. It is the **build spec** for the messaging/workspaces redesign, grounded in the decisions the user confirmed: nest under Collaborate; messaging integrated into discover; notifications+messages **into the avatar** (nothing floating in the header); contact details **never exposed** (platform-relay model, message-as-email **with reply-by-email as an option**); layered anti-bot (rate-limit + Turnstile on first contact); workspace group chats **surface in the unified inbox as group conversations**; minimal comment editor (B/i/link); correct Latin/Arabic title fonts; **mobile-first throughout**.

#### Why this redesign (the honest state it replaces)
The plumbing exists but is not a product: `NotificationBell` floats in the header `ms-auto` cluster (not in the avatar); `Inbox` is a bare list+thread on a disconnected `/messages` route (no search, reply, file-link, or group affordance); workspaces are a separate `/collaborations` island reachable only by a bolted-on header button. The redesign collapses **discover → message → work-together** into one motion with Collaborate as the parent.

#### IA — Collaborate becomes the parent hub
```
Collaborate (parent)
├── People       ← existing discover carousels + a "Message" action on every person card
├── Workspaces   ← your collaborations (was /collaborations), as a tab here
└── Messages     ← NOT a top tab. Lives in the avatar, reachable from everywhere.
```
Mental model: find a person → message them → that thread can graduate into a **workspace** → the workspace has a **group conversation** (in your inbox) + files you can **link into any message**.

#### Engagement hub = the avatar button (replaces the header bell)
- The **avatar** (bottom of sidebar, `auth-nav-user.tsx` → `NavUser`) carries a single combined unread dot (messages + notifications). **Nothing floats in the header** — `NotificationBell` is removed from `layout.tsx`; its logic moves into the dropdown.
- Dropdown rows, above Sign out: **Messages `N`** and **Notifications `N`**, each with its own count badge.
```
avatar ◎ •     (combined unread dot on the button itself)
└ dropdown:
  Messages        3   →  opens the inbox panel (below)
  Notifications   5   →  opens the notifications panel
  ───────────────────
  Sign out
```

#### Inbox surface — Instagram-style hovering side panel (lg) / full-screen drawer (mobile)
Mobile-first: on `< md` the inbox is a **full-screen drawer** (vaul) — list, then tap → full-screen thread with a back arrow. On `lg` it's a **hovering pop-up side panel** anchored to the avatar (does not navigate away; you read/reply in place, like Instagram web DMs). A "See all" affordance can still open a full `/messages` page for power use.
```
MOBILE (375) — full-screen drawer        DESKTOP (lg) — hovering side panel
┌───────────────────────────┐            ┌─────────── page ───────────┐
│ Messages              [✕] │            │              ┌────────────┐│  ← anchored to
│ ┌ 🔍 search people/msgs ┐ │            │  (page)      │ Messages ✕ ││     the avatar,
│ └───────────────────────┘ │            │              │ 🔍 search  ││     floats over
│ • Amina            2h  3  │            │              │ • Amina  3 ││     content
│ • 👥 Coastal Resil. 1d 1  │            │              │ •👥Coastal ││
│ • Diego            3d     │            │              │ • Diego    ││
│   (tap → full-screen)     │            │              │ ──────────  ││
└───────────────────────────┘            │              │ [ thread ] ││
   thread view (after tap):              │              │ ◎ Amina →pf││
   ‹ back   ◎ Amina · region  [⋯]        │              │ msgs…      ││
   …messages… (reply-to shows quote)     │              │ [type… 📎] ││
   [ 📎 type a message…           ▷ ]    │              └────────────┘│
                                          └─────────────────────────────┘
```
**Search** filters both existing conversations **and** people you haven't messaged yet (start-new inline) — one search box, two result groups ("Conversations" / "People"). Starting a new conversation with someone you've never messaged triggers the **Turnstile** first-contact check.

#### Conversation thread — features
- **Reply-to-a-message:** tap a message → "Reply" → composer shows a quoted preview; the sent message stores `replyToId` and renders the quote inline (tap to scroll to original).
- **Link/share workspace files:** the `📎` in the composer opens a picker scoped to **workspaces you both belong to** (or the workspace this group chat is attached to) → inserts a file reference card (name + type + open-in-viewer). For `members/` (private) files the recipient must be a workspace member; the link resolves to a **short-TTL presigned GET**, never a raw R2 URL. No file is *copied* into the message — it references the `CollaborationFile`, so permissions stay live.
- **Group conversations = workspaces.** A workspace's group chat is just a `Conversation` with `collaborationId` set and all members as participants. It appears in the **unified inbox** marked `👥 {workspace name}`, opens into the same thread UI with member avatars + a **link back to the workspace**. No separate "Chat" tab in the workspace shell — one message list, everything in it. New members joining the workspace are added as participants; leaving removes them.
- **Minimal rich text (matches the comment editor):** composer supports **bold / italic / link only**, stored as light markdown, rendered safely. Same minimal toolbar component is reused by the comment composer.

#### Contact-privacy & relay model (the spine)
- **Emails/contact details are never serialized to the client** — audit every surface (profile, collaborate card, workspace members, case-study author) so no `user.email` reaches the browser. The CTA is **"Message"**, never "Email". (`transformUserForIndex` already redacts for Algolia; extend the guarantee app-wide.)
- **Message-as-email (relay), per recipient preference:** sending a DM always creates the in-app message; it **optionally also emails** the recipient ("{Sender} sent you a message" + preview + "Read & reply on the Hub"), gated by `NotificationPreference` + one-click unsubscribe (`unsubscribeToken`). The email shows the sender's *display name*, never the address.
- **Reply-by-email is an OPTION (user-confirmed):** the data model carries a **per-conversation relay token** from day one (`Conversation.relayToken`). v1 ships **notify-by-email + reply-on-Hub**; the relay-reply path (inbound parse via `conv-{token}@reply.connectingclimateminds.org` → matched to the conversation → posted as a Hub message, with loop/spam guards) layers on without a schema change. A per-recipient setting chooses "notify by email" vs "email + reply by email".
- **Anti-bot (layered, user-confirmed):** messaging is authed-only; **Turnstile on first-contact / new conversation**; per-user send rate limit (30/min, already in `lib/actions/messaging.ts`); profile/collaborate **contact actions require sign-in**; listing fields stay redacted. Normal back-and-forth is never challenged.

#### Notifications panel (in the avatar)
```
Notifications                 [mark all read]
◎ Amina replied to your comment        2h
◎ Diego mentioned you (@you)           5h
◎ New reaction 👍 on your comment      1d
◎ Coastal Resilience: new file          1d
(rows link to the source; opening marks read)
```
SWR-polled (`refreshWhenHidden:false`), indexed unread `COUNT`, respects `NotificationPreference` for which types email. Mobile = full-screen sheet from the avatar drawer; lg = the same hovering side panel pattern as the inbox.

#### Fonts (Latin/Arabic correctness)
Every new title/heading uses `font-heading` so the existing `--font-heading` switch applies: Latin → Poppins, Arabic/RTL → Lalezar (`globals.css` ar block); body via `font-body` (Lato / Tajawal). Workspace names + person names get `<bdi>` so bidi mixing (e.g. an Arabic name in an LTR list) renders correctly.

#### Repo integration map (where each piece lives)
- **Avatar hub:** `components/auth-nav-user.tsx` + `components/nav-user.tsx` (add Messages/Notifications rows + combined badge); **remove** `NotificationBell` from `app/[locale]/layout.tsx`.
- **Inbox panel:** redesign `components/messaging/inbox.tsx` into a panel that mounts in the avatar dropdown; new `components/messaging/message-search.tsx` (conversations + people); reply-to + file-picker subcomponents. Service `lib/messaging/service.ts` gains search + file-reference resolution; actions `lib/actions/messaging.ts` gain `replyToId`, file-reference attach, group-from-workspace.
- **Workspace group chat:** `Conversation.collaborationId` (additive migration); membership sync hooks in the collaboration member add/remove actions; inbox renders the `👥` group affordance + workspace back-link.
- **People → Message:** add a `Message` action to the person card in `components/collaborate/user-carousel.tsx` (and the profile page) → opens the inbox panel pre-targeted (Turnstile if first contact).
- **Relay:** `Conversation.relayToken` (additive); `lib/messaging/email.ts` (new) reusing the `lib/case-study-emails.ts` localized/RTL Resend pattern; inbound route deferred but tokens reserved.
- **Minimal editor:** `components/ui/minimal-rich-text.tsx` (new, B/i/link) reused by both the message composer and the comment composer.
- **Anti-bot:** Turnstile gate on first-contact in `lib/actions/messaging.ts` (CSP already allows Turnstile); rate-limit via `lib/rate-limit.ts`.

#### Mobile-first (non-negotiable, per user)
375 first for every surface: avatar dropdown is a bottom-anchored menu; inbox + notifications are **full-screen drawers**, not shrunk side panels; thread is full-screen with a back arrow; file-picker is a drawer; reply-quote stacks above the composer. `md`/`lg` progressively enhance to the hovering side panel. Logical props throughout (`ms/me/ps/pe`, `-start/-end`) so RTL is correct by construction; reduced-motion honored.

---

### Reply-by-email — full inbound path (v1, user-confirmed)

The user chose **full reply-by-email in v1** (not deferred). This is the riskiest piece; spec'd concretely here.

**Outbound (the email that invites a reply):**
```
From:     Connecting Climate Minds <notify@connectingclimateminds.org>
Reply-To: conv-{relayToken}@reply.connectingclimateminds.org      ← per-conversation
Subject:  {Sender display name} sent you a message
Body:     {preview}  ·  [Read & reply on the Hub →]  ·  unsubscribe (one-click)
```
- `Reply-To` carries the per-conversation `relayToken` (NOT the recipient's address anywhere). The sender's *display name* shows; their address never does.

**Inbound (the reply coming back):**
```
user hits Reply in Gmail/Outlook
   → mail lands at *@reply.connectingclimateminds.org (MX → inbound provider)
   → inbound webhook  POST /api/messaging/inbound   (provider-signed)
   → verify signature  →  parse: relayToken (from To:), sender address, body
   → match relayToken → Conversation; match From: → a participant (must already be one)
   → strip quoted history + signature (top-post extraction)
   → post as a Message (senderId = matched participant), fan out in-app + (opt) email to others
```
**Guards (must-haves, or it becomes a spam/abuse vector):**
- **Signature verification** on the inbound webhook (provider HMAC) — reject unsigned.
- **Participant match required:** the `From:` address must map to an existing conversation participant. Unknown sender → drop (never auto-create a user or leak that the address exists).
- **Loop/auto-reply suppression:** honor `Auto-Submitted`, `List-*`, `Precedence: bulk` headers; ignore vacation/bounce mail; dedupe on `Message-ID`.
- **Rate-limit inbound** per relay token (reuse `lib/rate-limit.ts`).
- **Quote stripping:** extract only the new text (top-post heuristic + provider-parsed `text` part), so the whole thread isn't re-posted.
- **Size/content caps:** strip attachments in v1 (or route to the R2 file path with validation); cap body length.
- **Token rotation:** `relayToken` is per-conversation and revocable; blocking a user or leaving disables their inbound match.

**Infra the user must provision (Cloudflare-side, since email is on CF/Resend):**
- A subdomain **`reply.connectingclimateminds.org`** with **MX → an inbound-email provider** (Cloudflare Email Routing → Worker, or Resend Inbound, or a mailbox-to-webhook service).
- The **inbound webhook secret** → env `MESSAGING_INBOUND_SECRET`.
- Confirm SPF/DKIM/DMARC for `notify@` outbound (Resend domain already set up — extend to the reply subdomain).

**Schema additions for relay (additive):** `Conversation.relayToken String @unique @default(cuid())`; a per-recipient mode on `NotificationPreference` (e.g. `messageDelivery: HUB_ONLY | EMAIL_NOTIFY | EMAIL_REPLY`). Build order: outbound notify + `Reply-To` token first (works immediately), then the `/api/messaging/inbound` route + parser (the part that needs the MX/provider). Code can be written and unit-tested (parser, token match, guards) before the MX exists.

---

### Notifications — app-wide rethink (user-requested)

Current state (grounded in `prisma/schema.prisma` + `lib/notifications/service.ts`): a single `Notification` model (polymorphic `entityType`/`entityId` + `snippet`), `NotificationType` = `COMMENT_REPLY | MENTION | REACTION | COMMENT_APPROVED | COLLAB_ACTIVITY | MESSAGE`, a `NotificationBell` (header), and `NotificationPreference` with only 3 email toggles (`emailOnReply/Mention/Message`). It works but is (a) **header-bound** (the float you want gone), (b) **coarse** (3 toggles for 6 types), and (c) **siloed** from messages (separate bell vs separate inbox). The rethink:

**1. One engagement center, two streams.** Messages and Notifications are *different* (a message wants a reply; a notification is an FYI) so they stay separate **streams**, but live in **one place — the avatar**, with one combined unread dot. No header bell. This is the single biggest UX win and what the user asked for.

**2. Notification taxonomy (group the 6 types into 3 reader-facing buckets):**
- **Direct** — someone acted *at* you: `MENTION`, `COMMENT_REPLY`. (High signal; default email on.)
- **Activity** — things you follow moved: `COLLAB_ACTIVITY` (new file/thread/member in your workspace), `COMMENT_APPROVED`. (Medium; default in-app, digest-able.)
- **Reactions** — `REACTION`. (Low; in-app only by default, never email.)
Messages (`MESSAGE` type) are **not** shown in the notifications stream at all — they belong to the inbox, so the streams don't double-count.

**3. Per-type preferences (replace the 3 coarse toggles).** A matrix the user controls in settings: each type → `In-app` / `Email` / `Off`, with sensible defaults above. Plus the message-delivery mode (`HUB_ONLY | EMAIL_NOTIFY | EMAIL_REPLY`) from the relay spec. One-click unsubscribe still maps to flipping email off.

**4. Consistent fan-out helper.** Every producer (comment reply, mention, reaction, collab activity, message) calls one `notify({ recipientId, type, actor, entity, snippet })` that: writes the `Notification`, checks `NotificationPreference`, and emails when allowed (localized/RTL via the `lib/case-study-emails.ts` pattern). No ad-hoc notification creation scattered across actions. (`createNotification` already exists in `lib/notifications/service.ts` — extend it into this single gated entry point.)

**5. Read semantics + budget.** Opening a stream marks its items read (already the bell's behavior); unread `COUNT` stays an indexed query (`@@index([recipientId, readAt])` exists); SWR `refreshWhenHidden:false`; one combined poll for the avatar dot rather than two. Document the cumulative polling budget so messages + notifications together don't exceed a sane interval.

**6. Settings surface.** The preference matrix lives in dashboard settings alongside DM privacy (`allowMessagesFrom`) + block list. Mobile-first: a stacked list of toggles, not a wide table.

**Schema deltas for the rethink (additive):** extend `NotificationPreference` from 3 booleans to a per-type map (or columns `emailOnReaction`, `emailOnCollabActivity`, `emailOnApproved` + a `messageDelivery` enum); no change to `Notification`/`NotificationType` themselves.

### The Reader — Global Agenda docs block

```
MOBILE (375)                      DESKTOP (lg)
┌──────────────────────────┐      ┌────────────────────────────────────────────────┐
│ ≡ Chapters (drawer)      │      │ ┌─ chapters ────┐ ┌─ reading pane (max ~68ch) ─┐ │
│ ─ Chapter title ─────────│      │ │ • Cover        │ │  H1 chapter title          │ │
│  readable body (~prose)  │      │ │ • Foreword     │ │  body (heading scale,      │ │
│  ▭ figure + caption      │      │ │ • Ch.1 …       │ │   figures urlForCropped,   │ │
│  styled links            │      │ │ • …Appendices  │ │   styled links, TOC)       │ │
│  ‹ prev ›       ‹ next › │      │ │ (active hi-lit)│ │  ‹ prev ch ›   ‹ next ch › │ │
└──────────────────────────┘      │ └────────────────┘ └────────────────────────────┘ │
                                   └────────────────────────────────────────────────┘
```
- **Source:** fetch the Docusaurus markdown (13 chapters Cover→Appendices), transform into a Sanity `docsChapter` type (editor-maintainable, localizable later). Neat arrangement: chapter nav (drawer on mobile), reading pane capped at ~68ch, `heading()` scale, `next/image`+`urlForCropped` figures, styled links, prev/next + TOC. Pairs with EmbedPDF for the raw PDF.
- **Mobile-first:** chapters in a `Drawer`; reading pane full width; prev/next pinned.

---

## PART 3 — REGIONAL COMMUNITY PAGES

**Current:** template mode = fixed grids (agendas, case studies, news, lived experiences, team); custom mode = `contentFlow` blocks. No interactive map in template mode. Hero shows the static locator.

**Proposed layout (template mode), mobile-first:**
```
┌ hero: welcome + static locator (this region gold) ─────────┐
│ Why join (CTA)                                              │
├─ Focused interactive map (defaultFacet=memberCount, this   │
│   region emphasized) — NEW: place region-map block here    │
├─ Case studies (grid)   ·   Lived experiences (netflix row) │
├─ Agendas/Reports (grid)                                    │
├─ Regional team (grid — avatars now visible after A2)       │
├─ Regional NEWS (grid)  ←── Track 6: regional news feed     │
│   …and a GATED "regional blog/news" section reachable only │
│   via back-link from a regional news item (not in nav/     │
│   sitemap yet)                                             │
└────────────────────────────────────────────────────────────┘
```
- Comments do **not** go on the RC landing page (it's an index); they go on the individual content items it links to.
- Mobile-first: all sections single-column stacks; netflix rows scroll horizontally; map → panel stacks.

---

## PART 4 — NEWS-ITEM READING LAYOUTS (single)

**Current:** back link → centered title → meta → full-bleed hero → key-takeaway callout → one wide column. Body too wide; flat heading hierarchy.

**Proposed — a few subtle, readable layouts (CMS-selectable per post), mobile-first:**
```
LAYOUT A "Standard"           LAYOUT B "Lead image"        LAYOUT C "Report/external"
‹ Back                        ‹ Back                       ‹ Back
 H1 (centered)                [── full-bleed hero ──]       Source ↗ + H1
 date·author·‹tags›           H1 over/under hero            date · external link card
[── hero (full-bleed) ──]     date·author                  ╭ key takeaway ╮
╭ key-takeaway callout ╮      body (~68ch)                  body (~68ch) + quote pulls
 body (max ~68ch)             figures break out             "Read original ↗"
```
- All three: prose capped ~68ch centered (A7), `h2/h3` from `heading()` (A6), figures via `urlForCropped` (A4), tags → filtered-news links, slim Share + Back footer, then the **comment island**.
- CMS: an optional `layout` enum on `newsPost` picks A/B/C (default A). Mobile-first: all collapse to one column; hero scales; callouts full-width.

---

## PART 5 — DATA MODEL / MIGRATION (Prisma delta)

The big migration for the comments/collab/engagement features. **Additive only**; every user FK `onDelete: Cascade`; mirrors the existing `UserCommunity` join pattern. Applied via `prisma migrate` (granted). `@/generated/prisma`.

```
USER (existing) ──< Comment            (authorId, nullable for anon)
                ──< CommentReport       (reporterId)
                ──< Reaction            (userId, [commentId,userId,emoji] unique)
                ──< Mention             (mentionedUserId)
                ──< Notification        (recipientId, [recipientId,readAt] index)
                ──< NotificationPreference
                ──< CollaborationMember (userId)        ── mirrors UserCommunity
                ──< CollaborationFile.uploadedById
                ──< CollaborationFileAnnotations.updatedById
                ──< ConversationParticipant.userId
                ──< Message.senderId

Comment ── targetType(enum: caseStudy|newsPost|livedExperience|collaborationThread|collaborationFile)
        ── targetId (string; validated at write via GROQ status=="approved")
        ── parentId (self; depth 0/1 via CHECK constraint)
        ── status (PENDING|VISIBLE|DELETED_BY_AUTHOR|REMOVED_BY_MOD)
        ──< CommentFlag (reason: BLOCKWORD|WORDLIST|REPORTED)
        ──< CommentReport ──< Reaction ──< Mention
   indexes: (targetType,targetId,status,createdAt) + partial WHERE status='VISIBLE'; keyset (createdAt,id)

Collaboration ── status(DRAFT|ACTIVE|ARCHIVED) ── visibility(PUBLIC|MEMBERS)
        ──< CollaborationMember [collaborationId,userId] PK, role(OWNER|EDITOR|COMMENTER|VIEWER), Cascade
        ──< CollaborationThread (── reuses Comment via targetType=collaborationThread)
        ──< CollaborationFile (r2Key, prefix members/|public/) ──1 CollaborationFileAnnotations (data Json)
        ──< CollaborationMedia (youtube)

Conversation ──< ConversationParticipant ──< Message ──> fans out Notification
RateLimit (actorKey, action, window) — atomic upsert; or Upstash when configured
```
- **Migrations run:** one big additive migration creating all the above + back-relations on `User`; raw-SQL steps for the partial index + the depth CHECK. **GDPR:** account-deletion extended to sweep R2 objects + Algolia + redact author emails + sole-OWNER transfer.
- **Env scaffolding (empty, committed to `.env.example`):** `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=ccm-collab`, `R2_PUBLIC_HOST`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Features feature-flag on env presence; absent = R2 upload + anon-Turnstile inert, everything else runs.

---

## Mobile-first principle (applies to ALL of the above)
Every surface is authored at 375 first (single column, drawers over sidebars, horizontal scroll for rows, full-screen sheets for modals/inbox), then progressively enhanced at `md`/`lg` (multi-column, side panels, persistent nav). Logical props throughout so RTL is correct by construction. Reduced-motion honored via the unified reveal helper (A5).
