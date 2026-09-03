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
 * imports the generated `sanity.types.ts`. Task 11 extended it, now that
 * Tasks 2–10 have converted every other importer, with the full `@/sanity` /
 * `@sanity/*` / `next-sanity` sweep across app/components/lib, plus the
 * ALLOWED list for Sanity's own plumbing (the Studio route and the
 * Presentation/draft-mode/webhook machinery it needs to run at all).
 *
 * The final whole-branch review (2026-09-02) found two holes in that gate:
 *
 *   1. It banned `@/sanity` imports but not `@/lib/content/internal/`
 *      imports — so a file could reach around the domain modules and call
 *      the seam's primitives directly, still holding live GROQ, and the
 *      gate would say nothing. Five files did exactly that; see
 *      INTERNAL_SEAM_ALLOWED below.
 *   2. ALLOWED worked at file granularity: a file on the list was exempt
 *      for ANY Sanity import, not just the one it actually needs. The two
 *      webhook routes hold substantial non-Sanity business logic beside one
 *      legitimate `@sanity/webhook` import, so they could silently pick up
 *      an unrelated direct Sanity import later without this gate noticing.
 *      ALLOWED is now per-file *and* per-import: an entry is either `true`
 *      (the file's whole purpose is Sanity plumbing — Studio, Presentation,
 *      draft mode, or the seam itself) or a list of the specific import
 *      specifiers that file may use, and only a matched import line
 *      containing one of those specifiers is exempt.
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
const SANITY_IMPORT_PATTERN = String.raw`(from|require\()\s*['"][^'"]*(@/sanity|@sanity/|next-sanity)`;

type MatchedLine = { file: string; content: string };

/** Every line across `paths` that imports something Sanity-shaped, with the
 *  file it's in — so callers can judge a specific import, not just a file. */
const grepSanityImportLines = (paths: string[]): MatchedLine[] => {
  try {
    const out = execFileSync("grep", ["-rnE", SANITY_IMPORT_PATTERN, ...paths], {
      encoding: "utf8",
    });
    return out
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        // grep -n output is "path:lineNumber:content" — content itself may
        // contain colons (it's an import statement), so split on the first
        // two only.
        const firstColon = line.indexOf(":");
        const secondColon = line.indexOf(":", firstColon + 1);
        return { file: line.slice(0, firstColon), content: line.slice(secondColon + 1) };
      });
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

