import { NextRequest, NextResponse } from 'next/server'
import { syncUserSearchRecord } from '@/lib/algolia-user-sync'

const SEARCH_WEBHOOK_SECRET = process.env.SEARCH_WEBHOOK_SECRET

// The HTTP face of a user's search-index update, for external callers. The
// in-process callers (Clerk webhook, profile route, onboarding route) call
// `syncUserSearchRecord` directly inside `after()` instead of fetching this
// route from themselves — see the note on that function.
export async function POST(request: NextRequest) {
  // Verify internal webhook secret
  const authHeader = request.headers.get('authorization')
  if (!SEARCH_WEBHOOK_SECRET || authHeader !== `Bearer ${SEARCH_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId, action = 'update' } = body

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    const outcome = await syncUserSearchRecord(userId, action === 'delete' ? 'delete' : 'update')

    if (outcome === 'skipped') {
      return NextResponse.json({
        success: true,
        message: 'Search indexing skipped - service not configured or live writes not allowed here',
      })
    }

    return NextResponse.json({
      success: true,
      action: outcome,
      message: outcome === 'indexed' ? 'User updated in search index' : 'User removed from search index',
    })
  } catch (error) {
    console.error('Search webhook failed:', error)
    return NextResponse.json(
      { error: 'Webhook failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
