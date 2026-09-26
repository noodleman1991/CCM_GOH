import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readIndexName } from "@/lib/algolia-indices";

/**
 * Searching Payload content locally (2026-09-20). Writes already honour
 * `ALGOLIA_INDEX_PREFIX` so a dev machine never touches the live index; reads
 * did not, so a local site kept searching the live, Sanity-built records. A
 * read prefix (the NEXT_PUBLIC twin, because the search UI runs in the
 * browser) makes both sides point at the same scratch indices.
 */
const root = path.resolve(__dirname, "../..");
const saved: Record<string, string | undefined> = {};
beforeEach(() => {
  for (const k of ["ALGOLIA_INDEX_PREFIX", "NEXT_PUBLIC_ALGOLIA_INDEX_PREFIX"]) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("readIndexName", () => {
  it("is the bare index name when no prefix is set", () => {
    expect(readIndexName("news")).toBe("news");
  });
  it("uses the public prefix, so the browser and the server agree", () => {
    process.env.NEXT_PUBLIC_ALGOLIA_INDEX_PREFIX = "dev_";
    expect(readIndexName("news")).toBe("dev_news");
  });
  it("falls back to the server-side write prefix", () => {
    process.env.ALGOLIA_INDEX_PREFIX = "pr42_";
    expect(readIndexName("case_studies")).toBe("pr42_case_studies");
  });
});

describe("the search UI reads through readIndexName", () => {
  it.each(["components/search/grouped-search.tsx", "components/search-dialog-results.tsx"])("%s", (f) => {
    const src = readFileSync(path.join(root, f), "utf8");
    expect(src).not.toMatch(/indexName[=:]\s*\{?ALGOLIA_INDICES\./);
    expect(src).toMatch(/readIndexName\(/);
  });
});
