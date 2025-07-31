export interface LocalizedString {
    en: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface SanityAsset {
    _id: string;
    url: string;
    originalFilename?: string;
    size?: number;
    mimeType: string;
}

export interface ReportFile {
    language: 'en' | 'es' | 'fr' | 'ar';
    file: {
        asset: SanityAsset;
    };
    downloadCount?: number;
    lastDownloaded?: string;
}

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: { current: string };
    color: string;
    category: string;
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

export interface RegionalCommunity {
    _id: string;
    name: LocalizedString;
    slug: { current: string };
    code: string;
}

export type ReportType =
    | 'annual'
    | 'research'
    | 'policy'
    | 'technical'
    | 'case-study'
    | 'whitepaper'
    | 'guidelines'
    | 'agenda'
    | 'minutes'
    | 'other';

export type AccessLevel = 'public' | 'registered' | 'members';

export interface Report {
    _id: string;
    title: LocalizedString;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    slug: { current: string };
    reportType: ReportType;
    year?: number;
    publishDate?: string;
    totalDownloadCount?: number;
    featured?: boolean;
    accessLevel?: AccessLevel;
    coverImage?: {
        asset?: {
            _id: string;
            url: string;
            mimeType: string;
            metadata?: {
                lqip?: string;
                dimensions?: {
                    width: number;
                    height: number;
                };
            };
        };
        alt?: string;
    };
    files: ReportFile[];
    tags?: Tag[];
    organizations?: Organization[];
    regionalCommunities?: RegionalCommunity[];
}

export interface GridReport {
    _type: 'grid-report';
    _key: string;
    report: Report;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
}

export interface DownloadTrackingData {
    reportId: string;
    fileLanguage: string;
    userId?: string;
}

// Utility types for components
export interface ReportCardProps {
    report: Report;
    locale: string; // Changed from keyof LocalizedString to string
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
    userId?: string;
    className?: string;
}

// Language configuration
export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'ar'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ar: 'العربية',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    es: '🇪🇸',
    fr: '🇫🇷',
    ar: '🇸🇦',
};

// Report type labels
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
    annual: 'Annual Report',
    research: 'Research Report',
    policy: 'Policy Brief',
    technical: 'Technical Report',
    'case-study': 'Case Study Report',
    whitepaper: 'White Paper',
    guidelines: 'Guidelines',
    agenda: 'Meeting Agenda',
    minutes: 'Meeting Minutes',
    other: 'Other',
};
