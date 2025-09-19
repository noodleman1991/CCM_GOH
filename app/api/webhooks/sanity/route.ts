/**
 * Sanity Webhook Handler
 *
 * Handles real-time updates from Sanity Studio to invalidate Next.js cache
 * and ensure content changes are immediately reflected in the application.
 */

import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Types for webhook payload
interface SanityWebhookPayload {
  _type: string
  _id: string
  _rev: string
  projectId: string
  dataset: string
  [key: string]: any
}

// Verify webhook signature (if configured)
async function verifySignature(payload: string, signature: string | null) {
  // Only verify if webhook secret is configured
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET
  if (!webhookSecret || !signature) {
    return true // Skip verification if not configured
  }

  try {
    const crypto = await import('crypto')
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex')

    return signature === `sha256=${computedSignature}`
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Handle cache invalidation based on document type
function handleCacheInvalidation(payload: SanityWebhookPayload) {
  const tagsToRevalidate: string[] = []

  switch (payload._type) {
    case 'onboardingContent':
      tagsToRevalidate.push('onboarding-content')
      console.log(`🔄 Invalidating onboarding content cache for language: ${payload.language}`)
      break

    case 'workType':
      tagsToRevalidate.push('work-types', 'user-management')
      console.log(`🔄 Invalidating work types cache for key: ${payload.key}`)
      break

    case 'expertiseArea':
      tagsToRevalidate.push('expertise-areas', 'user-management')
      console.log(`🔄 Invalidating expertise areas cache for key: ${payload.key}`)
      break

    case 'page':
    case 'post':
    case 'homepage':
      // Handle other content types if needed
      tagsToRevalidate.push('general-content')
      console.log(`🔄 Invalidating general content cache for: ${payload._type}`)
      break

    default:
      console.log(`ℹ️ No specific cache invalidation for document type: ${payload._type}`)
  }

  // Revalidate the appropriate cache tags
  tagsToRevalidate.forEach(tag => {
    try {
      revalidateTag(tag)
      console.log(`✅ Cache tag revalidated: ${tag}`)
    } catch (error) {
      console.error(`❌ Error revalidating cache tag ${tag}:`, error)
    }
  })

  return tagsToRevalidate
}

// POST handler for Sanity webhooks
export async function POST(request: NextRequest) {
  try {
    // Get request body as text for signature verification
    const payload = await request.text()

    // Get signature from headers
    const headersList = await headers()
    const signature = headersList.get('x-sanity-signature')

    // Verify webhook signature
    const isValidSignature = await verifySignature(payload, signature)
    if (!isValidSignature) {
      console.error('❌ Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the payload
    const webhookData: SanityWebhookPayload = JSON.parse(payload)

    // Validate required fields
    if (!webhookData._type || !webhookData._id) {
      console.error('❌ Invalid webhook payload: missing _type or _id')
      return NextResponse.json(
        { error: 'Invalid payload: missing required fields' },
        { status: 400 }
      )
    }

    // Log the webhook event
    console.log(`📨 Sanity webhook received:`, {
      type: webhookData._type,
      id: webhookData._id,
      rev: webhookData._rev,
      projectId: webhookData.projectId,
      dataset: webhookData.dataset
    })

    // Handle cache invalidation
    const revalidatedTags = handleCacheInvalidation(webhookData)

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      revalidatedTags,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error processing Sanity webhook:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET handler for webhook health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Sanity webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: {
      hasWebhookSecret: !!process.env.SANITY_WEBHOOK_SECRET,
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET
    }
  })
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-sanity-signature',
    },
  })
}