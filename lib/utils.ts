import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ✅ Locale-aware date formatting
export const formatDate = (date: string, locale: string = "en"): string => {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return dateObj.toLocaleDateString(locale, options);
};

// Define the types for block content and children
type Block = {
  _type: string;
  children?: Array<{ text: string }>;
};

type BlockContent = Block[] | null;

// Helper function to extract plain text from block content
export const extractPlainText = (blocks: BlockContent): string | null => {
  if (!blocks || !Array.isArray(blocks)) return null;

  return blocks
    .map((block) => {
      if (block._type === "block" && Array.isArray(block.children)) {
        return block.children.map((child) => child.text).join("");
      }
      return "";
    })
    .join(" ");
};

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// /**
//  * Format date to locale string ** claude
//  */
// export function formatDate(date: string | Date, locale: string = 'en-US'): string {
//     const dateObj = typeof date === 'string' ? new Date(date) : date;
//
//     return new Intl.DateTimeFormat(locale, {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric'
//     }).format(dateObj);
// }

/**
 * Format date to short format
 */
export function formatDateShort(date: string | Date, locale: string = 'en-US'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(dateObj);
}

/**
 * Get language-specific text from localized object
 */
export function getLocalizedText(
    localizedText: Record<string, string> | undefined,
    locale: string,
    fallback: string = ''
): string {
    if (!localizedText) return fallback;

    return localizedText[locale] || localizedText.en || fallback;
}

/**
 * Validate file type for reports
 */
export function isValidReportFile(file: File): boolean {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    return allowedTypes.includes(file.type);
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
}

/**
 * Generate safe filename for storage
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
}

/**
 * Check if user has access to report based on access level
 */
export function canAccessReport(
    accessLevel: 'public' | 'registered' | 'members',
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
 * Get report access message
 */
export function getAccessMessage(
    accessLevel: 'public' | 'registered' | 'members',
    locale: string = 'en'
): string {
    const messages = {
        en: {
            registered: 'Please sign in to download this report',
            members: 'This report is available to members only'
        },
        es: {
            registered: 'Por favor inicia sesión para descargar este informe',
            members: 'Este informe está disponible solo para miembros'
        },
        fr: {
            registered: 'Veuillez vous connecter pour télécharger ce rapport',
            members: 'Ce rapport est disponible uniquement aux membres'
        },
        ar: {
            registered: 'يرجى تسجيل الدخول لتحميل هذا التقرير',
            members: 'هذا التقرير متاح للأعضاء فقط'
        }
    };

    const localizedMessages = messages[locale as keyof typeof messages] || messages.en;

    switch (accessLevel) {
        case 'registered':
            return localizedMessages.registered;
        case 'members':
            return localizedMessages.members;
        default:
            return '';
    }
}
