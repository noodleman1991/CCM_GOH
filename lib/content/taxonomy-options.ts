/**
 * Fixed taxonomy option lists shared by the Studio schema and the frontend.
 *
 * Moved verbatim from sanity/schemas/shared/topic-options.ts and
 * taxonomy-options.ts, which the schemas re-export from here rather than
 * defining a second copy — these `value`s are stored on documents, so a
 * changed value orphans every document already holding the old one.
 *
 * Nothing here imports from sanity.types.ts or @sanity/*: these are plain
 * controlled-vocabulary arrays, not CMS access, so they live in lib/content/
 * directly rather than behind lib/content/internal/sanity-source.ts.
 */

// ---------------------------------------------------------------------------
// From sanity/schemas/shared/topic-options.ts
// ---------------------------------------------------------------------------

export const topicOptions = [
    { title: "Climate Change & Environment", value: "climate-environment" },
    { title: "Mental Health & Wellbeing", value: "mental-health" },
    { title: "Community Health & Social Care", value: "community-health" },
    { title: "Youth Engagement & Education", value: "youth-education" },
    { title: "Policy Research & Governance", value: "policy-governance" },
    { title: "Technology & Innovation", value: "technology-innovation" },
    { title: "Economic Development", value: "economic-development" },
    { title: "Cultural Heritage & Arts", value: "cultural-arts" },
    { title: "Food Security & Agriculture", value: "food-agriculture" },
    { title: "Urban Planning & Infrastructure", value: "urban-planning" },
    { title: "Human Rights & Social Justice", value: "human-rights" },
    { title: "Migration & Displacement", value: "migration" },
    { title: "Gender Equality", value: "gender-equality" },
    { title: "Disaster Risk & Resilience", value: "disaster-resilience" },
    { title: "Digital Inclusion", value: "digital-inclusion" },
    { title: "Other", value: "other" },
] as const;

export type TopicValue = (typeof topicOptions)[number]["value"];

// ---------------------------------------------------------------------------
// From sanity/schemas/shared/taxonomy-options.ts
//
// Phase 6 fixed taxonomy option lists (redesign TAXONOMY §1–§3), shared by every
// content type so the `region` / `themes` / `populations` fields stay consistent.
// Codes only — Studio `list` options enforce no free text.
//
// NOTE: `region` short codes (ssa/nawa/…) are the redesign target. They live
// alongside the existing slug-ref `relatedCommunity` during the dual-field
// transition (the app reads the code with fallback to the slug). The Prisma enum
// rename is the separate, later B3 migration.
// ---------------------------------------------------------------------------

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
