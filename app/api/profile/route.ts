import { NextRequest, NextResponse, after } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { syncUserSearchRecord } from "@/lib/algolia-user-sync"
import { UserService } from "@/lib/services/user.service"
import { calculateProfileCompleteness } from "@/lib/profile-completeness"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type {
  SupportedLocale,
  UserProfileUpdateData,
  LocalizedQueryOptions
} from "@/types/prisma"
import { rateLimitRequest } from "@/lib/rate-limit-route";
import { LIMITS } from "@/lib/validation/limits";

const ProfileUpdateSchema = z.object({
    // Clerk-managed fields (read-only from UI, sync only)
    firstName: z.string().min(1, "First name is required").max(LIMITS.profile.firstName),
    lastName: z.string().min(1, "Last name is required").max(LIMITS.profile.lastName),
    username: z.string().min(3, "Username must be at least 3 characters").max(LIMITS.profile.username)
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
    
    // App-managed profile fields - handle null values properly
    bio: z.string().max(LIMITS.profile.bio, "Bio must be less than 500 characters").optional().or(z.literal("")).or(z.null()),
    ageGroup: z.enum(["UNDER_18", "ABOVE_18"], {
        errorMap: () => ({ message: "Please select your age group" })
    }).optional().or(z.null()),
    country: z.string().max(LIMITS.profile.country).optional().or(z.literal("")).or(z.null()),
    city: z.string().max(LIMITS.profile.city).optional().or(z.literal("")).or(z.null()),
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
    organization: z.string().max(LIMITS.profile.organization).optional().or(z.literal("")).or(z.null()),
    position: z.string().max(LIMITS.profile.position).optional().or(z.literal("")).or(z.null()),
    workBio: z.string().max(LIMITS.profile.workBio, "Work bio must be less than 1000 characters").optional().or(z.literal("")).or(z.null()),
    personalWebsite: z.string().url("Please enter a valid URL").optional().or(z.literal("")).or(z.null()),
    linkedinProfile: z.string().max(LIMITS.profile.linkedinProfile).optional().or(z.literal("")).or(z.null()),
    otherSocialLinks: z.array(z.object({
        platform: z.string().min(1),
        url: z.string().url()
    })).optional().default([]),

    // Recent Work
    recentWork: z.array(z.object({
        // The row's id when it already exists, so the save updates it in place
        // and keeps the owner's pinned/hidden curation.
        id: z.string().optional(),
        title: z.string().min(1, "Title is required").max(LIMITS.recentWork.title),
        description: z.string().min(1, "Description is required").max(LIMITS.recentWork.description),
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
    }).default("MEMBERS"),
    showEmail: z.boolean().default(false),
    showPhoneNumber: z.boolean().default(false),
    showWorkDetails: z.boolean().default(true),
    showSocialLinks: z.boolean().default(true),
    showLocation: z.boolean().default(true),

    // Domain-rich fields (K4) — all optional
    headline: z.string().max(LIMITS.profile.headline).optional().or(z.literal("")).or(z.null()),
    pronouns: z.string().max(LIMITS.profile.pronouns).optional().or(z.literal("")).or(z.null()),
    languages: z.array(z.string().max(LIMITS.profile.language)).optional().default([]),
    focusTopics: z.array(z.string().max(LIMITS.profile.focusTopic)).optional().default([]),
    motivation: z.string().max(LIMITS.profile.motivation).optional().or(z.literal("")).or(z.null()),
    openToCollaboration: z.boolean().optional().default(false),
    lookingFor: z.array(z.string().max(LIMITS.profile.lookingFor)).optional().default([]),
    collaborationInterests: z.string().max(LIMITS.profile.collaborationInterests).optional().or(z.literal("")).or(z.null()),
    livedExperienceStatement: z.string().max(LIMITS.profile.livedExperienceStatement).optional().or(z.literal("")).or(z.null()),
    showLivedExperience: z.boolean().optional().default(false),
    orcidId: z.string().max(LIMITS.profile.orcidId).optional().or(z.literal("")).or(z.null()),
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
        const recentWork = (result.data as { recentWork?: unknown[] }).recentWork || []

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
  const limited = await rateLimitRequest(request, "profile:update", { limit: 20, windowSeconds: 300 });
  if (limited) return limited;

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

        // STEP 2 + 3: Clerk sync and the search-index write run after the
        // response. The index update used to be an un-awaited fetch to
        // `${NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/users/webhook`
        // with no `res.ok` check, so a 401/404 from that hop looked like
        // success (audit finding H5); it is now a direct call, logged on
        // failure. `syncToClerk` logs its own failures and never throws.
        const updatedProfile = result.data!
        after(async () => {
            const { ClerkSyncService } = await import('@/lib/clerk-sync')
            await ClerkSyncService.syncToClerk(userId, updatedProfile)
            try {
                await syncUserSearchRecord(userId, 'update')
            } catch (error) {
                console.error(`❌ Search index update failed for user ${userId}:`, error)
            }
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
