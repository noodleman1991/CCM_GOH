export interface LocalizedString {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface CaseStudyAuthor {
    userId?: string;
    name: string;
    email?: string;
    role: 'lead' | 'coauthor' | 'contributor' | 'advisor';
    affiliation?: {
        _id: string;
        name: string;
        slug: { current: string };
        acronym?: string;
        logo?: {
            asset?: {
                _id: string;
                url: string;
            };
            alt?: string;
        };
    };
}

export interface Organization {
    _id: string;
    name: string;
    slug: { current: string };
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
    slug: { current: string };
}

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: { current: string };
    color?: string;
}

export interface StudyArea {
    location: {
        lat: number;
        lng: number;
        alt?: number
    };
    name: string;
    description?: string;
}

export interface StudyPeriod {
    startDate?: string;
    endDate?: string;
}

export interface CaseStudyImage {
    asset?: {
        _id: string;
        url: string;
        mimeType?: string;
        metadata?: {
            lqip?: string;
            dimensions?: {
                width: number;
                height: number
            };
        };
    };
    alt?: string;
    caption?: string;
}

export interface CaseStudy {
    _id: string;
    title: LocalizedString; // Field-level localized object
    excerpt?: LocalizedString; // Field-level localized object
    content?: any; // Portable Text content (styled-block-content)
    layout?: 'story' | 'feature' | 'report'; // Detail-page archetype (§4.12)
    slug: { current: string };
    status: 'pending' | 'approved' | 'rejected' | 'revision';
    publishedAt?: string;
    submittedAt?: string;
    submittedBy?: string;
    featured?: boolean;
    image?: CaseStudyImage;
    authors: CaseStudyAuthor[];
    organizations?: Organization[];
    projects?: Project[];
    tags?: Tag[];
    studyPeriod?: StudyPeriod;
    studyLocation?: {
        lat: number;
        lng: number;
        alt?: number;
    };
    studyAreas?: StudyArea[];
    // Cross-content links (connection[] — see RELATED_CONTENT_PROJECTION)
    relatedContent?: Array<{
        relation?: string;
        target?: {
            _type: string;
            _id: string;
            slug?: string;
            title?: unknown;
            excerpt?: unknown;
            image?: { asset?: { url?: string }; alt?: string };
            status?: string;
        } | null;
    }>;
    // SEO fields
    seoTitle?: string;
    seoDescription?: string;
    canonicalUrl?: string;
    // Review fields
    reviewNotes?: string;
    reviewedBy?: string;
    reviewedAt?: string;
}

export interface GridCaseStudyComponentProps {
    _type: 'grid-case-study';
    _key: string;
    caseStudy: CaseStudy;
    showTags?: boolean;
    showAuthors?: boolean;
    showMetadata?: boolean;
    showStudyPeriod?: boolean;
    showLocation?: boolean;
    customExcerpt?: LocalizedString;
    customLayout?: 'default' | 'compact' | 'featured' | 'minimal';
    priority?: number;
    locale: string;
    userId?: string;
    className?: string;
    color?: string;
}

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar';

export type CaseStudyStatus = 'pending' | 'approved' | 'rejected' | 'revision';

export type UserRole = 'guest' | 'user' | 'admin';

// For search and filtering
export interface CaseStudySearchParams {
    searchTerm?: string;
    locale?: SupportedLanguage;
    tags?: string[];
    status?: CaseStudyStatus[];
    featured?: boolean;
    authorId?: string;
    organizationId?: string;
    projectId?: string;
    limit?: number;
    offset?: number;
}

// For API responses
export interface CaseStudyListResponse {
    data: CaseStudy[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
}

// For form submissions
export interface CaseStudyFormData {
    title: LocalizedString;
    excerpt?: LocalizedString;
    authors: Omit<CaseStudyAuthor, 'affiliation'> & { affiliationId?: string }[];
    organizationIds?: string[];
    projectIds?: string[];
    tagIds?: string[];
    studyPeriod?: StudyPeriod;
    studyLocation?: CaseStudy['studyLocation'];
    studyAreas?: StudyArea[];
    image?: File;
    imageAlt?: string;
    imageCaption?: string;
}
