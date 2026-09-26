import { afterEach, describe, expect, it, vi } from "vitest";
import { liveIndexWritesAllowed } from "@/lib/algolia-indices";
import { liveDeps } from "@/payload/hooks/search-sync";

/**
 * The Payload search-sync hook fires on every save of a case study, news
 * post or agenda — in production, in a preview deployment, under `next dev`
 * against the dev database, and from the import scripts. Only the first of
 * those should reach the live Algolia indices. `ALGOLIA_INDEX_PREFIX` is the
 * existing scratch-index affordance; this guard makes its absence outside
 * production mean "do not write", instead of "write to the live index".
 */
describe("liveIndexWritesAllowed", () => {
  it("refuses with nothing set — the local-dev and import case", () => {
    expect(liveIndexWritesAllowed({})).toBe(false);
  });

  it("allows a prefixed (scratch) index anywhere", () => {
    expect(liveIndexWritesAllowed({ ALGOLIA_INDEX_PREFIX: "t17_" })).toBe(true);
  });

  it("treats an empty prefix as unset", () => {
    expect(liveIndexWritesAllowed({ ALGOLIA_INDEX_PREFIX: "" })).toBe(false);
  });

  it("allows the unprefixed live index only on Vercel production", () => {
    expect(liveIndexWritesAllowed({ VERCEL_ENV: "production" })).toBe(true);
    expect(liveIndexWritesAllowed({ VERCEL_ENV: "preview" })).toBe(false);
    expect(liveIndexWritesAllowed({ VERCEL_ENV: "development" })).toBe(false);
  });

  it("does not mistake NODE_ENV=production for a production deployment", () => {
    // `next build && next start` on a laptop sets NODE_ENV=production too.
    expect(liveIndexWritesAllowed({ NODE_ENV: "production" })).toBe(false);
  });
});

describe("the hook's live dependencies consult the guard", () => {
  const saved = { prefix: process.env.ALGOLIA_INDEX_PREFIX, vercel: process.env.VERCEL_ENV };

  afterEach(() => {
    if (saved.prefix === undefined) delete process.env.ALGOLIA_INDEX_PREFIX;
    else process.env.ALGOLIA_INDEX_PREFIX = saved.prefix;
    if (saved.vercel === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = saved.vercel;
    vi.restoreAllMocks();
  });

  it("returns no deps, and says why, when neither a prefix nor production is set", async () => {
    delete process.env.ALGOLIA_INDEX_PREFIX;
    delete process.env.VERCEL_ENV;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(liveDeps(undefined, "caseStudies")).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toMatch(/ALGOLIA_INDEX_PREFIX/);
  });
});
