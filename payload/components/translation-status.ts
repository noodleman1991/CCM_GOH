/**
 * Which languages a section's words are still missing in — pure, so the
 * admin's client label (section-row-label.tsx) can import it safely. Nothing
 * here may import from lib/content or next/headers (see the admin
 * client-import gotcha).
 *
 * Reads a document fetched with `locale=all`, where every translatable value is
 * a `{ en, es, fr, ar }` map.
 */

export type TranslationState = "complete" | "missing";

const LOCALE_KEYS = ["en", "es", "fr", "ar"];
const LOCALE_NAMES: Record<string, string> = { en: "English", es: "Spanish", fr: "French", ar: "Arabic" };

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

/** `{ en: …, fr: … }` — an object keyed only by language codes. */
function isLocaleMap(v: unknown): v is Loose {
  if (!isObject(v)) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => LOCALE_KEYS.includes(k));
}

/** Rich text (Lexical) counts as filled when any node carries text. */
function hasWords(v: unknown): boolean {
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.some(hasWords);
  if (isObject(v)) {
    if (typeof v.text === "string") return v.text.trim().length > 0;
    return Object.values(v).some(hasWords);
  }
  return false;
}

/** For every language, whether all the section's English words are translated. */
export function translationStatus(block: unknown, locales: readonly string[]): Record<string, TranslationState> {
  const status = Object.fromEntries(locales.map((l) => [l, "complete"])) as Record<string, TranslationState>;
  const walk = (v: unknown) => {
    if (isLocaleMap(v)) {
      if (!hasWords(v.en)) return; // nothing written yet, nothing to translate
      for (const l of locales) if (!hasWords(v[l])) status[l] = "missing";
      return;
    }
    if (Array.isArray(v)) v.forEach(walk);
    else if (isObject(v)) Object.values(v).forEach(walk);
  };
  walk(block);
  return status;
}

/** The status as the row shows it, and as a screen reader should say it. */
export function statusLine(status: Record<string, TranslationState>): { text: string; spoken: string } {
  const entries = Object.entries(status);
  return {
    text: entries.map(([l, s]) => `${l.toUpperCase()} ${s === "complete" ? "✓" : "missing"}`).join(" · "),
    spoken: `Translations: ${entries.map(([l, s]) => `${LOCALE_NAMES[l] ?? l} ${s === "complete" ? "done" : "missing"}`).join(", ")}`,
  };
}

/**
 * The section with this row id, and whether it sits in a list every language
 * shares (`shared: true`). A section in a per-language list belongs to that
 * one language, so it has no translations to be missing.
 */
export function findBlockById(doc: unknown, id: string): { block: Loose; shared: boolean } | undefined {
  const visit = (v: unknown, perLanguage: boolean): { block: Loose; shared: boolean } | undefined => {
    if (Array.isArray(v)) {
      for (const item of v) {
        if (isObject(item) && item.id === id && typeof item.blockType === "string") return { block: item, shared: !perLanguage };
        const found = visit(item, perLanguage);
        if (found) return found;
      }
      return undefined;
    }
    if (isObject(v)) {
      const localeMap = isLocaleMap(v);
      for (const child of Object.values(v)) {
        const found = visit(child, perLanguage || localeMap);
        if (found) return found;
      }
    }
    return undefined;
  };
  return visit(doc, false);
}
