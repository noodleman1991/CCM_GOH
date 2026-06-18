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

### Notifications + DMs

```
Bell (in header):  🔔³  → dropdown: reply/mention/reaction/message rows, "mark read"
Inbox (DMs):       ┌ Conversations ─┐ ┌─ thread ──────────────┐
                   │ ◎ Name  · 2h   │ │ messages…             │
                   │ ◎ Name  · 1d   │ │ [ type a message…  ▷] │
                   └────────────────┘ └───────────────────────┘
```
SWR polling (`refreshWhenHidden:false`), indexed unread `COUNT`. Mobile-first: inbox = list → full-screen thread (back arrow); bell dropdown = full-width sheet on mobile.

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
