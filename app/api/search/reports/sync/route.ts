import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, ReportSearchRecord } from '@/lib/algolia'
import { sanityFetch } from '@/sanity/lib/live'

// Sanity query to get all reports
const REPORTS_QUERY = `*[_type == "report"] {
  _id,
  title,
  subtitle,
  description,
  slug,
  reportType,
  year,
  publishDate,
  totalDownloadCount,
  featured,
  accessLevel,
  organizations[]->{name},
  regionalCommunities[]->{name},
  tags[]->{name},
  coverImage {
    asset->{url}
  },
  files[] {
    language,
    downloadCount
  },
  _updatedAt
}`

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    // Only allow authenticated users (could restrict to admins later)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({
        error: 'Search service not available - missing Algolia configuration'
      }, { status: 503 })
    }

    const { type = 'full', reportIds = [] } = await request.json()

    if (type === 'full') {
      // Full sync - get all reports
      const result = await sanityFetch({
        query: REPORTS_QUERY,
        tags: ['report']
      })
      const reports = result.data || []

      console.log(`Starting full sync of ${reports.length} reports to Algolia`)

      // Transform reports for indexing
      const records: ReportSearchRecord[] = reports
        .map((report: any) => transformReportForIndex(report))
        .filter(Boolean)

      if (records.length > 0) {
        // Clear existing index and add new records
        await algoliaClient.clearObjects({ indexName: ALGOLIA_INDICES.REPORTS })
        const response = await algoliaClient.saveObjects({
          indexName: ALGOLIA_INDICES.REPORTS,
          objects: records as any[]
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: ALGOLIA_INDICES.REPORTS, taskID: response[0].taskID })
        }

        console.log(`✅ Successfully indexed ${records.length} reports`)

        return NextResponse.json({
          success: true,
          message: `Indexed ${records.length} reports`,
          indexed: records.length,
          skipped: reports.length - records.length
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No reports to index',
          indexed: 0,
          skipped: reports.length
        })
      }

    } else if (type === 'partial' && reportIds.length > 0) {
      // Partial sync - specific reports
      const result = await sanityFetch({
        query: `*[_type == "report" && _id in $ids] {
          _id,
          title,
          subtitle,
          description,
          slug,
          reportType,
          year,
          publishDate,
          totalDownloadCount,
          featured,
          accessLevel,
          organizations[]->{name},
          regionalCommunities[]->{name},
          tags[]->{name},
          coverImage {
            asset->{url}
          },
          files[] {
            language,
            downloadCount
          },
          _updatedAt
        }`,
        params: { ids: reportIds },
        tags: ['report']
      })
      const reports = result.data || []

      const toIndex: ReportSearchRecord[] = []
      const toDelete: string[] = []

      for (const report of reports) {
        const record = transformReportForIndex(report)
        if (record) {
          toIndex.push(record)
        } else {
          toDelete.push(report._id)
        }
      }

      // Index reports
      if (toIndex.length > 0) {
        await algoliaClient.saveObjects({
          indexName: ALGOLIA_INDICES.REPORTS,
          objects: toIndex as any[]
        })
      }

      // Remove reports that couldn't be transformed
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: ALGOLIA_INDICES.REPORTS,
          objectIDs: toDelete
        })
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${reportIds.length} reports`,
        indexed: toIndex.length,
        deleted: toDelete.length
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type or missing reportIds for partial sync' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Report sync failed:', error)
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
      const actualStats = await (algoliaClient as any).getStats?.({ indexName: ALGOLIA_INDICES.REPORTS })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total reports from Sanity
    const result = await sanityFetch({
      query: `count(*[_type == "report"])`,
      tags: ['report']
    })
    const totalReports = result.data || 0

    return NextResponse.json({
      indexStats: {
        numberOfRecords: stats.numberOfRecords,
        lastModified: stats.updatedAt
      },
      sanityStats: {
        totalReports
      },
      syncNeeded: stats.numberOfRecords !== totalReports
    })

  } catch (error) {
    console.error('Failed to get report sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

// Helper function to transform report for Algolia indexing
function transformReportForIndex(report: any): ReportSearchRecord | null {
  try {
    return {
      objectID: report._id,
      contentId: report._id,
      title: report.title || { en: 'Untitled Report' },
      subtitle: report.subtitle || {},
      description: report.description || {},
      slug: report.slug?.current || '',
      reportType: report.reportType || 'other',
      year: report.year || new Date().getFullYear(),
      publishDate: report.publishDate ? new Date(report.publishDate).getTime() : Date.now(),
      totalDownloadCount: report.totalDownloadCount || 0,
      featured: report.featured || false,
      organizations: (report.organizations || []).map((org: any) => org.name).filter(Boolean),
      regionalCommunities: (report.regionalCommunities || []).map((community: any) => community.name).filter(Boolean),
      tags: (report.tags || []).map((tag: any) => tag.name).filter(Boolean),
      accessLevel: report.accessLevel || 'public',
      language: 'en' // Default to English, could be enhanced with language detection from files
    }
  } catch (error) {
    console.warn(`Failed to transform report ${report._id}:`, error)
    return null
  }
}