import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, writeIndexName } from '@/lib/algolia'
import { getCaseStudyIndexDocById } from '@/lib/content/case-studies'
import { transformCaseStudyForIndex } from '@/payload/hooks/search-sync'
import { authorizeSearchWebhook } from '@/app/api/search/_lib/webhook-gate'

// This webhook will be called when case study data changes in Sanity
export async function POST(request: NextRequest) {
  // Sanity HMAC signature or the internal bearer — app/api/search/_lib/webhook-gate.
  // This route used to accept the bearer only, while SANITY_WEBHOOK_SETUP.md
  // configures Sanity to send its signature header, so every documented
  // delivery 401'd (hub audit 2026-09-16, M20).
  const authz = await authorizeSearchWebhook(request)
  if (!authz.ok) return authz.response

  try {
    const body = JSON.parse(authz.body)
    const { _id, action = 'update', _type } = body

    // Only process case study documents
    if (_type !== 'caseStudy') {
      return NextResponse.json({
        success: true,
        message: 'Not a case study document, skipping'
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

    if (action === 'delete') {
      // Remove case study from search index
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
        objectID: _id
      })
      console.log(`🗑️ Removed case study ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'Case study removed from search index'
      })
    }

    // Get updated case study data
    const caseStudy = await getCaseStudyIndexDocById(_id)

    if (!caseStudy) {
      // Case study doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
        objectID: _id
      })
      return NextResponse.json({
        success: true,
        message: 'Case study not found, removed from index'
      })
    }

    // Check if case study should be indexed (only approved ones)
    if (caseStudy.status === 'approved') {
      try {
        const record = transformCaseStudyForIndex(caseStudy)
        if (record) {
          await algoliaClient.saveObjects({
            indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
            objects: [record]
          })

          console.log(`✅ Updated case study ${_id} in search index`)

          return NextResponse.json({
            success: true,
            message: 'Case study updated in search index',
            action: 'indexed'
          })
        }
      } catch (error) {
        console.warn(`Failed to index case study ${_id}: ${error}`)
        // Remove from index if transformation failed
        await algoliaClient.deleteObject({
          indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
          objectID: _id
        })

        return NextResponse.json({
          success: true,
          message: 'Case study removed from search index due to indexing error',
          action: 'removed',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } else {
      // Case study is not approved, remove if present
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
        objectID: _id
      })

      console.log(`🔒 Removed case study ${_id} from search index (not approved)`)

      return NextResponse.json({
        success: true,
        message: 'Case study removed from search index (not approved)',
        action: 'removed'
      })
    }

  } catch (error) {
    console.error('Case study search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


