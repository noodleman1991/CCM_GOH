// Live accessibility + performance audit.
// Drives representative pages through headless Chromium, runs axe-core for a11y,
// and captures navigation/paint timings for performance. Read-only; needs the
// user's dev server on :3000. Run: node scripts/audit-a11y-perf.mjs
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

// axe-core is a transitive dep under .pnpm and isn't hoisted to a resolvable
// top-level path, so read the distributable directly.
const axePath = "node_modules/.pnpm/axe-core@4.11.0/node_modules/axe-core/axe.min.js";
const axeSource = readFileSync(axePath, "utf8");

const EXECUTABLE =
  "/Users/amitlockshinski/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";
const BASE = "http://localhost:3000";

// Representative pages: homepage, a regional community, a public profile area,
// search, about, collaborate — in en and one RTL (ar) pass for the heavy pages.
const PAGES = [
  { name: "home (en)", path: "/en" },
  { name: "home (ar/RTL)", path: "/ar" },
  { name: "community SSA (en)", path: "/en/communities/sub-saharan-africa" },
  { name: "community SSA (ar/RTL)", path: "/ar/communities/sub-saharan-africa" },
  { name: "search (en)", path: "/en/search" },
  { name: "about (en)", path: "/en/about" },
  { name: "collaborate (en)", path: "/en/collaborate" },
];

// Only fail on serious/critical a11y violations; log moderate/minor as notes.
const FAIL_IMPACTS = new Set(["serious", "critical"]);

const run = async () => {
  const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
  const results = [];
  let hardFailures = 0;

  for (const p of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const t0 = Date.now();
    let status = 0;
    try {
      const resp = await page.goto(`${BASE}${p.path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      status = resp?.status() ?? 0;
      // Let any client-side redirect/hydration settle, then wait for the network
      // to go idle so axe runs against a stable DOM.
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(800);
    } catch (e) {
      results.push({ ...p, error: `nav: ${e.message}` });
      await page.close();
      continue;
    }
    const navMs = Date.now() - t0;

    // Some pages (e.g. search) do a client-side URL update right after hydration,
    // which destroys the eval context. Settle once more, then retry evals if the
    // context is torn down mid-call.
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    const evalRetry = async (fn) => {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await fn();
        } catch (e) {
          if (!/context was destroyed|Execution context/.test(e.message) || attempt === 2) throw e;
          await page.waitForTimeout(700);
        }
      }
    };

    // Performance: paint + DOM timings from the page itself.
    const perf = await evalRetry(() =>
      page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] || {};
        const paints = Object.fromEntries(
          performance.getEntriesByType("paint").map((e) => [e.name, Math.round(e.startTime)])
        );
        return {
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
          loadComplete: Math.round(nav.loadEventEnd || 0),
          firstPaint: paints["first-paint"] ?? null,
          firstContentfulPaint: paints["first-contentful-paint"] ?? null,
          domNodes: document.getElementsByTagName("*").length,
        };
      })
    );

    // Accessibility: inject axe-core and analyze.
    const axe = await evalRetry(async () => {
      await page.evaluate(axeSource);
      return page.evaluate(async () => {
        // @ts-ignore axe injected above
        return await window.axe.run(document, {
          resultTypes: ["violations"],
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        });
      });
    });

    const byImpact = {};
    for (const v of axe.violations) {
      byImpact[v.impact] = (byImpact[v.impact] || 0) + v.nodes.length;
      if (FAIL_IMPACTS.has(v.impact)) hardFailures += v.nodes.length;
    }

    results.push({
      ...p,
      status,
      navMs,
      perf,
      a11y: {
        violationRules: axe.violations.length,
        byImpact,
        topRules: axe.violations
          .filter((v) => FAIL_IMPACTS.has(v.impact))
          .slice(0, 6)
          .map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
      },
    });
    await page.close();
  }

  await browser.close();

  console.log("\n================  ACCESSIBILITY + PERFORMANCE AUDIT  ================\n");
  for (const r of results) {
    if (r.error) {
      console.log(`✗ ${r.name}  —  ${r.error}`);
      continue;
    }
    const fcp = r.perf.firstContentfulPaint;
    console.log(`● ${r.name}  [${r.status}]`);
    console.log(
      `    perf: nav ${r.navMs}ms · FCP ${fcp ?? "?"}ms · DCL ${r.perf.domContentLoaded}ms · load ${r.perf.loadComplete}ms · ${r.perf.domNodes} DOM nodes`
    );
    const imp = r.a11y.byImpact;
    const impStr = Object.keys(imp).length
      ? Object.entries(imp).map(([k, v]) => `${k}:${v}`).join(" · ")
      : "none";
    console.log(`    a11y: ${r.a11y.violationRules} rule(s) flagged · nodes by impact → ${impStr}`);
    for (const t of r.a11y.topRules) {
      console.log(`        ⚠ [${t.impact}] ${t.id} ×${t.nodes} — ${t.help}`);
    }
  }
  console.log(`\nHard a11y failures (serious+critical node count): ${hardFailures}`);
  console.log("====================================================================\n");
  process.exit(hardFailures > 0 ? 1 : 0);
};

run().catch((e) => {
  console.error(e);
  process.exit(2);
});
