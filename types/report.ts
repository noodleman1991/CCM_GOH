import type { Organization } from './case-study'

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar';

export type AccessLevel = 'public' | 'registered' | 'members';

export interface LocalizedString {
    en: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface ReportFile {
    language: SupportedLanguage;
    file?: {
        asset?: {
            _id: string;
            url: string;
            originalFilename?: string;
            size?: number;
            mimeType?: string;
        };
    };
    downloadCount?: number;
    lastDownloaded?: string;
}

export interface ReportTag {
    _id: string;
    label: LocalizedString;
    value: {
        current: string;
    };
    color: string;
    category?: string;
}

// export interface Organization {
//     _id: string;
//     name: string;
//     slug: {
//         current: string;
//     };
//     acronym?: string;
//     logo?: {
//         asset?: {
//             _id: string;
//             url: string;
//         };
//         alt?: string;
//     };
// }

export interface RegionalCommunity {
    _id: string;
    name: LocalizedString;
    code: string;
    slug: {
        current: string;
    };
}

export interface Report {
    _id: string;
    title: LocalizedString;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    slug: {
        current: string;
    };
    reportType: string;
    year?: number;
    publishDate?: string;
    totalDownloadCount?: number;
    featured?: boolean;
    accessLevel?: AccessLevel;
    coverImage?: {
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
    };
    files?: ReportFile[];
    tags?: ReportTag[];
    organizations?: Organization[];
    regionalCommunities?: RegionalCommunity[];
}

export interface ReportCardProps {
    report: Report;
    locale?: string;
    userId?: string;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
    className?: string;
}

export interface DownloadTrackingData {
    reportId: string;
    fileLanguage: SupportedLanguage;
    userId?: string;
}

// Language display constants
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    ar: 'العربية'
};


// Report type labels
export const REPORT_TYPE_LABELS: Record<string, string> = {
    annual: 'Annual Report',
    research: 'Research Report',
    policy: 'Policy Brief',
    technical: 'Technical Report',
    'case-study': 'Case Study Report',
    whitepaper: 'White Paper',
    guidelines: 'Guidelines',
    agenda: 'Meeting Agenda',
    minutes: 'Meeting Minutes',
    other: 'Other'
};
