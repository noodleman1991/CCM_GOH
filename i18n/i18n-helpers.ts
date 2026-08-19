import { rtlLocales } from '@/i18n/routing';

/**
 * Gets the localized value from an object with language keys
 * @param obj Object with language keys or string
 * @param locale Current locale
 * @param fallbackLocale Fallback locale if current locale is not found
 * @returns Localized string value
 */
export function getLocalizedValue(
    obj: Record<string, unknown> | string | null | undefined,
    locale: string,
    fallbackLocale = 'en'
): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    if (typeof obj === 'object') {
        const v = obj[locale] ?? obj[fallbackLocale];
        return typeof v === 'string' ? v : '';
    }
    return '';
}

/**
 * Determines if a locale is RTL
 * @param locale Locale code
 * @returns Boolean indicating if locale is RTL
 */
export function isRTL(locale: string): boolean {
    return rtlLocales.includes(locale);
}
