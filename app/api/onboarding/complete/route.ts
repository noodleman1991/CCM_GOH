import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const OnboardingSchema = z.object({
  // Basic Info
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  preferredLanguage: z.enum(["EN", "ES", "FR", "AR"]).optional(),

  // Work Info
  workTypes: z.array(z.enum(["RESEARCH", "POLICY", "LIVED_EXPERIENCE_EXPERT", "NGO", "COMMUNITY_ORGANIZATION", "EDUCATION_TEACHING"])).default([]),
  expertiseAreas: z.array(z.enum(["CLIMATE_CHANGE", "MENTAL_HEALTH", "HEALTH"])).default([]),
  organization: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  workBio: z.string().max(1000).optional(),
  personalWebsite: z.string().url().optional().or(z.literal("")),
  linkedinProfile: z.string().max(100).optional(),
  twitterHandle: z.string().max(50).optional(),

  // Recent Work
  recentWork: z.array(z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    link: z.string().url().optional().or(z.literal("")),
    isOngoing: z.boolean(),
    startDate: z.string(),
    endDate: z.string().optional()
  })).default([]),

  // Privacy Settings
  isSearchable: z.boolean().default(true),
  profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]).default("PUBLIC"),
  showEmail: z.boolean().default(false),
  showPhoneNumber: z.boolean().default(false),
  showWorkDetails: z.boolean().default(true),
  showSocialLinks: z.boolean().default(true),
  showLocation: z.boolean().default(true)
})


export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = OnboardingSchema.parse(body)

    console.log(`📥 Processing onboarding completion for user ${userId}`)

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 })
    }

    // Update user in Prisma with onboarding data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Basic information
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        username: validatedData.username,
        bio: validatedData.bio,
        country: validatedData.country,
        city: validatedData.city,
        preferredLanguage: validatedData.preferredLanguage,

        // Work information
        workTypes: validatedData.workTypes,
        expertiseAreas: validatedData.expertiseAreas,
        organization: validatedData.organization,
        position: validatedData.position,
        workBio: validatedData.workBio,
        personalWebsite: validatedData.personalWebsite,
        linkedinProfile: validatedData.linkedinProfile,
        twitterHandle: validatedData.twitterHandle,

        // Privacy settings
        isSearchable: validatedData.isSearchable,
        profileVisibility: validatedData.profileVisibility,
        showEmail: validatedData.showEmail,
        showPhoneNumber: validatedData.showPhoneNumber,
        showWorkDetails: validatedData.showWorkDetails,
        showSocialLinks: validatedData.showSocialLinks,
        showLocation: validatedData.showLocation,

        // Mark onboarding as completed
        onboardingCompleted: true,
        updatedAt: new Date()
      }
    })

    // Create recent work entries
    if (validatedData.recentWork && validatedData.recentWork.length > 0) {
      // Delete existing recent work
      await prisma.recentWork.deleteMany({
        where: { userId }
      })

      // Create new recent work entries
      await prisma.recentWork.createMany({
        data: validatedData.recentWork.map((work) => ({
          userId,
          title: work.title,
          description: work.description,
          link: work.link || null,
          isOngoing: work.isOngoing,
          startDate: new Date(work.startDate),
          endDate: work.endDate ? new Date(work.endDate) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      })
    }

    // Sync data to Clerk metadata following the established pattern
    const clerkUpdateData = {
      public_metadata: {

        // App-specific data
        bio: validatedData.bio,
        country: validatedData.country,
        city: validatedData.city,
        preferredLanguage: validatedData.preferredLanguage,
        workTypes: validatedData.workTypes,
        expertiseAreas: validatedData.expertiseAreas,
        organization: validatedData.organization,
        position: validatedData.position,
        workBio: validatedData.workBio,
        personalWebsite: validatedData.personalWebsite,
        linkedinProfile: validatedData.linkedinProfile,
        twitterHandle: validatedData.twitterHandle,

        // Privacy settings
        isSearchable: validatedData.isSearchable,
        profileVisibility: validatedData.profileVisibility,
        showEmail: validatedData.showEmail,
        showPhoneNumber: validatedData.showPhoneNumber,
        showWorkDetails: validatedData.showWorkDetails,
        showSocialLinks: validatedData.showSocialLinks,
        showLocation: validatedData.showLocation,

        // Onboarding status
        onboardingCompleted: true,

        // Mark as synced from Prisma so webhook knows this is authoritative
        syncedFrom: 'prisma',
        lastSyncedAt: new Date().toISOString()
      }
    }

    // Update Clerk user data
    await (await clerkClient()).users.updateUser(userId, clerkUpdateData)

    console.log(`✅ Onboarding completed for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: "Onboarding completed successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        onboardingCompleted: true
      }
    })

  } catch (error) {
    console.error('❌ Error completing onboarding:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation failed",
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint to check onboarding status
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        onboardingCompleted: true,
        firstName: true,
        lastName: true,
        username: true,
        bio: true,
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
        isSearchable: true,
        profileVisibility: true,
        showEmail: true,
        showPhoneNumber: true,
        showWorkDetails: true,
        showSocialLinks: true,
        showLocation: true,
        recentWork: {
          select: {
            id: true,
            title: true,
            description: true,
            link: true,
            isOngoing: true,
            startDate: true,
            endDate: true
          },
          orderBy: {
            startDate: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user,
      onboardingCompleted: user.onboardingCompleted
    })

  } catch (error) {
    console.error('❌ Error fetching onboarding status:', error)
    return NextResponse.json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}