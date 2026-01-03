import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, AgendaSearchRecord } from '@/lib/algolia'
import { sanityFetch } from '@/sanity/lib/live'

// This webhook will be called when agenda data changes in Sanity
export async function POST(request: NextRequest) {
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
        indexName: ALGOLIA_INDICES.AGENDAS,
        objectID: _id
      })
      console.log(`🗑️ Removed agenda ${_id} from search index`)

      return NextResponse.json({
        success: true,
        message: 'Agenda removed from search index'
      })
    }

    // Get updated agenda data
    const result = await sanityFetch({
      query: `*[_type == "agenda" && _id == $id][0] {
        _id,
        title,
        subtitle,
        description,
        slug,
        agendaType,
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
      tags: ['agenda']
    })
    const agenda = result.data

    if (!agenda) {
      // Agenda doesn't exist, remove from index if present
      await algoliaClient.deleteObject({
        indexName: ALGOLIA_INDICES.AGENDAS,
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
          indexName: ALGOLIA_INDICES.AGENDAS,
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
          indexName: ALGOLIA_INDICES.AGENDAS,
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
        indexName: ALGOLIA_INDICES.AGENDAS,
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

// Helper function to transform agenda for Algolia indexing
function transformAgendaForIndex(agenda: any): AgendaSearchRecord | null {
  try {
    return {
      objectID: agenda._id,
      contentId: agenda._id,
      title: agenda.title || { en: 'Untitled Agenda' },
      subtitle: agenda.subtitle || {},
      description: agenda.description || {},
      slug: agenda.slug?.current || '',
      agendaType: agenda.agendaType || 'other',
      year: agenda.year || new Date().getFullYear(),
      publishDate: agenda.publishDate ? new Date(agenda.publishDate).getTime() : Date.now(),
      totalDownloadCount: agenda.totalDownloadCount || 0,
      featured: agenda.featured || false,
      organizations: (agenda.organizations || []).map((org: any) => org.name).filter(Boolean),
      regionalCommunities: (agenda.regionalCommunities || []).map((community: any) => community.name).filter(Boolean),
      tags: (agenda.tags || []).map((tag: any) => tag.name).filter(Boolean),
      accessLevel: agenda.accessLevel || 'public',
      language: 'en' // Default to English, could be enhanced with language detection from files
    }
  } catch (error) {
    console.warn(`Failed to transform agenda ${agenda._id}:`, error)
    return null
  }
}