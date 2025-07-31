import { NextRequest, NextResponse } from "next/server";
import { r2Service } from "@/lib/cloudflare-r2";

export async function GET() {
    try {
        // Test environment variables
        const envCheck = {
            accountId: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
            accessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            secretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            bucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
            publicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
        };

        const missingEnvVars = Object.entries(envCheck)
            .filter(([_, exists]) => !exists)
            .map(([key, _]) => key);

        if (missingEnvVars.length > 0) {
            return NextResponse.json({
                success: false,
                error: "Missing environment variables",
                missing: missingEnvVars
            }, { status: 500 });
        }

        // Test basic R2 connection by uploading a test file
        const testData = `Test file created at ${new Date().toISOString()}`;
        const testBuffer = Buffer.from(testData, 'utf8');
        const testKey = `test/connection-test-${Date.now()}.txt`;

        try {
            const uploadUrl = await r2Service.uploadBuffer(testBuffer, testKey, 'text/plain');

            // Try to delete the test file immediately
            const deleteSuccess = await r2Service.deleteFile(testKey);

            return NextResponse.json({
                success: true,
                message: "R2 connection successful",
                uploadUrl,
                deleteSuccess,
                config: {
                    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID?.substring(0, 8) + "...",
                    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
                }
            });

        } catch (r2Error) {
            console.error('R2 operation failed:', r2Error);

            return NextResponse.json({
                success: false,
                error: "R2 operation failed",
                details: r2Error instanceof Error ? r2Error.message : 'Unknown error',
                config: {
                    accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID?.substring(0, 8) + "...",
                    bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
                    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                }
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Test endpoint error:', error);

        return NextResponse.json({
            success: false,
            error: "Test endpoint failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('testFile') as File;

        if (!file) {
            return NextResponse.json({
                success: false,
                error: "No test file provided"
            }, { status: 400 });
        }

        // Test file upload
        const buffer = Buffer.from(await file.arrayBuffer());
        const testKey = `test/upload-test-${Date.now()}-${file.name}`;

        const uploadUrl = await r2Service.uploadBuffer(buffer, testKey, file.type);

        // Generate a signed URL to verify file was uploaded
        const signedUrl = await r2Service.getSignedUrl(testKey, 300); // 5 minutes

        // Clean up test file
        setTimeout(() => {
            r2Service.deleteFile(testKey).catch(console.error);
        }, 10000); // Delete after 10 seconds

        return NextResponse.json({
            success: true,
            message: "File upload test successful",
            uploadUrl,
            signedUrl,
            fileInfo: {
                name: file.name,
                size: file.size,
                type: file.type,
                key: testKey
            }
        });

    } catch (error) {
        console.error('File upload test error:', error);

        return NextResponse.json({
            success: false,
            error: "File upload test failed",
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
