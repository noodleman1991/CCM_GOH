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
import { PAYLOAD_API_ANONYMOUS_RATE_LIMIT, shouldRateLimitPayloadApi } from './lib/payload-api-guard'
import { legacyUploadRedirect } from '@/lib/uploads/legacy-upload-redirect'

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
    // PostHog's reverse proxy (next.config.mjs rewrites). Rewrites run after
    // middleware, so without this next-intl would 307 `/ingest/e/` to
    // `/en/ingest/e/`. Returning here also skips Clerk's auth() per beacon.
    if (req.nextUrl.pathname.startsWith('/ingest/')) {
        return NextResponse.next()
    }
    // Uploads served from the bucket: an old /payload-api/<slug>/file/ URL (email,
    // shared preview, cached page) becomes a 308 to the same object on the
    // public hostname. No-op while the host is unset.
    const uploadTarget = legacyUploadRedirect(
        req.nextUrl.pathname,
        req.nextUrl.searchParams,
        process.env.NEXT_PUBLIC_PAYLOAD_MEDIA_PUBLIC_URL,
    )
    if (uploadTarget) {
        return NextResponse.redirect(uploadTarget, 308)
    }
    // next.config sets skipTrailingSlashRedirect for the ingest prefix; this
    // keeps the 308 every other path had before (one canonical URL per page).
    if (req.nextUrl.pathname.length > 1 && req.nextUrl.pathname.endsWith('/')) {
        // A plain URL, not `nextUrl.clone()`: NextURL's pathname setter puts
        // the slash back (verified on `next dev`, 2026-09-17).
        const target = new URL(req.url)
        target.pathname = target.pathname.replace(/\/+$/, '')
        return NextResponse.redirect(target, 308)
    }
    // Payload's admin panel + REST/GraphQL API own their own routing (like
    // Sanity Studio) and must not be locale-prefixed or hit this app's route
    // protection. Unlike Studio, though, they DO need to be matched below so
    // clerkMiddleware wraps the request — Payload's Clerk auth strategy
    // (payload/auth/clerk-strategy.ts) calls `auth()`, which throws outside a
    // clerkMiddleware request context. Returning early here just skips
    // next-intl and this app's own checks; it does not skip Clerk.
    if (req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/payload-api')) {
        // The REST API is reachable without a session and nothing public in
        // this app calls it, so anonymous requests get the same limiter every
        // other public route has. Static files are excluded — see
        // lib/payload-api-guard.ts. Imported lazily so only these requests
        // pay for the limiter's Prisma/Upstash client.
        if (shouldRateLimitPayloadApi(req.nextUrl.pathname)) {
            const { userId } = await auth()
            if (!userId) {
                const { rateLimitRequest } = await import('./lib/rate-limit-route')
                const limited = await rateLimitRequest(req, 'payload-api:anonymous', PAYLOAD_API_ANONYMOUS_RATE_LIMIT)
                if (limited) return limited
            }
        }
        return NextResponse.next()
    }

    // Skip middleware for webhook routes
    if (req.nextUrl.pathname.startsWith('/api/webhooks/')) {
        return NextResponse.next()
    }

    // Skip Clerk for sync routes (internal Bearer token auth)
    if (req.nextUrl.pathname.match(/^\/api\/search\/.*\/sync$/)) {
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
         * - studio and all its subroutes (Sanity Studio owns its own routing
         *   AND its own auth — it never needs Clerk's `auth()`, so it stays
         *   fully excluded)
         *
         * admin and payload-api ARE matched (unlike studio) so
         * clerkMiddleware wraps them and `auth()` works inside Payload's
         * Clerk auth strategy. The early return above keeps next-intl and
         * this app's route protection off both paths — Payload still owns
         * its own routing the same way studio does.
         */
        // xml/txt cover sitemap.xml + robots.txt — without them the locale
        // redirect sent crawlers to /en/sitemap.xml, which 404s (B7 fix).
        '/((?!studio(?:/|$)|guide-to-editors(?:/|$)|_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)',
        '/(api|trpc)(.*)',
        // Old upload URLs carry an image extension the pattern above excludes;
        // they are matched explicitly so the 308 to the public host can run.
        '/payload-api/(media|files)/file/:path*',
    ]
}
