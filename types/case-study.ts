export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// LocalizedString type for multilingual content
export interface LocalizedString {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
}

// Case Study Status - Updated to match schema
export const CASE_STUDY_STATUSES = ['pending', 'reviewing', 'approved', 'rejected', 'revision', 'published'] as const;
export type CaseStudyStatus = typeof CASE_STUDY_STATUSES[number];

export const CASE_STUDY_STATUS_LABELS: Record<CaseStudyStatus, string> = {
    pending: 'Pending Review',
    reviewing: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    revision: 'Needs Revision',
    published: 'Published',
};

// Author Roles
export const AUTHOR_ROLES = ['lead', 'coauthor', 'contributor', 'advisor'] as const;
export type AuthorRole = typeof AUTHOR_ROLES[number];

export const AUTHOR_ROLE_LABELS: Record<AuthorRole, string> = {
    lead: 'Lead Author',
    coauthor: 'Co-Author',
    contributor: 'Contributor',
    advisor: 'Advisor',
};

// Translation Status
export const TRANSLATION_STATUSES = ['progress', 'review', 'complete'] as const;
export type TranslationStatus = typeof TRANSLATION_STATUSES[number];

export const TRANSLATION_STATUS_LABELS: Record<TranslationStatus, string> = {
    progress: 'In Progress',
    review: 'Under Review',
    complete: 'Complete',
};

// Organization Types
export const ORGANIZATION_TYPES = [
    'ngo', 'research', 'university', 'government',
    'international', 'company', 'community', 'foundation', 'other'
] as const;
export type OrganizationType = typeof ORGANIZATION_TYPES[number];

// Base Sanity Document interface
interface SanityDocument {
    _id: string;
    _type: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
}

// Enhanced Sanity Image interface - matches schema and queries
export interface SanityImage {
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
}

// Sanity Reference interface
export interface SanityReference<T = any> {
    _type: 'reference';
    _ref: string;
    _weak?: boolean;
}

// Geopoint interface
export interface Geopoint {
    lat: number;
    lng: number;
    alt?: number;
}

// Study Period
export interface StudyPeriod {
    startDate?: string;
    endDate?: string;
}

// Study Area - Updated to match schema
export interface StudyArea {
    location: Geopoint;
    name: string;
    description?: string;
}

// Organization interface
export interface Organization extends SanityDocument {
    _type: 'organization';
    name: string;
    slug: {
        current: string;
    };
    acronym?: string;
    type: OrganizationType;
    description?: LocalizedString;
    logo?: SanityImage;
    website?: string;
    email?: string;
    headquarters?: Geopoint;
    offices?: Array<{
        location?: Geopoint;
        name?: string;
        address?: string;
        isPrimary: boolean;
    }>;
    regionalCommunity?: SanityReference;
    socialMedia?: {
        twitter?: string;
        linkedin?: string;
        facebook?: string;
        instagram?: string;
    };
    tags?: SanityReference[];
    verified: boolean;
    orderRank?: string;
}

// Project interface
export interface Project extends SanityDocument {
    _type: 'project';
    name: string;
    slug: {
        current: string;
    };
}

// Tag interface
export interface ReportTag extends SanityDocument {
    _type: 'tag';
    label: LocalizedString;
    value: string;
    color?: string;
    category?: string;
}

// Author interface
export interface Author extends SanityDocument {
    _type: 'author';
    name: string;
    email?: string;
    bio?: LocalizedString;
    avatar?: SanityImage;
}

// Case Study Author (inline object in case study)
export interface CaseStudyAuthor {
    userId?: string;
    name: string;
    email?: string;
    role: AuthorRole;
    affiliation?: SanityReference<Organization> | Organization;
}

// Case Study Translation reference - Updated to match schema
export interface CaseStudyTranslation {
    language: Exclude<SupportedLanguage, 'en'>; // Only es, fr, ar since en is base
    status: TranslationStatus;
    document: SanityReference<CaseStudy> | CaseStudy;
}

// Portable Text type for content
export interface PortableTextBlock {
    _key: string;
    _type: string;
    [key: string]: any;
}

// Main Case Study interface - Updated to match schema
export interface CaseStudy extends SanityDocument {
    _type: 'caseStudy';
    language: SupportedLanguage;
    title: LocalizedString;
    slug: {
        current: string;
    };
    excerpt: LocalizedString;
    content: PortableTextBlock[]; // Portable Text array

