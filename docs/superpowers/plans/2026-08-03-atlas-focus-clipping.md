# Atlas Focus-Clipping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the seven regional community pages, render the atlas embed as a "focus clipping" — the map viewport cropped to the page's region with a pronounced edge fade into the page — instead of the full world with a highlight.

**Architecture:** A new pure module computes a per-region crop viewBox from the existing SVG geometry (bbox + padding, widened to a minimum 16:10 aspect, clamped to world bounds). `RegionChoropleth` gains an optional `focus` prop that swaps the viewBox and scales pin/label glyph sizes by `cropWidth/960` so they keep their on-screen size. `AtlasExplorer` passes `focus` and adds a CSS edge-fade overlay — in `lockedRegion` mode only. `/atlas` and the homepage block are pixel-identical to before.

**Tech Stack:** Next.js 16 / React, TypeScript, vitest, Tailwind v4 tokens (`var(--background)`), static SVG geometry at `components/maps/region-geometry-soft.json`.

**Spec:** `docs/superpowers/specs/2026-08-03-atlas-focus-clipping-design.md`

## Global Constraints

- Community-page embeds ONLY: every new behavior is gated on `lockedRegion` / the `focus` prop. Unlocked surfaces must render exactly as today.
- Region stays fixed — no interaction changes to `lockedRegion` mode.
- Fade band: 22% per edge, fading to `var(--background)` (never a hardcoded color — must hold in dark mode).
- Fallback: unknown region or malformed geometry → `null` crop → full-world viewBox (never throw).
- No Claude/AI attribution in commit messages (CLAUDE.md).
- NEVER run `sanity typegen generate` (project gotcha — breaks committed types).

---

### Task 1: `lib/maps/region-crop.ts` — crop math

**Files:**
- Create: `lib/maps/region-crop.ts`
- Test: `lib/maps/__tests__/region-crop.test.ts`

**Interfaces:**
- Consumes: `components/maps/region-geometry-soft.json` (`{ viewBox: string, regions: Record<string, { d: string }> }`), `REGION_CODES` from `lib/maps/region-codes.ts`.
- Produces (Tasks 2 depends on these exact signatures):
  - `regionCrop(code: string): { x: number; y: number; w: number; h: number } | null`
  - `regionCropViewBox(code: string): string | null` — `"x y w h"` string of the same box.

- [ ] **Step 1: Write the failing test**

Create `lib/maps/__tests__/region-crop.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { REGION_CODES } from "../region-codes";
import { regionCrop, regionCropViewBox } from "../region-crop";
import geometry from "@/components/maps/region-geometry-soft.json";

const WORLD = { x: 0, y: 0, w: 960, h: 500 };
const MIN_ASPECT = 16 / 10;

describe("regionCrop", () => {
  it("returns a box for every canonical region code", () => {
    for (const code of REGION_CODES) {
      expect(regionCrop(code), code).not.toBeNull();
    }
  });

  it("every box lies inside world bounds", () => {
    for (const code of REGION_CODES) {
      const b = regionCrop(code)!;
      expect(b.x, code).toBeGreaterThanOrEqual(WORLD.x);
      expect(b.y, code).toBeGreaterThanOrEqual(WORLD.y);
      expect(b.x + b.w, code).toBeLessThanOrEqual(WORLD.x + WORLD.w);
      expect(b.y + b.h, code).toBeLessThanOrEqual(WORLD.y + WORLD.h);
      expect(b.w, code).toBeGreaterThan(0);
      expect(b.h, code).toBeGreaterThan(0);
    }
  });

  it("every box meets the minimum 16:10 aspect ratio (within clamp tolerance)", () => {
    for (const code of REGION_CODES) {
      const b = regionCrop(code)!;
      // Clamping to world bounds may trim a widened box; allow 1% tolerance.
      expect(b.w / b.h, code).toBeGreaterThanOrEqual(MIN_ASPECT * 0.99);
    }
  });

  it("box contains the region's raw coordinate extremes", () => {
    // Raw bbox from path data (control points included) must fit inside the crop.
    for (const code of REGION_CODES) {
      const d = (geometry.regions as Record<string, { d: string }>)[code].d;
      const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      const b = regionCrop(code)!;
      expect(Math.min(...xs), code).toBeGreaterThanOrEqual(b.x);
      expect(Math.max(...xs), code).toBeLessThanOrEqual(b.x + b.w);
      expect(Math.min(...ys), code).toBeGreaterThanOrEqual(b.y);
      expect(Math.max(...ys), code).toBeLessThanOrEqual(b.y + b.h);
    }
  });

  it("unknown code returns null", () => {
    expect(regionCrop("atlantis")).toBeNull();
    expect(regionCropViewBox("atlantis")).toBeNull();
  });

  it("viewBox string matches the box", () => {
    const b = regionCrop("ssa")!;
    expect(regionCropViewBox("ssa")).toBe(
      `${b.x} ${b.y} ${b.w} ${b.h}`
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/maps/__tests__/region-crop.test.ts`
Expected: FAIL — `Cannot find module '../region-crop'` (or equivalent resolve error).

