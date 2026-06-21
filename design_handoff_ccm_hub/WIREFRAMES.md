# CCM Hub — Wireframe & Design Specification

Authoritative build spec for the redesigned **Connecting Climate Minds Hub**.
Companion to `SPEC.md` (decisions & rationale) and the prototype `CCM Hub Redesign.dc.html`.

Conventions used in this doc:
- **Zone maps** sketch the layout in reading order; `│ │` columns indicate side-by-side regions.
- **Dynamic** = state-driven behaviour the front end must implement.
- **States** = empty / loading / error / permission variants every screen must handle.
- **Binds** = the data each region reads (see §3 data model).
- Breakpoint **`< 980px` = mobile**: sidebar becomes an off-canvas drawer; multi-column grids collapse to one column.

---

# PART 1 — DESIGN GUIDELINES

## 1.1 Brand foundation
Tone: warm, hopeful, human, globally inclusive. Editorial-hub, not corporate dashboard. Soft organic "blob" illustration motifs over a calm blue palette. Generous whitespace; content (stories, research, people) is the hero.

## 1.2 Color tokens
Source of truth — do not hand-pick new colors.

| Token | Hex | Use |
|---|---|---|
| `--ccm-midnight` | `#0B3160` | primary text, sidebar, hero fills, primary headings |
| `--ccm-sea` | `#205596` | secondary fills, "done/published", region SSA |
| `--ccm-water` | `#4186C3` | links, accents, interactive secondary |
| `--ccm-sky` | `#9BC6DA` | soft accents, muted region (Oceania), illustration |
| `--primary` | `#4974CA` | primary buttons, active states, progress |
| `--secondary` | `#90E0F4` | cyan highlight (CTAs on dark, tab underline, stat numbers) |
| `--bg` | `#ffffff` | page background |
| `--surface` | `#F6F9FC` / `#EAF2F8` | cards-on-tint, panels, inputs |
| `--border` | `#E5E5E5` | hairlines, card borders |
| `--muted-fg` | `#737373` / `#8595AC` | secondary text |
| `--body-fg` | `#33445F` | body copy |
| amber `#E0A53F` | attention / "in review" / "seeking" |
| destructive `#E7000B` | errors, destructive only |

**Region palette** (blue family, fixed per region): enam `#0B3160` · lac `#2563ef` · nawa `#4186C3` · ssa `#205596` · csa `#3a81f6` · esea `#1a4eda` · oce `#9BC6DA`.

**Status palette** (one shared map, used for every chip/badge): grey `#8595AC` = draft/todo/neutral · water `#4186C3` = in-progress/review · amber `#E0A53F` = attention/seeking · sea `#205596` = done/published/approved.

## 1.3 Typography
- **Headings / UI / buttons:** Poppins (500–800). RTL → Lalezar (400 only).
- **Body / inputs:** Lato (400/700). RTL → Tajawal.
- Scale (desktop): h1 30–46px (hero 46), h2 24–26, h3 16–18, body 14–16, meta 11–12.5, label 10.5–11 uppercase `.05–.06em` tracking.
- Line-height: headings 1.05–1.25, body 1.55–1.9. Use `text-wrap:pretty` on titles.
- Minimum body 14px; never below 11px for any label.

## 1.4 Spacing, radius, shadow
- Spacing rhythm: 4 / 8 / 12 / 16 / 20 / 24 / 30 / 36 / 42px. Page padding 30–36px desktop, 16–20 mobile.
- Radius: inputs/buttons pill `999px`; cards `13–18px`; small chips `6–8px`; hero/illustration `18–20px`.
- Shadow (cards): `0 1px 3px rgba(11,49,96,.06)`. Elevated/modal: `0 6px 26px rgba(11,49,96,.12)`. Drawer: `0 12px 40px rgba(11,49,96,.4)`.
- Borders: 1px `#E5E5E5`. Active/selected: 1–2px in the relevant token color.

