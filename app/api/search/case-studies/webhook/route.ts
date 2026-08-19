import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, CaseStudySearchRecord } from '@/lib/algolia'
import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";

const SEARCH_WEBHOOK_SECRET = process.env.SEARCH_WEBHOOK_SECRET

// This webhook will be called when case study data changes in Sanity
export async function POST(request: NextRequest) {
  // Verify internal webhook secret
  const authHeader = request.headers.get('authorization')
  if (!SEARCH_WEBHOOK_SECRET || authHeader !== `Bearer ${SEARCH_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
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
        indexName: ALGOLIA_INDICES.CASE_STUDIES,
        objectID: _id
      })
      console.log(`🗑️ Removed case study ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'Case study removed from search index'
      })
    }

    // Get updated case study data
    const result = await sanityFetch({
      query: `*[_type == "caseStudy" && _id == $id][0] {
        _id,
        title,
        slug,
        excerpt,
        status,
        featured,
        publishedAt,
        _updatedAt,
        region,
        themes,
        populations,
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
      params: { id: _id },
      tags: ['caseStudy']
    })
    const caseStudy = result.data

    if (!caseStudy) {
      // Case study doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: ALGOLIA_INDICES.CASE_STUDIES,
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
            indexName: ALGOLIA_INDICES.CASE_STUDIES,
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
          indexName: ALGOLIA_INDICES.CASE_STUDIES,
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
        indexName: ALGOLIA_INDICES.CASE_STUDIES,
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

/** Minimal shape of the Sanity case study payload consumed by the transform below. */
interface SanityCaseStudy {
  _id: string
  title?: CaseStudySearchRecord['title'] | null
  excerpt?: NonNullable<CaseStudySearchRecord['excerpt']> | null
  slug?: { current?: string } | null
  status?: CaseStudySearchRecord['status'] | null
  featured?: boolean | null
  publishedAt?: string | null
  _updatedAt?: string | null
  authors?: Array<{ name?: string | null; role?: string | null; affiliation?: { name?: string } | null }> | null
  tags?: Array<{ name?: string | null }> | null
  studyLocation?: { lat: number; lng: number } | null
  studyPeriod?: { startDate: string; endDate: string } | null
  organizations?: Array<{ name?: string | null }> | null
  region?: string | null
  themes?: string[] | null
  populations?: string[] | null
}

// Helper function to transform case study for Algolia indexing
function transformCaseStudyForIndex(caseStudy: SanityCaseStudy): CaseStudySearchRecord | null {
  try {
    return {
      objectID: caseStudy._id,
      contentId: caseStudy._id,
      title: caseStudy.title || { en: 'Untitled Case Study' },
      excerpt: caseStudy.excerpt || ({} as NonNullable<CaseStudySearchRecord['excerpt']>),
      slug: caseStudy.slug?.current || '',
      status: caseStudy.status || 'pending',
      featured: caseStudy.featured || false,
      publishedAt: caseStudy.publishedAt ? new Date(caseStudy.publishedAt).getTime() : Date.now(),
      updatedAt: caseStudy._updatedAt ? new Date(caseStudy._updatedAt).getTime() : Date.now(),
      authors: (caseStudy.authors || []).map((author) => ({
        name: author.name || 'Unknown Author',
        role: author.role || 'author',
        affiliation: author.affiliation?.name
      })),
      tags: (caseStudy.tags || []).map((tag) => tag.name).filter((name): name is string => Boolean(name)),
      studyLocation: caseStudy.studyLocation ? {
        lat: caseStudy.studyLocation.lat,
        lng: caseStudy.studyLocation.lng,
        name: `${caseStudy.studyLocation.lat}, ${caseStudy.studyLocation.lng}`
      } : undefined,
      studyPeriod: caseStudy.studyPeriod ? {
        startDate: caseStudy.studyPeriod.startDate,
        endDate: caseStudy.studyPeriod.endDate
      } : undefined,
      organizations: (caseStudy.organizations || []).map((org) => org.name).filter((name): name is string => Boolean(name)),
      language: 'en', // Default to English, could be enhanced with language detection
      accessLevel: 'public', // All approved case studies are public for now
      region: caseStudy.region || undefined,
      themes: caseStudy.themes || [],
      populations: caseStudy.populations || []
    }
  } catch (error) {
    console.warn(`Failed to transform case study ${caseStudy._id}:`, error)
    return null
  }
}