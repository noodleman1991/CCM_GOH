import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Slice 14a. The audit found 71 hardcoded English strings and a family of
 * patterns that produce English (or broken morphology) in es/fr/ar:
 * relative times without a date-fns locale, inline `{ en, es, fr, ar }`
 * dictionaries in components, `'s'` appended to a translated noun
 * ("المنظمةs"), enum values rendered through `.replace(/-/g, " ")`, and
 * dates formatted without a locale. Each has one shared replacement now;
 * this test keeps the patterns from coming back.
 */
const root = path.resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}
const files = [...walk(path.join(root, "components")), ...walk(path.join(root, "app"))].filter((f) => !f.includes("/(payload)/"));
const rel = (f: string) => path.relative(root, f);
const offenders = (re: RegExp, except: (f: string) => boolean = () => false) =>
  files.filter((f) => !except(f) && re.test(readFileSync(f, "utf8"))).map(rel);

describe("i18n guards", () => {
  it("relative times go through <RelativeTime>, which carries the date-fns locale", () => {
    expect(offenders(/formatDistanceToNow\(/, (f) => f.endsWith("components/ui/relative-time.tsx"))).toEqual([]);
  });

  it("no component keeps an inline { en, es, fr, ar } dictionary", () => {
    // Locale-tag maps (`en: "en-US"`) and code maps (`en: "EN"`) are data, not copy;
    // the onboarding page's regional-community names are a CMS fallback with all four languages.
    expect(
      offenders(/\ben:\s*['"](?![a-z]{2}-[A-Z]{2}['"])(?![A-Z]{2,3}['"])[^'"\n]+['"],\s*\n?\s*es:\s*['"]/, (f) => f.endsWith("app/[locale]/onboarding/page.tsx")),
    ).toEqual([]);
  });

  it("no plural is made by appending 's' to a translated noun", () => {
    expect(offenders(/\?\s*['"]s['"]\s*:\s*['"]['"]|\?\s*['"]['"]\s*:\s*['"]s['"]|\{t\([^)]*\)\}s\b/)).toEqual([]);
  });

  it("no enum value is rendered by replacing its dashes or underscores", () => {
    expect(offenders(/\{\w+\.replace\(\/[-_]\/g,\s*['"] ['"]\)\}/)).toEqual([]);
  });

  it("no date is formatted without a locale", () => {
    expect(offenders(/toLocale(?:Date|Time)?String\(\s*(?:undefined|\))/)).toEqual([]);
  });

  it("no aria-label is a hand-built English sentence with a count", () => {
    expect(offenders(/aria-label=\{`\$\{[^}]+\}\s+(unread|of|slide|results?)\b/)).toEqual([]);
    expect(offenders(/aria-label=\{`(Go to|Back to|Close|Open)\b/)).toEqual([]);
  });
});