## 1.5 Core components (visual contract)
- **Button — primary:** pill, `#4974CA` bg, white Poppins 700 13–14px, h 40–46. **On dark:** `#90E0F4` bg, midnight text.
- **Button — secondary:** pill, white bg, 1px `#C3D2E4` border, midnight text. **Ghost on dark:** transparent, 1.5px white-45% border.
- **Chip / filter:** pill; inactive = white + `#E5E5E5` border + muted text; active = token-color bg + white text; leading 8px color dot where it denotes region/status.
- **Tab bar:** text buttons, active = midnight bold + 3px underline (`#90E0F4` on dark hero, `#4974CA` on white).
- **Card:** white, 1px border, radius 14–16, card shadow; media band on top; 13–20px pad body.
- **Avatar:** circle; region/role color bg; Poppins 700 initials; sizes 24/32/38/48/74.
- **Toggle:** 42×23 pill track, 19px knob; on = `#4974CA`, off = `#D8DEE6`.
- **Section header:** 6×24px rounded color bar + h2 + optional right-aligned "View all →" link.
- **Blob accent:** absolutely-positioned organic shape (`border-radius:58% 42% 55% 45%/…`), 0.4–0.55 opacity token color, behind hero content; the `ccmblob` keyframe animates one per hero.
- **image-slot:** drag-drop illustration placeholder (`<image-slot>`); every illustration spot is a slot with a distinct `id` + `placeholder`.

## 1.6 Motion
- Screen enter: `ccmrise` (9px translateY, .4s) on the screen root; section enter `ccmpop` (.3s scale .99→1).
- Carousel: `transform` translateX, .45s ease.
- One animated blob per hero (`ccmblob`, 16–18s). Respect `prefers-reduced-motion`: disable transforms, force end-state.

## 1.7 Accessibility & i18n
- Hit targets ≥ 44px (mobile). Contrast: body on white ≥ 4.5:1 (use `#33445F`/`#0B3160`, not `#8595AC`, for reading copy).
- Every content item carries a language set; UI mirrors LTR↔RTL via `dir`. Multilingual download chips on every output.
- Icons are decorative; pair with text labels. Provide `aria-label` on icon-only buttons (bell, drawer, send).

---

# PART 2 — GLOBAL SHELL & NAVIGATION

## 2.1 App frame
```
┌──────────┬────────────────────────────────────────────┐
│ SIDEBAR  │ TOPBAR (h64): title · spacer · Discover · 🔔 │
│ (navy,   ├────────────────────────────────────────────┤
│  262px)  │ MAIN (scroll region #contentScroll)         │
│          │   → the active screen renders here          │
└──────────┴────────────────────────────────────────────┘
```

## 2.2 Sidebar (navy `#0B3160`)
- **Logo lockup** (white rounded card): "connecting / climate.minds".
- **Search pill** (white, full-width) — universal search; typing routes to Search screen live.
- **Nav groups:** Home · Collab space · Messages(badge) · Atlas & Explore · — · Case Studies · Regional Communities · News & Updates · Lived Experiences.
- Active item: white text, `rgba(255,255,255,.15)` pill. Inactive: 82% white.
- **Footer:** About · Feedback links; **user chip** → Dashboard (avatar + name + "Dashboard & account").
- **Mobile:** off-canvas drawer (transform translateX), triggered by topbar ☰; dark scrim closes it.

## 2.3 Topbar
- Screen title (Poppins 700 15). **Discover** pill → Collab. **🔔 bell** (dot when unread) → Notifications.
- Mobile: ☰ button precedes title.

## 2.4 Navigation logic
- Single `screen` state switches the main region (SPA). Active-nav highlight maps several screens to one nav item: `inCollab = {collab, workspace, projectpublic, content}` → Collab; `inCases = {cases, casedetail}` → Case Studies; `lived↔Lived`, etc.
- Detail screens (`casedetail`, `projectpublic`, `thread`, `lived` detail) provide a **back** affordance to their list.
- **Production:** back this with real routing/URLs (`/atlas`, `/case/:id`, `/project/:id`, `/region/:slug`, `/lived/:id`) so links are shareable and SEO-able for public content.

---

# PART 3 — DATA MODEL (entities & key fields)

