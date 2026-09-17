import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import {
    CaseStudyDraftNotFoundError,
    deleteCaseStudyDraft,
    getLatestCaseStudyDraft,
    saveCaseStudyDraft,
} from "@/lib/content/case-studies"
import { rateLimitRequest } from "@/lib/rate-limit-route"
import { caseStudyDraftSchema, stripServerOwnedDraftKeys } from "@/lib/validation/case-study"

/**
 * Autosave bodies are the whole form: a long Portable Text body with a few
 * images referenced (not embedded) sits well under 100 KB. 200 KB leaves room
 * for that to double; beyond it nothing legitimate is being saved and the
 * only effect of accepting it is a CMS document of that size per keystroke.
 */
const MAX_DRAFT_BODY_BYTES = 200 * 1024

const draftIdSchema = z.string().min(1).max(200)

const saveBodySchema = z.object({
    draftId: draftIdSchema.optional(),
    draftData: caseStudyDraftSchema,
})

/**
 * Returns the authenticated user's most recently saved case-study draft (if any).
 * Read happens server-side with the tokened client — the dataset is public, so
 * a browser-side `userId` filter would not be a security boundary.
 */
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const draft = await getLatestCaseStudyDraft(userId)

        return NextResponse.json({ draft: draft ?? null })
    } catch (error) {
        console.error("Failed to load draft:", error)
        return NextResponse.json({ error: "Failed to load draft" }, { status: 500 })
    }
}

/**
 * Audit M6: this handler used to spread `request.json()` straight into the CMS
 * write — any size, any shape, any key (`_id`, `userId`, `status` included)
 * and no limit. Now: a per-user limit (the form debounces at 1.5 s, so 60 per
 * 10 minutes is above what a fast typist produces), a byte cap checked before
 * parsing, the draft schema, and the server-owned keys stripped.
 */
export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const limited = await rateLimitRequest(request, "case-study:draft-save", { limit: 60, windowSeconds: 600 })
        if (limited) return limited

        const raw = await request.text()
        if (Buffer.byteLength(raw, "utf8") > MAX_DRAFT_BODY_BYTES) {
            return NextResponse.json({ error: "Draft too large" }, { status: 413 })
        }

        let json: unknown
        try {
            json = JSON.parse(raw)
        } catch {
            return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
        }

        const parsed = saveBodySchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid draft", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const draftData = stripServerOwnedDraftKeys(parsed.data.draftData)
        const result = await saveCaseStudyDraft(userId, parsed.data.draftId, draftData)

        return NextResponse.json({ id: result.id })
    } catch (error) {
        if (error instanceof CaseStudyDraftNotFoundError) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 })
        }
        console.error("Failed to save draft:", error)
        return NextResponse.json(
            { error: "Failed to save draft" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json().catch(() => null)
        const draftId = draftIdSchema.safeParse((body as { draftId?: unknown } | null)?.draftId)
        if (!draftId.success) {
            return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
        }

        await deleteCaseStudyDraft(userId, draftId.data)
        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof CaseStudyDraftNotFoundError) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 })
        }
        console.error("Failed to delete draft:", error)
        return NextResponse.json(
            { error: "Failed to delete draft" },
            { status: 500 }
        )
    }
}
