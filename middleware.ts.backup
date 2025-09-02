import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { NextRequest, NextResponse } from 'next/server'

const withLocale = (path: string) => `/:locale${path.startsWith('/') ? '' : '/'}${path}`

const isPublicRoute = createRouteMatcher([
    withLocale('/'),
    withLocale('/(main)/:path*'),
    withLocale('/sign-in'),
    withLocale('/sign-up'),
    '/api/(.*)',
    '/api/webhooks/(.*)'
])

const isOnboardingRoute = createRouteMatcher([withLocale('/onboarding')])

const intlMiddleware = createIntlMiddleware(routing)

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Handle webhook routes - skip all middleware //todo: is middleware properly configured?
    if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
        return NextResponse.next()
    }
    const intlResponse = intlMiddleware(req)
    if (intlResponse) return intlResponse

    const authResult = await auth()
    const { userId, sessionClaims } = authResult

    if (userId && isOnboardingRoute(req)) {
        return NextResponse.next()
    }

    if (!userId && !isPublicRoute(req)) {
        const cleanUrl = new URL(req.url)
        cleanUrl.searchParams.delete('redirect_url') // prevent nested loops
        return authResult.redirectToSignIn({ returnBackUrl: cleanUrl.toString() })
    }

    if (
        userId &&
        !sessionClaims?.metadata?.onboardingComplete &&
        !isOnboardingRoute(req) &&
        !isPublicRoute(req)
    ) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        /**
         * Match all paths EXCEPT:
         * - _next, _vercel
         * - static assets
         * - studio and all its subroutes
         */
        '/((?!studio|_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ]
}