```
User        { id, name, initials, avatarColor, role, region, place, bio,
              prompts:[{q,a}], experience:[{role,org,yrs}],
              publications:[{title,venue}], collabStatus:{seeking?,offering?},
              communities:[regionId], privacy:{visibility, whoCanMessage,
              requireRequest, showEmail}, notifPrefs:{...}, sectionVisibility:{...} }
Region      { id, name, short, color }                       // 7, fixed
Project     { id, title, lead, members[], status(Active|Recruiting),
              visibility(Public|Private), homeRegion, alsoCommunities[],
              about, openCalls:[{text}], outputs[], plan, tasks[], files[],
              channels[], events[] }
Content     { id, type(case|news|lived|research|funding|meeting|ad),
              title, author, region, theme[], population[], hero,
              template, blocks[], stage(draft|review|published|final),
              versions:[{label, langs:[{code,size,url}]}],
              links:[{kind(project|event|region|content), id}], comments[] }
LivedExp    extends Content { medium(Video|Audio|Written), who, place, transcript? }
Event       { id, title, scope(Community|Project), link, date, location,
              rsvps[], calendarFeedUrl }
Thread      { id, scope, title, tag, posts:[{author,text,time,likes}], anchor? }
Message     { conversationId, kind(channel|dm), author, text, time, attachments[] }
Task        { id, stage, text, assignee, status(todo|doing|done) }
Notification{ id, group(Requests|Today|Earlier), icon, actor, text, time, actionable }
Annotation  { fileId, anchor(p.X ¶Y), author, text, resolved, replies[] }
```
Taxonomy facets shared everywhere: **region · theme · population · contentType · stage · status · visibility · scope** (§1.2, SPEC §3).

---

# PART 4 — SCREEN-BY-SCREEN WIREFRAMES

> Each screen: **Purpose · Zone map · Dynamic · States · Binds.**

## 4.1 Home  (`home`)
**Purpose:** orient newcomers + showcase outputs and the Collab space in tandem; entry to everything.
```
[HERO navy, blob + welcome illustration right]
  h1 "Where mental health & climate change research unite"
  intro · [Create an account][Enter Collab space]
  ── feature CAROUSEL: tag pill + rotating title + dots (auto 4.2s)
[stats strip: 960+ · 90 · 7]
[TANDEM grid 1.6fr/1fr]
  L: "Latest outputs" card grid (type badge, region, title)
  R: "Collaborate" panel — People (region, seeking/offering) + Open projects
[story of the hub — tinted panel + blob + Global Agenda CTA]
[Explore by region — Atlas blob map (clickable)]
[NEWS 1.5fr / EVENTS 1fr]
  L: news media-list (thumb, region dot, date, headline)
  R: month calendar (event days tinted) + upcoming list + Subscribe
[Lived experiences CAROUSEL + "Submit a story" banner]
[Funder/partner strip — logo image-slots]
```
**Dynamic:** hero carousel auto-advances (pause on `prefers-reduced-motion`); dots jump. Lived carousel ‹ › arrows. People widget = live cut "members in your region seeking/offering". Region blob → Atlas filtered.
**States:** logged-out shows Create-account CTA; logged-in swaps hero CTA to "Resume" + personal feed. Empty news/events → "Nothing scheduled yet."
**Binds:** homeOutputs, homePeople, homeProjects, homeNews, homeEvents, calDays, livedCards, regionCells, heroFeatures.

## 4.2 Sign-up & onboarding  (`signup`)
**Purpose:** create account + personalize (region, role, interests, collab intent).
```
[2-col: form left (1.6fr) · illustration panel right (navy)]
 Step dots (4) + "Step n of 4"
 0 Account: name · email · password
 1 Region (chips) + Role (pills)
 2 Interests: theme + population pills
 3 Collab intent: Seeking / Offering / Just exploring (radio cards)
 [Back] [Continue]…[Enter the hub →]
```
**Dynamic:** step index drives panel; progress dots fill; last step → Home. Selections seed profile + personalized Atlas/feed.
**States:** validation per field (prototype static); social-auth options optional; mobile hides illustration panel.
**Binds:** onbStep, regionCells, rolePill(A).

## 4.3 Dashboard (personal)  (`dashboard`)
**Purpose:** the member's private home — work, requests, schedule.
```
[header: "Welcome back, {name}" · Public profile · Account settings]
[TANDEM 1.6fr/1fr]
 L: My projects (open →) · My tasks (across projects, status dot) · My content drafts (stage badge → editor)
 R: Messages card (unread count → Messages) · Upcoming events
```
**Dynamic:** tasks aggregate `assignee==me & !done`; drafts link to content editor at the right stage; counts live.
**States:** no projects → "Start or join a project" empty card; no drafts → prompt to create content; no requests → hide Requests.
**Binds:** myProjects, myTasks, myDrafts, homeEvents, unreadCount.

