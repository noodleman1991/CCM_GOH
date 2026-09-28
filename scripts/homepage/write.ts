/**
 * Pure helpers for writing the homepage move (CMS project 2).
 *
 * The shared Sections list is not localized, but the text inside it is, so it
 * is written once per language: English first (which creates the rows), then
 * each other language onto the SAME rows — `withIdsFrom` copies the saved
 * row ids across so Payload updates rather than replaces them.
 */
import { collapseLocales } from "@/lib/content/internal/localize";

type Row = Record<string, unknown>;

/** The sections in exactly one language: a language with no text of its own
 *  writes `null`, never another language's words. */
export function toLocaleData(sections: Row[], lang: string): Row[] {
  return collapseLocales(sections, lang, { fallback: false }) as Row[];
}

/** `data` with the `id` of each object copied from `saved`, by position, however deep. */
export function withIdsFrom(saved: unknown, data: unknown): unknown {
  if (Array.isArray(data)) return data.map((item, i) => withIdsFrom(Array.isArray(saved) ? saved[i] : undefined, item));
  if (data && typeof data === "object") {
    const from = saved && typeof saved === "object" && !Array.isArray(saved) ? (saved as Row) : {};
    const out: Row = {};
    if (typeof from.id === "string" || typeof from.id === "number") out.id = from.id;
    for (const [k, v] of Object.entries(data as Row)) out[k] = withIdsFrom(from[k], v);
    return out;
  }
  return data;
}

/** The refusal to print when the homepage already has sections, or `null` to go ahead. */
export function guardExisting(existing: unknown[], { replace }: { replace: boolean }): string | null {
  if (existing.length === 0 || replace) return null;
  const n = existing.length;
  return `The homepage already has ${n} section${n === 1 ? "" : "s"}. Nothing was changed. Run with --replace to overwrite them, or --revert to empty the list first.`;
}

/** Placeholder ids (`new:<name>`) → the ids of the organisations just created; unresolved ones are dropped. */
export function swapNewIds(ids: string[], created: Map<string, string>): string[] {
  return ids.flatMap((id) => (id.startsWith("new:") ? (created.has(id) ? [created.get(id)!] : []) : [id]));
}
