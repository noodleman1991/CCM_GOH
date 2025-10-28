import { NextRequest, NextResponse } from 'next/server'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

const secret = process.env.SANITY_WEBHOOK_SECRET

/**
 * Webhook handler for Sanity news post updates
 * Triggers partial sync when news posts are created, updated, or deleted
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature for security
    const signature = request.headers.get(SIGNATURE_HEADER_NAME)
    const body = await request.text()

    if (secret && signature) {
      const validSignature = isValidSignature(body, signature, secret)
      if (!validSignature) {
        console.warn('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    } else if (secret) {
      console.warn('Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Parse the webhook payload
    const payload = JSON.parse(body)
    const { _id, _type } = payload

    // Only process newsPost webhooks
    if (_type !== 'newsPost') {
      return NextResponse.json({
        message: 'Not a news post, ignoring',
        processed: false
      })
    }

    console.log(`Received webhook for news post: ${_id}`)

    // Trigger partial sync for this news post
    const syncResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/search/news/sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'partial',
          newsIds: [_id]
        })
      }
    )

    if (!syncResponse.ok) {
      throw new Error(`Sync failed: ${syncResponse.statusText}`)
    }

    const syncResult = await syncResponse.json()

    return NextResponse.json({
      success: true,
      message: `Webhook processed for news post ${_id}`,
      syncResult
    })

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
