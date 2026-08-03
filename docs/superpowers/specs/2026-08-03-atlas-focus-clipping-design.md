# Atlas focus-clipping on regional community pages — design

**Date:** 2026-08-03
**Status:** Approved (visual direction chosen via mockups: cropped zoom + pronounced edge fade)

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
