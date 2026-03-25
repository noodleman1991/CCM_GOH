import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { writeClient } from "@/sanity/lib/write-client"

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { draftId, draftData } = await request.json()

        // Ensure the draft belongs to the requesting user
        const data = {
            ...draftData,
            _type: 'caseStudyDraft',
            userId,
            lastSaved: new Date().toISOString(),
        }

        let result
        if (draftId) {
            // Verify ownership before updating
            const existing = await writeClient.fetch(
                `*[_type == "caseStudyDraft" && _id == $draftId && userId == $userId][0]._id`,
                { draftId, userId }
            )
            if (!existing) {
                return NextResponse.json({ error: "Draft not found" }, { status: 404 })
            }
            result = await writeClient.patch(draftId).set(data).commit()
        } else {
            result = await writeClient.create(data)
        }

        return NextResponse.json({ id: result._id })
    } catch (error) {
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

        // Verify ownership before deleting
        const existing = await writeClient.fetch(
            `*[_type == "caseStudyDraft" && _id == $draftId && userId == $userId][0]._id`,
            { draftId, userId }
        )
        if (!existing) {
            return NextResponse.json({ error: "Draft not found" }, { status: 404 })
        }

        await writeClient.delete(draftId)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete draft:", error)
        return NextResponse.json(
            { error: "Failed to delete draft" },
            { status: 500 }
        )
    }
}
