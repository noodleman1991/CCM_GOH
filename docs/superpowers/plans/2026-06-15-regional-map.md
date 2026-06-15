# Interactive Regional Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A reusable, mobile-first interactive world map that colours the 7 UN-M49 regions by a selectable facet (case studies / members / news), styled in the app's CCM illustration aesthetic, usable as a Sanity block and wired into search.

**Architecture:** Geometry is derived **at build time** — a Node script merges Natural Earth country polygons into 7 region shapes (via a pure, tested ISO→region map), projects + simplifies them, and emits a tiny committed JSON of SVG path strings. At runtime there is **no map library and no geo math**: a presentational React component renders those paths as a choropleth, coloured by normalized facet data from one faceted API route. Region code is the universal join key (matches the existing `regionalCommunities` Algolia facet and Prisma `RegionalCommunityName` enum), so clicking a region filters search with zero new geocoding.

**Tech Stack:** Next.js 16 App Router, TypeScript, vitest (TDD for pure logic), d3-geo + topojson-client + world-atlas (devDependencies only, build-time), Sanity block + GROQ, Prisma `safeQuery`, next-intl, CCM design tokens.

---

## Region enum (the 7 regions) — canonical, used everywhere in this plan

Prisma `RegionalCommunityName` (prisma/schema.prisma:218) and the i18n labels (`messages/*.json` → `navigation.regions`) define these. Use this exact mapping of **enum value ↔ i18n key**:

| Region enum (Prisma / Algolia facet value) | i18n key (`navigation.regions.*`) |
|---|---|
| `SUB_SAHARAN_AFRICA` | `subSaharanAfrica` |
| `NORTHERN_AFRICA_AND_WESTERN_ASIA` | `northernAfricaWesternAsia` |
| `CENTRAL_AND_SOUTHERN_ASIA` | `centralSouthernAsia` |
| `EASTERN_AND_SOUTH_EASTERN_ASIA` | `easternSouthEasternAsia` |
| `LATIN_AMERICA_AND_THE_CARIBBEAN` | `latinAmericaCaribbean` |
| `OCEANIA` | `oceania` |
| `EUROPE_AND_NORTH_AMERICA` | `europeNorthAmerica` |

These are the **UN M49 "SDG regions"**, which have an official ISO-3166 country membership. The build script assigns every country to exactly one.

---

## File structure (responsibilities)

- `lib/maps/region-codes.ts` — the `RegionCode` union type + ordered `REGION_CODES` array + `REGION_I18N_KEY` map. Single source of truth, no logic. Importable by both runtime and build script.
- `lib/maps/iso-to-region.ts` — **pure, TDD.** `isoToRegion(iso3: string): RegionCode | null`. The correctness-critical UN-M49 membership table (ISO-3166 alpha-3 → region).
- `lib/maps/__tests__/iso-to-region.test.ts` — tests: spot-check countries per region, all 7 regions non-empty, no country in two regions, unknown returns null.
- `lib/maps/region-facets.ts` — **pure, TDD.** `aggregateRegionData(counts, facet): RegionDatum[]` — turns raw `{ [regionCode]: number }` into normalized data with `intensity` (0–1) buckets for colouring, plus the facet registry (`FACETS`).
- `lib/maps/__tests__/region-facets.test.ts` — tests: empty input → all-zero data with intensity 0; max value → intensity 1; ordering; unknown facet throws.
- `scripts/build-region-map.mjs` — **build-time.** Downloads/loads world-atlas TopoJSON, merges countries→7 regions using `isoToRegion`, projects (Natural Earth-ish), simplifies, emits `components/maps/region-geometry.json`. Run manually (`pnpm build:map`), output committed.
- `components/maps/region-geometry.json` — committed output: `{ viewBox, regions: { [code]: { d } } }`.
- `components/maps/region-choropleth.tsx` — **presentational, client.** Renders the SVG paths, colours by `RegionDatum.intensity`, hover/tap → active region, click → `onRegionClick`. Mobile-first, CCM palette, RTL-safe.
- `components/maps/region-data-panel.tsx` — the side/below panel showing the active region's label + value + a small legend.
- `app/api/maps/region-data/route.ts` — faceted API: `?facet=caseStudyCount|memberCount|newsCount` → `{ facet, data: RegionDatum[] }`. Sanity counts + Prisma member counts via `safeQuery`. `revalidate` tag.
- `sanity/schemas/blocks/maps/region-map.ts` — Sanity block schema (`region-map`): title, description, default facet, allowed facets, padding, colorVariant.
- `sanity/queries/maps/region-map.ts` — `regionMapQuery` projection fragment.
- `components/blocks/maps/region-map.tsx` — block wrapper: fetches data client-side from the API, renders choropleth + panel + facet switcher; consumes localized title/description.
- Modifications: `lib/maps` barrel not needed; register block in `components/blocks/index.tsx`, `sanity/schema.ts`; splice `regionMapQuery` into `sanity/queries/page.ts`, `homepage.ts`, `regional-community-page.ts`; add `messages/*.json` map strings ×4; add devDeps; add `build:map` script to package.json.

