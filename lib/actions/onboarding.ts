"use server"

import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const onboardingSchema = z.object({
  // Basic Info
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
  ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
  country: z.string().min(1),
  city: z.string().min(1),
  preferredLanguage: z.enum(["EN", "ES", "FR", "AR"]),

  // Work Info - using strings for flexibility with dynamic Sanity content
  workTypes: z.array(z.string()),
  expertiseAreas: z.array(z.string()),
  organization: z.string().optional(),
  position: z.string().optional(),
  workBio: z.string().max(1000).optional(),

  // Social Links
  personalWebsite: z.string().url().optional().or(z.literal("")),
  linkedinProfile: z.string().optional(),
  otherSocialLinks: z.array(z.object({
    platform: z.string().min(1),
    url: z.string().url()
  })).optional().default([]),

  // Recent Work
  recentWork: z.array(z.object({
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    link: z.string().url().optional().or(z.literal("")),
    isOngoing: z.boolean(),
    startDate: z.string(),
    endDate: z.string().optional()
  })),

  // Privacy
  isSearchable: z.boolean(),
  profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"]),
  showEmail: z.boolean(),
  showPhoneNumber: z.boolean(),
  showWorkDetails: z.boolean(),
  showSocialLinks: z.boolean(),
  showLocation: z.boolean()
})

// Valid enum values for runtime validation
const VALID_WORK_TYPES = [
  "RESEARCH",
  "POLICY",
  "LIVED_EXPERIENCE_EXPERT",
  "NGO",
  "COMMUNITY_ORGANIZATION",
  "EDUCATION_TEACHING"
] as const

const VALID_EXPERTISE_AREAS = [
  "CLIMATE_CHANGE",
  "MENTAL_HEALTH",
  "HEALTH"
] as const

export async function completeOnboarding(data: z.infer<typeof onboardingSchema>) {
  try {
    // Check authentication
    const { userId } = await auth()

    if (!userId) {
      throw new Error("Unauthorized")
    }

    // Validate input data
    const validatedData = onboardingSchema.parse(data)

    // Validate and filter work types and expertise areas to only include valid enum values
    const filteredWorkTypes = validatedData.workTypes.filter(wt =>
      VALID_WORK_TYPES.includes(wt as any)
    ) as typeof VALID_WORK_TYPES[number][]

    const filteredExpertiseAreas = validatedData.expertiseAreas.filter(ea =>
      VALID_EXPERTISE_AREAS.includes(ea as any)
    ) as typeof VALID_EXPERTISE_AREAS[number][]

    if (filteredWorkTypes.length === 0) {
      throw new Error("At least one valid work type is required")
    }

    if (filteredExpertiseAreas.length === 0) {
      throw new Error("At least one valid expertise area is required")
    }

    const client = await clerkClient()

    // Use Prisma transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update user profile in Prisma
      await tx.user.upsert({
        where: { id: userId },
        update: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          username: validatedData.username,
          bio: validatedData.bio || null,
          ageGroup: validatedData.ageGroup || null,
          country: validatedData.country,
          city: validatedData.city,
          preferredLanguage: validatedData.preferredLanguage,
          workTypes: filteredWorkTypes,
          expertiseAreas: filteredExpertiseAreas,
          organization: validatedData.organization || null,
          position: validatedData.position || null,
          workBio: validatedData.workBio || null,
          personalWebsite: validatedData.personalWebsite || null,
          linkedinProfile: validatedData.linkedinProfile || null,
          otherSocialLinks: validatedData.otherSocialLinks || [],
          isSearchable: validatedData.isSearchable,
          profileVisibility: validatedData.profileVisibility,
          showEmail: validatedData.showEmail,
          showPhoneNumber: validatedData.showPhoneNumber,
          showWorkDetails: validatedData.showWorkDetails,
          showSocialLinks: validatedData.showSocialLinks,
          showLocation: validatedData.showLocation,
          onboardingCompleted: true,
          onboardingStep: 6,
          welcomeMessageSeen: true
        },
        create: {
          id: userId,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          username: validatedData.username,
          bio: validatedData.bio || null,
          ageGroup: validatedData.ageGroup || null,
          country: validatedData.country,
          city: validatedData.city,
          preferredLanguage: validatedData.preferredLanguage,
          workTypes: filteredWorkTypes,
          expertiseAreas: filteredExpertiseAreas,
          organization: validatedData.organization || null,
          position: validatedData.position || null,
          workBio: validatedData.workBio || null,
          personalWebsite: validatedData.personalWebsite || null,
          linkedinProfile: validatedData.linkedinProfile || null,
          otherSocialLinks: validatedData.otherSocialLinks || [],
          isSearchable: validatedData.isSearchable,
          profileVisibility: validatedData.profileVisibility,
          showEmail: validatedData.showEmail,
          showPhoneNumber: validatedData.showPhoneNumber,
          showWorkDetails: validatedData.showWorkDetails,
          showSocialLinks: validatedData.showSocialLinks,
          showLocation: validatedData.showLocation,
          onboardingCompleted: true,
          onboardingStep: 6,
          welcomeMessageSeen: true
        }
      })

      // Create recent work entries
      if (validatedData.recentWork.length > 0) {
        // First delete any existing recent work to avoid duplicates
        await tx.recentWork.deleteMany({
          where: { userId }
        })

        // Then create new entries
        await tx.recentWork.createMany({
          data: validatedData.recentWork.map(work => ({
            title: work.title,
            description: work.description,
            link: work.link || null,
            isOngoing: work.isOngoing,
            startDate: new Date(work.startDate),
            endDate: work.endDate ? new Date(work.endDate) : null,
            userId
          }))
        })
      }
    })

    // Update Clerk user with basic info and onboarding completion
    await client.users.updateUser(userId, {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      username: validatedData.username,
      publicMetadata: {
        onboardingComplete: true,
        onboardingCompletedAt: new Date().toISOString(),
        syncedFrom: 'prisma' // Flag to prevent webhook conflicts
      }
    })

    // Revalidate relevant paths
    revalidatePath('/profile')
    revalidatePath('/dashboard')
    revalidatePath('/collaborate')

  } catch (error) {
    console.error("Onboarding completion error:", error)

    if (error instanceof z.ZodError) {
      throw new Error(`Invalid data: ${error.errors.map(e => e.message).join(', ')}`)
    }

    throw new Error("Failed to complete onboarding. Please try again.")
  }

  // Redirect to collaborate page (must be outside try/catch)
  redirect('/collaborate')
}

// Alias for the new unified onboarding system
export const submitOnboardingData = completeOnboarding