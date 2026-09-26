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
    // Anchor on the guard's actual structure — the `if` that tests
    // `!ackProd` — rather than the flag name's first textual occurrence.
    // The flag name alone can appear earlier (e.g. a header/usage comment)
    // without moving the guard, which would break an indexOf-based window.
    const guardBlock = src.match(/if\s*\([^)]*!ackProd[^)]*\)\s*\{([\s\S]*?)\n\}/);
    expect(guardBlock).not.toBeNull();
    // The refusal must terminate the process, not merely log.
    expect(guardBlock![1]).toMatch(/process\.exit\(1\)/);
  });

  it("still prints the dataset it is about to touch", () => {
    expect(script()).toMatch(/dataset \$\{?DATASET/);
  });
});
