import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, writeIndexName } from '@/lib/algolia'
import { getNewsIndexDocById } from '@/lib/content/news'
import { transformNewsForIndex } from '@/payload/hooks/search-sync'
import { authorizeSearchWebhook } from '@/app/api/search/_lib/webhook-gate'

/**
 * Webhook handler for Sanity news post updates
 * Directly updates Algolia index when news posts are created, updated, or deleted
 */
export async function POST(request: NextRequest) {
  try {
    // Sanity HMAC signature or the internal bearer — app/api/search/_lib/webhook-gate.
    // The inline check this replaced did not `await` isValidSignature(), so a
    // Promise (always truthy) let any signature through (hub audit 2026-09-16, H2).
    const authz = await authorizeSearchWebhook(request)
    if (!authz.ok) return authz.response
    const body = authz.body

    // Parse the webhook payload
    const payload = JSON.parse(body)
    const { _id, _type, action = 'update' } = payload

    // Only process newsPost webhooks
    if (_type !== 'newsPost' && _type !== 'news-post') {
      return NextResponse.json({
        message: 'Not a news post, ignoring',
        processed: false
      })
    }

    if (!_id) {
      return NextResponse.json({ error: 'Missing document _id' }, { status: 400 })
    }

    // Check if Algolia client is available
    if (!algoliaClient) {
      console.warn('Algolia not configured - skipping search index update')
      return NextResponse.json({
        success: true,
        message: 'Search indexing skipped - service not configured'
      })
    }

    console.log(`📰 Received webhook for news post: ${_id}, action: ${action}`)

    // Handle delete action
    if (action === 'delete') {
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
        objectID: _id
      })
      console.log(`🗑️  Removed news post ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'News post removed from search index',
        action: 'deleted'
      })
    }

    // Fetch the full news post from Sanity
    const newsPost = await getNewsIndexDocById(_id)

    if (!newsPost) {
      // News post doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
        objectID: _id
      })
      return NextResponse.json({
        success: true,
        message: 'News post not found, removed from index',
        action: 'deleted'
      })
    }

    // Check if news post is published
    const isPublished = newsPost.publishedAt && new Date(newsPost.publishedAt) <= new Date()

    if (isPublished) {
      // Build first, save second, and answer differently: a record that cannot
      // be built is removed (no stale rows); a save that fails is 5xx with the
      // index untouched, so Sanity retries. See the case-studies webhook.
      let record: ReturnType<typeof transformNewsForIndex>
      try {
        record = transformNewsForIndex(newsPost)
      } catch (error) {
        console.warn(`Could not build the search record for news post ${_id}:`, error)
        record = null
      }
      if (!record) {
        await algoliaClient.deleteObject({
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
          objectID: _id
        })
        return NextResponse.json({
          success: true,
          message: 'News post removed from search index: record could not be built',
          action: 'removed'
        })
      }
      try {
        const response = await algoliaClient.saveObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
          objects: [record]
        })
        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({
            indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
            taskID: response[0].taskID
          })
        }
      } catch (error) {
        console.error(`Failed to save news post ${_id} to the search index:`, error)
        return NextResponse.json(
          { success: false, message: 'Search index write failed; retry', reason: error instanceof Error ? error.message : 'Unknown error' },
          { status: 503 }
        )
      }

      console.log(`✅ Updated news post ${_id} in search index`)

      return NextResponse.json({
        success: true,
        message: 'News post updated in search index',
        action: 'indexed'
      })
    } else {
      // News post is not published, remove if present
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
        objectID: _id
      })

      console.log(`🔒 Removed unpublished news post ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'News post removed from search index (not published)',
        action: 'removed'
      })
    }

  } catch (error) {
    console.error('Webhook processing failed:', error)
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook verification. Deliberately says nothing about
// configuration: it used to return `webhookSecret: !!secret`, telling any
// anonymous caller whether signature checking was on (hub audit 2026-09-16).
export async function GET() {
  return NextResponse.json({
    message: 'News webhook endpoint',
    status: 'active'
  })
}
