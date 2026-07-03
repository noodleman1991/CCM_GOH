# Engagement & Authoring (user feedback round 2)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Checkbox steps.

**Goal:** Make the Atlas content-first and engaging, complete the homepage's missing pieces, give lived experiences real video sources (upload/YouTube/Vimeo) with a blog-post feel, and reshape case-study authoring into an editorial page editor in the CCM design language.

**Spec anchors:** parent spec Tracks A/C + homepage-redesign-design.md; user directives 2026-07-03.

## Global Constraints

- NEVER `sanity typegen generate`; hand-edit types. NEVER Claude/AI attribution in commits.
- New i18n keys → REAL translations en/es/fr/ar. Colours via ccm-colors resolvers. Targets ≥44px, RTL-safe, `<bdi>` on user text.
- Gates per task: `npx tsc --noEmit` · `npx vitest run` green · `pnpm build` · Playwright screenshots (desktop/375/ar) for UI tasks → .superpowers/sdd/<task>-*.png.
- CMS-driven vocabularies; hardcoded lists only as commented fallbacks.

---

### Task E1: Atlas — content-first engagement rework

User: "I don't get the statistics pane… should be more engaging, with cards of the content thumbnails under the atlas based on selection."

**Design (binding):**
- REMOVE `RegionDataPanel` from `AtlasExplorer` (component file stays — the `region-map` homepage block still uses it). Map goes full-width within its column; legend chips remain under the map.
- **Region hover tooltip** on the choropleth: region name + summed count + a one-line composition ("6 case studies · 2 lived experiences") — implemented as a positioned div driven by the existing `onHover` (not SVG `<title>`), hidden on touch devices (tap = select there).
- **Content cards under the map**: upgrade `components/atlas/region-content-cards.tsx` — thumbnail-led cards (the `/api/maps/region-items` payload includes image where available; verify and extend the projection with the doc's image + LQIP if missing), horizontal scroll strip on mobile (snap), 3–4 col grid on desktop; when multiple layers are active, group with small type headers (dot + localized label); each card: thumbnail (fallback: LocaleMap mini or region-tinted placeholder), title, type chip, place text when present. Keep "Explore {Region} →".
- **No-selection state** becomes an invitation, not emptiness: "Tap a region to see its stories" hint + a single row of the most recent geotagged items across all regions (new lightweight mode of region-items: `region=all&limit=6` — extend the API).
- Locked/embed mode inherits all of it (that IS the region page's engagement).

**Files:** components/atlas/atlas-explorer.tsx · components/atlas/region-content-cards.tsx · components/maps/region-choropleth.tsx (hover callback already exists; tooltip lives in explorer) · app/api/maps/region-items/route.ts (image + `all` mode) · messages/*4 (new keys: atlas.tapHint en "Tap a region to see its stories", es "Toca una región para ver sus historias", fr "Touchez une région pour voir ses histoires", ar "المس منطقة لرؤية قصصها"; atlas.latestEverywhere en "Latest from across the regions", es "Lo último de todas las regiones", fr "Les dernières histoires de toutes les régions", ar "الأحدث من جميع المناطق").
**Tests:** extend region-items route logic tests if pure helpers exist; otherwise gates + visual.

- [ ] Implement · gates · screenshots (incl. a region WITH seeded pins: csa or ssa) · commit `feat(atlas): content-first explorer — thumbnail cards, hover tooltip, drop stats pane`.

---

### Task E2: Lived experiences — video sources (upload / YouTube / Vimeo) + blog-post body

User: "lived experience is the video, the text, few images — more like a blog post. Work on the video upload / YouTube / Vimeo link."

**Design (binding):**
- Schema (`livedExperience`): add `videoSource: "youtube" | "vimeo" | "upload"` (optional; derive from existing `videoUrl` when absent → youtube if URL matches, keeps legacy working) and `videoFile` (Sanity `file` type, mp4/webm, ≤200MB Studio hint). Existing `videoUrl` keeps serving YouTube AND now Vimeo URLs.
- `LivedExperiencePlayer`: render by source — YouTube (existing consent-gated embed), **Vimeo** (same consent-gate pattern, player.vimeo.com/video/{id} parsed from URL), **upload** (native `<video controls preload="metadata" playsInline>` with poster from thumbnail). Audio/written paths untouched.
- Submit flow (`/lived-experiences/submit` — read it first): the video step becomes three tabs/pills — "Upload a video" (direct upload to Sanity assets via the existing upload pattern the form uses for images; if the form has no asset-upload plumbing, upload through `/api/lived-experiences/submit` multipart like the case-study image ≤5MB pattern but with the file field and a bigger cap ≤200MB — check the route's body handling; if streaming large files is not feasible in the current route, cap uploads at 100MB and note it visibly in the UI) · "YouTube link" · "Vimeo link" — with inline URL validation + thumbnail preview.
- Body stays Portable Text with images ("few images, blog-post feel"): ensure the LE submit body editor allows image insertion with caption (the shared portable-text editor already does images; verify wired here) — full slash-menu lands in P2.
- Public LE detail already renders person-first + player + body — verify Vimeo/upload render there + kind chip unaffected.

**Files:** sanity/schemas/documents/lived-experience.ts · components/[player path — grep LivedExperiencePlayer] · the submit form + API route · types (hand-edit) · messages*4 (tabs: livedSubmit.uploadVideo/youtubeLink/vimeoLink + validation copy, real translations).
**Tests:** URL-parse helpers (youtube id, vimeo id) TDD in lib (pure), player render logic typecheck.

- [ ] TDD parse helpers · implement · gates · screenshots of the submit video step + a Vimeo LE detail · commit `feat(lived): video sources — upload/YouTube/Vimeo + blog-post body polish`.

---

### Task E3: Case-study authoring — editorial page editor shell

User: "the layout of the content of the case study, the dialog — I imagine a page with content-block editorial vibe in my design language."

**Design (binding):**
- Reshape `case-study-form.tsx` from accordion-of-fieldsets into a **full-page editorial canvas** (route unchanged): big borderless title input (Poppins, h1 scale) → byline row (author chips) → hero-image drop zone (dashed, becomes the image with hover-replace) → the Portable Text body as the open canvas (placeholder "Tell the story — type / for blocks…") → below-canvas "Story details" section (community, tags, PlacePicker, study period) as a clean two-column block, NOT accordions → sticky bottom bar: autosaved-draft indicator (drafts API already exists) + "Preview" + "Submit for review".
- The layout chooser (Story/Feature/Report cards with use-case captions — parent spec §8a/C1) sits at the top as the first choice and writes `layout`.
- Same validation/zod/submission pipeline — this is a SHELL redesign; no data-shape changes beyond wiring `layout`. Keep the multilingual title/excerpt switcher.
- Mobile: single column, sticky bar respects safe-area.

**Files:** components/forms/case-study-form.tsx (+ small subcomponents in components/forms/case-study/ if the file grows unwieldy — split by section) · messages*4 for new copy (editor.placeholder etc., real translations) · reuse PlacePicker/portable-text editor as-is.
**Tests:** none new beyond gates (shell); Playwright screenshots incl. 375/ar are the gate.

- [ ] Implement · gates · screenshots · commit `feat(authoring): editorial page-editor shell for case-study submissions (layout chooser, canvas, sticky bar)`.

---

### Task E4: Homepage — the missing pieces

User: "you still haven't worked on the homepage." Spec #11 remnants (events calendar done; blocks[] path live; flags dead):

**Design (binding):**
- **`submit-story-banner` block** (handoff §4.1): schema (title/subtitle/CTA label override, illustration image optional) + component (full-bleed band, CCM navy ramp, illustration end-slot via HeaderIllustration pattern, CTA → /lived-experiences/submit with sign-in gate awareness — the target route already gates) + register in componentMap + homepage doc `of:` list. Real 4-locale defaults via i18n when CMS fields empty.
- **Hero CTAs**: dev-dataset content script `scripts/seed-homepage-blocks.ts` (idempotent, dev-dataset-guarded like seed-geotags): ensure the homepage doc's blocks[] contains hero with two CTAs → /atlas ("Explore") + /collaborate ("Collaborate") localized, an `eventsCalendar` block, a `region-map` block, a `lived-experiences-carousel` block, and the new `submit-story-banner` — composing the handoff §4.1 order. Do NOT delete existing blocks; insert missing ones in order.
- **Legacy path retirement decision made explicit**: in `components/pages/homepage.tsx`, when `blocks[]` is non-empty render ONLY blocks (no legacy interleave — verify current behavior; if it already does this, just add the comment); log nothing. Legacy path stays for empty-blocks docs (prod safety) with a comment naming the retirement condition (prod content migrated).
- **Dead flags cleanup**: delete `homepageMap`/`homepagePeople` from lib/features.ts (verified dead earlier).

**Files:** sanity/schemas/blocks/cta/submit-story-banner.ts (or match blocks dir conventions) · components/blocks/cta/submit-story-banner.tsx · components/blocks/index.tsx · sanity/schema.ts + homepage doc of:-list + homepage GROQ projection · scripts/seed-homepage-blocks.ts · lib/features.ts · messages*4.
**Tests:** gates + screenshots of the recomposed homepage (desktop/375/ar).

- [ ] Implement · run seed script (dev dataset only) · gates · screenshots · commit `feat(homepage): submit-story banner block, hero CTAs, §4.1 composition; drop dead flags`.

---

## Sequencing
E1 (atlas engagement — immediate visual win on seeded data) → E4 (homepage — the front door, explicitly flagged) → E2 (LE video sources) → E3 (editorial editor shell; P2's slash menu mounts into it next).

---

### Task E5: SectionHeader title-bubble fix + unified block-reveal animation

User: "fix the vertical bubble in all lived exp block component titles — the shape before the title… and unify the animation of all Sanity content blocks on content pages."

- Investigate the title-prefix shape in lived-experiences blocks (carousel + index group headers + any grid header): find where the vertical bar/pill before titles renders wrong (stretched/mis-shaped). Root-cause in `SectionHeader`/local header markup (likely a self-stretching flex child: needs `self-center flex-none` + fixed h/w, or an errant `h-full`). Fix at the SOURCE component so every consumer heals; screenshot before/after on: lived-experiences index, a regional page carousel, homepage carousel.
- Animation unification: audit entrance animations across `components/blocks/**` (grep motion/animate/fade/reveal/`block-reveal`). Standardize: every top-level block on content pages animates via ONE shared `BlockReveal` (existing components/blocks/block-reveal.tsx — extend if needed): fade-up 12px, 350ms ease-out, once, `prefers-reduced-motion` → none, stagger only within a block (not across page). Remove per-block bespoke variants (timeline keeps its internal rail dots). Wire in components/blocks/index.tsx so it wraps rendered blocks uniformly — one place, all pages (homepage, regional, catch-all CMS pages).
- Gates + screenshots. Commit `fix(blocks): heal title-bar shape at source; unify block entrance animation via BlockReveal`.

### Task E6: News page + news item layout

Spec §1.5/§1.6 + user: "work on the news page layout and news items layout."
- List: add the **Global** pill alongside region chips; keep the 3-featured hero but restyle toward the handoff's lead-story emphasis: first featured = large lead (image-left/stacked-mobile), remaining two compact; latest feed below with clearer date/source hierarchy; external cards keep "External ↗" but unified card ratios (CARD_ASPECT tokens).
- Region-empty state → STATES §2 copy + "Follow this region" CTA (Follow infra exists).
- Item/detail: tighten the article header (kicker = source/region chip row, title balance, meta row), excerpt block-quote restyle to the editorial pull-quote from the weave vocabulary, related-news cards on the unified card ratio. No layout-archetype system yet (explicitly deferred, spec §1.6).
- Gates + screenshots (list + one detail, desktop/375/ar). Commit `feat(news): lead-story layout, Global pill, unified card ratios, editorial detail polish`.

### Task E7 (pulled forward from P2): Slash-menu editor — production-ready

User: "so implement… make sure proper production ready."
- Build the Tiptap suggestion-based slash menu as a proper extension (`components/forms/editor/slash-menu.ts` + popup component): `/` at empty-paragraph start (or after space) opens; type-to-filter; ↑↓ + Enter + Esc; groups "Insert" + "Data & story" (data group ships DISABLED with "coming next" affordance until E8 — no dead buttons: hide the group entirely for now, config-driven `enabledBlocks`).
- Production inserts wired end-to-end (editor node ⇄ `tiptapToPortableText` ⇄ renderer, all three layers): **Image** (REAL upload via the submit flow's existing image-upload path — no more window.prompt; caption + required alt + placement full/wide/inline-start/inline-end via the dark block toolbar), **YouTube** (URL → id validation), **Quote** (blockquote), **Info box** (variant picker info/warning/success), **Section break** (style picker). The renderer already supports every one of these — the work is editor nodes + converter round-trip + toolbar.
- Round-trip tests (TDD): `tiptapToPortableText` and the reverse for each new node incl. placement attrs — pure functions, full vitest coverage. A11y: menu is `role="listbox"`, items `option`, focus trapped, 44px rows.
- Mount in BOTH the workspace docs editor and the case-study form (shared component — verify both).
- `enabledBlocks` config prop per surface (constraint: lived-experience hides charts/diagrams later).
- Gates + screenshots (menu open, image w/ placement in doc + rendered public). Commit `feat(editor): production slash-menu (Tiptap suggestion) + image-upload/quote/infobox/youtube/break round-trip`.

### Task E8: Data & story blocks — timeline / chart / mermaid (server-rendered)

Parent spec C3 (follows E7; enables the "Data & story" menu group): PT object types + editor nodes + converters; chart/mermaid rendered to sanitised SVG server-side at save (server action; mermaid via `@mermaid-js/mermaid-cli`-less approach: run mermaid in a worker with DOMPurify sanitize — investigate the lightest safe server render, document the choice); timeline reuses timeline-1 visual; withheld-from-publish on render failure; last-good-render preview. TDD on converters + donut of tests for the render action's failure paths.

## Sequencing (updated)
E1 → E7 (user: implement now) → E5 → E4 → E6 → E2 → E3 → E8.
