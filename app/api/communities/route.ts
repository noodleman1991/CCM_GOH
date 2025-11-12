import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRegionalCommunities } from "@/sanity/queries/regional-communities"

/**
 * GET /api/communities
 * Returns all REGIONAL communities with i18n names from Sanity
 * Joins with database to get IDs for user profiles
 * Public endpoint - no authentication required for onboarding
 */
export async function GET() {
    try {
        // Fetch communities from Sanity (source of truth for names and translations)
        const sanityCommunities = await getRegionalCommunities()

        // Fetch from database to get IDs for joining with user profiles
        const dbCommunities = await prisma.community.findMany({
            where: { type: 'REGIONAL' },
            select: {
                id: true,
                regionalName: true
            }
        })

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
                    console.warn(`No database record found for regional community: ${community.slug}`)
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

        return NextResponse.json({
            success: true,
            data: communities
        })
    } catch (error) {
        console.error("Failed to fetch communities:", error)
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
