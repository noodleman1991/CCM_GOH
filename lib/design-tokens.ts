/**
 * Block design tokens — the single source of truth for the visual scales used by
 * page-builder blocks (spacing, headings, container width, card aspect ratios).
 *
 * Both sides consume these:
 *  - Sanity schemas expose the KEYS as human-friendly editor options
 *    (see sanity/schemas/blocks/shared/style-options.ts), and
 *  - Block renderers map a key → the Tailwind classes here.
 *
 * Rules:
 *  - Values are FULL literal class strings so Tailwind's scanner sees them.
 *    Never build these by interpolation.
 *  - One concept = one scale here. Don't reintroduce per-block hardcoded values.
 */

// ---- Vertical spacing (section margins / internal gaps) ----------------------
export type SpacingToken = "none" | "sm" | "md" | "lg" | "xl";

/** Outer vertical rhythm between stacked sections. */
export const SECTION_SPACING_Y: Record<SpacingToken, string> = {
  none: "",
  sm: "my-4 lg:my-6",
  md: "my-8 lg:my-10 xl:my-12", // current default
  lg: "my-12 lg:my-16 xl:my-20",
  xl: "my-16 lg:my-24 xl:my-28",
};

/** Gap between items in a grid/flex row. */
export const GRID_GAP: Record<SpacingToken, string> = {
  none: "gap-0",
  sm: "gap-3 md:gap-4",
  md: "gap-4 md:gap-6 lg:gap-8", // current grid-row default
  lg: "gap-6 md:gap-8 lg:gap-10",
  xl: "gap-8 md:gap-10 lg:gap-12",
};

// ---- Heading scale -----------------------------------------------------------
export type HeadingToken = "sm" | "md" | "lg" | "xl";

/**
 * Section/heading sizes. `xl` is hero-scale; `lg` a section title; `md` a
 * standard header; `sm` a sub-header. Every scale carries the SAME tight
 * line-height so headings read consistently across all blocks — pair with
 * `text-balance` at the call site for even line wrapping.
 */
export const HEADING_SCALE: Record<HeadingToken, string> = {
  // One step smaller than before, same relative hierarchy — section headings
  // were reading too large against body copy and cards.
  sm: "text-xl md:text-2xl leading-tight",
  md: "text-2xl md:text-3xl leading-tight", // standard section header
  lg: "text-2xl md:text-3xl lg:text-4xl leading-tight", // cta / split title
  xl: "text-3xl md:text-4xl lg:text-5xl leading-tight", // hero
};

// ---- Container width ---------------------------------------------------------
export type WidthToken = "narrow" | "default" | "wide" | "full";

export const CONTAINER_WIDTH: Record<WidthToken, string> = {
  narrow: "max-w-3xl",
  default: "max-w-6xl", // site-wide default
  wide: "max-w-7xl",
  full: "max-w-none",
};

// ---- Card aspect ratios ------------------------------------------------------
export type AspectToken = "square" | "photo" | "wide" | "portrait";

export const CARD_ASPECT: Record<AspectToken, string> = {
  square: "aspect-square",
  photo: "aspect-[3/2]", // classic card
  wide: "aspect-video", // 16:9
  portrait: "aspect-[3/4]",
};

/** The pixel dimensions to request from the Sanity CDN for each card aspect
 *  (≈2× the largest rendered card width). Pairs with urlForCropped. */
export const CARD_ASPECT_SOURCE: Record<AspectToken, { w: number; h: number }> = {
  square: { w: 800, h: 800 },
  photo: { w: 800, h: 533 },
  wide: { w: 800, h: 450 },
  portrait: { w: 800, h: 1067 },
};

// ---- Safe lookups ------------------------------------------------------------
export const spacingY = (t?: string | null) =>
  SECTION_SPACING_Y[(t as SpacingToken) in SECTION_SPACING_Y ? (t as SpacingToken) : "md"];
export const gridGap = (t?: string | null) =>
  GRID_GAP[(t as SpacingToken) in GRID_GAP ? (t as SpacingToken) : "md"];
export const heading = (t?: string | null) =>
  HEADING_SCALE[(t as HeadingToken) in HEADING_SCALE ? (t as HeadingToken) : "md"];
export const containerWidth = (t?: string | null) =>
  CONTAINER_WIDTH[(t as WidthToken) in CONTAINER_WIDTH ? (t as WidthToken) : "default"];
export const cardAspect = (t?: string | null) =>
  CARD_ASPECT[(t as AspectToken) in CARD_ASPECT ? (t as AspectToken) : "photo"];
