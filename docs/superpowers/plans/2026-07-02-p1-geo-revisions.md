# P1 Geo Revisions (user feedback round 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply user design feedback to the just-shipped Atlas: CMS-driven themes (universal no-hardcoded-taxonomy rule), user-facing labels, multi-select layers, caption-bar removal, and CMS-driven illustration slots that give the hub its visual character.

**Architecture:** Themes become curated `tag` documents (`useAsTheme` flag) fetched server-side and matched by exact slug reference in GROQ (bound params). Layers become a multi-select set in the URL (`layers=`), aggregated server-side. Illustrations ship as a Sanity singleton (`hub-illustrations`) + a reusable `HeaderIllustration` component placed on the Atlas and Search headers.

**Tech Stack:** as P1-geo. Spec: `docs/superpowers/specs/2026-07-02-atlas-people-content-collab-design.md` + this file as addendum.

## Global Constraints

- NEVER run `sanity typegen generate`; hand-edit manual types.
- NEVER include Claude/AI attribution in commits.
- All new i18n keys with REAL translations in en/es/fr/ar.
- Injection safety: user-influenced values reach GROQ only as bound params; never interpolate.
- Colours via `lib/ccm-colors.ts` resolvers (`COLOR.layer` for per-layer pin/chip colour).
- Gates per task: `npx tsc --noEmit` · `npx vitest run` green · `pnpm build` compiles · 4-locale JSON parse when messages change.
- **Universal principle (user directive):** filter/sort vocabularies are CMS/taxonomy-driven, never hardcoded in components. Hardcoded lists are acceptable only as explicit fallbacks when the CMS returns nothing.

---

### Task R1: CMS-driven themes

**Files:**
- Modify: `sanity/schemas/documents/tag.ts` (add `useAsTheme` boolean, default false, description "Show this tag as a Theme filter on the Atlas and other discovery surfaces.")
- Create: `lib/maps/themes.ts` — server-side fetch of theme tags
- Modify: `app/api/maps/region-data/route.ts`, `app/api/maps/region-pins/route.ts` — replace substring `themeFilter` with exact slug match `&& $themeSlug in tags[]->value.current` (bound param)
- Modify: `lib/maps/region-facets.ts` — keep `THEMES` only as typed FALLBACK (rename `FALLBACK_THEMES`, add comment: used when no tag has useAsTheme); export `ThemeOption = { slug: string; label: Record<'en'|'es'|'fr'|'ar', string | undefined> }`
- Modify: `app/[locale]/(main)/atlas/page.tsx` — server-fetch themes, pass `themes` prop
- Modify: `components/atlas/atlas-explorer.tsx` — chips from the `themes` prop (localized label via locale), `theme` URL param now holds the tag SLUG (validate: must be in the passed list, else ignored)
- Modify: `components/blocks/maps/atlas-embed.tsx` — fetch + pass themes the same way
- Test: `lib/maps/__tests__/themes.test.ts`

**Interfaces:**
- Produces: `getThemeOptions(): Promise<ThemeOption[]>` in `lib/maps/themes.ts` — GROQ `*[_type=="tag" && useAsTheme==true] | order(orderRank) { "slug": value.current, label }`, falls back to `FALLBACK_THEMES` mapped to ThemeOption when empty. `AtlasExplorer` gains `themes: ThemeOption[]` prop.

- [ ] Step 1: failing test for `getThemeOptions` (mock sanity client: returns mapped options; empty → fallback mapping; malformed rows filtered).
- [ ] Step 2: RED → implement → GREEN.
- [ ] Step 3: schema flag + API param rename (`theme` value = slug, bound `$themeSlug`), explorer/embed wiring, page fetch.
- [ ] Step 4: gates + commit `feat(atlas): CMS-driven theme facet (tag.useAsTheme) — no hardcoded taxonomy`.

---

### Task R2: Multi-select layers

