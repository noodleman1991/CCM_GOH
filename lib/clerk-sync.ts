import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma"

interface ClerkSyncOptions {
  userId: string
  direction?: 'to_clerk' | 'from_clerk' | 'bidirectional'
  fields?: string[]
}

/**
 * Bidirectional sync service between Clerk and Prisma
 * Implements 2025 best practices for data synchronization
 */
export class ClerkSyncService {
  /**
   * Sync user data from Prisma to Clerk
   */
  static async syncToClerk(userId: string, userData: Partial<User>): Promise<boolean> {
    try {
      console.log(`🔄 Syncing user ${userId} to Clerk`)
      
      const clerkClientInstance = await clerkClient()
      
      await clerkClientInstance.users.updateUser(userId, {
        firstName: userData.firstName || undefined,
        lastName: userData.lastName || undefined,
        username: userData.username || undefined,
        publicMetadata: {
          // App-managed profile data
          bio: userData.bio,
          ageGroup: userData.ageGroup,
          country: userData.country,
          city: userData.city,
          workTypes: userData.workTypes,
          expertiseAreas: userData.expertiseAreas,
          organization: userData.organization,
          position: userData.position,
          workBio: userData.workBio,
          personalWebsite: userData.personalWebsite,
          linkedinProfile: userData.linkedinProfile,
          otherSocialLinks: userData.otherSocialLinks || [],
          
          // Privacy settings
          isSearchable: userData.isSearchable,
          profileVisibility: userData.profileVisibility,
          showEmail: userData.showEmail,
          showPhoneNumber: userData.showPhoneNumber,
          showWorkDetails: userData.showWorkDetails,
          showSocialLinks: userData.showSocialLinks,
          showLocation: userData.showLocation,
          
          // Sync timestamp
          lastSyncedAt: new Date().toISOString(),
          syncedFrom: 'prisma'
        }
      })
      
      console.log(`✅ Successfully synced user ${userId} to Clerk`)
      return true
    } catch (error) {
      console.error(`❌ Failed to sync user ${userId} to Clerk:`, error)
      return false
    }
  }

