# Atlas 2.0, People Surfaces, Content Weave & Collaboration Loops — Design Spec

**Date:** 2026-07-02
**Status:** approved (user: "approved as proposed")
**Branch:** feat/redesign-and-comments
**Visual proposal (mockups):** https://claude.ai/code/artifact/11728912-8efc-4fe4-a5a6-3d9d6aadab66
**Parent spec:** `docs/superpowers/specs/2026-07-01-feature-spec-and-ui-instructions.md` (Part A tokens/roles/infra govern everything here)

**Design-language rule (global):** every surface refines the existing CCM language — palette via `lib/ccm-colors.ts` resolvers only, Poppins/Lato, `rounded-lg`, existing `Card`/`SectionHeader`/`FilterChip`/`PillFilterGroup`/`DiscoveryBar` components. Status colours always paired with a text label. Targets ≥44px. Every slice validates at 375px + RTL (`ar`) with a rendered-UI screenshot gate.

## Decisions log (user-confirmed)

1. **Real-geo Atlas** — pins, geotagging by authors + editors, opt-in device location.
2. **In-house SVG map** (no map vendor) + a **LocaleMap** component: amber country highlight on the blue world, generated from country geometry.
3. **Person-card actions** (View profile + Message) + full messaging/notifications design.
4. **Build order: heavy infrastructure first** (P1 data/geometry → P2 workflows → P3 surfaces).
5. Charts/Mermaid are **server-rendered sanitised SVG** (no interactivity v1).
6. Doc comments **doc-level v1**; selection-anchored is a marked v2.
7. Review queue ships **global-staff** (`team_editor`/`admin`) with a region filter ready; region-scoped-editor authz stays an open, non-blocking decision.
8. Country geometry at **110m / 1-decimal** (~60–90KB server-side JSON, never shipped to clients as data).

---

## Track A — Atlas 2.0

### A1. Shared state & pin layer (`/atlas`)

- One URL-backed filter state: `layer · theme · region · q`. Replaces today's local `useState`; every Atlas view is linkable/back-button-safe.
- **Theme facet** added to the rail as a `PillFilterGroup` (displacement / livelihoods / youth / indigenous — sourced from taxonomy, not hard-coded).
- **Choropleth refinement:** per-region hue via `regionColor` — selected region full-strength, others tinted; keeps the accessible SVG (`role="img"`, keyboard).
- **Pin layer:** when a region is selected, geotagged items in the current layer/theme/q render as pins projected into the existing viewBox (same Natural Earth I projection constants as `build-region-map.ts`). Dense localities cluster to a count bubble. Amber = matching pin, sea = selected pin. Pin tap → item popover (title, type, `LocaleMap` mini) → detail.
- **Caption bar** (persistent, bottom): live result sentence ("14 case studies · Livelihoods · 'drought' · Sub-Saharan Africa") + "Open in {listing} →" deep-link carrying the state. Replaces the hard-coded `FACET_DESTINATION` URLs — destinations resolve through the discovery registry.
- **"Use my location"** (opt-in): one-time explainer before the browser prompt; on grant, centre map + pre-select the user's region client-side. Coordinates never persisted, never in the URL. Denied → silent fallback to the region picker, no re-prompt.
- **Mobile:** map fills the viewport; facet rail becomes a draggable bottom sheet (peek = layer pills + count; half = result list; full = all facets). Region tap snaps sheet to half.
- Empty layer state: "Nothing tagged here yet — be the first" + submit CTA (STATES §2 tone).
- **Country drill de-scoped** for this program (pins supersede it); `iso-to-region.ts` stays (used by the build pipeline).

### A2. Geotagging — the Place pattern

One reusable Sanity object `place`:

```
place {
  point: geopoint            // the coordinate
  text: string               // display name, editable ("Nakuru, Kenya")
  precision: "exact" | "city" | "country" | "region"   // author-owned
}
```

- **Adopt on:** `livedExperience`, `event`, `organization` (new), `newsPost` (optional), keeping `caseStudy`'s existing `studyLocation`/`locationText` fields mapped onto the same shape (migration aliases, no data loss).
- **Author door (submit flows):** a "Where did this happen?" step — geocode search (existing geocoding util) → suggestion list → draggable pin on a region-tinted minimap → precision picker → editable display name. Defaults: case studies `city`; **lived experiences `country`** (community safety), coarsenable any time.
- **Editor door (Studio):** same object with the map input; a **geo-coverage view** (filterable list of published docs with no `place`) so editors close gaps; a **soft warning** (never a block) when the pin and the assigned `regionalCommunity` disagree.
- **Rendering rule:** the Atlas renders at the stored precision and never finer. `region` precision keeps the item out of the pin layer entirely (counts only).
- **People are never pinned.** The People layer stays regional counts; profile city/country remains text behind `showLocation`.

