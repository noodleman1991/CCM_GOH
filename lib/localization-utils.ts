/**
 * Localization utilities for Sanity v4 + Next.js 15
 *
 * Provides type-safe fallback patterns for field-level localized content
 * in case studies and other user-submitted content types.
 */

import type { LocalizedString } from '@/types/case-study'

/**
 * Supported locale codes for the application
 */
export type SupportedLocale = 'en' | 'es' | 'fr' | 'ar'

/**
 * Get localized text with proper fallback logic
 *
 * @param localizedObj - Object with localized strings
 * @param locale - Target locale
 * @param fallbackText - Fallback text if no localized version is found
 * @returns The localized text or fallback
 */
export function getLocalizedText(
  localizedObj: LocalizedString | Record<string, string> | null | undefined,
  locale: string,
  fallbackText: string = ''
): string {
  if (!localizedObj || typeof localizedObj !== 'object') {
    return fallbackText
  }

  // Try requested locale first
  if (localizedObj[locale as keyof typeof localizedObj]) {
    return localizedObj[locale as keyof typeof localizedObj] || fallbackText
  }

  // Fallback to English
  if (localizedObj.en) {
    return localizedObj.en
  }

  // Fallback to any available language
  const availableValues = Object.values(localizedObj).filter(Boolean)
  if (availableValues.length > 0) {
    return availableValues[0] as string
  }

  return fallbackText
}

/**
 * Get localized title with standard fallback
 *
 * @param title - Localized title object
 * @param locale - Target locale
 * @returns The localized title or "Untitled"
 */
export function getLocalizedTitle(
  title: LocalizedString | Record<string, string> | null | undefined,
  locale: string
): string {
  return getLocalizedText(title, locale, 'Untitled')
}

/**
 * Get localized excerpt with standard fallback
 *
 * @param excerpt - Localized excerpt object
 * @param locale - Target locale
 * @returns The localized excerpt or empty string
 */
export function getLocalizedExcerpt(
  excerpt: LocalizedString | Record<string, string> | null | undefined,
  locale: string
): string {
  return getLocalizedText(excerpt, locale, '')
}

/**
 * Check if a locale is RTL (Right-to-Left)
 *
 * @param locale - Locale to check
 * @returns true if the locale is RTL
 */
export function isRTLLocale(locale: string): boolean {
  return locale === 'ar'
}

/**
 * Get appropriate ordering direction for locale
 * Used for date ordering in RTL vs LTR languages
 *
 * @param locale - Locale to check
 * @returns 'asc' for RTL locales, 'desc' for LTR locales
 */
export function getLocaleOrderDirection(locale: string): 'asc' | 'desc' {
  return isRTLLocale(locale) ? 'asc' : 'desc'
}

/**
 * Create a locale-aware class name for CSS styling
 *
 * @param locale - Current locale
 * @param baseClass - Base CSS class
 * @returns Class name with locale modifier
 */
export function getLocaleAwareClassName(locale: string, baseClass: string = ''): string {
  const rtlClass = isRTLLocale(locale) ? 'rtl' : 'ltr'
  return `${baseClass} locale-${locale} ${rtlClass}`.trim()
}

/**
 * Utility for handling localized arrays (like tags)
 *
 * @param items - Array of items with localized properties
 * @param locale - Target locale
 * @param key - Key to extract localized value from
 * @returns Array of localized values
 */
export function getLocalizedArrayValues<T extends Record<string, any>>(
  items: T[] | null | undefined,
  locale: string,
  key: keyof T
): string[] {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map(item => {
      const localizedValue = item[key]
      return getLocalizedText(localizedValue, locale, '')
    })
    .filter(Boolean)
}

/**
 * Format localized content for meta tags and SEO
 *
 * @param content - Localized content object
 * @param locale - Target locale
 * @param maxLength - Maximum length for truncation
 * @returns Formatted and truncated content
 */
