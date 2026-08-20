/**
 * Structured notification snippets. The DB `snippet` column historically held
 * two kinds of value: user/content text (a comment excerpt, a message body —
 * language-neutral, shown verbatim) and ENGLISH PROSE written by emitters
 * ("accepted your request to join") that could never localize.
 *
 * Prose emitters now store `{"k":"<key>","p":{...}}` JSON; the feed detects it
 * and renders `t("notifications.snippets.<key>", p)` in the viewer's locale.
 * Plain strings keep rendering verbatim, so old rows need no migration.
 * Pure module — shared by server emitters and the client feed.
 */

export type StructuredSnippet = { k: string; p?: Record<string, string> };

export function structuredSnippet(key: string, params?: Record<string, string>): string {
  return JSON.stringify({ k: key, ...(params && Object.keys(params).length ? { p: params } : {}) });
}

export function parseStructuredSnippet(snippet: string | null | undefined): StructuredSnippet | null {
  if (!snippet || snippet[0] !== "{") return null;
  try {
    const v = JSON.parse(snippet) as unknown;
    if (
      typeof v === "object" &&
      v !== null &&
      typeof (v as { k?: unknown }).k === "string" &&
      ((v as { p?: unknown }).p === undefined ||
        (typeof (v as { p?: unknown }).p === "object" && (v as { p: unknown }).p !== null))
    ) {
      return v as StructuredSnippet;
    }
    return null;
  } catch {
    return null;
  }
}