### A3. `LocaleMap` component ("locale globe")

- **Pipeline:** extend `scripts/build-region-map.ts` (already loads world-atlas countries-110m + ISO mapping) to also emit `components/maps/country-geometry.json` — per-ISO-alpha-3 simplified path strings, 1-decimal, committed. Server-side only.
- **Component:** `<LocaleMap iso point label variant size />`, a **server component** rendering inline SVG. Variants:
  - `mini` (64–90px): world in `--sky` 60% tint, country in `--amber` — card corners, pin tooltips, search-row badges.
  - `panel` (~260px): + exact pin + place label — detail-page sidebars (case study, report, lived experience header, geotagged project cards).
  - `globe`: orthographic projection (d3-geo, render-time) rotated to centre the place, circle-cropped — hero decoration.
- Precision-aware: `region` precision highlights the region shape instead of a country; `exact`/`city` adds the pin.
- Zero client JS; cached with the page (ISR).

### A4. Region-page Atlas embed (`atlas-embed` block)

- New placeable block for the regional community template: map `fitSize`'d to that region's geometry, facet chips with counts, **country breakdown list** (from A3 geometry + A2 tags), untagged items shown as "across the region · n".
- Every count deep-links to `/atlas` carrying the shared state. "Open the full Atlas →" header link.
- Wiring: `templateBlocks.push({_type:'atlas-embed', region})` + a Studio config field on the regional-community-page doc (position/visibility like other grids). Register in `componentMap`.

---

## Track B — People surfaces

### B1. Person card (refine `CollaborateUserCard`)

