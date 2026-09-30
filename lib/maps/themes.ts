// The fetch itself (query + fallback logic) now lives in lib/content/regions.ts
// (Phase 1 content-layer migration, Task 7) — re-exported here so this file's
// five existing importers (app/[locale]/(main)/atlas/page.tsx,
// app/api/maps/region-pins/route.ts, app/api/maps/region-data/route.ts,
// components/blocks/maps/region-map.tsx, components/blocks/maps/atlas-embed.tsx)
// keep their import path unchanged.
export { getCommunityOptions, getThemeOptions } from "@/lib/content/regions";
