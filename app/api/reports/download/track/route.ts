import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackReportDownload } from '@/lib/content/outputs';
import { rateLimitRequest } from '@/lib/rate-limit-route';

/**
 * LEGACY — deleted by Slice 3a together with `lib/report-utils.ts`,
 * `grid-report*` and `trackReportDownload`. The `report` type has 0 documents
 * and no Payload collection, so on the Payload arm the tracker throws and the
 * catch below swallows it. Kept callable for `grid-report-download.tsx` until
 * that slice lands, but bounded the same way as the agenda route: rate-limited
 * per actor and schema-checked, so an unauthenticated caller cannot drive an
 * unbounded number of CMS reads through it.
 */

const downloadEventSchema = z.object({
    reportId: z.string().trim().min(1).max(200),
    fileLanguage: z.enum(['en', 'es', 'fr', 'ar']),
    userId: z.string().max(200).optional(),
    sessionId: z.string().max(200).optional(),
    timestamp: z.string().max(64).optional(),
});

const RATE_LIMIT = { limit: 30, windowSeconds: 600 } as const;

export async function POST(request: NextRequest) {
    const limited = await rateLimitRequest(request, 'report:download:track', RATE_LIMIT);
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
    const { reportId, fileLanguage } = parsed.data;

    // A failed analytics update never fails the tracking request — matches the
    // original's own local try/catch (see lib/content/outputs.ts's
    // trackReportDownload for why this write can genuinely fail).
    try {
        await trackReportDownload(reportId, fileLanguage);
        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Failed to update report analytics:', error);
        return NextResponse.json({ success: false, timestamp: new Date().toISOString() });
    }
}
