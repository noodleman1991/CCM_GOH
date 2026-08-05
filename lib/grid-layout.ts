/**
 * Pure helpers for mapping a Sanity `gridColumns` value (e.g. "grid-cols-3")
 * to a desktop column count and the responsive Tailwind grid classes.
 *
 * NOTE: the class strings below are full literals on purpose so Tailwind's
 * source scanner picks them up (lib/ is scanned). Do not build them
 * dynamically.
 */

export type GridCardVariant = "classic" | "wide";

export interface ResolvedGridColumns {
  /** Desktop column count (drives image `sizes` calculations). */
  cols: number;
  /** Responsive Tailwind grid classes for the grid container. */
  className: string;
}

/**
 * Responsive grid classes per desktop column count for classic cards.
 *
 * Steps are CONTAINER queries against the `/page` container (the main content
 * panel, declared in the (main) layout) rather than viewport breakpoints: the
 * open sidebar takes ~282px, so viewport-keyed steps promoted grids a stop too
 * early and produced cramped columns (a 4-up at 1440 fell to 261px each).
 * The `--container-content-*` thresholds are defined in app/globals.css.
 */
const GRID_COLUMN_CLASSES: Record<number, string> = {
  2: "grid-cols-1 @content-md/page:grid-cols-2", // 1 up, then 2 up from 640px of content
  3: "grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3", // 1 / 2 / 3
  4: "grid-cols-2 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3 @content-xl/page:grid-cols-4", // 2 / 2 / 3 / 4
  5: "grid-cols-2 @content-md/page:grid-cols-3 @content-lg/page:grid-cols-4 @content-xl/page:grid-cols-5", // 2 / 3 / 4 / 5
};

/** Wide (16:9) cards always cap at 2 columns. */
const WIDE_GRID_CLASS = "grid-cols-1 @content-md/page:grid-cols-2";

const DEFAULT_COLS = 2;

/**
 * Resolves the desktop column count and grid container classes for a grid row.
 *
 * @param gridColumnsValue - The (stega-cleaned) `gridColumns` value from
 *   Sanity, e.g. "grid-cols-4". Unknown or missing values fall back to 2.
 * @param variant - The card variant; "wide" always caps at 2 columns.
 */
export function resolveGridColumns(
  gridColumnsValue: string | null | undefined,
  variant: GridCardVariant
): ResolvedGridColumns {
  if (variant === "wide") {
    return { cols: 2, className: WIDE_GRID_CLASS };
  }

  const cols =
    gridColumnsValue === "grid-cols-5"
      ? 5
      : gridColumnsValue === "grid-cols-4"
      ? 4
      : gridColumnsValue === "grid-cols-3"
      ? 3
      : DEFAULT_COLS;

  return { cols, className: GRID_COLUMN_CLASSES[cols] };
}
