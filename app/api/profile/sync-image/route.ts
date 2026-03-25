import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { imageUrl } = await request.json()

        await prisma.user.update({
            where: { id: userId },
            data: { image: imageUrl || null }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to sync profile image:", error)
        return NextResponse.json(
            { error: "Failed to sync image" },
            { status: 500 }
        )
    }
}
