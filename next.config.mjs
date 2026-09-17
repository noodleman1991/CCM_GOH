/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
import { withPayload } from '@payloadcms/next/withPayload';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const withNextIntl = createNextIntlPlugin();

// Pin Turbopack's workspace root to this project. Without it, Next walks up and
// finds a stray ~/package-lock.json, mis-infers the root, and warns on every
// dev/build run.
const projectRoot = dirname(fileURLToPath(import.meta.url));


const isDev = process.env.NODE_ENV === 'development';
const clerkDevDomains = isDev ? ' https://*.clerk.accounts.dev' : '';

// Sanity Studio checks https://sanity-cdn.com/v1/modules/... to see whether a
// newer `sanity` release exists. That host is not covered by `*.sanity.io`, so
// under the site CSP the fetch is blocked and logs `Failed to fetch version for
// package "sanity" ... TypeError: Failed to fetch`. Only /studio needs it, so it
// is granted there rather than site-wide.
const SANITY_MODULES_HOST = 'https://sanity-cdn.com';

// One CSP definition for both routes so the two can never drift apart. Browsers
// intersect multiple CSP headers, so a /studio rule cannot loosen a global one —
// the site rule below has to exclude /studio via a negative lookahead instead.
// Site pages don't need 'unsafe-eval' in production — the only eval-family
// consumer is pdfium's WASM compile, covered by 'wasm-unsafe-eval'. Dev keeps
// full eval for Turbopack HMR, and /studio keeps it (Sanity Studio bundle).
const scriptEval = (studio) =>
  isDev || studio ? "'unsafe-eval'" : "'wasm-unsafe-eval'";

const contentSecurityPolicy = ({ studio = false } = {}) =>
  [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${scriptEval(studio)} https://cdn.clerk.com https://*.clerk.com https://clerk.connectingclimateminds.org${clerkDevDomains} https://challenges.cloudflare.com https://*.algolianet.com https://plausible.io`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://img.clerk.com https://images.clerk.dev https://www.gravatar.com",
    "font-src 'self' data:",
    `connect-src 'self' https://*.clerk.com https://clerk.connectingclimateminds.org${clerkDevDomains} https://*.algolia.net https://*.algolianet.com https://plausible.io https://*.sanity.io https://*.r2.cloudflarestorage.com https://*.upstash.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io${studio ? ` ${SANITY_MODULES_HOST}` : ''}`,
    "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com https://*.clerk.com",
    "media-src 'self' https://cdn.sanity.io",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    // Allow same-origin framing so Sanity Studio's Presentation tool
    // can embed the site for live preview (modern equivalent of the
    // X-Frame-Options: SAMEORIGIN above).
    "frame-ancestors 'self'",
  ].join('; ');

const nextConfig = {
  // Where the build output goes. Overridable so the Phase-3 parity harness
  // (scripts/parity/render-diff.ts) can run its own `next dev` — one per
  // content backend — without fighting the developer's server for `.next`.
  // Two dev servers sharing a dist dir corrupt each other's Turbopack cache,
  // and a poisoned `.next/dev/cache` in this repo shows up as existing routes
  // 404ing with an HTML body. Unset (every build, every ordinary `next dev`)
  // this is exactly `.next`, so nothing changes for anyone not running the
  // harness.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // The Arabic homepage's static export can exceed the default 60s under slow
  // network conditions (heavy Sanity content). Raise the per-page generation
  // budget so static export doesn't fail on a single slow locale.
  staticPageGenerationTimeout: 180,
  // Next 16.3+ appends an agent-rules block to CLAUDE.md on every `next dev`
  // start (config-shared.d.ts: agentRules, default true). CLAUDE.md here is
  // hand-maintained, and a dev-server start should not rewrite tracked files.
  agentRules: false,
  turbopack: {
    root: projectRoot,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            // SAMEORIGIN (not DENY) so the Sanity Studio Presentation tool can
            // iframe the site for live preview. Studio and the site share an
            // origin; third-party framing is still blocked.
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Everything except /studio. Kept separate from the /studio rule below
        // because two matching rules emit two CSP headers and the browser
        // enforces the intersection.
        source: '/((?!studio(?:/|$)).*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy(),
          },
        ],
      },
      {
        source: '/studio/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: contentSecurityPolicy({ studio: true }),
          },
        ],
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
      // Two prefixes shipped in links, cards and the sitemap without ever
      // having a route (2026-09-16 audit). The code no longer emits either;
      // these catch copies already in the wild. `:locale` is constrained so
      // the first rule cannot match `/research-and-action/case-studies/<slug>`
      // itself and bounce the live page.
      {
        source: '/:locale(en|es|fr|ar)/case-studies/:slug',
        destination: '/:locale/research-and-action/case-studies/:slug',
        permanent: true,
      },
      // Agendas have no detail page (Decision 11); the section page is home.
      {
        source: '/:locale(en|es|fr|ar)/research-and-action/agendas/:slug*',
        destination: '/:locale/research-and-action/regional-agendas',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "img.clerk.com"
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev"
      },
      {
        protocol: "https",
        hostname: "www.gravatar.com"
      },
    ],
    // Same-origin images. Declaring this REPLACES Next's default, so the
    // default is restated first, verbatim.
    //
    // The second entry is Phase 3's, and it is not optional. Payload serves
    // media from its own route and signs the object-store prefix into the
    // query string (`/payload-api/media/file/<name>.png?prefix=cms%2Fmedia`),
    // while Next 16's default local pattern is `{ pathname: '/**', search: '' }`
    // — no query string at all. Without this entry `next/image` does not
    // degrade: it **throws**, and the page 500s. Measured on
    // `/en/reader/background-context` with CONTENT_BACKEND=payload, whose
    // rich-text body renders an embedded figure through `ZoomableImage`:
    //
    //   Error: Image with src "/payload-api/media/file/iBook-…png?prefix=cms%2Fmedia"
    //   is using a query string which is not configured in images.localPatterns.
    //
    // Every component image goes the same way once `pages.ts` swaps, so this
    // is the local-URL half of the constraint `remotePatterns` already
    // documents: a Payload image URL must stay same-origin and relative,
    // AND its query string has to be admitted here.
    localPatterns: [
      { pathname: '/**', search: '' },
      { pathname: '/payload-api/media/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    qualities: [75, 85, 90, 100],
  },
};

const withIntl = withNextIntl(nextConfig);

// withPayload goes outside withNextIntl: it wires up Payload's own routes
// and admin bundle, which don't need next-intl's locale handling.
const withIntlAndPayload = withPayload(withIntl);

// Wrap with Sentry only when a DSN is configured, so local/CI builds (and any
// environment without monitoring) are unaffected. Source-map upload happens
// only when SENTRY_AUTH_TOKEN is present.
let finalConfig = withIntlAndPayload;
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import('@sentry/nextjs');
  finalConfig = withSentryConfig(withIntlAndPayload, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    disableLogger: true,
  });
}

export default finalConfig;
