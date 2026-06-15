import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export default async function Page({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    // Pass the locale-prefixed path so Clerk's internal navigation (factor
    // steps, SSO callbacks) stays within next-intl's `/<locale>/sign-in` route.
    // Without this, Clerk routes to `/sign-in/...` which doesn't exist under
    // localePrefix:'always' — the page errors then recovers ("crash then load").
    return (
        <SignIn
            path={`/${locale}/sign-in`}
            signUpUrl={`/${locale}/sign-up`}
            fallbackRedirectUrl={`/${locale}/dashboard`}
            appearance={clerkAppearance}
        />
    )
}
