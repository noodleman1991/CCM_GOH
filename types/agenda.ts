import type { Organization } from './case-study'

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ar';

export type AccessLevel = 'public' | 'registered' | 'members';

export interface LocalizedString {
    en: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface AgendaFile {
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

export interface AgendaTag {
    _id: string;
    label: LocalizedString;
    value: {
        current: string;
    };
    color: string;
    category?: string;
}

export interface RegionalCommunity {
    _id: string;
    name: LocalizedString;
    code: string;
    slug: {
        current: string;
    };
}

export interface Agenda {
    _id: string;
    title: LocalizedString;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    slug: {
        current: string;
    };
    agendaType: string;
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
    files?: AgendaFile[];
    tags?: AgendaTag[];
    organizations?: Organization[];
    regionalCommunities?: RegionalCommunity[];
}

export interface AgendaCardProps {
    agenda: Agenda;
    locale?: string;
    userId?: string;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
    className?: string;
}

export interface DownloadTrackingData {
    agendaId: string;
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

// Agenda type labels
export const AGENDA_TYPE_LABELS: Record<string, string> = {
    annual: 'Annual Agenda',
    research: 'Research Agenda',
    policy: 'Policy Brief',
    technical: 'Technical Agenda',
    'case-study': 'Case Study Agenda',
    whitepaper: 'White Paper',
    guidelines: 'Guidelines',
    agenda: 'Meeting Agenda',
    minutes: 'Meeting Minutes',
    other: 'Other'
};