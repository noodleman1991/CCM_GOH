import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, CaseStudySearchRecord } from '@/lib/algolia'
import { sanityFetch } from '@/sanity/lib/live'

// This webhook will be called when case study data changes in Sanity
export async function POST(request: NextRequest) {
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