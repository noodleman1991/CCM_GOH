import { LexoRank } from "lexorank";

/**
 * Helpers for the `orderRank` field that @sanity/orderable-document-list adds to
 * orderable document types.
 *
 * The plugin stores LexoRank strings (`<bucket>|<base36 decimal>`, e.g.
 * `0|10002w:`) and calls `LexoRank.parse()` on them unguarded — both when
 * reordering and when resolving the initial value for a new document:
 *
 *   *[_type == $type]|order(orderRank desc)[0].orderRank   ->   LexoRank.parse(...)
 *
 * `LexoRank.parse()` splits on `|` and hands part two to `LexoDecimal.parse()`.
 * A value without a `|` therefore fails as "Cannot read properties of undefined
 * (reading 'indexOf')" and takes the Studio down. Any script that writes
 * `orderRank` must go through `sequentialOrderRanks()` rather than inventing its
 * own ordinal scheme.
 */

/** True when the plugin's `LexoRank.parse()` will accept this value. */
export function isValidOrderRank(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  try {
    LexoRank.parse(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * `count` LexoRank strings in ascending order, continuing after `startAfter`
 * when that is an existing valid rank.
 *
 * Steps twice per document, the way the plugin's own "Reset order" does, so
 * there is always room to drop an item between two neighbours.
 */
export function sequentialOrderRanks(count: number, startAfter?: string | null): string[] {
  let rank = isValidOrderRank(startAfter) ? LexoRank.parse(startAfter) : LexoRank.min();

  return Array.from({ length: count }, () => {
    rank = rank.genNext().genNext();
    return rank.toString();
  });
}
