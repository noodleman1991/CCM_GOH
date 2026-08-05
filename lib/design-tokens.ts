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
 *  - Responsive steps are CONTAINER queries (`@content-*\/page:`), never viewport
 *    ones. The `/page` container is the main content panel (declared in the
 *    (main) layout), so blocks respond to the width they actually get rather
 *    than to the window — the open sidebar takes ~282px, which made
 *    viewport-keyed steps fire one stop too dense. The `--container-content-*`
 *    thresholds live in app/globals.css; they are deliberately lower than the
 *    viewport breakpoint of the same name, because a content box doesn't also
 *    have to pay for the sidebar and page gutters.
 */

// ---- Vertical spacing (section margins / internal gaps) ----------------------
export type SpacingToken = "none" | "sm" | "md" | "lg" | "xl";

/** Outer vertical rhythm between stacked sections.
 *  Values are +7% over the prior scale (user request) for a touch more breathing
 *  room between stacked blocks — applied here at the source so it propagates
 *  everywhere SectionContainer is used. Arbitrary rem values because Tailwind's
 *  fixed steps can't express the 7% bump. */
export const SECTION_SPACING_Y: Record<SpacingToken, string> = {
  none: "",
  sm: "my-[1.07rem] @content-lg/page:my-[1.605rem]",
  md: "my-[2.14rem] @content-lg/page:my-[2.675rem] @content-xl/page:my-[3.21rem]", // current default (+7%)
  lg: "my-[3.21rem] @content-lg/page:my-[4.28rem] @content-xl/page:my-[5.35rem]",
  xl: "my-[4.28rem] @content-lg/page:my-[6.42rem] @content-xl/page:my-[7.49rem]",
};

/** Gap between items in a grid/flex row. */
export const GRID_GAP: Record<SpacingToken, string> = {
  none: "gap-0",
  sm: "gap-3 @content-md/page:gap-4",
  md: "gap-4 @content-md/page:gap-6 @content-lg/page:gap-8", // current grid-row default
  lg: "gap-6 @content-md/page:gap-8 @content-lg/page:gap-10",
  xl: "gap-8 @content-md/page:gap-10 @content-lg/page:gap-12",
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
  sm: "text-xl @content-md/page:text-2xl leading-tight",
  md: "text-2xl @content-md/page:text-3xl leading-tight", // standard section header
  lg: "text-2xl @content-md/page:text-3xl @content-lg/page:text-4xl leading-tight", // cta / split title
  xl: "text-3xl @content-md/page:text-4xl @content-lg/page:text-5xl leading-tight", // hero
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
