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
    };
}

export interface Organization {
    _id: string;
    name: string;
    slug: { current: string };
    acronym?: string;
}

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: { current: string };
    color?: string;
}

export interface CaseStudy {
    _id: string;
    title: LocalizedString; // Field-level localized object
    excerpt?: LocalizedString; // Field-level localized object
    slug: { current: string };
    status: 'pending' | 'approved' | 'rejected' | 'revision';
    publishedAt?: string;
    featured?: boolean;
    image?: {
        asset?: {
            _id: string;
            url: string;
            mimeType?: string;
            metadata?: {
                lqip?: string;
                dimensions?: { width: number; height: number };
            };
        };
        alt?: string;
        caption?: string;
    };
    authors: CaseStudyAuthor[];
    organizations?: Organization[];
    tags?: Tag[];
    studyPeriod?: {
        startDate?: string;
        endDate?: string;
    };
    studyLocation?: {
        lat: number;
        lng: number;
        alt?: number;
    };
    studyAreas?: Array<{
        location: { lat: number; lng: number; alt?: number };
        name: string;
        description?: string;
    }>;
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
