# Atlas focus-clipping on regional community pages — design

**Date:** 2026-08-03
**Status:** Approved (visual direction chosen via mockups: cropped zoom + pronounced edge fade)

## Amendment (2026-08-03, post-implementation)

User-directed changes after seeing the rendered result:

1. **Edge fade REMOVED** — the cropped map keeps a clean rounded frame (no gradient overlay).
2. **Corner locator globe ADDED (mockup option A)** — a circle-clipped mini world (`components/atlas/region-locator.tsx`, centre-weighted viewBox `180 60 620 400`, `slice`) rendered absolutely at the map's top-end corner in locked mode only: focused region in its `REGION_COLOR`, other landmasses in a pale water tint, `role="img"` with the localized `atlas.locator` label ({region} interpolated), `pointer-events-none`, `end-3` for RTL safety.

3. **Layout tweak (2026-08-04)** — in locked mode the map is demoted: filters (search + Show/Theme/When) and the map share a two-column row at `lg` (`grid-cols-[minmax(0,1fr)_minmax(0,44%)]`, map end-side, RTL-mirrors via grid), stacking on mobile; the spotlight/results follow full-width directly below. Locator shrinks to `size-14 sm:size-16`. Unlocked surfaces keep the full-width stack.
4. **Linked type-subtitles (2026-08-04)** — in the multi-type card strip, each content type's group header now carries its full count and the region-scoped "View all {type} →" listing link (end-aligned); the spotlight's bottom per-layer pill row is REMOVED, and grouped mode suppresses the old below-cards view-all link (single-type mode keeps it).

5. **Country-precision pins (2026-08-04)** — REVERSES the original "centroid is a lie" rule: items with a country code but no city/exact point now pin at their country's geometry-bbox centre (`countryCentroid` in `lib/maps/country-geometry.ts`), flagged `approx` end-to-end (`PinItem.approx`, `PinCluster.approx` = all-items-approx) and rendered visually distinct — dashed hollow circle (no droplet tail) for singles, dashed outer ring for clusters, `common.approxLocation` appended to aria-labels. Region-precision items still get no pin. Data side: `scripts/backfill-country-codes.mjs` (dry-run default, `--execute`) derives countries from each doc's own title/locationText where exactly one country is named — 42 docs backfilled on the development dataset 2026-08-04; 19 left untouched as ambiguous.
6. **Region-scoped counts + members (2026-08-04)** — chip/legend counts scope to `effectiveRegion` (locked embeds AND /atlas selection); Members render as profile-card strips (`region-members-strip.tsx` + `/api/maps/region-members`) since members have profile pages; mobile spotlight orders content before meta; single-type card sets keep their linked subtitle.

7. **Pins v3 — unified flat droplets (2026-08-05)** — one droplet shape for every pin: solid layer-colour droplet for exact items, larger droplet with the count set flat in the head for clusters, hollow (white-filled, colour-outlined) droplet for country-level approximate items. The segmented donut is retired; mixed clusters show the dominant type's colour and the popover carries the breakdown. Locator globe zoomed out to a near-global window (`70 25 820 450`).
8. **Edge-aware popovers (2026-08-05)** — the cluster popover anchors AT the clicked pin (viewBox-percentage positioning, x clamped 18–82%, flips above/below at py 45%) instead of the old full-width bottom sheet, on both locked embeds and /atlas; the hover name+count pill clamps horizontally inside the active viewport.

9. **Illustration-faithful polish (2026-08-05)** — pins are ARTWORK GOLD `#FFBF05` (sampled from the welcome-hero region illustrations; type colours live in the popover mini-legend only); the selected region matches the artworks exactly: flat gold fill + dashed gold fringe painted under the fill (offset-outline effect), replacing the thick white halo; region hover is a gold-tinted sky lift — the old `color-mix` referenced the never-defined `--color-ccm-secondary` and rendered BLACK; hover pill width estimate corrected (8.2/char + wider clamp pad) so long region names stay inside the frame; search input restyled as a soft pill.
10. **Gallery trust contract (2026-08-05)** — the no-selection gallery strips (`region=all` recent + `mode=highlights`) now honour theme/q/when server- and client-side, and include country-coded docs (pinnable since §5) — previously an active theme zeroed the map while the gallery kept showing unfiltered items. Themes verified CMS-driven (tag docs flagged `useAsTheme`; FALLBACK_THEMES only when none/fetch-fail).

Everything else in this spec (crop math, `focus` prop, glyph scaling, locked-mode gating, fallbacks) stands.

## Context

