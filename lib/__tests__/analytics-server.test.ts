import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice 11. The server half: one lazily built posthog-node client, no key ⇒
 * a no-op, anonymous events carry no person profile, GeoIP is discarded so the
 * privacy policy's "no IP addresses for analytics" stays true, and every
 * capture is flushed immediately because a Vercel function does not live long
 * enough for a batching timer.
 */
const { instances, capture, flush } = vi.hoisted(() => {
  const capture = vi.fn();
  const flush = vi.fn(async () => undefined);
  const instances: Array<{ key: string; options: Record<string, unknown> }> = [];
  return { instances, capture, flush };
});
vi.mock("posthog-node", () => ({
  PostHog: class {
    constructor(key: string, options: Record<string, unknown>) {
      instances.push({ key, options });
    }
    capture = capture;
    flush = flush;
  },
}));

import { captureServer, posthogServer, resetPostHogServerForTests } from "@/lib/analytics/server";

const ENV_KEYS = ["POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  instances.length = 0;
  capture.mockClear();
  flush.mockClear();
  resetPostHogServerForTests();
});
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("posthogServer", () => {
  it("is null without a key, and no client is constructed", () => {
    expect(posthogServer()).toBeNull();
    expect(instances).toHaveLength(0);
  });

  it("builds one client with immediate flushing, the EU host and GeoIP discarded", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_public";
    const a = posthogServer();
    const b = posthogServer();
    expect(a).toBe(b);
    expect(instances).toEqual([
      {
        key: "phc_public",
        options: expect.objectContaining({
          host: "https://eu.i.posthog.com",
          flushAt: 1,
          flushInterval: 0,
          disableGeoip: true,
        }),
      },
    ]);
  });

  it("prefers the server-only key over the public one", () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_public";
    process.env.POSTHOG_KEY = "phc_server";
    posthogServer();
    expect(instances[0].key).toBe("phc_server");
  });
});

describe("captureServer", () => {
  it("resolves without doing anything when analytics is not configured", async () => {
    await expect(captureServer({ event: "newsletter_subscribed", properties: { source: "footer" } })).resolves.toBeUndefined();
    expect(capture).not.toHaveBeenCalled();
  });

  it("sends an identified event with $set and groups, tagged as server-side, and flushes", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    await captureServer({
      event: "onboarding_completed",
      distinctId: "user_1",
      properties: { waived: false },
      set: { role: "community_member", onboarding_completed: true },
      groups: { community: "c1" },
    });
    expect(capture).toHaveBeenCalledWith({
      distinctId: "user_1",
      event: "onboarding_completed",
      properties: { waived: false, source: "server", $set: { role: "community_member", onboarding_completed: true } },
      groups: { community: "c1" },
    });
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("gives an anonymous event a random id and no person profile", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    await captureServer({ event: "newsletter_subscribed", properties: { source: "footer" } });
    const arg = capture.mock.calls[0][0];
    expect(arg.distinctId).toMatch(/^[0-9a-f-]{36}$/);
    expect(arg.properties).toEqual({ source: "footer", $process_person_profile: false });
    expect(arg.properties.source).toBe("footer"); // the caller's `source` wins over the server tag
  });

  it("never lets a capture failure escape to the caller", async () => {
    process.env.POSTHOG_KEY = "phc_server";
    flush.mockRejectedValueOnce(new Error("network"));
    await expect(captureServer({ event: "newsletter_subscribed", properties: { source: "footer" } })).resolves.toBeUndefined();
  });
});
