import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

/**
 * Phase 1's whole purpose: exactly one directory knows the CMS exists.
 *
 * This is Task 10b's slice of that guarantee: nothing outside the seam
 * imports the generated `sanity.types.ts` — a 15,156-line artifact that
 * disappears the moment Sanity does. Task 11 extends this file with the full
 * `@/sanity` / `@sanity/` / `next-sanity` sweep (and an ALLOWED list for the
 * Studio's own plumbing) once Tasks 10c and 10d finish converting their own
 * importers; sanity.types.ts has no legitimate importer anywhere in
 * app/components/lib, so this check needs no allowlist of its own.
 */
const grepSanityTypesImports = (paths: string[]): string[] => {
  try {
    const out = execFileSync(
      "grep",
      ["-rlnE", String.raw`(from|require\()\s*['"][^'"]*@/sanity\.types`, ...paths],
      { encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return []; // grep exits 1 when there are no matches
  }
};

describe("content layer boundary", () => {
  it("nothing outside the seam imports the generated sanity.types.ts", () => {
    const offenders = grepSanityTypesImports(["app", "components", "lib"]).filter(
      (f) => !f.startsWith("lib/__tests__/"),
    );
    expect(offenders).toEqual([]);
  });
});
