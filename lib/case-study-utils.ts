import {
    CaseStudy,
    ResolvedCaseStudy,
    LocalizedString,
    LocalizedTags,
    SupportedLanguage,
    CaseStudyAuthor,
} from '@/types/case-study';

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: {
        current: string;
    };
    color?: string;
    category?: string;
}

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
 */
export function getCaseStudyTitle(
    caseStudy: Pick<CaseStudy, 'title' | 'language'>,
    preferredLanguage?: SupportedLanguage
): string {
    if (!caseStudy?.title) return 'Untitled Case Study';

    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedText(caseStudy.title, lang, 'Untitled Case Study');
}

/**
 * Get case study excerpt in requested language
 * Supports custom excerpt override from grid items
 */
export function getCaseStudyExcerpt(
    caseStudy: Pick<CaseStudy, 'excerpt' | 'language'>,
    customExcerpt?: LocalizedString,
    preferredLanguage?: SupportedLanguage
): string {
    const lang = preferredLanguage || caseStudy.language;

    // Use custom excerpt if provided (from grid-case-study)
    if (customExcerpt) {
        return getLocalizedText(customExcerpt, lang, '');
    }

    if (!caseStudy?.excerpt) return '';
    return getLocalizedText(caseStudy.excerpt, lang, '');
}

/**
 * Get case study URL with proper language prefix
 */
export function getCaseStudyUrl(
    caseStudy: Pick<CaseStudy, 'slug' | 'language'>,
    targetLanguage?: SupportedLanguage
): string {
    const lang = targetLanguage || caseStudy.language || 'en';
    const slug = caseStudy?.slug?.current || 'untitled';

    // English uses no prefix
    if (lang === 'en') {
        return `/case-studies/${slug}`;
    }

    // Other languages get language prefix
    return `/${lang}/case-studies/${slug}`;
}

/**
 * Get primary author (lead author first, then first author)
 */
export function getPrimaryAuthor(
    caseStudy: Pick<CaseStudy | ResolvedCaseStudy, 'authors'>
): CaseStudyAuthor | null {
    if (!caseStudy?.authors || caseStudy.authors.length === 0) {
        return null;
    }

    // Find lead author first
    const leadAuthor = caseStudy.authors.find((author: CaseStudyAuthor) => author.role === 'lead');
    if (leadAuthor) {
        return leadAuthor;
    }

    // Otherwise return first author
    return caseStudy.authors[0];
}

/**
 * Get localized tag label
 */
export function getLocalizedTagLabel(
    tag: Tag,
    locale: SupportedLanguage
): string {
    return getLocalizedText(tag.label, locale, tag.value?.current || 'Untitled Tag');
}

/**
 * Get tags for a specific language from LocalizedTags structure
 */
export function getLocalizedTags(
    tags: LocalizedTags | undefined,
    locale: SupportedLanguage,
    fallbackLocale: SupportedLanguage = 'en'
): Tag[] {
    if (!tags) return [];

    // Try requested language first
    if (tags[locale] && Array.isArray(tags[locale])) {
        return tags[locale] || [];
    }

    // Fallback to English
    if (tags[fallbackLocale] && Array.isArray(tags[fallbackLocale])) {
        return tags[fallbackLocale] || [];
    }

    // Try any available language
    for (const lang of ['en', 'es', 'fr', 'ar'] as SupportedLanguage[]) {
        if (tags[lang] && Array.isArray(tags[lang]) && tags[lang]!.length > 0) {
            return tags[lang] || [];
        }
    }

    return [];
}

/**
 * Get tags for display with localized labels
 */
export function getCaseStudyTags(
    caseStudy: Pick<CaseStudy, 'tags'>,
    locale: SupportedLanguage
): Tag[] {
    return getLocalizedTags(caseStudy?.tags, locale);
}

/**
 * Get total number of unique tags across all languages
 */
