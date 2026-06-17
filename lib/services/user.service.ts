import { prisma, safeQuery, createLocalizedQuery } from '@/lib/prisma'
import { getLocalizedValue, isRTL } from '@/i18n/i18n-helpers'
import { redactUser } from './user-redaction'
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
import { Prisma } from '@/generated/prisma'
import type { User } from '@/generated/prisma'

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
          // Removed accounts and sessions - not needed for profile display/edit
          communityMemberships: {
            include: {
              community: true
            }
          },
          recentWork: {
            orderBy: { createdAt: 'desc' },
            take: 10  // Increased from 5 to 10 for profile edit form
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
   * Build privacy-aware where clause based on authentication status
   * This enforces privacy settings at the database query level
   */
  private static getPrivacyWhereClause(isAuthenticated: boolean): Prisma.UserWhereInput {
    // Base privacy filter: only searchable users
    const baseFilter: Prisma.UserWhereInput = {
      isSearchable: true
    }

    // Add visibility filter based on authentication
    if (isAuthenticated) {
      // Authenticated users can see PUBLIC and MEMBERS profiles
      baseFilter.profileVisibility = {
        in: ['PUBLIC', 'MEMBERS']
      }
    } else {
      // Unauthenticated users can only see PUBLIC profiles
      baseFilter.profileVisibility = 'PUBLIC'
    }

    return baseFilter
  }

  /**
   * Search users with filters, pagination, and localization
   * Privacy-first: Filters at database level based on authentication status
   */
  static async searchUsers(
    filters: UserSearchFilters,
    page: number = 1,
    pageSize: number = 20,
    options: LocalizedQueryOptions & { isAuthenticated?: boolean }
  ): Promise<DatabaseResult<UserQueryResult>> {
    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize

    return safeQuery(async () => {
      // Apply privacy filters at database level
      const privacyFilter = this.getPrivacyWhereClause(options.isAuthenticated ?? false)

      // Build where clause based on filters + privacy
      const where: Prisma.UserWhereInput = {
        ...privacyFilter,
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
      // Apply privacy redaction to each user for external viewing
      const redactedUsers = localizedUsers.map(user => redactUser(user, null))

      return {
        data: redactedUsers,
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

      // Separate relation fields from direct user fields
      const { communityIds, recentWork, ...directUserFields } = updateData

      // Build the Prisma update data object with proper relation syntax
      const prismaUpdateData: any = {
        ...directUserFields
      }

      // Handle community memberships if provided
      if (communityIds !== undefined) {
        prismaUpdateData.communityMemberships = {
          deleteMany: {}, // Clear existing
          create: communityIds.map(communityId => ({
            communityId
          }))
        }
      }

      // Handle recent work if provided
      if (recentWork !== undefined) {
        prismaUpdateData.recentWork = {
          deleteMany: {}, // Clear existing
          create: recentWork.map(work => ({
            title: work.title,
            description: work.description,
            link: work.link || null,
            startDate: new Date(work.startDate),
            endDate: work.endDate ? new Date(work.endDate) : null,
            isOngoing: work.isOngoing || false,
            role: (work as any).role || null,
            collaborators: (work as any).collaborators || null,
            outcome: (work as any).outcome || null,
            imageUrl: (work as any).imageUrl || null
          }))
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: prismaUpdateData,
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

      // Use the profile completeness utility if available
      // For now, keep the simple calculation
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
   * Get user for profile viewing with privacy enforcement
   * Implements two-layer privacy:
   * - Layer 1: Profile-level visibility (post-fetch check)
   * - Layer 2: Field-level redaction (specific field privacy via redactUser)
   */
  static async getUserForProfile(
    identifier: string,  // username or userId
    viewerId: string | null,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedUser | null>> {
    const localizedQuery = createLocalizedQuery(options)

    return safeQuery(async () => {
      // Fetch user by ID or username - don't filter by privacy yet
      // We need the full user to check if it's their own profile
      const where: Prisma.UserWhereInput = {
        OR: [
          { id: identifier },
          { username: identifier }
        ]
      }

      const user = await prisma.user.findFirst({
        where,
        include: {
          communityMemberships: {
            include: {
              community: true
            }
          },
          recentWork: {
            orderBy: { startDate: 'desc' },
            take: 10
          }
        }
      })

      if (!user) return null

      // Now check ownership — identifier may be a username, so compare against fetched user.id
      const isOwnProfile = viewerId !== null && user.id === viewerId

      // Layer 1: Profile-level privacy (post-fetch check)
      if (!isOwnProfile) {
        // Check if user allows viewing
        if (!user.isSearchable) return null
        if (viewerId) {
          // Authenticated viewer: can see PUBLIC and MEMBERS
          if (!['PUBLIC', 'MEMBERS'].includes(user.profileVisibility)) return null
        } else {
          // Anonymous viewer: can only see PUBLIC
          if (user.profileVisibility !== 'PUBLIC') return null
        }
      }

      // Layer 2: Field-level redaction (only if NOT own profile)
      if (isOwnProfile) {
        return this.transformToLocalizedUser(user, localizedQuery)
      }

      const redacted = redactUser(user, viewerId)
      return this.transformToLocalizedUser(redacted, localizedQuery)
    })
  }

  /**
   * Fuzzy search users using PostgreSQL pg_trgm trigram similarity
   * Provides typo-tolerant matching across name, username, bio, organization, and position fields
   * Uses indexed trigram matching for performance
   *
   * @param searchQuery - The search term
   * @param similarityThreshold - Minimum similarity score (0-1), default 0.3
   * @returns Array of users with similarity scores, ordered by relevance
   */
  static async fuzzySearchUsers(
    searchQuery: string,
    options: LocalizedQueryOptions & { isAuthenticated: boolean },
    similarityThreshold: number = 0.3,
    filters?: {
      communityIds?: string[]
      workTypes?: string[]
      expertiseAreas?: string[]
      excludeRegionalCommunities?: boolean
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<DatabaseResult<PaginatedResult<LocalizedUser & { similarity: number }>>> {
    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize

    return safeQuery(async () => {
      // Build filter conditions as Prisma.sql fragments for safe parameterization
      const filterConditions: Prisma.Sql[] = []

      if (filters?.communityIds?.length) {
        filterConditions.push(Prisma.sql`EXISTS (
          SELECT 1 FROM "UserCommunity" uc
          WHERE uc."userId" = u.id
          AND uc."communityId" = ANY(${filters.communityIds}::text[])
        )`)
      }

      if (filters?.excludeRegionalCommunities) {
        filterConditions.push(Prisma.sql`NOT EXISTS (
          SELECT 1 FROM "UserCommunity" uc
          JOIN "Community" c ON c.id = uc."communityId"
          WHERE uc."userId" = u.id AND c.type = 'REGIONAL'
        )`)
      }

      if (filters?.workTypes?.length) {
        filterConditions.push(Prisma.sql`u."workTypes"::text[] && ${filters.workTypes}::text[]`)
      }

      if (filters?.expertiseAreas?.length) {
        filterConditions.push(Prisma.sql`u."expertiseAreas"::text[] && ${filters.expertiseAreas}::text[]`)
      }

      // Build privacy conditions as Prisma.sql fragments
      const privacyConditions: Prisma.Sql[] = [
        Prisma.sql`u."isSearchable" = true`
      ]
      if (options.isAuthenticated) {
        privacyConditions.push(Prisma.sql`u."profileVisibility" IN ('PUBLIC', 'MEMBERS')`)
      } else {
        privacyConditions.push(Prisma.sql`u."profileVisibility" = 'PUBLIC'`)
      }

      const allConditions = Prisma.join(
        [...privacyConditions, ...filterConditions],
        ' AND '
      )

      // Similarity expression used in SELECT, WHERE/HAVING
      const similarityExpr = Prisma.sql`GREATEST(
        COALESCE(similarity(u."firstName", ${searchQuery}), 0),
        COALESCE(similarity(u."lastName", ${searchQuery}), 0),
        COALESCE(similarity(u.username, ${searchQuery}), 0),
        COALESCE(similarity(u.bio, ${searchQuery}), 0),
        COALESCE(similarity(u.organization, ${searchQuery}), 0),
        COALESCE(similarity(u.position, ${searchQuery}), 0)
      )`

      const [users, countResult] = await Promise.all([
        // Fuzzy search query using pg_trgm similarity
        prisma.$queryRaw<(User & { similarity_score: number })[]>`
          SELECT
            u.*,
            ${similarityExpr} as similarity_score
          FROM "User" u
          WHERE ${allConditions}
          AND ${similarityExpr} >= ${similarityThreshold}
          ORDER BY similarity_score DESC, u."lastLoginAt" DESC NULLS LAST, u."profileCompleteness" DESC
          LIMIT ${pageSize}
          OFFSET ${skip}
        `,
        // Get total count
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count
          FROM "User" u
          WHERE ${allConditions}
          AND ${similarityExpr} >= ${similarityThreshold}
        `
      ])

      const total = Number(countResult[0]?.count || 0)

      // Fetch full user data with relations in a single batch query
      const userIds = users.map(u => u.id)
      const fullUsers = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: {
          communityMemberships: { include: { community: true } },
          recentWork: { orderBy: { createdAt: 'desc' }, take: 3 }
        }
      })
      const userMap = new Map(fullUsers.map(u => [u.id, u]))
      const localizedUsers = users
        .map(user => {
          const fullUser = userMap.get(user.id)
          if (!fullUser) return null
          return {
            ...this.transformToLocalizedUser(fullUser, localizedQuery),
            similarity: user.similarity_score
          }
        })
        .filter((u): u is NonNullable<typeof u> => u !== null)

      // Apply privacy redaction to each user for external viewing
      // (same as the standard collaborate path)
      const redactedUsers = localizedUsers.map(user => redactUser(user, null))

      return {
        data: redactedUsers,
        total,
        page,
        pageSize,
        hasNext: skip + pageSize < total,
        hasPrev: page > 1
      }
    })
  }

  /**
   * Get users for collaborate page grouped by communities
   * Privacy-first: Only returns users based on authentication and privacy settings
   * Ordered by lastLoginAt for active user discovery
   */
  static async getUsersForCollaborate(
    filters: {
      communityIds?: string[]
      workTypes?: string[]
      expertiseAreas?: string[]
      searchQuery?: string
      useFuzzySearch?: boolean
      excludeRegionalCommunities?: boolean
    },
    page: number = 1,
    pageSize: number = 20,
    options: LocalizedQueryOptions & { isAuthenticated: boolean }
  ): Promise<DatabaseResult<PaginatedResult<LocalizedUser>>> {
    // Use fuzzy search if enabled and query provided
    if (filters.useFuzzySearch && filters.searchQuery) {
      const fuzzyResult = await this.fuzzySearchUsers(
        filters.searchQuery,
        options,
        0.3, // Similarity threshold
        {
          communityIds: filters.communityIds,
          workTypes: filters.workTypes,
          expertiseAreas: filters.expertiseAreas,
          excludeRegionalCommunities: filters.excludeRegionalCommunities
        },
        page,
        pageSize
      )

      if (fuzzyResult.success) {
        return fuzzyResult as DatabaseResult<PaginatedResult<LocalizedUser>>
      }

      // Graceful fallback: if fuzzy search fails (e.g. pg_trgm extension
      // unavailable), log and fall through to the standard contains-based path.
      console.error(
        'Fuzzy search failed, falling back to standard search:',
        fuzzyResult.error
      )
    }

    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize

    return safeQuery(async () => {
      // Apply privacy filters based on the caller's authentication status
      const privacyFilter = this.getPrivacyWhereClause(options.isAuthenticated)

      // Build AND array for combining all conditions
      const andConditions: Prisma.UserWhereInput[] = [privacyFilter]

      // Work types and expertise areas are combined with AND *between* categories
      // (a user must match the work-type filter AND the expertise filter), while
      // `hasSome` provides OR *within* a category (match any of the selected values).
      // This makes adding filters narrow results rather than widen them.
      if (filters.workTypes?.length) {
        andConditions.push({
          workTypes: { hasSome: filters.workTypes as any }
        })
      }

      if (filters.expertiseAreas?.length) {
        andConditions.push({
          expertiseAreas: { hasSome: filters.expertiseAreas as any }
        })
      }

      // Add community filter
      if (filters.communityIds?.length) {
        andConditions.push({
          communityMemberships: {
            some: {
              communityId: { in: filters.communityIds }
            }
          }
        })
      }

      // Handle "no regional community" users
      if (filters.excludeRegionalCommunities) {
        andConditions.push({
          communityMemberships: {
            none: {
              community: {
                type: 'REGIONAL'
              }
            }
          }
        })
      }

      // Add search query filter (if present)
      if (filters.searchQuery) {
        andConditions.push({
          OR: [
            // Basic identity
            { firstName: { contains: filters.searchQuery, mode: 'insensitive' } },
            { lastName: { contains: filters.searchQuery, mode: 'insensitive' } },
            { username: { contains: filters.searchQuery, mode: 'insensitive' } },
            { bio: { contains: filters.searchQuery, mode: 'insensitive' } },

            // Location
            { city: { contains: filters.searchQuery, mode: 'insensitive' } },
            { country: { contains: filters.searchQuery, mode: 'insensitive' } },

            // Work details
            { organization: { contains: filters.searchQuery, mode: 'insensitive' } },
            { position: { contains: filters.searchQuery, mode: 'insensitive' } },
            { workBio: { contains: filters.searchQuery, mode: 'insensitive' } },

            // Social links
            { linkedinProfile: { contains: filters.searchQuery, mode: 'insensitive' } },
            { personalWebsite: { contains: filters.searchQuery, mode: 'insensitive' } },

            // Recent work/projects (search in related table)
            {
              recentWork: {
                some: {
                  OR: [
                    { title: { contains: filters.searchQuery, mode: 'insensitive' } },
                    { description: { contains: filters.searchQuery, mode: 'insensitive' } }
                  ]
                }
              }
            }
          ]
        })
      }

      // Build final where clause with AND logic
      const where: Prisma.UserWhereInput = {
        AND: andConditions
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
          // Order by lastLoginAt (most recently active first), then by profile completeness
          orderBy: [
            { lastLoginAt: 'desc' },
            { profileCompleteness: 'desc' },
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
      // Apply privacy redaction to each user for external viewing
      const redactedUsers = localizedUsers.map(user => redactUser(user, null))

      return {
        data: redactedUsers,
        total,
        page,
        pageSize,
        hasNext: skip + pageSize < total,
        hasPrev: page > 1
      }
    })
  }

  /**
   * Get users grouped by regional communities for collaborate page
   */
  static async getUsersByRegionalCommunity(
    options: LocalizedQueryOptions & { isAuthenticated: boolean }
  ): Promise<DatabaseResult<Record<string, LocalizedUser[]>>> {
    const localizedQuery = createLocalizedQuery(options)

    return safeQuery(async () => {
      // Get all regional communities
      const communities = await prisma.community.findMany({
        where: { type: 'REGIONAL' },
        select: {
          id: true,
          name: true,
          regionalName: true,
        }
      })

      const privacyFilter = this.getPrivacyWhereClause(true)

      const result: Record<string, LocalizedUser[]> = {}

      for (const community of communities) {
        const communityName = community.regionalName || community.name

        // Filter users based on privacy settings
        const visibleUsers = await prisma.user.findMany({
          where: {
            ...privacyFilter,
            communityMemberships: {
              some: {
                communityId: community.id
              }
            }
          },
          include: {
            communityMemberships: {
              include: {
                community: true
              }
            }
          },
          orderBy: [
            { lastLoginAt: 'desc' },
            { profileCompleteness: 'desc' }
          ],
          take: 20 // Limit per carousel
        })

        result[communityName] = visibleUsers.map(user =>
          this.transformToLocalizedUser(user, localizedQuery)
        )
      }

      return result
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