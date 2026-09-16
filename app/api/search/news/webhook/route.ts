import { NextRequest, NextResponse } from 'next/server'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { algoliaClient, ALGOLIA_INDICES, writeIndexName } from '@/lib/algolia'
import { getNewsIndexDocById } from '@/lib/content/news'
import { transformNewsForIndex } from '@/payload/hooks/search-sync'

const secret = process.env.SANITY_WEBHOOK_SECRET
const SEARCH_WEBHOOK_SECRET = process.env.SEARCH_WEBHOOK_SECRET

/**
 * Webhook handler for Sanity news post updates
 * Directly updates Algolia index when news posts are created, updated, or deleted
 */
export async function POST(request: NextRequest) {
  try {
    // Check for internal Bearer token auth first
    const authHeader = request.headers.get('authorization')
    const hasValidBearerToken = SEARCH_WEBHOOK_SECRET && authHeader === `Bearer ${SEARCH_WEBHOOK_SECRET}`

    // Verify webhook signature for security (Sanity webhook or Bearer token)
    const signature = request.headers.get(SIGNATURE_HEADER_NAME)
    const body = await request.text()

    if (!hasValidBearerToken) {
      // Fall back to Sanity signature verification
      if (secret && signature) {
        const validSignature = isValidSignature(body, signature, secret)
        if (!validSignature) {
          console.warn('Invalid webhook signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } else if (secret) {
        console.warn('Missing webhook signature')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      } else {
        // No Sanity secret configured and no Bearer token - reject
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

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
      // Transform and index the news post
      try {
        const record = transformNewsForIndex(newsPost)
        if (record) {
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

          console.log(`✅ Updated news post ${_id} in search index`)

          return NextResponse.json({
            success: true,
            message: 'News post updated in search index',
            action: 'indexed'
          })
        } else {
          // Remove from index if transformation failed
          await algoliaClient.deleteObject({
            indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
            objectID: _id
          })

          return NextResponse.json({
            success: true,
            message: 'News post removed from search index due to transformation error',
            action: 'removed'
          })
        }
      } catch (error) {
        console.warn(`Failed to index news post ${_id}:`, error)
        // Remove from index if indexing failed
        await algoliaClient.deleteObject({
          indexName: writeIndexName(ALGOLIA_INDICES.NEWS),
          objectID: _id
        })

        return NextResponse.json({
          success: true,
          message: 'News post removed from search index due to indexing error',
          action: 'removed',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
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

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'News webhook endpoint',
    status: 'active',
    webhookSecret: !!secret
  })
}
