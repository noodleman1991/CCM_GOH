/**
 * A Payload value read with `locale: "all"`, in one language: every object
 * keyed only by language codes becomes that language's value. With
 * `fallback` (the default) a missing or empty value falls back to English —
 * for readers; without it, a missing value is `null` — for writers, so one
 * language's text is never copied into another's field.
 *
 * Pure (no `server-only`), so scripts can use it too.
 */
const LOCALE_KEYS = new Set(["en", "es", "fr", "ar"]);
type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isLocaleMap = (v: unknown): v is Loose =>
  isObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LOCALE_KEYS.has(k));
const present = (v: unknown) => v !== undefined && v !== null && v !== "";

export function collapseLocales(value: unknown, locale: string, opts: { fallback?: boolean } = {}): unknown {
  const fallback = opts.fallback ?? true;
  if (isLocaleMap(value)) {
    const own = value[locale];
    if (present(own)) return collapseLocales(own, locale, opts);
    return fallback && present(value.en) ? collapseLocales(value.en, locale, opts) : null;
  }
  if (Array.isArray(value)) return value.map((item) => collapseLocales(item, locale, opts));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, collapseLocales(v, locale, opts)]));
  return value;
}
