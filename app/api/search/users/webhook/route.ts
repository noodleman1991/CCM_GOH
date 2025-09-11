import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { algoliaClient, ALGOLIA_INDICES, transformUserForIndex, shouldIndexUser } from '@/lib/algolia'

// This webhook will be called whenever user data changes
// It can be triggered from profile updates, Clerk webhooks, etc.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action = 'update' } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Check if Algolia client is available
    if (!algoliaClient) {
      console.warn('Algolia not configured - skipping search index update')
      return NextResponse.json({ 
        success: true, 
        message: 'Search indexing skipped - service not configured' 
      })
    }

    const usersIndex = algoliaClient.initIndex(ALGOLIA_INDICES.USERS)

    if (action === 'delete') {
      // Remove user from search index
      await usersIndex.deleteObject(userId)
      console.log(`🗑️ Removed user ${userId} from search index`)
      
      return NextResponse.json({
        success: true,
        message: 'User removed from search index'
      })
    }

    // Get updated user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      // User doesn't exist, remove from index if present
      await usersIndex.deleteObject(userId)
      return NextResponse.json({
        success: true,
        message: 'User not found, removed from index'
      })
    }

    // Check if user should be indexed
    if (shouldIndexUser(user)) {
      try {
        const record = transformUserForIndex(user)
        await usersIndex.saveObject(record)
        
        console.log(`✅ Updated user ${userId} in search index`)
        
        return NextResponse.json({
          success: true,
          message: 'User updated in search index',
          action: 'indexed'
        })
      } catch (error) {
        console.warn(`Failed to index user ${userId}: ${error}`)
        // Remove from index if transformation failed
        await usersIndex.deleteObject(userId)
        
        return NextResponse.json({
          success: true,
          message: 'User removed from search index due to indexing error',
          action: 'removed',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } else {
      // User should not be indexed, remove if present
      await usersIndex.deleteObject(userId)
      
      console.log(`🔒 Removed user ${userId} from search index (privacy settings)`)
      
      return NextResponse.json({
        success: true,
        message: 'User removed from search index (privacy settings)',
        action: 'removed'
      })
    }

  } catch (error) {
    console.error('Search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}