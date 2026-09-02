# Payload Migration — Phase 0: Prerequisites — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the repository and the Sanity dataset into a state where Payload can be installed and content imported without data loss or blocked records.

**Architecture:** Five independent slices, each shippable on its own: a baseline archival export that becomes the rollback floor; the Next.js upgrade that Payload requires; two dataset defect fixes; and removal of a dead content type whose route is linked from primary navigation. No Payload code is written in this phase.

**Tech Stack:** Next.js 16, Sanity CLI v4, pnpm 10, Vitest 4, TypeScript 5.9.

**Spec:** `docs/superpowers/specs/2026-09-02-sanity-to-payload-migration-design.md`

## Global Constraints

- **Payload requires Next.js `15.2.9`–`15.4.x` or `≥16.2.6`.** The repo is on `16.1.1`, which is excluded. This is the phase's central blocker.
- **Node `>=20.9.0`** (repo `engines` already says `>=20`).
- **Never run `sanity typegen generate`.** It renames exported types (`PAGE_QUERYResult` vs the committed `PAGE_QUERY_RESULT`) and breaks `tsc`. Add schema fields and hand-edit `sanity.types.ts` instead.
- **`pnpm lint` is not a usable gate.** It carries roughly 656 pre-existing errors. Lint only the files you changed: `pnpm exec eslint <paths>`.
- **`pnpm typecheck` and `pnpm test` ARE usable gates** and must be green before every commit.
- **Never include Claude/AI attribution in commit messages** (`CLAUDE.md`).
- **Two databases and two datasets exist.** `.env` targets production (`production_2`); `.env.local` targets development. Every script must print which dataset and database it is about to touch, and must refuse `production_2` unless explicitly passed `--prod`.
- **Locales are `en` (default), `es`, `fr`, `ar` (RTL).**

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/export-sanity-archive.ts` | Create + verify the full dataset export; emit a manifest |
| `docs/migration/sanity-archive-manifest.json` | Committed record of what the archive contains (the archive itself is gitignored) |
| `sanity/schemas/documents/regional-community-page.ts:108-110` | `whyJoinCTA` type declaration fix |
| `scripts/fix-lived-experience-tags.mjs` | Already exists — run it |
| `app/[locale]/(main)/blog/` | Deleted |
| `components/header/index.tsx`, `components/footer.tsx` | Nav links repointed to `/news` |
| `app/sitemap.ts`, `app/api/webhooks/sanity/route.ts`, `lib/algolia.ts` | `post` branches removed |
| `sanity/schemas/documents/post.ts`, `sanity/schema.ts` | `post` type removed |

---

### Task 1: Baseline archival export

The rollback floor for everything that follows. Must happen before any dataset mutation.

**Files:**
- Create: `scripts/export-sanity-archive.ts`
- Create: `docs/migration/sanity-archive-manifest.json` (generated, committed)
- Test: `lib/__tests__/sanity-archive-manifest.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `buildManifest(docs: ManifestDoc[], dataset: string): Manifest` where
  `ManifestDoc = { _id: string; _type: string }` and
  `Manifest = { generatedAt: string; dataset: string; totals: { documents: number; published: number; drafts: number }; byType: Record<string, { published: number; drafts: number }>; archive?: { file: string; bytes: number; sha256: string } }`.
  Task 4 re-runs this to prove the tag fix altered no counts.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/sanity-archive-manifest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildManifest } from "@/scripts/lib/sanity-archive-manifest";

