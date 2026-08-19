import { prisma, safeQuery, createLocalizedQuery } from '@/lib/prisma'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import type {
  CommunityWithMembers,
  LocalizedCommunity,
  CommunitySearchFilters,
  CommunityQueryResult,
  CommunityCreateData,
  DatabaseResult,
  LocalizedQueryOptions
} from '@/types/prisma'
import type { 
  Community, 
  CommunityType, 
  RegionalCommunityName, 
  SpecialCommunityName,
  Prisma 
} from '@/generated/prisma'

export class CommunityService {
  /**
   * Get community by ID with localization support
   */
  static async getCommunityById(
    communityId: string,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedCommunity | null>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        include: {
          members: {
            include: {
              user: true
            },
            orderBy: { user: { createdAt: 'asc' } }
          },
          contents: {
            include: {
              author: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!community) return null

      return this.transformToLocalizedCommunity(community, localizedQuery)
    })
  }

  /**
   * Get all communities with filtering and localization
   */
  static async getCommunities(
    filters: CommunitySearchFilters,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<CommunityQueryResult>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      // Build where clause
      const where: Prisma.CommunityWhereInput = {
        ...(filters.type?.length && {
          type: { in: filters.type }
        }),
        ...(filters.regionalName?.length && {
          regionalName: { in: filters.regionalName }
        }),
        ...(filters.specialName?.length && {
          specialName: { in: filters.specialName }
        })
      }

      const [communities, total] = await Promise.all([
        prisma.community.findMany({
          where,
          include: {
            members: {
              include: {
                user: true
              }
            },
            contents: {
              take: 3,
              orderBy: { createdAt: 'desc' }
            }
          },
          orderBy: [
            { name: 'asc' }
          ]
        }),
        prisma.community.count({ where })
      ])

      const localizedCommunities = communities.map(community =>
        this.transformToLocalizedCommunity(community, localizedQuery)
      )

      return {
        data: localizedCommunities,
        total,
        page: 1,
        pageSize: total,
        hasNext: false,
        hasPrev: false,
        filters
      }
    })
  }

  /**
   * Get regional communities with localized names
   */
  static async getRegionalCommunities(
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedCommunity[]>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const communities = await prisma.community.findMany({
        where: {
          type: 'REGIONAL'
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return communities.map(community =>
        this.transformToLocalizedCommunity(community, localizedQuery)
      )
    })
  }

  /**
   * Get special communities (Youth, Indigenous, Farmers)
   */
  static async getSpecialCommunities(
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedCommunity[]>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const communities = await prisma.community.findMany({
        where: {
          type: 'SPECIAL'
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return communities.map(community =>
        this.transformToLocalizedCommunity(community, localizedQuery)
      )
    })
  }

  /**
   * Get user's communities
   */
  static async getUserCommunities(
    userId: string,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedCommunity[]>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      const userCommunities = await prisma.userCommunity.findMany({
        where: { userId },
        include: {
          community: {
            include: {
              members: {
                include: {
                  user: true
                }
              }
            }
          }
        },
        orderBy: { community: { name: 'asc' } }
      })

      return userCommunities.map(({ community }) =>
        this.transformToLocalizedCommunity(community, localizedQuery)
      )
    })
  }

  /**
   * Create new community
   */
  static async createCommunity(
    data: CommunityCreateData,
    creatorUserId: string,
    options: LocalizedQueryOptions
  ): Promise<DatabaseResult<LocalizedCommunity>> {
    const localizedQuery = createLocalizedQuery(options)
    
    return safeQuery(async () => {
      // Validate community type and names
      if (data.type === 'REGIONAL' && !data.regionalName) {
        throw new Error('Regional name is required for regional communities')
      }
      
      if (data.type === 'SPECIAL' && !data.specialName) {
        throw new Error('Special name is required for special communities')
      }

      const community = await prisma.community.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          regionalName: data.regionalName,
          specialName: data.specialName,
          members: {
            create: {
              userId: creatorUserId,
              role: 'community_editor' // Creator gets editor role
            }
          }
        },
        include: {
          members: {
            include: {
              user: true
            }
          }
        }
      })

      return this.transformToLocalizedCommunity(community, localizedQuery)
    })
  }

  /**
   * Join community
   */
  static async joinCommunity(
    userId: string,
    communityId: string
  ): Promise<DatabaseResult<void>> {
    return safeQuery(async () => {
      await prisma.userCommunity.create({
        data: {
          userId,
          communityId,
          role: 'community_member'
        }
      })
    })
  }

  /**
   * Leave community
   */
  static async leaveCommunity(
    userId: string,
    communityId: string
  ): Promise<DatabaseResult<void>> {
    return safeQuery(async () => {
      await prisma.userCommunity.delete({
        where: {
          userId_communityId: {
            userId,
            communityId
          }
        }
      })
    })
  }

  /**
   * Get community statistics
   */
  static async getCommunityStats(communityId: string): Promise<DatabaseResult<{
    memberCount: number
    contentCount: number
    recentActivity: Date | null
  }>> {
    return safeQuery(async () => {
      const [memberCount, contentCount, recentActivity] = await Promise.all([
        prisma.userCommunity.count({
          where: { communityId }
        }),
        prisma.content.count({
          where: { communityId }
        }),
        prisma.content.findFirst({
          where: { communityId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ])

      return {
        memberCount,
        contentCount,
        recentActivity: recentActivity?.createdAt || null
      }
    })
  }

  /**
   * Transform community to localized format
   */
  private static transformToLocalizedCommunity(
    community: Community & {
      members?: unknown[]
      contents?: unknown[]
    },
    localizedQuery: ReturnType<typeof createLocalizedQuery>
  ): LocalizedCommunity {
    return {
      ...community,
      // Generate localized display names based on type
      localizedName: this.getLocalizedCommunityName(community, localizedQuery.locale),
      localizedDescription: community.description 
        ? { [localizedQuery.locale]: community.description }
        : undefined
    }
  }

  /**
   * Get localized community name based on type and locale
   */
  private static getLocalizedCommunityName(
    community: Community,
    locale: string
  ): Record<string, string> {
    // Base name
    const baseName: Record<string, string> = {
      [locale]: community.name
    }

    // For regional communities, add localized region names
    if (community.type === 'REGIONAL' && community.regionalName) {
      const regionalNames = this.getRegionalNames()
      baseName[locale] = regionalNames[community.regionalName]?.[locale] || community.name
    }

    // For special communities, add localized special names
    if (community.type === 'SPECIAL' && community.specialName) {
      const specialNames = this.getSpecialNames()
      baseName[locale] = specialNames[community.specialName]?.[locale] || community.name
    }

    return baseName
  }

  /**
   * Get localized regional community names
   */
  private static getRegionalNames(): Record<RegionalCommunityName, Record<string, string>> {
    return {
      ssa: {
        en: 'Sub-Saharan Africa',
        es: 'África Subsahariana',
        fr: 'Afrique subsaharienne',
        ar: 'أفريقيا جنوب الصحراء'
      },
      nawa: {
        en: 'Northern Africa and Western Asia',
        es: 'África del Norte y Asia Occidental',
        fr: 'Afrique du Nord et Asie occidentale',
        ar: 'شمال أفريقيا وغرب آسيا'
      },
      csa: {
        en: 'Central and Southern Asia',
        es: 'Asia Central y Meridional',
        fr: 'Asie centrale et méridionale',
        ar: 'آسيا الوسطى والجنوبية'
      },
      esea: {
        en: 'Eastern and South-Eastern Asia',
        es: 'Asia Oriental y Sudoriental',
        fr: 'Asie orientale et du Sud-Est',
        ar: 'شرق وجنوب شرق آسيا'
      },
      lac: {
        en: 'Latin America and the Caribbean',
        es: 'América Latina y el Caribe',
        fr: 'Amérique latine et Caraïbes',
        ar: 'أمريكا اللاتينية والكاريبي'
      },
      oce: {
        en: 'Oceania',
        es: 'Oceanía',
        fr: 'Océanie',
        ar: 'أوقيانوسيا'
      },
      enam: {
        en: 'Europe and North America',
        es: 'Europa y América del Norte',
        fr: 'Europe et Amérique du Nord',
        ar: 'أوروبا وأمريكا الشمالية'
      }
    }
  }

  /**
   * Get localized special community names
   */
  private static getSpecialNames(): Record<SpecialCommunityName, Record<string, string>> {
    return {
      YOUTH: {
        en: 'Youth',
        es: 'Juventud',
        fr: 'Jeunesse',
        ar: 'الشباب'
      },
      INDIGENOUS: {
        en: 'Indigenous',
        es: 'Indígenas',
        fr: 'Autochtones',
        ar: 'السكان الأصليون'
      },
      FARMER_AND_FISHER: {
        en: 'Smallholder Farmers',
        es: 'Pequeños Agricultores',
        fr: 'Petits Agriculteurs',
        ar: 'صغار المزارعين'
      }
    }
  }
}

export default CommunityService