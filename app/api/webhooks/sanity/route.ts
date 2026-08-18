/**
 * Sanity Webhook Handler
 *
 * Handles real-time updates from Sanity Studio to invalidate Next.js cache
 * and ensure content changes are immediately reflected in the application.
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook'
import { writeClient } from '@/sanity/lib/write-client'
import { notifyCaseStudyStatusChange, isNotifiableStatus } from '@/lib/case-study-emails'

// Types for webhook payload
interface SanityWebhookPayload {
  _type: string
  _id: string
  _rev: string
  projectId: string
  dataset: string
  slug?: { current?: string }
  [key: string]: unknown
}

/**
 * Verify the webhook signature.
 *
 * This previously read an `x-sanity-signature` header and compared it against
 * `sha256=<hex hmac>` — a GitHub-style scheme that Sanity does not use, so no
 * genuine webhook could ever pass and every delivery was rejected with a 401.
 *
 * Sanity signs with header `sanity-webhook-signature` (SIGNATURE_HEADER_NAME)
 * carrying `t=<timestamp>,v1=<base64url hmac>`, and the timestamp is part of the
 * signed payload. Rather than re-implement that, use @sanity/webhook — already
 * a dependency — which owns the format and its expiry handling.
 */
async function verifySignature(payload: string, signature: string | null) {
  const webhookSecret = process.env.SANITY_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('SANITY_WEBHOOK_SECRET not configured — rejecting webhook')
    return false
  }
  if (!signature) {
    console.warn(`Sanity webhook received without ${SIGNATURE_HEADER_NAME} header`)
    return false
  }

  try {
    return await isValidSignature(payload, signature, webhookSecret)
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

// Handle cache invalidation based on document type
function handleCacheInvalidation(payload: SanityWebhookPayload) {
  // Every sanityFetch() result is cached under the "sanity" tag (next-sanity's
  // defineLive uses `tags = ["sanity"]` by default, plus per-document sync
  // tags). Invalidating it here is what makes a publish show up without waiting
  // for the revalidate window — the per-type cases below only ever covered a
  // handful of tags, so all ~98 sanityFetch call sites used to rely purely on
  // the timer. Unconditional: any document type can appear in any query.
  const tagsToRevalidate: string[] = ['sanity']
  const pathsToRevalidate: string[] = []
  const locales = ['en', 'es', 'fr', 'ar']

  switch (payload._type) {
    case 'caseStudy': {
      // Revalidate the ISR listing and detail pages so approvals/edits
      // show up immediately instead of waiting for the revalidate window
      const slug = payload.slug?.current
      for (const locale of locales) {
        pathsToRevalidate.push(`/${locale}/research-and-action/case-studies`)
        if (slug) {
          pathsToRevalidate.push(`/${locale}/research-and-action/case-studies/${slug}`)
        }
      }
      console.log(`🔄 Invalidating case study pages for slug: ${slug ?? 'unknown'}`)
      break
    }

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
      revalidateTag(tag, "max")
      console.log(`✅ Cache tag revalidated: ${tag}`)
    } catch (error) {
      console.error(`❌ Error revalidating cache tag ${tag}:`, error)
    }
  })

  // Revalidate the appropriate paths
  pathsToRevalidate.forEach(path => {
    try {
      revalidatePath(path)
      console.log(`✅ Path revalidated: ${path}`)
    } catch (error) {
      console.error(`❌ Error revalidating path ${path}:`, error)
    }
  })

  return [...tagsToRevalidate, ...pathsToRevalidate]
}

/**
 * Resolve the fields needed to email the submitter and send (idempotently).
 * The Sanity webhook projection may not include everything, so we fetch the
 * authoritative fields with the server client when needed.
 */
async function handleCaseStudyNotification(payload: SanityWebhookPayload): Promise<string> {
  // Fast skip: if the payload already tells us the status isn't notifiable.
  if (payload.status && !isNotifiableStatus(payload.status)) {
    return 'skipped: status not notifiable'
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hub.connectingclimateminds.org'

  // Fetch the authoritative fields (status may have just changed; submittedBy /
  // notifiedStatus / title are often not projected into the webhook payload).
  const doc = await writeClient.fetch(
    `*[_type == "caseStudy" && _id == $id][0]{
      "title": title.en,
      status,
      notifiedStatus,
      submittedBy,
      reviewNotes,
      "locale": coalesce(submitterLocale, "en")
    }`,
    { id: payload._id }
  )
  if (!doc) return 'skipped: document not found'

  return notifyCaseStudyStatusChange({
    caseStudyId: payload._id,
    status: doc.status,
    notifiedStatus: doc.notifiedStatus,
    submittedBy: doc.submittedBy,
    title: doc.title,
    reviewNotes: doc.reviewNotes,
    locale: doc.locale,
    siteUrl,
  })
}

// POST handler for Sanity webhooks
export async function POST(request: NextRequest) {
  try {
    // Get request body as text for signature verification
    const payload = await request.text()

    // Get signature from headers
    const headersList = await headers()
    const signature = headersList.get(SIGNATURE_HEADER_NAME)

    // Verify webhook signature (named to avoid shadowing the imported
    // isValidSignature that verifySignature delegates to).
    const signatureIsValid = await verifySignature(payload, signature)
    if (!signatureIsValid) {
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

    // Case-study status-change email notification (idempotent).
    let emailResult: string | undefined
    if (webhookData._type === 'caseStudy') {
      try {
        emailResult = await handleCaseStudyNotification(webhookData)
      } catch (err) {
        console.error('Case study notification failed:', err)
        emailResult = 'error'
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      revalidated: revalidatedTags,
      emailResult,
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

// GET handler for webhook health check. Deliberately says nothing about
// configuration — this endpoint is unauthenticated and webhook deliveries are
// server-to-server (no CORS/preflight involved).
export async function GET() {
  return NextResponse.json({ status: 'healthy' })
}