describe("buildManifest", () => {
  it("separates drafts from published, per type", () => {
    const m = buildManifest(
      [
        { _id: "a", _type: "caseStudy" },
        { _id: "drafts.a", _type: "caseStudy" },
        { _id: "b", _type: "author" },
      ],
      "production_2",
    );
    expect(m.totals).toEqual({ documents: 3, published: 2, drafts: 1 });
    expect(m.byType.caseStudy).toEqual({ published: 1, drafts: 1 });
    expect(m.byType.author).toEqual({ published: 1, drafts: 0 });
  });

  it("excludes sanity.* and system.* documents from totals", () => {
    const m = buildManifest(
      [
        { _id: "img", _type: "sanity.imageAsset" },
        { _id: "grp", _type: "system.group" },
        { _id: "a", _type: "tag" },
      ],
      "production_2",
    );
    expect(m.totals.documents).toBe(1);
    expect(m.byType["sanity.imageAsset"]).toBeUndefined();
  });

  it("records the dataset it was built from", () => {
    expect(buildManifest([], "production_2").dataset).toBe("production_2");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/sanity-archive-manifest.test.ts`
Expected: FAIL — `Failed to resolve import "@/scripts/lib/sanity-archive-manifest"`.

- [ ] **Step 3: Write the manifest builder**

Create `scripts/lib/sanity-archive-manifest.ts`:

```ts
export interface ManifestDoc {
  _id: string;
  _type: string;
}

export interface Manifest {
  generatedAt: string;
  dataset: string;
  totals: { documents: number; published: number; drafts: number };
  byType: Record<string, { published: number; drafts: number }>;
  /** Filled in by the export runner once the archive exists on disk. */
  archive?: { file: string; bytes: number; sha256: string };
}

/** Assets and Sanity's internal bookkeeping are not content and are excluded. */
const isContent = (type: string) =>
  !type.startsWith("sanity.") && !type.startsWith("system.");

export function buildManifest(docs: ManifestDoc[], dataset: string): Manifest {
  const byType: Manifest["byType"] = {};
  let published = 0;
  let drafts = 0;

  for (const doc of docs) {
    if (!isContent(doc._type)) continue;
    const isDraft = doc._id.startsWith("drafts.");
    byType[doc._type] ??= { published: 0, drafts: 0 };
    if (isDraft) {
      byType[doc._type].drafts++;
      drafts++;
    } else {
      byType[doc._type].published++;
      published++;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    dataset,
    totals: { documents: published + drafts, published, drafts },
    byType,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/sanity-archive-manifest.test.ts`
Expected: PASS, 3 tests.

Note: `vitest.config.ts` excludes `scripts/**` from *test collection*, not from module resolution — importing from `scripts/lib/` is fine.

- [ ] **Step 5: Write the export runner**

Create `scripts/export-sanity-archive.ts` — TypeScript run through `tsx`, matching the
repo's existing convention (`build:map`, `user:role`, `fix:order-ranks` are all
`tsx scripts/*.ts`). A `.mjs` file cannot import the `.ts` manifest builder, and the
`@next/env` path hack in `scripts/migrate-homepage-to-blocks.mjs` is pinned to
`@next+env@16.1.1` and will break the moment Task 2 upgrades Next:

```ts
// Full archival export of a Sanity dataset + an integrity manifest.
// The .tar.gz lands in backups/ (gitignored); the manifest is committed.
//
// Usage:
//   npx tsx scripts/export-sanity-archive.ts            # development dataset
//   npx tsx scripts/export-sanity-archive.ts --prod     # production_2
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { buildManifest, type Manifest } from "./lib/sanity-archive-manifest";

const prod = process.argv.includes("--prod");

// dotenv is a direct dependency; @next/env is not, and pnpm's strict layout
// means it is not reliably resolvable from a script.
//
// .env holds PRODUCTION credentials, .env.local holds development. Load the file
// matching the run's intent — hardcoding ".env" would make the development path
// unreachable and silently point every no-flag run at production.
dotenv.config({ path: prod ? ".env" : ".env.local" });

const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const token = process.env.SANITY_API_READ_TOKEN;

if (!dataset || !projectId || !token) {
  console.error("Missing NEXT_PUBLIC_SANITY_DATASET / _PROJECT_ID / SANITY_API_READ_TOKEN");
  process.exit(1);
}

// Production is opt-in, never a default. Mirrors the refusal in
// scripts/backfill-region-codes.mjs and scripts/localize-hero-ctas.mjs.
if (dataset === "production_2" && !prod) {
  console.error(
    'Refusing: the resolved dataset is "production_2" but --prod was not passed.\n' +
      "Re-run with --prod to export production deliberately.",
  );
  process.exit(1);
}

console.log(`Exporting project ${projectId}, dataset "${dataset}"`);

const stamp = new Date().toISOString().slice(0, 10);
const outDir = "backups";
const archive = path.join(outDir, `sanity-${dataset}-${stamp}.tar.gz`);
fs.mkdirSync(outDir, { recursive: true });

execFileSync(
  "pnpm",
  ["exec", "sanity", "dataset", "export", dataset, archive, "--overwrite"],
  { stdio: "inherit", env: { ...process.env, SANITY_AUTH_TOKEN: token } },
);

// Manifest is built from the live dataset, then checked against the archive.
const res = await fetch(
  `https://${projectId}.api.sanity.io/v${process.env.NEXT_PUBLIC_SANITY_API_VERSION}` +
    `/data/query/${dataset}?query=${encodeURIComponent("*[]{_id,_type}")}`,
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!res.ok) {
  console.error(`Query failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const { result } = await res.json();

const manifest: Manifest = buildManifest(result, dataset);
manifest.archive = {
  file: path.basename(archive),
  bytes: fs.statSync(archive).size,
  sha256: createHash("sha256").update(fs.readFileSync(archive)).digest("hex"),
};

const manifestPath = "docs/migration/sanity-archive-manifest.json";
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log(`\nArchive:  ${archive} (${(manifest.archive.bytes / 1e6).toFixed(1)} MB)`);
console.log(`Manifest: ${manifestPath}`);
console.log(`Content:  ${manifest.totals.published} published + ${manifest.totals.drafts} drafts`);
```

- [ ] **Step 6: Run the export against production**

Run: `npx tsx scripts/export-sanity-archive.ts --prod`

Expected: an archive in `backups/` of roughly 620-640 MB, and a manifest reporting
**`446 published + 30 drafts`**.

That 446 breaks down as **438 migratable content documents + 8 `translation.metadata`**.
`buildManifest` excludes only `sanity.*` and `system.*`, so Sanity's translation-grouping
documents are counted here even though §6 of the spec does not migrate them. Both numbers
are correct for their own purpose: 446 is what the archive contains, 438 is what Phase 2
imports.

**If the totals differ from those numbers, stop** — the dataset changed since the design
was measured, and §2 of the spec needs re-checking before anything is migrated.

- [ ] **Step 7: Verify the archive is readable**

Run: `tar -tzf backups/sanity-production_2-*.tar.gz | head -20`
Expected: a `data.ndjson` entry plus `images/` and `files/` entries. A truncated or
corrupt archive fails here rather than during the Phase 2 import.

- [ ] **Step 8: Commit**

```bash
git add scripts/export-sanity-archive.ts scripts/lib/sanity-archive-manifest.ts \
        lib/__tests__/sanity-archive-manifest.test.ts docs/migration/sanity-archive-manifest.json
git commit -m "feat(migration): archival Sanity export with integrity manifest

Rollback floor for the Payload migration. The .tar.gz stays local
(backups/ is gitignored); the manifest records per-type published and
draft counts plus the archive checksum so later phases can prove they
did not lose documents."
```

---

### Task 2: Next.js upgrade to 16.2.6+

Payload's supported range excludes 16.1.x. Ships on its own so a Next regression stays diagnosable before Payload exists in the tree.

**Files:**
- Modify: `package.json` (`next`, `eslint-config-next`)
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: nothing.
- Produces: a tree on Next `>=16.2.6`. Phase 2's `withPayload()` wrapper depends on it.

- [ ] **Step 1: Record the baseline**

Run and save the output somewhere you can diff against:

```bash
pnpm typecheck 2>&1 | tail -20
pnpm test 2>&1 | tail -20
node scripts/create-all-outputs-pages.mjs && pnpm exec next build 2>&1 | tail -30
```

Do NOT run `pnpm build` here. It fires the `postbuild` hook, which runs `sync:search`
and pushes records to the **live Algolia index** — an external side effect with no place
in a verification step. The two commands above reproduce the same build without it.

Expected: `typecheck` clean, tests green, build succeeds. **If any is already red, fix or
document that before upgrading** — otherwise you cannot tell what the upgrade broke.

- [ ] **Step 2: Check what the upgrade actually spans**

Run: `pnpm view next versions --json | tail -30`

Identify the latest `16.x`. The jump from `16.1.1` crosses a minor, with Turbopack,
`next-intl@4`, `@clerk/nextjs@6` and `@sentry/nextjs@10` all in the tree.

- [ ] **Step 3: Upgrade**

```bash
pnpm add next@latest
pnpm add -D eslint-config-next@latest
```

Verify the resolved version is `>=16.2.6`: `pnpm list next --depth 0`

- [ ] **Step 4: Run the codemod**

Run: `pnpm dlx @next/codemod@latest upgrade`

Accept only transformations it proposes for this version jump. Review the diff — do not
accept blind rewrites of app code.

- [ ] **Step 5: Verify against the baseline**

```bash
pnpm typecheck
pnpm test
node scripts/create-all-outputs-pages.mjs && pnpm exec next build
```

Again: not `pnpm build` — see Step 1.

Expected: all three match the Step 1 baseline. Common breakages at this boundary are
`next/headers` async APIs, `params`/`searchParams` promise shapes, and Turbopack
resolution differences.

- [ ] **Step 6: Verify the running app**

Run `pnpm dev`, then load and visually confirm — a green build is not validation:

- `/` (homepage, block rendering)
- `/en/research-and-action/case-studies` (list + Algolia search)
- `/ar` (RTL layout)
- `/studio` (Sanity Studio still mounts)
- one authenticated page (Clerk session still resolves)

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): upgrade Next.js to 16.2.6+ for Payload compatibility

Payload supports 15.2.9-15.4.x and 16.2.6+; 16.1.1 is outside that range,
so this gates the CMS migration. Shipped alone so any regression here is
diagnosable without Payload in the tree.

Verified: typecheck, 75 test files, production build, and rendered checks
on homepage, case studies, RTL and Studio."
```

**If this task fails** and the upgrade cannot be stabilised, stop the migration and report.
Every later phase depends on it; there is no workaround short of running Payload as a
separate service, which decision D1 rejected.

---

### Task 3: Fix the `whyJoinCTA` type declaration

Blocks the Phase 2 import: the field is declared `hero-1`, every document stores `cta-1`, and Payload cannot hold one block type in a field typed as another.

**Files:**
- Modify: `sanity/schemas/documents/regional-community-page.ts:108-110`
- Test: `lib/__tests__/regional-community-page-schema.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a `regionalCommunityPage` schema whose declared field types match stored data. Phase 2's collection modelling reads this file as the source of truth.

The renderer needs no change: `components/templates/regional-community-template.tsx:221`
treats `whyJoinCTA` as a generic `CmsBlockConfig` (`title` / `body`), not as a `hero-1`.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/regional-community-page-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import regionalCommunityPage from "@/sanity/schemas/documents/regional-community-page";

const fieldNamed = (name: string) =>
  (regionalCommunityPage.fields as Array<{ name: string; type: string }>).find(
    (f) => f.name === name,
  );

describe("regionalCommunityPage schema", () => {
  it("declares whyJoinCTA as cta-1, matching what every document stores", () => {
    expect(fieldNamed("whyJoinCTA")?.type).toBe("cta-1");
  });

  it("still declares welcomeHero as hero-1", () => {
    expect(fieldNamed("welcomeHero")?.type).toBe("hero-1");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/regional-community-page-schema.test.ts`
Expected: FAIL — `expected 'hero-1' to be 'cta-1'`. This failure *is* the defect.

- [ ] **Step 3: Fix the declaration**

In `sanity/schemas/documents/regional-community-page.ts`, change the `whyJoinCTA` field:

```ts
    defineField({
      name: "whyJoinCTA",
      title: "Why Join Regional Community CTA",
      type: "cta-1",
      group: "template",
      hidden: ({ document }) => !Boolean(document?.useTemplate),
      description: "Call-to-action inviting members to join this regional community",
    }),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/regional-community-page-schema.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Verify no stored document contradicts the new declaration**

```bash
set -a; . ./.env; set +a
curl -s -G "https://${NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v${NEXT_PUBLIC_SANITY_API_VERSION}/data/query/${NEXT_PUBLIC_SANITY_DATASET}" \
  --data-urlencode 'query=array::unique(*[_type=="regionalCommunityPage"].whyJoinCTA._type)' \
  -H "Authorization: Bearer ${SANITY_API_READ_TOKEN}"
```

Expected: exactly `["cta-1"]`. Any other value means some documents hold a different block
and the field must become a union before import.

- [ ] **Step 6: Verify the rendered page is unchanged**

Run `pnpm dev` and load `/en/communities/sub-saharan-africa`. The "why join" section must
render identically to before the change — this edits a declaration, not data.

- [ ] **Step 7: Commit**

```bash
git add sanity/schemas/documents/regional-community-page.ts \
        lib/__tests__/regional-community-page-schema.test.ts
git commit -m "fix(cms): declare whyJoinCTA as cta-1 to match stored data

The field was declared hero-1 while all 28 published regional pages store
_type: cta-1. Sanity tolerates the mismatch because renderers read the
stored type, but Payload cannot hold one block type in a field typed as
another, so this would block the import.

Declaration-only change; the template already treats whyJoinCTA as a
generic CmsBlockConfig."
```

---

### Task 4: Fix malformed lived-experience tags

33 of 35 published documents hold string tags where the schema declares a reference array — legacy backfill residue that would import as unresolvable references.

**Files:**
- Modify: `scripts/fix-lived-experience-tags.mjs` (exists; verify before running)

**Interfaces:**
- Consumes: `buildManifest` from Task 1, to prove document counts are unchanged.
- Produces: a dataset where every `livedExperience.tags` entry is a reference.

- [ ] **Step 1: Read the existing script before running it**

Run: `cat scripts/fix-lived-experience-tags.mjs`

Confirm it is dry-run by default, that it maps string values onto existing `tag`
documents rather than creating duplicates, and that it refuses `production_2` without an
explicit flag. **If any of those is missing, fix the script before running it.**

- [ ] **Step 2: Measure the defect**

```bash
set -a; . ./.env; set +a
curl -s -G "https://${NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v${NEXT_PUBLIC_SANITY_API_VERSION}/data/query/${NEXT_PUBLIC_SANITY_DATASET}" \
  --data-urlencode 'query={"malformed": count(*[_type=="livedExperience" && count(tags[!defined(_ref)]) > 0]), "total": count(*[_type=="livedExperience"])}' \
  -H "Authorization: Bearer ${SANITY_API_READ_TOKEN}"
```

Expected: roughly `{"malformed": 33, "total": 35}` (the total includes drafts, so it may
read 56). Record the exact number — Step 5 checks it reaches zero.

- [ ] **Step 3: Dry-run against the development dataset**

Run: `node scripts/fix-lived-experience-tags.mjs`

Review the proposed patches. Every string value must map to an existing `tag` document;
any unmapped value needs a decision (create the tag, or drop the value) before proceeding.

- [ ] **Step 4: Apply**

Run: `node scripts/fix-lived-experience-tags.mjs --prod --apply`

- [ ] **Step 5: Verify the defect is gone and nothing was lost**

Re-run the Step 2 query. Expected: `malformed: 0`, `total` unchanged.

Then re-run the manifest and diff it:

```bash
npx tsx scripts/export-sanity-archive.ts --prod
git diff docs/migration/sanity-archive-manifest.json
```

Expected: only `generatedAt` and the archive checksum change. **Any change to
`totals` or `byType` means the fix created or destroyed documents — investigate before
committing.**

- [ ] **Step 6: Verify the rendered page**

Run `pnpm dev` and load `/en/lived-experiences`. Tag filter chips must still populate and
filtering must still work — the tags are now references, which is what the query already
dereferences.

- [ ] **Step 7: Commit**

```bash
git add docs/migration/sanity-archive-manifest.json scripts/fix-lived-experience-tags.mjs
git commit -m "fix(cms): normalise lived-experience tags to references

33 of 35 published lived experiences stored tags as bare strings where the
schema declares a reference array, from a legacy backfill. Payload would
import these as unresolvable references.

Manifest totals unchanged: no documents created or destroyed."
```

---

### Task 5: Remove the `post` type and the dead `/blog` route

`/blog` queries `post`, which has zero documents, and is linked from both the header and the footer — a dead navigation link live in production today.

**Files:**
- Delete: `app/[locale]/(main)/blog/page.tsx`, `app/[locale]/(main)/blog/[slug]/page.tsx`
- Delete: `sanity/schemas/documents/post.ts`, `sanity/queries/post.ts`
- Modify: `sanity/schema.ts` (remove the `post` import and registry entry)
- Modify: `components/header/index.tsx:16`, `components/footer.tsx:13`
- Modify: `app/sitemap.ts:30-31`, `app/api/webhooks/sanity/route.ts:100`, `lib/algolia.ts:234`
- Modify: `sanity/lib/fetch.ts` (remove `fetchSanityPosts`, `fetchSanityPostBySlug`, `fetchSanityPostsStaticParams`)
- Modify: `lib/issue-report.ts:74` (remove the `/blog` route label)
- Test: `lib/__tests__/no-dead-blog-route.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a tree with no `post` document type. Phase 2 models 19 collections, not 20.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/no-dead-blog-route.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { schema } from "@/sanity/schema";

describe("the dead /blog route is gone", () => {
  it("no longer registers a post document type", () => {
    const names = schema.types.map((t) => (t as { name: string }).name);
    expect(names).not.toContain("post");
  });

  it("does not link to /blog from the header", () => {
    expect(readFileSync("components/header/index.tsx", "utf8")).not.toContain('"/blog"');
  });

  it("does not link to /blog from the footer", () => {
    expect(readFileSync("components/footer.tsx", "utf8")).not.toContain('"/blog"');
  });

  it("does not emit /blog URLs in the sitemap", () => {
    expect(readFileSync("app/sitemap.ts", "utf8")).not.toContain("/blog/");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run lib/__tests__/no-dead-blog-route.test.ts`
Expected: FAIL on all four assertions.

- [ ] **Step 3: Delete the route and the schema**

```bash
git rm -r "app/[locale]/(main)/blog"
git rm sanity/schemas/documents/post.ts sanity/queries/post.ts
```

In `sanity/schema.ts`, remove both the `import post from "./schemas/documents/post";`
line and the bare `post,` entry in the `types` array.

- [ ] **Step 4: Repoint the navigation**

`components/header/index.tsx:16` — change `href: "/blog"` to `href: "/news"`.
`components/footer.tsx:13` — change `{ label: t("blog"), href: "/blog" }` to
`{ label: t("news"), href: "/news" }`.

Check that a `news` key exists in every locale file before using it:

```bash
for f in messages/*.json; do echo -n "$f: "; node -e '
const m = require("./" + process.argv[1]);
const flat = JSON.stringify(m);
console.log(flat.includes("\"news\"") ? "has news key" : "MISSING news key");
' "$f"; done
```

If any locale lacks the key, add it to all four (`en`, `es`, `fr`, `ar`) before continuing.

- [ ] **Step 5: Remove the remaining `post` branches**

- `app/sitemap.ts:30-31` — delete the `*[_type == 'post']` query block and the entry it
  produces.
- `app/api/webhooks/sanity/route.ts:100` — delete the `case 'post':` branch.
- `lib/algolia.ts:234` — change `contentType: 'report' | 'post' | 'case-study'` to
  `contentType: 'report' | 'case-study'`, then fix the call sites `tsc` reports.
- `sanity/lib/fetch.ts` — delete `fetchSanityPosts`, `fetchSanityPostBySlug` and
  `fetchSanityPostsStaticParams`, and their now-unused imports from `@/sanity/queries/post`
  and `@/sanity.types`.
- `lib/issue-report.ts:74` — delete the `[/^\/blog/, "blog"]` entry.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm exec vitest run lib/__tests__/no-dead-blog-route.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Verify the whole suite and types**

```bash
pnpm typecheck
pnpm test
pnpm exec eslint app components lib sanity
```

Expected: `typecheck` clean; full suite green. `tsc` is the real gate here — it finds every
remaining reference to the deleted types.

- [ ] **Step 8: Verify the rendered app**

Run `pnpm dev` and confirm:
- The header and footer links now go to `/news`, which lists the 4 news posts.
- `/en/blog` returns 404.
- `/sitemap.xml` contains no `/blog/` URLs.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(cms): remove the dead post type and /blog route

/blog queried the post type, which has zero documents, while being linked
from both the header and footer — a dead nav link in production. newsPost
at /news is the real type and supersedes it.

Removes the post schema and queries, the /blog routes, its sitemap and
webhook branches, the algolia contentType member, and three fetch helpers.
Header and footer now point at /news."
```

---

## Phase 0 exit criteria

Before starting Phase 1, all of these must hold:

- [ ] `pnpm list next --depth 0` reports `>=16.2.6`
- [ ] `pnpm typecheck` clean, `pnpm test` green
- [ ] `backups/sanity-production_2-*.tar.gz` exists, passes `tar -tzf`, and its checksum matches `docs/migration/sanity-archive-manifest.json`
- [ ] The manifest reports 446 published (438 migratable + 8 `translation.metadata`) + 30 drafts
- [ ] `array::unique(*[_type=="regionalCommunityPage"].whyJoinCTA._type)` returns exactly `["cta-1"]`
- [ ] No `livedExperience` document has a non-reference tag
- [ ] `/en/blog` 404s; header and footer link to `/news`
