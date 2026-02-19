import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'
import type { SupportedLocale } from '@/types/prisma'

/**
 * GET /api/users/collaborate
 * Fetch users for the collaborate page with privacy-first filtering
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user - collaborate page requires authentication
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to access the collaborate page.' },
        { status: 401 }
      )
    }

    // Parse search params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const locale = (searchParams.get('locale') || 'en') as SupportedLocale
    const searchQuery = searchParams.get('search') || undefined

    // Parse array filters
    const communityIds = searchParams.get('communityIds')?.split(',').filter(Boolean)
    const workTypes = searchParams.get('workTypes')?.split(',').filter(Boolean)
    const expertiseAreas = searchParams.get('expertiseAreas')?.split(',').filter(Boolean)

    // Validate pagination params
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // Build filters object
    const filters = {
      communityIds,
      workTypes,
      expertiseAreas,
      searchQuery
    }

    // Fetch users with privacy-first filtering
    const result = await UserService.getUsersForCollaborate(
      filters,
      page,
      pageSize,
      {
        locale,
        isAuthenticated: true
      }
    )

    // Handle service errors
    if (!result.success) {
      console.error('Error fetching collaborate users:', result.error)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    // Calculate total pages
    const totalPages = Math.ceil(result.data.total / result.data.pageSize)

    // Return successful response
    return NextResponse.json({
      success: true,
      data: result.data.data,
      pagination: {
        total: result.data.total,
        page: result.data.page,
        pageSize: result.data.pageSize,
        totalPages,
        hasNext: result.data.hasNext,
        hasPrev: result.data.hasPrev
      },
      filters
    })

  } catch (error) {
    console.error('Collaborate API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