**Files:**
- Modify: `lib/maps/region-facets.ts` — `parseLayers(param: string | null): FacetId[]` (comma list, validated, deduped, default `["caseStudyCount"]`, never empty)
- Modify: `app/api/maps/region-data/route.ts` — accept `facets=` (comma list ≤6); response per region: `value` = SUM across requested facets + `byFacet: Record<FacetId, number>`; member counts still ignore theme/q
- Modify: `app/api/maps/region-pins/route.ts` — accept `facets=`; query each pin-capable type in the set; `PinItem.type` already carries the content type; clusters may mix types
- Modify: `components/maps/region-choropleth.tsx` — pin circle fill = `COLOR.layer`-derived colour of the cluster's dominant item type (map FacetContentType→layer key: caseStudy→cases, livedExperience→lived, newsPost→cases? NO — use: caseStudy→cases, livedExperience→lived, others→projects fallback; define the map in `lib/maps/cluster-pins.ts` as `layerColorKeyFor(type)`), count text stays white; single-type cluster = that colour, mixed = `CCM.amber`
- Modify: `components/atlas/atlas-explorer.tsx` — layer chips toggle membership in the set (min 1: toggling the last active layer is a no-op with a title tooltip), URL `layers=` (omit when default), data panel + drill-in show summed counts; drill-in cards only render when exactly one CARD_FACET is active (else show per-layer count chips linking to each listing)
- Modify: `lib/maps/region-facets.ts` — `atlasDestination` unchanged (per-facet)
- Test: extend `lib/maps/__tests__/region-facets.test.ts` (parseLayers: default, dedupe, invalid dropped, never empty) and `lib/maps/__tests__/cluster-pins.test.ts` (layerColorKeyFor mapping)

**Interfaces:**
- Produces: `parseLayers`, `layerColorKeyFor(type: FacetContentType): keyof typeof COLOR.layer`. URL contract: `?layers=caseStudyCount,livedExpCount`. API contract: `region-data?facets=a,b` → `{ facets: FacetId[], data: Array<RegionDatum & { byFacet }> }` (keep `facet`+old param working for back-compat one release: if `facet` present and `facets` absent, treat as single).