## 4.4 Profile (public)  (`profile`)
**Purpose:** how others see a member; basis for discovery & contact.
```
[HERO navy: avatar · name · role·region·org · collab-status chip · Edit profile · My dashboard]
[TANDEM 1.6fr/1fr]
 L: About · "In my words" (chosen prompts) · Experience timeline ·
    Publications & outputs (+ output cards) · Lived experiences shared
 R: "You control each section" note → settings · Projects (Shown badge) ·
    Communities · Collaboration (Seeking/Offering) · Events
```
**Dynamic:** sections honour `sectionVisibility`; viewer sees Connect/Message subject to privacy; owner sees Edit. Output/lived cards open their detail.
**States:** viewer vs owner; private profile → minimal card + "request to connect"; empty sections hidden.
**Binds:** profilePrompts, profileExperience, profilePublications, profileLived, myProjects, profileCommunities, profileEvents, homeOutputs.

## 4.5 Account settings  (`account`)  — TABS
**Purpose:** edit identity, notifications, privacy.
```
[← Dashboard]  h1  [Tabs: Profile · Notifications · Privacy & contact]
 Profile:   profile detail fields + Save · "Profile sections" visibility toggles
 Notifications: per-type toggles (mentions, project activity, events, requests, digest)
 Privacy & contact: visibility (Public/Members/Private) · who-can-message ·
                     require-request toggle · show-email toggle
```
**Dynamic:** tab switch; toggles persist; section toggles mirror Profile visibility.
**States:** unsaved-changes guard; destructive (delete account) under Privacy with confirm.
**Binds:** acctTab, accountFields, notifPrefs, sectionToggles.

## 4.6 Collab space  (`collab`)  — Projects / People / Events
**Purpose:** discover collaborators, projects, events. The heart of collaboration.
```
[header: "Find people, projects & events" · Start a project]
[Tabs: Projects · People · Events]   [Region filter chips]
 Projects: card grid — status + visibility chips · title · about · lead·region ·
           open-call callout (📣) · [Open workspace | View project →]
 People:   card grid — avatar · name · role·place · status pill (Seeking/Offering/Member) ·
           [Connect][Message]
 Events:   subscribe-to-calendar bar · event cards (date block · scope chip ·
           title · meta · part-of link · [RSVP][+ Calendar])
```
**Dynamic:** tab + region filter compose; project card routes by ownership; People/Connect respects privacy; Events RSVP + calendar export.
**States:** filter empty → "No matches in this region"; private projects show lock + "invite only".
**Binds:** collabTab, projList, ppl, evList, regionCells.

## 4.7 Project — public page  (`projectpublic`)
**Purpose:** non-collaborator view of a project; recruiting & outputs surface.
```
[← Collab][HERO navy: "Public project page" · title · region·status·visibility·members ·
           about · [Request to join][Follow]( [Open workspace] if member )]
[open-call banner (📣) if recruiting]
[Published outputs grid] · [Team chips]
```
**Dynamic:** Request-to-join opens a prompt modal → lead notification; Follow = subscribe; member sees workspace entry. Outputs open detail.
**States:** member vs non-member vs follower; private project → request-only stub.
**Binds:** pp* (title/about/lead/members/status/vis/region/looking/mine), regionCasesList, teamRoles.

## 4.8 Project workspace  (`workspace`)  — Home / Conversation / Documents
**Purpose:** where collaborators do the work.
```
[HERO navy: breadcrumb · title · region chip · member avatars · "View public page →"
            · Tabs: Home · Conversation · Documents]
 HOME: L(1.7fr) Research plan (stages→tasks, inline edit) · Tasks(kanban) ·
        Case-study submissions (CMS status)
       R(1fr) Team & roles(+invite) · Upcoming events · Linked outputs
 CONVERSATION: channels/DMs rail · message thread · files-in-channel rail
 DOCUMENTS: file list · viewer (version + language switcher) · annotations rail
```
**Dynamic:** tab switch; **tasks** fully editable inline (cycle status, move between plan steps, delete, add); plan step auto-completes when all its tasks done; document viewer switches version (Summary/Full) × language (EN/FR/AR/ES); annotations anchor to passages; submissions show pipeline stage.
**States:** empty plan/tasks/files prompts; permission: only collaborators; viewer role read-only.
**Binds:** wsTab, plan/planStages, taskCols→inline tasks, submissions, teamRoles, events, linkedOutputs, channels, convMsgs, files, annotations/threads.

