/**
 * Manual Cache Revalidation API
 *
 * Provides endpoints for manually invalidating Next.js cache tags.
 * Useful for development, testing, and admin operations.
 */

import { revalidateTag, revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { REVALIDATABLE_CACHE_TAGS, type RevalidatableCacheTag } from '@/lib/cache/revalidatable-tags'
import { bearerMatches } from '@/lib/auth/bearer'

// Available cache tags that can be revalidated — lib/cache/revalidatable-tags.ts
const AVAILABLE_TAGS = REVALIDATABLE_CACHE_TAGS

type CacheTag = RevalidatableCacheTag

// Verify admin access (basic implementation)
function verifyAdminAccess(request: NextRequest) {
  const apiKey = process.env.ADMIN_API_KEY

  // Skip verification in development if no API key is set
  if (!apiKey && process.env.NODE_ENV === 'development') {
    return true
  }

  // bearerMatches() already refuses an unset key; kept on the shared helper so
  // this route gets the same constant-time compare as every other secret-keyed
  // route (hub audit 2026-09-16, H3 family).
  return bearerMatches(request.headers.get('authorization'), apiKey)
}

// POST handler for cache revalidation
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    if (!verifyAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tags, paths, all } = body

    const results: {
      revalidatedTags: string[]
      revalidatedPaths: string[]
      errors: string[]
    } = {
      revalidatedTags: [],
      revalidatedPaths: [],
      errors: []
    }

    // Revalidate all Sanity-related cache if requested
    if (all) {
      for (const tag of AVAILABLE_TAGS) {
        try {
          revalidateTag(tag, "max")
          results.revalidatedTags.push(tag)
          console.log(`✅ Revalidated cache tag: ${tag}`)
        } catch (error) {
          const errorMsg = `Failed to revalidate tag ${tag}: ${error}`
          results.errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }
    }

    // Revalidate specific tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        if (!AVAILABLE_TAGS.includes(tag as CacheTag)) {
          results.errors.push(`Invalid cache tag: ${tag}`)
          continue
        }

        try {
          revalidateTag(tag, "max")
          results.revalidatedTags.push(tag)
          console.log(`✅ Revalidated cache tag: ${tag}`)
        } catch (error) {
          const errorMsg = `Failed to revalidate tag ${tag}: ${error}`
          results.errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }
    }

    // Revalidate specific paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        try {
          revalidatePath(path)
          results.revalidatedPaths.push(path)
          console.log(`✅ Revalidated path: ${path}`)
        } catch (error) {
          const errorMsg = `Failed to revalidate path ${path}: ${error}`
          results.errors.push(errorMsg)
          console.error(`❌ ${errorMsg}`)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cache revalidation completed',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error in cache revalidation:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET handler for available cache tags and status
export async function GET(request: NextRequest) {
  try {
    // Verify admin access for GET as well
    if (!verifyAdminAccess(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      availableTags: AVAILABLE_TAGS,
      environment: process.env.NODE_ENV,
      hasAdminKey: !!process.env.ADMIN_API_KEY,
      instructions: {
        revalidateAll: {
          method: 'POST',
          body: { all: true },
          description: 'Revalidate all Sanity-related cache tags'
        },
        revalidateSpecificTags: {
          method: 'POST',
          body: { tags: ['onboarding-content', 'work-types'] },
          description: 'Revalidate specific cache tags'
        },
        revalidateSpecificPaths: {
          method: 'POST',
          body: { paths: ['/onboarding', '/'] },
          description: 'Revalidate specific paths'
        },
        combined: {
          method: 'POST',
          body: {
            tags: ['onboarding-content'],
            paths: ['/onboarding']
          },
          description: 'Revalidate both tags and paths in single request'
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in cache revalidation GET:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}