import { CaseStudy, LocalizedString, SupportedLanguage, Tag, CaseStudyAuthor } from '@/types/case-study';

export function getLocalizedText(
    text: LocalizedString | undefined,
    locale: SupportedLanguage,
    fallback: string = ''
): string {
    if (!text) return fallback;

    const supportedLocale = locale as SupportedLanguage;
    return text[supportedLocale] || text.en || fallback;
}

export function getCaseStudyTitle(caseStudy: CaseStudy, locale: SupportedLanguage): string {
    return getLocalizedText(caseStudy.title, locale, 'Untitled Case Study');
}

export function getCaseStudyExcerpt(
    caseStudy: CaseStudy,
    customExcerpt: LocalizedString | undefined,
    locale: SupportedLanguage
): string {
    if (customExcerpt) {
        return getLocalizedText(customExcerpt, locale);
    }
    return getLocalizedText(caseStudy.excerpt, locale);
}

export function getCaseStudyUrl(caseStudy: CaseStudy, locale: SupportedLanguage): string {
    const slug = caseStudy.slug.current;
    return locale === 'en'
        ? `/case-studies/${slug}`
        : `/${locale}/case-studies/${slug}`;
}

export function getPrimaryAuthor(caseStudy: CaseStudy): CaseStudyAuthor | null {
    if (!caseStudy.authors || caseStudy.authors.length === 0) {
        return null;
    }

    const leadAuthor = caseStudy.authors.find(author => author.role === 'lead');
    return leadAuthor || caseStudy.authors[0];
}

export function getStudyLocationText(caseStudy: CaseStudy): string | null {
    if (caseStudy.studyAreas && caseStudy.studyAreas.length > 0) {
        const firstArea = caseStudy.studyAreas[0];
        if (firstArea.name) {
            return firstArea.name;
        }
    }

    if (caseStudy.studyLocation) {
        const { lat, lng } = caseStudy.studyLocation;
        return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }

    return null;
}

export function formatCaseStudyDate(date: Date, locale: SupportedLanguage): string {
    const localeMap = {
        en: 'en-US',
        es: 'es-ES',
        fr: 'fr-FR',
        ar: 'ar-SA'
    };

    const targetLocale = localeMap[locale] || 'en-US';
    return date.toLocaleDateString(targetLocale);
}

export function isRTL(locale: string): boolean {
    return locale === 'ar';
}

export function getLocalizedTagLabel(tag: Tag, locale: SupportedLanguage): string {
    return getLocalizedText(tag.label, locale, tag.value?.current || 'Tag');
}
