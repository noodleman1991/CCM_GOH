import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";

// Initialize R2 client for reports bucket
const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
});

const REPORTS_BUCKET = process.env.CLOUDFLARE_R2_REPORT_BUCKET!;
const REPORTS_PUBLIC_URL = process.env.CLOUDFLARE_R2_REPORT_PUBLIC_URL!;
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '50000000'); // 50MB
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,ppt,pptx').split(',');

async function uploadToR2(
    buffer: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
): Promise<string> {
    await r2Client.send(
        new PutObjectCommand({
            Bucket: REPORTS_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: "public, max-age=31536000", // 1 year cache
            Metadata: metadata,
        })
    );

    return `${REPORTS_PUBLIC_URL}/${key}`;
}

async function deleteFromR2(key: string) {
    try {
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: REPORTS_BUCKET,
                Key: key,
            })
        );
    } catch (error) {
        console.error("Failed to delete from R2:", error);
    }
}

function isValidFileType(filename: string, mimeType: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? ALLOWED_FILE_TYPES.includes(extension) : false;
}

function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .toLowerCase();
}

function generateFileKey(reportId: string, language: string, filename: string): string {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const sanitized = sanitizeFilename(filename);
    return `reports/${reportId}/${language}/${timestamp}_${uuidv4().slice(0, 8)}_${sanitized}`;
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const reportId = formData.get('reportId') as string;
        const language = formData.get('language') as string;

        // Validation
        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        if (!reportId || !language) {
            return NextResponse.json(
                { error: "Report ID and language are required" },
                { status: 400 }
            );
        }

        if (!['en', 'es', 'fr', 'ar'].includes(language)) {
            return NextResponse.json(
                { error: "Invalid language. Must be: en, es, fr, ar" },
                { status: 400 }
            );
        }

        if (!isValidFileType(file.name, file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` },
                { status: 400 }
            );
        }

        // Generate file key and convert to buffer
        const fileKey = generateFileKey(reportId, language, file.name);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to R2
        const fileUrl = await uploadToR2(
            buffer,
            fileKey,
            file.type,
            {
                reportId,
                language,
                originalFilename: file.name,
                uploadedBy: userId,
                uploadedAt: new Date().toISOString(),
            }
        );

        // Calculate file size in MB
        const fileSizeMB = file.size / (1024 * 1024);

        // Update or create report metadata
        // await prisma.reportMetadata.upsert({ //todo: uncomment after prisma type gen
        //     where: { sanityId: reportId },
        //     create: {
        //         sanityId: reportId,
        //         downloadCount: 0,
        //     },
        //     update: {
        //         updatedAt: new Date(),
        //     }
        // });

        return NextResponse.json({
            success: true,
            fileUrl,
            fileKey,
            fileSize: fileSizeMB,
            originalFilename: file.name,
            mimeType: file.type,
            language,
            reportId,
        });

    } catch (error) {
        console.error("Report upload error:", error);
        return NextResponse.json(
            { error: "Failed to upload report file" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const fileKey = searchParams.get('fileKey');

        if (!fileKey) {
            return NextResponse.json(
                { error: "File key is required" },
                { status: 400 }
            );
        }

        // Delete from R2
        await deleteFromR2(fileKey);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Report delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete report file" },
            { status: 500 }
        );
    }
}
