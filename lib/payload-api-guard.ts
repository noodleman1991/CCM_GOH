/**
 * Which `/payload-api` requests the proxy rate-limits when they arrive with
 * no session.
 *
 * `proxy.ts` returns early for `/admin` and `/payload-api` so that Clerk
 * still wraps them (Payload's auth strategy calls `auth()`) but next-intl and
 * the app's own route protection do not. That early return also skipped the
 * rate limiter every other public route goes through, so an anonymous caller
 * could loop unbounded REST reads against Neon for free.
 *
 * Static file requests are deliberately excluded. A rendered page carries
 * dozens of `/payload-api/media/file/…` images, the image optimizer fetches
 * them server-side from the same IP, and they are the one part of this
 * surface that is meant to be hot. They are protected by unguessable names
 * (`payload/hooks/upload-filename.ts`) and cached by the CDN
 * (`payload/hooks/upload-headers.ts`) instead.
 *
 * Pure, so the rule is testable without standing up the proxy.
 */
const FILE_ROUTE = /^\/payload-api\/[^/]+\/file\//;

export function shouldRateLimitPayloadApi(pathname: string): boolean {
  if (!pathname.startsWith("/payload-api/") && pathname !== "/payload-api") return false;
  return !FILE_ROUTE.test(pathname);
}

/**
 * Per anonymous IP, per minute. The admin's own unauthenticated probes on the
 * login screen are a handful of requests; a scraper or a loop is hundreds.
 */
export const PAYLOAD_API_ANONYMOUS_RATE_LIMIT = { limit: 60, windowSeconds: 60 } as const;
