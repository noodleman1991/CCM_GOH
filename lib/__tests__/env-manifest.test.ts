import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { checkEnv } from "@/lib/env";

/**
 * Environment truth: the three places that name environment variables must
 * agree with the code that reads them.
 *
 *   - `lib/env.ts` is the boot report. The 2026-09-16 audit found it checking
 *     `ALGOLIA_ADMIN_KEY`, a name nothing reads (`lib/algolia.ts` reads
 *     `ALGOLIA_API_KEY`), and reporting R2 disabled whenever only the
 *     canonical `R2_*` set was present — so the report lied in both
 *     directions and nobody trusted it.
 *   - `.env.example` is the committed reference. It omitted eleven names the
 *     code reads and documented four `CLOUDFLARE_R2_*` names nothing reads.
 *   - The code itself: `process.env.X` reads scattered across lib/app/payload.
 *
 * Same approach as `content-layer-boundary.test.ts`: grep over raw source,
 * comment-blind on purpose. A `process.env.X` inside a comment counts as a
 * read here, which can only produce a false positive (a name asked to be
 * documented that merely appears in prose), never a green test on a missing
 * variable. Two reads this scan cannot see, both deliberate:
 *
 *   - `lib/content/internal/backend.ts` reads `process.env[name]` with a
 *     COMPUTED name (`CONTENT_BACKEND_<DOMAIN>` and its `NEXT_PUBLIC_` twin).
 *     The last test below closes that hole by deriving the domain list from
 *     the `activeBackend("…")` calls and `*DOMAIN = "…"` constants and
 *     requiring `.env.example` to list exactly those switches.
 *   - `lib/algolia-indices.ts` takes `env = process.env` as a parameter and
 *     reads `env.ALGOLIA_INDEX_PREFIX` / `env.VERCEL_ENV`. Both names are
 *     also read literally elsewhere, so the scan still sees them.
 */

/** Where application code reads its environment. */
const CODE_PATHS = [
  "lib",
  "app",
  "payload",
  "components",
  "sanity",
  "proxy.ts",
  "next.config.mjs",
  "payload.config.ts",
  "instrumentation.ts",
];

/**
 * Where a name in the boot manifest may be read from. Wider than CODE_PATHS
 * because a required variable may be consumed by tooling rather than the app
 * (`DATABASE_URL` by Prisma's `env("…")` in `prisma/schema.prisma`, several
 * secrets by the operator scripts).
 */
const MANIFEST_READER_PATHS = [...CODE_PATHS, "scripts", "prisma"];

const SOURCE_GLOBS = ["--include=*.ts", "--include=*.tsx", "--include=*.mjs", "--include=*.js", "--include=*.prisma"];

const isTestFile = (file: string): boolean => /(^|\/)__tests__\//.test(file) || /\.test\.tsx?$/.test(file);

/** Lines matching `pattern` across `paths`, as { file, content }, tests excluded. */
const grep = (pattern: string, paths: string[], flags = "-rnE"): { file: string; content: string }[] => {
  let out = "";
  try {
    out = execFileSync("grep", [flags, ...SOURCE_GLOBS, pattern, ...paths], { encoding: "utf8" });
  } catch {
    return []; // grep exits 1 on no matches
  }
  return out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const firstColon = line.indexOf(":");
      const secondColon = line.indexOf(":", firstColon + 1);
      return { file: line.slice(0, firstColon), content: line.slice(secondColon + 1) };
    })
    .filter(({ file }) => !isTestFile(file));
};

/** Every `process.env.X` literal in application code. */
const readKeys = (): Set<string> => {
  const keys = new Set<string>();
  for (const { content } of grep(String.raw`process\.env\.[A-Za-z_][A-Za-z0-9_]*`, CODE_PATHS)) {
    for (const m of content.matchAll(/process\.env\.([A-Za-z_][A-Za-z0-9_]*)/g)) keys.add(m[1]);
  }
  return keys;
};

/** Every `KEY=` line in `.env.example`. */
const documentedKeys = (): Set<string> =>
  new Set(
    readFileSync(".env.example", "utf8")
      .split("\n")
      .map((line) => /^([A-Z][A-Z0-9_]*)=/.exec(line)?.[1])
      .filter((k): k is string => Boolean(k)),
  );

/** Every SCREAMING_SNAKE string literal in `lib/env.ts` — the manifests. */
const manifestKeys = (): string[] =>
  Array.from(readFileSync("lib/env.ts", "utf8").matchAll(/"([A-Z][A-Z0-9_]+)"/g), (m) => m[1]);

/**
 * Every variable read under `paths`, with the files that read it. Matches the
 * shapes a read takes — `process.env.KEY`, `env.KEY` (an aliased env object),
 * `process.env["KEY"]` and Prisma's `env("KEY")` — rather than the bare word,
 * so a variable that is only ever *mentioned* in a comment does not count as
 * read. One grep for the whole tree, then set lookups: a grep per key across
 * `scripts/` took longer than vitest's 5s budget.
 */
