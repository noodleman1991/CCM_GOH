/**
 * Locale-aware metadata: the canonical carries the locale prefix (every
 * public route lives under `/{locale}`), every page declares its four
 * language alternates plus `x-default`, and the Open Graph locale is the
 * page's, not `en_US` everywhere (audit finding M12, 2026-09-16).
 *
 * Paths are relative; Next resolves them against `metadataBase`.
 */
export const LOCALES = ["en", "es", "fr", "ar"] as const;
export type SiteLocale = (typeof LOCALES)[number];

/** Decision 13: British English is the hub's default register. */
export const OG_LOCALES: Record<SiteLocale, string> = {
  en: "en_GB",
  es: "es_ES",
  fr: "fr_FR",
  ar: "ar_SA",
};

export function ogLocale(locale: string): string {
  return OG_LOCALES[(LOCALES as readonly string[]).includes(locale) ? (locale as SiteLocale) : "en"];
}

function join(locale: string, path: string): string {
  const clean = path.replace(/^\/+/, "").replace(/\/+$/, "");
  return clean ? `/${locale}/${clean}` : `/${locale}`;
}

export function localizedAlternates(
  path: string,
  locale: string,
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = join(l, path);
  languages["x-default"] = join("en", path);
  return { canonical: join(locale, path), languages };
}
