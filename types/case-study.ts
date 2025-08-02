export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar';

export type CaseStudyStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'revision';

export type AuthorRole = 'lead' | 'coauthor' | 'contributor' | 'advisor';

export type GridCardLayout = 'default' | 'compact' | 'featured' | 'minimal';

export interface LocalizedString {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface LocalizedTags {
    en?: Tag[];
    es?: Tag[];
    fr?: Tag[];
    ar?: Tag[];
}

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: {
        current: string;
    };
    color?: string;
    category?: string;
}

export interface Organization {
    _id: string;
    name: string;
    slug: {
        current: string;
    };
    acronym?: string;
    logo?: {
        asset?: {
            _id: string;
            url: string;
        };
        alt?: string;
    };
}

export interface Project {
    _id: string;
    name: string;
    slug: {
        current: string;
    };
}

export interface Author {
    _id: string;
    name: string;
    slug: {
        current: string;
    };
}

export interface CaseStudyAuthor {
    userId?: string;
    name: string;
    email?: string;
    role: AuthorRole;
    affiliation?: Organization;
}

export interface StudyPeriod {
    startDate?: string;
    endDate?: string;
}

export interface StudyArea {
    location: {
        lat: number;
        lng: number;
        alt?: number;
    };
    name: string;
    description?: string;
}

export interface CaseStudy {
    _id: string;
    language: SupportedLanguage;
    title: LocalizedString;
    excerpt: LocalizedString;
    slug: {
        current: string;
    };

    // Metadata
    submittedBy?: string;
    submittedAt?: string;

    // People and organizations
    authors: CaseStudyAuthor[];
    organizations?: Organization[];
    projects?: Project[];
    tags?: LocalizedTags;

    // Media
    image?: {
        asset?: {
            _id: string;
            url: string;
            mimeType?: string;
            metadata?: {
                lqip?: string;
                dimensions?: {
                    width: number;
                    height: number;
                };
            };
        };
        alt?: string;
        caption?: string;
    };

    // Study details
    studyPeriod?: StudyPeriod;
    studyLocation?: {
        lat: number;
        lng: number;
        alt?: number;
    };
    studyAreas?: StudyArea[];

    // Editorial workflow
    status: CaseStudyStatus;
    reviewNotes?: string;
    reviewedBy?: Author;
    reviewedAt?: string;
    publishedAt?: string;
    featured?: boolean;

    // SEO
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
}

// For when references are fully resolved in queries
export interface ResolvedCaseStudy extends Omit<CaseStudy, 'organizations' | 'projects' | 'reviewedBy' | 'authors'> {
    organizations?: Organization[];
    projects?: Project[];
    reviewedBy?: Author;
    authors: Array<CaseStudyAuthor & {
        affiliation?: Organization;
    }>;
}

export interface GridCaseStudy {
    _type: 'grid-case-study';
    _key: string;
    caseStudy: CaseStudy;
    showTags: boolean;
    showAuthors: boolean;
    showMetadata: boolean;
    showStudyPeriod: boolean;
    showLocation: boolean;
    customExcerpt?: LocalizedString;
    customLayout: GridCardLayout;
    priority?: number;
}

export interface CaseStudyCardProps {
    gridItem: GridCaseStudy;
    locale: SupportedLanguage;
    userId?: string;
    className?: string;
    color?: string;
}

// Language display constants
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ar: 'العربية'
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    ar: '🇸🇦'
};

// Status labels - matching your schema configuration
export const STATUS_LABELS: Record<CaseStudyStatus, string> = {
    pending: 'Pending Review',
    reviewing: 'Under Review',
    approved: 'Approved (Published)',
    rejected: 'Rejected',
    revision: 'Needs Revision'
};

export const STATUS_EMOJIS: Record<CaseStudyStatus, string> = {
    pending: '📝',
    reviewing: '👀',
    approved: '✅',
    rejected: '❌',
    revision: '📋'
};

