import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackAgendaDownload } from '@/lib/content/outputs';
import { rateLimitRequest } from '@/lib/rate-limit-route';

/**
 * Counts one agenda download. Anonymous on purpose — the PDFs are public and
 * the button never waits on this — but bounded: rate-limited per actor
 * (signed-in user id, else a hashed IP), schema-checked, and the language is
 * verified against the document's real file list before anything is written.
 *
 * Called by `lib/agenda-utils.ts`'s `trackDownload`, via
 * `hooks/use-download-tracking.ts` and `grid-agenda-download.tsx`.
 */

// The four publication languages — `payload/collections/agendas.ts`'s
// `files.language` options and `types/agenda.ts`'s `SupportedLanguage`.
const downloadEventSchema = z.object({
    agendaId: z.string().trim().min(1).max(200),
    fileLanguage: z.enum(['en', 'es', 'fr', 'ar']),
    // Sent by the client, kept only so an unknown key is not a schema error.
    // Actor identity for the rate limit comes from Clerk, never from the body.
    userId: z.string().max(200).optional(),
    sessionId: z.string().max(200).optional(),
    timestamp: z.string().max(64).optional(),
});

// 30 per 10 minutes per actor: a reader clicking every language of every
// agenda on a section page stays well inside it; a loop does not.
const RATE_LIMIT = { limit: 30, windowSeconds: 600 } as const;

export async function POST(request: NextRequest) {
    // Before parsing, so malformed bodies count against the caller too.
    const limited = await rateLimitRequest(request, 'agenda:download:track', RATE_LIMIT);
    if (limited) return limited;

    let raw: unknown;
    try {
        raw = await request.json();
    } catch {
        return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
    }

    const parsed = downloadEventSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid download event', details: parsed.error.flatten().fieldErrors },
            { status: 400 }
        );
    }
    const { agendaId, fileLanguage } = parsed.data;

    // A failed counter WRITE never fails the request: the download itself was
    // never gated on it (see lib/content/outputs.ts's trackAgendaDownload for
    // why this write can genuinely fail). A missing document or language is
    // not a failure of the write, though — those are the caller's mistake and
    // are reported as such, before anything is written.
    try {
        const result = await trackAgendaDownload(agendaId, fileLanguage);
        if (result === 'agenda-not-found') {
            return NextResponse.json({ error: 'Agenda not found' }, { status: 404 });
        }
        if (result === 'language-not-found') {
            return NextResponse.json(
                { error: `This agenda has no ${fileLanguage} file` },
                { status: 400 }
            );
        }
        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Failed to update agenda analytics:', error);
        return NextResponse.json({ success: false, timestamp: new Date().toISOString() });
    }
}
