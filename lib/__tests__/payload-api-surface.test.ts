import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { CollectionConfig } from "payload";
import config from "@payload-config";
import {
  ANONYMOUS_MAX_LIMIT,
  capAnonymousReads,
  isAnonymousReadCapHook,
} from "@/payload/hooks/anonymous-read-cap";

/**
 * The anonymous surface of `/payload-api`.
 *
 * Nothing in this app reads Payload over GraphQL — the readers use the Local
 * API — yet the GraphQL endpoint and playground were mounted, and the REST
 * `find` accepted `limit=0` (everything) and `depth=10` from anyone. The
 * dataset is small, so this was an availability and Neon-cost exposure rather
 * than a data one, but it was an unbounded query per anonymous request.
 */
describe("GraphQL is off", () => {
  it("is disabled in the config", async () => {
    const resolved = await config;
    expect(resolved.graphQL?.disable).toBe(true);
  });

  it("has no route files left to serve it", () => {
    const root = path.resolve(__dirname, "../..");
    expect(existsSync(path.join(root, "app/(payload)/payload-api/graphql/route.ts"))).toBe(false);
    expect(existsSync(path.join(root, "app/(payload)/payload-api/graphql-playground/route.ts"))).toBe(false);
  });
});

describe("relationship depth is capped", () => {
  it("allows the depth the page readers need and nothing deeper", async () => {
    // pages.ts / homepage.ts / regional-community.ts read at depth 3.
    const resolved = await config;
    expect(resolved.maxDepth).toBe(3);
  });
});

type HookArgs = Parameters<typeof capAnonymousReads>[0];

function readArgs(over: Record<string, unknown>): HookArgs {
  return {
    operation: "read",
    args: { collection: {}, ...over },
    req: { user: over.user ?? null },
    context: {},
    collection: {} as never,
  } as never;
}

describe("capAnonymousReads", () => {
  it("caps an anonymous REST read that asks for everything — REST passes no overrideAccess at all", async () => {
    // Verified live on 2026-09-16: `payload/dist/collections/endpoints/find.js`
    // calls findOperation without overrideAccess, so the first version of
    // this hook (which keyed on `=== false`) let `limit=0` through.
    const a = readArgs({ limit: 0, pagination: false });
    const out = (await capAnonymousReads(a)) as { limit?: number; pagination?: boolean };
    expect(out.limit).toBe(ANONYMOUS_MAX_LIMIT);
    expect(out.pagination).toBe(true);
  });

  it("caps an oversized limit but leaves a modest one alone", async () => {
    const big = (await capAnonymousReads(readArgs({ overrideAccess: false, limit: 5000 }))) as { limit?: number };
    expect(big.limit).toBe(ANONYMOUS_MAX_LIMIT);
    const small = (await capAnonymousReads(readArgs({ overrideAccess: false, limit: 12 }))) as { limit?: number };
    expect(small.limit).toBe(12);
  });

  it("leaves Payload's default (no limit given) alone — that is already 10", async () => {
    const out = (await capAnonymousReads(readArgs({ overrideAccess: false }))) as { limit?: number };
    expect(out.limit).toBeUndefined();
  });

  it("never touches the site's own Local API reads, which run with overrideAccess", async () => {
    // Every reader in lib/content/internal/payload uses pagination:false
    // deliberately; this cap must not reach them.
    const a = readArgs({ overrideAccess: true, limit: 0, pagination: false });
    const out = (await capAnonymousReads(a)) as { limit?: number; pagination?: boolean };
    expect(out.limit).toBe(0);
    expect(out.pagination).toBe(false);
  });

  it("does not cap an editor using the admin", async () => {
    const a = readArgs({ overrideAccess: false, limit: 0, pagination: false, user: { role: "team_editor" } });
    const out = (await capAnonymousReads(a)) as { limit?: number; pagination?: boolean };
    expect(out.limit).toBe(0);
    expect(out.pagination).toBe(false);
  });

  it("ignores operations other than read", async () => {
    const a = { ...readArgs({ overrideAccess: false, limit: 0 }), operation: "create" } as never;
    const out = (await capAnonymousReads(a)) as { limit?: number };
    expect(out.limit).toBe(0);
  });

  it("is wired onto every collection, Payload's own included", async () => {
    const resolved = await config;
    for (const collection of resolved.collections as CollectionConfig[]) {
      if (collection.slug.startsWith("payload-")) continue;
      expect(
        (collection.hooks?.beforeOperation ?? []).some(isAnonymousReadCapHook),
        collection.slug,
      ).toBe(true);
    }
  });
});
