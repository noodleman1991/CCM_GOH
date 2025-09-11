import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { ClerkSyncService } from "@/lib/clerk-sync"
import { prisma } from "@/lib/prisma"

/**
 * Manual sync endpoint for triggering bidirectional sync
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { direction = 'bidirectional', targetUserId } = body
    
    // Use current user ID if no target specified
    const syncUserId = targetUserId || userId
    
    let result
    
    switch (direction) {
      case 'to_clerk':
        const user = await prisma.user.findUnique({ where: { id: syncUserId } })
        if (!user) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          )
        }
        result = await ClerkSyncService.syncToClerk(syncUserId, user)
        break
        
      case 'from_clerk':
        result = await ClerkSyncService.syncFromClerk(syncUserId)
        break
        
      case 'bidirectional':
      default:
        result = await ClerkSyncService.bidirectionalSync(syncUserId)
        break
    }
    
    if (result) {
      return NextResponse.json({
        success: true,
        message: `Successfully synced user ${syncUserId}`,
        direction,
        userId: syncUserId
      })
    } else {
      return NextResponse.json(
        { error: "Sync failed" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Manual sync failed:", error)
    return NextResponse.json(
      { error: "Sync operation failed" },
      { status: 500 }
    )
  }
}

/**
 * Get sync status for current user
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check both Clerk and Prisma data
    const { clerkClient } = await import("@clerk/nextjs/server")
    const { prisma } = await import("@/lib/prisma")
    
    const clerkClientInstance = await clerkClient()
    const [clerkUser, prismaUser] = await Promise.all([
      clerkClientInstance.users.getUser(userId).catch(() => null),
      prisma.user.findUnique({ where: { id: userId } })
    ])
    
    const status = {
      userId,
      clerkExists: !!clerkUser,
      prismaExists: !!prismaUser,
      clerkUpdatedAt: clerkUser?.updatedAt ? new Date(clerkUser.updatedAt) : null,
      prismaUpdatedAt: prismaUser?.updatedAt || null,
      inSync: false,
      recommendations: [] as string[]
    }
    
    if (!clerkUser && !prismaUser) {
      status.recommendations.push("User does not exist in either system")
    } else if (!clerkUser && prismaUser) {
      status.recommendations.push("User exists only in Prisma - consider cleanup")
    } else if (clerkUser && !prismaUser) {
      status.recommendations.push("User exists only in Clerk - sync from Clerk needed")
    } else if (clerkUser && prismaUser) {
      // Check if basic fields match
      const fieldsMatch = (
        clerkUser.firstName === prismaUser.firstName &&
        clerkUser.lastName === prismaUser.lastName &&
        clerkUser.username === prismaUser.username &&
        clerkUser.primaryEmailAddress?.emailAddress === prismaUser.email
      )
      
      status.inSync = fieldsMatch
      
      if (!fieldsMatch) {
        status.recommendations.push("Basic profile fields don't match - bidirectional sync recommended")
      }
      
      if (status.clerkUpdatedAt && status.prismaUpdatedAt) {
        const timeDiff = Math.abs(status.clerkUpdatedAt.getTime() - status.prismaUpdatedAt.getTime())
        if (timeDiff > 60000) { // More than 1 minute difference
          status.recommendations.push("Update timestamps differ significantly - sync recommended")
        }
      }
    }
    
    return NextResponse.json(status)
  } catch (error) {
    console.error("Failed to get sync status:", error)
    return NextResponse.json(
      { error: "Failed to get sync status" },
      { status: 500 }
    )
  }
}