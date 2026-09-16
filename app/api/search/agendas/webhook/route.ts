import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, writeIndexName } from '@/lib/algolia'
import { getAgendaIndexDocsByIds } from '@/lib/content/outputs'
import { transformAgendaForIndex } from '@/payload/hooks/search-sync'

const SEARCH_WEBHOOK_SECRET = process.env.SEARCH_WEBHOOK_SECRET

// This webhook will be called when agenda data changes in Sanity
export async function POST(request: NextRequest) {
  // Verify internal webhook secret
  const authHeader = request.headers.get('authorization')
  if (!SEARCH_WEBHOOK_SECRET || authHeader !== `Bearer ${SEARCH_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
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

    // Transform and index the agenda
    try {
      const record = transformAgendaForIndex(agenda)
      if (record) {
        await algoliaClient.saveObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
          objects: [record]
        })

        console.log(`✅ Updated agenda ${_id} in search index`)

        return NextResponse.json({
          success: true,
          message: 'Agenda updated in search index',
          action: 'indexed'
        })
      } else {
        // Remove from index if transformation failed
        await algoliaClient.deleteObject({
          indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
          objectID: _id
        })

        return NextResponse.json({
          success: true,
          message: 'Agenda removed from search index due to transformation error',
          action: 'removed'
        })
      }
    } catch (error) {
      console.warn(`Failed to index agenda ${_id}: ${error}`)
      // Remove from index if indexing failed
      await algoliaClient.deleteObject({
        indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
        objectID: _id
      })

      return NextResponse.json({
        success: true,
        message: 'Agenda removed from search index due to indexing error',
        action: 'removed',
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Agenda search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


