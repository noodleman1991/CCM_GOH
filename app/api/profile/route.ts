import { NextRequest, NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { UserService } from "@/lib/services/user.service"
import { calculateProfileCompleteness } from "@/lib/profile-completeness"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type {
  SupportedLocale,
  UserProfileUpdateData,
  LocalizedQueryOptions
} from "@/types/prisma"

const ProfileUpdateSchema = z.object({
    // Clerk-managed fields (read-only from UI, sync only)
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    username: z.string().min(3, "Username must be at least 3 characters").max(30)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    
    // App-managed profile fields - handle null values properly
    bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")).or(z.null()),
    ageGroup: z.enum(["UNDER_18", "ABOVE_18"], {
        errorMap: () => ({ message: "Please select your age group" })
    }).optional().or(z.null()),
    country: z.string().max(100).optional().or(z.literal("")).or(z.null()),
    city: z.string().max(100).optional().or(z.literal("")).or(z.null()),
    workTypes: z.array(z.enum([
        "RESEARCH",
        "POLICY",
        "LIVED_EXPERIENCE_EXPERT",
        "NGO",
        "COMMUNITY_ORGANIZATION",
        "EDUCATION_TEACHING"
    ], {
        errorMap: () => ({ message: "Please select the types of work you do" })
    })).default([]),
    expertiseAreas: z.array(z.enum([
        "CLIMATE_CHANGE",
        "MENTAL_HEALTH",
        "HEALTH",
        "EDUCATION",
        "SOCIAL_JUSTICE"
    ], {
        errorMap: () => ({ message: "Please select valid expertise areas" })
    })).default([]),
    organization: z.string().max(200).optional().or(z.literal("")).or(z.null()),
    position: z.string().max(200).optional().or(z.literal("")).or(z.null()),
    workBio: z.string().max(1000, "Work bio must be less than 1000 characters").optional().or(z.literal("")).or(z.null()),
    personalWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")).or(z.null()),
    linkedinProfile: z.string().max(100).optional().or(z.literal("")).or(z.null()),
    otherSocialLinks: z.array(z.object({
        platform: z.string().min(1),
        url: z.string().url()
    })).optional().default([]),

    // Recent Work
    recentWork: z.array(z.object({
        title: z.string().min(1, "Title is required").max(100),
        description: z.string().min(1, "Description is required").max(500),
        link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().optional().or(z.literal("")),
        isOngoing: z.boolean().optional()
    })).optional().default([]),

    // Community memberships
    communityIds: z.array(z.string()).optional().default([]),

    // Privacy Controls
    isSearchable: z.boolean().default(true),
    profileVisibility: z.enum(["PUBLIC", "MEMBERS", "PRIVATE"], {
        errorMap: () => ({ message: "Please choose who can see your profile" })
    }).default("PUBLIC"),
    showEmail: z.boolean().default(false),
    showPhoneNumber: z.boolean().default(false),
    showWorkDetails: z.boolean().default(true),
    showSocialLinks: z.boolean().default(true),
    showLocation: z.boolean().default(true),

    // Domain-rich fields (K4) — all optional
    headline: z.string().max(120).optional().or(z.literal("")).or(z.null()),
    pronouns: z.string().max(40).optional().or(z.literal("")).or(z.null()),
    languages: z.array(z.string().max(40)).optional().default([]),
    focusTopics: z.array(z.string().max(60)).optional().default([]),
    motivation: z.string().max(600).optional().or(z.literal("")).or(z.null()),
    openToCollaboration: z.boolean().optional().default(false),
    lookingFor: z.array(z.string().max(40)).optional().default([]),
    collaborationInterests: z.string().max(600).optional().or(z.literal("")).or(z.null()),
    livedExperienceStatement: z.string().max(1000).optional().or(z.literal("")).or(z.null()),
    showLivedExperience: z.boolean().optional().default(false),
    orcidId: z.string().max(40).optional().or(z.literal("")).or(z.null()),
}).transform((data) => ({
    // Transform empty strings and null values to null for database storage
    ...data,
    bio: data.bio || null,
    ageGroup: data.ageGroup || null,
    country: data.country || null,
    city: data.city || null,
    organization: data.organization || null,
    position: data.position || null,
    workBio: data.workBio || null,
    personalWebsite: data.personalWebsite || null,
    linkedinProfile: data.linkedinProfile || null,
    otherSocialLinks: data.otherSocialLinks || [],
    recentWork: data.recentWork || [],
    communityIds: data.communityIds || [],
    // Domain-rich fields → null when blank
    headline: data.headline || null,
    pronouns: data.pronouns || null,
    languages: data.languages || [],
    focusTopics: data.focusTopics || [],
    motivation: data.motivation || null,
    lookingFor: data.lookingFor || [],
    collaborationInterests: data.collaborationInterests || null,
    livedExperienceStatement: data.livedExperienceStatement || null,
    orcidId: data.orcidId || null,
}))

type ProfileFormValues = z.infer<typeof ProfileUpdateSchema>

// Enhanced bidirectional sync to Clerk - fire and forget
async function syncToClerk(userId: string, data: ProfileFormValues) {
    try {
        console.log(`🔄 Background sync to Clerk for user ${userId}`)

        const clerkClientInstance = await clerkClient()

        await clerkClientInstance.users.updateUser(userId, {
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            publicMetadata: {
                onboardingCompleted: true,
                lastSyncedAt: new Date().toISOString(),
            }
        })

        console.log(`✅ Clerk sync successful for user ${userId}`)
    } catch (error) {
        console.error(`❌ Clerk sync failed for user ${userId}:`, error)
        // Don't throw - this is background sync
    }
}

/**
 * Get user profile with i18n support
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        // Extract locale from request headers or query params
        const locale = getLocaleFromRequest(request)
        const queryOptions: LocalizedQueryOptions = {
            locale,
            fallbackLocale: 'en',
            includeRTL: true
        }

        // Parallelize queries for better performance
        const [result, availableCommunities] = await Promise.all([
            UserService.getUserById(userId, queryOptions),
            // Fetch available communities in parallel
            prisma.community.findMany({
                where: { type: 'REGIONAL' },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    regionalName: true
                },
                orderBy: { name: 'asc' }
            })
        ])

        if (!result.success) {
            console.error("Failed to fetch profile:", result.error)
            return NextResponse.json(
                { error: "Failed to fetch profile", details: result.error.message },
                { status: 500 }
            )
        }

        if (!result.data) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            )
        }

        // Recent work is already included in getUserById result (no duplicate query needed)
        // Use the recentWork from result.data instead of fetching again
        // Type assertion: transformToLocalizedUser includes relations via spread
        const recentWork = (result.data as any).recentWork || []

        // Return data at root level (matching working pattern)
        return NextResponse.json({
            ...result.data,
            availableCommunities,  // List of all available communities
            recentWork,  // User's recent work (from getUserById, already fetched)
            _locale: locale,
            _isRTL: locale === 'ar'
        })
    } catch (error) {
        console.error("Failed to fetch profile:", error)
        return NextResponse.json(
            { error: "Failed to fetch profile", details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

/**
 * Update user profile with type safety and i18n support
 */
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
        const validatedData = ProfileUpdateSchema.parse(body)

        // Extract locale for response
        const locale = getLocaleFromRequest(request)
        const queryOptions: LocalizedQueryOptions = {
            locale,
            fallbackLocale: 'en',
            includeRTL: true
        }

        // Convert to our TypeScript type
        const updateData: UserProfileUpdateData = {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            username: validatedData.username,
            bio: validatedData.bio || null,
            ageGroup: validatedData.ageGroup || null,
            country: validatedData.country || null,
            city: validatedData.city || null,
            workTypes: validatedData.workTypes,
            expertiseAreas: validatedData.expertiseAreas,
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
            communityIds: validatedData.communityIds || [],
            recentWork: validatedData.recentWork || [],
            // Domain-rich fields (K4)
            headline: validatedData.headline || null,
            pronouns: validatedData.pronouns || null,
            languages: validatedData.languages || [],
            focusTopics: validatedData.focusTopics || [],
            motivation: validatedData.motivation || null,
            openToCollaboration: validatedData.openToCollaboration ?? false,
            lookingFor: validatedData.lookingFor || [],
            collaborationInterests: validatedData.collaborationInterests || null,
            livedExperienceStatement: validatedData.livedExperienceStatement || null,
            showLivedExperience: validatedData.showLivedExperience ?? false,
            orcidId: validatedData.orcidId || null,
        }

        // STEP 1: Update using type-safe service
        const result = await UserService.updateUserProfile(userId, updateData, queryOptions)

        if (!result.success) {
            if (result.error.message.includes('Username already taken')) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 400 }
                )
            }

            console.error("Profile update failed:", result.error)
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            )
        }

        // STEP 1.5: Calculate and update profile completeness
        // updateUserProfile includes the communityMemberships/recentWork relations
        const completeness = calculateProfileCompleteness(result.data)

        console.log(`[Profile Completeness] User ${userId} calculated: ${completeness}%`)

        // Update the profileCompleteness field in database
        await prisma.user.update({
            where: { id: userId },
            data: { profileCompleteness: completeness }
        })

        // Update the result data to include the new completeness
        if (result.data) {
            result.data.profileCompleteness = completeness
        }

        // STEP 1.6: Recent work and community memberships are now handled in the main update above

        // STEP 2: Background sync to Clerk (fire and forget)
        const { ClerkSyncService } = await import('../../../lib/clerk-sync')
        ClerkSyncService.syncToClerk(userId, result.data!).catch(() => {
            // Silent fail - already logged in sync service
        })

        // STEP 3: Update search index (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/users/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SEARCH_WEBHOOK_SECRET}`
            },
            body: JSON.stringify({ userId, action: 'update' })
        }).catch((error) => {
            console.warn(`Search index update failed for user ${userId}:`, error)
        })

        // STEP 4: Return localized response
        return NextResponse.json({
            success: true,
            user: {
                ...result.data,
                _locale: locale,
                _isRTL: locale === 'ar'
            },
            message: "Profile updated successfully"
        })

    } catch (error) {
        console.error("Profile update failed:", error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: "Invalid data",
                    details: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: "Failed to update profile",
                details: process.env.NODE_ENV === 'development'
                    ? (error instanceof Error ? error.message : 'Unknown error')
                    : undefined
            },
            { status: 500 }
        )
    }
}

/**
 * Extract locale from request headers
 */
function getLocaleFromRequest(request: NextRequest): SupportedLocale {
    // First try the Accept-Language header set by our client
    const acceptLanguage = request.headers.get('accept-language')
    if (acceptLanguage && ['en', 'es', 'fr', 'ar'].includes(acceptLanguage)) {
        return acceptLanguage as SupportedLocale
    }
    
    // Try to parse standard Accept-Language header format
    if (acceptLanguage) {
        const preferredLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase()
        if (['en', 'es', 'fr', 'ar'].includes(preferredLang)) {
            return preferredLang as SupportedLocale
        }
    }
    
    // Try the pathname from the referrer URL to get locale
    const referer = request.headers.get('referer')
    if (referer) {
        const url = new URL(referer)
        const pathSegments = url.pathname.split('/')
        const firstSegment = pathSegments[1]
        if (firstSegment && ['en', 'es', 'fr', 'ar'].includes(firstSegment)) {
            return firstSegment as SupportedLocale
        }
    }
    
    // Default to English
    return 'en'
}
