import { CaseStudy, LocalizedString, SupportedLanguage, CaseStudyAuthor } from '@/types/case-study';

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

export function getLocalizedTagLabel(tag: { label: LocalizedString; value?: { current: string } }, locale: SupportedLanguage): string {
    return getLocalizedText(tag.label, locale, tag.value?.current || 'Tag');
}

export function canAccessCaseStudy(status: string, userRole: 'guest' | 'user' | 'admin' = 'guest'): boolean {
    // ALL approved case studies are completely public - accessible to everyone
    // No authentication required, no restrictions
    if (status === 'approved') return true;

    // Admins can see all case studies regardless of status (for review purposes)
    if (userRole === 'admin') return true;

    // Non-approved case studies (pending, revision, rejected) are only visible to admins
    return false;
}

export function getCaseStudyStatusLabel(status: string, locale: SupportedLanguage): string {
    const statusLabels = {
        en: {
            pending: 'Under Review',
            approved: 'Published',
            rejected: 'Rejected',
            revision: 'Needs Revision'
        },
        es: {
            pending: 'En Revisión',
            approved: 'Publicado',
            rejected: 'Rechazado',
            revision: 'Necesita Revisión'
        },
        fr: {
            pending: 'En Révision',
            approved: 'Publié',
            rejected: 'Rejeté',
            revision: 'Révision Nécessaire'
        },
        ar: {
            pending: 'قيد المراجعة',
            approved: 'منشور',
            rejected: 'مرفوض',
            revision: 'يحتاج مراجعة'
        }
    };

    return statusLabels[locale]?.[status as keyof typeof statusLabels[typeof locale]] || status;
}

export function getAvailableLanguages(caseStudy: CaseStudy): SupportedLanguage[] {
    const languages: SupportedLanguage[] = [];

    if (caseStudy.title) {
        Object.keys(caseStudy.title).forEach(lang => {
            if (caseStudy.title[lang as SupportedLanguage]) {
                languages.push(lang as SupportedLanguage);
            }
        });
    }

    return languages;
}