- [ ] **Step 3: Write the implementation**

Create `lib/maps/region-crop.ts`:

```ts
import geometry from "@/components/maps/region-geometry-soft.json";

/** World coordinate space of the atlas artwork (region-geometry-soft.json). */
const WORLD = { x: 0, y: 0, w: 960, h: 500 };
/** Breathing room around the region's raw bbox, in viewBox units. */
const PAD = 40;
/** Tall regions (ssa, lac) are WIDENED to this floor instead of producing a
 *  near-square embed — keeps map height consistent across all seven pages. */
const MIN_ASPECT = 16 / 10;

export type CropBox = { x: number; y: number; w: number; h: number };

const cache = new Map<string, CropBox | null>();

/** Crop box for a region: raw path bbox + padding, widened to MIN_ASPECT
 *  (centered), clamped inside the world. Null for unknown/malformed input —
 *  callers fall back to the full-world viewBox. Coordinates include curve
 *  control points, a slight overestimate the padding absorbs. */
export function regionCrop(code: string): CropBox | null {
  if (cache.has(code)) return cache.get(code)!;
  const d = (geometry.regions as Record<string, { d: string }>)[code]?.d;
  let box: CropBox | null = null;
  if (d) {
    const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (nums.length >= 4) {
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      let x0 = Math.min(...xs) - PAD;
      let x1 = Math.max(...xs) + PAD;
      let y0 = Math.min(...ys) - PAD;
      let y1 = Math.max(...ys) + PAD;
      // Widen (never shrink) to the minimum aspect, centered on the region.
      const h = y1 - y0;
      const minW = h * MIN_ASPECT;
      if (x1 - x0 < minW) {
        const grow = (minW - (x1 - x0)) / 2;
        x0 -= grow;
        x1 += grow;
      }
      // Clamp: shift back inside the world, then trim whatever still overflows.
      if (x0 < WORLD.x) { x1 += WORLD.x - x0; x0 = WORLD.x; }
      if (y0 < WORLD.y) { y1 += WORLD.y - y0; y0 = WORLD.y; }
      if (x1 > WORLD.x + WORLD.w) { x0 -= x1 - (WORLD.x + WORLD.w); x1 = WORLD.x + WORLD.w; }
      if (y1 > WORLD.y + WORLD.h) { y0 -= y1 - (WORLD.y + WORLD.h); y1 = WORLD.y + WORLD.h; }
      x0 = Math.max(x0, WORLD.x);
      y0 = Math.max(y0, WORLD.y);
      box = {
        x: Math.round(x0),
        y: Math.round(y0),
        w: Math.round(x1 - x0),
        h: Math.round(y1 - y0),
      };
    }
  }
  cache.set(code, box);
  return box;
}

/** `regionCrop` as an SVG viewBox string ("x y w h"), null for unknown codes. */
export function regionCropViewBox(code: string): string | null {
  const b = regionCrop(code);
  return b ? `${b.x} ${b.y} ${b.w} ${b.h}` : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/maps/__tests__/region-crop.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Full gates**

Run: `npx tsc --noEmit && npx eslint lib/maps/region-crop.ts lib/maps/__tests__/region-crop.test.ts && npx vitest run`
Expected: tsc clean, eslint clean, full suite green (579+ tests).

- [ ] **Step 6: Commit**

```bash
git add lib/maps/region-crop.ts lib/maps/__tests__/region-crop.test.ts
git commit -m "feat(atlas): region crop-box math for the focus-clipping embed"
```

---

### Task 2: `RegionChoropleth` `focus` prop — cropped viewBox + scaled glyphs

**Files:**
- Modify: `components/maps/region-choropleth.tsx`

**Interfaces:**
- Consumes: `regionCrop(code)` from Task 1 (`{ x, y, w, h } | null`).
- Produces: `RegionChoropleth` accepts optional `focus?: RegionCode | null`. Task 3 passes it. Without `focus` (or with an unknown code) rendering is byte-identical to today.

Glyph sizes are authored in viewBox units against the 960-wide world ("pins render ~40px"). A crop of ~260 units wide zooms ~3.7×, so every authored size is multiplied by `s = cropWidth / 960` to keep its on-screen size. Text sizes move from Tailwind `text-[13px]` classes to the SVG `fontSize` attribute (a class can't take a runtime value); `fontSize={13}` with `s = 1` is identical to `text-[13px]`.

- [ ] **Step 1: Add the prop, crop, and scale factor**

In `components/maps/region-choropleth.tsx`:

Add the import (after the `region-codes` type import):

```ts
import { regionCrop } from '@/lib/maps/region-crop'
```

Add `focus` to the destructured props and the props type:

```ts
  pins,
  onPinClick,
  focus,
}: {
  ...
  pins?: PinCluster[]
  onPinClick?: (cluster: PinCluster) => void
  /** Focus-clipping mode (community-page embeds): crop the viewport to this
   *  region and scale glyphs so they keep their on-screen size. Unknown code
   *  → null crop → full-world rendering (identical to omitting the prop). */
  focus?: RegionCode | null
}
```

Inside the component body, right before the `DONUT_R` constants, compute the crop and scale, and make the constants scale-aware:

```ts
  const crop = focus ? regionCrop(focus) : null
  // Glyphs are authored in viewBox units against the 960-wide world; under a
  // crop the same units render crop-factor× larger, so every authored size is
  // multiplied by `s` to hold its on-screen size.
  const s = crop ? crop.w / 960 : 1
  const DONUT_R = 16 * s
  const DONUT_STROKE = 5 * s
  const CORE_R = DONUT_R - DONUT_STROKE / 2 - 1 * s
  const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R
  const SEGMENT_GAP = DONUT_CIRCUMFERENCE * 0.045
