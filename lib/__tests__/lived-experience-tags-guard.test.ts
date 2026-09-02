import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * scripts/fix-lived-experience-tags.mjs writes to whichever dataset it resolves,
 * and that default is production_2. A --execute run with no further ceremony
 * rewrites live content, dropping unmapped tag strings. The plan's global
 * constraint requires production to be opt-in for every script.
 */
const script = () =>
  readFileSync("scripts/fix-lived-experience-tags.mjs", "utf8");

describe("fix-lived-experience-tags production guard", () => {
  it("requires an explicit production acknowledgement flag", () => {
    expect(script()).toContain("--i-understand-this-is-production");
  });

  it("refuses rather than warns — it must exit non-zero", () => {
    const src = script();
    const guardIndex = src.indexOf("--i-understand-this-is-production");
    expect(guardIndex).toBeGreaterThan(-1);
    // The refusal must terminate the process, not merely log.
    expect(src.slice(guardIndex, guardIndex + 600)).toMatch(/process\.exit\(1\)/);
  });

  it("still prints the dataset it is about to touch", () => {
    expect(script()).toMatch(/dataset \$\{?DATASET/);
  });
});
