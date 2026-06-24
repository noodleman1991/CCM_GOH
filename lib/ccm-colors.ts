// The single place colours are decided for the hub's taxonomy chips, blobs, dots
// and badges. Mirrors the redesign's TAXONOMY §16 `COLOR` map so a value's colour
// is identical everywhere it appears (chip, atlas blob, status dot, badge).
//
// This generalises the `normalizeTagColor` pattern in `lib/tags.ts` (which handles
// free-form Sanity `tag` colours) to the FIXED taxonomy facets: region, content
// status, task status, collaboration intent, project status/visibility, and atlas
// layer. Resolve every fixed-facet colour through here instead of hand-coding hexes.
//
// Region note: the codebase currently stores the long-form region values
// (`ssa`, …) in Prisma/Algolia/Sanity, while the redesign spec uses
// short codes (`ssa`, …). Phase 6 migrates stored values to short codes; until then
// `regionColor()` accepts BOTH forms so colours work against today's data and the
// post-migration data without a breaking change.

import {
  REGION_CODES,
  type RegionCode,
  isRegionCode,
} from "@/lib/maps/region-codes";

/** Brand palette — the named CCM colours (mirror `--color-ccm-*` in globals.css). */
export const CCM = {
  midnight: "#0B3160",
  sea: "#205596",
  water: "#4186C3",
  sky: "#9BC6DA",
  primary: "#4974CA",
  secondary: "#90E0F4",
  amber: "#E0A53F",
  slate: "#8595AC",
} as const;

/** The 7 region short codes (redesign canonical geo facet). */
export const REGION_SHORT_CODES = [
  "enam",
  "lac",
  "nawa",
  "ssa",
  "csa",
  "esea",
  "oce",
] as const;
export type RegionShortCode = (typeof REGION_SHORT_CODES)[number];

/** Long-form `RegionCode` ↔ short code, so both data shapes resolve to one colour. */
export const REGION_LONG_TO_SHORT: Record<RegionCode, RegionShortCode> = {
  enam: "enam",
  lac: "lac",
  nawa: "nawa",
  ssa: "ssa",
  csa: "csa",
  esea: "esea",
  oce: "oce",
};

/** Reverse: short code → long-form `RegionCode`. */
export const REGION_SHORT_TO_LONG: Record<RegionShortCode, RegionCode> =
  Object.fromEntries(
    Object.entries(REGION_LONG_TO_SHORT).map(([long, short]) => [short, long])
  ) as Record<RegionShortCode, RegionCode>;

export function isRegionShortCode(v: string): v is RegionShortCode {
  return (REGION_SHORT_CODES as readonly string[]).includes(v);
}

/**
 * The only place taxonomy colours are decided (TAXONOMY §16). Keys use the
 * canonical short codes / stored enum values; resolve through the helpers below.
 */
export const COLOR = {
  region: {
    enam: "#0B3160",
    lac: "#2563ef",
    nawa: "#4186C3",
    ssa: "#205596",
    csa: "#3a81f6",
    esea: "#1a4eda",
    oce: "#9BC6DA",
  },
  /** "Global" = absence of a region (news/content with no region). */
  global: "#4974CA",
  /** Content pipeline status. */
  status: {
    draft: "#8595AC",
    review: "#E0A53F",
    changes: "#E0A53F",
    published: "#205596",
    // existing Sanity statuses on caseStudy/livedExperience map onto the above:
    pending: "#E0A53F",
    revision: "#E0A53F",
    rejected: "#8595AC",
    approved: "#205596",
  },
  /** Kanban task status. */
  task: { done: "#205596", doing: "#4186C3", todo: "#9BC6DA" },
  /** Collaboration intent (person seeking/offering/member). */
  intent: { looking: "#E0A53F", offering: "#205596", member: "#8595AC" },
  /** Project status + visibility. */
  project: {
    Active: "#205596",
    Recruiting: "#E0A53F",
    Completed: "#8595AC",
    Public: "#205596",
    Private: "#8595AC",
  },
  /** Atlas data layer. */
  layer: {
    cases: "#205596",
    lived: "#4186C3",
    projects: "#0B3160",
    people: "#9BC6DA",
  },
} as const;

/**
 * Resolve a region's colour from EITHER a short code (`ssa`) or the long-form
 * stored value (`ssa`). Falls back to the Global colour for an
 * empty/unknown region (i.e. "Global" content), never colourless.
 */
export function regionColor(region?: string | null): string {
  if (!region) return COLOR.global;
  const key = region.trim();
  if (isRegionShortCode(key)) return COLOR.region[key];
  if (isRegionCode(key)) return COLOR.region[REGION_LONG_TO_SHORT[key]];
  return COLOR.global;
}

/** Resolve a content status colour; unknown → draft/slate (neutral). */
export function statusColor(status?: string | null): string {
  if (!status) return COLOR.status.draft;
  const key = status.trim() as keyof typeof COLOR.status;
  return COLOR.status[key] ?? COLOR.status.draft;
}

/** Resolve a task status colour; unknown → todo. */
export function taskColor(status?: string | null): string {
  if (!status) return COLOR.task.todo;
  const key = status.trim().toLowerCase() as keyof typeof COLOR.task;
  return COLOR.task[key] ?? COLOR.task.todo;
}

/** Resolve a collaboration-intent colour; unknown → member/slate. */
export function intentColor(intent?: string | null): string {
  if (!intent) return COLOR.intent.member;
  const key = intent.trim().toLowerCase() as keyof typeof COLOR.intent;
  return COLOR.intent[key] ?? COLOR.intent.member;
}

/** Resolve a project status/visibility colour; unknown → slate. */
export function projectColor(value?: string | null): string {
  if (!value) return CCM.slate;
  const key = value.trim() as keyof typeof COLOR.project;
  return COLOR.project[key] ?? CCM.slate;
}

/** Resolve an atlas-layer colour; unknown → cases/sea. */
export function layerColor(layer?: string | null): string {
  if (!layer) return COLOR.layer.cases;
  const key = layer.trim().toLowerCase() as keyof typeof COLOR.layer;
  return COLOR.layer[key] ?? COLOR.layer.cases;
}

// Compile-time guarantee that every region code has a colour entry.
const _regionColorCompleteness: Record<RegionShortCode, string> = COLOR.region;
void _regionColorCompleteness;
void REGION_CODES;
