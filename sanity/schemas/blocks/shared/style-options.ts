/**
 * Shared, human-friendly editor option lists for block styling.
 *
 * These are the editor-facing half of the block design system: schemas import
 * these option lists so every block offers the SAME consistent style choices,
 * and the values are plain tokens ("lg", "wide") — never Tailwind class names.
 * Renderers map the chosen token to classes via lib/design-tokens.ts.
 */

// NOTE: SPACING_OPTIONS, HEADING_SIZE_OPTIONS and WIDTH_OPTIONS were defined here
// but never imported by any block schema — they were dead editor options. Removed
// to keep this file to what the blocks actually use. Section spacing/width is
// handled by the design tokens (lib/design-tokens.ts) and SectionContainer.

export const CARD_ASPECT_OPTIONS = [
  { title: "Square (1:1)", value: "square" },
  { title: "Photo (3:2)", value: "photo" },
  { title: "Wide (16:9)", value: "wide" },
  { title: "Portrait (3:4)", value: "portrait" },
] as const;

/** Number of cards per row — human values ("3"), NOT Tailwind classes. */
export const CARD_COLUMNS_OPTIONS = [
  { title: "2 cards", value: "2" },
  { title: "3 cards", value: "3" },
  { title: "4 cards", value: "4" },
  { title: "5 cards", value: "5" },
] as const;