  /**
   * Sync user data from Clerk to Prisma
   */
  static async syncFromClerk(userId: string): Promise<boolean> {
    try {
      console.log(`🔄 Syncing user ${userId} from Clerk`)
      
      const clerkClientInstance = await clerkClient()
      const clerkUser = await clerkClientInstance.users.getUser(userId)
      
      const metadata = clerkUser.publicMetadata as any
      
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          image: clerkUser.imageUrl,
          emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified' 
            ? new Date() : null,
          phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || null,
          phoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === 'verified' 
            ? new Date() : null,
          
          // App-specific data from metadata
          bio: metadata?.bio || null,
          ageGroup: metadata?.ageGroup || null,
          country: metadata?.country || null,
          city: metadata?.city || null,
          workTypes: metadata?.workTypes || [],
          expertiseAreas: metadata?.expertiseAreas || [],
          organization: metadata?.organization || null,
          position: metadata?.position || null,
          workBio: metadata?.workBio || null,
          personalWebsite: metadata?.personalWebsite || null,
          linkedinProfile: metadata?.linkedinProfile || null,
          otherSocialLinks: metadata?.otherSocialLinks || [],
          
          // Privacy settings
          isSearchable: metadata?.isSearchable ?? true,
          profileVisibility: metadata?.profileVisibility || 'PUBLIC',
          showEmail: metadata?.showEmail ?? false,
          showPhoneNumber: metadata?.showPhoneNumber ?? false,
          showWorkDetails: metadata?.showWorkDetails ?? true,
          showSocialLinks: metadata?.showSocialLinks ?? true,
          showLocation: metadata?.showLocation ?? true,
        },
        update: {
          email: clerkUser.primaryEmailAddress?.emailAddress || null,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
          image: clerkUser.imageUrl,
          emailVerified: clerkUser.primaryEmailAddress?.verification?.status === 'verified' 
            ? new Date() : null,
          phoneNumber: clerkUser.primaryPhoneNumber?.phoneNumber || null,
          phoneVerified: clerkUser.primaryPhoneNumber?.verification?.status === 'verified' 
            ? new Date() : null,
          
          // Update app-specific data only if metadata exists
          ...(metadata?.bio !== undefined && { bio: metadata.bio }),
          ...(metadata?.ageGroup !== undefined && { ageGroup: metadata.ageGroup }),
          ...(metadata?.country !== undefined && { country: metadata.country }),
          ...(metadata?.city !== undefined && { city: metadata.city }),
          ...(metadata?.workTypes !== undefined && { workTypes: metadata.workTypes }),
          ...(metadata?.expertiseAreas !== undefined && { expertiseAreas: metadata.expertiseAreas }),
          ...(metadata?.organization !== undefined && { organization: metadata.organization }),
          ...(metadata?.position !== undefined && { position: metadata.position }),
          ...(metadata?.workBio !== undefined && { workBio: metadata.workBio }),
          ...(metadata?.personalWebsite !== undefined && { personalWebsite: metadata.personalWebsite }),
          ...(metadata?.linkedinProfile !== undefined && { linkedinProfile: metadata.linkedinProfile }),
          ...(metadata?.otherSocialLinks !== undefined && { otherSocialLinks: metadata.otherSocialLinks }),
          
          // Update privacy settings
          ...(metadata?.isSearchable !== undefined && { isSearchable: metadata.isSearchable }),
          ...(metadata?.profileVisibility !== undefined && { profileVisibility: metadata.profileVisibility }),
          ...(metadata?.showEmail !== undefined && { showEmail: metadata.showEmail }),
          ...(metadata?.showPhoneNumber !== undefined && { showPhoneNumber: metadata.showPhoneNumber }),
          ...(metadata?.showWorkDetails !== undefined && { showWorkDetails: metadata.showWorkDetails }),
          ...(metadata?.showSocialLinks !== undefined && { showSocialLinks: metadata.showSocialLinks }),
          ...(metadata?.showLocation !== undefined && { showLocation: metadata.showLocation }),
          
          updatedAt: new Date(),
        }
      })
      
      console.log(`✅ Successfully synced user ${userId} from Clerk`)
      return true
    } catch (error) {
      console.error(`❌ Failed to sync user ${userId} from Clerk:`, error)
      return false
    }
  }

  /**
   * Perform bidirectional sync check
   * Compares timestamps to determine sync direction
   */
  static async bidirectionalSync(userId: string): Promise<boolean> {
    try {
      const clerkClientInstance = await clerkClient()
      const [clerkUser, prismaUser] = await Promise.all([
        clerkClientInstance.users.getUser(userId),
        prisma.user.findUnique({ where: { id: userId } })
      ])
      
      if (!clerkUser && !prismaUser) {
        console.log(`No user found in either system for ${userId}`)
        return false
      }
      
      if (!clerkUser && prismaUser) {
        // User deleted from Clerk but exists in Prisma - delete from Prisma
        await prisma.user.delete({ where: { id: userId } })
        console.log(`🗑️ Deleted user ${userId} from Prisma (not found in Clerk)`)
        return true
      }
      
      if (clerkUser && !prismaUser) {
        // User exists in Clerk but not Prisma - create in Prisma
        return await this.syncFromClerk(userId)
      }
      
      // Both exist - check timestamps to determine sync direction
      const clerkUpdatedAt = new Date(clerkUser.updatedAt)
      const prismaUpdatedAt = prismaUser!.updatedAt
      const metadata = clerkUser.publicMetadata as any
      const clerkSyncedAt = metadata?.lastSyncedAt ? new Date(metadata.lastSyncedAt) : null
      
      if (clerkSyncedAt && clerkSyncedAt > prismaUpdatedAt) {
        // Clerk data is more recent
        return await this.syncFromClerk(userId)
      } else if (prismaUpdatedAt > clerkUpdatedAt) {
        // Prisma data is more recent
        return await this.syncToClerk(userId, prismaUser!)
      }
      
      console.log(`📊 User ${userId} already in sync`)
      return true
    } catch (error) {
      console.error(`❌ Bidirectional sync failed for user ${userId}:`, error)
      return false
    }
  }

  /**
   * Bulk sync for data migration or maintenance
   */
  static async bulkSync(direction: 'to_clerk' | 'from_clerk' | 'bidirectional' = 'bidirectional'): Promise<{
    success: number
    failed: number
    errors: string[]
  }> {
    const result = { success: 0, failed: 0, errors: [] as string[] }
    
    try {
      let userIds: string[] = []
      
      if (direction === 'to_clerk' || direction === 'bidirectional') {
        const prismaUsers = await prisma.user.findMany({ select: { id: true } })
        userIds = [...new Set([...userIds, ...prismaUsers.map(u => u.id)])]
      }
      
      if (direction === 'from_clerk' || direction === 'bidirectional') {
        const clerkClientInstance = await clerkClient()
        const clerkUsers = await clerkClientInstance.users.getUserList({ limit: 500 })
        userIds = [...new Set([...userIds, ...clerkUsers.data.map(u => u.id)])]
      }
      
      for (const userId of userIds) {
        try {
          let success = false
          
          switch (direction) {
            case 'to_clerk':
              const user = await prisma.user.findUnique({ where: { id: userId } })
              if (user) {
                success = await this.syncToClerk(userId, user)
              }
              break
              
            case 'from_clerk':
              success = await this.syncFromClerk(userId)
              break
              
            case 'bidirectional':
              success = await this.bidirectionalSync(userId)
              break
          }
          
          if (success) {
            result.success++
          } else {
            result.failed++
            result.errors.push(`Failed to sync user ${userId}`)
          }
        } catch (error) {
          result.failed++
          result.errors.push(`Error syncing user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
      
      console.log(`🎯 Bulk sync completed: ${result.success} success, ${result.failed} failed`)
      return result
    } catch (error) {
      console.error('❌ Bulk sync failed:', error)
      result.errors.push(`Bulk sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }
}

export default ClerkSyncService