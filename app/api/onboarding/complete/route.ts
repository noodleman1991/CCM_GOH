import { NextRequest, NextResponse, after } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { ExpertiseArea, WorkType } from "@/generated/prisma"
import { syncUserSearchRecord } from "@/lib/algolia-user-sync"
import { captureServer } from "@/lib/analytics/server"

// Force Node.js runtime for Prisma and Clerk compatibility with Fluid Compute
export const runtime = 'nodejs'

// The Prisma enum values, spelled out so zod rejects an unknown key with a 400
// instead of letting it reach Prisma and 500 (audit finding M2). `satisfies`
// ties each list to the generated type, so adding a value to schema.prisma
// without adding it here fails `tsc` rather than silently rejecting it.
// Same lists as `app/api/profile/route.ts`.
const WORK_TYPES = [
  "RESEARCH",
  "POLICY",
  "LIVED_EXPERIENCE_EXPERT",
  "NGO",
  "COMMUNITY_ORGANIZATION",
  "EDUCATION_TEACHING",
] as const satisfies readonly WorkType[]

const EXPERTISE_AREAS = [
  "CLIMATE_CHANGE",
  "MENTAL_HEALTH",
  "HEALTH",
  "EDUCATION",
  "SOCIAL_JUSTICE",
] as const satisfies readonly ExpertiseArea[]

/**
 * Thrown when the email on the account being onboarded already belongs to a
 * DIFFERENT user row. Until 2026-09-16 the route deleted that older row inside
 * the transaction and retried (audit finding H8) — cascading its community
 * memberships, recent work, comments and workspace membership — while the
 * Clerk webhook explicitly refuses to do the same. Now it is a 409 for the
 * request and a log line naming both ids for manual resolution.
 */
class EmailConflictError extends Error {
  constructor(
    readonly newClerkId: string,
    readonly existingUserId: string | null,
    readonly email: string | null,
  ) {
    super(`Email ${email} already belongs to user ${existingUserId}; new Clerk id ${newClerkId}`)
    this.name = "EmailConflictError"
  }
}

