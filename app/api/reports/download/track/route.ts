import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { client } from '@/sanity/lib/client';

interface DownloadEvent {
    reportId: string;
    fileLanguage: string;
    userId?: string;
    sessionId: string;
    timestamp: string;
}

export async function POST(request: NextRequest) {
    try {
        // const { userId } = await auth();
        const body: DownloadEvent = await request.json();

        // Validate required fields
        if (!body.reportId || !body.fileLanguage) {
            return NextResponse.json(
                { error: 'Missing required fields: reportId, fileLanguage' },
                { status: 400 }
            );
        }

        // Update report analytics in Sanity
        await updateReportAnalytics(body.reportId, body.fileLanguage);

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Download tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to track download' },
            { status: 500 }
        );
    }
}

async function updateReportAnalytics(reportId: string, fileLanguage: string) {
    try {
        // Get the current report
        const report = await client.fetch(
            `*[_type == "report" && _id == $reportId][0]{
                _id,
                files,
                totalDownloadCount
            }`,
            { reportId }
        );

        if (!report) {
            console.error('Report not found:', reportId);
            return;
        }

        // Update the specific file's download count
        const updatedFiles = report.files?.map((file: any) => {
            if (file.language === fileLanguage) {
                return {
                    ...file,
                    downloadCount: (file.downloadCount || 0) + 1,
                    lastDownloaded: new Date().toISOString(),
                };
            }
            return file;
        }) || [];

        // Calculate total download count across all files
        const newTotalCount = updatedFiles.reduce(
            (total: number, file: any) => total + (file.downloadCount || 0),
            0
        );

        // Update the report with new analytics
        await client
            .patch(reportId)
            .set({
                files: updatedFiles,
                totalDownloadCount: newTotalCount,
            })
            .commit();

        console.log(`Updated download count for report ${reportId}, language ${fileLanguage}`);

    } catch (error) {
        console.error('Failed to update report analytics:', error);
    }
}
