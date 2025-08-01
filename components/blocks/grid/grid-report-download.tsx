'use client'

import React from 'react';
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
                "gap-2 transition-all",
                isDownloading && "animate-pulse",
                error && "border-red-200 text-red-600"
            )}
            title={`Download ${languageDisplay}${fileSize ? ` (${fileSize})` : ''}`}
        >
            {isDownloading ? (
                <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="hidden sm:inline">Downloading...</span>
                </>
            ) : (
                <>
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">{languageDisplay}</span>
                    <span className="sm:hidden">{file.language.toUpperCase()}</span>
                    {fileSize && (
                        <span className="hidden md:inline text-xs opacity-70">
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
    // Download buttons
    if (showDownloadButtons && hasFiles && canAccess) {
        return (
            <div className="w-full space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <FileDown className="h-3 w-3" />
                    <span>Available in {availableLanguages.length} language{availableLanguages.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="flex flex-wrap gap-2">
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
                <span>No files available</span>
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
                        ? 'Sign in to download'
                        : 'Members only'
                    }
                </span>
            </div>
        );
    }

    return null;
}
