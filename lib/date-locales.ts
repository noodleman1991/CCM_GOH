import { formatDistanceToNow } from "date-fns";
import { ar, es, fr, type Locale } from "date-fns/locale";

/**
 * date-fns locales for the hub's four languages (English is date-fns'
 * default). Two components used to keep their own copy of this map while
 * five others passed no locale at all, so "3 days ago" stayed English on
 * /ar, /es and /fr (Slice 14a).
 */
export const DATE_LOCALES: Record<string, Locale> = { es, fr, ar };

export function dateLocale(locale: string): Locale | undefined {
  return DATE_LOCALES[locale];
}

/** `formatDistanceToNow` in the member's language, for copy that interpolates it. */
export function relativeTime(date: string | number | Date, locale: string, addSuffix = true): string {
  return formatDistanceToNow(date instanceof Date ? date : new Date(date), { addSuffix, locale: dateLocale(locale) });
}