- Keep: gradient band, overlapping avatar + ring, open-to-collaborate pill, privacy-gated rows.
- Change: **region chip first** (via `regionColor` — the card's single colour accent); org/position folded into the byline under the name; **one capped chip row** (region + 2 work/expertise + `+n`); drop the recent-projects list (lives on the profile); location line + coarse presence ("active this week") replaces the timestamp footer.
- **Footer actions (44px):** `View profile` (secondary) + `Message` (primary). Message respects `allowMessagesFrom` server-side and swaps to "Request contact" when restricted — the button is honest about what happens. Card body remains a link to the profile.
- **Same-geometry skeleton** for every card grid (shimmer via `fade-up` token) — no layout shift.
- Payload rule unchanged: privacy filtering stays server-side; the client never receives hidden fields.

### B2. Profile hero

- Navy gradient hero (the app-sidebar ramp): avatar with `--secondary` ring, name + pronouns, headline, chip row (region / open-to-collaborate / work types), action cluster **Message** (white primary) + **Follow**.
- **Stat strip:** public-only counts (case studies · projects · communities · contributions), each linking to its section (proof, not vanity). One aggregated query.
- Owner view: + Edit + completeness meter (moved out of visitors' view). Mobile: actions collapse into a sticky bottom bar.
- Body sections unchanged (already a superset of the handoff).

### B3. Collaborate space — tabs

- Tabbed shell **People · Projects · Events** (reuse the workspace top-tabs pattern), live server-rendered counts, URL-stateful (`?tab=`).
- **People:** region-grouped carousels stay, driven by `DiscoveryBar(user)` (region · workType · expertise · openToTalk) — retire the hard-coded enums in `page-client.tsx`. Cards = B1.
- **Projects:** grid of project cards — status chip (`projectColor`), description, open-call chips (`intentColor`: "Seeking · X" amber / "Offering · Y" sea), facepile + member count, "View project →" to the **public project page** (already shipped). Open-call chips read from a light `openCalls` JSON field on `Collaboration` v1 (lead-edited on the workspace Overview).
- **Events:** upcoming `event`s with one-tap RSVP (`Rsvp` exists); empty states per STATES §2 ("No one matches yet… post an open call").

---

## Track C — Content layouts & the weave

### C1. Layout chooser

- Submit-form step 1: three selectable cards **Story / Feature / Report**, each a mini-wireframe + one-line use-case caption (TAXONOMY §5). Writes the existing `layout` field (public page already branches).
- Editor override in Studio surfaces to the author as "Layout was adjusted by an editor" in the status timeline (never silent).
- Generalises to `newsPost.layout` later (marked follow-up, not in P2).

### C2. Slash-menu authoring (close the vocabulary gap)

- The renderer already supports: image placement, YouTube, code, `infoBox`, `break`, blockquote, highlight, footnote, checklists. The Tiptap editor emits almost none of it.
- **`/` Insert menu:** Image (**real upload**, not URL prompt: placement full/wide/inline-start/inline-end + caption + **required alt**), YouTube, Quote, Info box, Section break, Timeline, Chart, Diagram.
- Extend `tiptapToPortableText` (and the reverse) to round-trip every inserted type. Nested lists stay out of scope.

### C3. New Portable Text objects

- **`timeline`** — items {label, title, body}; renders with the existing `timeline-1` visual (vertical rail, dots).
- **`chart`** — {kind: bar|line|pie, data: rows, caption}; authored as a simple table editor; **server-rendered SVG** following the app's chart rules (labels always on, `tabular-nums`, CCM series colours).
- **`mermaid`** — {source, caption}; **rendered to sanitised, size-capped SVG server-side at save** (rerendered on edit); readers get static SVG — author code never executes in a reader's browser. Render failure → inline amber error card to the author, block withheld from publish.
- All three degrade to plain text in RSS/search records. Renderer additions in `createPortableTextComponents`.

### C4. Block palette additions

| Block | Surfaces | What it is |
|---|---|---|
| `atlas-embed` | regional pages | §A4 |
| `featured-story` | homepage + regional | one editor-pinned piece rendered large (image, kicker, excerpt, region chip) |
| `community-discussion` | regional pages | region thread list (Track F/parent-spec #5 engine) |
| `submit-story-banner` | homepage | handoff submit CTA with the sign-in gate built in |
| `locale-globe` | both (decor) | LocaleMap globe variant as an editorial flourish |

Each = Sanity schema + projection + `componentMap` entry (the `events-calendar` registration pattern).

---

## Track D — Projects, tasks & the approval loop

### D1. Tasks

- **`Task.dueAt DateTime?`** (new field). Due chips: amber "due Fri" / red-tint "overdue", always with the label.
- **Cross-stage drag:** wire the existing `moveTask` action into the dnd-kit `onDragEnd` (drop target = another stage's list). Mobile/keyboard fallback: "Move to…" menu.
- Assignee avatar on the row (select on click, optimistic as today).
- **My tasks** dashboard widget: assigned open tasks across workspaces (existing `[assigneeId, status]` index), stage badge via `taskColor`, row → workspace Plan.

### D2. Editor review queue (in-app) + author loop

- **Pipeline (colours via `statusColor`, labelled):** Draft → Pending review → Changes requested ⟳ → Approved · Published.
- **`/dashboard/review`** (staff-gated `team_editor|admin`, region filter present but unscoped until backlog #3 is decided): queue rows (status chip, title, type, author, origin workspace, age; resubmissions highlighted) → detail = **full publish-faithful preview** + editorial-notes textarea + **Approve & publish / Request changes / Reject**. Server actions run the same Sanity mutations as the existing Studio document actions (`sanity/actions/case-study-actions.ts` logic factored into a shared lib). Studio remains the power tool.
- **Author side:** dashboard submission card shows the pipeline with `reviewNotes` in place (revisions API already returns them), "Edit & resubmit", and a round counter.
- **Notifications:** add `NotificationType.REVIEW`; fire on every transition (submit received, changes requested, approved/published, rejected).
- `WorkspaceOutput` status cache refresh stays the sync mechanism; queue actions revalidate it.

---

## Track E — Commenting on PDFs & docs

**Boundary (stated once, enforced everywhere):** workspace annotations, page comments and doc threads are `collab:*`-gated and never rendered on public pages. Publishing copies content, never conversation.

### E1. PDF comment rail (collaborator-facing)

- Mount the existing `CommentSection` beside the EmbedPDF viewer with `targetType:"collaborationFile"`; the composer passes the **current page** into the already-supported `Comment.page` field (schema + action need zero changes).
- Comment rows show a "p. N" chip → clicking jumps the viewer to that page. "This page ▾" filter on the rail. Mobile: rail = bottom sheet under the page.
- The ✏ Annotate toggle (EmbedPDF drawing layer, COMMENTER+, autosaved blob) is unchanged — drawings and comments are siblings, both workspace-private.

### E2. Doc threads

- **v1:** doc-level comment rail per `CollaborationDoc` — new enum value `CommentTargetType.collaborationDoc`, authz mirrors `collaborationFile` (`collab:comment`). Ships with E1.
- **v2 (marked, later):** selection anchoring via a Tiptap comment mark storing the comment id (must survive the PT round-trip). Suggestions/track-changes: explicitly out of scope.

### E3. Public-facing

- Published outputs keep the moderated public `CommentIsland`. A published report with an attached PDF gets a **read-only viewer** + the standard public thread; the public composer may attach an optional "p. N" chip (same `page` field).

---

## Track F — Messages & notifications

### F1. Conversation typing (migration)

```
Conversation.kind: DIRECT | PROJECT | COMMUNITY   (new enum, default DIRECT)
Conversation.collaborationId String?  → Collaboration
Conversation.communityId     String?  → Community
```

- Migration: existing rows → `DIRECT`; group conversations matched to a workspace → `PROJECT`.
- **Project channels provision lazily** on a workspace's first "Message team" (no empty rooms). Community rooms ship with the community-discussion track and reuse `COMMUNITY`.

### F2. Grouped inbox UI

- Conversations list grouped **Direct · Projects · Communities** with per-group unread counts; project/community rows use a squared avatar tinted by `projectColor`/`regionColor`. Thread pane unchanged (bubbles, composer, delete/report, mark-read).
- Thread header: participant identity + "View profile" / "Open workspace" contextual link.
- Keep SWR polling (30s list / 12s thread). **SSE is a marked separate slice, not a prerequisite.** Moderation unchanged (block, report, staff `MessageReport` queue).

### F3. Notification preferences

- Add `NotificationType.REVIEW` (D2). Expand `NotificationPreference` to per-type email toggles + digest frequency (instant/daily/weekly); the **settings UI lands in the account-settings tabs** (parent-spec backlog #2, separate track). Verb-copy map is already complete.

---

## Cross-cutting contract

- **Fast:** server-first everywhere (ISR on public surfaces); the only client fetches are interactions; same-geometry skeletons on every loading list; no map vendor; pin layer ≤ ~15KB added JS; images via Sanity CDN with `CARD_ASPECT_SOURCE` dims; LocaleMap is server-rendered SVG.
- **Secure:** privacy filtered server-side before payload; geo precision author-owned, rendered never finer; lived experiences default country; people never pinned; device location never persisted; all CTAs on rate-limited authz-checked server actions; Mermaid/chart SVG sanitised server-side; workspace conversation never published.
- **Engaging:** every dead end gets a door (empty region → Follow; empty projects → post an open call; empty map layer → be the first); actions live where intent is; micro-motion behind `prefers-reduced-motion` guards.
- **Verification:** each slice = tests + typecheck + rendered screenshots (desktop, 375px, `ar`) before the next slice starts.

## Phasing (heavy first — user directive)

- **P1 — data & geometry:** Place model + submit map-picker + Studio parity + coverage view · country-geometry pipeline + `LocaleMap` · Atlas shared state + theme facet + pin layer + caption bar · `atlas-embed` block · `Conversation.kind` migration + lazy project channels (backend) · `CommentTargetType.collaborationDoc` + page-comment groundwork.
- **P2 — workflows:** review queue + author loop + `REVIEW` notifications · slash-menu editor + round-trip converters · timeline/chart/mermaid objects + server rendering · layout chooser · PDF comment rail + doc threads v1 · tasks (`dueAt`, cross-stage drag, My-tasks widget).
- **P3 — surfaces:** person card + Collaborate tabs · profile hero + stat strip · grouped inbox UI · new blocks (featured-story, community-discussion, submit-story-banner, locale-globe decor) · "Use my location" (last, smallest).

## Out of scope / deferred (explicit, per no-silent-caps)

- Country-drill zoom on the Atlas (pins supersede; revisit only if demanded).
- Selection-anchored doc comments (v2), suggestions/track-changes (never, by design).
- Interactive charts (v1 static SVG).
- SSE/websockets (separate marked slice).
- Region-scoped editor authz (open decision; queue ships global-staff with the filter ready).
- `newsPost.layout` archetypes (follow-up after C1 proves the chooser).
- Structured `openCalls` model (v1 is a lead-edited JSON field; a real model waits for demand).
- 50m country geometry (110m confirmed).
