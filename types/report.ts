export interface LocalizedString {
    en: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface ReportFile {
    language: string;
    file?: {
        asset?: {
            _id: string;
            url: string;
            originalFilename: string;
            size: number;
            mimeType: string;
        };
    };
    fileUrl?: string; // R2 URL
    fileSize?: number; // Size in MB
    pages?: number;
}

export interface Tag {
    _id: string;
    label: LocalizedString;
    value: string;
    color: string;
    category: string;
}

export interface Organization {
    _id: string;
    name: string;
    slug: { current: string };
    logo?: {
        asset?: {
            _id: string;
            url: string;
        };
    };
}

export interface Author {
    name: string;
    organization?: Organization;
}

export interface Report {
    _id: string;
    title: LocalizedString;
    subtitle?: LocalizedString;
    description?: LocalizedString;
    slug: { current: string };
    reportType: 'annual' | 'research' | 'policy' | 'technical' | 'case-study' | 'whitepaper' | 'guidelines' | 'agenda' | 'minutes' | 'other';
    year?: number;
    publishDate?: string;
    downloadCount?: number;
    featured?: boolean;
    accessLevel?: 'public' | 'registered' | 'members';
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
    files?: ReportFile[];
    tags?: Tag[];
    organizations?: Organization[];
    authors?: Author[];
}

export interface GridReport {
    _type: 'grid-report';
    _key: string;
    report: Report;
    showTags?: boolean;
    showDownloadButtons?: boolean;
    showMetadata?: boolean;
}

export interface DownloadEvent {
    reportId: string;
    fileLanguage: string;
    userId?: string;
    sessionId: string;
    timestamp: string;
    userAgent?: string;
    referer?: string;
    ipAddress?: string;
}

export interface R2FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
    language: string;
    reportId: string;
    uploadedAt?: string;
}

export interface R2UploadResponse {
    success: boolean;
    result?: {
        id: string;
        filename: string;
        uploaded: string;
        requireSignedURLs: boolean;
        variants: string[];
    };
    errors?: Array<{
        code: number;
        message: string;
    }>;
}