const OnboardingSchema = z.object({
  // Basic Info
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  headline: z.string().max(120).optional(),
  bio: z.string().max(500).optional(),
  motivation: z.string().max(600).optional(),
  ageGroup: z.enum(["UNDER_18", "ABOVE_18"]).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  preferredLanguage: z.enum(["EN", "ES", "FR", "AR"], {
    errorMap: () => ({ message: "Please choose your preferred language" })
  }).optional(),

  // Work Info — validated against the Prisma enum values (see WORK_TYPES)
  workTypes: z.array(z.enum(WORK_TYPES, {
    errorMap: () => ({ message: "Please select the types of work you do" })
  })).default([]),
  expertiseAreas: z.array(z.enum(EXPERTISE_AREAS, {
    errorMap: () => ({ message: "Please select valid expertise areas" })
  })).default([]),
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
    headline: validatedData.headline || null,
    bio: validatedData.bio,
    motivation: validatedData.motivation || null,
    ageGroup: validatedData.ageGroup,
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
        } catch (createError) {
          // Handle P2002 (unique constraint) gracefully - webhook likely just created the user
          if ((createError as { code?: string }).code === 'P2002') {
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

              // A row with this email under ANOTHER Clerk id is the H8
              // conflict. Stop here: continuing would upsert under the new id
              // and trip the same constraint inside the transaction.
              if (existingUser && existingUser.id !== userId) {
                throw new EmailConflictError(userId, existingUser.id, existingUser.email)
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
        if (error instanceof EmailConflictError) throw error
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

    // Wrap all DB operations in a transaction for atomicity
    const upsertData = buildUpsertData(validatedData)
    let joinedCommunities: { id: string; type: string }[] = []
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user in Prisma with onboarding data - use upsert for race condition safety
      let user
      try {
        user = await tx.user.upsert({
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
      } catch (upsertError) {
        // Email conflict — a row with this email exists under a different
        // Clerk id. Never resolved here (see EmailConflictError): the
        // transaction is abandoned and the request gets a 409.
        const prismaError = upsertError as { code?: string; meta?: { target?: string[] } }
        if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
          const email = existingUser?.email || null
          const oldUser = email ? await tx.user.findUnique({ where: { email }, select: { id: true } }) : null
          throw new EmailConflictError(userId, oldUser?.id ?? null, email)
        }
        throw upsertError
      }

      // Create recent work entries
      if (validatedData.recentWork && validatedData.recentWork.length > 0) {
        await tx.recentWork.deleteMany({
          where: { userId }
        })

        await tx.recentWork.createMany({
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

        await tx.userCommunity.deleteMany({
          where: { userId }
        })

        const communities = await tx.community.findMany({
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

        joinedCommunities = communities.map((community) => ({ id: community.id, type: String(community.type) }))
        if (communities.length > 0) {
          await tx.userCommunity.createMany({
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

      return user
    })

    // Sync ONLY essential fields to Clerk metadata (outside transaction — external API)
    // All user data lives in Prisma - we only store minimal metadata in Clerk
    const clerkUpdateData = {
      publicMetadata: {
        onboardingCompleted: true,
        preferredLanguage: validatedData.preferredLanguage || 'EN'
      }
    }

    // The database is committed and is the source of truth: the onboarding
    // layout and /api/onboarding/status read Prisma first and Clerk's claim
    // only as a fallback. So the Clerk metadata write and the search-index
    // write run after the response — a Clerk hiccup no longer turns a
    // completed onboarding into a 500 (it was awaited outside any try/catch),
    // and the index is updated in-process rather than by an un-awaited fetch
    // to ourselves (audit findings M2, H5). Each is logged on failure.
    after(async () => {
      try {
        await (await clerkClient()).users.updateUser(userId, clerkUpdateData)
      } catch (error) {
        console.error(`❌ Onboarding: Clerk metadata update failed for ${userId}:`, error)
      }
      try {
        await syncUserSearchRecord(userId, 'update')
      } catch (error) {
        console.error(`❌ Onboarding: search index update failed for ${userId}:`, error)
      }
      // Product analytics (Slice 11): the funnel's end, plus one join event per
      // community so the `community` group carries the membership. Person
      // properties are role and state only — never name, email or location.
      await captureServer({
        event: "onboarding_completed",
        distinctId: userId,
        properties: { waived: false },
        set: { onboarding_completed: true, role: updatedUser.role, community_kinds: joinedCommunities.map((c) => c.type) },
      })
      for (const community of joinedCommunities) {
        await captureServer({
          event: "community_joined",
          distinctId: userId,
          properties: { community_id: community.id, community_kind: community.type === "special" ? "special" : "regional" },
          groups: { community: community.id },
        })
      }
    })

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
    if (error instanceof EmailConflictError) {
      // Both ids on one line, like the Clerk webhook's conflict branch, so the
      // two can be reconciled by hand. Nothing was deleted.
      console.error(
        `🚨 EMAIL CONFLICT (onboarding): new Clerk user ${error.newClerkId} has email ${error.email} ` +
        `which belongs to existing user ${error.existingUserId}. Action required: resolve manually.`
      )
      return NextResponse.json({
        success: false,
        error: "EMAIL_CONFLICT",
        code: "EMAIL_CONFLICT",
        message: "This email address already belongs to another account. Please contact the Connecting Climate Minds Hub team.",
        timestamp: new Date().toISOString()
      }, {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.error('❌ Error completing onboarding:', error)

    // Prisma 6 reports the error code in `error.code`; the message reads
    // "Unique constraint failed on the fields: (`username`)" and does NOT
    // contain "P2002", which is why the old `message.includes` check 500'd.
    const prismaCode = (error as { code?: unknown } | null)?.code

    if (prismaCode === 'P2002') {
      // Unique constraint violation - username conflict (email is handled above)
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

    if (prismaCode === 'P2025') {
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