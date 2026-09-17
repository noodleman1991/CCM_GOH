import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Slice 10c. Every public route lives under `/{locale}`, and next-intl's
 * `Link`/`redirect` from `@/i18n/navigation` carry the locale for free. About
 * twenty server files still called `redirect()` from `next/navigation` with a
 * bare path — signing out on `/fr/dashboard` landed on `/en/sign-in` — and
 * eighteen files used `next/link`, four of them hand-building `/${locale}/…`.
 * This test keeps the app on the locale-aware primitives; the eslint rule
 * added alongside it fails a new offender at lint time.
 */
const root = path.resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const appFiles = walk(path.join(root, "app")).filter((f) => !f.includes("/(payload)/"));
const componentFiles = walk(path.join(root, "components"));
const rel = (f: string) => path.relative(root, f);

describe("locale-aware navigation primitives", () => {
  it("nothing under app/ or components/ imports next/link directly", () => {
    const offenders = [...appFiles, ...componentFiles].filter((f) =>
      /from\s+["']next\/link["']/.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no server file under app/ redirects through next/navigation", () => {
    const offenders = appFiles.filter((f) => {
      const src = readFileSync(f, "utf8");
      return /import\s*\{[^}]*\bredirect\b[^}]*\}\s*from\s+["']next\/navigation["']/.test(src);
    });
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no href hand-builds the locale prefix", () => {
    const offenders = [...appFiles, ...componentFiles].filter((f) =>
      /href=\{?[`"']\/\$\{locale\}/.test(readFileSync(f, "utf8")),
    );
    expect(offenders.map(rel)).toEqual([]);
  });

  it("the proxy matcher excludes /studio and /guide-to-editors as path segments, not prefixes", () => {
    const proxy = readFileSync(path.join(root, "proxy.ts"), "utf8");
    // `studio|guide-to-editors` also matched `/studios-of-the-future`; the
    // anchored form matches the segment only.
    expect(proxy).toMatch(/studio\(\?:\\?\/\|\$\)/);
    expect(proxy).toMatch(/guide-to-editors\(\?:\\?\/\|\$\)/);
  });

  it("the locale layout refuses an unknown locale instead of rendering it", () => {
    const layout = readFileSync(path.join(root, "app/[locale]/layout.tsx"), "utf8");
    expect(layout).toMatch(/hasLocale\(/);
  });

  it("eslint forbids the two direct imports outside i18n/", () => {
    const config = readFileSync(path.join(root, "eslint.config.mjs"), "utf8");
    expect(config).toContain("no-restricted-imports");
    expect(config).toContain("next/link");
  });
});
