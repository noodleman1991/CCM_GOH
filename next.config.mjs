/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const withNextIntl = createNextIntlPlugin();

// Pin Turbopack's workspace root to this project. Without it, Next walks up and
// finds a stray ~/package-lock.json, mis-infers the root, and warns on every
// dev/build run.
const projectRoot = dirname(fileURLToPath(import.meta.url));


const isDev = process.env.NODE_ENV === 'development';
const clerkDevDomains = isDev ? ' https://*.clerk.accounts.dev' : '';

const nextConfig = {
  // The Arabic homepage's static export can exceed the default 60s under slow
  // network conditions (heavy Sanity content). Raise the per-page generation
  // budget so static export doesn't fail on a single slow locale.
  staticPageGenerationTimeout: 180,
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
            value: 'DENY',
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
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.clerk.com https://*.clerk.com https://clerk.connectingclimateminds.org${clerkDevDomains} https://challenges.cloudflare.com https://*.algolianet.com https://plausible.io`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://cdn.sanity.io https://img.youtube.com https://img.clerk.com https://images.clerk.dev https://www.gravatar.com",
              "font-src 'self' data:",
              `connect-src 'self' https://*.clerk.com https://clerk.connectingclimateminds.org${clerkDevDomains} https://*.algolia.net https://*.algolianet.com https://plausible.io https://*.sanity.io https://*.r2.cloudflarestorage.com https://*.upstash.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io`,
              "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://challenges.cloudflare.com https://*.clerk.com",
              "media-src 'self' https://cdn.sanity.io",
              "object-src 'none'",
              "worker-src 'self' blob:",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    qualities: [75, 85, 90, 100],
  },
};

const withIntl = withNextIntl(nextConfig);

// Wrap with Sentry only when a DSN is configured, so local/CI builds (and any
// environment without monitoring) are unaffected. Source-map upload happens
// only when SENTRY_AUTH_TOKEN is present.
let finalConfig = withIntl;
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = await import('@sentry/nextjs');
  finalConfig = withSentryConfig(withIntl, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    disableLogger: true,
  });
}

export default finalConfig;