```

(Replace the existing five constant declarations — `DONUT_R = 16`, `DONUT_STROKE = 5`, `CORE_R = DONUT_R - DONUT_STROKE / 2 - 1`, and the two derived ones — with the block above.)

- [ ] **Step 2: Swap the viewBox**

```tsx
    <svg
      viewBox={crop ? `${crop.x} ${crop.y} ${crop.w} ${crop.h}` : geometry.viewBox}
```

- [ ] **Step 3: Scale the remaining authored sizes**

Each is a mechanical `× s` on the existing literal. With `s = 1` every value is unchanged.

Hover-label positioning (`showLabel`):

```ts
    setHoverLabel({ code, x: b.x + b.width / 2, y: Math.max(b.y - 6 * s, 14 * s) })
```

Selection halo stroke:

```tsx
            strokeWidth={14 * s}
```

Cluster hover halo: `r={DONUT_R + 5 * s}` (DONUT_R already carries `s`).

Cluster count text — replace the class-based font size:

```tsx
                <text x={c.x} y={c.y + 4.5 * s} textAnchor="middle"
                  fontSize={13 * s}
                  className="pointer-events-none font-heading font-bold tabular-nums"
                  fill={CCM.midnight}>
                  {c.count}
                </text>
```

Single-item droplet (all three elements):

```tsx
                <circle cx={c.x} cy={c.y - 13 * s} r={15 * s} fill={color}
                  className="opacity-0 transition-opacity duration-200 group-hover/pin:opacity-15 group-focus-visible/pin:opacity-15 motion-reduce:transition-none" />
                <path
                  d="M0 0C0 0 6.5 -6 6.5 -10.5A6.5 6.5 0 1 0 -6.5 -10.5C-6.5 -6 0 0 0 0Z"
                  transform={`translate(${c.x} ${c.y}) scale(${1.6 * s})`}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5 * s}
                  className="drop-shadow-[0_1.5px_3px_rgba(11,49,96,0.3)]"
                />
                <circle cx={c.x} cy={c.y - 16.8 * s} r={3.6 * s} fill="white" />
```

Floating name+count pill — scale the measured width, box, and font:

```tsx
        const w = (text.length * 7.6 + 30) * s
        return (
          <g className="pointer-events-none" aria-hidden>
            <rect x={hoverLabel.x - w / 2} y={hoverLabel.y - 15 * s} width={w} height={30 * s} rx={15 * s}
              fill="white" className="drop-shadow-[0_3px_8px_rgba(11,49,96,0.3)]" />
            <text x={hoverLabel.x} y={hoverLabel.y + 4.5 * s} textAnchor="middle"
              fontSize={13 * s}
              className="font-heading font-bold" fill={CCM.midnight}>
              {name} <tspan fill={CCM.sea}>· {datum?.value ?? 0}</tspan>
            </text>
          </g>
        )
