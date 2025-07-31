import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { r2Service, uploadReportFile, deleteReportByUrl } from "@/lib/cloudflare-r2";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '50000000'); // 50MB
const ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,ppt,pptx').split(',');

interface UploadResponse {
    success: boolean;
    fileUrl?: string;
    fileKey?: string;
    fileSize?: number;
    originalFilename?: string;
    mimeType?: string;
    language?: string;
    reportId?: string;
    error?: string;
}

function isValidFileType(filename: string, mimeType: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? ALLOWED_FILE_TYPES.includes(extension) : false;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
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
                { success: false, error: "No file provided" },
                { status: 400 }
            );
        }

        if (!reportId || !language) {
            return NextResponse.json(
                { success: false, error: "Report ID and language are required" },
                { status: 400 }
            );
        }

        if (!['en', 'es', 'fr', 'ar'].includes(language)) {
            return NextResponse.json(
                { success: false, error: "Invalid language. Must be: en, es, fr, ar" },
                { status: 400 }
            );
        }

        if (!isValidFileType(file.name, file.type)) {
            return NextResponse.json(
                { success: false, error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { success: false, error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB` },
                { status: 400 }
            );
        }

        // Upload to R2
        const uploadResult = await uploadReportFile(file, reportId, language);

        if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Upload failed');
        }

        // Calculate file size in MB
        const fileSizeMB = file.size / (1024 * 1024);

        // Update or create report metadata
        await prisma.reportMetadata.upsert({
            where: { sanityId: reportId },
            create: {
                sanityId: reportId,
                downloadCount: 0,
            },
            update: {
                updatedAt: new Date(),
            }
        });

        return NextResponse.json({
            success: true,
            fileUrl: uploadResult.url!,
            fileKey: uploadResult.key!,
            fileSize: fileSizeMB,
            originalFilename: file.name,
            mimeType: file.type,
            language,
            reportId,
        });

    } catch (error) {
        console.error("Report upload error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to upload report file" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('fileUrl');

        if (!fileUrl) {
            return NextResponse.json(
                { error: "File URL is required" },
                { status: 400 }
            );
        }

        // Delete from R2
        const success = await deleteReportByUrl(fileUrl);

        if (!success) {
            return NextResponse.json(
                { error: "Failed to delete file" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Report delete error:", error);
        return NextResponse.json(
            { error: "Failed to delete report file" },
            { status: 500 }
        );
    }
}
