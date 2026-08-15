import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { algoliaClient, ALGOLIA_INDICES, AgendaSearchRecord } from '@/lib/algolia'
import { deriveAgendaLanguages } from '@/lib/agenda-languages'
import { cachedFetch as sanityFetch } from "@/sanity/lib/cached-fetch";

// Sanity query to get all agendas
const AGENDAS_QUERY = `*[_type == "agenda"] {
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
    downloadCount,
    file {
      asset->{
        url,
        originalFilename
      }
    }
  },
  _updatedAt
}`

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
      const result = await sanityFetch({
        query: AGENDAS_QUERY,
        tags: ['agenda']
      })
      const agendas = result.data || []

      console.log(`Starting full sync of ${agendas.length} agendas to Algolia`)

      // Transform agendas for indexing
      const records: AgendaSearchRecord[] = agendas
        .map((agenda: any) => transformAgendaForIndex(agenda))
        .filter(Boolean)

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: ALGOLIA_INDICES.AGENDAS,
          objects: records as any[]
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: ALGOLIA_INDICES.AGENDAS, taskID: response[0].taskID })
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
      const result = await sanityFetch({
        query: `*[_type == "agenda" && _id in $ids] {
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
            downloadCount,
            file {
              asset->{
                url,
                originalFilename
              }
            }
          },
          _updatedAt
        }`,
        params: { ids: agendaIds },
        tags: ['agenda']
      })
      const agendas = result.data || []

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
          indexName: ALGOLIA_INDICES.AGENDAS,
          objects: toIndex as any[]
        })
      }

      // Remove agendas that couldn't be transformed
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: ALGOLIA_INDICES.AGENDAS,
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
      const actualStats = await (algoliaClient as any).getStats?.({ indexName: ALGOLIA_INDICES.AGENDAS })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }

    // Get total agendas from Sanity
    const result = await sanityFetch({
      query: `count(*[_type == "agenda"])`,
      tags: ['agenda']
    })
    const totalAgendas = result.data || 0

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
      language: 'en', // deprecated; kept for back-compat
      languages: deriveAgendaLanguages(agenda.files, agenda.title),
      files: (agenda.files || [])
        .filter((f: any) => f.file?.asset?.url)
        .map((f: any) => ({
          language: f.language,
          url: f.file.asset.url,
          filename: f.file.asset.originalFilename
        }))
    }
  } catch (error) {
    console.warn(`Failed to transform agenda ${agenda._id}:`, error)
    return null
  }
}