    // Submission tracking
    submittedBy?: string;
    submittedAt?: string;

    // Authors and affiliations
    authors: CaseStudyAuthor[];
    organizations?: (SanityReference<Organization> | Organization)[];
    projects?: (SanityReference<Project> | Project)[];
    tags?: (SanityReference<ReportTag> | ReportTag)[];

    // Media
    image?: SanityImage;

    // Study details - Updated field names to match schema
    studyPeriod?: StudyPeriod;
    studyLocation?: Geopoint;
    studyAreas?: StudyArea[];

    // Editorial workflow
    status: CaseStudyStatus;
    reviewNotes?: string;
    reviewedBy?: SanityReference<Author> | Author;
    reviewedAt?: string;
    publishedAt?: string;
    featured: boolean;

    // SEO - Updated field names to match schema
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;

    // Translation management - Updated to match schema
    baseDocument?: SanityReference<CaseStudy> | CaseStudy;
    translations?: CaseStudyTranslation[];
}

// Resolved Case Study (when references are populated)
export interface ResolvedCaseStudy extends Omit<CaseStudy, 'organizations' | 'projects' | 'tags' | 'reviewedBy' | 'authors' | 'baseDocument' | 'translations'> {
    organizations?: Organization[];
    projects?: Project[];
    tags?: ReportTag[];
    reviewedBy?: Author;
    authors: Array<CaseStudyAuthor & {
        affiliation?: Organization;
    }>;
    baseDocument?: CaseStudy;
    translations?: Array<CaseStudyTranslation & {
        document: CaseStudy;
    }>;
}

// Grid Case Study interface
export interface GridCaseStudy {
    _type: 'grid-case-study';
    _key: string;
    showTags: boolean;
    showAuthors: boolean;
    showMetadata: boolean;
    customExcerpt?: string;
    caseStudy: SanityReference<CaseStudy> | CaseStudy;
}

// Resolved Grid Case Study
export interface ResolvedGridCaseStudy extends Omit<GridCaseStudy, 'caseStudy'> {
    caseStudy: ResolvedCaseStudy;
}

// Utility types for different query contexts
export type CaseStudyCard = Pick<
    ResolvedCaseStudy,
    | '_id'
    | 'language'
    | 'title'
    | 'excerpt'
    | 'slug'
    | 'publishedAt'
    | 'featured'
    | 'image'
    | 'authors'
    | 'tags'
    | 'status'
>;

export type CaseStudyPreview = Pick<
    ResolvedCaseStudy,
    | '_id'
    | 'language'
    | 'title'
    | 'excerpt'
    | 'slug'
    | 'status'
    | 'publishedAt'
    | 'featured'
    | 'image'
>;

// Helper function to get localized content
export function getLocalizedContent<T extends LocalizedString>(
    content: T,
    language: SupportedLanguage,
    fallback: SupportedLanguage = 'en'
): string {
    return content[language] || content[fallback] || Object.values(content).find(v => v) || '';
}

// Helper function to get display title for any language
export function getCaseStudyTitle(
    caseStudy: { title: LocalizedString; language: SupportedLanguage },
    preferredLanguage?: SupportedLanguage
): string {
    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedContent(caseStudy.title, lang);
}

// Helper function to get display excerpt for any language
export function getCaseStudyExcerpt(
    caseStudy: { excerpt: LocalizedString; language: SupportedLanguage },
    customExcerpt?: string,
    preferredLanguage?: SupportedLanguage
): string {
    if (customExcerpt) return customExcerpt;

    const lang = preferredLanguage || caseStudy.language;
    return getLocalizedContent(caseStudy.excerpt, lang);
}

// Helper function to check if case study is published
export function isCaseStudyPublished(caseStudy: Pick<CaseStudy, 'status'>): boolean {
    return caseStudy.status === 'published';
}

// Helper function to check if case study is available for translation
export function canTranslateCaseStudy(caseStudy: Pick<CaseStudy, 'language' | 'status'>): boolean {
    return caseStudy.language === 'en' && ['approved', 'published'].includes(caseStudy.status);
}

// Helper function to get available translations
export function getAvailableTranslations(caseStudy: Pick<CaseStudy, 'translations'>): SupportedLanguage[] {
    if (!caseStudy.translations) return [];
    return caseStudy.translations
        .filter(t => t.status === 'complete')
        .map(t => t.language);
}

// Helper function to get case study URL
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
