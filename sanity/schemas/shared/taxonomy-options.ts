/**
 * Phase 6 fixed taxonomy option lists (redesign TAXONOMY §1–§3), shared by every
 * content type so the `region` / `themes` / `populations` fields stay consistent.
 * Codes only — Studio `list` options enforce no free text.
 *
 * NOTE: `region` short codes (ssa/nawa/…) are the redesign target. They live
 * alongside the existing slug-ref `relatedCommunity` during the dual-field
 * transition (the app reads the code with fallback to the slug). The Prisma enum
 * rename is the separate, later B3 migration.
 */

export const REGION_OPTIONS = [
  { title: "Sub-Saharan Africa", value: "ssa" },
  { title: "Northern Africa & Western Asia", value: "nawa" },
  { title: "Central & Southern Asia", value: "csa" },
  { title: "Eastern & South-Eastern Asia", value: "esea" },
  { title: "Latin America & the Caribbean", value: "lac" },
  { title: "Oceania", value: "oce" },
  { title: "Europe & Northern America", value: "enam" },
] as const;

export const THEME_OPTIONS = [
  { title: "Displacement", value: "displacement" },
  { title: "Livelihoods", value: "livelihoods" },
  { title: "Youth", value: "youth" },
  { title: "Indigenous", value: "indigenous" },
] as const;

export const POPULATION_OPTIONS = [
  { title: "Children & youth", value: "youth" },
  { title: "Women", value: "women" },
  { title: "Indigenous peoples", value: "indigenous" },
  { title: "Farmers & rural livelihoods", value: "farmers" },
  { title: "Displaced & migrants", value: "displaced" },
] as const;
