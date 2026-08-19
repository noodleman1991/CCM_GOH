import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, NewsSearchRecord } from '@/lib/algolia'
import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";

// Sanity query to get all published news posts
const NEWS_QUERY = `*[_type == "newsPost" && publishedAt <= now()] | order(publishedAt desc) {
  _id,
  title,
  subtitle,
  excerpt,
  slug,
  publishedAt,
  _updatedAt,
  region,
  themes,
  populations,
  featured,
  author->{_id, name},
  tags[]->{label},
  organizations[]->{name},
  projects[]->{name},
  location,
  locationDetails {
    city,
    country
  },
  language
}`

/** Minimal shape of the Sanity news post payload consumed by the transform below. */
interface SanityNewsPost {
  _id: string
  title?: NewsSearchRecord['title'] | null
  subtitle?: NonNullable<NewsSearchRecord['subtitle']> | null
  excerpt?: NonNullable<NewsSearchRecord['excerpt']> | null
  slug?: { current?: string } | null
  publishedAt?: string | null
  _updatedAt?: string | null
  featured?: boolean | null
  author?: { _id?: string; name?: string } | null
  tags?: Array<{ label?: { en?: string } | null; name?: string | null }> | null
  organizations?: Array<{ name?: string | null }> | null
  projects?: Array<{ name?: string | null }> | null
  location?: { lat?: number; lng?: number } | null
  locationDetails?: { city?: string; country?: string } | null
  language?: string | null
  region?: string | null
  themes?: string[] | null
  populations?: string[] | null
}

export async function POST(request: NextRequest) {
  try {
    // Check internal secret auth or Clerk auth
    const authHeader = request.headers.get('authorization')
    const internalSecret = process.env.INTERNAL_SYNC_SECRET
    const { userId } = await auth()

    // Allow if either internal secret matches OR user is authenticated
    if (authHeader !== `Bearer ${internalSecret}` && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({
        error: 'Search service not available - missing Algolia configuration'
      }, { status: 503 })
    }

    const { type = 'full', newsIds = [] } = await request.json()

    if (type === 'full') {
      // Full sync - get all published news posts
      const result = await sanityFetch({
        query: NEWS_QUERY,
        tags: ['newsPost']
      })
      const newsPosts = result.data || []

      console.log(`Starting full sync of ${newsPosts.length} news posts to Algolia`)

      // Transform news posts for indexing
      const records: NewsSearchRecord[] = newsPosts
        .map((newsPost: SanityNewsPost) => transformNewsForIndex(newsPost))
        .filter(Boolean) as NewsSearchRecord[]

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: ALGOLIA_INDICES.NEWS,
          objects: records
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: ALGOLIA_INDICES.NEWS, taskID: response[0].taskID })
        }

        console.log(`✅ Successfully indexed ${records.length} news posts`)

        return NextResponse.json({
          success: true,
          message: `Indexed ${records.length} news posts`,
          indexed: records.length,
          skipped: newsPosts.length - records.length
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No news posts to index',
          indexed: 0,
          skipped: newsPosts.length
        })
      }

    } else if (type === 'partial' && newsIds.length > 0) {
      // Partial sync - specific news posts
      const result = await sanityFetch({
        query: `*[_type == "newsPost" && _id in $ids] {
          _id,
          title,
          subtitle,
          excerpt,
          slug,
          publishedAt,
          _updatedAt,
  region,
  themes,
  populations,
          featured,
          author->{_id, name},
          tags[]->{label},
          organizations[]->{name},
          projects[]->{name},
          location,
          locationDetails {
            city,
            country
          },
          language
        }`,
        params: { ids: newsIds },
        tags: ['newsPost']
      })
      const newsPosts = result.data || []

      const toIndex: NewsSearchRecord[] = []
      const toDelete: string[] = []

      for (const newsPost of newsPosts) {
        // Check if published
        if (newsPost.publishedAt && new Date(newsPost.publishedAt) <= new Date()) {
          const record = transformNewsForIndex(newsPost)
          if (record) {
            toIndex.push(record)
          }
        } else {
          // Not published or deleted, remove from index
          toDelete.push(newsPost._id)
        }
      }

      // Index published news posts
      if (toIndex.length > 0) {
        await algoliaClient.saveObjects({
          indexName: ALGOLIA_INDICES.NEWS,
          objects: toIndex
        })
      }

      // Remove unpublished news posts
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: ALGOLIA_INDICES.NEWS,
          objectIDs: toDelete
        })
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${newsIds.length} news posts`,
        indexed: toIndex.length,
        deleted: toDelete.length
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type or missing newsIds for partial sync' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('News sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({
        error: 'Search service not available - missing Algolia configuration'
      }, { status: 503 })
    }

    // Get index statistics
    const stats = { numberOfRecords: 0, updatedAt: new Date().toISOString() }
    try {
      // Try to get actual stats if method exists
      const actualStats = await (algoliaClient as { getStats?: (args: { indexName: string }) => Promise<Record<string, unknown>> }).getStats?.({ indexName: ALGOLIA_INDICES.NEWS })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total published news posts from Sanity
    const result = await sanityFetch({
      query: `count(*[_type == "newsPost" && publishedAt <= now()])`,
      tags: ['newsPost']
    })
    const publishedNewsPosts = result.data || 0

    return NextResponse.json({
      indexStats: {
        numberOfRecords: stats.numberOfRecords,
        lastModified: stats.updatedAt
      },
      sanityStats: {
        publishedNewsPosts
      },
      syncNeeded: stats.numberOfRecords !== publishedNewsPosts
    })

  } catch (error) {
    console.error('Failed to get news sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

// Helper function to transform news post for Algolia indexing
function transformNewsForIndex(newsPost: SanityNewsPost): NewsSearchRecord | null {
  try {
    // Ensure required fields exist
    if (!newsPost._id || !newsPost.title || !newsPost.slug) {
      console.warn(`Skipping news post: missing required fields`)
      return null
    }

    return {
      objectID: newsPost._id,
      contentId: newsPost._id,
      title: newsPost.title || { en: 'Untitled News Post' },
      subtitle: newsPost.subtitle || ({} as NonNullable<NewsSearchRecord['subtitle']>),
      excerpt: newsPost.excerpt || ({} as NonNullable<NewsSearchRecord['excerpt']>),
      slug: newsPost.slug?.current || '',
      publishedAt: newsPost.publishedAt ? new Date(newsPost.publishedAt).getTime() : Date.now(),
      updatedAt: newsPost._updatedAt ? new Date(newsPost._updatedAt).getTime() : Date.now(),
      author: {
        name: newsPost.author?.name || 'Unknown Author',
        id: newsPost.author?._id || ''
      },
      featured: newsPost.featured || false,
      tags: (newsPost.tags || [])
        .map((tag) => tag.label?.en || tag.name)
        .filter((name): name is string => Boolean(name)),
      organizations: (newsPost.organizations || [])
        .map((org) => org.name)
        .filter((name): name is string => Boolean(name)),
      projects: (newsPost.projects || [])
        .map((project) => project.name)
        .filter((name): name is string => Boolean(name)),
      location: {
        city: newsPost.locationDetails?.city,
        country: newsPost.locationDetails?.country,
        lat: newsPost.location?.lat,
        lng: newsPost.location?.lng
      },
      accessLevel: 'public', // News is always public
      language: newsPost.language || 'en',
      region: newsPost.region || undefined,
      themes: newsPost.themes || [],
      populations: newsPost.populations || []
    }
  } catch (error) {
    console.warn(`Failed to transform news post ${newsPost._id}:`, error)
    return null
  }
}
