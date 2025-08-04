import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Type-safe user data schemas
const ClerkUserSchema = z.object({
    id: z.string(),
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    username: z.string().nullable(),
    emailAddresses: z.array(z.object({
        emailAddress: z.string(),
        verification: z.object({
            status: z.string()
        }).optional()
    })),
    imageUrl: z.string().nullable(),
})

export type ClerkUser = z.infer<typeof ClerkUserSchema>

export class UserSyncService {
    /**
     * Get primary email from Clerk email addresses
     */
    private static getPrimaryEmail(emailAddresses: ClerkUser['emailAddresses']): string | null {
        const verifiedEmail = emailAddresses.find(email =>
            email.verification?.status === 'verified'
        )
        return verifiedEmail?.emailAddress || emailAddresses[0]?.emailAddress || null
    }

    /**
     * Sync user from Clerk to Prisma (webhook handler)
     */
    static async syncFromClerk(clerkUserId: string): Promise<{ success: boolean; action: string }> {
        try {
            const clerkClientInstance = await clerkClient()
            const clerkUser = await clerkClientInstance.users.getUser(clerkUserId)

            const validatedClerkData = ClerkUserSchema.parse({
                id: clerkUser.id,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                username: clerkUser.username,
                emailAddresses: clerkUser.emailAddresses,
                imageUrl: clerkUser.imageUrl,
            })

            const existingUser = await prisma.user.findUnique({
                where: { id: clerkUserId }
            })

            const updateData = {
                firstName: validatedClerkData.firstName,
                lastName: validatedClerkData.lastName,
                username: validatedClerkData.username,
                email: this.getPrimaryEmail(validatedClerkData.emailAddresses),
                image: validatedClerkData.imageUrl,
                emailVerified: validatedClerkData.emailAddresses.some(email =>
                    email.verification?.status === 'verified'
                ) ? new Date() : null,
            }

            if (existingUser) {
                await prisma.user.update({
                    where: { id: clerkUserId },
                    data: { ...updateData, updatedAt: new Date() }
                })
                return { success: true, action: 'updated' }
            } else {
                await prisma.user.create({
                    data: {
                        id: validatedClerkData.id,
                        ...updateData,
                        workTypes: [],
                        expertiseAreas: [],
                    }
                })
                return { success: true, action: 'created' }
            }
        } catch (error) {
            console.error('Clerk to Prisma sync failed:', error)
            return { success: false, action: 'failed' }
        }
    }

    /**
     * Sync basic profile data from Prisma to Clerk (after profile updates)
     */
    static async syncToClerk(userId: string): Promise<{ success: boolean }> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    firstName: true,
                    lastName: true,
                    username: true,
                    image: true,
                    bio: true,
                    country: true,
                    city: true,
                    organization: true,
                    position: true,
                }
            })

            if (!user) {
                return { success: false }
            }

            const clerkClientInstance = await clerkClient()
            await clerkClientInstance.users.updateUser(userId, {
                firstName: user.firstName || undefined,
                lastName: user.lastName || undefined,
                username: user.username || undefined,
                publicMetadata: {
                    bio: user.bio,
                    country: user.country,
                    city: user.city,
                    organization: user.organization,
                    position: user.position,
                    avatarUrl: user.image,
                    lastSyncedAt: new Date().toISOString(),
                }
            })

            return { success: true }
        } catch (error) {
            console.error('Prisma to Clerk sync failed:', error)
            return { success: false }
        }
    }

    /**
     * Delete user from Prisma (webhook handler)
     */
    static async deleteUser(userId: string): Promise<{ success: boolean }> {
        try {
            await prisma.user.delete({ where: { id: userId } })
            return { success: true }
        } catch (error) {
            console.error('User deletion failed:', error)
            return { success: false }
        }
    }
}

export const userSync = UserSyncService
