'use client'

import { useState, useCallback } from 'react';
import type { ReportFile, Report } from '@/types/report';
import type { AgendaFile, Agenda } from '@/types/agenda';
import { downloadFile, validateReport } from '@/lib/report-utils';

// Generic file type that works for both Report and Agenda
type DownloadableFile = ReportFile | AgendaFile;

// Generic content type that works for both Report and Agenda
type DownloadableContent = Report | Agenda;

interface UseDownloadTrackingOptions {
    userId?: string;
    onDownloadStart?: (contentId: string, language: string) => void;
    onDownloadComplete?: (contentId: string, language: string) => void;
    onDownloadError?: (error: Error, contentId: string, language: string) => void;
}

interface DownloadState {
    isDownloading: boolean;
    downloadingFiles: Set<string>;
    error: string | null;
}

export function useDownloadTracking(options: UseDownloadTrackingOptions = {}) {
    const [state, setState] = useState<DownloadState>({
        isDownloading: false,
        downloadingFiles: new Set(),
        error: null,
    });

    const { userId, onDownloadStart, onDownloadComplete, onDownloadError } = options;

    const download = useCallback(async (
        file: DownloadableFile,
        content: DownloadableContent
    ): Promise<void> => {
        // Validate inputs
        if (!content || !content._id) {
            const error = new Error('Invalid content data: missing content ID');
            const contentId = content?._id || 'unknown';
            onDownloadError?.(error, contentId, file.language);
            throw error;
        }

        if (!file.file?.asset?.url) {
            const error = new Error('No download URL available for this file');
            onDownloadError?.(error, content._id, file.language);
            throw error;
        }

        // if (!validateReport(report)) {
        //     const error = new Error('Invalid report data structure');
        //     onDownloadError?.(error, report._id, file.language);
        //     throw error;
        // } //todo: !!uncomment!!

        const fileKey = `${content._id}-${file.language}`;

        // Update state to show download is starting
        setState(prev => ({
            ...prev,
            isDownloading: true,
            downloadingFiles: new Set([...prev.downloadingFiles, fileKey]),
            error: null,
        }));

        onDownloadStart?.(content._id, file.language);

        try {
            await downloadFile(file, content._id, userId);
            onDownloadComplete?.(content._id, file.language);

        } catch (error) {
            const downloadError = error instanceof Error
                ? error
                : new Error('Download failed');

            setState(prev => ({
                ...prev,
                error: downloadError.message,
            }));

            onDownloadError?.(downloadError, content._id, file.language);
            throw downloadError;

        } finally {
            // Update state to remove download status
            setState(prev => {
                const newDownloadingFiles = new Set(prev.downloadingFiles);
                newDownloadingFiles.delete(fileKey);

                return {
                    ...prev,
                    isDownloading: newDownloadingFiles.size > 0,
                    downloadingFiles: newDownloadingFiles,
                };
            });
        }
    }, [userId, onDownloadStart, onDownloadComplete, onDownloadError]);

    const isFileDownloading = useCallback((contentId: string, language: string): boolean => {
        const fileKey = `${contentId}-${language}`;
        return state.downloadingFiles.has(fileKey);
    }, [state.downloadingFiles]);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    return {
        download,
        isDownloading: state.isDownloading,
        isFileDownloading,
        error: state.error,
        clearError,
    };
}