---

## Task 1: Region codes single source of truth

**Files:**
- Create: `lib/maps/region-codes.ts`

- [ ] **Step 1: Implement the constants module**

```ts
// lib/maps/region-codes.ts
/** The 7 UN-M49 "SDG regions" used across the hub. Values match the Prisma
 *  `RegionalCommunityName` enum and the Algolia `regionalCommunities` facet. */
export const REGION_CODES = [
  "SUB_SAHARAN_AFRICA",
  "NORTHERN_AFRICA_AND_WESTERN_ASIA",
  "CENTRAL_AND_SOUTHERN_ASIA",
  "EASTERN_AND_SOUTH_EASTERN_ASIA",
  "LATIN_AMERICA_AND_THE_CARIBBEAN",
  "OCEANIA",
  "EUROPE_AND_NORTH_AMERICA",
] as const;

export type RegionCode = (typeof REGION_CODES)[number];

/** Map a region code to its `navigation.regions.<key>` i18n key. */
export const REGION_I18N_KEY: Record<RegionCode, string> = {
  SUB_SAHARAN_AFRICA: "subSaharanAfrica",
  NORTHERN_AFRICA_AND_WESTERN_ASIA: "northernAfricaWesternAsia",
  CENTRAL_AND_SOUTHERN_ASIA: "centralSouthernAsia",
  EASTERN_AND_SOUTH_EASTERN_ASIA: "easternSouthEasternAsia",
  LATIN_AMERICA_AND_THE_CARIBBEAN: "latinAmericaCaribbean",
  OCEANIA: "oceania",
  EUROPE_AND_NORTH_AMERICA: "europeNorthAmerica",
};

export function isRegionCode(v: string): v is RegionCode {
  return (REGION_CODES as readonly string[]).includes(v);
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add lib/maps/region-codes.ts
git commit -m "Add region codes single source of truth for the map"
```

---

## Task 2: ISO→region mapping (pure, TDD — correctness-critical)

**Files:**
- Create: `lib/maps/iso-to-region.ts`
- Test: `lib/maps/__tests__/iso-to-region.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/maps/__tests__/iso-to-region.test.ts
import { describe, it, expect } from "vitest";
import { isoToRegion, REGION_MEMBERSHIP } from "../iso-to-region";
import { REGION_CODES } from "../region-codes";

describe("isoToRegion", () => {
  it("maps representative countries to the right region", () => {
    expect(isoToRegion("KEN")).toBe("SUB_SAHARAN_AFRICA");
    expect(isoToRegion("EGY")).toBe("NORTHERN_AFRICA_AND_WESTERN_ASIA");
    expect(isoToRegion("IND")).toBe("CENTRAL_AND_SOUTHERN_ASIA");
    expect(isoToRegion("JPN")).toBe("EASTERN_AND_SOUTH_EASTERN_ASIA");
    expect(isoToRegion("BRA")).toBe("LATIN_AMERICA_AND_THE_CARIBBEAN");
    expect(isoToRegion("AUS")).toBe("OCEANIA");
    expect(isoToRegion("FRA")).toBe("EUROPE_AND_NORTH_AMERICA");
    expect(isoToRegion("USA")).toBe("EUROPE_AND_NORTH_AMERICA");
  });

  it("returns null for unknown / non-country codes", () => {
    expect(isoToRegion("ZZZ")).toBeNull();
    expect(isoToRegion("ATA")).toBeNull(); // Antarctica — not in any SDG region
  });

  it("assigns every membership entry to a known region code", () => {
    for (const code of Object.values(REGION_MEMBERSHIP)) {
      expect(REGION_CODES).toContain(code);
    }
  });

  it("never assigns a country to two regions", () => {
    const seen = new Set<string>();
    for (const iso of Object.keys(REGION_MEMBERSHIP)) {
      expect(seen.has(iso)).toBe(false);
      seen.add(iso);
    }
  });

  it("has at least one country in every region", () => {
    const regions = new Set(Object.values(REGION_MEMBERSHIP));
    for (const code of REGION_CODES) {
      expect(regions.has(code)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/maps/__tests__/iso-to-region.test.ts`
Expected: FAIL — cannot find module `../iso-to-region`.

- [ ] **Step 3: Implement the membership table**

