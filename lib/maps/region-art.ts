// The fetch itself (query + region-code mapping) now lives in
// lib/content/regions.ts (Phase 1 content-layer migration, Task 7) —
// re-exported here so this file's existing importers (the getRegionArt()
// call sites in app/[locale]/(main)/atlas/page.tsx,
// components/blocks/maps/region-map.tsx, components/blocks/maps/atlas-embed.tsx,
// plus the `import type { RegionArt }` sites in
// components/atlas/region-spotlight.tsx and components/atlas/atlas-explorer.tsx)
// keep their import path unchanged.
export { getRegionArt } from "@/lib/content/regions";
export type { RegionArt } from "@/lib/content/regions";
