import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/**
 * Slice 13c (audit P3). The document already sets `dir`, so a flex row is
 * mirrored by the browser; every `isRTL && "flex-row-reverse"` mirrored it a
 * second time and un-did the mirroring — 48 instances in onboarding alone.
 * Arrows drawn as literal "→" never flip. This test keeps both out: the
 * eslint rule fails a fixture, and no source file carries the patterns.
 */
const root = path.resolve(__dirname, "../..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(entry)) out.push(full);
  }
  return out;
}
const files = [...walk(path.join(root, "components")), ...walk(path.join(root, "app"))].filter((f) => !f.includes("/(payload)/"));
const rel = (f: string) => path.relative(root, f);

describe("no source file reverses a row or draws an arrow by hand", () => {
  it("flex-row-reverse is gone (the document's dir mirrors rows)", () => {
    const offenders = files.filter((f) => /flex-row-reverse/.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no literal → or ← in JSX text", () => {
    const offenders = files.filter((f) => /^[^/*\n]*>[^<\n]*[→←]/m.test(readFileSync(f, "utf8")) || /\{[^}\n]*\}\s*[→←]\s*$/m.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no chevron is rotated on a locale flag (use rtl:-scale-x-100)", () => {
    const offenders = files.filter((f) => /(isRTL|isRtl|rtl)\s*&&\s*['"]rotate-180['"]/.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });
});

describe("the eslint rule fails a new offender", () => {
  const eslint = new ESLint({ cwd: root, overrideConfigFile: path.join(root, "eslint.config.mjs") });
  const lint = async (code: string) => {
    const [result] = await eslint.lintText(code, { filePath: path.join(root, "components/fixture.tsx") });
    return result.messages.filter((m) => m.ruleId === "no-restricted-syntax").map((m) => m.message);
  };

  it("on a locale-gated flex-row-reverse", async () => {
    const messages = await lint(`export function X({ isRTL }: { isRTL: boolean }) { return <div className={isRTL ? "flex-row-reverse" : ""} />; }\n`);
    expect(messages.join("\n")).toMatch(/dir/);
  });

  it("on a literal arrow in JSX", async () => {
    const messages = await lint(`export function X() { return <a>Open →</a>; }\n`);
    expect(messages.join("\n")).toMatch(/rtl:-scale-x-100/);
  });

  it("not on the logical Tailwind variant", async () => {
    const messages = await lint(`export function X() { return <div className="flex space-x-3 rtl:space-x-reverse" />; }\n`);
    expect(messages).toEqual([]);
  });
}, 60_000);
