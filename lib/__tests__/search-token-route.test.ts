import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * `/api/search/token` mints a real, registered Algolia key (one `addApiKey`
 * plus a propagation wait) whenever its cache is cold. It is anonymous and
 * had no rate limit, so a loop against it was a loop of admin-API calls and
 * a growing key registry. It now goes through the same limiter as every
 * other public route; the module-scope cache still serves the fast path.
 */
const { addApiKey, waitForApiKey, assertRateLimit } = vi.hoisted(() => ({
  addApiKey: vi.fn(async (_opts: { acl: string[]; indexes: string[]; validity: number; description: string }) => ({ key: "minted-key" })),
  waitForApiKey: vi.fn(async () => undefined),
  assertRateLimit: vi.fn(async () => undefined),
}));
vi.mock("algoliasearch", () => ({ algoliasearch: () => ({ addApiKey, waitForApiKey }) }));
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return { ...actual, assertRateLimit };
});
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: null }) }));

import { GET } from "@/app/api/search/token/route";
import { RateLimitError } from "@/lib/rate-limit";

const req = () => new NextRequest("http://localhost/api/search/token", { headers: { "x-forwarded-for": "203.0.113.9" } });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  process.env.ALGOLIA_APP_ID = "APP";
  process.env.ALGOLIA_API_KEY = "admin";
});

describe("GET /api/search/token", () => {
  it("is rate-limited per anonymous IP before any key is minted", async () => {
    assertRateLimit.mockRejectedValueOnce(new RateLimitError("Too many requests", 30));
    const res = await GET(req());
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(addApiKey).not.toHaveBeenCalled();
  });

  it("mints a search-only key restricted to the public indices", async () => {
    const res = await GET(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ apiKey: "minted-key" });
    expect(typeof body.appId).toBe("string");
    const args = addApiKey.mock.calls[0]![0];
    expect(args.acl).toEqual(["search"]);
    expect(args.indexes).toContain("users");
    expect(args.indexes).toContain("case_studies");
  });
});
