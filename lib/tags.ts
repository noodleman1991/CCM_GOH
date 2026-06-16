// Shared tag presentation helpers: an on-brand colour palette + normalisation
// of legacy stored colours, and stable locale-aware sorting of tag badges.
//
// Tags historically stored ad-hoc Tailwind hexes (#3b82f6, #f97316, …) that are
// off-brand and some fail AA at badge size. Rather than migrate every stored
// value, the renderer maps any colour to the nearest on-brand CCM token here,
// so old and new data both render consistently.

import { getLocalizedText } from "@/lib/localization-utils";

/** Curated, on-brand tag colours (text/border on a light card; all >= 4.5:1). */
export const CCM_TAG_COLORS = {
  sea: "#205596", // ccm-sea — primary
  water: "#2F6FA8", // a touch darker than ccm-water for AA at 12px
  midnight: "#0B3160", // ccm-midnight — strongest
  teal: "#0F7368", // on-brand deep teal
  plum: "#6B3FA0", // on-brand accent
  clay: "#A1542B", // warm earthy accent
} as const;

export type CcmTagColorName = keyof typeof CCM_TAG_COLORS;

// Map the legacy Tailwind hexes (and our own values) to a CCM token. Anything
// unrecognised falls back to ccm-sea so a tag is never colourless or off-brand.
const LEGACY_TO_CCM: Record<string, CcmTagColorName> = {
  "#3b82f6": "water", // blue
  "#6366f1": "plum", // indigo
  "#8b5cf6": "plum", // purple
  "#ec4899": "plum", // pink
  "#10b981": "teal", // green
  "#14b8a6": "teal", // teal
  "#ef4444": "clay", // red
  "#f97316": "clay", // orange
  "#f59e0b": "clay", // amber
  "#6b7280": "midnight", // gray
};

/** Resolve any stored tag colour to an on-brand, AA-compliant hex. */
export function normalizeTagColor(stored?: string | null): string {
  if (!stored) return CCM_TAG_COLORS.sea;
  const key = stored.trim().toLowerCase();
  // already a CCM token name?
  if (key in CCM_TAG_COLORS) return CCM_TAG_COLORS[key as CcmTagColorName];
  // already one of our hex values?
  for (const hex of Object.values(CCM_TAG_COLORS)) {
    if (hex.toLowerCase() === key) return hex;
  }
  // legacy hex → CCM token
  const mapped = LEGACY_TO_CCM[key];
  return mapped ? CCM_TAG_COLORS[mapped] : CCM_TAG_COLORS.sea;
}

// Minimal structural shape every tag shares, without an index signature so
// concrete typed tags (AgendaTag, ReportTag, …) are assignable.
type TagLike = {
  _id?: string;
  label?: unknown;
  color?: string | null;
};

/**
 * Filter out null/incomplete tags and sort them stably for consistent badge
 * order in every locale: by the localized label using the active locale's
 * collation. Does not mutate the input.
 */
export function sortedTags<T extends TagLike>(
  tags: readonly (T | null | undefined)[] | null | undefined,
  locale: string
): T[] {
  const valid = (tags || []).filter((t): t is T => Boolean(t && t.label));
  const collator = new Intl.Collator(locale || "en", { sensitivity: "base" });
  const label = (t: T) =>
    getLocalizedText(t.label as Record<string, string> | string | null | undefined, locale) || "";
  return [...valid].sort((a, b) => collator.compare(label(a), label(b)));
}
