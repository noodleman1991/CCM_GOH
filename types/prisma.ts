import type {
  User,
  Community,
  UserCommunity,
  Content,
  RecentWork,
  DownloadEvent,
  AgeGroup,
  WorkType,
  ExpertiseArea,
  Role,
  ProfileVisibility,
  CommunityType,
  RegionalCommunityName,
  SpecialCommunityName,
  Prisma
} from '@/generated/prisma'

// Base types for internationalization
export type LocalizedString = Record<string, string>

export type SupportedLocale = 'en' | 'es' | 'fr' | 'ar'

export type RTLLocale = 'ar'

// Enhanced User types with localization support
export interface UserWithProfile extends User {
  // Computed fields for display
  displayName: string
  fullName: string
  initials: string
}

export interface LocalizedUser extends UserWithProfile {
  // These fields can be localized in the database if needed in the future
  localizedBio?: LocalizedString
  localizedWorkBio?: LocalizedString
  localizedOrganization?: LocalizedString
  localizedPosition?: LocalizedString
}

// Enhanced Community types
export interface CommunityWithMembers extends Community {
  members: (UserCommunity & {
    user: UserWithProfile
  })[]
}

export interface LocalizedCommunity extends Community {
  localizedName?: LocalizedString
  localizedDescription?: LocalizedString
}

// Enhanced Content types
export interface ContentWithAuthor extends Content {
  author: UserWithProfile
  community: Community
}

export interface LocalizedContent extends Content {
  localizedTitle?: LocalizedString
  localizedBody?: LocalizedString
}

// Work-related types
export interface WorkWithUser extends RecentWork {
  user: UserWithProfile
}

export interface LocalizedWork extends RecentWork {
  localizedTitle?: LocalizedString
  localizedDescription?: LocalizedString
}

// Search and filtering types
export interface UserSearchFilters {
  workTypes?: WorkType[]
  expertiseAreas?: ExpertiseArea[]
  countries?: string[]
  ageGroups?: AgeGroup[]
  roles?: Role[]
  profileVisibility?: ProfileVisibility[]
  isSearchable?: boolean
}

export interface CommunitySearchFilters {
  type?: CommunityType[]
  regionalName?: RegionalCommunityName[]
  specialName?: SpecialCommunityName[]
}

// Prisma query options with locale support
export interface LocalizedQueryOptions {
  locale: SupportedLocale
  fallbackLocale?: SupportedLocale
  includeRTL?: boolean
}

// Database operation results with metadata
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UserQueryResult extends PaginatedResult<LocalizedUser> {
  filters: UserSearchFilters
}

export interface CommunityQueryResult extends PaginatedResult<LocalizedCommunity> {
  filters: CommunitySearchFilters
}

// Analytics and reporting types
// Extended analytics data can be added here as needed
export type DownloadAnalytics = DownloadEvent

export interface UserAnalytics {
  profileViews: number
  searchAppearances: number
  downloadCount: number
  lastActive: Date
}

// Form and validation types
export interface UserProfileUpdateData {
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  bio?: string | null
  ageGroup?: AgeGroup | null
  country?: string | null
  city?: string | null
  workTypes?: WorkType[]
  expertiseAreas?: ExpertiseArea[]
  organization?: string | null
  position?: string | null
  workBio?: string | null
  personalWebsite?: string | null
  linkedinProfile?: string | null
  otherSocialLinks?: Array<{platform: string, url: string}>
  isSearchable?: boolean
  profileVisibility?: ProfileVisibility
  showEmail?: boolean
  showPhoneNumber?: boolean
  showWorkDetails?: boolean
  showSocialLinks?: boolean
  showLocation?: boolean
  communityIds?: string[]
  recentWork?: Array<{
    title: string
    description: string
    link?: string
    startDate: string
    endDate?: string
    isOngoing?: boolean
    role?: string | null
    collaborators?: string | null
    outcome?: string | null
    imageUrl?: string | null
  }>
  // Domain-rich fields (K4)
  headline?: string | null
  pronouns?: string | null
  languages?: string[]
  focusTopics?: string[]
  motivation?: string | null
  openToCollaboration?: boolean
  lookingFor?: string[]
  collaborationInterests?: string | null
  livedExperienceStatement?: string | null
  showLivedExperience?: boolean
  orcidId?: string | null
}

export interface CommunityCreateData {
  name: string
  description?: string | null
  type: CommunityType
  regionalName?: RegionalCommunityName | null
  specialName?: SpecialCommunityName | null
}

// Utility types
export type DatabaseError = {
  code: string
  message: string
  meta?: Record<string, unknown>
}

export type DatabaseResult<T> = {
  success: true
  data: T
} | {
  success: false
  error: DatabaseError
}

// Advanced query builders
export type UserIncludeOptions = {
  accounts?: boolean
  sessions?: boolean
  communityMemberships?: boolean | {
    include: {
      community?: boolean
    }
  }
  createdContent?: boolean
  recentWork?: boolean
}

export type CommunityIncludeOptions = {
  members?: boolean | {
    include: {
      user?: boolean
    }
  }
  contents?: boolean | {
    include: {
      author?: boolean
    }
  }
}

// Type guards
export function isRTLLocale(locale: string): locale is RTLLocale {
  return locale === 'ar'
}

export function isValidLocale(locale: string): locale is SupportedLocale {
  return ['en', 'es', 'fr', 'ar'].includes(locale)
}

// Prisma client extensions for type safety
export type PrismaTransactionClient = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
>
