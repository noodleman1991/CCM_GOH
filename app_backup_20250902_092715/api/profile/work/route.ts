// app/api/profile/work/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const recentWorkSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(1000),
    link: z.string().url().optional().or(z.literal("")),
    isOngoing: z.boolean(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable()
})

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const works = await prisma.recentWork.findMany({
            where: { userId },
            orderBy: { startDate: 'desc' }
        })

        return NextResponse.json(works)
    } catch (error) {
        console.error("Failed to fetch recent works:", error)
        return NextResponse.json(
            { error: "Failed to fetch recent works" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Check if user already has 5 recent works
        const workCount = await prisma.recentWork.count({
            where: { userId }
        })

        if (workCount >= 5) {
            return NextResponse.json(
                { error: "Maximum of 5 recent works allowed" },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validatedData = recentWorkSchema.parse(body)

        const work = await prisma.recentWork.create({
            data: {
                ...validatedData,
                link: validatedData.link || null,
                endDate: validatedData.endDate || null,
                userId
            }
        })

        return NextResponse.json(work)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.errors },
                { status: 400 }
            )
        }

        console.error("Failed to create recent work:", error)
        return NextResponse.json(
            { error: "Failed to create recent work" },
            { status: 500 }
        )
    }
}