The seven regional community pages embed the unified atlas (`AtlasEmbedBlock` → `AtlasExplorer` with `lockedRegion`, spec A4). Today that embed renders the **full world map** with the page's region merely highlighted (gold halo, other regions dimmed to ~55% opacity). The ask: the embed should read as a true **facet of the atlas** — a "focus clipping" of the illustration, not a world map with a highlight.

Chosen treatment (from browser mockups built on the real `region-geometry-soft.json` geometry, Sub-Saharan Africa as the example):

- **Cropped zoom** — the SVG viewport crops to the region's bounds; neighbouring regions stay visible at their normal dim level and are sliced by the frame.
- **Pronounced edge fade (~22% band)** — all four frame edges fade into the page background, so the clipping melts out of the atlas illustration instead of ending in a hard cut.

## Decisions (user-confirmed)

1. **Visual:** cropped zoom + pronounced (~22%) edge-only fade. Neighbours keep their normal dim; no scrim over them, no vignette over the region.
2. **Interaction:** region stays **fixed** (`lockedRegion` behavior unchanged). This is a visual-only change; cross-region exploration remains the "Open full atlas →" link.
3. **Scope:** community-page embeds **only**. `/atlas` and the homepage `RegionMap` block keep the full-world view with halo + dim on selection.

## Implementation

### 1. `lib/maps/region-crop.ts` (new)

Pure module exporting `regionCropViewBox(code: RegionCode): string | null`:

- Parse the region's path `d` from `components/maps/region-geometry-soft.json`; bounding box from all coordinate pairs (curve control points are included — a slight overestimate absorbed by padding).
- Add fixed padding (~40 viewBox units) on all sides.
- Expand the padded box to a **minimum 16:10 aspect ratio**, centered, then clamp to the world bounds (0 0 960 500). Tall regions (SSA, LAC) get widened rather than producing a very tall embed; all seven pages end up with a consistent map height.
- Unknown/missing code → `null` (caller falls back to the full-world viewBox).
- Result is deterministic from static JSON → compute once at module load (or memoize per code).

Unit tests (`lib/maps/__tests__/region-crop.test.ts`): each of the 7 codes returns a box inside world bounds with aspect ≥ 16:10; bbox actually contains the region's coordinate extremes; unknown code → null.

### 2. `components/maps/region-choropleth.tsx`

New optional prop `focus?: RegionCode | null`:

- `viewBox`: `regionCropViewBox(focus)` when set and non-null, else `geometry.viewBox` (current behavior — also the fallback path for an unknown code).
- **Pin/label scale:** glyph sizes are authored in viewBox units against the 960-wide world. Under a crop, multiply those sizes by `cropWidth / 960` so pins, cluster markers, and the hover name+count pill keep their intended on-screen size instead of appearing ~3–4× too large.
- No behavioral changes: hover, focus, selection halo, dimming, `onSelect` all untouched (`onSelect` already no-ops in locked mode upstream).

### 3. `components/atlas/atlas-explorer.tsx`

In `lockedRegion` mode only:

- Pass `focus={lockedRegion}` to `RegionChoropleth`.
- Wrap the map in a relatively-positioned container with an **edge-fade overlay**: an absolutely-positioned, `pointer-events-none` div layering two CSS linear-gradients (horizontal + vertical), each fading from the page background at 0% to transparent at ~22%, and mirrored on the far side. Fade color uses the `--background` design token (never hardcoded white) so it holds in light and dark themes.
- The legend chips overlay (bottom-start) renders **above** the fade so the counts stay fully legible.

Unlocked mode (`/atlas`, homepage block) renders exactly as today.

## Error handling

- Unknown/missing region code or malformed path data → `regionCropViewBox` returns `null` → full-world viewBox (today's rendering). No throw paths.

## Out of scope

- Any change to `/atlas` or homepage selection behavior (no animated crop-on-select).
- Region switching / unlocking inside community embeds.
- Pin clustering logic, data fetching, filters — all untouched.

## Verification

1. `npm test` — new region-crop unit tests plus existing suite.
2. `npx tsc --noEmit` and eslint on touched files.
3. Rendered check on `http://localhost:3000/en/communities/sub-saharan-africa` (tall region) and `/en/communities/europe-and-northern-america` (wide region): crop + fade present, pins normally sized, legend chips legible above the fade.
4. RTL check on `/ar/communities/sub-saharan-africa`: fade is symmetric and SVG coordinates are direction-agnostic — confirm visually.
5. Confirm `/atlas` and homepage map are pixel-identical to before (no `focus` prop passed).

Note: `/atlas` page SSR is known to time out in local dev (see memory: atlas-route-sanity-timeout) — verify the unlocked surface via the homepage block instead if that recurs.
