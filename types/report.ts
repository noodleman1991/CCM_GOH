export interface ReportFile {
    language: 'en' | 'es' | 'fr' | 'ar';
    file?: {
        asset?: {
            _id: string;
            url: string;
            originalFilename: string;
            size: number;
            mimeType: string;
        };
    };
    fileUrl?: string; // Cloudflare R2 URL
    fileSize?: number; // Size in MB
    pages?: number;
}

export interface ReportAuthor {
    name: string;
    organization?: {
        _id: string;
        name: string;
        slug: { current: string };
    };
}

export interface ReportTag {
    _id: string;
    label: {
        en: string;
        es?: string;
        fr?: string;
        ar?: string;
    };
    value: { current: string };
    color: string;
    category: 'topic' | 'location' | 'method' | 'audience' | 'impact' | 'other';
}

export interface ReportOrganization {
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

export interface LocalizedText {
    en: string;
    es?: string;
    fr?: string;
    ar?: string;
}

export interface Report {
    _id: string;
    title: LocalizedText;
    subtitle?: LocalizedText;
    description?: LocalizedText;
    slug: { current: string };
    reportType: 'annual' | 'research' | 'policy' | 'technical' | 'case-study' | 'whitepaper' | 'guidelines' | 'other';
    year: number;
    publishDate: string;
    downloadCount: number;
    featured: boolean;
    accessLevel: 'public' | 'registered' | 'members';
    coverImage?: {
        asset?: {
            _id: string;
            url: string;
            mimeType: string;
            metadata: {
                lqip: string;
                dimensions: {
                    width: number;
                    height: number;
                };
            };
        };
        alt?: string;
    };
    files: ReportFile[];
    tags?: ReportTag[];
    organizations?: ReportOrganization[];
    authors?: ReportAuthor[];
}

export interface GridReport {
    _type: 'grid-report';
    _key: string;
    showTags: boolean;
    showDownloadButtons: boolean;
    showMetadata: boolean;
    report: Report;
}

// Cloudflare R2 Types
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

export interface R2FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
    language: string;
    reportId: string;
    uploadedAt: string;
}

// Download tracking
export interface DownloadEvent {
    reportId: string;
    fileLanguage: string;
    userId?: string;
    sessionId: string;
    timestamp: string;
    userAgent?: string;
    referer?: string;
}
