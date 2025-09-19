import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check onboarding completion status in Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingCompleted: true,
        onboardingStep: true
      }
    })

    // Also check Clerk metadata as fallback
    const { sessionClaims } = await auth()
    const clerkOnboardingComplete = sessionClaims?.metadata?.onboardingComplete === true

    const isCompleted = user?.onboardingCompleted || clerkOnboardingComplete

    return NextResponse.json({
      completed: isCompleted,
      step: user?.onboardingStep || 0
    })

  } catch (error) {
    console.error('Failed to check onboarding status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}