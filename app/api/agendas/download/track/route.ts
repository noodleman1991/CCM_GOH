import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { trackAgendaDownload } from '@/lib/content/outputs';

interface DownloadEvent {
    agendaId: string;
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
        if (!body.agendaId || !body.fileLanguage) {
            return NextResponse.json(
                { error: 'Missing required fields: agendaId, fileLanguage' },
                { status: 400 }
            );
        }

        // Update agenda analytics in Sanity. A failed analytics update never
        // fails the tracking request — matches the original's own local
        // try/catch (see lib/content/outputs.ts's trackAgendaDownload for why
        // this write can genuinely fail).
        try {
            await trackAgendaDownload(body.agendaId, body.fileLanguage);
        } catch (error) {
            console.error('Failed to update agenda analytics:', error);
        }

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