const readShape = /\benv(?:\.|\[["']|\(["'])([A-Za-z_][A-Za-z0-9_]*)/g;
const indexReads = (paths: string[]): Map<string, Set<string>> => {
  const index = new Map<string, Set<string>>();
  for (const { file, content } of grep(String.raw`\benv(\.|\[["']|\(["'])[A-Za-z_]`, paths)) {
    for (const m of content.matchAll(readShape)) {
      if (!index.has(m[1])) index.set(m[1], new Set());
      index.get(m[1])!.add(file);
    }
  }
  return index;
};

const isReadIn = (key: string, index: Map<string, Set<string>>, excludeFile?: string): boolean =>
  Array.from(index.get(key) ?? []).some((file) => file !== excludeFile);

/** Variables set by the platform or runtime, never by us, so never in `.env.example`. */
const RUNTIME_BUILT_INS = [/^NODE_ENV$/, /^VERCEL$/, /^VERCEL_ENV$/, /^VERCEL_URL$/, /^CI$/, /^PORT$/, /^NEXT_RUNTIME$/, /^npm_/];
const isRuntimeBuiltIn = (key: string): boolean => RUNTIME_BUILT_INS.some((re) => re.test(key));

/**
 * Documented names that no file in this repo reads because a DEPENDENCY reads
 * them from `process.env` directly. Each entry names the reader.
 */
const READ_BY_A_DEPENDENCY: Record<string, string> = {
  // @clerk/nextjs merges these into <ClerkProvider> props itself:
  // node_modules/@clerk/nextjs/dist/esm/utils/mergeNextClerkPropsWithEnv.js
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "@clerk/nextjs mergeNextClerkPropsWithEnv",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "@clerk/nextjs mergeNextClerkPropsWithEnv",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "@clerk/nextjs mergeNextClerkPropsWithEnv",
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "@clerk/nextjs mergeNextClerkPropsWithEnv",
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: "@clerk/nextjs mergeNextClerkPropsWithEnv",
};

const CONTENT_SWITCH = /^(NEXT_PUBLIC_)?CONTENT_BACKEND(_[A-Z0-9_]+)?$/;

/** Mirrors `overrideVariable()` in lib/content/internal/backend.ts. */
const switchFor = (domain: string): string =>
  "CONTENT_BACKEND_" +
  domain
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

/**
 * The per-domain switches the code actually answers to: every literal
 * `activeBackend("<domain>")` plus every `const …DOMAIN = "<domain>"` that is
 * later passed to it. Comments that quote the call (e.g. in
 * `lib/content/internal/payload/*.ts`) name the same domains, so they are
 * harmless here.
 */
const domainSwitchesInCode = (): string[] => {
  const domains = new Set<string>();
  for (const { content } of grep(String.raw`activeBackend\(\s*"[^"]+"`, CODE_PATHS)) {
    for (const m of content.matchAll(/activeBackend\(\s*"([^"]+)"/g)) domains.add(m[1]);
  }
  for (const { content } of grep(String.raw`const [A-Z_]*DOMAIN = "[^"]+"`, CODE_PATHS)) {
    for (const m of content.matchAll(/const [A-Z_]*DOMAIN = "([^"]+)"/g)) domains.add(m[1]);
  }
  return Array.from(domains, switchFor).sort();
};

describe("environment manifest (lib/env.ts) names only variables the code reads", () => {
  it("every key in the manifests is read somewhere", () => {
    const reads = indexReads(MANIFEST_READER_PATHS);
    const unread = manifestKeys().filter((key) => !isReadIn(key, reads, "lib/env.ts"));
    expect(unread).toEqual([]);
  });
});

describe(".env.example documents exactly the variables the code reads", () => {
  it("every process.env read in application code is documented", () => {
    const documented = documentedKeys();
    const undocumented = Array.from(readKeys())
      .filter((key) => !isRuntimeBuiltIn(key) && !documented.has(key))
      .sort();
    expect(undocumented).toEqual([]);
  });

  it("every documented variable is read by the code, a script or a named dependency", () => {
    const reads = indexReads(MANIFEST_READER_PATHS);
    const unread = Array.from(documentedKeys())
      .filter((key) => !CONTENT_SWITCH.test(key)) // covered by the next test
      .filter((key) => !(key in READ_BY_A_DEPENDENCY))
      .filter((key) => !isReadIn(key, reads))
      .sort();
    expect(unread).toEqual([]);
  });

  it("documents the process-wide CONTENT_BACKEND switch, its public twin, and exactly the per-domain switches the code answers to", () => {
    const documented = documentedKeys();
    expect(documented.has("CONTENT_BACKEND")).toBe(true);
    expect(documented.has("NEXT_PUBLIC_CONTENT_BACKEND")).toBe(true);

    const documentedDomainSwitches = Array.from(documented)
      .filter((key) => CONTENT_SWITCH.test(key))
      .filter((key) => key.startsWith("CONTENT_BACKEND_"))
      .sort();
    expect(documentedDomainSwitches).toEqual(domainSwitchesInCode());

    // A public twin may be documented only for a real domain.
    const twinsInCode = new Set(domainSwitchesInCode().map((k) => `NEXT_PUBLIC_${k}`));
    const strayTwins = Array.from(documented).filter(
      (key) => key.startsWith("NEXT_PUBLIC_CONTENT_BACKEND_") && !twinsInCode.has(key),
    );
    expect(strayTwins).toEqual([]);
  });
});

describe("checkEnv", () => {
  const BASE = {
    DATABASE_URL: "postgresql://x",
    NEXT_PUBLIC_SANITY_PROJECT_ID: "p",
    NEXT_PUBLIC_SANITY_DATASET: "d",
    CLERK_SECRET_KEY: "sk_test_x",
    CLERK_WEBHOOK_SECRET: "whsec",
    SEARCH_WEBHOOK_SECRET: "s",
    CRON_SECRET: "c",
  };

  it("requires the Clerk, search-webhook and cron secrets", () => {
    const { missingRequired } = checkEnv({ DATABASE_URL: "x", NEXT_PUBLIC_SANITY_PROJECT_ID: "p", NEXT_PUBLIC_SANITY_DATASET: "d" });
    expect(missingRequired).toEqual(["CLERK_SECRET_KEY", "CLERK_WEBHOOK_SECRET", "SEARCH_WEBHOOK_SECRET", "CRON_SECRET"]);
  });

  it("reports nothing missing when the base set is present and no backend switch is on", () => {
    const report = checkEnv(BASE);
    expect(report.missingRequired).toEqual([]);
    expect(report.payloadSwitch).toBeNull();
  });

  it("reports R2 enabled for the canonical R2_* names (lib/r2.ts and payload/storage/r2.ts read these first)", () => {
    const report = checkEnv({ ...BASE, R2_ENDPOINT: "e", R2_ACCESS_KEY_ID: "k", R2_SECRET_ACCESS_KEY: "s" });
    expect(report.disabledFeatures).not.toContain("File storage (R2)");
  });

  it("reports R2 enabled for the legacy CLOUDFLARE_R2_* fallback names too", () => {
    const report = checkEnv({
      ...BASE,
      CLOUDFLARE_R2_ENDPOINT: "e",
      CLOUDFLARE_R2_ACCESS_KEY_ID: "k",
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: "s",
    });
    expect(report.disabledFeatures).not.toContain("File storage (R2)");
  });

  it("reports R2 disabled when a credential is missing under both spellings", () => {
    const report = checkEnv({ ...BASE, R2_ENDPOINT: "e", R2_ACCESS_KEY_ID: "k" });
    expect(report.disabledFeatures).toContain("File storage (R2)");
  });

  it("reports Algolia enabled with the key lib/algolia.ts reads (ALGOLIA_API_KEY), not the dead ALGOLIA_ADMIN_KEY", () => {
    expect(checkEnv({ ...BASE, NEXT_PUBLIC_ALGOLIA_APP_ID: "a", ALGOLIA_API_KEY: "k" }).disabledFeatures).not.toContain(
      "Search (Algolia)",
    );
    expect(checkEnv({ ...BASE, ALGOLIA_APP_ID: "a", ALGOLIA_API_KEY: "k" }).disabledFeatures).not.toContain(
      "Search (Algolia)",
    );
    expect(checkEnv({ ...BASE, NEXT_PUBLIC_ALGOLIA_APP_ID: "a", ALGOLIA_ADMIN_KEY: "k" }).disabledFeatures).toContain(
      "Search (Algolia)",
    );
  });

  it.each([
    ["CONTENT_BACKEND", "payload"],
    ["CONTENT_BACKEND_NEWS", "payload"],
    ["NEXT_PUBLIC_CONTENT_BACKEND", "payload"],
    ["NEXT_PUBLIC_CONTENT_BACKEND_IMAGES", "payload"],
    // backend.ts trims and lower-cases before comparing, so this is "payload" too.
    ["CONTENT_BACKEND_CASE_STUDIES", " Payload "],
  ])("requires PAYLOAD_DATABASE_URL and PAYLOAD_SECRET when %s=%j", (name, value) => {
    const report = checkEnv({ ...BASE, [name]: value });
    expect(report.payloadSwitch).toBe(name);
    expect(report.missingRequired).toEqual(["PAYLOAD_DATABASE_URL", "PAYLOAD_SECRET"]);
  });

  it("is satisfied once both Payload variables are set", () => {
    const report = checkEnv({ ...BASE, CONTENT_BACKEND: "payload", PAYLOAD_DATABASE_URL: "postgresql://y", PAYLOAD_SECRET: "s" });
    expect(report.missingRequired).toEqual([]);
    expect(report.payloadSwitch).toBe("CONTENT_BACKEND");
  });

  it("does not require the Payload variables when every switch says sanity or is blank", () => {
    const report = checkEnv({ ...BASE, CONTENT_BACKEND: "sanity", CONTENT_BACKEND_NEWS: "", NEXT_PUBLIC_CONTENT_BACKEND: "  " });
    expect(report.missingRequired).toEqual([]);
    expect(report.payloadSwitch).toBeNull();
  });
});
