import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@clerk/nextjs/server';
import { client } from '@/sanity/lib/client';

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

        // Update agenda analytics in Sanity
        await updateAgendaAnalytics(body.agendaId, body.fileLanguage);

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

/** Shape of the agenda file entries we read/update; other fields pass through untouched. */
interface TrackedAgendaFile {
    language?: string;
    downloadCount?: number;
    lastDownloaded?: string;
    [key: string]: unknown;
}

async function updateAgendaAnalytics(agendaId: string, fileLanguage: string) {
    try {
        // Get the current agenda
        const agenda = await client.fetch(
            `*[_type == "agenda" && _id == $agendaId][0]{
                _id,
                files,
                totalDownloadCount
            }`,
            { agendaId }
        );

        if (!agenda) {
            console.error('Agenda not found:', agendaId);
            return;
        }

        // Update the specific file's download count
        const updatedFiles = agenda.files?.map((file: TrackedAgendaFile) => {
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
            (total: number, file: TrackedAgendaFile) => total + (file.downloadCount || 0),
            0
        );

        // Update the agenda with new analytics
        await client
            .patch(agendaId)
            .set({
                files: updatedFiles,
                totalDownloadCount: newTotalCount,
            })
            .commit();

        console.log(`Updated download count for agenda ${agendaId}, language ${fileLanguage}`);

    } catch (error) {
        console.error('Failed to update agenda analytics:', error);
    }
}