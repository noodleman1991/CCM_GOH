import "server-only";
import { createHash } from "crypto";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertRateLimit, RateLimitError, type RateLimitOptions } from "@/lib/rate-limit";

/**
 * Route-handler rate limiting. Resolves an actor key (Clerk userId when signed
 * in, otherwise a truncated hash of the client IP — no raw IP ever reaches the
 * rate-limit store) and returns a ready 429 response when the window is
 * exceeded, or null to proceed.
 *
 * Usage at the top of a handler:
 *   const limited = await rateLimitRequest(request, "case-study:submit", { limit: 5, windowSeconds: 600 });
 *   if (limited) return limited;
 */
export async function rateLimitRequest(
  request: Request,
  action: string,
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  let key: string | null = null;
  try {
    const { userId } = await auth();
    if (userId) key = userId;
  } catch {
    // Outside clerkMiddleware context — fall through to the IP-derived key.
  }
  if (!key) {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    key = `ip:${createHash("sha256").update(ip).digest("hex").slice(0, 16)}`;
  }

  try {
    await assertRateLimit(key, action, opts);
    return null;
  } catch (e) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Too many requests — please try again later." },
        {
          status: 429,
          headers: e.retryAfterSeconds
            ? { "Retry-After": String(e.retryAfterSeconds) }
            : undefined,
        }
      );
    }
    // The limiter itself failing must never take the route down.
    console.warn(`[rate-limit] ${action} check failed open:`, e);
    return null;
  }
}
