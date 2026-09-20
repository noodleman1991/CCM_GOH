import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CONTENT_DOMAINS, PUBLIC_TWIN_VALUES } from "@/lib/content/internal/backend";

/**
 * 2026-09-21. `imageUrl()` runs inside client components, and the backend
 * switch consulted its NEXT_PUBLIC twin through `process.env[name]` — a
 * dynamic read Next never inlines into the browser bundle. The server decided
 * "payload" and the browser decided "sanity", built two different `src`
 * values for one image, and the agenda grid on the flipped homepage hydrated
 * with an empty `src`. The twins are now read through a literal table, which
 * the bundler can inline; this keeps the table complete.
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

describe("public backend twins", () => {
  it("lists a literal NEXT_PUBLIC twin for the default and for every domain", () => {
    expect(Object.keys(PUBLIC_TWIN_VALUES)).toContain("NEXT_PUBLIC_CONTENT_BACKEND");
    for (const domain of CONTENT_DOMAINS) {
      const snake = domain.replace(/-/g, "_").toUpperCase();
      expect(Object.keys(PUBLIC_TWIN_VALUES), domain).toContain(`NEXT_PUBLIC_CONTENT_BACKEND_${snake}`);
    }
  });

  it("CONTENT_DOMAINS covers every domain named in lib/, components/ and app/", () => {
    const used = new Set<string>();
    for (const f of [...walk(path.join(root, "lib")), ...walk(path.join(root, "components")), ...walk(path.join(root, "app"))]) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/activeBackend\("([a-z-]+)"\)|publicBackend\("([a-z-]+)"\)|const DOMAIN = "([a-z-]+)"/g)) {
        used.add(m[1] ?? m[2] ?? m[3]);
      }
    }
    const missing = [...used].filter((d) => !(CONTENT_DOMAINS as readonly string[]).includes(d));
    expect(missing).toEqual([]);
  });

  it("the literal table is what a browser reads: no dynamic process.env lookup remains for the twins", () => {
    const src = readFileSync(path.join(root, "lib/content/internal/backend.ts"), "utf8");
    expect(src).toMatch(/NEXT_PUBLIC_CONTENT_BACKEND_IMAGES: process\.env\.NEXT_PUBLIC_CONTENT_BACKEND_IMAGES/);
  });
});
