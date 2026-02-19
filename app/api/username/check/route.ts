import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UsernameCheckSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/)
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ error: "Username parameter required" }, { status: 400 })
    }

    // Validate username format
    try {
      UsernameCheckSchema.parse({ username })
    } catch (error) {
      return NextResponse.json({
        available: false,
        error: "Username must be 3-30 characters and contain only letters, numbers, and underscores"
      }, { status: 400 })
    }

    // Check if username exists
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: 'insensitive' // Case-insensitive check
        },
        NOT: {
          id: userId // Exclude current user
        }
      },
      select: { id: true }
    })

    const available = !existingUser

    return NextResponse.json({
      available,
      username,
      message: available
        ? "Username is available"
        : "Username is already taken"
    })

  } catch (error) {
    console.error("Username check error:", error)
    return NextResponse.json(
      { error: "Failed to check username availability" },
      { status: 500 }
    )
  }
}