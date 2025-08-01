// lib/case-study-utils.ts

import {
    CaseStudy,
    ResolvedCaseStudy,
    LocalizedString,
    SupportedLanguage,
    CaseStudyAuthor
} from '@/types/case-study';

/**
 * Get localized text from LocalizedString object with fallback logic
 * Falls back to English, then first available language
 */
export function getLocalizedText(
    text: LocalizedString | string | undefined,
    locale: SupportedLanguage,
    fallback: string = ''
): string {
    if (!text) return fallback;
    if (typeof text === 'string') return text;

    // Try requested language first
    if (text[locale]) return text[locale];

    // Fallback to English
    if (text.en) return text.en;

    // Fallback to first available language
    const firstAvailable = Object.values(text).find(value => value && value.trim());
    return firstAvailable || fallback;
}

/**
 * Get case study title in requested language
 * Uses field-level translation from LocalizedString
 */
export function getCaseStudyTitle(
    caseStudy: Pick<CaseStudy, 'title' | 'language'>,
    preferredLanguage?: SupportedLanguage
): string {
    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedText(caseStudy.title, lang, 'Untitled Case Study');
}

/**
 * Get case study excerpt in requested language
 * Supports custom excerpt override from grid items
 */
export function getCaseStudyExcerpt(
    caseStudy: Pick<CaseStudy, 'excerpt' | 'language'>,
    customExcerpt?: string,
    preferredLanguage?: SupportedLanguage
): string {
    // Use custom excerpt if provided (from grid-case-study)
    if (customExcerpt) return customExcerpt;

    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedText(caseStudy.excerpt, lang, '');
}

/**
 * Get case study URL with proper language prefix
 * Handles routing for multilingual setup
 */
export function getCaseStudyUrl(
    caseStudy: Pick<CaseStudy, 'slug' | 'language'>,
    targetLanguage?: SupportedLanguage
): string {
    const lang = targetLanguage || caseStudy.language;
    const slug = caseStudy.slug.current || 'untitled';

    // English uses no prefix
    if (lang === 'en') {
        return `/case-studies/${slug}`;
    }

    // Other languages get language prefix
    return `/${lang}/case-studies/${slug}`;
}

/**
 * Get primary author (lead author first, then first author)
 * Used for displaying main author in cards
 */
export function getPrimaryAuthor(
    caseStudy: Pick<CaseStudy | ResolvedCaseStudy, 'authors'>
): CaseStudyAuthor | null {
    if (!caseStudy.authors || caseStudy.authors.length === 0) {
        return null;
    }

    // Find lead author first
    const leadAuthor = caseStudy.authors.find(author => author.role === 'lead');
    if (leadAuthor) {
        return leadAuthor;
    }

    // Otherwise return first author
    return caseStudy.authors[0];
}

/**
 * Check if language requires RTL layout
 * Currently only Arabic is RTL
 */
export function isRTL(locale: string): boolean {
    return locale === 'ar';
}

/**
 * Get language flag emoji for display
 */
export function getLanguageFlag(locale: SupportedLanguage): string {
    const flags = {
        en: '🇺🇸',
        es: '🇪🇸',
        fr: '🇫🇷',
        ar: '🇸🇦',
    };

    return flags[locale] || '🌐';
}

/**
 * Check if case study is published and available to public
 */
export function isCaseStudyPublished(
    caseStudy: Pick<CaseStudy, 'status'>
): boolean {
    return caseStudy.status === 'published';
}

/**
 * Check if case study can be translated (must be English and approved/published)
 */
export function canTranslateCaseStudy(
    caseStudy: Pick<CaseStudy, 'language' | 'status'>
): boolean {
    return caseStudy.language === 'en' &&
        ['approved', 'published'].includes(caseStudy.status);
}
