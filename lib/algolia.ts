import { algoliasearch } from 'algoliasearch'

// Environment validation
const requiredEnvVars = {
  ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
  ALGOLIA_API_KEY: process.env.ALGOLIA_API_KEY,
  NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY,
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.warn(`Missing Algolia environment variables: ${missingVars.join(', ')}`)
}

// Create the Algolia client with error handling
export const algoliaClient = (() => {
  try {
    if (!process.env.ALGOLIA_APP_ID || !process.env.ALGOLIA_API_KEY) {
      console.warn('Algolia admin client not available - missing credentials')
      return null
    }
    return algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY)
  } catch (error) {
    console.error('Failed to initialize Algolia admin client:', error)
    return null
  }
})()

// Index names
export const ALGOLIA_INDICES = {
  USERS: 'users',
  SANITY_CONTENT: 'sanity_content',
  REPORTS: 'reports',
  POSTS: 'posts',
  CASE_STUDIES: 'case_studies'
} as const

// Search client for frontend (uses search-only API key)
export const searchClient = (() => {
  try {
    if (!process.env.ALGOLIA_APP_ID || !process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY) {
      console.warn('Algolia search client not available - missing credentials')
      // Return a dummy client that won't crash but won't work
      return {
        search: () => Promise.resolve({ hits: [], nbHits: 0 }),
        searchForFacetValues: () => Promise.resolve([]),
        initIndex: () => ({
          search: () => Promise.resolve({ hits: [], nbHits: 0 }),
        }),
      } as any
    }
    return algoliasearch(
      process.env.ALGOLIA_APP_ID,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
    )
  } catch (error) {
    console.error('Failed to initialize Algolia search client:', error)
    // Return dummy client
    return {
      search: () => Promise.resolve({ hits: [], nbHits: 0 }),
      searchForFacetValues: () => Promise.resolve([]),
      initIndex: () => ({
        search: () => Promise.resolve({ hits: [], nbHits: 0 }),
      }),
    } as any
  }
})()

// Type definitions for search records
export interface UserSearchRecord {
  objectID: string
  userId: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  bio?: string
  profileImage?: string
  country?: string
  city?: string
  location?: string
  organization?: string
  position?: string
  workTypes: string[]
  expertiseAreas: string[]
  // Privacy controls
  isSearchable: boolean
  profileVisibility: 'PUBLIC' | 'MEMBERS' | 'PRIVATE'
  showEmail: boolean
  showWorkDetails: boolean
  showSocialLinks: boolean
  showLocation: boolean
  // Metadata
  joinedAt: number
  lastActiveAt?: number
  communityCount: number
  communities: string[]
  role: string
}

export interface ContentSearchRecord {
  objectID: string
  contentId: string
  title: string
  excerpt?: string
  content: string
  contentType: 'report' | 'post' | 'case-study'
  publishedAt: number
  updatedAt: number
  author?: {
    name: string
    username?: string
  }
  categories?: string[]
  tags?: string[]
  language?: string
  downloadCount?: number
  featured?: boolean
}

// Helper function to transform user data for indexing
export function transformUserForIndex(user: any): UserSearchRecord {
  // Only index users who have opted in to being searchable
  if (!user.isSearchable) {
    throw new Error('User has opted out of search')
  }

  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
  const location = [user.city, user.country].filter(Boolean).join(', ')
  
  return {
    objectID: user.id,
    userId: user.id,
    username: user.username || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName,
    bio: user.bio,
    profileImage: user.image,
    country: user.country,
    city: user.city,
    location: location || undefined,
    organization: user.organization,
    position: user.position,
    workTypes: user.workTypes || [],
    expertiseAreas: user.expertiseAreas || [],
    // Privacy controls
    isSearchable: user.isSearchable,
    profileVisibility: user.profileVisibility,
    showEmail: user.showEmail,
    showWorkDetails: user.showWorkDetails,
    showSocialLinks: user.showSocialLinks,
    showLocation: user.showLocation,
    // Metadata
    joinedAt: new Date(user.createdAt).getTime(),
    lastActiveAt: user.updatedAt ? new Date(user.updatedAt).getTime() : undefined,
    communityCount: user.communityMemberships?.length || 0,
    communities: user.communityMemberships?.map((membership: any) => 
      membership.community.name
    ) || [],
    role: user.role
  }
}

// Helper function to check if user should be included in search
export function shouldIndexUser(user: any): boolean {
  // Must be searchable
  if (!user.isSearchable) return false
  
  // Must have minimum required fields
  if (!user.username || (!user.firstName && !user.lastName)) return false
  
  // Profile visibility check will be handled at search time via filters
  return true
}

// Configuration for search indices
export const INDEX_SETTINGS = {
  users: {
    searchableAttributes: [
      'unordered(firstName)',
      'unordered(lastName)',
      'unordered(fullName)',
      'unordered(username)',
      'unordered(bio)',
      'unordered(organization)',
      'unordered(position)',
      'unordered(location)',
      'unordered(workTypes)',
      'unordered(expertiseAreas)',
      'unordered(communities)'
    ],
    attributesForFaceting: [
      'workTypes',
      'expertiseAreas', 
      'country',
      'role',
      'profileVisibility',
      'communities'
    ],
    ranking: [
      'typo',
      'geo',
      'words',
      'filters',
      'proximity',
      'attribute',
      'exact',
      'custom'
    ],
    customRanking: [
      'desc(lastActiveAt)',
      'desc(communityCount)',
      'desc(joinedAt)'
    ],
    attributesToHighlight: [
      'firstName',
      'lastName',
      'username', 
      'bio',
      'organization',
      'position'
    ],
    attributesToSnippet: ['bio:20'],
    hitsPerPage: 20,
    maxValuesPerFacet: 100
  }
}