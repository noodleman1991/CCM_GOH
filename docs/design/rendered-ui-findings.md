# CCM Hub — Rendered-UI Findings & Design Review

**Date:** 2026-06-18
**Method:** Live capture against the running dev server (`localhost:3000`) via Playwright (Chrome for Testing), authenticated session. 26 full-page + viewport screenshots at 1440 / 768 / 375 px, in `en` and `ar` (RTL).
**Screenshots:** [`docs/design/screenshots/`](./screenshots/) — referenced per surface below.
**Scope:** Observation + spec only. The one code change made this session (the `ExpandableGrid` intl crash) is documented in §A; everything else is a proposal, no code touched.

Design direction is **evolution within the existing CCM language** (palette sky/water/sea/midnight; tokens in `lib/design-tokens.ts`; reuse `SectionContainer`, `Card`, `Badge`, `FilterChip`, shadcn). Everything is CMS-driven / block-composable. Logical CSS props (`ms/me/ps/pe`, `-start/-end`) throughout — never physical (`ml/mr`).

---

## A. Cross-cutting issues (fix once, benefits every surface)

### A1. ⚠️ Fixed this session — `ExpandableGrid` intl crash
**Symptom:** `Failed to call useTranslations because the context from NextIntlClientProvider was not found` at `components/blocks/grid/expandable-grid.tsx:27`.
**Cause:** a `"use client"` component called `useTranslations('regional')`; pages that render `grid-row` blocks without a client intl provider (the regional-community pages `/[locale]/communities/[slug]`) threw on render.
**Fix applied:** removed `useTranslations` from the client component; the async server parent `grid-row.tsx` now resolves labels via `getTranslations({ locale, namespace: "regional" })` and passes `expandLabel`/`collapseLabel` as props. Keys exist in all 4 locales. **Validated** against rendered `/en/communities/sub-saharan-africa` — page renders, error gone.
**Principle for the redesign:** client page-builder blocks must not depend on intl context that isn't guaranteed present. Resolve i18n in the server block and pass strings down.

