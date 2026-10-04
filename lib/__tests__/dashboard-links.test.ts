import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Every `href="/…"` literal and every `router.push("/…")` under
 * `components/dashboard/**` must land on a page that exists under
 * `app/[locale]` (or, for `/api/…`, a route handler under `app/api`).
 *
 * The 2026-09-16 audit found the submissions dashboard linking to
 * `/case-studies/<slug>` — a prefix that never had a route — next to two
 * buttons with no handler at all. Resolving links against the filesystem
 * keeps a dead prefix from coming back.
 *
 * Resolution rules:
 * - route groups `(main)`, `(auth)` are transparent;
 * - a static link segment matches a same-named directory first, else any
 *   dynamic directory `[x]`;
 * - a `${…}` segment (a template-literal placeholder) matches a dynamic
 *   directory only;
 * - a catch-all directory (`[...x]`, `[[...x]]`) consumes the rest of the
 *   path — except the CMS catch-all directly under `app/[locale]`, which
 *   would make every path resolve and the test vacuous. Anything served by
 *   that catch-all is a CMS page, not a code route, and is out of scope here;
 * - a leading `${locale}` segment is dropped (it is the `[locale]` root).
 */

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
// The dashboard's member-content components moved here with My contributions (2026-10-04).
const DASHBOARD_DIR = join(ROOT, "components", "contributions");
const LOCALE_ROOT = join(ROOT, "app", "[locale]");
const API_ROOT = join(ROOT, "app", "api");

const PAGE_FILES = ["page.tsx", "page.ts", "route.ts"];
const isGroup = (name: string) => /^\(.+\)$/.test(name);
const isCatchAll = (name: string) => /^\[\[?\.\.\..+\]\]?$/.test(name);
const isDynamic = (name: string) => /^\[.+\]$/.test(name);

function subdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => statSync(join(dir, name)).isDirectory());
}

function hasPage(dir: string): boolean {
  if (PAGE_FILES.some((f) => existsSync(join(dir, f)))) return true;
  return subdirs(dir).some(
    (child) =>
      (isGroup(child) && hasPage(join(dir, child))) ||
      // `/reader` is served by `reader/[[...slug]]/page.tsx`.
      (/^\[\[\.\.\..+\]\]$/.test(child) && hasPage(join(dir, child))),
  );
}

function resolves(segments: string[], dir: string, depth: number): boolean {
  if (segments.length === 0) return hasPage(dir);
  const [head, ...rest] = segments;
  const dynamicHead = head.includes("${");
  const children = subdirs(dir);

  for (const child of children) {
    if (isGroup(child)) {
      if (resolves(segments, join(dir, child), depth)) return true;
      continue;
    }
    if (!dynamicHead && child === head) {
      if (resolves(rest, join(dir, child), depth + 1)) return true;
      continue;
    }
    if (isCatchAll(child)) {
      if (depth === 0) continue; // the CMS catch-all — see the header comment
      if (hasPage(join(dir, child))) return true;
      continue;
    }
    if (isDynamic(child) && resolves(rest, join(dir, child), depth + 1)) return true;
  }
  return false;
}

function resolvesPath(path: string): boolean {
  const clean = path.split(/[?#]/)[0];
  const segments = clean.split("/").filter(Boolean);
  if (segments[0] === "${locale}") segments.shift();
  if (segments[0] === "api") return resolves(segments.slice(1), API_ROOT, 1);
  return resolves(segments, LOCALE_ROOT, 0);
}

interface FoundLink {
  file: string;
  line: number;
  href: string;
}

function collectLinks(dir: string, acc: FoundLink[] = []): FoundLink[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      collectLinks(full, acc);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue;
    const lines = readFileSync(full, "utf8").split("\n");
    lines.forEach((text, index) => {
      const patterns = [
        /href=\{?\s*["'`](\/[^"'`]*)["'`]/g,
        /router\.push\(\s*["'`](\/[^"'`]*)["'`]/g,
      ];
      for (const pattern of patterns) {
        for (const match of text.matchAll(pattern)) {
          // Protocol-relative URLs (`//host`) are external, not routes.
          if (match[1].startsWith("//")) continue;
          acc.push({ file: full.slice(ROOT.length), line: index + 1, href: match[1] });
        }
      }
    });
  }
  return acc;
}

describe("dashboard links resolve to real routes", () => {
  const links = collectLinks(DASHBOARD_DIR);

  it("finds links to audit (the scan itself is not vacuous)", () => {
    expect(links.length).toBeGreaterThan(0);
  });

  it("the resolver tells a dead prefix from a live one", () => {
    expect(resolvesPath("/research-and-action/case-studies/some-slug")).toBe(true);
    expect(resolvesPath("/research-and-action/case-studies/submit?edit=abc")).toBe(true);
    expect(resolvesPath("/dashboard")).toBe(true);
    expect(resolvesPath("/case-studies/some-slug")).toBe(false);
    expect(resolvesPath("/research-and-action/agendas/some-slug")).toBe(false);
    expect(resolvesPath("/no/such/route")).toBe(false);
  });

  it("every href literal and router.push target under components/dashboard exists under app/[locale]", () => {
    const dead = links.filter((l) => !resolvesPath(l.href));
    expect(
      dead,
      dead.map((l) => `${l.file}:${l.line} → ${l.href}`).join("\n"),
    ).toEqual([]);
  });
});
