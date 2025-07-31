'use client'

import { useState, useCallback } from 'react';
import { ReportFile, Report } from '@/types/report';
import { downloadFile, validateReport } from '@/lib/report-utils';

interface UseDownloadTrackingOptions {
    userId?: string;
    onDownloadStart?: (reportId: string, language: string) => void;
    onDownloadComplete?: (reportId: string, language: string) => void;
    onDownloadError?: (error: Error, reportId: string, language: string) => void;
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
        file: ReportFile,
        report: Report
    ): Promise<void> => {
        // Validate inputs
        if (!report || !report._id) {
            const error = new Error('Invalid report data: missing report ID');
            const reportId = report?._id || 'unknown';
            onDownloadError?.(error, reportId, file.language);
            throw error;
        }

        if (!file.file?.asset?.url) {
            const error = new Error('No download URL available for this file');
            onDownloadError?.(error, report._id, file.language);
            throw error;
        }

        // if (!validateReport(report)) {
        //     const error = new Error('Invalid report data structure');
        //     onDownloadError?.(error, report._id, file.language);
        //     throw error;
        // } //todo: !!uncomment!!

        const fileKey = `${report._id}-${file.language}`;

        // Update state to show download is starting
        setState(prev => ({
            ...prev,
            isDownloading: true,
            downloadingFiles: new Set([...prev.downloadingFiles, fileKey]),
            error: null,
        }));

        onDownloadStart?.(report._id, file.language);

        try {
            await downloadFile(file, report._id, userId);
            onDownloadComplete?.(report._id, file.language);

        } catch (error) {
            const downloadError = error instanceof Error
                ? error
                : new Error('Download failed');

            setState(prev => ({
                ...prev,
                error: downloadError.message,
            }));

            onDownloadError?.(downloadError, report._id, file.language);
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

    const isFileDownloading = useCallback((reportId: string, language: string): boolean => {
        const fileKey = `${reportId}-${language}`;
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
