import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, writeIndexName } from '@/lib/algolia'
import { getAgendaIndexDocsByIds } from '@/lib/content/outputs'
import { transformAgendaForIndex } from '@/payload/hooks/search-sync'
import { authorizeSearchWebhook } from '@/app/api/search/_lib/webhook-gate'

// This webhook will be called when agenda data changes in Sanity
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

    // Only process agenda documents
    if (_type !== 'agenda') {
      return NextResponse.json({
        success: true,
        message: 'Not an agenda document, skipping'
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
      // Remove agenda from search index
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
        objectID: _id
      })
      console.log(`🗑️ Removed agenda ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'Agenda removed from search index'
      })
    }

    // Get updated agenda data.
    //
    // `...ByIds([_id])` rather than `...ById(_id)`: on the Payload arm those two
    // readers differ — `ByIds` dereferences `files` and `ById` does not — and the
    // record this route emits must be the one the live index holds, which is the
    // full sync's (with `files`). Before, this route's own transform dropped
    // `files` and `saveObjects` replaces the whole object, so every webhook
    // delivery stripped them off the record until the next full sync put them
    // back. One shape now: payload/hooks/search-sync.ts.
    const agenda = (await getAgendaIndexDocsByIds([_id]))[0] ?? null

    if (!agenda) {
      // Agenda doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
        objectID: _id
      })
      return NextResponse.json({
        success: true,
        message: 'Agenda not found, removed from index'
      })
    }

    // Build first, save second, and answer differently: a record that cannot
    // be built is removed (no stale rows); a save that fails is 5xx with the
    // index untouched, so Sanity retries. See the case-studies webhook.
    let record: ReturnType<typeof transformAgendaForIndex>
    try {
      record = transformAgendaForIndex(agenda)
    } catch (error) {
      console.warn(`Could not build the search record for agenda ${_id}: ${error}`)
      record = null
    }
    if (!record) {
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
        objectID: _id
      })
      return NextResponse.json({
        success: true,
        message: 'Agenda removed from search index: record could not be built',
        action: 'removed'
      })
    }
    try {
      await algoliaClient.saveObjects({
        indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
        objects: [record]
      })
    } catch (error) {
      console.error(`Failed to save agenda ${_id} to the search index:`, error)
      return NextResponse.json(
        { success: false, message: 'Search index write failed; retry', reason: error instanceof Error ? error.message : 'Unknown error' },
        { status: 503 }
      )
    }

    console.log(`✅ Updated agenda ${_id} in search index`)

    return NextResponse.json({
      success: true,
      message: 'Agenda updated in search index',
      action: 'indexed'
    })

  } catch (error) {
    console.error('Agenda search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


