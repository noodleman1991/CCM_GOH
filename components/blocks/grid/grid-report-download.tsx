'use client'

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
    FileDown,
    Download,
    Lock,
    AlertCircle
} from 'lucide-react';
import {
    Report,
    ReportFile,
    SupportedLanguage
} from '@/types/report';
import {
    getFileByLanguage,
    formatFileSize,
    getLanguageDisplay
} from '@/lib/report-utils';
import { useDownloadTracking } from '@/hooks/use-download-tracking';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
    file: ReportFile;
    report: Report;
    locale: string;
    userId?: string;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'default' | 'lg';
}

function DownloadButton({
                            file,
                            report,
                            locale,
                            userId,
                            disabled = false,
                            variant = 'default',
                            size = 'sm'
                        }: DownloadButtonProps) {
    const t = useTranslations('regional');
    const { download, isFileDownloading, error } = useDownloadTracking({
        userId,
        onDownloadError: (error, reportId, language) => {
            console.error(`Download failed for ${reportId} (${language}):`, error);
        }
    });

    const isDownloading = isFileDownloading(report._id, file.language);
    const fileSize = formatFileSize(file.file?.asset?.size);
    const languageDisplay = getLanguageDisplay(file.language);

    const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            await download(file, report);
        } catch (error) {
            // Error is already handled by the hook
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleDownload}
            disabled={disabled || isDownloading}
            className={cn(
                "gap-1 transition-all text-xs px-2 py-1.5 h-auto min-w-0 max-w-full overflow-hidden",
                isDownloading && "animate-pulse",
                error && "border-red-200 text-red-600"
            )}
            title={`${t('downloadFile', { name: languageDisplay })}${fileSize ? ` (${fileSize})` : ''}`}
        >
            {isDownloading ? (
                <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0" />
                    <span className="truncate">{t('downloading')}</span>
                </>
            ) : (
                <>
                    <Download className="h-3 w-3 shrink-0" />
                    <span className="truncate">{languageDisplay}</span>
                    {fileSize && (
                        // No opacity dimming: it dropped contrast below WCAG AA
                        // (4.5:1). The smaller text-xs already reads as secondary.
                        <span className="text-xs shrink-0 ms-1">
                            ({fileSize})
                        </span>
                    )}
                </>
            )}
        </Button>
    );
}

interface DownloadSectionProps {
    report: Report;
    availableLanguages: SupportedLanguage[];
    hasFiles: boolean;
    canAccess: boolean;
    showDownloadButtons: boolean;
    locale: string;
    userId?: string;
}

export function DownloadSection({
                                    report,
                                    availableLanguages,
                                    hasFiles,
                                    canAccess,
                                    showDownloadButtons,
                                    locale,
                                    userId
                                }: DownloadSectionProps) {
    const t = useTranslations('common');
    const tRegional = useTranslations('regional');
    // Download buttons
    if (showDownloadButtons && hasFiles && canAccess) {
        return (
            <div className="w-full space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2 justify-start">
                    <FileDown className="h-3 w-3" />
                    <span>{t('availableInLanguages', { count: availableLanguages.length })}</span>
                </div>

                <div className="flex flex-col gap-2">
                    {availableLanguages.map(language => {
                        const file = getFileByLanguage(report, language);
                        if (!file) return null;

                        return (
                            <DownloadButton
                                key={language}
                                file={file}
                                report={report}
                                locale={locale}
                                userId={userId}
                                variant="outline"
                                size="sm"
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    // No files available message
    if (!hasFiles) {
        return (
            <div className="w-full text-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                <span>{tRegional('noFilesAvailable')}</span>
            </div>
        );
    }

    // Access restricted message
    if (!canAccess && hasFiles) {
        return (
            <div className="w-full text-center text-sm text-muted-foreground">
                <Lock className="h-4 w-4 mx-auto mb-1" />
                <span>
                    {report.accessLevel === 'registered'
                        ? tRegional('signInToDownload')
                        : tRegional('membersOnly')
                    }
                </span>
            </div>
        );
    }

    return null;
}
