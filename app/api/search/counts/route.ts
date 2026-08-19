import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES } from '@/lib/algolia'

/**
 * GET endpoint to retrieve search result counts across all indices
 * Returns counts for: users, agendas, news, posts, case-studies
 * This endpoint is PUBLIC - authentication is optional for enhanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Algolia client is available
    if (!algoliaClient) {
      console.error('[Search Counts API] Algolia client is null - missing ALGOLIA_APP_ID or ALGOLIA_API_KEY')
      return NextResponse.json({
        success: false,
        error: 'Search service not available - missing Algolia configuration',
        counts: { users: 0, agendas: 0, news: 0, caseStudies: 0, posts: 0 },
        authenticated: false
      }, { status: 200 })
    }

    // Try to get authentication status (optional - don't block if not authenticated)
    let isSignedIn = false
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const authResult = await auth()
      isSignedIn = !!authResult.userId
    } catch (authError) {
      // Auth failed - continue as unauthenticated
      console.warn('[Search Counts API] Auth check failed, continuing as unauthenticated:', authError)
    }

    // Generate privacy-aware filters for user search
    const generateUserFilters = () => {
      const baseFilters = ['isSearchable:true']
      if (!isSignedIn) {
        baseFilters.push('profileVisibility:PUBLIC')
      } else {
        baseFilters.push('(profileVisibility:PUBLIC OR profileVisibility:MEMBERS)')
      }
      return baseFilters.join(' AND ')
    }

    // Perform parallel count queries for all indices
    const [
      usersResult,
      agendasResult,
      newsResult,
      caseStudiesResult,
      postsResult
    ] = await Promise.all([
      // Users - with privacy filters
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.USERS,
          query: '',
          hitsPerPage: 0,
          filters: generateUserFilters()
        }]
      }).catch((e) => {
        console.warn('[Search Counts API] Users search failed:', e.message)
        return { results: [{ nbHits: 0 }] }
      }),
      // Agendas - count all
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.AGENDAS,
          query: '',
          hitsPerPage: 0
        }]
      }).catch((e) => {
        console.warn('[Search Counts API] Agendas search failed:', e.message)
        return { results: [{ nbHits: 0 }] }
      }),
      // News - count all
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.NEWS,
          query: '',
          hitsPerPage: 0
        }]
      }).catch((e) => {
        console.warn('[Search Counts API] News search failed:', e.message)
        return { results: [{ nbHits: 0 }] }
      }),
      // Case Studies - count all
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
          query: '',
          hitsPerPage: 0
        }]
      }).catch((e) => {
        console.warn('[Search Counts API] Case studies search failed:', e.message)
        return { results: [{ nbHits: 0 }] }
      }),
      // Posts - placeholder
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.POSTS,
          query: '',
          hitsPerPage: 0
        }]
      }).catch((e) => {
        console.warn('[Search Counts API] Posts search failed:', e.message)
        return { results: [{ nbHits: 0 }] }
      })
    ])

    // Extract counts from results - Algolia v5 response structure
    const getCount = (result: unknown): number => {
      const firstResult = (result as { results?: Array<{ nbHits?: number; totalHits?: number }> } | undefined)?.results?.[0]
      return firstResult?.nbHits ?? firstResult?.totalHits ?? 0
    }

    const counts = {
      users: getCount(usersResult),
      agendas: getCount(agendasResult),
      news: getCount(newsResult),
      caseStudies: getCount(caseStudiesResult),
      posts: getCount(postsResult)
    }

    return NextResponse.json({
      success: true,
      counts,
      authenticated: isSignedIn
    })

  } catch (error) {
    console.error('[Search Counts API] Failed to get search counts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get search counts',
        details: error instanceof Error ? error.message : 'Unknown error',
        counts: { users: 0, agendas: 0, news: 0, caseStudies: 0, posts: 0 },
        authenticated: false
      },
      { status: 200 }
    )
  }
}
