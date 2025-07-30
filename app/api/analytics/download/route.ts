import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { DownloadEvent } from '@/types/report';

export async function POST(request: NextRequest) {
    try {
        const downloadEvent: DownloadEvent = await request.json();

        // Validate required fields
        if (!downloadEvent.reportId || !downloadEvent.fileLanguage) {
            return NextResponse.json(
                { error: 'Missing required fields: reportId and fileLanguage' },
                { status: 400 }
            );
        }

        // Update download count in Sanity
        await client
            .patch(downloadEvent.reportId)
            .inc({ downloadCount: 1 })
            .commit();

        // Store detailed analytics (you might want to use a dedicated analytics service)
        // For now, we'll just log it - in production, consider using services like:
        // - Google Analytics 4
        // - Mixpanel
        // - PostHog
        // - Your own database

        console.log('Download tracked:', {
            reportId: downloadEvent.reportId,
            language: downloadEvent.fileLanguage,
            timestamp: downloadEvent.timestamp,
            userId: downloadEvent.userId || 'anonymous',
            userAgent: downloadEvent.userAgent?.substring(0, 100), // Truncate for privacy
        });

        // Optional: Store in a separate analytics database
        // await analyticsDb.insert('downloads', downloadEvent);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Download tracking error:', error);

        return NextResponse.json(
            { error: 'Failed to track download' },
            { status: 500 }
        );
    }
}

// Optional: GET endpoint for analytics dashboard
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get('reportId');
        const timeframe = searchParams.get('timeframe') || '30d';

        if (!reportId) {
            return NextResponse.json(
                { error: 'reportId parameter is required' },
                { status: 400 }
            );
        }

        // Get download statistics from Sanity
        const report = await client.fetch(
            `*[_type == "report" && _id == $reportId][0]{
        _id,
        title,
        downloadCount,
        files[].language
      }`,
            { reportId }
        );

        if (!report) {
            return NextResponse.json(
                { error: 'Report not found' },
                { status: 404 }
            );
        }

        // In a real implementation, you'd query your analytics database here
        // For now, return basic info from Sanity
        const analytics = {
            reportId: report._id,
            title: report.title,
            totalDownloads: report.downloadCount || 0,
            availableLanguages: report.files?.map((f: any) => f.language) || [],
            timeframe,
            // todo: In production, add more detailed analytics:
            // downloadsByLanguage: {...},
            // downloadsByCountry: {...},
            // downloadsByDate: {...},
        };

        return NextResponse.json(analytics);

    } catch (error) {
        console.error('Analytics fetch error:', error);

        return NextResponse.json(
            { error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
