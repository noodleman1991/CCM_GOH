import "server-only";

/**
 * Rate limiting with graceful degradation:
 *   1. Upstash Redis sliding-window  — when UPSTASH_REDIS_REST_URL/_TOKEN are set
 *      (production-grade; doesn't load the primary Postgres).
 *   2. In-process fixed-window counter — fallback for local/CI/preview where
 *      Upstash isn't configured. Per-instance only (not shared across serverless
 *      instances), so it is best-effort; combined with Turnstile on anonymous
 *      writes it is sufficient until the durable Postgres `RateLimit` table is
 *      added (see production-specs Stage 7), at which point this falls back to
 *      the DB counter instead of memory.
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

// --- In-process fallback -----------------------------------------------------

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
  const backend = (await getUpstashBackend()) ?? memoryBackend;
  const { count, resetAt } = await backend.hit(key, opts);
  if (count > opts.limit) {
    const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
    throw new RateLimitError("Too many requests", retryAfter);
  }
}
