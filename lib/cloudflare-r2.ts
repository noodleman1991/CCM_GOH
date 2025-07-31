import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { R2UploadResponse, R2FileMetadata, DownloadEvent } from '@/types/report';

interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
    endpoint: string;
}

class CloudflareR2Service {
    private config: R2Config;
    private s3Client: S3Client;

    constructor() {
        // Use your existing environment variable names
        this.config = {
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
            // Use your existing endpoint or build it from account ID
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ||
                `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        };

        console.log('R2 Config loaded:', {
            accountId: this.config.accountId?.substring(0, 8) + '...',
            bucketName: this.config.bucketName,
            endpoint: this.config.endpoint,
            publicUrl: this.config.publicUrl,
            hasAccessKey: !!this.config.accessKeyId,
            hasSecretKey: !!this.config.secretAccessKey,
        });

        // Validate required environment variables
        const requiredVars = {
            'CLOUDFLARE_ACCOUNT_ID': this.config.accountId,
            'CLOUDFLARE_R2_ACCESS_KEY_ID': this.config.accessKeyId,
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY': this.config.secretAccessKey,
            'CLOUDFLARE_R2_BUCKET_NAME': this.config.bucketName,
            'CLOUDFLARE_R2_PUBLIC_URL': this.config.publicUrl,
        };

        const missingVars = Object.entries(requiredVars)
            .filter(([_, value]) => !value)
            .map(([key, _]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Initialize S3 client for R2
        this.s3Client = new S3Client({
            region: "auto",
            endpoint: this.config.endpoint,
            credentials: {
                accessKeyId: this.config.accessKeyId,
                secretAccessKey: this.config.secretAccessKey,
            },
            forcePathStyle: true, // Important for R2
        });

        console.log('S3Client initialized successfully');
    }

    /**
     * Upload a file to Cloudflare R2
     */
    async uploadFile(
        file: File | Buffer,
        metadata: Omit<R2FileMetadata, 'uploadedAt'>
    ): Promise<R2UploadResponse> {
        try {
            console.log('Starting file upload:', metadata);

            const filename = this.generateFilename(metadata);

            let body: Buffer;
            let contentType: string;

            if (file instanceof File) {
                body = Buffer.from(await file.arrayBuffer());
                contentType = file.type || 'application/octet-stream';
            } else {
                body = file;
                contentType = metadata.mimeType || 'application/octet-stream';
            }

            console.log('Upload details:', {
                filename,
                contentType,
                bodySize: body.length,
                bucket: this.config.bucketName
            });

            const command = new PutObjectCommand({
                Bucket: this.config.bucketName,
                Key: filename,
                Body: body,
                ContentType: contentType,
                Metadata: {
                    originalFilename: metadata.filename,
                    language: metadata.language,
                    reportId: metadata.reportId,
                    uploadedAt: new Date().toISOString(),
                },
            });

            const result = await this.s3Client.send(command);
            console.log('Upload successful:', result);

            return {
                success: true,
                result: {
                    id: filename,
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
     * Upload buffer with specific key
     */
    async uploadBuffer(
        buffer: Buffer,
        key: string,
        contentType: string = 'application/octet-stream'
    ): Promise<string> {
        console.log('Uploading buffer:', { key, contentType, size: buffer.length });

        const command = new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000", // 1 year cache for assets
        });

        const result = await this.s3Client.send(command);
        console.log('Buffer upload result:', result);

        return this.getPublicUrl(key);
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
        const command = new GetObjectCommand({
            Bucket: this.config.bucketName,
            Key: filename,
        });

        return await getSignedUrl(this.s3Client as any, command, { expiresIn }); //todo: remove type assertion
    }

    /**
     * Delete a file from R2
     */
    async deleteFile(filename: string): Promise<boolean> {
        try {
            console.log('Deleting file:', filename);

            const command = new DeleteObjectCommand({
                Bucket: this.config.bucketName,
                Key: filename,
            });

            await this.s3Client.send(command);
            console.log('File deleted successfully:', filename);
            return true;
        } catch (error) {
            console.error('R2 delete error:', error);
            return false;
        }
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(filenames: string[]): Promise<boolean[]> {
        return Promise.all(filenames.map(filename => this.deleteFile(filename)));
    }

    /**
     * Track download event
     */
    async trackDownload(event: DownloadEvent): Promise<void> {
        try {
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
