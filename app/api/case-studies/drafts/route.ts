import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import {
    CaseStudyDraftNotFoundError,
    deleteCaseStudyDraft,
    getCaseStudyDraftById,
    getLatestCaseStudyDraft,
    saveCaseStudyDraft,
} from "@/lib/content/case-studies"

/**
 * Returns one of the authenticated user's case-study drafts: the one named by
 * `?id=` (the dashboard's Continue button), else the most recently saved (the
 * form's resume-on-mount). Both lookups are scoped to the caller server-side —
 * the dataset is public, so a browser-side `userId` filter would not be a
 * security boundary — and an id the caller does not own is a 404.
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const id = request.nextUrl.searchParams.get("id")
        if (id) {
            const draft = await getCaseStudyDraftById(userId, id)
            if (!draft) {
                return NextResponse.json({ error: "Draft not found" }, { status: 404 })
            }
            return NextResponse.json({ draft })
        }

        const draft = await getLatestCaseStudyDraft(userId)

        return NextResponse.json({ draft: draft ?? null })
    } catch (error) {
        console.error("Failed to load draft:", error)
        return NextResponse.json({ error: "Failed to load draft" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { draftId, draftData } = await request.json()

        const result = await saveCaseStudyDraft(userId, draftId, draftData)

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

        const { draftId } = await request.json()
        if (!draftId) {
            return NextResponse.json({ error: "Draft ID required" }, { status: 400 })
        }

        await deleteCaseStudyDraft(userId, draftId)
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