export function formatLocalizedForSEO(
  content: LocalizedString | Record<string, string> | null | undefined,
  locale: string,
  maxLength: number = 160
): string {
  const text = getLocalizedText(content, locale)

  if (text.length <= maxLength) {
    return text
  }

  // Truncate at word boundary
  const truncated = text.substring(0, maxLength - 3)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Create a type-safe localization helper for specific content types
 *
 * @param defaultLocale - Default locale to fall back to
 * @returns Object with localization helper functions
 */
export function createLocalizationHelper(defaultLocale: SupportedLocale = 'en') {
  return {
    getText: (obj: LocalizedString | Record<string, string> | null | undefined, locale: string, fallback?: string) =>
      getLocalizedText(obj, locale, fallback),

    getTitle: (title: LocalizedString | Record<string, string> | null | undefined, locale: string) =>
      getLocalizedTitle(title, locale),

    getExcerpt: (excerpt: LocalizedString | Record<string, string> | null | undefined, locale: string) =>
      getLocalizedExcerpt(excerpt, locale),

    isRTL: (locale: string) => isRTLLocale(locale),

    getOrderDirection: (locale: string) => getLocaleOrderDirection(locale),

    formatForSEO: (content: LocalizedString | Record<string, string> | null | undefined, locale: string, maxLength?: number) =>
      formatLocalizedForSEO(content, locale, maxLength),

    defaultLocale
  }
}

/**
 * Default localization helper instance
 */
export const localization = createLocalizationHelper('en')

/**
 * Get localized PortableText content with fallback
 * Handles content stored as localized objects {en, es, fr, ar}
 *
 * @param content - PortableText content object (either localized object or direct array)
 * @param locale - Target locale
 * @returns The localized PortableText array or empty array
 */
export function getLocalizedPortableText(
  content: any | null | undefined,
  locale: SupportedLocale
): any[] {
  if (!content) {
    return []
  }

  // If it's already an array, return it (non-localized content)
  if (Array.isArray(content)) {
    return content
  }

  // If it's a localized object {en, es, fr, ar}
  if (typeof content === 'object') {
    // Try requested locale first
    if (content[locale] && Array.isArray(content[locale])) {
      return content[locale]
    }

    // Fallback to English
    if (content.en && Array.isArray(content.en)) {
      return content.en
    }

    // Fallback to any available language
    for (const key of ['es', 'fr', 'ar']) {
      if (content[key] && Array.isArray(content[key])) {
        return content[key]
      }
    }
  }

  return []
}

/**
 * Check if a field has translation for a specific locale
 *
 * @param field - Localized field object
 * @param locale - Locale to check
 * @returns true if translation exists and is non-empty
 */
export function hasTranslation(
  field: LocalizedString | Record<string, any> | null | undefined,
  locale: SupportedLocale
): boolean {
  if (!field || typeof field !== 'object') {
    return false
  }

  const value = field[locale]

  // For strings
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  // For PortableText arrays
  if (Array.isArray(value)) {
    return value.length > 0
  }

  return false
}

/**
 * Extract localized field with proper type handling
 * Works for both simple strings and complex objects like PortableText
 *
 * @param field - Localized field (string or PortableText)
 * @param locale - Target locale
 * @param fallback - Optional fallback value
 * @returns The localized value or fallback
 */
export function getLocalizedField<T = any>(
  field: Record<string, T> | T | null | undefined,
  locale: SupportedLocale,
  fallback?: T
): T | undefined {
  if (!field) {
    return fallback
  }

  // If field is not an object, return it as-is (already localized)
  if (typeof field !== 'object' || Array.isArray(field)) {
    return field as T
  }

  // Try requested locale first
  if (locale in field && field[locale as keyof typeof field] !== undefined) {
    return field[locale as keyof typeof field] as T
  }

  // Fallback to English
  if ('en' in field && field.en !== undefined) {
    return field.en as T
  }

  // Fallback to any available language
  for (const key of ['es', 'fr', 'ar']) {
    if (key in field && field[key as keyof typeof field] !== undefined) {
      return field[key as keyof typeof field] as T
    }
  }

  return fallback
}