import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { client } from '@/sanity/lib/client';

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
        const agendaId = searchParams.get('agendaId');
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

        // Build where clause
        const whereClause: any = {
            timestamp: {
                gte: startDate,
                lte: now,
            },
        };

        if (agendaId) {
            whereClause.agendaId = agendaId;
        }

        // Get download statistics
        const [totalDownloads, uniqueUsers, downloadsByLanguage, downloadsByDay] = await Promise.all([
            // Total downloads
            prisma.agendaDownloadEvent.count({
                where: whereClause,
            }),

            // Unique users
            prisma.agendaDownloadEvent.groupBy({
                by: ['userId'],
                where: whereClause,
                _count: true,
            }),

            // Downloads by language
            prisma.agendaDownloadEvent.groupBy({
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

            // Downloads by day (simplified - you might want to use raw SQL for better date grouping)
            prisma.agendaDownloadEvent.findMany({
                where: whereClause,
                select: {
                    timestamp: true,
                    agendaId: true,
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
                agendaId,
            },
        });

    } catch (error) {
        console.error('Agenda analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to get agenda analytics' },
            { status: 500 }
        );
    }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    if (realIP) {
        return realIP.trim();
    }

    return 'unknown';
}

// Prisma schema additions needed:
/*
Add to your schema.prisma:

model AgendaDownloadEvent {
  id           String   @id @default(cuid())
  agendaId     String
  fileLanguage String
  userId       String?
  sessionId    String
  userAgent    String?
  referer      String?
  ipAddress    String?
  timestamp    DateTime
  createdAt    DateTime @default(now())

  @@map("agenda_download_events")
}

model Agenda {
  id                String    @id @default(cuid())
  sanityId          String    @unique
  downloadCount     Int       @default(0)
  lastDownloadedAt  DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@map("agendas")
}
*/