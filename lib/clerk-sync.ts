import { clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { User } from "@/generated/prisma"

/**
 * What this service (and every other writer in the codebase — the onboarding
 * complete/waive routes and the profile route) puts in Clerk `publicMetadata`.
 * Prisma owns all profile data; Clerk carries onboarding state and language so
 * the session claim can gate routes without a database read.
 *
 * Until 2026-09-16 the reader below expected twenty profile keys here (bio,
 * workTypes, every privacy flag…) that no writer ever set, and copied any it
 * found over the Prisma row. Writer and reader now share this one shape.
 */
interface ClerkSyncMetadata {
  onboardingCompleted?: boolean
  preferredLanguage?: string
  lastSyncedAt?: string
  syncedFrom?: string
}

type PreferredLanguage = NonNullable<User["preferredLanguage"]>

const PREFERRED_LANGUAGES = ["EN", "ES", "FR", "AR"] as const satisfies readonly PreferredLanguage[]

function isPreferredLanguage(value: unknown): value is PreferredLanguage {
  return typeof value === "string" && (PREFERRED_LANGUAGES as readonly string[]).includes(value)
}

/**
 * The Prisma columns Clerk metadata is allowed to set, validated: a boolean
 * `onboardingCompleted`, a `preferredLanguage` the enum knows. Anything else
 * in the metadata — however it got there — is ignored.
 */
function syncableFromMetadata(metadata: unknown): Partial<Pick<User, "onboardingCompleted" | "preferredLanguage">> {
  const pm = (metadata ?? {}) as ClerkSyncMetadata
  const out: Partial<Pick<User, "onboardingCompleted" | "preferredLanguage">> = {}
  if (typeof pm.onboardingCompleted === "boolean") out.onboardingCompleted = pm.onboardingCompleted
  if (isPreferredLanguage(pm.preferredLanguage)) out.preferredLanguage = pm.preferredLanguage
  return out
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
          onboardingCompleted: userData.onboardingCompleted,
          preferredLanguage: userData.preferredLanguage,
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
      
      // Only onboarding state and language come back from Clerk. Profile data
      // (bio, work, privacy flags) lives in Prisma alone and is never read
      // from metadata — see ClerkSyncMetadata.
      const syncable = syncableFromMetadata(clerkUser.publicMetadata)

      // Clerk-managed identity fields: Clerk is the source of truth for these.
      const identity = {
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
      }

      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          ...identity,
          ...syncable,

          // Defaults for a row that did not exist yet — the same ones the
          // Clerk webhook's user.created uses. Never sourced from metadata.
          workTypes: [],
          expertiseAreas: [],
          isSearchable: true,
          profileVisibility: 'PUBLIC',
          showEmail: false,
          showPhoneNumber: false,
          showWorkDetails: true,
          showSocialLinks: true,
          showLocation: true,
        },
        update: {
          ...identity,
          ...syncable,
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
        // A Prisma row with no Clerk user. Never deleted from a sync path —
        // account erasure goes through `deleteUserData` (the in-app flow and
        // the Clerk `user.deleted` webhook), which hands off workspaces and
        // sweeps R2/Resend/CMS first. A raw delete here skipped all of that.
        // (In practice `getUser` throws on an unknown id, so this branch is a
        // guard rather than a path.)
        console.warn(`⚠️ User ${userId} exists in Prisma but not in Clerk — not deleting from a sync; use deleteUserData`)
        return false
      }
      
      if (clerkUser && !prismaUser) {
        // User exists in Clerk but not Prisma - create in Prisma
        return await this.syncFromClerk(userId)
      }
      
      // Both exist - check timestamps to determine sync direction
      const clerkUpdatedAt = new Date(clerkUser.updatedAt)
      const prismaUpdatedAt = prismaUser!.updatedAt
      const metadata = clerkUser.publicMetadata as ClerkSyncMetadata
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