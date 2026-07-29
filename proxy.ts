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
import { isOnboardingComplete } from './lib/onboarding-status'

const withLocale = (path: string) => `/:locale${path.startsWith('/') ? '' : '/'}${path}`

const isProtectedRoute = createRouteMatcher([
    withLocale('/dashboard/:path*'),
    withLocale('/collaborate'),
    withLocale('/research-and-action/case-studies/submit'),
])

const isProtectedApiRoute = createRouteMatcher([
    '/api/profile',
    '/api/profile/(.*)',
    '/api/account',
    '/api/account/(.*)',
    '/api/users/(.*)',
    '/api/onboarding/(.*)',
    '/api/case-studies/submit',
])

const isOnboardingRoute = createRouteMatcher([withLocale('/onboarding')])

const intlMiddleware = createIntlMiddleware(routing)

export const proxy = clerkMiddleware(async (auth, req: NextRequest) => {
    // Skip middleware for webhook routes
    if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
        return NextResponse.next()
    }

    // Skip Clerk for sync routes (internal Bearer token auth)
    if (req.nextUrl.pathname.match(/^\/api\/search\/.*\/sync$/)) {
        return NextResponse.next()
    }

    // Public API routes — no auth, no i18n
    if (req.nextUrl.pathname.startsWith('/api/communities')) {
        return NextResponse.next()
    }

    // Search counts — public endpoint
    if (req.nextUrl.pathname === '/api/search/counts') {
        return NextResponse.next()
    }

    // Protected API routes — require auth, no i18n
    if (isProtectedApiRoute(req)) {
        const authResult = await auth()
        if (!authResult.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        return NextResponse.next()
    }

    // i18n for non-API routes
    if (!req.nextUrl.pathname.startsWith('/api/')) {
        const intlResponse = intlMiddleware(req)
        if (intlResponse) return intlResponse
    }

    const authResult = await auth()
    const { userId, sessionClaims } = authResult

    // Allow authenticated users on onboarding route
    if (userId && isOnboardingRoute(req)) {
        return NextResponse.next()
    }

    // Protected routes — redirect unauthenticated users to sign-in
    if (isProtectedRoute(req) && !userId) {
        const cleanUrl = new URL(req.url)
        cleanUrl.searchParams.delete('redirect_url')
        return authResult.redirectToSignIn({ returnBackUrl: cleanUrl.toString() })
    }

    // Onboarding enforcement on protected routes only
    if (
        userId &&
        isProtectedRoute(req) &&
        !isOnboardingRoute(req) &&
        !isOnboardingComplete(sessionClaims)
    ) {
        const onboardingUrl = new URL('/onboarding', req.url)
        return NextResponse.redirect(onboardingUrl)
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
        // xml/txt cover sitemap.xml + robots.txt — without them the locale
        // redirect sent crawlers to /en/sitemap.xml, which 404s (B7 fix).
        '/((?!studio|guide-to-editors|_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
        '/(api|trpc)(.*)',
    ]
}