Create `lib/maps/iso-to-region.ts`. Build `REGION_MEMBERSHIP: Record<string, RegionCode>` keyed by ISO-3166 alpha-3, following the official UN M49 SDG-region composition. The table is long (~195 entries) but mechanical — source it from the UN M49 standard (https://unstats.un.org/unsd/methodology/m49/). Structure:

```ts
import { RegionCode } from "./region-codes";

/** ISO-3166 alpha-3 → UN-M49 SDG region. Source: UN M49 standard.
 *  Antarctica (ATA) and uninhabited territories are intentionally omitted. */
export const REGION_MEMBERSHIP: Record<string, RegionCode> = {
  // Sub-Saharan Africa
  AGO: "SUB_SAHARAN_AFRICA", BEN: "SUB_SAHARAN_AFRICA", BWA: "SUB_SAHARAN_AFRICA",
  /* ...all SSA countries... */
  // Northern Africa and Western Asia
  DZA: "NORTHERN_AFRICA_AND_WESTERN_ASIA", EGY: "NORTHERN_AFRICA_AND_WESTERN_ASIA",
  /* ...incl. Western Asia: SAU, ARE, ISR, TUR, etc... */
  // Central and Southern Asia
  IND: "CENTRAL_AND_SOUTHERN_ASIA", PAK: "CENTRAL_AND_SOUTHERN_ASIA",
  /* ...incl. KAZ, UZB, AFG, IRN... */
  // Eastern and South-Eastern Asia
  CHN: "EASTERN_AND_SOUTH_EASTERN_ASIA", JPN: "EASTERN_AND_SOUTH_EASTERN_ASIA",
  /* ...incl. KOR, VNM, IDN, THA, PHL... */
  // Latin America and the Caribbean
  BRA: "LATIN_AMERICA_AND_THE_CARIBBEAN", MEX: "LATIN_AMERICA_AND_THE_CARIBBEAN",
  /* ...all Central/South America + Caribbean... */
  // Oceania
  AUS: "OCEANIA", NZL: "OCEANIA", FJI: "OCEANIA", PNG: "OCEANIA",
  /* ...all Pacific island states... */
  // Europe and North America
  FRA: "EUROPE_AND_NORTH_AMERICA", DEU: "EUROPE_AND_NORTH_AMERICA",
  USA: "EUROPE_AND_NORTH_AMERICA", CAN: "EUROPE_AND_NORTH_AMERICA",
  /* ...all of Europe + USA + CAN... */
};

export function isoToRegion(iso3: string): RegionCode | null {
  return REGION_MEMBERSHIP[iso3] ?? null;
}
```

**Implementer note:** populate the FULL table (every UN member + observer with a polygon in world-atlas). Cross-check against the UN M49 page. The tests assert all 7 regions are populated and there are no duplicates; a thorough table passes them.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/maps/__tests__/iso-to-region.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/maps/iso-to-region.ts lib/maps/__tests__/iso-to-region.test.ts
git commit -m "Add tested ISO-to-region (UN M49) mapping for the map"
```

---

## Task 3: Facet aggregation + registry (pure, TDD)

**Files:**
- Create: `lib/maps/region-facets.ts`
- Test: `lib/maps/__tests__/region-facets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/maps/__tests__/region-facets.test.ts
import { describe, it, expect } from "vitest";
import { aggregateRegionData, FACETS, type FacetId } from "../region-facets";
import { REGION_CODES } from "../region-codes";

const zero = () =>
  Object.fromEntries(REGION_CODES.map((c) => [c, 0])) as Record<string, number>;

describe("aggregateRegionData", () => {
  it("returns a datum for every region, in canonical order", () => {
    const data = aggregateRegionData(zero(), "caseStudyCount");
    expect(data.map((d) => d.code)).toEqual([...REGION_CODES]);
  });

  it("all-zero counts give intensity 0 everywhere", () => {
    const data = aggregateRegionData(zero(), "caseStudyCount");
    expect(data.every((d) => d.intensity === 0 && d.value === 0)).toBe(true);
  });

  it("scales intensity to the max value (max → 1)", () => {
    const counts = zero();
    counts.OCEANIA = 5;
    counts.EUROPE_AND_NORTH_AMERICA = 10;
    const data = aggregateRegionData(counts, "memberCount");
    const oce = data.find((d) => d.code === "OCEANIA")!;
    const eur = data.find((d) => d.code === "EUROPE_AND_NORTH_AMERICA")!;
    expect(eur.intensity).toBe(1);
    expect(oce.intensity).toBeCloseTo(0.5);
  });

  it("exposes the three facets", () => {
    const ids = FACETS.map((f) => f.id).sort();
    expect(ids).toEqual(
      (["caseStudyCount", "memberCount", "newsCount"] as FacetId[]).sort()
    );
  });

  it("throws on an unknown facet", () => {
    expect(() => aggregateRegionData(zero(), "nope" as FacetId)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run lib/maps/__tests__/region-facets.test.ts`
Expected: FAIL — cannot find module `../region-facets`.

- [ ] **Step 3: Implement**

```ts
// lib/maps/region-facets.ts
import { REGION_CODES, REGION_I18N_KEY, type RegionCode } from "./region-codes";

export type FacetId = "caseStudyCount" | "memberCount" | "newsCount";

export interface FacetDef {
  id: FacetId;
  /** i18n key under the `map` namespace for the facet's label. */
  labelKey: string;
}

export const FACETS: FacetDef[] = [
  { id: "caseStudyCount", labelKey: "facetCaseStudies" },
  { id: "memberCount", labelKey: "facetMembers" },
  { id: "newsCount", labelKey: "facetNews" },
];

export interface RegionDatum {
  code: RegionCode;
  i18nKey: string;
  value: number;
  /** 0–1, scaled to the max value in this dataset, for choropleth shading. */
  intensity: number;
}

export function aggregateRegionData(
  counts: Record<string, number>,
  facet: FacetId
): RegionDatum[] {
  if (!FACETS.some((f) => f.id === facet)) {
    throw new Error(`Unknown facet: ${facet}`);
  }
  const max = Math.max(0, ...REGION_CODES.map((c) => counts[c] ?? 0));
  return REGION_CODES.map((code) => {
    const value = counts[code] ?? 0;
    return {
      code,
      i18nKey: REGION_I18N_KEY[code],
      value,
      intensity: max === 0 ? 0 : value / max,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run lib/maps/__tests__/region-facets.test.ts`
Expected: PASS (all 5 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/maps/region-facets.ts lib/maps/__tests__/region-facets.test.ts
git commit -m "Add tested region facet aggregation + registry"
```

---

## Task 4: Build-time geometry script

**Files:**
- Modify: `package.json` (devDeps + `build:map` script)
- Create: `scripts/build-region-map.mjs`
- Create (generated, committed): `components/maps/region-geometry.json`

- [ ] **Step 1: Add devDependencies and script**

Run:
```bash
pnpm add -D topojson-client topojson-simplify d3-geo world-atlas
```
Then add to `package.json` scripts: `"build:map": "node scripts/build-region-map.mjs"`.

- [ ] **Step 2: Write the build script**

```js
// scripts/build-region-map.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature, merge } from "topojson-client";
import { isoToRegion } from "../lib/maps/iso-to-region.ts";
import { REGION_CODES } from "../lib/maps/region-codes.ts";

// NOTE: run via tsx so the .ts imports resolve: `pnpm dlx tsx scripts/build-region-map.mjs`
// (or add tsx as a devDep and set "build:map": "tsx scripts/build-region-map.mjs").

const require = createRequire(import.meta.url);
const world = require("world-atlas/countries-110m.json");
const countries = feature(world, world.objects.countries);

// world-atlas uses numeric ISO codes; map them to alpha-3 via the bundled id
// property is numeric — so we need a numeric→alpha3 table. d3 provides none, so
// load it from the `world-atlas` companion or an inline minimal numeric→a3 map.
// Implementer: use the `i18n-iso-countries` devDep (numericToAlpha3) for this.

const VIEWBOX_W = 960;
const VIEWBOX_H = 500;
const projection = geoNaturalEarth1().fitSize([VIEWBOX_W, VIEWBOX_H], countries);
const path = geoPath(projection);

const out = { viewBox: `0 0 ${VIEWBOX_W} ${VIEWBOX_H}`, regions: {} };

for (const code of REGION_CODES) {
  const members = world.objects.countries.geometries.filter((g) => {
    const a3 = numericToAlpha3(String(g.id).padStart(3, "0")); // implementer: helper
    return a3 && isoToRegion(a3) === code;
  });
  if (members.length === 0) continue;
  const merged = merge(world, members); // MultiPolygon in lon/lat
  const d = path(merged);
  out.regions[code] = { d };
}

writeFileSync(
  new URL("../components/maps/region-geometry.json", import.meta.url),
  JSON.stringify(out)
);
console.log("Wrote components/maps/region-geometry.json", Object.keys(out.regions));
```

**Implementer note:** world-atlas geometry `id` is the **numeric** ISO code; convert to alpha-3 before calling `isoToRegion`. Add `i18n-iso-countries` as a devDep and use `countries.numericToAlpha3`. Set the script command to use `tsx` (add as devDep) so the `.ts` imports work. Simplify with `topojson-simplify` (`presimplify`+`simplify`) BEFORE projecting if the output JSON is large (>~60KB); aim for a compact file.

- [ ] **Step 3: Run the script and inspect**

Run: `pnpm build:map`
Expected: writes `components/maps/region-geometry.json`; logs all 7 region codes. Open the file: it has `viewBox` and a `regions` object with 7 keys each holding a non-empty `d` string starting with `M`.

- [ ] **Step 4: Sanity-check the geometry renders**

Create a throwaway check: paste one `d` into an SVG `<path>` in a scratch file or use an online SVG viewer; confirm it looks like the region's landmasses. Delete the scratch file.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml scripts/build-region-map.mjs components/maps/region-geometry.json
git commit -m "Add build-time region geometry script + generated map JSON"
```

---

## Task 5: Choropleth presentational component (mobile-first, CCM style)

**Files:**
- Create: `components/maps/region-choropleth.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// components/maps/region-choropleth.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import geometry from './region-geometry.json'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'

/**
 * Presentational choropleth: renders the 7 region paths from the build-time
 * geometry, shaded by each datum's `intensity` using the CCM palette (sky →
 * sea). Data-agnostic — the parent supplies data + labels + handlers. Mobile-
 * first: the SVG scales fluidly to its container; regions are large tap targets.
 */
export function RegionChoropleth({
  data,
  activeCode,
  onHover,
  onSelect,
  labelFor,
  className,
}: {
  data: RegionDatum[]
  activeCode?: RegionCode | null
  onHover?: (code: RegionCode | null) => void
  onSelect?: (code: RegionCode) => void
  labelFor: (code: RegionCode) => string
  className?: string
}) {
  const byCode = new Map(data.map((d) => [d.code, d]))
  const regions = geometry.regions as Record<string, { d: string }>

  // CCM palette shading: lerp from sky (#9BC6DA, low) toward sea (#205596, high).
  const fillFor = (intensity: number) => {
    // 0 → very light sky tint; 1 → full sea. Keep a visible floor so zero isn't invisible.
    const t = 0.15 + intensity * 0.85
    return `color-mix(in srgb, var(--color-ccm-sea) ${Math.round(t * 100)}%, white)`
  }

  return (
    <svg
      viewBox={geometry.viewBox}
      className={cn('h-auto w-full select-none', className)}
      role="img"
      aria-label="Regional map"
    >
      {Object.entries(regions).map(([code, { d }]) => {
        const datum = byCode.get(code as RegionCode)
        const intensity = datum?.intensity ?? 0
        const isActive = activeCode === code
        return (
          <path
            key={code}
            d={d}
            tabIndex={0}
            role="button"
            aria-label={`${labelFor(code as RegionCode)}: ${datum?.value ?? 0}`}
            fill={fillFor(intensity)}
            stroke="white"
            strokeWidth={isActive ? 1.5 : 0.75}
            strokeLinejoin="round"
            className={cn(
              'cursor-pointer outline-none transition-[fill,opacity] duration-200',
              'hover:opacity-90 focus-visible:opacity-90',
              activeCode && !isActive && 'opacity-60'
            )}
            onMouseEnter={() => onHover?.(code as RegionCode)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(code as RegionCode)}
            onClick={() => onSelect?.(code as RegionCode)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(code as RegionCode)
              }
            }}
          />
        )
      })}
    </svg>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/maps/region-choropleth.tsx
git commit -m "Add presentational region choropleth (CCM-styled, mobile-first)"
```

---

## Task 6: Data panel + legend

**Files:**
- Create: `components/maps/region-data-panel.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/maps/region-data-panel.tsx
'use client'

import { cn } from '@/lib/utils'
import type { RegionDatum } from '@/lib/maps/region-facets'
import type { RegionCode } from '@/lib/maps/region-codes'

/**
 * The panel beside (desktop) / below (mobile) the map. Shows the active region's
 * label + value, or a ranked list when nothing is hovered. Uses logical props
 * so it mirrors correctly in RTL.
 */
export function RegionDataPanel({
  data,
  activeCode,
  facetLabel,
  labelFor,
  onSelect,
  className,
}: {
  data: RegionDatum[]
  activeCode?: RegionCode | null
  facetLabel: string
  labelFor: (code: RegionCode) => string
  onSelect?: (code: RegionCode) => void
  className?: string
}) {
  const ranked = [...data].sort((a, b) => b.value - a.value)
  const active = activeCode ? data.find((d) => d.code === activeCode) : null

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-ccm-water">
        {facetLabel}
      </p>
      {active ? (
        <div className="mt-2">
          <p className="text-lg font-bold text-ccm-midnight">{labelFor(active.code)}</p>
          <p className="text-3xl font-bold text-[var(--color-ccm-sea)]">{active.value}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {ranked.map((d) => (
            <li key={d.code}>
              <button
                type="button"
                onClick={() => onSelect?.(d.code)}
                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-start text-sm hover:bg-muted"
              >
                <span className="truncate text-foreground/80">{labelFor(d.code)}</span>
                <span className="shrink-0 font-semibold text-ccm-midnight">{d.value}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/maps/region-data-panel.tsx
git commit -m "Add region data panel + ranked list"
```

---

## Task 7: Faceted data API route

**Files:**
- Create: `app/api/maps/region-data/route.ts`

- [ ] **Step 1: Implement the route**

```ts
// app/api/maps/region-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/db-utils"; // implementer: confirm safeQuery's import path
import { REGION_CODES } from "@/lib/maps/region-codes";
import { aggregateRegionData, FACETS, type FacetId } from "@/lib/maps/region-facets";

export const revalidate = 300; // counts change slowly

function emptyCounts(): Record<string, number> {
  return Object.fromEntries(REGION_CODES.map((c) => [c, 0]));
}

export async function GET(req: NextRequest) {
  const facet = (req.nextUrl.searchParams.get("facet") || "caseStudyCount") as FacetId;
  if (!FACETS.some((f) => f.id === facet)) {
    return NextResponse.json({ error: "Unknown facet" }, { status: 400 });
  }

  const counts = emptyCounts();

  try {
    if (facet === "caseStudyCount" || facet === "newsCount") {
      const type = facet === "caseStudyCount" ? "caseStudy" : "newsPost";
      const statusFilter = facet === "caseStudyCount" ? ' && status == "approved"' : "";
      // Count per region via the regionalCommunity reference's regionalName.
      const rows: { region: string; count: number }[] = await client.fetch(
        `*[_type == "regionalCommunity" && defined(regionalName)]{
           "region": regionalName,
           "count": count(*[_type == "${type}"${statusFilter} && references(^._id)])
         }`
      );
      for (const r of rows) if (r.region in counts) counts[r.region] = r.count;
    } else if (facet === "memberCount") {
      const grouped = await safeQuery(() =>
        prisma.community.findMany({
          where: { type: "REGIONAL", regionalName: { not: null } },
          select: { regionalName: true, _count: { select: { members: true } } },
        })
      );
      for (const c of grouped ?? []) {
        if (c.regionalName && c.regionalName in counts) {
          counts[c.regionalName] += c._count.members;
        }
      }
    }
  } catch (e) {
    console.error("[region-data] aggregation failed:", e);
    // fall through with zero counts — the map still renders
  }

  return NextResponse.json({ facet, data: aggregateRegionData(counts, facet) });
}
```

**Implementer note:** confirm the `safeQuery` import path (search `export.*safeQuery`) and the Sanity news type name (`newsPost` vs `news-post`/`post`) before finalizing — grep `_type ==` in `sanity/queries/`. Confirm `client` is the read client.

- [ ] **Step 2: Typecheck + manual hit**

Run: `pnpm typecheck` (clean), then `pnpm dev` and `curl 'http://localhost:3000/api/maps/region-data?facet=caseStudyCount'` → JSON with `facet` and a 7-element `data` array.

- [ ] **Step 3: Commit**

```bash
git add app/api/maps/region-data/route.ts
git commit -m "Add faceted region-data API (Sanity + Prisma counts)"
```

---

## Task 8: i18n strings for the map (×4 locales)

**Files:**
- Modify: `messages/en.json`, `messages/es.json`, `messages/fr.json`, `messages/ar.json`

- [ ] **Step 1: Add a `map` namespace to each locale**

Add (translate per locale; en shown):

```json
"map": {
  "title": "Explore by region",
  "facetCaseStudies": "Case studies",
  "facetMembers": "Members",
  "facetNews": "News",
  "viewInSearch": "View in search",
  "noData": "No data for this region yet."
}
```

es: `"Explorar por región" / "Casos de estudio" / "Miembros" / "Noticias" / "Ver en búsqueda" / "Aún no hay datos para esta región."`
fr: `"Explorer par région" / "Études de cas" / "Membres" / "Actualités" / "Voir dans la recherche" / "Aucune donnée pour cette région."`
ar: `"استكشف حسب المنطقة" / "دراسات الحالة" / "الأعضاء" / "الأخبار" / "عرض في البحث" / "لا توجد بيانات لهذه المنطقة بعد."`

- [ ] **Step 2: Validate JSON parses**

Run: `node -e "['en','es','fr','ar'].forEach(l=>{const m=require('./messages/'+l+'.json'); if(!m.map.facetMembers) throw new Error(l)})"`
Expected: no error.

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/es.json messages/fr.json messages/ar.json
git commit -m "Add map i18n strings (en/es/fr/ar)"
```

---

## Task 9: Map block wrapper (facet switcher + responsive layout)

**Files:**
- Create: `components/blocks/maps/region-map.tsx`

- [ ] **Step 1: Implement the block**

```tsx
// components/blocks/maps/region-map.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import SectionContainer from '@/components/ui/section-container'
import { FilterChip } from '@/components/ui/filter-chip'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RegionDataPanel } from '@/components/maps/region-data-panel'
import { FACETS, type FacetId, type RegionDatum } from '@/lib/maps/region-facets'
import { REGION_I18N_KEY, type RegionCode } from '@/lib/maps/region-codes'
import { getLocalizedField } from '@/lib/localization-utils'
import { useRouter } from '@/i18n/navigation'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type RegionMapProps = {
  title?: unknown
  description?: unknown
  defaultFacet?: FacetId
  allowedFacets?: FacetId[]
  locale?: string
  isRTL?: boolean
}

export default function RegionMapBlock({
  title,
  description,
  defaultFacet = 'caseStudyCount',
  allowedFacets,
  locale = 'en',
}: RegionMapProps) {
  const t = useTranslations('map')
  const tRegions = useTranslations('navigation.regions')
  const router = useRouter()
  const facets = useMemo(
    () => FACETS.filter((f) => !allowedFacets?.length || allowedFacets.includes(f.id)),
    [allowedFacets]
  )
  const [facet, setFacet] = useState<FacetId>(defaultFacet)
  const [active, setActive] = useState<RegionCode | null>(null)

  const { data } = useSWR<{ facet: FacetId; data: RegionDatum[] }>(
    `/api/maps/region-data?facet=${facet}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const regionData = data?.data ?? []

  const supported = (locale || 'en') as 'en' | 'es' | 'fr' | 'ar'
  const localizedTitle = typeof title === 'string' ? title : getLocalizedField(title as any, supported, t('title'))
  const localizedDescription = typeof description === 'string' ? description : getLocalizedField(description as any, supported, '')

  const labelFor = (code: RegionCode) => tRegions(REGION_I18N_KEY[code])
  const facetLabel = t(FACETS.find((f) => f.id === facet)!.labelKey)

  return (
    <SectionContainer>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold font-heading text-balance text-ccm-midnight sm:text-4xl">
            {localizedTitle || t('title')}
          </h2>
          {localizedDescription && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{localizedDescription}</p>
          )}
        </div>

        {/* Facet switcher */}
        {facets.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {facets.map((f) => (
              <FilterChip
                key={f.id}
                label={t(f.labelKey)}
                active={facet === f.id}
                onClick={() => { setFacet(f.id); setActive(null) }}
              />
            ))}
          </div>
        )}

        {/* Map + panel: stacked on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="min-w-0">
            <RegionChoropleth
              data={regionData}
              activeCode={active}
              onHover={setActive}
              onSelect={(code) => {
                router.push(`/search?regionalCommunities=${encodeURIComponent(code)}`)
              }}
              labelFor={labelFor}
            />
          </div>
          <RegionDataPanel
            data={regionData}
            activeCode={active}
            facetLabel={facetLabel}
            labelFor={labelFor}
            onSelect={(code) => router.push(`/search?regionalCommunities=${encodeURIComponent(code)}`)}
          />
        </div>
      </div>
    </SectionContainer>
  )
}
```

**RESOLVED — search wiring decision:** The search index facet `regionalCommunities` stores the regional community **name** (via `regionalCommunities[]->{name}` then `.map(c => c.name)` in the sync routes), and that `name` is the localized object `{en,es,fr,ar}` — so the stored facet value is currently malformed (a pre-existing bug, out of scope here). To avoid building the map on a broken facet, the region click deep-links to the search page by **query** using the region's localized label: `router.push({ pathname: '/search', query: { q: labelFor(code) } })`. This always works (full-text match on the region name) and is forward-compatible: once the `regionalCommunities` facet value is normalized, this can be upgraded to a refinement-list deep link (`?case_studies[refinementList][regionalCommunities][0]=<value>`) per `lib/search-routing.ts`. Do NOT send the raw enum — search has no enum facet.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/blocks/maps/region-map.tsx
git commit -m "Add region-map block wrapper (facet switcher, responsive, search wiring)"
```

---

## Task 10: Sanity block schema + query + registration

**Files:**
- Create: `sanity/schemas/blocks/maps/region-map.ts`
- Create: `sanity/queries/maps/region-map.ts`
- Modify: `sanity/schema.ts`, `components/blocks/index.tsx`, `sanity/queries/page.ts`, `sanity/queries/homepage.ts`, `sanity/queries/regional-community-page.ts`

- [ ] **Step 1: Create the schema**

```ts
// sanity/schemas/blocks/maps/region-map.ts
import { defineType, defineField } from "sanity";
import { Map } from "lucide-react";

const FACET_OPTIONS = [
  { title: "Case studies", value: "caseStudyCount" },
  { title: "Members", value: "memberCount" },
  { title: "News", value: "newsCount" },
];

export default defineType({
  name: "region-map",
  type: "object",
  icon: Map,
  title: "Region Map",
  fields: [
    defineField({ name: "padding", type: "section-padding" }),
    defineField({ name: "colorVariant", type: "color-variant", title: "Color Variant" }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "description", type: "text", rows: 2 }),
    defineField({
      name: "defaultFacet",
      type: "string",
      initialValue: "caseStudyCount",
      options: { list: FACET_OPTIONS, layout: "radio" },
    }),
    defineField({
      name: "allowedFacets",
      type: "array",
      of: [{ type: "string" }],
      options: { list: FACET_OPTIONS },
      description: "Which facets the visitor can switch between. Empty = all.",
    }),
  ],
  preview: {
    prepare: () => ({ title: "Region Map" }),
  },
});
```

- [ ] **Step 2: Create the query fragment**

```ts
// sanity/queries/maps/region-map.ts
import { groq } from "next-sanity";

export const regionMapQuery = groq`
  _type == "region-map" => {
    _type,
    _key,
    padding,
    colorVariant,
    title,
    description,
    defaultFacet,
    allowedFacets,
  }
`;
```

- [ ] **Step 3: Register schema** in `sanity/schema.ts` (import + add to the blocks array, mirroring `logoCloud1` at line 71/155):

```ts
import regionMap from "./schemas/blocks/maps/region-map";
// ...add `regionMap,` to the schema types array
```

- [ ] **Step 4: Register renderer** in `components/blocks/index.tsx`:

```ts
import RegionMapBlock from "@/components/blocks/maps/region-map";
// ...in componentMap:
"region-map": RegionMapBlock,
```

- [ ] **Step 5: Splice the query** into `sanity/queries/page.ts`, `homepage.ts`, `regional-community-page.ts` — import `regionMapQuery` and add `${regionMapQuery},` inside each `blocks[]{ ... }` projection (next to the other block fragments).

- [ ] **Step 6: Regenerate Sanity types + typecheck + build**

Run: `pnpm typegen` (or the project's sanity typegen script — check package.json), then `pnpm typecheck && pnpm build`.
Expected: clean; `region-map` is a valid block type.

- [ ] **Step 7: Commit**

```bash
git add sanity/schemas/blocks/maps/region-map.ts sanity/queries/maps/region-map.ts sanity/schema.ts components/blocks/index.tsx sanity/queries/page.ts sanity/queries/homepage.ts sanity/queries/regional-community-page.ts sanity.types.ts
git commit -m "Register region-map Sanity block + splice into page queries"
```

---

## Task 11: End-to-end verification (all locales + RTL + mobile)

**Files:** none (manual verification)

- [ ] **Step 1: Add the block in Studio** — open `/studio`, edit the homepage (or a test page), add a "Region Map" block, set a title and default facet, publish.

- [ ] **Step 2: Render check** — `pnpm dev`, open the page in `en`. The map shows 7 shaded regions; the panel lists ranked counts; switching facets refetches and re-shades; hovering a region updates the panel; clicking navigates to `/search?...` filtered to that region.

- [ ] **Step 3: Locale + RTL** — open the page in `ar`. Confirm: title/facet/region labels are Arabic, the panel mirrors (logical props), the map geometry is unchanged (orientation fixed), facet chips and layout don't overflow.

- [ ] **Step 4: Mobile** — narrow the viewport to ~375px. Confirm: map and panel STACK (map on top, panel below), nothing overflows horizontally, regions remain tappable, facet chips wrap cleanly. This is the user's explicit priority.

- [ ] **Step 5: Full gate**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all green.

- [ ] **Step 6: Final commit (if any verification fixes were needed)**

```bash
git add -A
git commit -m "Polish region map after cross-locale/mobile verification"
```

---

## Self-review notes (already applied)

- **Spec coverage:** global map (Task 4 world geometry) ✓; multi-facet (Task 3 registry + Task 9 switcher) ✓; app illustration style + CCM colors (Task 5 `color-mix` sea palette, rounded joins, white seams) ✓; mobile-first responsive + clean block alignment (Task 9 stacking grid + Task 11 mobile check) ✓; search wiring (Task 9 region click) ✓; reusable as a block (Tasks 9–10) ✓.
- **Type consistency:** `RegionCode`, `RegionDatum`, `FacetId`, `aggregateRegionData`, `REGION_CODES`, `REGION_I18N_KEY` are defined once (Tasks 1/3) and used identically thereafter.
- **Known implementer verifications (flagged inline):** numeric→alpha3 in the build script; `safeQuery` import path; Sanity news type name; the exact search region URL param. These are explicit "confirm before finalizing" notes, not placeholders — each has a concrete method to resolve.
- **Deferred (YAGNI):** per-point lat/lng marker layer; `newsCount` shares the case-study GROQ path (works today); no Mapbox/Leaflet.
