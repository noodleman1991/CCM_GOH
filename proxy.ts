/**
 * Proxy (Node.js Runtime)
 *
 * Handles request interception for:
 * - Clerk authentication and session management
 * - next-intl internationalization routing
 * - Route protection and authorization
 * - Onboarding flow enforcement
 *
 * Runs on Node.js runtime (Next.js 16+) for full compatibility with
 * authentication libraries and i18n providers.
 */
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
    '/api/webhooks/(.*)'
])

const isProtectedApiRoute = createRouteMatcher([
    '/api/profile',
    '/api/profile/(.*)',
    '/api/account',
    '/api/account/(.*)',
    '/api/users/(.*)',
    // Removed: '/api/search/(.*)' - sync routes have internal auth
    '/api/onboarding/(.*)',
    '/api/case-studies/submit',
])

const isProtectedRoute = createRouteMatcher([
    withLocale('/(main)/dashboard/:path*'),
])

const isOnboardingRoute = createRouteMatcher([withLocale('/onboarding')])

const intlMiddleware = createIntlMiddleware(routing)

export const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
    // Handle webhook routes - skip all middleware
    if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
        return NextResponse.next()
    }

    // Handle sync routes - skip Clerk auth, they have internal Bearer token auth
    if (req.nextUrl.pathname.match(/^\/api\/search\/.*\/sync$/)) {
        return NextResponse.next()
    }

    // Handle public API routes - no authentication required, no i18n
    if (req.nextUrl.pathname.startsWith('/api/communities')) {
        return NextResponse.next()
    }

    // Handle protected API routes - require authentication but no i18n
    if (isProtectedApiRoute(req)) {
        const authResult = await auth()
        if (!authResult.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.next()
    }

    // Handle i18n for non-API routes
    if (!req.nextUrl.pathname.startsWith('/api/')) {
        const intlResponse = intlMiddleware(req)
        if (intlResponse) return intlResponse
    }

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
        !(sessionClaims?.publicMetadata as { onboardingCompleted?: boolean })?.onboardingCompleted &&
        !isOnboardingRoute(req) &&
        !isPublicRoute(req)
    ) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
    }

    // Explicitly protect dashboard routes
    if (isProtectedRoute(req) && !userId) {
        return authResult.redirectToSignIn({ returnBackUrl: req.url })
    }

    return NextResponse.next()
})

export default proxy

export const config = {
    matcher: [
        /**
         * Match all paths EXCEPT:
         * - _next, _vercel
         * - static assets
         * - studio and all its subroutes
         */
        '/((?!studio|_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ]
}
