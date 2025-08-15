import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export class UserSync {
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
}

export const userSync = UserSync
