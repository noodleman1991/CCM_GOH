// Diagnostic: dump the exact failing nodes for specific axe rules on one page,
// so we can see which buttons/regions lack accessible names. Read-only.
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const axeSource = readFileSync(
  "node_modules/.pnpm/axe-core@4.11.0/node_modules/axe-core/axe.min.js",
  "utf8"
);
const EXECUTABLE =
  "/Users/amitlockshinski/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const url = process.argv[2] || "http://localhost:3000/en/communities/sub-saharan-africa";
const rules = (process.argv[3] || "button-name,scrollable-region-focusable,color-contrast").split(",");

const browser = await chromium.launch({ executablePath: EXECUTABLE, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(800);
await page.evaluate(axeSource);
const res = await page.evaluate(async (ruleIds) => {
  // @ts-ignore
  const r = await window.axe.run(document, { runOnly: ruleIds });
  return r.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.map((n) => ({ target: n.target, html: n.html, summary: n.failureSummary })),
  }));
}, rules);

for (const v of res) {
  console.log(`\n===== ${v.id} [${v.impact}] =====`);
  for (const n of v.nodes) {
    console.log(`  target: ${JSON.stringify(n.target)}`);
    console.log(`  html:   ${n.html.slice(0, 300)}`);
    console.log(`  why:    ${n.summary.replace(/\n/g, " ")}`);
    console.log("  ---");
  }
}
await browser.close();
