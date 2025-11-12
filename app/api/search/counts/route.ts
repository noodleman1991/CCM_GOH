import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, AlgoliaSearchResult } from '@/lib/algolia'

/**
 * GET endpoint to retrieve search result counts across all indices
 * Returns counts for: users, agendas, news, posts, case-studies
 * User counts are privacy-aware based on authentication status
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({
        error: 'Search service not available - missing Algolia configuration'
      }, { status: 503 })
    }

    // Get authentication status
    const { userId } = await auth()
    const isSignedIn = !!userId

    // Generate privacy-aware filters for user search
    const generateUserFilters = () => {
      const baseFilters = ['isSearchable:true']  // Only users who opted in

      if (!isSignedIn) {
        // Unauthenticated users only see PUBLIC profiles
        baseFilters.push('profileVisibility:PUBLIC')
      } else {
        // Authenticated users see PUBLIC + MEMBERS profiles
        baseFilters.push('(profileVisibility:PUBLIC OR profileVisibility:MEMBERS)')
      }

      return baseFilters.join(' AND ')
    }

    // Generate content filters (agendas, news, case studies)
    const generateContentFilters = () => {
      const baseFilters = []

      if (!isSignedIn) {
        baseFilters.push('accessLevel:public')
      } else {
        baseFilters.push('accessLevel:public OR accessLevel:registered')
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
      }),
      // Agendas - with content filters
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.AGENDAS,
          query: '',
          hitsPerPage: 0,
          filters: generateContentFilters()
        }]
      }),
      // News - always public
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.NEWS,
          query: '',
          hitsPerPage: 0,
          filters: 'accessLevel:public'
        }]
      }),
      // Case Studies - approved and with content filters
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
          query: '',
          hitsPerPage: 0,
          filters: `status:approved AND ${generateContentFilters()}`
        }]
      }),
      // Posts - placeholder (index may not exist yet)
      algoliaClient.search({
        requests: [{
          indexName: ALGOLIA_INDICES.POSTS,
          query: '',
          hitsPerPage: 0
        }]
      }).catch(() => ({ results: [{ nbHits: 0 }] })) // Gracefully handle missing index
    ])

    // Extract counts from results with proper typing
    const counts = {
      users: (usersResult.results[0] as AlgoliaSearchResult)?.nbHits || 0,
      agendas: (agendasResult.results[0] as AlgoliaSearchResult)?.nbHits || 0,
      news: (newsResult.results[0] as AlgoliaSearchResult)?.nbHits || 0,
      caseStudies: (caseStudiesResult.results[0] as AlgoliaSearchResult)?.nbHits || 0,
      posts: (postsResult.results[0] as AlgoliaSearchResult)?.nbHits || 0
    }

    return NextResponse.json({
      success: true,
      counts,
      authenticated: isSignedIn
    })

  } catch (error) {
    console.error('Failed to get search counts:', error)
    return NextResponse.json(
      {
        error: 'Failed to get search counts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
