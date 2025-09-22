"use server"

import { prisma } from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server'
import { unstable_cache } from 'next/cache'

export interface ProfileData {
    id: string
    firstName?: string | null
    lastName?: string | null
    username?: string | null
    image?: string | null
    email?: string | null
    bio?: string | null
    ageGroup?: 'UNDER_18' | 'ABOVE_18' | null
    country?: string | null
    city?: string | null
    workTypes: string[]
    expertiseAreas: string[]
    organization?: string | null
    position?: string | null
    workBio?: string | null
    personalWebsite?: string | null
    linkedinProfile?: string | null
    otherSocialLinks: Array<{platform: string, url: string}>
    role: string
    createdAt: Date
    updatedAt: Date
    recentWork: Array<{
        id: string
        title: string
        description: string
        link?: string | null
        isOngoing: boolean
        startDate: Date
        endDate?: Date | null
    }>
    communities: Array<{
        id: string
        name: string
        type: 'REGIONAL' | 'SPECIAL'
        regionalName?: string | null
        specialName?: string | null
    }>
    displayName: string
    fullName: string
    initials: string
    location: string
    work: string
}

// Cache profile data for 5 minutes
const getCachedUserProfile = unstable_cache(
    async (username: string): Promise<ProfileData | null> => {
        const user = await prisma.user.findUnique({
            where: { username },
            include: {
                recentWork: {
                    orderBy: { startDate: 'desc' },
                    take: 5
                },
                communityMemberships: {
                    include: {
                        community: true
                    }
                }
            }
        })

        if (!user) {
            return null
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const location = [user.city, user.country].filter(Boolean).join(', ')
        const work = [user.position, user.organization].filter(Boolean).join(' at ')
        const displayName = fullName || user.username || 'Unnamed User'
        const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
            user.username?.[0]?.toUpperCase() || '??'

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            image: user.image,
            email: user.email,
            bio: user.bio,
            ageGroup: user.ageGroup,
            country: user.country,
            city: user.city,
            workTypes: user.workTypes,
            expertiseAreas: user.expertiseAreas,
            organization: user.organization,
            position: user.position,
            workBio: user.workBio,
            personalWebsite: user.personalWebsite,
            linkedinProfile: user.linkedinProfile,
            otherSocialLinks: (user.otherSocialLinks as Array<{platform: string, url: string}>) || [],
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            recentWork: user.recentWork,
            communities: user.communityMemberships.map(membership => membership.community),
            // CRITICAL: Actually return the computed properties
            displayName,
            fullName,
            initials,
            location,
            work
        }
    },
    ['profile'],
    {
        revalidate: 300, // 5 minutes
        tags: ['profile']
    }
)

export async function getUserProfile(username: string): Promise<ProfileData | null> {
    try {
        return await getCachedUserProfile(username)
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
}

export async function checkProfileOwnership(profileUserId: string): Promise<boolean> {
    try {
        const { userId } = await auth() // CRITICAL: await auth()
        return userId === profileUserId
    } catch (error) {
        console.error('Error checking profile ownership:', error)
        return false
    }
}

export async function getProfileMetadata(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                firstName: true,
                lastName: true,
                username: true,
                bio: true,
                image: true
            }
        })

        if (!user) {
            return null
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const displayName = fullName || user.username || 'User Profile'
        const description = user.bio || `View ${displayName}'s profile and work.`

        return {
            title: displayName,
            description,
            image: user.image
        }
    } catch (error) {
        console.error('Error fetching profile metadata:', error)
        return null
    }
}
