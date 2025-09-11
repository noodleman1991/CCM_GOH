import { prisma, safeQuery, createLocalizedQuery } from '@/lib/prisma'
import { getLocalizedValue, isRTL } from '@/i18n/i18n-helpers'
import type {
  UserWithProfile,
  LocalizedUser,
  UserSearchFilters,
  UserQueryResult,
  UserProfileUpdateData,
  DatabaseResult,
  SupportedLocale,
  LocalizedQueryOptions,
  PaginatedResult
} from '@/types/prisma'
import type { User, Prisma } from '@/generated/prisma'

export class UserService {
  /**
   * Get user by ID with full type safety and localization support
   */
  static async getUserById(
    userId: string,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedUser | null>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          accounts: true,
          sessions: true,
          communityMemberships: {
            include: {
              community: true
            }
          },
          recentWork: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      if (!user) return null

      return this.transformToLocalizedUser(user, localizedQuery)
    })
  }

  /**
   * Get user by username with localization
   */
  static async getUserByUsername(
    username: string,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedUser | null>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const user = await prisma.user.findUnique({
        where: { username },
        include: {
          communityMemberships: {
            include: {
              community: true
            }
          },
          recentWork: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      if (!user) return null

      return this.transformToLocalizedUser(user, localizedQuery)
    })
  }

  /**
   * Search users with filters, pagination, and localization
   */
  static async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    pageSize: number = 20,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<UserQueryResult>> {
    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize
    
    return safeQuery(async () => {
      // Build where clause based on filters
      const where: Prisma.UserWhereInput = {
        isSearchable: filters.isSearchable ?? true,
        ...(filters.workTypes?.length && {
          workTypes: { hasSome: filters.workTypes }
        }),
        ...(filters.expertiseAreas?.length && {
          expertiseAreas: { hasSome: filters.expertiseAreas }
        }),
        ...(filters.countries?.length && {
          country: { in: filters.countries }
        }),
        ...(filters.ageGroups?.length && {
          ageGroup: { in: filters.ageGroups }
        }),
        ...(filters.roles?.length && {
          role: { in: filters.roles }
        }),
        ...(filters.profileVisibility?.length && {
          profileVisibility: { in: filters.profileVisibility }
        })
      }

      // Get total count and paginated results in parallel
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            communityMemberships: {
              include: {
                community: true
              }
            },
            recentWork: {
              orderBy: { createdAt: 'desc' },
              take: 3
            }
          },
          orderBy: [
            { updatedAt: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: pageSize
        }),
        prisma.user.count({ where })
      ])

      // Transform users to localized format
      const localizedUsers = users.map(user => 
        this.transformToLocalizedUser(user, localizedQuery)
      )

      return {
        data: localizedUsers,
        total,
        page,
        pageSize,
        hasNext: skip + pageSize < total,
        hasPrev: page > 1,
        filters
      }
    })
  }

  /**
   * Update user profile with validation and type safety
   */
  static async updateUserProfile(
    userId: string,
    updateData: UserProfileUpdateData,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedUser>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      // Validate unique constraints
      if (updateData.username) {
        const existingUser = await prisma.user.findUnique({
          where: { username: updateData.username }
        })
        
        if (existingUser && existingUser.id !== userId) {
          throw new Error('Username already taken')
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          communityMemberships: {
            include: {
              community: true
            }
          },
          recentWork: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      })

      return this.transformToLocalizedUser(updatedUser, localizedQuery)
    })
  }

  /**
   * Get user statistics and analytics
   */
  static async getUserStats(userId: string): Promise<DatabaseResult<{
    profileCompleteness: number
    totalCommunities: number
    totalRecentWork: number
    joinedDate: Date
  }>> {
    return safeQuery(async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          communityMemberships: true,
          recentWork: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Calculate profile completeness
      const fields = [
        user.firstName,
        user.lastName,
        user.bio,
        user.workTypes.length > 0,
        user.expertiseAreas.length > 0,
        user.country,
        user.organization
      ]
      
      const completedFields = fields.filter(Boolean).length
      const profileCompleteness = Math.round((completedFields / fields.length) * 100)

      return {
        profileCompleteness,
        totalCommunities: user.communityMemberships.length,
        totalRecentWork: user.recentWork.length,
        joinedDate: user.createdAt
      }
    })
  }

  /**
   * Transform user data to localized format with computed fields
   */
  private static transformToLocalizedUser(
    user: User & {
      communityMemberships?: any[]
      recentWork?: any[]
    },
    localizedQuery: ReturnType<typeof createLocalizedQuery>
  ): LocalizedUser {
    // Generate display name with RTL support
    const displayName = this.generateDisplayName(user, localizedQuery.isRTL)
    
    // Generate full name
    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ') || user.username || 'Anonymous User'
    
    // Generate initials
    const initials = this.generateInitials(user.firstName, user.lastName, user.username)

    return {
      ...user,
      displayName,
      fullName,
      initials,
      // Future: Add localized fields when needed
      localizedBio: user.bio ? { [localizedQuery.locale]: user.bio } : undefined,
      localizedWorkBio: user.workBio ? { [localizedQuery.locale]: user.workBio } : undefined,
      localizedOrganization: user.organization ? { [localizedQuery.locale]: user.organization } : undefined,
      localizedPosition: user.position ? { [localizedQuery.locale]: user.position } : undefined
    }
  }

  /**
   * Generate display name with RTL support
   */
  private static generateDisplayName(user: User, isRTL: boolean): string {
    if (user.firstName && user.lastName) {
      return isRTL 
        ? `${user.lastName} ${user.firstName}` // Arabic: family name first
        : `${user.firstName} ${user.lastName}`
    }
    
    if (user.firstName) return user.firstName
    if (user.lastName) return user.lastName
    if (user.username) return user.username
    
    return 'Anonymous User'
  }

  /**
   * Generate user initials
   */
  private static generateInitials(
    firstName?: string | null, 
    lastName?: string | null, 
    username?: string | null
  ): string {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    
    if (firstName) return firstName.charAt(0).toUpperCase()
    if (lastName) return lastName.charAt(0).toUpperCase()
    if (username) return username.charAt(0).toUpperCase()
    
    return 'A'
  }

  /**
   * Bulk operations for admin/system use
   */
  static async getUsersForSync(lastSyncDate?: Date): Promise<DatabaseResult<User[]>> {
    return safeQuery(async () => {
      return prisma.user.findMany({
        where: lastSyncDate ? {
          updatedAt: { gte: lastSyncDate }
        } : {},
        orderBy: { updatedAt: 'desc' }
      })
    })
  }
}

export default UserService