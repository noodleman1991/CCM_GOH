import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

class CloudflareR2Service {
    private avatarConfig: R2Config;
    private reportConfig: R2Config;
    private avatarS3Client: S3Client;
    private reportS3Client: S3Client;

    constructor() {
        // IMPORTANT: Endpoint should be https://ACCOUNT_ID.r2.cloudflarestorage.com
        const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;

        // Avatar bucket configuration
        this.avatarConfig = {
            accountId: accountId,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL!, // Should be your custom domain or r2.dev URL
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`, // Fixed endpoint format
        };

        // Report bucket configuration
        this.reportConfig = {
            accountId: accountId,
            accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
            bucketName: process.env.CLOUDFLARE_R2_REPORT_BUCKET || process.env.CLOUDFLARE_R2_BUCKET_NAME!,
            publicUrl: process.env.CLOUDFLARE_R2_REPORT_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL!,
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`, // Fixed endpoint format
        };

        // Validate configuration
        this.validateConfig();

        // Initialize S3 clients with correct R2 configuration
        // Confidence: 90% - This is the correct S3 client config for R2
        this.avatarS3Client = new S3Client({
            region: "auto", // R2 uses 'auto' region
            endpoint: this.avatarConfig.endpoint,
            credentials: {
                accessKeyId: this.avatarConfig.accessKeyId,
                secretAccessKey: this.avatarConfig.secretAccessKey,
            },
            forcePathStyle: true, // Important for R2
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

        console.log('R2 Service initialized successfully');
    }

    private validateConfig() {
        const requiredVars = {
            'CLOUDFLARE_R2_ACCOUNT_ID': this.avatarConfig.accountId,
            'CLOUDFLARE_R2_ACCESS_KEY_ID': this.avatarConfig.accessKeyId,
            'CLOUDFLARE_R2_SECRET_ACCESS_KEY': this.avatarConfig.secretAccessKey,
            'CLOUDFLARE_R2_BUCKET_NAME': this.avatarConfig.bucketName,
            'CLOUDFLARE_R2_PUBLIC_URL': this.avatarConfig.publicUrl,
        };

        const missingVars = Object.entries(requiredVars)
            .filter(([_, value]) => !value)
            .map(([key, _]) => key);

        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Validate account ID format
        if (!/^[a-f0-9]{32}$/.test(this.avatarConfig.accountId)) {
            console.warn('CLOUDFLARE_R2_ACCOUNT_ID might be invalid. It should be a 32-character hex string.');
        }
    }

    /**
     * Upload avatar image
     * Confidence: 90% - Proper error handling and metadata
     */
    async uploadAvatar(
        buffer: Buffer,
        userId: string,
        filename: string,
        contentType: string
    ): Promise<R2UploadResponse> {
        try {
            // Generate unique key with proper path structure
            const key = `avatars/${userId}/${filename}`;

            console.log(`Uploading avatar to R2: ${key}`);

            const command = new PutObjectCommand({
                Bucket: this.avatarConfig.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
                CacheControl: "public, max-age=31536000", // 1 year cache
                Metadata: {
                    userId: userId,
                    uploadedAt: new Date().toISOString(),
                }
            });

            await this.avatarS3Client.send(command);

            // Build public URL
            const url = `${this.avatarConfig.publicUrl}/${key}`;

            console.log(`Avatar uploaded successfully: ${url}`);

            return {
                success: true,
                url,
                key,
            };
        } catch (error) {
            console.error('R2 avatar upload error:', error);

            // Enhanced error messages
            let errorMessage = 'Upload failed';
            if (error instanceof Error) {
                if (error.message.includes('NoSuchBucket')) {
                    errorMessage = 'Bucket does not exist. Check CLOUDFLARE_R2_BUCKET_NAME';
                } else if (error.message.includes('InvalidAccessKeyId')) {
                    errorMessage = 'Invalid R2 access key. Check CLOUDFLARE_R2_ACCESS_KEY_ID';
                } else if (error.message.includes('SignatureDoesNotMatch')) {
                    errorMessage = 'Invalid R2 secret key. Check CLOUDFLARE_R2_SECRET_ACCESS_KEY';
                } else {
                    errorMessage = error.message;
                }
            }

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Delete avatar by key
     * Confidence: 95% - Simple and effective
     */
    async deleteAvatar(key: string): Promise<boolean> {
        try {
            console.log(`Deleting avatar from R2: ${key}`);

            const command = new DeleteObjectCommand({
                Bucket: this.avatarConfig.bucketName,
                Key: key,
            });

            await this.avatarS3Client.send(command);
            console.log(`Avatar deleted successfully: ${key}`);
            return true;
        } catch (error) {
            console.error('R2 avatar delete error:', error);
            return false;
        }
    }

    /**
     * Extract key from public URL
     * Confidence: 90% - Handles various URL formats
     */
    extractKeyFromUrl(url: string, isReport: boolean = false): string | null {
        const publicUrl = isReport ? this.reportConfig.publicUrl : this.avatarConfig.publicUrl;

        if (!url.includes(publicUrl)) {
            console.warn(`URL does not match expected public URL: ${url}`);
            return null;
        }

        // Remove public URL prefix to get the key
        const key = url.replace(`${publicUrl}/`, '');
        return key || null;
    }

    // Similar methods for reports...
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

            console.log(`Uploading report to R2: ${key}`);

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

            console.log(`Report uploaded successfully: ${url}`);

            return {
                success: true,
                url,
                key,
            };
        } catch (error) {
            console.error('R2 report upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed',
            };
        }
    }
}

// Singleton instance
export const r2Service = new CloudflareR2Service();

// Helper functions remain the same...
export const uploadAvatarFile = async (
    file: File,
    userId: string
): Promise<R2UploadResponse> => {
    const buffer = Buffer.from(await file.arrayBuffer());
    return r2Service.uploadAvatar(buffer, userId, file.name, file.type);
};

export const deleteAvatarByUrl = async (url: string): Promise<boolean> => {
    const key = r2Service.extractKeyFromUrl(url, false);
    return key ? r2Service.deleteAvatar(key) : false;
};


