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

/** Responsive grid classes per desktop column count for classic cards. */
const GRID_COLUMN_CLASSES: Record<number, string> = {
  2: "grid-cols-1 md:grid-cols-2 lg:grid-cols-2", // Classic 2 cols: mobile 1, tablet 2, desktop 2
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", // Classic 3 cols: mobile 1, tablet 2, desktop 3
  4: "grid-cols-2 md:grid-cols-2 lg:grid-cols-4", // Classic 4 cols: mobile 2, tablet 2, desktop 4
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5", // Classic 5 cols: mobile 2, tablet 3, desktop 5
};

/** Wide (16:9) cards always cap at 2 columns. */
const WIDE_GRID_CLASS = "grid-cols-1 lg:grid-cols-2";

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
