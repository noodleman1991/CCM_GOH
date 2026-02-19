import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Debug endpoint to verify which database is being used
 *
 * Visit:
 * - Production: https://hub.connectingclimateminds.org/api/debug/db-info
 * - Local: http://localhost:3000/api/debug/db-info
 *
 * Expected:
 * - Production should show: ep-lucky-waterfall-abdtu0g5-pooler
 * - Development should show: ep-misty-dawn-abcx8is6-pooler
 */
export async function GET() {
  try {
    // Get user count
    const userCount = await prisma.user.count()

    // Get sample users to identify which database
    const sampleUsers = await prisma.user.findMany({
      take: 10,
      select: {
        username: true,
        email: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get database connection info
    const dbInfo: any = await prisma.$queryRaw`
      SELECT
        current_database() as db_name,
        inet_server_addr() as server_ip,
        inet_server_port() as server_port
    `

    // Parse DATABASE_URL to show only host (hide credentials)
    const databaseUrl = process.env.DATABASE_URL || ''
    const hostMatch = databaseUrl.match(/@([^/]+)/)
    const hostname = hostMatch ? hostMatch[1] : 'unknown'

    // Determine which database based on hostname
    let databaseIdentity = 'UNKNOWN'
    if (hostname.includes('ep-lucky-waterfall-abdtu0g5')) {
      databaseIdentity = 'PRODUCTION (ep-lucky-waterfall-abdtu0g5-pooler)'
    } else if (hostname.includes('ep-misty-dawn-abcx8is6')) {
      databaseIdentity = 'DEVELOPMENT (ep-misty-dawn-abcx8is6-pooler)'
    }

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local',
      database: {
        identity: databaseIdentity,
        hostname: hostname,
        dbInfo: dbInfo[0]
      },
      stats: {
        totalUsers: userCount,
        recentUsers: sampleUsers.map(u => ({
          username: u.username,
          email: u.email?.substring(0, 3) + '***', // Partial email for privacy
          createdAt: u.createdAt
        }))
      },
      verdict: hostname.includes('ep-lucky-waterfall-abdtu0g5')
        ? '✅ CORRECT: Using production database'
        : hostname.includes('ep-misty-dawn-abcx8is6')
        ? '⚠️ WARNING: Using development database'
        : '❌ ERROR: Unknown database'
    })
  } catch (error) {
    // Even if database query fails, show connection info
    const databaseUrl = process.env.DATABASE_URL || ''
    const hostMatch = databaseUrl.match(/@([^/]+)/)
    const hostname = hostMatch ? hostMatch[1] : 'unknown'

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local',
      database: {
        hostname: hostname
      }
    }, { status: 500 })
  }
}
