import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Slice 15. The quality gates themselves: lint must finish (it traversed
 * four `.next-parity-*` build outputs and never did), CI must run on every
 * branch, a push must type-check first, and the two helpers every surface
 * re-implemented — the SWR JSON fetcher and getLocalizedText — must have one
 * home.
 */
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}
const rel = (f: string) => path.relative(root, f);

describe("lint", () => {
  it("ignores every Next build output, not just .next", () => {
    expect(read("eslint.config.mjs")).toMatch(/["']\.next\*\/\*\*["']/);
  });

  it("has one config: the legacy .eslintrc.json is gone", () => {
    expect(existsSync(path.join(root, ".eslintrc.json"))).toBe(false);
  });
});

describe("CI and hooks", () => {
  it("CI runs on pushes to every branch", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toMatch(/on:\s*\n\s*push:\s*\n\s*branches:\s*\n?\s*-?\s*["']?\*\*["']?/);
  });

  it("CI lints through the package script with a warning ceiling and runs knip without blocking", () => {
    const ci = read(".github/workflows/ci.yml");
    expect(ci).toMatch(/pnpm lint --max-warnings \d+/);
    expect(ci).toMatch(/knip[\s\S]*continue-on-error: true|continue-on-error: true[\s\S]*knip/);
  });

  it("a push type-checks first", () => {
    expect(read(".husky/pre-push")).toMatch(/pnpm typecheck/);
    expect(JSON.parse(read("package.json")).scripts.prepare).toMatch(/husky/);
  });
});

describe("one home per helper", () => {
  it("SWR components share lib/swr.ts instead of a local one-line fetcher", () => {
    expect(existsSync(path.join(root, "lib/swr.ts"))).toBe(true);
    const files = [...walk(path.join(root, "components")), ...walk(path.join(root, "app"))];
    const offenders = files
      .filter((f) => /const fetcher = \(url: string\) =>\s*fetch\(url\)\.then\(\(r\) => r\.json\(\)(?: as Promise<[^>]*>)?\)/.test(readFileSync(f, "utf8")))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("getLocalizedText is implemented once", () => {
    const files = [...walk(path.join(root, "lib")), ...walk(path.join(root, "components")), ...walk(path.join(root, "app"))];
    const definers = files.filter((f) => /^\s*(?:export )?function getLocalizedText\(/m.test(readFileSync(f, "utf8"))).map(rel);
    expect(definers).toEqual(["lib/localization-utils.ts"]);
  });
});
