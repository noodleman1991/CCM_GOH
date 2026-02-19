import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ExpertiseArea, WorkType } from "@/generated/prisma"

// Force Node.js runtime for Prisma and Clerk compatibility with Fluid Compute
export const runtime = 'nodejs'

const OnboardingSchema = z.object({
  // Basic Info
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  bio: z.string().max(500).optional(),
  ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  preferredLanguage: z.enum(["EN", "ES", "FR", "AR"], {
    errorMap: () => ({ message: "Please choose your preferred language" })
  }).optional(),

  // Work Info — Prisma handles enum validation at DB level
  workTypes: z.array(z.string()).default([]),
  expertiseAreas: z.array(z.string()).default([]),
  communityIds: z.array(z.string()).max(10).default([]),
  organization: z.string().max(200).optional(),
  position: z.string().max(200).optional(),
  workBio: z.string().max(1000).optional(),
  personalWebsite: z.string().url().optional().or(z.literal("")),
  linkedinProfile: z.string().max(100).optional(),
  otherSocialLinks: z.array(z.object({
    platform: z.string().min(1),
    url: z.string().url()
  })).default([]),

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
  profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"], {
    errorMap: () => ({ message: "Please choose who can see your profile" })
  }).default("PUBLIC"),
  showEmail: z.boolean().default(false),
  showPhoneNumber: z.boolean().default(false),
  showWorkDetails: z.boolean().default(true),
  showSocialLinks: z.boolean().default(true),
  showLocation: z.boolean().default(true)
})


