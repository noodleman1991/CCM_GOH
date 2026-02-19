import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegionalCommunities } from "@/sanity/queries/regional-communities"

// Fallback communities with multilingual names (all 4 languages)
const FALLBACK_COMMUNITIES = [
    {
        slug: 'sub-saharan-africa',
        regionalName: 'SUB_SAHARAN_AFRICA',
        name: {
            en: 'Sub-Saharan Africa',
            es: 'África subsahariana',
            fr: 'Afrique subsaharienne',
            ar: 'أفريقيا جنوب الصحراء'
        }
    },
    {
        slug: 'northern-africa-and-western-asia',
        regionalName: 'NORTHERN_AFRICA_AND_WESTERN_ASIA',
        name: {
            en: 'Northern Africa and Western Asia',
            es: 'África del Norte y Asia Occidental',
            fr: 'Afrique du Nord et Asie occidentale',
            ar: 'شمال أفريقيا وغرب آسيا'
        }
    },
    {
        slug: 'central-and-southern-asia',
        regionalName: 'CENTRAL_AND_SOUTHERN_ASIA',
        name: {
            en: 'Central and Southern Asia',
            es: 'Asia Central y del Sur',
            fr: 'Asie centrale et du Sud',
            ar: 'وسط وجنوب آسيا'
        }
    },
    {
        slug: 'eastern-and-south-eastern-asia',
        regionalName: 'EASTERN_AND_SOUTH_EASTERN_ASIA',
        name: {
            en: 'Eastern and South-Eastern Asia',
            es: 'Asia Oriental y Sudoriental',
            fr: 'Asie de l\'Est et du Sud-Est',
            ar: 'شرق وجنوب شرق آسيا'
        }
    },
    {
        slug: 'latin-america-and-the-caribbean',
        regionalName: 'LATIN_AMERICA_AND_THE_CARIBBEAN',
        name: {
            en: 'Latin America and the Caribbean',
            es: 'América Latina y el Caribe',
            fr: 'Amérique latine et Caraïbes',
            ar: 'أمريكا اللاتينية والكاريبي'
        }
    },
    {
        slug: 'oceania',
        regionalName: 'OCEANIA',
        name: {
            en: 'Oceania',
            es: 'Oceanía',
            fr: 'Océanie',
            ar: 'أوقيانوسيا'
        }
    },
    {
        slug: 'europe-and-north-america',
        regionalName: 'EUROPE_AND_NORTH_AMERICA',
        name: {
            en: 'Europe and North America',
            es: 'Europa y América del Norte',
            fr: 'Europe et Amérique du Nord',
            ar: 'أوروبا وأمريكا الشمالية'
        }
    }
]

/**
 * GET /api/communities
 * Returns all REGIONAL communities with i18n names from Sanity
 * Joins with database to get IDs for user profiles
 * Public endpoint - no authentication required for onboarding
 */
export async function GET() {
    try {
        console.log('[API /communities] Fetching communities...')

        // Fetch communities from Sanity (source of truth for names and translations)
        const sanityCommunities = await getRegionalCommunities()
        console.log('[API /communities] Sanity returned:', sanityCommunities?.length || 0, 'communities')

        // Fetch from database to get IDs for joining with user profiles
        const dbCommunities = await prisma.community.findMany({
            where: { type: 'REGIONAL' },
            select: {
                id: true,
                name: true,
                regionalName: true
            }
        })
        console.log('[API /communities] Database has:', dbCommunities.length, 'communities')

        // If Sanity is empty, use hardcoded fallback with multilingual support
        if (!sanityCommunities || sanityCommunities.length === 0) {
            console.warn('[API /communities] ⚠️ No communities in Sanity, using hardcoded fallback')

            // Create a map of regionalName -> database ID
            const regionalNameToId = new Map(
                dbCommunities.map(c => [c.regionalName, c.id])
            )

            const fallbackCommunities = FALLBACK_COMMUNITIES
                .map(community => {
                    const dbId = regionalNameToId.get(community.regionalName as any)

                    // Only include if we have a matching database record
                    if (!dbId) {
                        console.warn(`[API /communities] No database record found for: ${community.slug} (${community.regionalName})`)
                        return null
                    }

                    return {
                        id: dbId,
                        slug: community.slug,
                        name: community.name, // Full i18n object with en, es, fr, ar
                        type: 'REGIONAL',
                        regionalName: community.regionalName
                    }
                })
                .filter(Boolean) // Remove null entries

            return NextResponse.json({
                success: true,
                data: fallbackCommunities,
                source: 'fallback'
            })
        }

        // Create a map of regionalName -> database ID
        const regionalNameToId = new Map(
            dbCommunities.map(c => [c.regionalName, c.id])
        )

        // Merge Sanity data with database IDs
        const communities = sanityCommunities
            .map((community: any) => {
                // Map Sanity slug to database regionalName enum
                // e.g., "sub-saharan-africa" -> "SUB_SAHARAN_AFRICA"
                const regionalName = community.slug
                    .replace(/-/g, '_')
                    .toUpperCase()

                const dbId = regionalNameToId.get(regionalName)

                // Only include if we have a matching database record
                if (!dbId) {
                    console.warn(`[API /communities] No database record found for: ${community.slug} (${regionalName})`)
                    return null
                }

                return {
                    id: dbId,
                    slug: community.slug,
                    name: community.name, // Full i18n object with en, es, fr, ar
                    type: 'REGIONAL',
                    regionalName
                }
            })
            .filter(Boolean) // Remove null entries

        console.log('[API /communities] Returning', communities.length, 'merged communities')

        return NextResponse.json({
            success: true,
            data: communities,
            source: 'sanity'
        })
    } catch (error) {
        console.error("[API /communities] ❌ Failed to fetch communities:", error)
        console.error("[API /communities] Error details:", error instanceof Error ? error.message : String(error))

        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch communities",
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
