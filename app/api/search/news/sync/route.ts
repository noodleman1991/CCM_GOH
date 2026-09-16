import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, NewsSearchRecord, writeIndexName } from '@/lib/algolia'
import {
  getPublishedNewsIndexDocs,
  getNewsIndexDocsByIds,
  getPublishedNewsCount,
  type NewsIndexDoc,
} from '@/lib/content/news'
import { transformNewsForIndex } from '@/payload/hooks/search-sync'

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
      const newsPosts = await getPublishedNewsIndexDocs()

      console.log(`Starting full sync of ${newsPosts.length} news posts to Algolia`)

      // Transform news posts for indexing
      const records: NewsSearchRecord[] = newsPosts
        .map((newsPost: NewsIndexDoc) => transformNewsForIndex(newsPost))
        .filter(Boolean) as NewsSearchRecord[]

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
          objects: records
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: writeIndexName(ALGOLIA_INDICES.NEWS), taskID: response[0].taskID })
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
      const newsPosts = await getNewsIndexDocsByIds(newsIds)

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
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
          objects: toIndex
        })
      }

      // Remove unpublished news posts
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
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
      const actualStats = await (algoliaClient as { getStats?: (args: { indexName: string }) => Promise<Record<string, unknown>> }).getStats?.({ indexName: writeIndexName(ALGOLIA_INDICES.NEWS) })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total published news posts from Sanity
    const publishedNewsPosts = await getPublishedNewsCount()

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

