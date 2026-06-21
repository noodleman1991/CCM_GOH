"use server"

import { prisma } from "@/lib/prisma"
import { auth } from '@clerk/nextjs/server'
import { unstable_cache } from 'next/cache'
import { UserService } from '@/lib/services/user.service'
import { calculateProfileCompleteness } from '@/lib/profile-completeness'
import { getLocale } from 'next-intl/server'
import type { SupportedLocale } from '@/types/prisma'

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
    profileCompleteness: number
    createdAt: Date
    updatedAt: Date
    // Domain-rich fields (K4)
    headline?: string | null
    pronouns?: string | null
    languages: string[]
    focusTopics: string[]
    motivation?: string | null
    openToCollaboration: boolean
    lookingFor: string[]
    collaborationInterests?: string | null
    livedExperienceStatement?: string | null // redacted unless showLivedExperience
    orcidId?: string | null
    recentWork: Array<{
        id: string
        title: string
        description: string
        link?: string | null
        isOngoing: boolean
        startDate: Date
        endDate?: Date | null
        role?: string | null
        collaborators?: string | null
        outcome?: string | null
        imageUrl?: string | null
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

/**
 * Get user profile with privacy enforcement
 * Uses UserService.getUserForProfile which:
 * - Enforces privacy at query level (profile visibility)
 * - Redacts private fields based on user settings (showEmail, showWorkDetails, etc.)
 * - Only transmits data that the viewer is allowed to see
 */
export async function getUserProfile(username: string): Promise<ProfileData | null> {
    try {
        // Get current user ID (viewer)
        const { userId: viewerId } = await auth()

        // Get locale for internationalization
        const locale = await getLocale() as SupportedLocale

        // Use privacy-aware query
        const result = await UserService.getUserForProfile(
            username,
            viewerId || null,
            { locale }
        )

        if (!result.success || !result.data) {
            return null
        }

        const user = result.data as any // Type assertion for relations

        // The owner sees their hidden items (so they can manage them); visitors
        // never see items the owner hid. Already ordered pinned-first upstream.
        const isOwner = Boolean(viewerId && viewerId === user.id)
        const recentWork = isOwner
            ? (user.recentWork || [])
            : (user.recentWork || []).filter((w: any) => !w.hidden)

        // Compute derived fields
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
        const location = [user.city, user.country].filter(Boolean).join(', ')
        const work = [user.position, user.organization].filter(Boolean).join(' at ')
        const displayName = user.displayName || fullName || user.username || 'Unnamed User'
        const initials = user.initials ||
            `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
            user.username?.[0]?.toUpperCase() || '??'

        return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            image: user.image,
            email: user.email, // Already redacted by getUserForProfile if showEmail=false
            bio: user.bio,
            ageGroup: user.ageGroup,
            country: user.country, // Already redacted if showLocation=false
            city: user.city, // Already redacted if showLocation=false
            workTypes: user.workTypes || [],
            expertiseAreas: user.expertiseAreas || [],
            organization: user.organization, // Already redacted if showWorkDetails=false
            position: user.position, // Already redacted if showWorkDetails=false
            workBio: user.workBio, // Already redacted if showWorkDetails=false
            personalWebsite: user.personalWebsite, // Already redacted if showSocialLinks=false
            linkedinProfile: user.linkedinProfile, // Already redacted if showSocialLinks=false
            otherSocialLinks: (user.otherSocialLinks as Array<{platform: string, url: string}>) || [],
            role: user.role,
            profileCompleteness: calculateProfileCompleteness(user),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            headline: user.headline,
            pronouns: user.pronouns,
            languages: user.languages || [],
            focusTopics: user.focusTopics || [],
            motivation: user.motivation,
            openToCollaboration: user.openToCollaboration ?? false,
            lookingFor: user.lookingFor || [],
            collaborationInterests: user.collaborationInterests,
            livedExperienceStatement: user.livedExperienceStatement, // null if redacted
            orcidId: user.orcidId,
            recentWork,
            communities: user.communityMemberships?.map((cm: any) => cm.community) || [],
            displayName,
            fullName,
            initials,
            location,
            work
        }
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