// Author role labels - matching your schema configuration
export const AUTHOR_ROLE_LABELS: Record<AuthorRole, string> = {
    lead: 'Lead Author',
    coauthor: 'Co-Author',
    contributor: 'Contributor',
    advisor: 'Advisor'
};

export const AUTHOR_ROLE_EMOJIS: Record<AuthorRole, string> = {
    lead: '👑',
    coauthor: '✍️',
    contributor: '🤝',
    advisor: '🎓'
};

// Grid layout labels
export const GRID_LAYOUT_LABELS: Record<GridCardLayout, string> = {
    default: 'Default',
    compact: 'Compact',
    featured: 'Featured',
    minimal: 'Minimal'
};

export const GRID_LAYOUT_EMOJIS: Record<GridCardLayout, string> = {
    default: '📄',
    compact: '📦',
    featured: '⭐',
    minimal: '📝'
};

// Helper functions
export function getLocalizedContent(
    content: LocalizedString | undefined,
    language: SupportedLanguage,
    fallback: SupportedLanguage = 'en'
): string {
    if (!content) return '';
    return content[language] || content[fallback] || content.en || '';
}

export function getCaseStudyTitle(
    caseStudy: Pick<CaseStudy, 'title' | 'language'>,
    preferredLanguage?: SupportedLanguage
): string {
    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedContent(caseStudy.title, lang);
}

export function getCaseStudyExcerpt(
    caseStudy: Pick<CaseStudy, 'excerpt' | 'language'>,
    customExcerpt?: LocalizedString,
    preferredLanguage?: SupportedLanguage
): string {
    const lang = preferredLanguage || caseStudy.language;

    if (customExcerpt) {
        return getLocalizedContent(customExcerpt, lang);
    }

    return getLocalizedContent(caseStudy.excerpt, lang);
}

export function isCaseStudyPublished(caseStudy: Pick<CaseStudy, 'status'>): boolean {
    return caseStudy.status === 'approved';
}

export function getCaseStudyUrl(
    caseStudy: Pick<CaseStudy, 'slug' | 'language'>,
    targetLanguage?: SupportedLanguage
): string {
    const lang = targetLanguage || caseStudy.language;
    const baseUrl = '/case-studies';
    const slug = caseStudy.slug.current;

    return lang === 'en'
        ? `${baseUrl}/${slug}`
        : `/${lang}${baseUrl}/${slug}`;
}

export function formatStudyPeriod(studyPeriod: StudyPeriod | undefined): string {
    if (!studyPeriod) return '';

    const { startDate, endDate } = studyPeriod;

    if (!startDate && !endDate) return '';

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

export function getLeadAuthor(authors: CaseStudyAuthor[]): CaseStudyAuthor | undefined {
    return authors.find(author => author.role === 'lead');
}

export function getAuthorsByRole(authors: CaseStudyAuthor[]): Record<AuthorRole, CaseStudyAuthor[]> {
    return authors.reduce((acc, author) => {
        if (!acc[author.role]) {
            acc[author.role] = [];
        }
        acc[author.role].push(author);
        return acc;
    }, {} as Record<AuthorRole, CaseStudyAuthor[]>);
}

export function formatLocation(location: { lat: number; lng: number; alt?: number } | undefined): string {
    if (!location) return '';

    const { lat, lng } = location;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

// Type guards
export function isGridCaseStudy(item: any): item is GridCaseStudy {
    return item && item._type === 'grid-case-study';
}

export function hasValidCaseStudy(gridItem: GridCaseStudy): boolean {
    return !!(gridItem.caseStudy && gridItem.caseStudy._id);
}

export function shouldShowField(gridItem: GridCaseStudy, field: keyof Pick<GridCaseStudy, 'showTags' | 'showAuthors' | 'showMetadata' | 'showStudyPeriod' | 'showLocation'>): boolean {
    return gridItem[field] === true;
}
