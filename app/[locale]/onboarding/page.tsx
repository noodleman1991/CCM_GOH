import { auth, clerkClient } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { client } from "@/sanity/lib/client"
import { onboardingContentQueryWithFallback } from "@/sanity/queries/onboarding-content"
import { fetchUserManagementOptionsWithLocale } from "@/lib/actions/sync-user-management"
import { prisma } from "@/lib/prisma"
import { OnboardingClient } from "./onboarding-client"
import { getRegionalCommunities } from "@/sanity/queries/regional-communities"

// Fallback communities with multilingual names (all 4 languages)
const FALLBACK_COMMUNITIES = [
    {
        slug: 'sub-saharan-africa',
        regionalName: 'ssa',
        name: {
            en: 'Sub-Saharan Africa',
            es: 'África subsahariana',
            fr: 'Afrique subsaharienne',
            ar: 'أفريقيا جنوب الصحراء'
        }
    },
    {
        slug: 'northern-africa-and-western-asia',
        regionalName: 'nawa',
        name: {
            en: 'Northern Africa and Western Asia',
            es: 'África del Norte y Asia Occidental',
            fr: 'Afrique du Nord et Asie occidentale',
            ar: 'شمال أفريقيا وغرب آسيا'
        }
    },
    {
        slug: 'central-and-southern-asia',
        regionalName: 'csa',
        name: {
            en: 'Central and Southern Asia',
            es: 'Asia Central y del Sur',
            fr: 'Asie centrale et du Sud',
            ar: 'وسط وجنوب آسيا'
        }
    },
    {
        slug: 'eastern-and-south-eastern-asia',
        regionalName: 'esea',
        name: {
            en: 'Eastern and South-Eastern Asia',
            es: 'Asia Oriental y Sudoriental',
            fr: 'Asie de l\'Est et du Sud-Est',
            ar: 'شرق وجنوب شرق آسيا'
        }
    },
    {
        slug: 'latin-america-and-the-caribbean',
        regionalName: 'lac',
        name: {
            en: 'Latin America and the Caribbean',
            es: 'América Latina y el Caribe',
            fr: 'Amérique latine et Caraïbes',
            ar: 'أمريكا اللاتينية والكاريبي'
        }
    },
    {
        slug: 'oceania',
        regionalName: 'oce',
        name: {
            en: 'Oceania',
            es: 'Oceanía',
            fr: 'Océanie',
            ar: 'أوقيانوسيا'
        }
    },
    {
        slug: 'europe-and-north-america',
        regionalName: 'enam',
        name: {
            en: 'Europe and North America',
            es: 'Europa y América del Norte',
            fr: 'Europe et Amérique du Nord',
            ar: 'أوروبا وأمريكا الشمالية'
        }
    }
]

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

    // Fetch communities directly from Prisma/Sanity (avoids HTTP self-call issues)
    let communities: any[] = []
    try {
        // Fetch communities from Sanity (source of truth for names and translations)
        const sanityCommunities = await getRegionalCommunities()

        // Fetch from database to get IDs for joining with user profiles
        const dbCommunities = await prisma.community.findMany({
            where: { type: 'REGIONAL' },
            select: {
                id: true,
                name: true,
                regionalName: true
            }
        })

        // Create a map of regionalName -> database ID
        const regionalNameToId = new Map(
            dbCommunities.map(c => [c.regionalName, c.id])
        )

        // If Sanity is empty, use hardcoded fallback with multilingual support
        if (!sanityCommunities || sanityCommunities.length === 0) {
            console.warn('[Onboarding] ⚠️ No communities in Sanity, using hardcoded fallback')
            communities = FALLBACK_COMMUNITIES
                .map(community => {
                    const dbId = regionalNameToId.get(community.regionalName as any)
                    if (!dbId) return null
                    return {
                        id: dbId,
                        slug: community.slug,
                        name: community.name,
                        type: 'REGIONAL',
                        regionalName: community.regionalName
                    }
                })
                .filter(Boolean)
        } else {
            // Merge Sanity data with database IDs. The DB enum (regionalName) and
            // the Sanity slug don't always transform 1:1 — e.g. slug
            // `europe-and-northern-america` → `EUROPE_AND_NORTHERN_AMERICA` but the
            // enum is `enam`. Match robustly so a community is
            // never silently dropped from onboarding.

            // Normalize an enum-ish key for fuzzy comparison: lowercase, drop
            // filler words and non-letters, and collapse the north/northern,
            // east/eastern, etc. difference (the actual cause of the
            // europe-and-northern-america vs enam mismatch).
            const norm = (s: string) =>
                s.toLowerCase()
                    .replace(/\b(and|the|of)\b/g, '')
                    .replace(/[^a-z]/g, '')
                    .replace(/(north|south|east|west)ern/g, '$1') // northern->north

            const normalizedDbIds = new Map(
                dbCommunities.map(c => [norm(c.regionalName || ''), { id: c.id, regionalName: c.regionalName }])
            )

            communities = sanityCommunities
                .map((community: any) => {
                    const transformed = community.slug.replace(/-/g, '_').toUpperCase()
                    // 1) exact transform match, 2) fuzzy normalized match
                    let match = regionalNameToId.get(transformed)
                        ? { id: regionalNameToId.get(transformed)!, regionalName: transformed }
                        : normalizedDbIds.get(norm(transformed))

                    if (!match) {
                        console.warn(`[Onboarding] ⚠️ No DB community matched Sanity slug "${community.slug}" (tried "${transformed}") — it will be MISSING from onboarding. Check the RegionalCommunityName enum vs the Sanity slug.`)
                        return null
                    }
                    return {
                        id: match.id,
                        slug: community.slug,
                        name: community.name,
                        type: 'REGIONAL',
                        regionalName: match.regionalName,
                    }
                })
                .filter(Boolean)
        }

        console.log('[Onboarding] Communities loaded:', communities.length)
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
