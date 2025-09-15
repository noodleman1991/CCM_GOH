import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, CaseStudySearchRecord } from '@/lib/algolia'
import { sanityFetch } from '@/sanity/lib/live'

// Sanity query to get approved case studies
const CASE_STUDIES_QUERY = `*[_type == "caseStudy" && status == "approved"] {
  _id,
  title,
  slug,
  excerpt,
  status,
  featured,
  publishedAt,
  _updatedAt,
  authors[] {
    name,
    role,
    affiliation->{name}
  },
  tags[]->{name},
  studyLocation,
  studyPeriod,
  organizations[]->{name},
  image {
    asset->{url}
  }
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

    const { type = 'full', caseStudyIds = [] } = await request.json()

    if (type === 'full') {
      // Full sync - get all approved case studies
      const result = await sanityFetch({
        query: CASE_STUDIES_QUERY,
        tags: ['caseStudy']
      })
      const caseStudies = result.data || []

      console.log(`Starting full sync of ${caseStudies.length} case studies to Algolia`)

      // Transform case studies for indexing
      const records: CaseStudySearchRecord[] = caseStudies
        .map((caseStudy: any) => transformCaseStudyForIndex(caseStudy))
        .filter(Boolean)

      if (records.length > 0) {
        // Clear existing index and add new records
        await algoliaClient.clearObjects({ indexName: ALGOLIA_INDICES.CASE_STUDIES })
        const response = await algoliaClient.saveObjects({
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
          objects: records as any[]
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: ALGOLIA_INDICES.CASE_STUDIES, taskID: response[0].taskID })
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
      const result = await sanityFetch({
        query: `*[_type == "caseStudy" && _id in $ids] {
          _id,
          title,
          slug,
          excerpt,
          status,
          featured,
          publishedAt,
          _updatedAt,
          authors[] {
            name,
            role,
            affiliation->{name}
          },
          tags[]->{name},
          studyLocation,
          studyPeriod,
          organizations[]->{name},
          image {
            asset->{url}
          }
        }`,
        params: { ids: caseStudyIds },
        tags: ['caseStudy']
      })
      const caseStudies = result.data || []

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
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
          objects: toIndex as any[]
        })
      }

      // Remove non-approved case studies
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
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
      const actualStats = await (algoliaClient as any).getStats?.({ indexName: ALGOLIA_INDICES.CASE_STUDIES })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total approved case studies from Sanity
    const result = await sanityFetch({
      query: `count(*[_type == "caseStudy" && status == "approved"])`,
      tags: ['caseStudy']
    })
    const approvedCaseStudies = result.data || 0

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

// Helper function to transform case study for Algolia indexing
function transformCaseStudyForIndex(caseStudy: any): CaseStudySearchRecord | null {
  try {
    return {
      objectID: caseStudy._id,
      contentId: caseStudy._id,
      title: caseStudy.title || { en: 'Untitled Case Study' },
      excerpt: caseStudy.excerpt || {},
      slug: caseStudy.slug?.current || '',
      status: caseStudy.status || 'pending',
      featured: caseStudy.featured || false,
      publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt).getTime() : Date.now(),
      updatedAt: caseStudy._updatedAt ? new Date(caseStudy._updatedAt).getTime() : Date.now(),
      authors: (caseStudy.authors || []).map((author: any) => ({
        name: author.name || 'Unknown Author',
        role: author.role || 'author',
        affiliation: author.affiliation?.name
      })),
      tags: (caseStudy.tags || []).map((tag: any) => tag.name).filter(Boolean),
      studyLocation: caseStudy.studyLocation ? {
        lat: caseStudy.studyLocation.lat,
        lng: caseStudy.studyLocation.lng,
        name: `${caseStudy.studyLocation.lat}, ${caseStudy.studyLocation.lng}`
      } : undefined,
      studyPeriod: caseStudy.studyPeriod ? {
        startDate: caseStudy.studyPeriod.startDate,
        endDate: caseStudy.studyPeriod.endDate
      } : undefined,
      organizations: (caseStudy.organizations || []).map((org: any) => org.name).filter(Boolean),
      language: 'en', // Default to English, could be enhanced with language detection
      accessLevel: 'public' // All approved case studies are public for now
    }
  } catch (error) {
    console.warn(`Failed to transform case study ${caseStudy._id}:`, error)
    return null
  }
}