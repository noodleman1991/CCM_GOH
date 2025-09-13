import {
    Report,
    ReportFile,
    LocalizedString,
    SupportedLanguage,
    AccessLevel,
    LANGUAGE_NAMES,
    REPORT_TYPE_LABELS,
    DownloadTrackingData
} from '@/types/report';

/**
 * Get localized text from a LocalizedString object
 */
export function getLocalizedText(
    text: LocalizedString | string | undefined,
    locale: string, // Changed from SupportedLanguage to string
    fallback: string = ''
): string {
    if (!text) return fallback;
    if (typeof text === 'string') return text;

    // Cast locale to SupportedLanguage for indexing, with fallback
    const supportedLocale = locale as SupportedLanguage;
    return text[supportedLocale] || text.en || fallback;
}

/**
 * Get available file languages for a report
 */
export function getAvailableLanguages(report: Report): SupportedLanguage[] {
    if (!report.files) return [];

    return report.files
        .map(file => file.language)
        .filter((lang, index, array) => array.indexOf(lang) === index) // Remove duplicates
        .sort(); // Sort alphabetically
}

/**
 * Get file for specific language
 */
export function getFileByLanguage(
    report: Report,
    language: SupportedLanguage
): ReportFile | undefined {
    return report.files?.find(file => file.language === language);
}

/**
 * Get download URL for a file (Sanity asset URL with download parameter)
 */
export function getFileDownloadUrl(file: ReportFile): string | null {
    if (!file.file?.asset?.url) return null;

    // Append Sanity download parameter to force download
    const originalFilename = file.file.asset.originalFilename;
    return `${file.file.asset.url}?dl=${originalFilename || ''}`;
}

/**
 * Get file name for display
 */
export function getFileName(file: ReportFile): string {
    return file.file?.asset?.originalFilename || 'download';
}

/**
 * Format file size for display
 */
export function formatFileSize(sizeInBytes: number | undefined): string {
    if (!sizeInBytes) return '';

    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB < 1) {
        const sizeInKB = Math.round(sizeInBytes / 1024);
        return `${sizeInKB} KB`;
    }

    return `${sizeInMB.toFixed(1)} MB`;
}

/**
 * Get language display name
 */
export function getLanguageDisplay(language: SupportedLanguage): string {
    const name = LANGUAGE_NAMES[language];
    return name;
}

/**
 * Get report type display label
 */
export function getReportTypeLabel(reportType: string): string {
    return REPORT_TYPE_LABELS[reportType as keyof typeof REPORT_TYPE_LABELS] || reportType;
}

/**
 * Check if user can access report based on access level
 */
export function canAccessReport(
    accessLevel: AccessLevel = 'public',
    userRole?: 'guest' | 'user' | 'member' | 'admin'
): boolean {
    switch (accessLevel) {
        case 'public':
            return true;
        case 'registered':
            return userRole !== 'guest' && userRole !== undefined;
        case 'members':
            return userRole === 'member' || userRole === 'admin';
        default:
            return false;
    }
}

/**
 * Generate session ID for download tracking
 */
export function generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Track download event
 */
export async function trackDownload(data: DownloadTrackingData): Promise<boolean> {
    try {
        const sessionId = generateSessionId();

        const downloadEvent = {
            reportId: data.reportId,
            fileLanguage: data.fileLanguage,
            userId: data.userId,
            sessionId,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch('/api/reports/download/track', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(downloadEvent),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to track download:', error);
        return false;
    }
}

/**
 * Initiate file download with tracking
 */
export async function downloadFile(
    file: ReportFile,
    reportId: string,
    userId?: string
): Promise<void> {
    const downloadUrl = getFileDownloadUrl(file);

    if (!downloadUrl) {
        throw new Error('No download URL available for this file');
    }

    // Track download (don't wait for completion)
    const trackingData: DownloadTrackingData = {
        reportId,
        fileLanguage: file.language,
        userId,
    };

    trackDownload(trackingData).catch(console.error);

    // Start download by opening URL
    const fileName = getFileName(file);

    try {
        // Create temporary link element for download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';

        // Add to DOM temporarily and click
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        // Fallback: open in new window
        window.open(downloadUrl, '_blank');
    }
}

/**
 * Validate report data structure
 */
export function validateReport(report: any): report is Report {
    if (!report || typeof report !== 'object') return false;
    if (!report._id || !report.title || !report.slug) return false;
    if (!report.files || !Array.isArray(report.files)) return false;
    if (report.files.length === 0) return false;

    // Validate at least one file has a valid asset
    const hasValidFile = report.files.some((file: any) =>
        file.file?.asset?.url
    );

    return hasValidFile;
}

/**
 * Sort reports by date (newest first)
 */
export function sortReportsByDate(reports: Report[]): Report[] {
    return [...reports].sort((a, b) => {
        const dateA = new Date(a.publishDate || '').getTime();
        const dateB = new Date(b.publishDate || '').getTime();
        return dateB - dateA; // Newest first
    });
}

/**
 * Filter reports by access level
 */
export function filterReportsByAccess(
    reports: Report[],
    userRole?: 'guest' | 'user' | 'member' | 'admin'
): Report[] {
    return reports.filter(report =>
        canAccessReport(report.accessLevel, userRole)
    );
}

/**
 * Search reports by title/description
 */
export function searchReports(
    reports: Report[],
    query: string,
    locale: string // Changed from SupportedLanguage to string
): Report[] {
    if (!query.trim()) return reports;

    const searchTerm = query.toLowerCase().trim();

    return reports.filter(report => {
        const title = getLocalizedText(report.title, locale, '').toLowerCase();
        const description = getLocalizedText(report.description, locale, '').toLowerCase();
        const subtitle = getLocalizedText(report.subtitle, locale, '').toLowerCase();

        return title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            subtitle.includes(searchTerm);
    });
}
