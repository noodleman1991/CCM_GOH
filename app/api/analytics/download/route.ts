import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const downloadEventSchema = z.object({
    reportId: z.string().min(1),
    fileLanguage: z.string().min(1),
    sessionId: z.string().optional(),
});

// Privacy: we deliberately do NOT collect IP address, user-agent, or referer for
// download analytics. Aggregate counts (per report / language / day) need none of
// that PII, and storing it indefinitely was a GDPR liability with no consumer.

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        const body = await request.json();
        const validated = downloadEventSchema.parse(body);

        await prisma.downloadEvent.create({
            data: {
                reportId: validated.reportId,
                fileLanguage: validated.fileLanguage,
                userId: userId || null,
                sessionId: validated.sessionId || 'anonymous',
                timestamp: new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
            );
        }
        console.error('Download tracking error:', error);
        return NextResponse.json(
            { error: 'Failed to track download' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const reportId = searchParams.get('reportId');
        const timeframe = searchParams.get('timeframe') || '30d';
        const groupBy = searchParams.get('groupBy') || 'day';

        // Calculate date range
        const now = new Date();
        const startDate = new Date();

        switch (timeframe) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        // Build where clause - reportId field now contains agenda IDs
        const whereClause = {
            timestamp: {
                gte: startDate,
                lte: now,
            },
            ...(reportId && { reportId: reportId }),
        };

        // Get download statistics
        const [totalDownloads, uniqueUsers, downloadsByLanguage, downloadsByDay] = await Promise.all([
            // Total downloads
            prisma.downloadEvent.count({
                where: whereClause,
            }),

            // Unique users
            prisma.downloadEvent.groupBy({
                by: ['userId'],
                where: whereClause,
                _count: true,
            }),

            // Downloads by language
            prisma.downloadEvent.groupBy({
                by: ['fileLanguage'],
                where: whereClause,
                _count: {
                    id: true,
                },
                orderBy: {
                    _count: {
                        id: 'desc',
                    },
                },
            }),

            // Downloads by day
            prisma.downloadEvent.findMany({
                where: whereClause,
                select: {
                    timestamp: true,
                    reportId: true, // reportId now contains agenda IDs
                },
                orderBy: {
                    timestamp: 'asc',
                },
            }),
        ]);

        // Process downloads by day
        const downloadsByDayMap = new Map<string, number>();
        downloadsByDay.forEach(event => {
            const dateKey = event.timestamp.toISOString().split('T')[0];
            downloadsByDayMap.set(dateKey, (downloadsByDayMap.get(dateKey) || 0) + 1);
        });

        const downloadsByDayArray = Array.from(downloadsByDayMap.entries()).map(([date, count]) => ({
            date,
            downloads: count,
        }));

        return NextResponse.json({
            success: true,
            analytics: {
                totalDownloads,
                uniqueUsers: uniqueUsers.length,
                downloadsByLanguage: downloadsByLanguage.map(item => ({
                    language: item.fileLanguage,
                    count: item._count.id,
                })),
                downloadsByDay: downloadsByDayArray,
                timeframe,
                reportId,
            },
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to get analytics' },
            { status: 500 }
        );
    }
}
