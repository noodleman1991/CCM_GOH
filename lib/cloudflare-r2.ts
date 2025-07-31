import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Types
export interface R2Config {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
    endpoint: string;
}

export interface R2UploadResponse {
    success: boolean;
    url?: string;
    key?: string;
    error?: string;
}

export interface R2FileMetadata {
    filename: string;
    size: number;
    mimeType: string;
    language?: string;
    reportId?: string;
    uploadedAt?: string;
}

export interface DownloadEvent {
    reportId: string;
    fileLanguage: string;
    userId?: string;
    sessionId: string;
    timestamp: string;
    userAgent?: string;
    referer?: string;
    ipAddress?: string;
}

class CloudflareR2Service {
    private avatarConfig: R2Config;
    private reportConfig: R2Config;
    private avatarS3Client: S3Client;
    private reportS3Client: S3Client;

    constructor() {
        // Avatar bucket configuration
        this.avatarConfig = {
            accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
        };

        // Report bucket configuration
        this.reportConfig = {
            accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_REPORT_BUCKET!,
            publicUrl: process.env.CLOUDFLARE_R2_REPORT_PUBLIC_URL!,
            endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
        };

        // Validate required environment variables
        this.validateConfig();

        // Initialize S3 clients for both buckets
        this.avatarS3Client = new S3Client({
            region: "auto",
            endpoint: this.avatarConfig.endpoint,
            credentials: {
                accessKeyId: this.avatarConfig.accessKeyId,
                secretAccessKey: this.avatarConfig.secretAccessKey,
            },
            forcePathStyle: true,
        });

        this.reportS3Client = new S3Client({
            region: "auto",
            endpoint: this.reportConfig.endpoint,
            credentials: {
                accessKeyId: this.reportConfig.accessKeyId,
                secretAccessKey: this.reportConfig.secretAccessKey,
            },
            forcePathStyle: true,
        });

        console.log('R2 Service initialized for both avatar and report buckets');
    }

    private validateConfig() {
        const requiredVars = {
            'CLOUDFLARE_R2_ACCOUNT_ID': this.avatarConfig.accountId,
            'CLOUDFLARE_R2_ACCESS_KEY_ID': this.avatarConfig.accessKeyId,
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY': this.avatarConfig.secretAccessKey,
            'CLOUDFLARE_R2_BUCKET_NAME': this.avatarConfig.bucketName,
            'CLOUDFLARE_R2_PUBLIC_URL': this.avatarConfig.publicUrl,
            'CLOUDFLARE_R2_REPORT_BUCKET': this.reportConfig.bucketName,
            'CLOUDFLARE_R2_REPORT_PUBLIC_URL': this.reportConfig.publicUrl,
        };

        const missingVars = Object.entries(requiredVars)
            .filter(([_, value]) => !value)
            .map(([key, _]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }
    }

    /**
     * Upload avatar image
     */
    async uploadAvatar(
        buffer: Buffer,
        userId: string,
        filename: string,
        contentType: string
    ): Promise<R2UploadResponse> {
        try {
            const key = `avatars/${userId}/${Date.now()}-${filename}`;

            const command = new PutObjectCommand({
                Bucket: this.avatarConfig.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000",
            });

            await this.avatarS3Client.send(command);
            const url = `${this.avatarConfig.publicUrl}/${key}`;

            return {
                success: true,
                url,
                key,
            };
        } catch (error) {
            console.error('Avatar upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }

    /**
     * Upload report file
     */
    async uploadReport(
        buffer: Buffer,
        reportId: string,
        language: string,
        filename: string,
        contentType: string
    ): Promise<R2UploadResponse> {
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
            const key = `reports/${reportId}/${language}/${timestamp}_${sanitizedFilename}`;

            const command = new PutObjectCommand({
                Bucket: this.reportConfig.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000",
                Metadata: {
                    reportId,
                    language,
                    originalFilename: filename,
                    uploadedAt: new Date().toISOString(),
                },
            });

            await this.reportS3Client.send(command);
            const url = `${this.reportConfig.publicUrl}/${key}`;

            return {
                success: true,
                url,
                key,
            };
        } catch (error) {
            console.error('Report upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }

    /**
     * Delete avatar
     */
    async deleteAvatar(key: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.avatarConfig.bucketName,
                Key: key,
            });

            await this.avatarS3Client.send(command);
            return true;
        } catch (error) {
            console.error('Avatar delete error:', error);
            return false;
        }
    }

    /**
     * Delete report
     */
    async deleteReport(key: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.reportConfig.bucketName,
                Key: key,
            });

            await this.reportS3Client.send(command);
            return true;
        } catch (error) {
            console.error('Report delete error:', error);
            return false;
        }
    }

    /**
     * Get signed URL for private access
     */
    async getSignedUrl(key: string, expiresIn: number = 3600, isReport: boolean = false): Promise<string> {
        const client = isReport ? this.reportS3Client : this.avatarS3Client;
        const bucket = isReport ? this.reportConfig.bucketName : this.avatarConfig.bucketName;

        const command = new GetObjectCommand({
            Bucket: bucket,
            Key: key,
        });

        return await getSignedUrl(client as any, command, { expiresIn });
    }

    /**
     * Extract key from URL
     */
    extractKeyFromUrl(url: string, isReport: boolean = false): string | null {
        const publicUrl = isReport ? this.reportConfig.publicUrl : this.avatarConfig.publicUrl;
        if (!url.includes(publicUrl)) return null;
        return url.replace(`${publicUrl}/`, '');
    }
}

// Singleton instance
export const r2Service = new CloudflareR2Service();

// Helper functions
export const uploadAvatarFile = async (
    file: File,
    userId: string
): Promise<R2UploadResponse> => {
    const buffer = Buffer.from(await file.arrayBuffer());
    return r2Service.uploadAvatar(buffer, userId, file.name, file.type);
};

export const uploadReportFile = async (
    file: File,
    reportId: string,
    language: string
): Promise<R2UploadResponse> => {
    const buffer = Buffer.from(await file.arrayBuffer());
    return r2Service.uploadReport(buffer, reportId, language, file.name, file.type);
};

export const deleteAvatarByUrl = async (url: string): Promise<boolean> => {
    const key = r2Service.extractKeyFromUrl(url, false);
    return key ? r2Service.deleteAvatar(key) : false;
};

export const deleteReportByUrl = async (url: string): Promise<boolean> => {
    const key = r2Service.extractKeyFromUrl(url, true);
    return key ? r2Service.deleteReport(key) : false;
};
