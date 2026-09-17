import { createHash } from "crypto";

/**
 * Rate-limit actor key for a caller we cannot identify by user id.
 *
 * Derived from the client IP — first `x-forwarded-for` hop (what Vercel sets),
 * then `x-real-ip`, else a shared "unknown" bucket — and hashed so no raw
 * address reaches the rate-limit store. Shared by `rateLimitRequest` (route
 * handlers) and the anonymous path of server actions such as `postComment`,
 * which until audit finding M5 keyed its limit on the attacker-chosen
 * `authorName`: a new display name per request was a new budget.
 *
 * Takes a `Headers` (a request's, or `await headers()` inside a server action)
 * so it is pure and testable without a request context.
 */
export function ipActorKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `ip:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
}
