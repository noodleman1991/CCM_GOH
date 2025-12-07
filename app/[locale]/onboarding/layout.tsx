import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const { userId } = await auth()

    if (!userId) {
        redirect('/sign-in')
    }

    // Check if user has completed onboarding in our database
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { onboardingCompleted: true }
    })

    // Also check Clerk metadata as fallback
    const { sessionClaims } = await auth()
    const clerkOnboardingComplete = sessionClaims?.publicMetadata?.onboardingCompleted === true

    if (user?.onboardingCompleted || clerkOnboardingComplete) {
        redirect('/account')
    }

    return <>{children}</>
}
