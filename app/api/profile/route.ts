import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { userSync } from "@/lib/user-sync"
import { z } from "zod"

const ProfileUpdateSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    bio: z.string().max(500).optional(),
    ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
    country: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    workTypes: z.array(z.enum([
        "RESEARCH", "POLICY", "LIVED_EXPERIENCE_EXPERT",
        "NGO", "COMMUNITY_ORGANIZATION", "EDUCATION_TEACHING"
    ])).default([]),
    expertiseAreas: z.array(z.enum([
        "CLIMATE_CHANGE", "MENTAL_HEALTH", "HEALTH"
    ])).default([]),
    organization: z.string().max(200).optional(),
    position: z.string().max(200).optional(),
    workBio: z.string().max(1000).optional(),
    personalWebsite: z.string().url().optional().or(z.literal("")),
    linkedinProfile: z.string().max(100).optional(),
    twitterHandle: z.string().max(50).optional(),
})

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                communityMemberships: {
                    include: {
                        community: {
                            select: {
                                id: true, name: true, type: true,
                                regionalName: true, specialName: true
                            }
                        }
                    }
                },
                recentWork: {
                    orderBy: { startDate: 'desc' },
                    take: 5
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Failed to fetch profile:", error)
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const data = ProfileUpdateSchema.parse(body)

        // Check username availability
        if (data.username) {
            const currentUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { username: true }
            })

            if (currentUser?.username !== data.username) {
                const existingUser = await prisma.user.findFirst({
                    where: {
                        username: data.username,
                        NOT: { id: userId }
                    }
                })

                if (existingUser) {
                    return NextResponse.json(
                        { error: "Username already taken" },
                        { status: 400 }
                    )
                }
            }
        }

        // Update in Prisma
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                personalWebsite: data.personalWebsite || null,
                linkedinProfile: data.linkedinProfile || null,
                twitterHandle: data.twitterHandle || null,
                updatedAt: new Date(),
            }
        })

        // Auto-sync to Clerk (don't fail if this doesn't work)
        userSync.syncToClerk(userId).then(result => {
            if (!result.success) {
                console.warn(`Clerk sync failed for ${userId}`)
                return NextResponse.json({ error: 'Sync failed' }, { status: 503 })
            }
        }).catch(error => {
            console.warn(`Clerk sync failed for user ${userId}:`, error)
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error) {
        console.error("Profile update failed:", error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid data",
                    details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        )
    }
}