export function getTotalTagCount(
    caseStudy: Pick<CaseStudy, 'tags'>
): number {
    if (!caseStudy?.tags) return 0;

    const allTags = new Set<string>();

    // Collect unique tag IDs across all languages
    (['en', 'es', 'fr', 'ar'] as SupportedLanguage[]).forEach(lang => {
        const langTags = caseStudy.tags?.[lang];
        if (langTags && Array.isArray(langTags)) {
            langTags.forEach(tag => {
                if (tag?._id) allTags.add(tag._id);
            });
        }
    });

    return allTags.size;
}

/**
 * Check if language requires RTL layout
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
    return caseStudy?.status === 'approved';
}

/**
 * Check if case study can be translated (must be English and approved)
 */
export function canTranslateCaseStudy(
    caseStudy: Pick<CaseStudy, 'language' | 'status'>
): boolean {
    return caseStudy?.language === 'en' && caseStudy?.status === 'approved';
}

/**
 * Get study location text for display
 */
export function getStudyLocationText(
    caseStudy: Pick<CaseStudy, 'studyAreas' | 'studyLocation'>
): string | null {
    // Prefer named study areas
    if (caseStudy?.studyAreas && caseStudy.studyAreas.length > 0) {
        const firstArea = caseStudy.studyAreas[0];
        if (firstArea?.name) {
            return firstArea.name;
        }
    }

    // Fallback to coordinates if available
    if (caseStudy?.studyLocation) {
        const { lat, lng } = caseStudy.studyLocation;
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }

    return null;
}

/**
 * Format date for display in different locales
 */
export function formatCaseStudyDate(
    date: string | Date,
    locale: SupportedLanguage
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        ar: 'ar-SA'
    };

    return dateObj.toLocaleDateString(localeMap[locale]);
}

/**
 * Get localized status text
 */
export function getLocalizedStatus(
    status: CaseStudy['status'],
    locale: SupportedLanguage
): string {
    const statusMap = {
        pending: {
            en: 'Pending Review',
            es: 'Pendiente de revisión',
            fr: 'En attente de révision',
            ar: 'قيد المراجعة'
        },
        reviewing: {
            en: 'Under Review',
            es: 'En revisión',
            fr: 'En révision',
            ar: 'تحت المراجعة'
        },
        approved: {
            en: 'Approved',
            es: 'Aprobado',
            fr: 'Approuvé',
            ar: 'معتمد'
        },
        rejected: {
            en: 'Rejected',
            es: 'Rechazado',
            fr: 'Rejeté',
            ar: 'مرفوض'
        },
        revision: {
            en: 'Needs Revision',
            es: 'Necesita revisión',
            fr: 'Besoin de révision',
            ar: 'يحتاج مراجعة'
        }
    };

    return statusMap[status]?.[locale] || status;
}

/**
 * Format study period for display
 */
export function formatStudyPeriod(
    studyPeriod: CaseStudy['studyPeriod'],
    locale: SupportedLanguage
): string {
    if (!studyPeriod) return '';

    const { startDate, endDate } = studyPeriod;

    if (!startDate && !endDate) return '';

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const localeMap = {
            en: 'en-US',
            es: 'es-ES',
            fr: 'fr-FR',
            ar: 'ar-SA'
        };

        return date.toLocaleDateString(localeMap[locale], {
            year: 'numeric',
            month: 'short'
        });
    };

    if (startDate && endDate) {
        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }

    if (startDate) {
        return `From ${formatDate(startDate)}`;
    }

    if (endDate) {
        return `Until ${formatDate(endDate)}`;
    }

    return '';
}

/**
 * Get authors by role for organized display
 */
export function getAuthorsByRole(authors: CaseStudyAuthor[]) {
    return authors.reduce((acc, author) => {
        if (!acc[author.role]) {
            acc[author.role] = [];
        }
        acc[author.role].push(author);
        return acc;
    }, {} as Record<CaseStudyAuthor['role'], CaseStudyAuthor[]>);
}

/**
 * Format location coordinates for display
 */
export function formatLocation(
    location: { lat: number; lng: number; alt?: number } | undefined
): string {
    if (!location) return '';

    const { lat, lng } = location;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
