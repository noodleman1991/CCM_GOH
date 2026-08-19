import {
    Agenda,
    AgendaFile,
    LocalizedString,
    SupportedLanguage,
    AccessLevel,
    LANGUAGE_NAMES,
    AGENDA_TYPE_LABELS,
    DownloadTrackingData
} from '@/types/agenda';

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
 * Get available file languages for an agenda
 */
export function getAvailableLanguages(agenda: Agenda): SupportedLanguage[] {
    if (!agenda.files) return [];

    return agenda.files
        .map(file => file.language)
        .filter((lang, index, array) => array.indexOf(lang) === index) // Remove duplicates
        .sort(); // Sort alphabetically
}

/**
 * Get file for specific language
 */
export function getFileByLanguage(
    agenda: Agenda,
    language: SupportedLanguage
): AgendaFile | undefined {
    return agenda.files?.find(file => file.language === language);
}

/**
 * Get download URL for a file (Sanity asset URL with download parameter)
 */
export function getFileDownloadUrl(file: AgendaFile): string | null {
    if (!file.file?.asset?.url) return null;

    // Append Sanity download parameter to force download
    const originalFilename = file.file.asset.originalFilename;
    return `${file.file.asset.url}?dl=${originalFilename || ''}`;
}

/**
 * Get file name for display
 */
export function getFileName(file: AgendaFile): string {
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
 * Get agenda type display label
 */
export function getAgendaTypeLabel(agendaType: string): string {
    return AGENDA_TYPE_LABELS[agendaType as keyof typeof AGENDA_TYPE_LABELS] || agendaType;
}

/**
 * Check if user can access agenda based on access level
 */
export function canAccessAgenda(
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
            agendaId: data.agendaId,
            fileLanguage: data.fileLanguage,
            userId: data.userId,
            sessionId,
            timestamp: new Date().toISOString(),
        };

        const response = await fetch('/api/agendas/download/track', {
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
    file: AgendaFile,
    agendaId: string,
    userId?: string
): Promise<void> {
    const downloadUrl = getFileDownloadUrl(file);

    if (!downloadUrl) {
        throw new Error('No download URL available for this file');
    }

    // Track download (don't wait for completion)
    const trackingData: DownloadTrackingData = {
        agendaId,
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
 * Validate agenda data structure
 */
export function validateAgenda(agenda: unknown): agenda is Agenda {
    if (!agenda || typeof agenda !== 'object') return false;
    const candidate = agenda as Partial<Agenda>;
    if (!candidate._id || !candidate.title || !candidate.slug) return false;
    if (!candidate.files || !Array.isArray(candidate.files)) return false;
    if (candidate.files.length === 0) return false;

    // Validate at least one file has a valid asset
    const hasValidFile = candidate.files.some((file) =>
        file.file?.asset?.url
    );

    return hasValidFile;
}

/**
 * Sort agendas by date (newest first)
 */
export function sortAgendasByDate(agendas: Agenda[]): Agenda[] {
    return [...agendas].sort((a, b) => {
        const dateA = new Date(a.publishDate || '').getTime();
        const dateB = new Date(b.publishDate || '').getTime();
        return dateB - dateA; // Newest first
    });
}

/**
 * Filter agendas by access level
 */
export function filterAgendasByAccess(
    agendas: Agenda[],
    userRole?: 'guest' | 'user' | 'member' | 'admin'
): Agenda[] {
    return agendas.filter(agenda =>
        canAccessAgenda(agenda.accessLevel, userRole)
    );
}

/**
 * Search agendas by title/description
 */
export function searchAgendas(
    agendas: Agenda[],
    query: string,
    locale: string // Changed from SupportedLanguage to string
): Agenda[] {
    if (!query.trim()) return agendas;

    const searchTerm = query.toLowerCase().trim();

    return agendas.filter(agenda => {
        const title = getLocalizedText(agenda.title, locale, '').toLowerCase();
        const description = getLocalizedText(agenda.description, locale, '').toLowerCase();
        const subtitle = getLocalizedText(agenda.subtitle, locale, '').toLowerCase();

        return title.includes(searchTerm) ||
            description.includes(searchTerm) ||
            subtitle.includes(searchTerm);
    });
}