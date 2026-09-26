// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice 11. The browser client's two decisions that a rendered check cannot
 * prove on its own: the init options are the privacy-preserving set (proxy
 * host, no autocapture, no recording, anonymous until identify), and a decline
 * leaves no PostHog storage behind — `reset()` alone re-seeds anonymous ids
 * into the same key (verified in Chrome, 2026-09-17).
 */
const { fake, calls } = vi.hoisted(() => {
  const calls: Record<string, unknown[][]> = {};
  const rec = (name: string) => (...args: unknown[]) => {
    (calls[name] ??= []).push(args);
  };
  let optedOut = false;
  const fake = {
    init: rec("init"),
    register: rec("register"),
    opt_in_capturing: () => {
      optedOut = false;
      rec("opt_in_capturing")();
    },
    opt_out_capturing: () => {
      optedOut = true;
      rec("opt_out_capturing")();
    },
    has_opted_out_capturing: () => optedOut,
    reset: rec("reset"),
    persistence: { clear: rec("persistence.clear") },
    sessionPersistence: { clear: rec("sessionPersistence.clear") },
  };
  return { fake, calls };
});
vi.mock("posthog-js", () => ({ default: fake }));

import { getPostHog, loadPostHog, unloadPostHog } from "@/lib/analytics/client";

beforeEach(() => {
  for (const k of Object.keys(calls)) delete calls[k];
  process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test";
  localStorage.setItem("ph_phc_test_posthog", "{}");
  sessionStorage.setItem("ph_phc_test_window_id", "x");
});
afterEach(() => {
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
});

describe("loadPostHog", () => {
  it("initialises once, through the proxy, with the privacy-preserving option set and the locale super properties", async () => {
    const a = await loadPostHog({ locale: "ar", dir: "rtl" });
    const b = await loadPostHog({ locale: "ar", dir: "rtl" });
    expect(a).toBe(b);
    expect(calls.init).toHaveLength(1);
    const [key, options] = calls.init[0] as [string, Record<string, unknown>];
    expect(key).toBe("phc_test");
    expect(options).toMatchObject({
      api_host: "/ingest",
      person_profiles: "identified_only",
      capture_pageview: false,
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      mask_all_text: true,
      secure_cookie: true,
      advanced_disable_flags: true,
    });
    expect(calls.register[0][0]).toMatchObject({ locale: "ar", dir: "rtl" });
  });
});

describe("unloadPostHog", () => {
  it("opts out, resets, and wipes every ph_ storage entry so a decline leaves nothing behind", async () => {
    await loadPostHog({ locale: "en", dir: "ltr" });
    unloadPostHog();
    expect(calls.opt_out_capturing).toHaveLength(1);
    expect(calls.reset).toHaveLength(1);
    expect(calls["persistence.clear"]).toHaveLength(1);
    expect(Object.keys(localStorage).filter((k) => k.startsWith("ph_"))).toEqual([]);
    expect(Object.keys(sessionStorage).filter((k) => k.startsWith("ph_"))).toEqual([]);
    expect(getPostHog()).toBeNull();
  });

  it("re-accepting opts the same instance back in", async () => {
    await loadPostHog({ locale: "en", dir: "ltr" });
    unloadPostHog();
    const before = calls.opt_in_capturing?.length ?? 0;
    await loadPostHog({ locale: "en", dir: "ltr" });
    expect(calls.opt_in_capturing).toHaveLength(before + 1);
    expect(getPostHog()).not.toBeNull();
  });
});
