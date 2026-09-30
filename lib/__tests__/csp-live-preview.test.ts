import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

// The admin's Live preview shows the site in a same-origin frame; without
// 'self' in frame-src the browser blocks it (user report, 2026-09-30).
it("lets the admin frame the site for Live preview", () => {
  const config = readFileSync(path.resolve(__dirname, "../../next.config.mjs"), "utf8");
  const frameSrc = config.match(/"frame-src ([^"]+)"/)?.[1] ?? "";
  expect(frameSrc.split(" ")).toContain("'self'");
});
