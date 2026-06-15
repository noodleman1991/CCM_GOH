import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    // Locale-prefixed path keeps Clerk's multi-step navigation inside the
    // next-intl `/<locale>/sign-up` route (see the sign-in page for why).
    return (
        <SignUp
            path={`/${locale}/sign-up`}
            signInUrl={`/${locale}/sign-in`}
            forceRedirectUrl={`/${locale}/onboarding`}
            appearance={clerkAppearance}
        />
    )
}
