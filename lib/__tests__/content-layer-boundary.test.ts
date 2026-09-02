import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * Phase 1's whole purpose: exactly one directory knows the CMS exists.
 * If this file fails, someone reached around lib/content/ and Phase 3's
 * backend swap just got more expensive.
 *
 * Task 10b introduced this file scoped to the one check it could keep green
 * before the rest of the app finished converting: nothing outside the seam
 * imports the generated `sanity.types.ts`. Task 11 extends it, now that
 * Tasks 2–10 have converted every other importer, with the full `@/sanity` /
 * `@sanity/*` / `next-sanity` sweep across app/components/lib, plus the
 * ALLOWED list for Sanity's own plumbing (the Studio route and the
 * Presentation/draft-mode/webhook machinery it needs to run at all).
 */

/**
 * Match IMPORT STATEMENTS only, not any mention of the string "sanity".
 *
 * A plain substring grep flags files like this one, or lib/content/types.ts,
 * for the doc comments that explain this very rule — the test would fail on
 * correct code. Anchor on `from "...sanity..."` / `require("...sanity...")`
 * instead.
 *
 * Known limitation: this is a grep over raw source text, not a parser, so it
 * is comment-blind — a *commented-out* `// import x from "@/sanity/foo"`
 * still matches and gets flagged as an offender. That happened for real
 * during this phase (a dead import inside a stale TODO in
 * components/blocks/index.tsx failed the gate until the line was deleted).
 * We deliberately do NOT strip comments before matching: a comment-stripper
 * correct enough to avoid false negatives (e.g. a `//` inside a string
 * literal, or a "sanity" import mentioned inside a block comment) is a small
 * parser in its own right, and the failure mode of getting it subtly wrong
 * is worse than the failure mode here. The cost of comment-blindness is a
 * false positive — a red test on genuinely dead, commented-out code — which
 * is safe to hit and cheap to fix (delete the dead line). The cost of a
 * mismatched real import is a green test on a real boundary violation, which
 * is exactly what this file exists to prevent. If this false-positive ever
 * gets annoying in practice, the fix is a real import-aware lint rule
 * (`no-restricted-imports` via ESLint's AST, not this grep), not a
 * hand-rolled comment stripper here.
 */
const grepSanityImports = (paths: string[]): string[] => {
  try {
    const out = execFileSync(
      "grep",
      [
        "-rlnE",
        String.raw`(from|require\()\s*['"][^'"]*(@/sanity|@sanity/|next-sanity)`,
        ...paths,
      ],
      { encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return []; // grep exits 1 when there are no matches
  }
};

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

/**
 * The only files permitted to import Sanity. Everything here is Sanity's own
 * plumbing — the Studio, its Presentation/draft-mode machinery, and inbound
 * webhook signature verification — not application code. Each entry says why
 * it is exempt.
 *
 * Do NOT add a file here to make the test pass. If a content file appears in
 * the failure list, convert it; that is the work this phase exists to do.
 */
const ALLOWED = [
  // The seam itself: the only place lib/content/ is permitted to know Sanity
  // exists. Phase 3 adds a payload-source.ts sibling here.
  "lib/content/internal/sanity-source.ts",
  // The image-URL builder seam — same rationale as sanity-source.ts, split
  // out because image handling has its own small Sanity-specific surface.
  "lib/content/internal/image-source.ts",
  // The embedded Studio route: it *is* the Sanity admin UI, mounted at
  // /studio via next-sanity's NextStudio component.
  "app/studio/[[...tool]]/page.tsx",
  // Presentation draft-mode enable/disable endpoints. These implement
  // Sanity's live-preview protocol directly; there is no content-layer
  // abstraction to route them through.
  "app/api/draft-mode/enable/route.ts",
  "components/disable-draft-mode.tsx",
  // Renders <SanityLive/> and <VisualEditing/>, but only inside
  // `isDraftMode` branches — Presentation's live-preview wiring, not a
  // content read.
  "app/[locale]/(main)/layout.tsx",
  // Inbound webhook receivers: they verify Sanity's HMAC signature via
  // @sanity/webhook before trusting the payload. That verification is
  // Sanity-specific by definition and has nothing to convert to.
  "app/api/webhooks/sanity/route.ts",
  "app/api/search/news/webhook/route.ts",
];

describe("content layer boundary", () => {
  it("only lib/content/internal/ imports Sanity inside lib/content/", () => {
    const offenders = grepSanityImports(["lib/content"]).filter(
      (f) => !ALLOWED.includes(f),
    );
    expect(offenders).toEqual([]);
  });

  it("no app route or component imports Sanity directly", () => {
    const offenders = grepSanityImports(["app", "components"]).filter(
      (f) => !ALLOWED.includes(f),
    );
    expect(offenders).toEqual([]);
  });

  it("no lib module outside lib/content/internal imports Sanity", () => {
    const offenders = grepSanityImports(["lib"]).filter(
      (f) => !f.startsWith("lib/content/internal/") && !f.startsWith("lib/__tests__/"),
    );
    expect(offenders).toEqual([]);
  });

  it("nothing outside the seam imports the generated sanity.types.ts", () => {
    // The 15,156-line generated artifact disappears with Sanity (Task 10b).
    // No entry in ALLOWED legitimately needs generated query-result types,
    // so this check carries no allowlist of its own.
    const offenders = grepSanityTypesImports(["app", "components", "lib"]).filter(
      (f) => !f.startsWith("lib/__tests__/"),
    );
    expect(offenders).toEqual([]);
  });

  it("sanity/lib/fetch.ts no longer exists", () => {
    // Superseded by lib/content/internal/sanity-source.ts's `query()`
    // (Task 10b deleted it). If this comes back, something regressed to
    // fetching Sanity directly instead of through the seam.
    expect(existsSync("sanity/lib/fetch.ts")).toBe(false);
  });

  it("sanity/queries/ no longer exists", () => {
    // The 46-file query tree moved into lib/content/ domain modules.
    // Its return would mean queries are being written outside the seam again.
    expect(existsSync("sanity/queries")).toBe(false);
  });
});