```

(The two `text-[13px]` classes are removed in favor of `fontSize`; keep every other class as-is.)

- [ ] **Step 4: Gates**

Run: `npx tsc --noEmit && npx eslint components/maps/region-choropleth.tsx && npx vitest run`
Expected: all clean/green. There is no component-level test harness in this repo; the rendered check happens in Task 4.

- [ ] **Step 5: Commit**

```bash
git add components/maps/region-choropleth.tsx
git commit -m "feat(atlas): focus prop crops the choropleth viewport with scale-true glyphs"
```

---

### Task 3: `AtlasExplorer` locked mode — pass `focus` + edge-fade overlay

**Files:**
- Modify: `components/atlas/atlas-explorer.tsx` (map block, around lines 349–360)

**Interfaces:**
- Consumes: `RegionChoropleth`'s `focus` prop (Task 2).
- Produces: the finished locked-embed rendering. No API change for callers of `AtlasExplorer`.

- [ ] **Step 1: Pass `focus` and add the overlay**

In the map block (`<div className="relative min-w-0">`), pass `focus` to the choropleth and insert the fade overlay directly after it:

```tsx
      <div className="relative min-w-0">
        <RegionChoropleth
          data={regionData}
          activeCode={active}
          selectedCode={effectiveRegion ?? null}
          onHover={setActive}
          onSelect={onSelect}
          labelFor={labelFor}
          pins={pinsData?.pins}
          onPinClick={setOpenCluster}
          focus={lockedRegion ?? null}
        />
        {/* Focus-clipping edge fade (spec 2026-08-03): in locked mode the four
            frame edges melt into the page instead of a hard slice — the embed
            reads as a clipping lifted out of the atlas. 22% band per edge,
            fading to the background TOKEN so it holds in dark mode. pointer-
            events-none keeps region hover/click and pins fully interactive;
            the legend chips (z-10) and cluster panel (z-20) sit above it. */}
        {lockedRegion && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{
              background:
                'linear-gradient(to right, var(--background), transparent 22%, transparent 78%, var(--background)), ' +
                'linear-gradient(to bottom, var(--background), transparent 22%, transparent 78%, var(--background))',
            }}
          />
        )}
```

(Everything after — the legend-chips div, `openCluster` panel — stays untouched.)

- [ ] **Step 2: Gates**

Run: `npx tsc --noEmit && npx eslint components/atlas/atlas-explorer.tsx && npx vitest run`
Expected: all clean/green.

- [ ] **Step 3: Commit**

```bash
git add components/atlas/atlas-explorer.tsx
git commit -m "feat(atlas): community embeds render as a focus clipping of the atlas"
```

---

### Task 4: Rendered verification (all surfaces)

**Files:** none (verification only).

**Interfaces:** consumes the finished feature; produces evidence.

- [ ] **Step 1: Community pages — clipping present and correct**

With the dev server on `localhost:3000`, load and screenshot (browser tools):
- `http://localhost:3000/en/communities/sub-saharan-africa` (tall region — exercises the 16:10 widening)
- `http://localhost:3000/en/communities/europe-and-northern-america` (wide region)

Check each: map is cropped to the region (neighbours sliced at the frame), edges fade into the page over a pronounced band, gold halo present, pins/cluster donuts and the hover pill are their normal on-screen size (~40px pins, not gigantic), legend chips legible above the fade.

- [ ] **Step 2: RTL**

Load `http://localhost:3000/ar/communities/sub-saharan-africa`: same crop + symmetric fade; no mirrored/broken layout.

- [ ] **Step 3: Unlocked surfaces unchanged**

Load the homepage (`/en`) and scroll to the region-map block: full world view, selection behavior as before, no fade overlay. If `/atlas` loads locally (known SSR timeout gotcha — skip if it hangs), spot-check it too.

- [ ] **Step 4: Console clean**

Browser console on the pages above: no hydration errors, no React warnings from the SVG changes.

- [ ] **Step 5: Final gates + report**

Run: `npx tsc --noEmit && npx eslint . --quiet && npx vitest run`
Expected: clean. Report results with screenshots to the user; do NOT push or deploy (prod promotion is user-gated).
