import { R2UploadResponse, R2FileMetadata, DownloadEvent } from '@/types/report';

interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
}

class CloudflareR2Service {
    private config: R2Config;

    constructor() {
        this.config = {
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
        };

        // Validate required environment variables
        Object.entries(this.config).forEach(([key, value]) => {
            if (!value) {
                throw new Error(`Missing required environment variable: ${key}`);
            }
        });
    }

    /**
     * Upload a file to Cloudflare R2
     */
    async uploadFile(
        file: File | Buffer,
        metadata: Omit<R2FileMetadata, 'uploadedAt'>
    ): Promise<R2UploadResponse> {
        try {
            const filename = this.generateFilename(metadata);
            const formData = new FormData();

            if (file instanceof File) {
                formData.append('file', file, filename);
            } else {
                formData.append('file', new Blob([file]), filename);
            }

            // Add metadata
            formData.append('metadata', JSON.stringify({
                ...metadata,
                uploadedAt: new Date().toISOString(),
            }));

            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/r2/buckets/${this.config.bucketName}/objects/${filename}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${this.config.accessKeyId}`,
                        'X-Auth-Email': process.env.CLOUDFLARE_EMAIL!,
                        'X-Auth-Key': this.config.secretAccessKey,
                    },
                    body: formData,
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(`R2 upload failed: ${JSON.stringify(result)}`);
            }

            return {
                success: true,
                result: {
                    id: result.result?.id || filename,
                    filename: filename,
                    uploaded: new Date().toISOString(),
                    requireSignedURLs: false,
                    variants: [],
                }
            };
        } catch (error) {
            console.error('R2 upload error:', error);
            return {
                success: false,
                errors: [{
                    code: 500,
                    message: error instanceof Error ? error.message : 'Unknown upload error'
                }]
            };
        }
    }

    /**
     * Generate a structured filename for R2 storage
     */
    private generateFilename(metadata: Omit<R2FileMetadata, 'uploadedAt'>): string {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const sanitizedFilename = metadata.filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .toLowerCase();

        return `reports/${metadata.reportId}/${metadata.language}/${timestamp}_${sanitizedFilename}`;
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(filename: string): string {
        return `${this.config.publicUrl}/${filename}`;
    }

    /**
     * Generate a signed URL for private files
     */
    async getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
        // This would typically use AWS SDK or similar
        // For now, returning public URL
        return this.getPublicUrl(filename);
    }

    /**
     * Delete a file from R2
     */
    async deleteFile(filename: string): Promise<boolean> {
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.config.accountId}/r2/buckets/${this.config.bucketName}/objects/${filename}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.config.accessKeyId}`,
                        'X-Auth-Email': process.env.CLOUDFLARE_EMAIL!,
                        'X-Auth-Key': this.config.secretAccessKey,
                    },
                }
            );

            return response.ok;
        } catch (error) {
            console.error('R2 delete error:', error);
            return false;
        }
    }

    /**
     * Track download event
     */
    async trackDownload(event: DownloadEvent): Promise<void> {
        try {
            // Store download tracking data (could be in database, analytics service, etc.)
            await fetch('/api/analytics/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
        } catch (error) {
            console.error('Download tracking error:', error);
            // Don't throw - tracking failures shouldn't break downloads
        }
    }
}

// Singleton instance
export const r2Service = new CloudflareR2Service();

// Utility functions
export const uploadReportFile = async (
    file: File,
    reportId: string,
    language: string
): Promise<R2UploadResponse> => {
    const metadata: Omit<R2FileMetadata, 'uploadedAt'> = {
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        language,
        reportId,
    };

    return r2Service.uploadFile(file, metadata);
};

export const getReportFileUrl = (reportId: string, language: string, filename: string): string => {
    const structuredFilename = `reports/${reportId}/${language}/${filename}`;
    return r2Service.getPublicUrl(structuredFilename);
};

export const trackReportDownload = async (
    reportId: string,
    fileLanguage: string,
    userId?: string
): Promise<void> => {
    const event: DownloadEvent = {
        reportId,
        fileLanguage,
        userId,
        sessionId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        referer: typeof window !== 'undefined' ? window.document.referrer : undefined,
    };

    await r2Service.trackDownload(event);
};