## 4.9 Content editor  (`content`)
**Purpose:** author any content type from a template; route to CMS review.
```
[L: source/annotations rail] [C: block editor canvas] [R: settings rail]
 Top: content-type · Template picker (keeps content, reflows) · Export · pipeline status
 Canvas: lead/standfirst + blocks (heading/text/quote/image/video/audio/table/embed),
         drag-reorder, +Add block
 Right: Pipeline (draft→review→published) · multilingual versions ·
        Connections (link Project/Event/Region/content) · reviewers · Submit
```
**Dynamic:** template switch reflows only; blocks editable + reorderable; **Submit** → "In Sanity review"; reviewer feedback returns as annotations; Connections render as chips on the public page.
**States:** draft vs in-review (locked-ish) vs published; internal types never publish (stop at Final); validation before submit.
**Binds:** contentId, cBlocks, cTemplates, cConnections, pipeline, sourceAnnos, reviewers.

## 4.10 Atlas & Explore  (`explore`)
**Purpose:** geo-faceted discovery across all content/people/projects/events.
```
[header: "Explore … across the world"]
[L facet rail: Data layer · Theme chips · Region list(+counts)] [R: stylized blob map]
[results title + "Open in Case Studies →"] [result card grid]
```
**Dynamic:** **one shared filter state** (layer · theme · region · q) drives map counts, selection caption, and results; clicking a region blob filters; **region→country drill** (to build) zooms to show pinned content only. Layer toggles change what counts represent.
**States:** no results in selection → empty caption; loading skeleton blobs (hint-placeholder-count 7).
**Binds:** layers, themes, regionCells (+blobStyle), selectionLabel/Sub, resultsTitle, exploreCases.

## 4.11 Case Studies  (`cases`)  — Gallery / Map
**Purpose:** browse impact stories; gallery + map share one search & filter.
```
[header + count] [Gallery | Map toggle]
[shared filter bar: Region chips · Theme chips]
 Gallery: masonry of reusable card layouts — Feature · Quote · Wide · Standard
 Map: result list (left) + stylized blob map (right), same filter
```
**Dynamic:** region+theme+q filter both views; cards open detail; map and gallery share state.
**States:** no matches → empty message; CMS = published only.
**Binds:** casesView, galleryCases (layout flags), regionCells, themes.

## 4.12 Case study detail  (`casedetail`)  — Editorial / Feature / Report + Mobile + Comments
## 4.12 Case study detail  (`casedetail`)  — Story / Feature / Report + Mobile + Comments
**Purpose:** read a published output; demonstrates reusable public layouts.

**Layout archetypes — chosen by the DOMINANT content element** (the switcher shows a one-line use-case caption for the active layout, so authors pick on meaning, not name). The same three archetypes are reused across content types (a News post offers Brief/Feature/Story; a research output offers Report/Story):
- **Story** (narrative + photography) — full hero → single centered reading column. Use when there's a human story carried by imagery.
- **Feature** (one bold statement) — split navy title panel | media + body. Use for a flagship piece carried by one strong image + headline.
- **Report** (evidence + data) — reading column + sticky "At a glance" panel (region, source, type, figures). Use for research-heavy outputs with findings and references.
```
[bar: ← Case Studies · Layout: Story|Feature|Report · ▢ Mobile]
[caption row: "{Story|Feature|Report} — {use-case sentence}"]   ← updates with selection
 Story:   full hero → centered card body (blocks)
 Feature: split navy title panel | media + body
 Report:  body + sticky "At a glance" sidebar
 Mobile:  phone frame, single column (all archetypes collapse to one column;
          Feature stacks title→media→body, Report's panel moves below)
[Comments section (public thread + composer)]
```
**Dynamic:** layout switch re-renders the SAME blocks (content is layout-agnostic); caption updates; Mobile toggle shows phone frame; comments thread.
**States:** layouts; logged-out can read, must sign in to comment.
**Binds:** csLayout*, csLayoutName/Icon/Caption, csMobile, cdBlocks, cdTitle/Author/Img/Region, caseComments.

