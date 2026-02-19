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
            isOngoing: work.isOngoing || false
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
   * - Layer 1: Query-level filtering (profile visibility)
   * - Layer 2: Field-level redaction (specific field privacy)
   */
  static async getUserForProfile(
    identifier: string,  // username or userId
    viewerId: string | null,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedUser | null>> {
    const localizedQuery = createLocalizedQuery(options)

    return safeQuery(async () => {
      const isOwnProfile = identifier === viewerId

      // Build where clause with privacy filtering
      const where: Prisma.UserWhereInput = {
        OR: [
          { id: identifier },
          { username: identifier }
        ]
      }

      // Layer 1: Profile-level privacy (query filtering)
      // Don't fetch users with private profiles unless it's the owner viewing
      if (!isOwnProfile) {
        where.AND = [
          { isSearchable: true },
          {
            profileVisibility: viewerId
              ? { in: ['PUBLIC', 'MEMBERS'] }  // Authenticated user can see PUBLIC and MEMBERS
              : 'PUBLIC'                        // Anonymous user can only see PUBLIC
          }
        ]
      }

      // Fetch user with all necessary relations
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

      // Layer 2: Field-level redaction (happens in memory, very fast)
      // Redact sensitive fields based on privacy settings BEFORE sending to client
      const redactedUser = {
        ...user,
        // Redact email if privacy setting disables it (unless own profile)
        email: (isOwnProfile || user.showEmail) ? user.email : null,
        // Redact phone number if privacy setting disables it (unless own profile)
        phoneNumber: (isOwnProfile || user.showPhoneNumber) ? user.phoneNumber : null,
        // Redact location if privacy setting disables it (unless own profile)
        city: (isOwnProfile || user.showLocation) ? user.city : null,
        country: (isOwnProfile || user.showLocation) ? user.country : null,
        // Redact work details if privacy setting disables it (unless own profile)
        organization: (isOwnProfile || user.showWorkDetails) ? user.organization : null,
        position: (isOwnProfile || user.showWorkDetails) ? user.position : null,
        workBio: (isOwnProfile || user.showWorkDetails) ? user.workBio : null,
        // Redact social links if privacy setting disables it (unless own profile)
        personalWebsite: (isOwnProfile || user.showSocialLinks) ? user.personalWebsite : null,
        linkedinProfile: (isOwnProfile || user.showSocialLinks) ? user.linkedinProfile : null,
        otherSocialLinks: (isOwnProfile || user.showSocialLinks) ? user.otherSocialLinks : []
      }

      // Transform to localized format with redacted data
      return this.transformToLocalizedUser(redactedUser, localizedQuery)
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
    },
    page: number = 1,
    pageSize: number = 20
  ): Promise<DatabaseResult<PaginatedResult<LocalizedUser & { similarity: number }>>> {
    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize

    return safeQuery(async () => {
      // Apply privacy filters
      const privacyFilter = this.getPrivacyWhereClause(options.isAuthenticated)

      // Build filter conditions for community, work types, expertise
      const filterConditions: string[] = []
      const filterParams: any[] = []
      let paramIndex = 2 // Start from $2 since $1 is searchQuery

      if (filters?.communityIds?.length) {
        filterConditions.push(`EXISTS (
          SELECT 1 FROM "UserCommunity" uc
          WHERE uc."userId" = u.id
          AND uc."communityId" = ANY($${paramIndex})
        )`)
        filterParams.push(filters.communityIds)
        paramIndex++
      }

      if (filters?.workTypes?.length) {
        filterConditions.push(`u."workTypes" && $${paramIndex}::text[]`)
        filterParams.push(filters.workTypes)
        paramIndex++
      }

      if (filters?.expertiseAreas?.length) {
        filterConditions.push(`u."expertiseAreas" && $${paramIndex}::text[]`)
        filterParams.push(filters.expertiseAreas)
        paramIndex++
      }

      // Build privacy conditions
      const privacyConditions: string[] = ['u."isSearchable" = true']
      if (options.isAuthenticated) {
        privacyConditions.push(`u."profileVisibility" IN ('PUBLIC', 'MEMBERS')`)
      } else {
        privacyConditions.push(`u."profileVisibility" = 'PUBLIC'`)
      }

      const allConditions = [
        ...privacyConditions,
        ...filterConditions
      ].join(' AND ')

      // Fuzzy search query using pg_trgm similarity
      const fuzzyQuery = `
        SELECT
          u.*,
          GREATEST(
            COALESCE(similarity(u."firstName", $1), 0),
            COALESCE(similarity(u."lastName", $1), 0),
            COALESCE(similarity(u.username, $1), 0),
            COALESCE(similarity(u.bio, $1), 0),
            COALESCE(similarity(u.organization, $1), 0),
            COALESCE(similarity(u.position, $1), 0)
          ) as similarity_score
        FROM "User" u
        WHERE ${allConditions}
        HAVING GREATEST(
          COALESCE(similarity(u."firstName", $1), 0),
          COALESCE(similarity(u."lastName", $1), 0),
          COALESCE(similarity(u.username, $1), 0),
          COALESCE(similarity(u.bio, $1), 0),
          COALESCE(similarity(u.organization, $1), 0),
          COALESCE(similarity(u.position, $1), 0)
        ) >= ${similarityThreshold}
        ORDER BY similarity_score DESC, u."lastLoginAt" DESC NULLS LAST, u."profileCompleteness" DESC
        LIMIT ${pageSize}
        OFFSET ${skip}
      `

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as count
        FROM "User" u
        WHERE ${allConditions}
        AND GREATEST(
          COALESCE(similarity(u."firstName", $1), 0),
          COALESCE(similarity(u."lastName", $1), 0),
          COALESCE(similarity(u.username, $1), 0),
          COALESCE(similarity(u.bio, $1), 0),
          COALESCE(similarity(u.organization, $1), 0),
          COALESCE(similarity(u.position, $1), 0)
        ) >= ${similarityThreshold}
      `

      const [users, countResult] = await Promise.all([
        prisma.$queryRawUnsafe<(User & { similarity_score: number })[]>(
          fuzzyQuery,
          searchQuery,
          ...filterParams
        ),
        prisma.$queryRawUnsafe<{ count: bigint }[]>(
          countQuery,
          searchQuery,
          ...filterParams
        )
      ])

      const total = Number(countResult[0]?.count || 0)

      // Fetch full user data with relations for each result
      const usersWithRelations = await Promise.all(
        users.map(async (user) => {
          const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
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
            }
          })

          if (!fullUser) return null

          return {
            ...this.transformToLocalizedUser(fullUser, localizedQuery),
            similarity: user.similarity_score
          }
        })
      )

      const localizedUsers = usersWithRelations.filter((u): u is NonNullable<typeof u> => u !== null)

      return {
        data: localizedUsers,
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
      return this.fuzzySearchUsers(
        filters.searchQuery,
        options,
        0.3, // Similarity threshold
        {
          communityIds: filters.communityIds,
          workTypes: filters.workTypes,
          expertiseAreas: filters.expertiseAreas
        },
        page,
        pageSize
      ) as Promise<DatabaseResult<PaginatedResult<LocalizedUser>>>
    }

    const localizedQuery = createLocalizedQuery(options)
    const skip = (page - 1) * pageSize

    return safeQuery(async () => {
      // Apply privacy filters - only authenticated users can access collaborate
      const privacyFilter = this.getPrivacyWhereClause(true)

      // Build OR conditions for workTypes and expertiseAreas filters
      // This ensures users appear if they match ANY of the selected filters
      const filterOrConditions: Prisma.UserWhereInput[] = []

      // Add workTypes filter to OR conditions
      if (filters.workTypes?.length) {
        filterOrConditions.push({
          workTypes: { hasSome: filters.workTypes as any }
        })
      }

      // Add expertiseAreas filter to OR conditions
      if (filters.expertiseAreas?.length) {
        filterOrConditions.push({
          expertiseAreas: { hasSome: filters.expertiseAreas as any }
        })
      }

      // Build AND array for combining all conditions
      const andConditions: Prisma.UserWhereInput[] = [privacyFilter]

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

      // Add OR logic for workTypes and expertiseAreas (if any)
      if (filterOrConditions.length > 0) {
        andConditions.push({ OR: filterOrConditions })
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

      return {
        data: localizedUsers,
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
        include: {
          members: {
            include: {
              user: {
                include: {
                  communityMemberships: {
                    include: {
                      community: true
                    }
                  }
                }
              }
            }
          }
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