// Helpers for the regional-community grids' content modes.
//
// Editors can pin specific items AND still let the grid auto-fill with dynamic
// content. `mergePinnedWithDynamic` puts the editor's manual picks first, then
// fills the remainder with dynamic items (deduped by id), capped at `limit`.

export type WithId = { _id?: string; _key?: string; [k: string]: unknown };

/** Stable identity for an item: prefer _id, fall back to _key. */
export const itemId = (item: WithId | null | undefined): string | null =>
  (item && (item._id || item._key)) || null;

/**
 * Merge editor-pinned items with dynamically-fetched items.
 * - Pinned items render first, in editor order.
 * - Dynamic items fill the rest, skipping any already pinned (by id).
 * - Result is capped at `limit` (when > 0).
 */
export function mergePinnedWithDynamic<T extends WithId>(
  pinned: T[] | null | undefined,
  dynamic: T[] | null | undefined,
  limit = 0
): T[] {
  const pins = (pinned || []).filter(Boolean);
  const seen = new Set<string>();
  const out: T[] = [];

  for (const p of pins) {
    const id = itemId(p);
    if (id) seen.add(id);
    out.push(p);
  }
  for (const d of dynamic || []) {
    if (!d) continue;
    const id = itemId(d);
    if (id && seen.has(id)) continue; // already pinned
    if (id) seen.add(id);
    out.push(d);
  }

  return limit > 0 ? out.slice(0, limit) : out;
}

/**
 * Whether a grid mode should also fetch dynamic items.
 * - "manual": only the editor's manualItems (no fetch).
 * - "dynamic-*": fetch.
 * - "dynamic-with-pinned": fetch AND prepend manualItems as pins.
 */
export type GridMode =
  | "manual"
  | "dynamic-featured"
  | "dynamic-recent"
  | "dynamic-with-pinned";

export const modeFetchesDynamic = (mode: GridMode | string | undefined): boolean =>
  mode !== "manual";

export const modeUsesPins = (mode: GridMode | string | undefined): boolean =>
  mode === "manual" || mode === "dynamic-with-pinned";

export const modeIsFeatured = (mode: GridMode | string | undefined): boolean =>
  mode === "dynamic-featured";