## 4.13 Regional community  (`region`)
**Purpose:** a region's public home — agenda, content, lived experience, team, discussion, embedded Atlas.
```
[HERO navy + blobs: "Regional Community of Practice" · region · intro ·
        Get involved / Open workspace · stats]
[public/member split note]
 Regional agenda (download card + why-join)
 Case studies from the region (grid)
 FEATURED STORY rendered from block components
 Lived experience insights (video wall)
 The regional team (photo grid)
 Community discussion (thread list → thread)
 [+ embedded Atlas focused on this region]
```
**Dynamic:** threads open thread screen; cards open details; agenda has multilingual chips; member-only sections gated; Atlas embed pre-filtered to region.
**States:** public vs member (member sees workspace, post composer); empty discussion → "Start the first thread".
**Binds:** regionAgendaImg, regionCasesList, featuredBlocks, livedList, teamList, regionThreads, regionProjects, regionEvents.

## 4.14 News  (`news`)
**Purpose:** global + regional news/updates.
```
[header] [filter: All · Global · region chips]
[lead story (large) + latest list]
```
**Dynamic:** region filter recomputes lead + list; cross-posted regional news tagged; cards → article (news template detail).
**States:** filter empty → message.
**Binds:** newsRegion, leadNews, newsList, regionCells.
**To build:** news article detail using News template (Standard/Feature/Brief), author/date meta, connections chips.

## 4.15 Lived Experiences  (`lived`)  — index + detail
**Purpose:** stories of grief/resilience/hope; member & project submissions.
```
 index: [HERO navy + "Share your story"]
        Featured carousel (‹ ›) · All stories grid (kind badge: Video/Audio/Written)
 detail: [← Lived] kind chip · title · who·place ·
        media (video poster / audio player / written prose) · body · "Part of: region"
```
**Dynamic:** carousel arrows; cards open detail; medium drives detail layout; Share/Submit → content editor (lived templates) → CMS review.
**States:** index vs detail (`livedId`); empty → "Be the first to share".
**Binds:** livedIndex/livedShowDetail, livedCards, livedTrackStyle, livedDetail.

## 4.16 Messages / Inbox  (`messages`)
**Purpose:** unified inbox — conversations AND notifications in one place, switched by a segmented control.
```
[Inbox title · segmented: Conversations | Notifications •count]
 Conversations: [L list grouped: Project · Community · Direct (unread badges)] [R conversation + composer]
 Notifications: centered feed — groups (Requests · Today · Earlier);
                rows = avatar (initials) + type-dot · "{actor} {action}" · time;
                Request rows have [Accept][Decline][View]
```
**Dynamic:** `msgView` toggles Conversations/Notifications; sidebar "Notifications" + bell deep-link to `msgView:'notifs'`; Accept/Decline dismiss the request; select conversation; grouped by source; unread counts; composer (static in proto).
**States:** empty inbox → "No conversations yet"; no notifications → "You're all caught up".
**Binds:** msgChats/msgNotifs, msgChatsTab/msgNotifsTab, convGroups, convMsgs, notifFeed, notifCount, activeConvLabel/Sub, msgGrid.

## 4.17 Discussion thread  (`thread`)
**Purpose:** a community discussion (also the shared thread component for comments/annotations).
```
[← region] tag chip · title · posts (avatar, author, time, text, Reply/Like) · reply composer
```
**Dynamic:** posts list; reply; like. Reused model for content comments & doc annotations (`Thread{anchor?, posts[]}`).
**Binds:** thTitle/Tag, threadPosts.

## 4.18 Search results  (`search`)
**Purpose:** universal search across content, projects, people, regions.
```
[h1 Results for "q" · count] [grouped: Content · Projects · People (· Regions)]
```
**Dynamic:** live as user types in sidebar search; grouped sections; each result routes to its detail.
**States:** zero → "Type to search…"; no matches → "Nothing found".
**Binds:** q, sTotal, sCases, sProjects, sPeople, sRegions.

