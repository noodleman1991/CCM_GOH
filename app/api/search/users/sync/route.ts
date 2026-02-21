import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { algoliaClient, ALGOLIA_INDICES, transformUserForIndex, shouldIndexUser } from '@/lib/algolia'

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

    const { type = 'full', userIds = [] } = await request.json()

    // Algolia v5: No longer need to initIndex, use client directly
    
    if (type === 'full') {
      // Full sync - get all users who should be indexed
      const users = await prisma.user.findMany({
        where: {
          isSearchable: true,
          username: { not: null },
          OR: [
            { firstName: { not: null } },
            { lastName: { not: null } }
          ]
        },
        include: {
          communityMemberships: {
            include: {
              community: {
                select: {
                  name: true,
                  type: true
                }
              }
            }
          }
        }
      })

      console.log(`Starting full sync of ${users.length} users to Algolia`)

      // Transform and batch index users
      const records = users
        .filter(shouldIndexUser)
        .map(user => {
          try {
            return transformUserForIndex(user)
          } catch (error) {
            console.warn(`Skipping user ${user.id}: ${error}`)
            return null
          }
        })
        .filter((record): record is NonNullable<typeof record> => record !== null)

      if (records.length > 0) {
        // Replace all records atomically
        const response = await algoliaClient.replaceAllObjects({
          indexName: ALGOLIA_INDICES.USERS,
          objects: records as any[]
        })

        // Wait for indexing to complete
        if (Array.isArray(response) && response[0]?.taskID) {
          await algoliaClient.waitForTask({ indexName: ALGOLIA_INDICES.USERS, taskID: response[0].taskID })
        }
        
        console.log(`✅ Successfully indexed ${records.length} users`)
        
        return NextResponse.json({
          success: true,
          message: `Indexed ${records.length} users`,
          indexed: records.length,
          skipped: users.length - records.length
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'No users to index',
          indexed: 0,
          skipped: users.length
        })
      }
      
    } else if (type === 'partial' && userIds.length > 0) {
      // Partial sync - specific users
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        include: {
          communityMemberships: {
            include: {
              community: {
                select: {
                  name: true,
                  type: true
                }
              }
            }
          }
        }
      })

      const toIndex: any[] = []
      const toDelete: string[] = []

      for (const user of users) {
        if (shouldIndexUser(user)) {
          try {
            toIndex.push(transformUserForIndex(user))
          } catch (error) {
            console.warn(`Skipping user ${user.id}: ${error}`)
            toDelete.push(user.id)
          }
        } else {
          toDelete.push(user.id)
        }
      }

      // Index users who should be searchable
      if (toIndex.length > 0) {
        await algoliaClient.saveObjects({
          indexName: ALGOLIA_INDICES.USERS,
          objects: toIndex
        })
      }

      // Remove users who shouldn't be searchable
      if (toDelete.length > 0) {
        await algoliaClient.deleteObjects({
          indexName: ALGOLIA_INDICES.USERS,
          objectIDs: toDelete
        })
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${userIds.length} users`,
        indexed: toIndex.length,
        deleted: toDelete.length
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid sync type or missing userIds for partial sync' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('User sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status or get search statistics  
export async function GET() {
  try {
    // Check if Algolia client is available
    if (!algoliaClient) {
      return NextResponse.json({ 
        error: 'Search service not available - missing Algolia configuration' 
      }, { status: 503 })
    }

    // Get index statistics
    const stats = { numberOfRecords: 0, updatedAt: new Date().toISOString() }
    try {
      // Try to get actual stats if method exists
      const actualStats = await (algoliaClient as any).getStats?.({ indexName: ALGOLIA_INDICES.USERS })
      if (actualStats) Object.assign(stats, actualStats)
    } catch (error) {
      console.warn('Stats not available:', error)
    }
    
    // Get total searchable users from database
    const totalUsers = await prisma.user.count()
    const searchableUsers = await prisma.user.count({
      where: { isSearchable: true }
    })
    
    return NextResponse.json({
      indexStats: {
        numberOfRecords: stats.numberOfRecords,
        lastModified: stats.updatedAt
      },
      databaseStats: {
        totalUsers,
        searchableUsers,
        nonSearchableUsers: totalUsers - searchableUsers
      },
      syncNeeded: stats.numberOfRecords !== searchableUsers
    })
    
  } catch (error) {
    console.error('Failed to get sync status:', error)
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    )
  }
}