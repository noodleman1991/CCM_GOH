import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, ReportSearchRecord } from '@/lib/algolia'
import { sanityFetch } from '@/sanity/lib/live'

// This webhook will be called when report data changes in Sanity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { _id, action = 'update', _type } = body

    // Only process report documents
    if (_type !== 'report') {
      return NextResponse.json({
        success: true,
        message: 'Not a report document, skipping'
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
      // Remove report from search index
      await algoliaClient.deleteObject({
        indexName: ALGOLIA_INDICES.REPORTS,
        objectID: _id
      })
      console.log(`🗑️ Removed report ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'Report removed from search index'
      })
    }

    // Get updated report data
    const result = await sanityFetch({
      query: `*[_type == "report" && _id == $id][0] {
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
      params: { id: _id },
      tags: ['report']
    })
    const report = result.data

    if (!report) {
      // Report doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: ALGOLIA_INDICES.REPORTS,
        objectID: _id
      })
      return NextResponse.json({
        success: true,
        message: 'Report not found, removed from index'
      })
    }

    // Transform and index the report
    try {
      const record = transformReportForIndex(report)
      if (record) {
        await algoliaClient.saveObject({
          indexName: ALGOLIA_INDICES.REPORTS,
          body: record
        })

        console.log(`✅ Updated report ${_id} in search index`)

        return NextResponse.json({
          success: true,
          message: 'Report updated in search index',
          action: 'indexed'
        })
      } else {
        // Remove from index if transformation failed
        await algoliaClient.deleteObject({
          indexName: ALGOLIA_INDICES.REPORTS,
          objectID: _id
        })

        return NextResponse.json({
          success: true,
          message: 'Report removed from search index due to transformation error',
          action: 'removed'
        })
      }
    } catch (error) {
      console.warn(`Failed to index report ${_id}: ${error}`)
      // Remove from index if indexing failed
      await algoliaClient.deleteObject({
        indexName: ALGOLIA_INDICES.REPORTS,
        objectID: _id
      })

      return NextResponse.json({
        success: true,
        message: 'Report removed from search index due to indexing error',
        action: 'removed',
        reason: error instanceof Error ? error.message : 'Unknown error'
      })
    }

  } catch (error) {
    console.error('Report search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
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