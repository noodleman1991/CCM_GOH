import { NextRequest, NextResponse } from 'next/server'
import { algoliaClient, ALGOLIA_INDICES, AgendaSearchRecord } from '@/lib/algolia'
import { deriveAgendaLanguages } from '@/lib/agenda-languages'
import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";

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

/** Minimal shape of the Sanity agenda payload consumed by the transform below. */
interface SanityAgenda {
  _id: string
  title?: AgendaSearchRecord['title'] | null
  subtitle?: NonNullable<AgendaSearchRecord['subtitle']> | null
  description?: NonNullable<AgendaSearchRecord['description']> | null
  slug?: { current?: string } | null
  agendaType?: string | null
  year?: number | null
  publishDate?: string | null
  totalDownloadCount?: number | null
  featured?: boolean | null
  accessLevel?: AgendaSearchRecord['accessLevel'] | null
  organizations?: Array<{ name?: string | null }> | null
  regionalCommunities?: Array<{ name?: string | null }> | null
  tags?: Array<{ name?: string | null }> | null
  files?: Array<{ language?: string; downloadCount?: number }> | null
}

// Helper function to transform agenda for Algolia indexing
function transformAgendaForIndex(agenda: SanityAgenda): AgendaSearchRecord | null {
  try {
    return {
      objectID: agenda._id,
      contentId: agenda._id,
      title: agenda.title || { en: 'Untitled Agenda' },
      subtitle: agenda.subtitle || ({} as NonNullable<AgendaSearchRecord['subtitle']>),
      description: agenda.description || ({} as NonNullable<AgendaSearchRecord['description']>),
      slug: agenda.slug?.current || '',
      agendaType: agenda.agendaType || 'other',
      year: agenda.year || new Date().getFullYear(),
      publishDate: agenda.publishDate ? new Date(agenda.publishDate).getTime() : Date.now(),
      totalDownloadCount: agenda.totalDownloadCount || 0,
      featured: agenda.featured || false,
      organizations: (agenda.organizations || []).map((org) => org.name).filter((name): name is string => Boolean(name)),
      regionalCommunities: (agenda.regionalCommunities || []).map((community) => community.name).filter((name): name is string => Boolean(name)),
      tags: (agenda.tags || []).map((tag) => tag.name).filter((name): name is string => Boolean(name)),
      accessLevel: agenda.accessLevel || 'public',
      language: 'en', // deprecated; kept for back-compat
      languages: deriveAgendaLanguages(agenda.files, agenda.title)
    }
  } catch (error) {
    console.warn(`Failed to transform agenda ${agenda._id}:`, error)
    return null
  }
}