## 4.19 Notifications — now inside Messages/Inbox
**Notifications are no longer a standalone screen.** They live as the **Notifications tab of the Inbox** (§4.16): the sidebar "Notifications" entry and the bell deep-link to `messages` with `msgView:'notifs'`. Grouped Requests · Today · Earlier; Request rows are actionable (Accept/Decline). Rationale: requests, replies and updates belong next to the conversations they spawn.
**Binds:** notifFeed (mapped with Accept/Decline handlers).

---

# PART 5 — COMPONENT LIBRARY (reuse map)
| Component | Used on |
|---|---|
| AppShell (sidebar+topbar) | every screen |
| SectionHeader (bar+title+link) | home, region, dashboard, collab… |
| ContentCard (4 layouts) | cases, home, profile, region, search |
| PersonCard | collab People, search, home people |
| ProjectCard | collab, search, dashboard, profile |
| EventCard + MiniCalendar | home, collab, dashboard, region |
| Thread (posts+composer) | thread, case comments, doc annotations |
| FilterBar (region/theme chips) | atlas, cases, collab, news |
| BlobMap | atlas, cases-map, home, region-embed |
| Carousel | home (hero, lived), lived index |
| Toggle / Tabs / Chip / Avatar / Button | global |
| image-slot | home, lived, region, partner strips |
| VersionLangSwitcher | workspace docs, content editor, output pages |

Build these **once**; every screen composes them. (Prototype inlines styles for streaming; production = real component lib with the §1.2 tokens.)

---

# PART 6 — KEY INTERACTION FLOWS
1. **Discover → join:** Atlas/Collab filter → Project public page → Request to join (prompt) → lead Notification → Accept → collaborator (workspace+channels).
2. **Produce content:** workspace draft → content editor (template + blocks + connections + versions) → Submit → Sanity review → editor approves → published → appears in Cases/News/Lived + Atlas + linked project/region.
3. **Lived experience submission:** member/project → Share a story → lived template → review → published to Lived + region.
4. **Events:** create (scope=community/project) → appears in Collab/region/home calendars → RSVP + add/subscribe calendar.
5. **Discussion & feedback:** community thread (region) · public comments (content) · doc annotations (workspace) — one Thread model; reviewer feedback routes back into the project.
6. **Contact:** Connect/Message gated by privacy; require-request → note → accept → DM.

---

# PART 7 — RESPONSIVE RULES
- `< 980px`: sidebar→drawer (☰ + scrim); all `1.x fr / 1fr` tandem grids → single column; card grids `auto-fill minmax(~220–300, 1fr)` naturally reflow; hero illustration hidden; messages list stacks above conversation; content layouts collapse per §13.
- Touch targets ≥44px; carousels swipeable; filter bars wrap.

---

# PART 8 — LOGIC AUDIT  (verified against prototype, this revision)
Runtime-checked, all ✅:
- **Routing** — all 19 screens reachable via sidebar/topbar/cards; titles map complete (no blank topbar / no unresolved-var warnings); console clean.
- **Shared filter state** — region/theme filter persists across Atlas ↔ Case Studies ↔ Collab (confirmed: filtering to Latin America carried from Cases into Collab, showing only that region's project; "All" clears it). This is the intended one-filter model (§4.10, SPEC §6).
- **Filter composition** — Case Studies gallery 9 → 1 when region=Latin America; recomposes live.
- **Detail routing** — case cards open `casedetail` with Editorial/Feature/Report/Mobile toggles + comments; project "Open workspace" (mine) vs "View project" (others) route correctly.
- **Inline tasks** — Add task (per stage), status cycle (todo→doing→done, wraps), move between steps, delete all mutate state; plan step auto-completes when all tasks done.
- **Workspace tabs / Account tabs / Collab tabs / Atlas layers** — all switch correctly.
- **Carousels** — hero auto-advance + dots; lived ‹ › arrows.

Outstanding build items (not bugs) tracked in `SPEC.md` §2 (⚠️/♻️: About/Feedback pages, Discover-vs-Collab dedupe, stale `renderVals` data cleanup, Atlas region→country drill) and §7 (build order). News article detail (News template) and the unified tag/color split (Theme vs Population) remain to implement.