### A2. ⚠️ CSP blocks all user avatars (`images.clerk.dev` + `gravatar.com`)
**Symptom:** Every avatar across collaborate, the community "regional team", and many profile cards renders as a blank gray circle. Console shows (per image):
`Loading the image 'https://images.clerk.dev/uploaded/…' violates … img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://img.clerk.com`. The collaborate page alone logged **23 errors** — all this.
**Cause:** `next.config.mjs:55` `img-src` allows `img.clerk.com` but **not** `images.clerk.dev` (legacy Clerk CDN that Clerk still serves user uploads from) or `www.gravatar.com` (Clerk's fallback avatar). Note the inconsistency: `images.clerk.dev` *is* in the Next image `remotePatterns` (`next.config.mjs:95`) but missing from the CSP — so the optimizer accepts the URL and the browser then blocks it.
**Fix:** add `https://images.clerk.dev` and `https://www.gravatar.com` to the `img-src` directive. One line:
```
"img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://img.clerk.com https://images.clerk.dev https://www.gravatar.com",
```
This is the single highest-leverage visual fix — it restores avatars on collaborate, dashboard, community team, and profiles simultaneously. (Confirm the exact upload host in your Clerk instance; newer instances use `img.clerk.com`, older uploads resolve to `images.clerk.dev`.)

### A3. Arabic / RTL containment & bidi (from `profile-ar-mobile`, `profile-ar-desktop`, `news-list-ar-*`, `homepage-ar-*`)
Concrete, reproduced problems:
- **Bidi name mangling:** "Amit Lockshinsky" renders as **"Lockshinsky Amit"** on the Arabic profile (header + breadcrumb). A Latin-script name dropped into an RTL paragraph gets reordered by the bidi algorithm. Fix: wrap user-supplied proper nouns / Latin runs in `<bdi>` (or `dir="auto"` on the name element) so they're treated as an isolated neutral run.
- **Untranslated labels persist in RTL:** on `/ar/profiles/amit3`, "Wageningen, Netherlands", "Member Since", "Location", "Skills", "Communities", "bio", and the stat labels all stay English inside the Arabic page. Several are hardcoded strings, not `t()` calls (e.g. statistics card labels, "View Project", "Ongoing" in the profile template). Fix: route every visible label through `next-intl`.
- **Number/word order:** "7 months" → "months 7" in RTL. Use locale-aware formatting (`Intl.NumberFormat` / translated templates with the number as a placeholder), not string concat.
- **Region badge overflow risk:** at 375 the short region ("شمال أفريقيا وغرب آسيا") fits, but long region names ("أمريكا اللاتينية ومنطقة البحر الكاريبي") will overflow narrow sidebar/badge containers. Fix: badges that hold region/community names need `max-w-full`, `whitespace-normal`, `break-words`, and logical padding — they currently assume single-line short labels.
- **Section headings mixed-locale:** news list shows "Featured News" (English) above "أحدث الأخبار" (Arabic) on the same `/ar` page — one heading is translated, the other isn't.

### A4. Unify image cropping (hotspot-aware)
Content images (news hero, case-study figures, grid card thumbnails) crop inconsistently — some respect the Sanity hotspot, some hard-crop center. Adopt a single `urlForCropped(image, { width, height })` helper that always passes `.fit('crop').crop('focalpoint')` with the asset's hotspot, and use it in every `grid-*` card and the portable-text image serializer. This makes faces/subjects stay in frame across all aspect ratios and both LTR/RTL.

### A5. Unify motion (one reduced-motion-aware language)
Two motion systems coexist: hero blocks use CSS `fade-up` with **no** `prefers-reduced-motion` guard; other blocks use framer-motion (`BlurFade` on the profile page) **with** the guard. Result: inconsistent feel + an accessibility gap (the CSS heroes animate even when the user asked for reduced motion). Propose a single shared helper — e.g. `useReveal()` / a `<Reveal>` wrapper — that:
- reads `prefers-reduced-motion` once and disables transforms/opacity transitions when set,
- exposes the same `delay`/`direction` API the blocks already use (`BLUR_FADE_DELAY` cadence),
- is applied uniformly to hero + section blocks so the whole page shares one reveal rhythm.

### A6. Heading hierarchy is flat on detail pages
News-single and case-study bodies render portable text with weak visual stepping between `h2`/`h3`/`body` (see `news-single-en-desktop`, `case-study-en-desktop`). Define the portable-text heading scale from `heading()` tokens so detail pages match the rest of the design language, and give body copy a readable measure (see A7).

### A7. Detail-page reading measure
News-single and case-study bodies run nearly the full content width on desktop (~900px+ of unbroken text). Cap the prose column at ~65–72ch (`max-w-prose`) and center it, with figures/callouts allowed to break out wider.

---

## B. Per-surface findings & proposed layout

> Each surface: **Current** (grounded in the screenshot) → **Proposed** → **ASCII wireframe** → **Tokens/components** → **Responsive/RTL**.

### B1. Homepage
`homepage-en-desktop` · `homepage-en-tablet` · `homepage-en-mobile` · `homepage-ar-desktop` · `homepage-ar-mobile`

**Current:** Clean block stack — hero, "Prioritizing Global Research", collaborative-space, interdisciplinary-research cards, "Stories of grief, resilience, and hope" (LE row), **"Regional communities driving global research"** (a 7-up grid of region thumbnail cards — *not* the interactive map), latest news, funders, "Who is involved" marquee. RTL mirrors correctly (hero illustration flips, nav moves to the inline-end). Mobile stacks to single column cleanly. This is the strongest surface already.

**Proposed (evolution):**
- Replace the static region-thumbnail grid with the **interactive `region-map` block** (it already exists, see §B8) — the homepage is the natural home for the "where is this happening" overview. Keep the grid of region links *below* the map as the click targets, or fold them into the map's data panel.
- The marquee ("Who is involved") should pause on hover/focus and respect reduced motion (A5).
- Everything else: keep. Apply A4 (cropping) to the interdisciplinary-research and news cards.

```
┌───────────────────────────── hero ─────────────────────────────┐
│  H1 welcome + intro            [ illustration ]                  │
├─────────────────────────────────────────────────────────────────┤
│  Prioritizing Global Research            (text + figure)         │
├─────────────────────────────────────────────────────────────────┤
│  Interdisciplinary research  [card][card][card]                  │
├─────────────────────────────────────────────────────────────────┤
│  Stories of grief… (LE netflix row →→)                           │
├───────────────── Regional communities ──────────────────────────┤
│   ┌───────── interactive map ─────────┐  ┌── data panel ──┐      │
│   │  choropleth (facet-shaded)        │  │ ranked regions │      │
│   └───────────────────────────────────┘  └────────────────┘      │
│   [region link][region link]… (or inside panel)                  │
├─────────────────────────────────────────────────────────────────┤
│  Latest news  [card][card][card]                                 │
│  Funders / Who is involved (marquee, pausable)                   │
└─────────────────────────────────────────────────────────────────┘
```
**Tokens/components:** `SectionContainer`, existing grid blocks, `RegionMapBlock`. **Responsive/RTL:** map+panel stack on mobile; marquee direction follows `dir`.

### B2. News list
`news-list-en-desktop` · `news-list-en-mobile` · `news-list-ar-desktop` · `news-list-ar-mobile`

**Current:** Filter bar (search + date-range chips "Any time / Past year / Past 5 years" + Filters). **Featured News** = 2 large text-only sky cards. **Latest News** = 3-col grid mixing site articles and external-source cards. The **"CCM" badge** (blue pill, top-start of on-site cards) is present — user wants it removed. External cards carry a source label + logo ("The Conversation"). RTL: cards mirror, but "Featured News"/"Latest News" headings stay English on `/ar`.

**Proposed:**
- **Drop the "CCM" badge** entirely. Differentiate site vs external by a subtler signal: external cards keep the **source name + favicon** and a small ↗ "external" affordance; site articles get *no* badge (absence = ours). This reduces visual noise and removes the redundant self-branding on our own site.
- Keep Featured (2-up) → Latest (3-up) hierarchy. Give featured cards an optional image slot so they don't read as empty blue boxes when an image exists.
- Translate the section headings (A3).

```
┌ search ─────────────┐ [Any time][Past yr][Past 5]  [Filters]
Featured
┌───────────────┐ ┌───────────────┐
│ title (img?)  │ │ title (img?)  │
└───────────────┘ └───────────────┘
Latest
┌────────┐ ┌────────┐ ┌────────┐
│ img    │ │ img    │ │ img    │
│ title  │ │ title  │ │ ↗ Source│  ← external: source+favicon, no "CCM" on ours
│ date·by│ │ date·by│ │ title  │
└────────┘ └────────┘ └────────┘
```
**Tokens/components:** `FilterChip` (date range), `Card`, `Badge` (source only), `grid-news` / `grid-external-source`. **Responsive/RTL:** 3→2→1 cols; chips wrap; source row uses `ms/me`.

### B3. News single
`news-single-en-desktop` · `news-single-en-mobile`

**Current:** Back link → centered title → meta (date·author·tags) → full-bleed hero image → highlighted "key takeaway" callout → single wide column of portable text. Readable but body runs too wide on desktop; heading stepping is flat.

**Proposed:** Cap prose at ~68ch centered (A7); keep hero full-bleed above it. Strengthen `h2/h3` scale (A6). Keep the takeaway callout (good pattern) and make it a reusable portable-text block. Tags become `Badge`s linking to filtered news. Add a slim "Share" + "Back to news" footer.

```
‹ Back to news
        ╭───────────── H1 (centered) ─────────────╮
        date · author · [tag][tag]
[──────────────── hero image (full-bleed) ───────────────]
        ╭ key-takeaway callout ╮
        │ ……………………………………… │
        ╰──────────────────────╯
        body  (max-w ~68ch, centered)
        ‹ Back to news ›            [Share]
```
**Tokens/components:** portable-text renderer, `heading()`, callout block, `Badge`. **Responsive/RTL:** single column already; ensure callout border + share icons use logical sides.

### B4. Lived experiences — gallery + **video modal**
`lived-exp-en-desktop` · `lived-exp-modal-en-desktop` · `lived-exp-modal-en-mobile`

**Current gallery:** "Netflix" rows grouped by regional community (Central & Southern Asia, Eastern & SE Asia, Europe & N. America, Latin America, Oceania, Sub-Saharan Africa), each a horizontal-scroll row of portrait cards with long titles ("Samridha's Lived Experience story — Mental health impacts of climate change — Nepal and India") + tags. Scroll-forward chevrons. "N videos" counts. Solid pattern.

**Current modal (the key redesign ask):** ⚠️ It is **almost empty**. On open it shows only a camera-icon placeholder + **"This video requires cookie consent to play."** + an "Accept All" button, then a **huge title that overflows to the very bottom edge** with no padding. **No person details, no story, no region, no tags.** On mobile the title alone is 6 lines and the modal is essentially a cookie wall. For users who haven't consented, the modal shows *nothing but a placeholder* — a poor and slightly disrespectful first impression for first-person testimony.

**Proposed modal (respectful, person-centered):**
- Two-region modal: **media** (top/inline-start) + **context** (bottom/inline-end).
- **Person header:** name, region, a short respectful descriptor (e.g. "Lived-experience expert · Nepal & India"). Avatar/portrait if available.
- **Story:** the person's own framing of the issue (a short statement / pull-quote) rendered as text *regardless of video consent*, so the modal is meaningful even before/without playback.
- **Video:** when consent is given, embed plays in the media region; before consent, show a clear, kind consent prompt *inside the media frame only* (not as the whole modal), with the story still readable beside it.
- **Tags** (climate-change, mental-health) + a **"Share"** CTA.
- Title: constrained, with padding; never the dominant element.

```
DESKTOP modal                          MOBILE modal (stacked)
┌──────────────────────────────────┐   ┌───────────────────────┐
│ [✕]                              │   │ [✕]                   │
│ ┌─ media ─────┐  Person Name     │   │ Person Name           │
│ │  video /    │  Region · role   │   │ Region · role         │
│ │  consent    │  ─────────────   │   │ ┌─ media / consent ─┐ │
│ │  prompt     │  "their story    │   │ │                   │ │
│ └─────────────┘   in their words"│   │ └───────────────────┘ │
│  [climate][mental-health] [Share]│   │ "their story…"        │
└──────────────────────────────────┘   │ [tags]        [Share] │
                                        └───────────────────────┘
```
**Tokens/components:** shadcn `Dialog`, `Badge`, `Avatar`, existing consent gate (scope it to the media frame). **Responsive/RTL:** stack on mobile; media on inline-start at lg; consent prompt and tags use logical sides; title `text-balance`.

### B5. Case study single
`case-study-en-desktop` · `case-study-en-mobile`

**Current:** Title + meta → small **region-locator map** (Bangladesh highlighted) → long single-column portable text with section headings ("Brief description…", "Detailed discussion…", "Key insights & lessons", "Recommendations", "References", "Authors"). Same wide-measure + flat-hierarchy issues as news-single.

**Proposed:** Same prose-measure cap (A7) and heading scale (A6). Promote the section structure into a **sticky in-page table of contents** on lg (the sections are consistent across case studies, so a TOC is high-value). Keep the locator map but make it a small labeled figure ("Region: Sub-Saharan Africa") that links to the community page. Render "References" as a styled list and "Authors" as profile chips linking to `/profiles/…`.

```
        H1 + meta
        [region locator map → community]
┌ TOC (sticky, lg) ┐  body (max-w ~68ch)
│ • Description     │  ## Brief description…
│ • Discussion      │  ## Detailed discussion…
│ • Insights        │  ## Key insights…
│ • Recommendations │  ## Recommendations
│ • References      │  References (list)
│ • Authors         │  Authors → [chip][chip]
└───────────────────┘
```
**Tokens/components:** portable-text renderer, `heading()`, `Badge`/profile chip, `urlForCropped` for figures. **Responsive/RTL:** TOC hidden < lg; author chips wrap; logical sides.

### B6. Public profile
`profile-en-desktop` · `profile-en-mobile` · `profile-ar-desktop` · `profile-ar-mobile` (all on the fully-populated `amit3`)

**Current:** Header (avatar/initials + name + @handle + location + age + work-type/expertise badges; a chat-bubble "open to collaborate" ring when set). Statistics row (Member Since / Location / Communities / Skills). Two-column body: About / Skills / (collaboration, motivation, lived-experience, work, recent work, contributions) in the main column; **Regional Communities**, Special Communities, and **Contact links** (Website / LinkedIn / social `Badge`s) in the sidebar. Sparse seed users collapse to just name + "Member Since". RTL exposes the A3 bugs (name reorder, English labels, "months 7", badge overflow risk).

**Proposed:**
- **Graceful sparse state:** when a profile has almost no data (the common seed case), show a friendlier minimal card ("This member hasn't added details yet") rather than a lone stat — and, for the owner, a prompt to complete the profile.
- **Header:** keep, but make the badge row and the role/location line wrap-safe and bidi-safe (A3): `<bdi>` around name & location, logical gaps.
- **Sidebar containment:** region/community/contact `Badge`s get `max-w-full whitespace-normal break-words`; long region names must wrap, not overflow.
- **Contact links:** the bare "Website / LinkedIn" badges read as tags, not actions — give them an icon + are clearly buttons; keep them as `Badge`-styled links but add an external ↗ and logical padding.
- Translate every label (statistics, "View Project", "Ongoing", section titles).

```
DESKTOP                                   MOBILE
┌ avatar  Name (bdi) (pronouns) ─────────┐  Name
│ @handle · headline · [open]            │  @handle
│ role · location(bdi) · age             │  [badges wrap]
│ [worktype][expertise]…                 │  ┌ stats 2×2 ┐
├ stats: member·location·comm·skills ────┤  About / Skills …
│ ┌ main (2/3) ──────┐ ┌ sidebar (1/3) ┐ │  Regional comm.
│ │ About            │ │ Regional comm. │ │  Contact links
│ │ Prompts          │ │ Special comm.  │ │  (region card NOT last —
│ │ Collaboration    │ │ Contact links  │ │   raise above generic
│ │ Work / Recent    │ │  ↗ Website     │ │   content on mobile)
│ │ Contributions    │ │  ↗ LinkedIn    │ │
│ └──────────────────┘ └────────────────┘ │
└─────────────────────────────────────────┘
```
**Tokens/components:** `Card`, `Badge`, `Avatar`, `heading()`, `BlurFade` (route through the A5 helper). **Responsive/RTL:** 2-col → 1-col; `<bdi>` on names/locations; badges wrap; all sides logical.

### B7. Dashboard
`dashboard-en-desktop` · `dashboard-en-mobile`

**Current:** "Welcome, {name}" + **Edit Profile** (top-end) + a 43%-complete progress bar. "Quick Actions" = 2×2 grid (Manage Profile→*View Profile*, Submit Case Study→*Submit*, Collaborate→*Find Collaborators*, Account Settings→*Manage Account*). **"Your Community"** card (region, member count, *Visit Community*) floats in the **right rail aligned to the first row only**, leaving a large empty area beneath it on desktop. On mobile it drops to the **very bottom**, after all four actions.

**Issues (user-flagged, confirmed):**
1. Regional-community card placement is awkward (isolated rail block on desktop; buried last on mobile).
2. Redundant/unclear profile entries: "Edit Profile" (top) + "Manage Profile / View Profile" card.
3. "Submit" button label is vague standing alone.

**Proposed:**
- Promote **"Your Community"** to a **full-width band directly under the welcome/progress header** (it's the most personal, engagement-driving element) — on mobile it then sits near the top, not last. Show region + member count + a couple of recent community signals if cheap.
- Collapse profile redundancy: keep one primary **Edit Profile** in the header; the Quick Action card becomes "View public profile" (clearly different action). 
- Relabel buttons to verb+object: "Submit a case study", "Find collaborators", "Manage account", "Edit profile".

```
┌ Welcome, {name}                         [Edit profile] ┐
│ Profile 43% complete  ▓▓▓▓▓░░░░░                        │
├──────────── Your Community (full-width band) ──────────┤
│  ◎ Northern Africa & Western Asia · 4 members   [Visit]│
├ Quick Actions ─────────────────────────────────────────┤
│ [View public profile] [Submit a case study]            │
│ [Find collaborators ] [Manage account     ]            │
└────────────────────────────────────────────────────────┘
```
**Tokens/components:** `Card`, `Button` (clear labels), progress bar. **Responsive/RTL:** community band full-width at all sizes (fixes the "buried last on mobile" problem); 2×2 → 1-col; logical sides.

### B8. The map
`map-community-hero-en-desktop` · `community-en-desktop` (locator maps) — interactive block **not deployed anywhere** (see below).

**Two distinct maps exist:**
1. **Static region-locator choropleth** — a world map with the active region painted CCM-gold against muted blue. Decorative/locator only; appears on community-page hero and case-study single. No interactivity. *(captured)*
2. **Interactive `region-map` block** (`components/blocks/maps/region-map.tsx`) — a full facet-driven choropleth + **facet switcher** (`FilterChip`s: Case Studies / Lived Experiences / Members / News, from `lib/maps/region-facets.ts`) + **`RegionDataPanel`** (hybrid: data on the map *and* in a side panel), regions clickable → community page, data via `/api/maps/region-data?facet=…` (SWR-cached). Stacks on mobile, side-by-side on lg. **This is exactly the spec's target model — and it is fully built but placed on ZERO pages.** Confirmed by querying Sanity (`production_2`): no `page` or `regionalCommunityPage` document contains a `region-map` block. The API responds correctly (verified: returns per-region `value` + `intensity`).

**Proposed — the map usage model** (every surface + its job):

| Surface | Map variant | Job |
|---|---|---|
| **Homepage** | Interactive `region-map` | Primary "where is this happening" overview; facet switcher (content type) + data panel; click → community page. **Deploy the existing block here.** |
| **Community page hero** (`/communities/[slug]`) | Static locator | "You are here" — highlight this one region; link to homepage map for the global view. |
| **Case-study single** | Static locator (small) | Show the study's region; link to that community page. |
| **Regional-communities index** (if/when added) | Interactive `region-map`, `defaultFacet=memberCount` | Browse-by-region entry point. |
| **(future) layer toggles** | Interactive | Add toggleable layers per the spec: choropleth *intensity* (current) **+** per-content-type *pins* on top, switchable independently of the facet. |

**Hybrid/toggleable layers (spec ask):** the block already does "data on map AND in side panel". To complete the spec: add a small **layer control** (choropleth on/off, pins on/off) alongside the facet switcher, and render per-content-type pins from the same `/api/maps/region-data` payload. Keep the current SVG choropleth style — this is an additive layer, not a restyle.

```
INTERACTIVE region-map block (deploy on homepage)
[ Case Studies ][ Lived Exp ][ Members ][ News ]   ← facet switcher (FilterChip)
( ▢ choropleth  ▢ pins )                            ← proposed layer toggles
┌──────── choropleth (facet-shaded) ────────┐ ┌── data panel ──┐
│   regions, hover/active, click→community   │ │ 1. Region  ██  │
│                                            │ │ 2. Region  ▓▓  │
└────────────────────────────────────────────┘ │ 3. Region  ▒▒  │
                                                └────────────────┘
(stacks vertically on mobile)
```
**Tokens/components:** `RegionMapBlock`, `FilterChip`, `RegionChoropleth`, `RegionDataPanel`. **Responsive/RTL:** already stacks; ensure the facet chip row and panel use logical sides; choropleth is geographic (no mirror), panel text follows `dir`.

### B9. Collaborate
`collaborate-en-desktop`

**Current:** Search + 3 filter dropdowns (Communities / Work Types / Expertise) → people grouped by **regional community** (Northern Africa & Western Asia, Eastern & SE Asia, Latin America, "No Regional Community"), each a grid of person cards (avatar, name, headline, location, work-type/expertise tags) with an **Expand** per group. ⚠️ **All avatars are blank** (A2 CSP). Cards link to `/profiles/{username}`.

**Proposed:**
- Fix avatars (A2) — this page is the worst hit (23 CSP errors) and avatars are the whole point of people discovery.
- Keep the region grouping (strong information scent) + Expand affordance. Make the filter dropdowns and the region groups stay in sync (selecting a community filter scrolls/*filters* to that group).
- Card: make the whole card a single link target; ensure the "open to collaborate" ring/badge from the profile template also shows here for consistency.
- Tie to the map (§B8): clicking a region on the homepage map could deep-link to collaborate filtered by that region.

```
┌ search ──────────┐ [Communities ▾][Work Types ▾][Expertise ▾]
Northern Africa & Western Asia                         [Expand]
┌ ◎ Name        ┐ ┌ ◎ Name        ┐ ┌ ◎ Name        ┐
│   headline    │ │   headline    │ │   headline    │
│   location    │ │   location    │ │   location    │
│  [type][exp]  │ │  [type][exp]  │ │  [type][exp]  │
└───────────────┘ └───────────────┘ └───────────────┘
Eastern & South-Eastern Asia                           [Expand]
…
```
**Tokens/components:** `Card`, `Avatar`, `Badge`, `FilterChip`/select, region grouping. **Responsive/RTL:** 3→2→1 cards; dropdowns stack; logical sides; `<bdi>` on names.

---

## C. Capture inventory

| Surface | Files |
|---|---|
| Homepage | `homepage-en-desktop/tablet/mobile`, `homepage-ar-desktop/mobile` |
| News list | `news-list-en-desktop/mobile`, `news-list-ar-desktop/mobile` |
| News single | `news-single-en-desktop/mobile` |
| Lived experiences | `lived-exp-en-desktop`, `lived-exp-modal-en-desktop`, `lived-exp-modal-en-mobile` |
| Case study single | `case-study-en-desktop/mobile` |
| Public profile | `profile-en-desktop/mobile`, `profile-ar-desktop/mobile` (rich `amit3`) |
| Dashboard | `dashboard-en-desktop/mobile` |
| Map (locator) | `map-community-hero-en-desktop`, `community-en-desktop` |
| Collaborate | `collaborate-en-desktop` |

All in [`docs/design/screenshots/`](./screenshots/).

## D. Priority order (suggested)
1. **A2 CSP avatars** — one line, restores avatars site-wide. *(quick win)*
2. **B4 LE modal** — the headline redesign ask; currently near-empty/disrespectful.
3. **A3 RTL/bidi** — names, labels, badge containment (affects every Arabic page).
4. **B7 dashboard** — regional card placement + button labels.
5. **B2 news** — drop CCM badge, site/external differentiation.
6. **B8 map** — deploy the existing interactive block on the homepage; add layer toggles.
7. **A4–A7** — cropping, motion, heading hierarchy, reading measure (cross-cutting polish).
