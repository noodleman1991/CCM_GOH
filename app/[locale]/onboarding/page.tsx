import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { client } from "@/sanity/lib/client"
import { onboardingContentQueryWithFallback } from "@/sanity/queries/onboarding-content"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./onboarding-client"

export default async function OnboardingPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params
    const { userId } = await auth()

    // Require authentication
    if (!userId) {
        redirect(`/${locale}/sign-in`)
    }

    console.log(`[Onboarding] Loading page for user ${userId}`)

    // Fetch current user data from Prisma
    let currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
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
            preferredLanguage: true,
            communityMemberships: {
                select: { communityId: true }
            },
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
                orderBy: { startDate: 'desc' }
            },
            // Privacy settings
            isSearchable: true,
            profileVisibility: true,
            showEmail: true,
            showPhoneNumber: true,
            showWorkDetails: true,
            showSocialLinks: true,
            showLocation: true
        }
    })

    // If user doesn't exist yet, fetch from Clerk as fallback
    if (!currentUser) {
        console.log(`[Onboarding] User ${userId} not in Prisma yet - fetching from Clerk`)
        const clerkUser = await (await clerkClient()).users.getUser(userId)

        currentUser = {
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            username: clerkUser.username,
            email: clerkUser.primaryEmailAddress?.emailAddress || null,
            bio: null,
            ageGroup: null,
            country: null,
            city: null,
            workTypes: [],
            expertiseAreas: [],
            organization: null,
            position: null,
            workBio: null,
            personalWebsite: null,
            linkedinProfile: null,
            otherSocialLinks: null,
            preferredLanguage: 'EN',
            communityMemberships: [],
            recentWork: [],
            isSearchable: true,
            profileVisibility: 'PUBLIC',
            showEmail: false,
            showPhoneNumber: false,
            showWorkDetails: true,
            showSocialLinks: true,
            showLocation: true
        }
    }

    console.log(`[Onboarding] User data loaded:`, {
        hasFirstName: !!currentUser.firstName,
        hasLastName: !!currentUser.lastName,
        hasUsername: !!currentUser.username,
        hasEmail: !!currentUser.email,
        workTypesCount: currentUser.workTypes.length,
        expertiseAreasCount: currentUser.expertiseAreas.length,
        communitiesCount: currentUser.communityMemberships.length,
        recentWorkCount: currentUser.recentWork.length
    })

    // Load Sanity content and user management options
    const [content, userManagement] = await Promise.all([
        client.fetch(onboardingContentQueryWithFallback, { locale }),
        fetchUserManagementOptionsWithLocale(locale)
    ])

    // Fetch communities from API (server-side)
    let communities: any[] = []
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/communities`, {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
            const data = await response.json()
            communities = data.data || []
            console.log('[Onboarding] Communities loaded:', communities.length)
        } else {
            console.error('[Onboarding] Communities API error:', response.status)
        }
    } catch (error) {
        console.error('[Onboarding] Failed to fetch communities:', error)
    }

    // Serialize data for client component
    const initialData = {
        ...currentUser,
        communityIds: currentUser.communityMemberships.map(m => m.communityId),
        recentWork: currentUser.recentWork.map(work => ({
            ...work,
            startDate: work.startDate.toISOString(),
            endDate: work.endDate?.toISOString() || null
        }))
    }

    return (
        <OnboardingClient
            initialData={initialData}
            userManagementOptions={{ ...userManagement, communities }}
            sanityContent={content}
        />
    )
}