/** Build the shared upsert data from validated onboarding input */
function buildUpsertData(validatedData: z.infer<typeof OnboardingSchema>) {
  return {
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    username: validatedData.username,
    bio: validatedData.bio,
    ageGroup: validatedData.ageGroup,
    country: validatedData.country,
    city: validatedData.city,
    preferredLanguage: validatedData.preferredLanguage,
    workTypes: validatedData.workTypes as WorkType[],
    expertiseAreas: validatedData.expertiseAreas as ExpertiseArea[],
    organization: validatedData.organization,
    position: validatedData.position,
    workBio: validatedData.workBio,
    personalWebsite: validatedData.personalWebsite,
    linkedinProfile: validatedData.linkedinProfile,
    otherSocialLinks: validatedData.otherSocialLinks,
    isSearchable: validatedData.isSearchable,
    profileVisibility: validatedData.profileVisibility,
    showEmail: validatedData.showEmail,
    showPhoneNumber: validatedData.showPhoneNumber,
    showWorkDetails: validatedData.showWorkDetails,
    showSocialLinks: validatedData.showSocialLinks,
    showLocation: validatedData.showLocation,
    onboardingCompleted: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure we always return JSON, even for early errors
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ Onboarding API: Unauthorized access attempt')
      return NextResponse.json({
        success: false,
        error: "Unauthorized",
        code: "AUTH_REQUIRED"
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body with error handling
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('❌ Onboarding API: Invalid JSON in request body:', parseError)
      return NextResponse.json({
        success: false,
        error: "Invalid JSON in request body",
        code: "INVALID_JSON"
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log(`📥 Processing onboarding completion for user ${userId}`)

    // Validate data with detailed error messages
    let validatedData
    try {
      validatedData = OnboardingSchema.parse(body)
    } catch (validationError) {
      console.error('❌ Onboarding API: Validation failed:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          success: false,
          error: "Validation failed",
          code: "VALIDATION_ERROR",
          details: validationError.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        }, {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      // Re-throw unknown validation errors
      return NextResponse.json({
        success: false,
        error: "Validation failed",
        code: "UNKNOWN_VALIDATION_ERROR"
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Check if user exists in database
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { id: userId }
      })
    } catch (dbError) {
      console.error('❌ Onboarding API: Database error checking user:', dbError)
      return NextResponse.json({
        success: false,
        error: "Database connection error",
        code: "DB_CONNECTION_ERROR"
      }, {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!existingUser) {
      // Webhook delayed - create user now to prevent errors
      console.log(`⚠️ Onboarding API: User ${userId} not found - fetching from Clerk`)

      try {
        const clerkUser = await (await clerkClient()).users.getUser(userId)

        // Try to create user, but handle P2002 (unique constraint) gracefully
        try {
          existingUser = await prisma.user.create({
            data: {
              id: userId,
              email: clerkUser.primaryEmailAddress?.emailAddress || null,
              firstName: clerkUser.firstName,
              lastName: clerkUser.lastName,
              username: clerkUser.username,
              image: clerkUser.imageUrl,
              emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified' ? new Date() : null,
              phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || null,
              phoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === 'verified' ? new Date() : null,
              workTypes: [],
              expertiseAreas: [],
              isSearchable: true,
              profileVisibility: 'PUBLIC',
              showEmail: false,
              showPhoneNumber: false,
              showWorkDetails: true,
              showSocialLinks: true,
              showLocation: true,
            }
          })

          console.log(`✅ Onboarding API: Created user ${userId} successfully`)
        } catch (createError: any) {
          // Handle P2002 (unique constraint) gracefully - webhook likely just created the user
          if (createError.code === 'P2002') {
            console.log(`✓ Onboarding API: User ${userId} created by webhook during request - refetching`)

            // Try to fetch by user ID first
            existingUser = await prisma.user.findUnique({
              where: { id: userId }
            })

            // If not found by ID, try by email (in case of ID mismatch)
            if (!existingUser && clerkUser.primaryEmailAddress?.emailAddress) {
              existingUser = await prisma.user.findUnique({
                where: { email: clerkUser.primaryEmailAddress.emailAddress }
              })

              if (existingUser) {
                console.log(`✓ Onboarding API: Found user by email instead: ${existingUser.id}`)
              }
            }

            // If still not found, something is wrong
            if (!existingUser) {
              throw new Error('User creation conflict - please wait a moment and try again')
            }
          } else {
            // Re-throw other errors
            throw createError
          }
        }
      } catch (error) {
        console.error(`❌ Onboarding API: Failed to set up user ${userId}:`, error)
        return NextResponse.json({
          success: false,
          error: "Failed to set up your account. Please wait a moment and try again.",
          code: "USER_SETUP_FAILED"
        }, {
          status: 503, // 503 = Service Unavailable (temporary issue)
          headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    // Check if webhook data was incomplete - fetch from Clerk if needed
    if (existingUser && (!existingUser.firstName || !existingUser.lastName || !existingUser.username)) {
      console.log(`⚠️ Onboarding API: User ${userId} has incomplete data (firstName: "${existingUser.firstName}", lastName: "${existingUser.lastName}", username: "${existingUser.username}") - fetching from Clerk`)

      try {
        const clerkUser = await (await clerkClient()).users.getUser(userId)

        // Update with fresh Clerk data, preserving existing values if present
        existingUser = await prisma.user.update({
          where: { id: userId },
          data: {
            firstName: existingUser.firstName || clerkUser.firstName,
            lastName: existingUser.lastName || clerkUser.lastName,
            username: existingUser.username || clerkUser.username,
            email: existingUser.email || clerkUser.primaryEmailAddress?.emailAddress || null,
            image: existingUser.image || clerkUser.imageUrl,
          }
        })

        console.log(`✅ Onboarding API: Updated user ${userId} with Clerk data - firstName: "${existingUser.firstName}", lastName: "${existingUser.lastName}", username: "${existingUser.username}"`)
      } catch (clerkError) {
        console.error(`❌ Onboarding API: Failed to fetch from Clerk for user ${userId}:`, clerkError)
        // Continue anyway - onboarding form data will fill in the gaps
      }
    }

    // Update user in Prisma with onboarding data - use upsert for race condition safety
    const upsertData = buildUpsertData(validatedData)
    let updatedUser
    try {
      updatedUser = await prisma.user.upsert({
        where: { id: userId },
        update: { ...upsertData, updatedAt: new Date() },
        create: {
          id: userId,
          email: existingUser?.email || null,
          image: null,
          ...upsertData,
          emailVerified: null,
          phoneNumber: null,
          phoneVerified: null,
        }
      })
    } catch (upsertError: any) {
      // Handle email conflict - old user exists with same email but different Clerk ID
      if (upsertError.code === 'P2002' && upsertError.meta?.target?.includes('email')) {
        const email = existingUser?.email || null
        console.log(`⚠️ Onboarding: Email ${email} conflict - cleaning up old user`)

        const oldUser = await prisma.user.findUnique({ where: { email: email! } })
        if (oldUser && oldUser.id !== userId) {
          console.log(`🗑️ Onboarding: Deleting old user ${oldUser.id}, will create new ${userId}`)
          await prisma.user.delete({ where: { id: oldUser.id } })

          // Retry upsert - will now succeed
          updatedUser = await prisma.user.upsert({
            where: { id: userId },
            update: { ...upsertData, updatedAt: new Date() },
            create: {
              id: userId,
              email: existingUser?.email || null,
              image: null,
              ...upsertData,
              emailVerified: null,
              phoneNumber: null,
              phoneVerified: null,
            }
          })

          console.log(`✅ Onboarding: Created user ${updatedUser.id} after cleanup`)
        } else {
          throw upsertError
        }
      } else {
        throw upsertError
      }
    }

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

    // Handle community memberships
    if (validatedData.communityIds && validatedData.communityIds.length > 0) {
      console.log(`📋 Processing ${validatedData.communityIds.length} community IDs for user ${userId}:`, validatedData.communityIds)

      // Delete existing community memberships
      await prisma.userCommunity.deleteMany({
        where: { userId }
      })

      // Verify which communities exist
      const communities = await prisma.community.findMany({
        where: {
          id: { in: validatedData.communityIds }
        },
        select: { id: true, name: true, type: true }
      })

      const foundIds = communities.map(c => c.id)
      const missingIds = validatedData.communityIds.filter(id => !foundIds.includes(id))

      if (missingIds.length > 0) {
        console.warn(`⚠️ Communities not found for user ${userId}:`, missingIds)
        console.log(`✓ Found ${communities.length} valid communities:`, communities.map(c => `${c.name} (${c.type})`))
      }

      // Create memberships for ALL valid communities (save what we can)
      if (communities.length > 0) {
        await prisma.userCommunity.createMany({
          data: communities.map(community => ({
            userId,
            communityId: community.id,
            role: 'community_member' as const
          }))
        })
        console.log(`✅ Created ${communities.length} community memberships for user ${userId}`)
      } else {
        console.error(`❌ No valid communities found for user ${userId} from IDs:`, validatedData.communityIds)
      }
    }

    // Sync ONLY essential fields to Clerk metadata
    // All user data lives in Prisma - we only store minimal metadata in Clerk
    const clerkUpdateData = {
      publicMetadata: {
        onboardingCompleted: true,
        preferredLanguage: validatedData.preferredLanguage || 'EN'
      }
    }

    // Update Clerk user with minimal metadata
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

    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('P2002')) {
      // Unique constraint violation - likely username conflict
      return NextResponse.json({
        success: false,
        error: "Username is already taken. Please choose a different username.",
        code: "USERNAME_TAKEN",
        timestamp: new Date().toISOString()
      }, {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (error instanceof Error && error.message.includes('P2025')) {
      // No record found for update - webhook hasn't created user yet
      return NextResponse.json({
        success: false,
        error: "Your account is still being set up. Please wait a moment and try again.",
        code: "ACCOUNT_SETUP_IN_PROGRESS",
        timestamp: new Date().toISOString()
      }, {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Ensure we always return valid JSON for other errors
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      code: "INTERNAL_ERROR",
      message: error instanceof Error ? error.message : "Unknown error occurred",
      timestamp: new Date().toISOString()
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
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
        otherSocialLinks: true,
        communityMemberships: {
          select: {
            communityId: true,
            community: {
              select: {
                id: true,
                name: true,
                type: true,
                regionalName: true
              }
            }
          }
        },
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