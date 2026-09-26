import { PostHog } from "posthog-node";
import { assertAllowedProperties, type AnalyticsEventName, type AnalyticsEvents } from "@/lib/analytics/events";
import { runAfterCommit } from "@/payload/hooks/after-commit";

/**
 * The server half of PostHog (Slice 11, design §5). One lazily built client;
 * without a key every call is a no-op and the feature is reported as disabled
 * by lib/env.ts.
 *
 * `flushAt: 1` + an awaited `flush()` per capture, because a Vercel function
 * does not live long enough for a batching timer. Callers wrap the promise in
 * `after()` (route handlers, server actions) or `runAfterCommit()` (Payload
 * hooks) so it never adds latency to a response or runs inside a write
 * transaction. `disableGeoip` keeps the privacy policy's "no IP addresses for
 * analytics" true on this side; the project setting "Discard client IP data"
 * is the other half (user-owned, in the PostHog UI).
 */
let client: PostHog | null | undefined;

export function posthogServer(env: Record<string, string | undefined> = process.env): PostHog | null {
  if (client !== undefined) return client;
  const key = env.POSTHOG_KEY ?? env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return (client = null);
  return (client = new PostHog(key, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    flushAt: 1,
    flushInterval: 0,
    disableGeoip: true,
  }));
}

/** The memo is module-level; tests reset it between environments. */
export function resetPostHogServerForTests(): void {
  client = undefined;
}

export type ServerEvent<E extends AnalyticsEventName = AnalyticsEventName> = {
  event: E;
  properties: AnalyticsEvents[E];
  /** The Clerk id (also the Prisma `User.id`). Absent ⇒ anonymous: random id, no person profile. */
  distinctId?: string | null;
  /** Person properties, set server-side only and never identity: role, onboarding state, community kinds. */
  set?: Record<string, unknown>;
  groups?: Record<string, string>;
};

/**
 * Fire-and-forget capture that never throws: analytics must not be able to
 * fail the request or the write it describes. Failures are logged.
 */
export async function captureServer<E extends AnalyticsEventName>(e: ServerEvent<E>): Promise<void> {
  const ph = posthogServer();
  if (!ph) return;
  try {
    const props = (e.properties ?? {}) as Record<string, unknown>;
    if (process.env.NODE_ENV !== "production") assertAllowedProperties(e.event, props);
    const anonymous = !e.distinctId;
    ph.capture({
      distinctId: e.distinctId ?? crypto.randomUUID(),
      event: e.event,
      properties: {
        // The server tag first so an event's own `source` (newsletter: footer/inline) wins.
        ...(anonymous ? {} : { source: "server" }),
        ...props,
        ...(anonymous ? { $process_person_profile: false } : {}),
        ...(e.set ? { $set: e.set } : {}),
      },
      ...(e.groups ? { groups: e.groups } : {}),
    });
    await ph.flush();
  } catch (error) {
    console.error(`[analytics] capture of ${e.event} failed:`, error);
  }
}

/**
 * Schedule a capture for after the response (route handlers, server actions)
 * without holding the caller. Inside a Next request this is `after()`; outside
 * one — scripts, vitest — `after()` throws and the work is detached instead,
 * which is what the shared after-commit helper already does for Payload hooks.
 * Tests observe it with `flushDeferred()`.
 */
export function captureAfterResponse<E extends AnalyticsEventName>(e: ServerEvent<E>): void {
  runAfterCommit(() => captureServer(e));
}