const grepInternalSeamImports = (paths: string[]): string[] => {
  try {
    const out = execFileSync(
      "grep",
      ["-rlnE", String.raw`(from|require\()\s*['"][^'"]*lib/content/internal`, ...paths],
      { encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean);
  } catch {
    return []; // grep exits 1 when there are no matches
  }
};

/**
 * The only files permitted to import Sanity, and exactly what they may
 * import it for:
 *
 *   - `true` — the file's entire purpose IS Sanity plumbing (the seam
 *     itself, the embedded Studio, Presentation/draft-mode wiring). Further
 *     restricting the import list buys nothing: the whole file is already
 *     the thing being exempted.
 *   - `string[]` — the file has real application logic and is exempt only
 *     for the listed import specifier(s). Any OTHER Sanity import in that
 *     file is a boundary violation the gate must still catch.
 *
 * Do NOT add a file here to make the test pass. If a content file appears in
 * the failure list, convert it; that is the work this phase exists to do.
 */
const ALLOWED: Record<string, true | string[]> = {
  // The seam itself: the only place lib/content/ is permitted to know Sanity
  // exists. Phase 3 adds a payload-source.ts sibling here.
  "lib/content/internal/sanity-source.ts": true,
  // The image-URL builder seam — same rationale as sanity-source.ts, split
  // out because image handling has its own small Sanity-specific surface.
  "lib/content/internal/image-source.ts": true,
  // The embedded Studio route: it *is* the Sanity admin UI, mounted at
  // /studio via next-sanity's NextStudio component.
  "app/studio/[[...tool]]/page.tsx": true,
  // Presentation draft-mode enable/disable endpoints. These implement
  // Sanity's live-preview protocol directly; there is no content-layer
  // abstraction to route them through.
  "app/api/draft-mode/enable/route.ts": true,
  "components/disable-draft-mode.tsx": true,
  // Renders <SanityLive/> and <VisualEditing/>, but only inside
  // `isDraftMode` branches — Presentation's live-preview wiring, not a
  // content read.
  "app/[locale]/(main)/layout.tsx": true,
  // Inbound webhook receivers: they verify Sanity's HMAC signature via
  // @sanity/webhook before trusting the payload. That verification is
  // Sanity-specific by definition and has nothing to convert to — but
  // everything else in these two files is app business logic (revalidation,
  // Algolia sync, email notification), so the exemption is scoped to the
  // one import, not the whole file.
  "app/api/webhooks/sanity/route.ts": ["@sanity/webhook"],
  "app/api/search/news/webhook/route.ts": ["@sanity/webhook"],
};

/**
 * Files outside lib/content/ that reach the seam (`lib/content/internal/`)
 * directly instead of going through a domain module — found by the final
 * whole-branch review (2026-09-02). Every entry here is Phase 3 debt: the
 * phase's headline claim is "swap the CMS backend by rewriting one
 * directory," and that is not quite true while these five exist. Each entry
 * says why it isn't routed through lib/content/ today.
 *
 * Do NOT add a file here to make the test pass. If a new out-of-seam
 * internal import shows up, either route it through a domain module or, if
 * it genuinely cannot be, add it here with a real reason.
 */
const INTERNAL_SEAM_ALLOWED = [
  // Verifies the Sanity webhook signature, then reads the changed
  // document's notification projection directly. Small and single-purpose;
  // Phase 3 should still route this through a domain module, but it was
  // out of scope for Phase 1 (the webhook itself is on the Sanity-plumbing
  // exemption above).
  "app/api/webhooks/sanity/route.ts",
  // GDPR account deletion: reads and deletes every Sanity document a user
  // authored across content types as one step of a larger cross-system
  // erasure flow. Holds live GROQ (3 queries) with no domain-module home
  // that fits its cross-type shape.
  "lib/account-deletion.ts",
  // Syncs a user's authored-content metadata (work types, expertise areas,
  // internationalized array fields) between Prisma and Sanity on profile
  // edit. Holds live GROQ (4 queries) plus Sanity-shaped document bodies;
  // not yet given a domain-module home.
  "lib/actions/sync-user-management.ts",
  // Validates Prisma enum values against Sanity content and can generate
  // TypeScript definitions from it. Holds live GROQ (2 queries) but has
  // ZERO importers anywhere in app/components/lib — dead code kept
  // (per this phase's "convert dead code, don't delete" rule) rather than
  // given a domain-module home it would never actually use.
  "lib/utils/sanity-prisma-sync.ts",
  // Uploads an image asset for a client-side renderer. No GROQ — just calls
  // `uploadImageAsset`, one of the seam's ten primitives directly, the same
  // way any lib/content/ domain module would.
  "app/api/uploads/image/route.ts",
];

/** Given a matched Sanity-import line, is it allowed for that file? */
const isAllowedSanityImport = ({ file, content }: MatchedLine): boolean => {
  const allowance = ALLOWED[file];
  if (allowance === undefined) return false;
  if (allowance === true) return true;
  return allowance.some((specifier) => content.includes(specifier));
};

/** Render offenders as "file:content" so a failure names the exact import,
 *  not just the file — the whole point of per-import granularity. */
const describeOffenders = (lines: MatchedLine[]): string[] =>
  lines.filter((l) => !isAllowedSanityImport(l)).map((l) => `${l.file}: ${l.content.trim()}`);

describe("content layer boundary", () => {
  it("only lib/content/internal/ imports Sanity inside lib/content/", () => {
    const offenders = describeOffenders(grepSanityImportLines(["lib/content"]));
    expect(offenders).toEqual([]);
  });

  it("no app route or component imports Sanity directly", () => {
    const offenders = describeOffenders(grepSanityImportLines(["app", "components"]));
    expect(offenders).toEqual([]);
  });

  it("no lib module outside lib/content/internal imports Sanity", () => {
    const offenders = grepSanityImportLines(["lib"])
      .filter((l) => !l.file.startsWith("lib/content/internal/") && !l.file.startsWith("lib/__tests__/"))
      .map((l) => l.file);
    expect(offenders).toEqual([]);
  });

  it("nothing outside lib/content/ imports lib/content/internal/", () => {
    // lib/content/ domain modules calling their own seam are the whole
    // point (not a violation); lib/__tests__/ mocks the seam's exports for
    // type-safety and never runs the real module.
    const offenders = grepInternalSeamImports(["app", "components", "lib"]).filter(
      (f) => !f.startsWith("lib/content/") && !f.startsWith("lib/__tests__/") && !INTERNAL_SEAM_ALLOWED.includes(f),
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
