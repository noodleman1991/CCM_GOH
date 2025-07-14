import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const profileUpdateSchema = z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
    bio: z.string().max(500).optional(),
    ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    workTypes: z.array(z.enum([
        "RESEARCH",
        "POLICY",
        "LIVED_EXPERIENCE_EXPERT",
        "NGO",
        "COMMUNITY_ORGANIZATION",
        "EDUCATION_TEACHING"
    ])),
    expertiseAreas: z.array(z.enum([
        "CLIMATE_CHANGE",
        "MENTAL_HEALTH",
        "HEALTH"
    ])),
    organization: z.string().optional(),
    position: z.string().optional(),
    workBio: z.string().max(1000).optional(),
    personalWebsite: z.string().url().optional().or(z.literal("")),
    linkedinProfile: z.string().optional(),
    twitterHandle: z.string().optional()
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

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                email: true,
                image: true,
                bio: true,
                ageGroup: true,
                country: true,
                city: true,
                workTypes: true,
                expertiseAreas: true,
                organization: true,
                position: true,
                workBio: true,
                personalWebsite: true,
                linkedinProfile: true,
                twitterHandle: true,
                communityMemberships: {
                    include: {
                        community: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Failed to fetch profile:", error)
        return NextResponse.json(
            { error: "Failed to fetch profile" },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const validatedData = profileUpdateSchema.parse(body)

        // Check if username is already taken by another user
        if (validatedData.username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username: validatedData.username,
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

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                ...validatedData,
                personalWebsite: validatedData.personalWebsite || null,
                linkedinProfile: validatedData.linkedinProfile || null,
                twitterHandle: validatedData.twitterHandle || null,
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Invalid data", details: error.errors },
                { status: 400 }
            )
        }

        console.error("Failed to update profile:", error)
        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        )
    }
}
