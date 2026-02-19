import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export const runtime = 'nodejs'

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user's preferred language (default to EN if not set)
    const clerkUser = await (await clerkClient()).users.getUser(userId)
    const preferredLanguageStr = (clerkUser.publicMetadata?.preferredLanguage as string) || 'EN'

    // Ensure the language value matches the Prisma Language enum
    const preferredLanguage = ['EN', 'ES', 'FR', 'AR'].includes(preferredLanguageStr)
      ? preferredLanguageStr as 'EN' | 'ES' | 'FR' | 'AR'
      : 'EN' as const

    // Update Prisma database
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        welcomeMessageSeen: true,
        onboardingStep: 6,
        preferredLanguage: preferredLanguage,
        updatedAt: new Date()
      }
    })

    // Update Clerk metadata with minimal essential fields
    await (await clerkClient()).users.updateUser(userId, {
      publicMetadata: {
        onboardingCompleted: true,
        onboardingWaived: true,
        preferredLanguage: preferredLanguage
      }
    })

    console.log(`✅ Onboarding waived for user ${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ Failed to waive onboarding for user ${userId}:`, error)
    return NextResponse.json(
      { error: "Failed to waive onboarding. Please try again." },
      { status: 500 }
    )
  }
}