/**
 * `lib/errors/report.ts` — the one sink for best-effort failures.
 *
 * Two paths: Sentry when the SDK has a client (production with a DSN, see
 * instrumentation.ts / instrumentation-client.ts), console otherwise. Both
 * must carry the same context, and neither may ever throw — a reporter that
 * throws inside a `catch {}` turns a logged failure into a crash.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sentry = vi.hoisted(() => ({
  isInitialized: vi.fn<() => boolean>(() => false),
  captureException: vi.fn<(...a: unknown[]) => string>(() => "event-id"),
}));
vi.mock("@sentry/nextjs", () => sentry);

import { reportError } from "@/lib/errors/report";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  sentry.isInitialized.mockReturnValue(false);
  sentry.captureException.mockImplementation(() => "event-id");
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe("reportError — fallback path (Sentry not initialised)", () => {
  it("writes the error, route and context to console.error and skips Sentry", () => {
    const err = new Error("nominatim down");
    reportError(err, {
      route: "geo/search",
      tags: { source: "nominatim" },
      extra: { query: "Nakuru" },
    });

    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledTimes(1);
    const args = consoleError.mock.calls[0];
    expect(args[0]).toContain("geo/search");
    expect(args).toContain(err);
    // The structured context rides along as one object, so log drains keep it.
    const ctx = args.find((a: unknown) => typeof a === "object" && a !== null && !(a instanceof Error)) as
      | { tags?: Record<string, string>; extra?: Record<string, unknown> }
      | undefined;
    expect(ctx?.tags).toEqual({ source: "nominatim", route: "geo/search" });
    expect(ctx?.extra).toEqual({ query: "Nakuru" });
  });

  it("accepts a bare call with no context and non-Error values", () => {
    expect(() => reportError("string failure")).not.toThrow();
    expect(() => reportError(undefined)).not.toThrow();
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});

describe("reportError — Sentry path", () => {
  it("captures with the route folded into tags and extra passed through", () => {
    sentry.isInitialized.mockReturnValue(true);
    const err = new Error("emit failed");
    reportError(err, {
      route: "cron/event-reminders",
      tags: { step: "emit" },
      extra: { eventId: "evt1" },
    });

    expect(sentry.captureException).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).toHaveBeenCalledWith(err, {
      tags: { step: "emit", route: "cron/event-reminders" },
      extra: { eventId: "evt1" },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("wraps a non-Error value so Sentry gets a stack, and keeps the original as extra", () => {
    sentry.isInitialized.mockReturnValue(true);
    reportError({ code: 42 }, { route: "r" });
    const [captured, hint] = sentry.captureException.mock.calls[0] as [unknown, { extra?: Record<string, unknown> }];
    expect(captured).toBeInstanceOf(Error);
    expect(hint.extra).toMatchObject({ thrown: { code: 42 } });
  });

  it("never throws: an SDK failure falls back to console with the original error", () => {
    sentry.isInitialized.mockReturnValue(true);
    sentry.captureException.mockImplementation(() => {
      throw new Error("sdk down");
    });
    const err = new Error("original");
    expect(() => reportError(err, { route: "r" })).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
    expect(consoleError.mock.calls[0]).toContain(err);
  });

  it("never throws when even isInitialized blows up", () => {
    sentry.isInitialized.mockImplementation(() => {
      throw new Error("no sdk");
    });
    expect(() => reportError(new Error("x"))).not.toThrow();
    expect(consoleError).toHaveBeenCalled();
  });
});
