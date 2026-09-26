import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Rate limiting with graceful degradation:
 *   1. Upstash Redis fixed-window   — when UPSTASH_REDIS_REST_URL/_TOKEN are set
 *      (production-grade; doesn't load the primary Postgres).
 *   2. Postgres atomic counter      — durable fallback via a single
 *      INSERT … ON CONFLICT DO UPDATE … RETURNING on the `RateLimit` table
 *      (no SELECT-then-UPDATE; avoids hot-row contention). Shared across
 *      serverless instances, unlike an in-process map.
 *
 * Single API: `assertRateLimit(actorKey, action, opts)` throws `RateLimitError`
 * (429) when the window is exceeded.
 */

export class RateLimitError extends Error {
  readonly status = 429 as const;
  constructor(
    message = "Too many requests",
    readonly retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export type RateLimitOptions = {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
};

type Backend = {
  /** Returns the current count after incrementing, plus the window reset (epoch ms). */
  hit(key: string, opts: RateLimitOptions): Promise<{ count: number; resetAt: number }>;
};

// --- Postgres durable fallback (atomic upsert) -------------------------------

const postgresBackend: Backend = {
  async hit(key, { windowSeconds }) {
    const now = new Date();
    const newReset = new Date(now.getTime() + windowSeconds * 1000);
    // Single statement: if the row is missing or its window has expired, start a
    // new window at count 1; otherwise increment. `xmax = 0` distinguishes a
    // fresh INSERT from an UPDATE so an expired window resets cleanly.
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
      VALUES (${key}, 1, ${newReset}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${newReset} ELSE "RateLimit"."resetAt" END,
        "updatedAt" = ${now}
      RETURNING "count", "resetAt";
    `;
    const row = rows[0];
    return { count: row.count, resetAt: new Date(row.resetAt).getTime() };
  },
};

// In-process last-resort if the DB write itself fails (never throws from here).
const buckets = new Map<string, { count: number; resetAt: number }>();
const memoryBackend: Backend = {
  async hit(key, { windowSeconds }) {
    const now = Date.now();
    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowSeconds * 1000 };
      buckets.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  },
};

// --- Upstash backend (lazy, only if configured) ------------------------------

let upstashBackend: Backend | null | undefined;

async function getUpstashBackend(): Promise<Backend | null> {
  if (upstashBackend !== undefined) return upstashBackend;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    upstashBackend = null;
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url, token });
    // Fixed-window via INCR + EXPIRE (matches the Postgres fallback semantics).
    upstashBackend = {
      async hit(key, { windowSeconds }) {
        const count = (await redis.incr(key)) as number;
        if (count === 1) {
          await redis.expire(key, windowSeconds);
        }
        return { count, resetAt: Date.now() + windowSeconds * 1000 };
      },
    };
  } catch {
    // Unreachable / misconfigured — degrade to memory.
    upstashBackend = null;
  }
  return upstashBackend;
}

// --- Public API --------------------------------------------------------------

/**
 * Throws `RateLimitError` if `actorKey` has exceeded `limit` requests for
 * `action` within `windowSeconds`. `actorKey` should already encode the actor
 * (user id, or an anon/session/ip-derived key) — anonymous limits should be set
 * far tighter than authenticated ones by the caller.
 */
export async function assertRateLimit(
  actorKey: string,
  action: string,
  opts: RateLimitOptions
): Promise<void> {
  const key = `rl:${action}:${actorKey}`;
  const upstash = await getUpstashBackend();

  let result: { count: number; resetAt: number };
  if (upstash) {
    result = await upstash.hit(key, opts);
  } else {
    try {
      result = await postgresBackend.hit(key, opts);
    } catch {
      // DB unavailable — best-effort in-process so a transient DB issue doesn't
      // open the floodgates entirely (per-instance, but better than nothing).
      result = await memoryBackend.hit(key, opts);
    }
  }

  if (result.count > opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new RateLimitError("Too many requests", retryAfter);
  }
}
