import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, AgendaSearchRecord, writeIndexName } from '@/lib/algolia'
import {
  getPublishedAgendaIndexDocs,
  getAgendaIndexDocsByIds,
  getAgendaCount,
  type AgendaIndexDoc,
} from '@/lib/content/outputs'
import { transformAgendaForIndex } from '@/payload/hooks/search-sync'

type SanityAgenda = AgendaIndexDoc

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

    const { type = 'full', agendaIds = [] } = await request.json()

    if (type === 'full') {
      // Full sync - get all agendas
      const agendas = await getPublishedAgendaIndexDocs()

      console.log(`Starting full sync of ${agendas.length} agendas to Algolia`)

      // Transform agendas for indexing
      const records: AgendaSearchRecord[] = agendas
        .map((agenda: SanityAgenda) => transformAgendaForIndex(agenda))
        .filter((r): r is AgendaSearchRecord => r !== null)

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
          objects: records
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS), taskID: response[0].taskID })
        }

        console.log(`✅ Successfully indexed ${records.length} agendas`)

        return NextResponse.json({
          success: true,
          message: `Indexed ${records.length} agendas`,
          indexed: records.length,
          skipped: agendas.length - records.length
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No agendas to index',
          indexed: 0,
          skipped: agendas.length
        })
      }

    } else if (type === 'partial' && agendaIds.length > 0) {
      // Partial sync - specific agendas
      const agendas = await getAgendaIndexDocsByIds(agendaIds)

      const toIndex: AgendaSearchRecord[] = []
      const toDelete: string[] = []

      for (const agenda of agendas) {
        const record = transformAgendaForIndex(agenda)
        if (record) {
          toIndex.push(record)
        } else {
          toDelete.push(agenda._id)
        }
      }

      // Index agendas
      if (toIndex.length > 0) {
        await algoliaClient.saveObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
          objects: toIndex
        })
      }

      // Remove agendas that couldn't be transformed
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS),
          objectIDs: toDelete
        })
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${agendaIds.length} agendas`,
        indexed: toIndex.length,
        deleted: toDelete.length
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type or missing agendaIds for partial sync' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Agenda sync failed:', error)
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
    // Note: getStats method may not be available in v5, using fallback
    const stats = { numberOfRecords: 0, updatedAt: new Date().toISOString() }
    try {
      // Try to get actual stats if method exists
      const actualStats = await (algoliaClient as { getStats?: (args: { indexName: string }) => Promise<Record<string, unknown>> }).getStats?.({ indexName: writeIndexName(ALGOLIA_INDICES.AGENDAS) })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total agendas from Sanity
    const totalAgendas = await getAgendaCount()

    return NextResponse.json({
      indexStats: {
        numberOfRecords: stats.numberOfRecords,
        lastModified: stats.updatedAt
      },
      sanityStats: {
        totalAgendas
      },
      syncNeeded: stats.numberOfRecords !== totalAgendas
    })

  } catch (error) {
    console.error('Failed to get agenda sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

