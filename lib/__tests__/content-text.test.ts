import { describe, expect, it, vi } from "vitest";
import { stegaClean } from "next-sanity";

/**
 * Task 10c: cleanText is the seam-routed replacement for the eleven block
 * components that used to import `stegaClean` from `next-sanity` directly.
 * Today it delegates straight through to the real `stegaClean`; these tests
 * prove that delegation is exact (not a no-op stand-in) and that it accepts
 * every shape the real call sites pass — strings, numbers, and null/undefined
 * — the same way `stegaClean` itself does, rather than narrowing to strings
 * only. Phase 3 turns it into the identity function; this file's non-string
 * cases still need to hold true then.
 *
 * `cleanText` lives behind lib/content/internal/sanity-source.ts alongside
 * the query/write helpers, which import `@/sanity/lib/cached-fetch` and
 * `@/sanity/lib/write-client` — both assert Sanity env vars at import time
 * (vitest doesn't load `.env.local`). `cleanText` itself touches neither, so
 * mocking those two submodules (same precedent as
 * lib/__tests__/content-sanity-source.test.ts) sidesteps the env
 * requirement entirely while leaving `stegaClean`'s own behaviour real and
 * unmocked — which is what makes the equality assertions below meaningful.
 */
vi.mock("@/sanity/lib/cached-fetch", () => ({ cachedFetch: vi.fn() }));
vi.mock("@/sanity/lib/write-client", () => ({ writeClient: {} }));

import { cleanText } from "@/lib/content/text";

describe("cleanText", () => {
  it("matches stegaClean exactly for a plain, unencoded string", () => {
    expect(cleanText("narrow")).toBe(stegaClean("narrow"));
    expect(cleanText("narrow")).toBe("narrow");
  });

  it("matches stegaClean exactly for a number — e.g. a `limit`/`upcomingLimit` field", () => {
    expect(cleanText(6)).toBe(stegaClean(6));
    expect(cleanText(6)).toBe(6);
    expect(cleanText(0)).toBe(0);
  });

  it("passes through null exactly as stegaClean does — e.g. an unset `cardVariant`", () => {
    expect(cleanText(null)).toBe(stegaClean(null));
    expect(cleanText(null)).toBeNull();
  });

  it("passes through undefined exactly as stegaClean does — e.g. an unset button `stroke`", () => {
    expect(cleanText(undefined)).toBe(stegaClean(undefined));
    expect(cleanText(undefined)).toBeUndefined();
  });

  it("cleans recursively through an object, matching stegaClean — not string-only", () => {
    const value = { variant: "outline", size: "sm", stroke: null, count: 3 };
    expect(cleanText(value)).toEqual(stegaClean(value));
    expect(cleanText(value)).toEqual(value);
  });

  it("cleans recursively through an array, matching stegaClean", () => {
    const value = ["classic", "wide", null];
    expect(cleanText(value)).toEqual(stegaClean(value));
    expect(cleanText(value)).toEqual(value);
  });

  it("preserves falsy-but-defined values (0, empty string) rather than substituting a default", () => {
    expect(cleanText("")).toBe("");
    expect(cleanText(0)).toBe(0);
  });
});
