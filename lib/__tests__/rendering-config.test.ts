import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Slice 10b, Decision 6: every `(main)` route is request-dynamic — the shared
 * layout reads the Clerk session and `draftMode()` — so `export const
 * revalidate` on pages and `generateStaticParams` were dead, and
 * `staticPageGenerationTimeout` only bought a longer wait for prerenders
 * that always bailed out. The tagged Data Cache does the caching work. This
 * test keeps the dead configuration from creeping back, and pins the two
 * things that replace it: `Cache-Control` on the public data APIs and no
 * sleeps in the dashboard render.
 */
const root = path.resolve(__dirname, "../..");
const main = path.join(root, "app/[locale]/(main)");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const pages = walk(main).filter((f) => /\/page\.tsx$/.test(f));
const rel = (f: string) => path.relative(root, f);

describe("dead ISR configuration stays gone", () => {
  it("no (main) page exports `revalidate`", () => {
    const offenders = pages.filter((f) => /^export const revalidate\b/m.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("no (main) page exports `generateStaticParams`, except the force-static legal pages", () => {
    const offenders = pages
      .filter((f) => !f.includes("/legal/"))
      .filter((f) => /generateStaticParams/.test(readFileSync(f, "utf8")));
    expect(offenders.map(rel)).toEqual([]);
  });

  it("next.config no longer sets staticPageGenerationTimeout", () => {
    expect(readFileSync(path.join(root, "next.config.mjs"), "utf8")).not.toContain("staticPageGenerationTimeout");
  });
});

describe("the public data APIs are CDN-cacheable", () => {
  const routes = [
    "app/api/maps/region-items/route.ts",
    "app/api/maps/region-data/route.ts",
    "app/api/maps/region-pins/route.ts",
    "app/api/home/people/route.ts",
  ];
  it.each(routes)("%s sends Cache-Control instead of a dead `revalidate` export", (r) => {
    const src = readFileSync(path.join(root, r), "utf8");
    expect(src).not.toMatch(/^export const revalidate\b/m);
    expect(src).toMatch(/s-maxage=300/);
  });
});

describe("the dashboard does not sleep in render", () => {
  it.each(["app/[locale]/(main)/dashboard/layout.tsx", "app/[locale]/(main)/dashboard/page.tsx"])("%s", (r) => {
    expect(readFileSync(path.join(root, r), "utf8")).not.toMatch(/setTimeout/);
  });
});

describe("routes that stream slowly have a loading state", () => {
  it.each(["communities/[slug]", "news/[slug]", "collaborations", "messages", "moderation"])("%s/loading.tsx exists", (d) => {
    expect(existsSync(path.join(main, d, "loading.tsx"))).toBe(true);
  });
});
