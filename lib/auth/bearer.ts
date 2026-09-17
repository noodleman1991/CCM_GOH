import { timingSafeEqual } from "node:crypto";

/**
 * The one bearer-token comparison for every secret-keyed route: cron jobs
 * (`CRON_SECRET`), the internal search sync (`INTERNAL_SYNC_SECRET`), the
 * search webhooks (`SEARCH_WEBHOOK_SECRET`) and manual cache revalidation
 * (`ADMIN_API_KEY`).
 *
 * Why a helper (hub audit 2026-09-16, H3 and the cron "Low" item): every route
 * had its own `authHeader !== \`Bearer ${secret}\``. That has two failure modes
 * that bit us at once:
 *
 *  1. An unset secret interpolates to the literal string `Bearer undefined`, so
 *     a caller who sends exactly that header authenticates. Production had no
 *     `INTERNAL_SYNC_SECRET`, and `scripts/sync-all-search.js` (run by CI's
 *     build step, also with no secret) sent `Bearer ${undefined}` — CI could
 *     re-index the live Algolia indices. This helper returns `false` for an
 *     unset or empty secret, always.
 *  2. `!==` on strings short-circuits at the first differing byte, which leaks
 *     the prefix of the secret through response timing. Buffers of equal
 *     length go through `crypto.timingSafeEqual`; a length mismatch returns
 *     `false` directly, which discloses only the secret's length — acceptable
 *     for high-entropy random secrets, and what every mainstream framework
 *     does.
 *
 * The prefix is the exact string `Bearer ` (RFC 6750 §2.1). No trimming, no
 * case folding: Vercel cron, Sanity, and our own scripts all send it verbatim,
 * and lenient parsing is how "Bearer  <secret>" or "bearer <secret>" ends up
 * matching in one route and not another.
 *
 * @param authorizationHeader the raw `Authorization` header, or `null`
 * @param secret the configured secret; `undefined` or `''` never matches
 */
export function bearerMatches(authorizationHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false;
  if (!authorizationHeader) return false;

  const prefix = "Bearer ";
  if (!authorizationHeader.startsWith(prefix)) return false;

  const presented = Buffer.from(authorizationHeader.slice(prefix.length), "utf8");
  const expected = Buffer.from(secret, "utf8");
  if (presented.length !== expected.length) return false;

  return timingSafeEqual(presented, expected);
}
