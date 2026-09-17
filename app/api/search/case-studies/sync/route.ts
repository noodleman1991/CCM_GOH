import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, CaseStudySearchRecord, writeIndexName } from '@/lib/algolia'
import {
  getApprovedCaseStudyIndexDocs,
  getCaseStudyIndexDocsByIds,
  getApprovedCaseStudyCount,
  type CaseStudyIndexDoc,
} from '@/lib/content/case-studies'
import { transformCaseStudyForIndex } from '@/payload/hooks/search-sync'
import { authorizeSearchSync, refuseUnlessLiveIndexWritesAllowed } from '@/lib/auth/search-sync-gate'

/** Minimal shape of the Sanity case study payload consumed by the transform below. */
type SanityCaseStudy = CaseStudyIndexDoc

export async function POST(request: NextRequest) {
  try {
    // Internal bearer or staff actor; 401 anonymous, 403 member. The check this
    // replaced let any signed-in user re-index and matched `Bearer undefined`
    // when the secret was unset (hub audit 2026-09-16, H3).
    const denied = await authorizeSearchSync(request)
    if (denied) return denied

    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({
        error: 'Search service not available - missing Algolia configuration'
      }, { status: 503 })
    }

    // Never write to the live index from dev, preview or CI.
    const refused = refuseUnlessLiveIndexWritesAllowed()
    if (refused) return refused

    const { type = 'full', caseStudyIds = [] } = await request.json()

    if (type === 'full') {
      // Full sync - get all approved case studies
      const caseStudies = await getApprovedCaseStudyIndexDocs()

      console.log(`Starting full sync of ${caseStudies.length} case studies to Algolia`)

      // Transform case studies for indexing
      const records: CaseStudySearchRecord[] = caseStudies
        .map((caseStudy: SanityCaseStudy) => transformCaseStudyForIndex(caseStudy))
        .filter((r): r is CaseStudySearchRecord => r !== null)

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
          objects: records
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES), taskID: response[0].taskID })
        }

        console.log(`✅ Successfully indexed ${records.length} case studies`)

        return NextResponse.json({
          success: true,
          message: `Indexed ${records.length} case studies`,
          indexed: records.length,
          skipped: caseStudies.length - records.length
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No case studies to index',
          indexed: 0,
          skipped: caseStudies.length
        })
      }

    } else if (type === 'partial' && caseStudyIds.length > 0) {
      // Partial sync - specific case studies
      const caseStudies = await getCaseStudyIndexDocsByIds(caseStudyIds)

      const toIndex: CaseStudySearchRecord[] = []
      const toDelete: string[] = []

      for (const caseStudy of caseStudies) {
        if (caseStudy.status === 'approved') {
          const record = transformCaseStudyForIndex(caseStudy)
          if (record) {
            toIndex.push(record)
          }
        } else {
          toDelete.push(caseStudy._id)
        }
      }

      // Index approved case studies
      if (toIndex.length > 0) {
        await algoliaClient.saveObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
          objects: toIndex
        })
      }

      // Remove non-approved case studies
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES),
          objectIDs: toDelete
        })
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${caseStudyIds.length} case studies`,
        indexed: toIndex.length,
        deleted: toDelete.length
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type or missing caseStudyIds for partial sync' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Case study sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    // Same gate as POST: this used to return CMS/index counts to anyone
    // (hub audit 2026-09-16, H3c).
    const denied = await authorizeSearchSync(request)
    if (denied) return denied

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
      const actualStats = await (algoliaClient as { getStats?: (args: { indexName: string }) => Promise<Record<string, unknown>> }).getStats?.({ indexName: writeIndexName(ALGOLIA_INDICES.CASE_STUDIES) })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total approved case studies from Sanity
    const approvedCaseStudies = await getApprovedCaseStudyCount()

    return NextResponse.json({
      indexStats: {
        numberOfRecords: stats.numberOfRecords,
        lastModified: stats.updatedAt
      },
      sanityStats: {
        approvedCaseStudies
      },
      syncNeeded: stats.numberOfRecords !== approvedCaseStudies
    })

  } catch (error) {
    console.error('Failed to get case study sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

