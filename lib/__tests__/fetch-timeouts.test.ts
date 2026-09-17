/**
 * Outbound fetches must carry a timeout (audit finding M8: Nominatim,
 * Turnstile, ORCID and OpenAlex had none, so one stalled upstream held a
 * serverless function until the platform killed it). Each site passes
 * `signal: AbortSignal.timeout(ms)` — 5 s for Turnstile (a human is waiting
 * on a form), 10 s for the rest — and a timeout must produce the same
 * "unavailable" result the caller already produced for a network error,
 * now logged through `reportError`.
 *
 * Why not `vi.useFakeTimers()`: Node implements `AbortSignal.timeout` on its
 * internal unref'd timer, not the global `setTimeout` that fake timers patch
 * (verified: patching `globalThis.setTimeout` and calling
 * `AbortSignal.timeout(5)` never hits the patch). So the test spies on
 * `AbortSignal.timeout` itself, hands back a controllable signal, and the
 * fake `fetch` does what undici does: hang until the signal aborts, then
 * reject with `signal.reason` (a `TimeoutError` DOMException).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const report = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock("@/lib/errors/report", () => report);

import { geocodeQuery, geocodeLocation, reverseGeocode } from "@/lib/geocoding";
import { verifyTurnstile } from "@/lib/turnstile";
import { fetchOrcid } from "@/lib/integrations/orcid";
import { fetchOpenAlexWorks } from "@/lib/integrations/openalex";

type Armed = { ms: number; controller: AbortController };

/** Replace `AbortSignal.timeout` with one we can fire on demand. */
function armTimeouts() {
  const armed: Armed[] = [];
  vi.spyOn(AbortSignal, "timeout").mockImplementation((ms: number) => {
    const controller = new AbortController();
    armed.push({ ms, controller });
    return controller.signal;
  });
  return {
    armed,
    fire() {
      for (const { controller } of armed) {
        controller.abort(new DOMException("The operation was aborted due to timeout", "TimeoutError"));
      }
    },
  };
}

/** A fetch that never resolves on its own; rejects with the abort reason. */
function hangingFetch() {
  return vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return; // no signal: hangs forever, and the test times out — that is the bug
      if (signal.aborted) return reject(signal.reason);
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  });
}

function okJson(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("Nominatim (lib/geocoding.ts) — 10 s", () => {
  it("geocodeQuery: passes a 10 s signal, returns [] on timeout and reports it", async () => {
    const timeouts = armTimeouts();
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const pending = geocodeQuery("Nakuru");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(timeouts.armed.map((a) => a.ms)).toEqual([10_000]);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(timeouts.armed[0].controller.signal);

    timeouts.fire();
    await expect(pending).resolves.toEqual([]);
    expect(report.reportError).toHaveBeenCalledTimes(1);
    const [err, ctx] = report.reportError.mock.calls[0];
    expect((err as DOMException).name).toBe("TimeoutError");
    expect(ctx).toMatchObject({ route: "geocoding" });
  });

  it("geocodeLocation: passes a 10 s signal, returns success:false on timeout and reports it", async () => {
    const timeouts = armTimeouts();
    vi.stubGlobal("fetch", hangingFetch());

    const pending = geocodeLocation("Nakuru", "Kenya");
    await Promise.resolve();
    expect(timeouts.armed.map((a) => a.ms)).toEqual([10_000]);

    timeouts.fire();
    const result = await pending;
    expect(result.success).toBe(false);
    expect(result.location).toBeUndefined();
    expect(typeof result.error).toBe("string");
    expect(report.reportError).toHaveBeenCalledTimes(1);
    expect(report.reportError.mock.calls[0][1]).toMatchObject({ route: "geocoding" });
  });

  it("reverseGeocode: passes a 10 s signal, returns success:false on timeout and reports it", async () => {
    const timeouts = armTimeouts();
    vi.stubGlobal("fetch", hangingFetch());

    const pending = reverseGeocode(-0.28, 36.07);
    await Promise.resolve();
    expect(timeouts.armed.map((a) => a.ms)).toEqual([10_000]);

    timeouts.fire();
    const result = await pending;
    expect(result.success).toBe(false);
    expect(result.address).toBeUndefined();
    expect(report.reportError).toHaveBeenCalledTimes(1);
  });

  it("geocodeQuery: a healthy response is unaffected", async () => {
    armTimeouts();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJson([{ display_name: "Nakuru, Kenya", lat: "-0.28", lon: "36.07", type: "city", address: { country_code: "ke" } }])
      )
    );
    const results = await geocodeQuery("Nakuru");
    expect(results).toHaveLength(1);
    expect(report.reportError).not.toHaveBeenCalled();
  });
});

describe("Turnstile (lib/turnstile.ts) — 5 s, fails closed", () => {
  it("passes a 5 s signal and returns false (not open) on timeout, reporting it", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    const timeouts = armTimeouts();
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const pending = verifyTurnstile("token-123");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(timeouts.armed.map((a) => a.ms)).toEqual([5_000]);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(timeouts.armed[0].controller.signal);

    timeouts.fire();
    await expect(pending).resolves.toBe(false);
    expect(report.reportError).toHaveBeenCalledTimes(1);
    expect(report.reportError.mock.calls[0][1]).toMatchObject({ route: "turnstile" });
  });

  it("still returns true on a healthy success response", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "test-secret");
    armTimeouts();
    vi.stubGlobal("fetch", vi.fn(async () => okJson({ success: true })));
    await expect(verifyTurnstile("token-123")).resolves.toBe(true);
    expect(report.reportError).not.toHaveBeenCalled();
  });
});

describe("ORCID (lib/integrations/orcid.ts) — 10 s on each of the three calls", () => {
  it("passes a 10 s signal to works, employments and educations and surfaces the timeout", async () => {
    const timeouts = armTimeouts();
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchOrcid("0000-0002-1825-0097");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(timeouts.armed.map((a) => a.ms)).toEqual([10_000, 10_000, 10_000]);
    for (let i = 0; i < 3; i++) {
      expect(fetchMock.mock.calls[i][1]?.signal).toBe(timeouts.armed[i].controller.signal);
    }

    // The library stays a thin wrapper: it throws, and the import route maps
    // that to its existing 500 "Import failed" (tested in orcid-import-route).
    timeouts.fire();
    await expect(pending).rejects.toMatchObject({ name: "TimeoutError" });
  });
});

describe("OpenAlex (lib/integrations/openalex.ts) — 10 s", () => {
  it("passes a 10 s signal and surfaces the timeout to the caller", async () => {
    const timeouts = armTimeouts();
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const pending = fetchOpenAlexWorks("0000-0002-1825-0097");
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(timeouts.armed.map((a) => a.ms)).toEqual([10_000]);
    expect(fetchMock.mock.calls[0][1]?.signal).toBe(timeouts.armed[0].controller.signal);

    timeouts.fire();
    await expect(pending).rejects.toMatchObject({ name: "TimeoutError" });
  });
});