- [ ] Step 1: failing tests (parseLayers + layerColorKeyFor) → RED → implement → GREEN.
- [ ] Step 2: API multi-facet aggregation (sum + byFacet), pins multi-type.
- [ ] Step 3: explorer multi-select chips + panel/drill behavior; choropleth pin colours (colour always paired with the popover's type label — a11y).
- [ ] Step 4: gates (+ Playwright screenshots desktop/375/ar saved to .superpowers/sdd/geo-r2-*.png) + commit `feat(atlas): multi-select layers (summed choropleth, per-layer pins)`.

---

### Task R3: Labels + caption-bar removal + showBreakdown

**Files:**
- Modify: `components/atlas/atlas-explorer.tsx` — (a) DELETE the caption bar block entirely; (b) move the "Open in {label} →" deep-link into the drill-in `SectionHeader` row (only when exactly one layer active); (c) rename the "Data layer" group label to `tAtlas('show')`; (d) honor `showBreakdown` — add prop `showBreakdown?: boolean` (default true) gating the locked-mode country list
- Modify: `components/blocks/maps/atlas-embed.tsx` — pass `showBreakdown`
- Modify: `messages/{en,es,fr,ar}.json` — add `atlas.show`: en "Show", es "Mostrar", fr "Afficher", ar "عرض"; keep `dataLayer` key (other consumers may use it; grep — if only the explorer used it, delete it everywhere)
- Test: none new (presentational); gates + visual check

- [ ] Step 1: implement; grep `dataLayer` consumers before deleting the key.
- [ ] Step 2: gates (+ screenshots geo-r3-*.png desktop/375/ar) + commit `refactor(atlas): user-facing "Show" label, drop caption bar, wire showBreakdown`.

---

### Task R4: Illustration slots (hub character)

**Files:**
- Create: `sanity/schemas/documents/hub-illustrations.ts` — singleton document `hubIllustrations`, fields (all optional `image` with alt): `atlasHeader`, `searchHeader`, `collaborateHeader`, `emptyState`; register in `sanity/schema.ts`; add to Studio structure as a singleton entry (follow existing singleton pattern — grep how `homepage`/`moderation-settings` singletons are listed)
- Create: `lib/sanity/hub-illustrations.ts` — `getHubIllustrations()` cached server fetch (ISR 300) returning `{ atlasHeader?, searchHeader?, collaborateHeader?, emptyState? }` with image URL + alt + dimensions via the project's existing image-url helper (grep `urlFor` / `imageUrlBuilder` usage)
- Create: `components/ui/header-illustration.tsx` — server component: renders the illustration absolutely positioned in the header's inline-end space (`absolute end-0 top-1/2 -translate-y-1/2`), max-height clamp, `hidden sm:block` at small widths a reduced size (not hidden entirely — scale down; mobile keeps a small version so character survives 375px), `aria-hidden` (decorative), never overlaps text (container `relative` + text `max-w` guard, `pe-` padding reserved when illustration present)
- Modify: `app/[locale]/(main)/atlas/page.tsx` — header becomes `relative`, renders `<HeaderIllustration image={ill.atlasHeader} />`
- Modify: `app/[locale]/(main)/search/page.tsx` (+ its header component if separate — grep `GroupedSearch` mount) — same slot with `searchHeader`
- Test: `lib/sanity/__tests__/hub-illustrations.test.ts` (mock client: maps fields, returns {} on fetch failure — never throws into the page)

**Interfaces:**
- Produces: `getHubIllustrations()`, `<HeaderIllustration image={{url,alt,width,height}|undefined} className? />` (renders null when undefined — pages work with no content configured).

- [ ] Step 1: failing test for the fetch mapper → RED → GREEN.
- [ ] Step 2: schema + structure + component + page slots.
- [ ] Step 3: gates (+ screenshots geo-r4-*.png: atlas + search, desktop/375/ar — with NO illustration configured the pages must look unchanged) + commit `feat(ui): CMS-driven header illustration slots (atlas + search) via hubIllustrations singleton`.

---

## Self-review notes
- User directives covered: dynamic themes ✓ (R1) · universal no-hardcoded-taxonomy ✓ (R1 + constraint) · "data layer" label ✓ (R3) · multi-layer selection ✓ (R2) · caption bar removed/made-relevant ✓ (R3) · illustration spaces atlas+search ✓ (R4; collaborate slot fielded for P3).
- Type consistency: ThemeOption (R1) consumed by explorer prop; parseLayers/layerColorKeyFor (R2) used in explorer/choropleth; HeaderIllustration image shape defined once (R4).
- Back-compat: region-data keeps `facet` param one release; `dataLayer` i18n key deleted only if unconsumed.

---

### Task R2b (user directive): multi-type presentation on the map — merged with R3

How the UI reads a multi-layer result set (binding design):

1. **Legend/result chips under the map** — one chip per ACTIVE layer: `COLOR.layer` dot + localized layer label + its total count (sum of that facet across regions, from `byFacet`). This is the legend AND the live result summary (replaces the deleted caption bar's job). Clicking a legend chip when >1 layer active = same as toggling that layer chip off (kept consistent).
2. **Region panel rows read composition** — each region row gets a thin stacked segment bar (h-1.5, rounded) under the name: segments proportional to `byFacet` shares in `COLOR.layer` colours, plus the summed count. One layer active → bar is single-colour (harmless degenerate case).
3. **Mixed pin clusters = segmented donut** — SVG arc segments proportional to the cluster's type shares (max 3 segments, then "other" in slate), white count in the middle; single-type cluster stays a solid `COLOR.layer` circle. Amber no longer means "mixed" (it returns to highlight/selection semantics only).
4. **Popover groups by type** — type header row (dot + localized label + count), then its items; types ordered by count desc.
5. R3 folded in: caption bar deleted; "Open in {label} →" moves into the drill-in `SectionHeader` row (only when exactly one card-facet active); "Data layer" label → `atlas.show` ("Show" / "Mostrar" / "Afficher" / "عرض"); `showBreakdown` prop honored by the locked-mode country list; keep/delete `dataLayer` key per grep.

Colour+label pairing holds everywhere (legend chips, popover headers, segment bars have an sr-only composition sentence per row: "{n} case studies, {m} lived experiences").
