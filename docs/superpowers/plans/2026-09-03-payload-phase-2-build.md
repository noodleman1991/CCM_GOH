# Payload Migration — Phase 2: Build Payload in Parallel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a complete Payload CMS alongside the running site — schema, admin, auth, uploads — and import all 476 Sanity documents plus 620 MB of assets into it, without changing a single thing the public site does.

**Architecture:** Payload 3.88 installs into this Next.js app under a `(payload)` route group, backed by its own Postgres database in the existing Neon project. Every Sanity document keeps its exact `_id` as a Payload custom text ID, which makes the import idempotent and re-runnable. Portable Text converts to Lexical at import time; a Lexical→Portable Text adapter keeps all 36 existing render sites working so Phase 3 does not become a rendering rewrite.

**Tech Stack:** Payload 3.88.0 (`payload`, `@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/storage-r2`), Next.js 16.3.4, Postgres on Neon, Clerk, Cloudflare R2, TypeScript 5.9, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-02-sanity-to-payload-migration-design.md` (§5 Phase 2, decisions D1–D10)

**Depends on:** Phase 1 complete — every Sanity read and write already runs through `lib/content/`, enforced by `lib/__tests__/content-layer-boundary.test.ts`.

## Global Constraints

- **Nothing user-facing changes in this phase.** The public site continues to read Sanity through `lib/content/` throughout. Payload is built beside it, not wired into it. Phase 3 does the swap. If a task finds itself editing a page, a component, or a `lib/content/` domain module, it has left its lane.
- **Payload 3.88.0**, all `@payloadcms/*` packages pinned to the same version. Next.js must stay `>=16.2.6` (currently 16.3.4).
- **A separate Postgres database inside the existing Neon project** — never Prisma's. `prisma migrate reset` drops the schema it manages; co-locating would put 476 content documents one dev reset from deletion.
- **Custom text ID field on every collection.** `{ name: 'id', type: 'text' }` at the root of `fields`. **Do not set `idType: 'uuid'`** — 310 of the 446 published Sanity ids are slug-like (`tag-farmers`), not UUIDs, and `uuid` would reject every one.
- **The import must be idempotent.** Running it twice produces the same database. This is the property that lets it be re-run after a schema fix instead of restored from a snapshot.
- **Never run `sanity typegen generate`** — it renames exported types and breaks `tsc`.
- **Do NOT run `pnpm build`** — its `postbuild` hook runs `sync:search`, which pushes to a **live Algolia index**. Use `node scripts/create-all-outputs-pages.mjs && pnpm exec next build`.
- **`pnpm lint` is not a gate** (~656 pre-existing errors). Lint changed files only: `pnpm exec eslint <paths>`.
- **`pnpm typecheck` and `pnpm exec vitest run` are gates.** Baseline entering this phase: **96 test files / 1087 tests**.
- **Never write to the Sanity `production_2` dataset.** This phase reads Sanity and writes Payload.
- **Never include Claude/AI attribution or a Co-Authored-By trailer in commit messages** (`CLAUDE.md`).
- Locales: `en` (default), `es`, `fr`, `ar` (RTL).
- **Anonymous read requires published AND approved.** Payload's `_status` alone is not the gate: two *published* case studies carry `moderationStatus: "pending"`, and Sanity's GROQ filters on `status == "approved"` today. Gating only on `_status` re-opens a vulnerability this project has already had once — non-approved case studies, with their `reviewNotes` and `submittedBy`, readable anonymously.

## What is being imported

Measured against `production_2`:

| | |
|---|---|
| Published content documents | 438 |
| Content drafts (import as draft *versions*) | 30 |
| Images / files | 347 (223 MB) / 48 (395 MB) |
| Collections to build | 19 live + `event`, `project` (empty, code-backed) |
| Globals | `homepage`, `onboardingContent`, `siteAnnouncement`, `moderationSettings`, `hubIllustrations` |
| Blocks carrying data | 12 |
| Portable Text node types in real data | 3 (`block`, `image`, `youtube`) + 5 registered-but-unused |

**Phase 3 will have to serve 150 exported functions** from `lib/content/`'s sixteen modules using this schema. That is the real acceptance test for the content model: not "does it look like the Sanity schema" but "can it answer every question `lib/content/` asks".

---

## File Structure

| File | Responsibility |
|---|---|
| `payload.config.ts` | Root config — db, collections, globals, localization, editor, plugins |
| `payload/collections/*.ts` | One file per collection |
| `payload/globals/*.ts` | One file per global |
| `payload/blocks/*.ts` | The 12 live block definitions, shared between page-builder fields |
| `payload/fields/localized.ts` | The `localized: true` helpers mirroring Sanity's two i18n lanes |
| `payload/access/index.ts` | Access-control functions keyed on Prisma's `User.role` enum |
| `payload/auth/clerk-strategy.ts` | The custom auth strategy |
| `app/(payload)/**` | Payload's own route group — admin UI, REST, GraphQL |

**Two layout facts this repo imposes, both found in pre-flight:**

1. **There is no `src/` directory.** The repo puts `app/`, `components/` and `lib/` at the root. Payload's own code goes in `payload/` at the root, imported as `@/payload/…`.
2. **Payload's REST API must NOT mount at `/api`.** There are **71 existing route files under `app/api/`**. Payload's default is a catch-all at `/api/[...slug]`, which would sit on top of all of them and answer every unmatched `/api/*` path with a Payload error instead of a 404. Set explicit routes in the config (Task 1) and move the template's route folder to match.
| `lib/content/internal/lexical.ts` | Portable Text → Lexical converter, and the Lexical → Portable Text render adapter |
| `scripts/payload-import/*.ts` | The import: assets, documents, drafts, verification |
| `payload-types.ts` | Generated; committed |

---

### Task 1: Install Payload and its database

**Files:**
- Modify: `package.json`, `next.config.mjs`, `tsconfig.json`, `.env` / `.env.local`
- Create: `payload.config.ts`, `app/(payload)/**` (from the blank template)
- Test: `lib/__tests__/payload-config.test.ts`

**Interfaces:**
- Produces: an importable `@payload-config`, and `getPayload({ config })` returning a working instance against an empty database. Every later task depends on this.

**The database is a decision, not a detail.** Create a **new database inside the existing Neon project** — not a new project, and not Prisma's database. On Neon, databases on a branch share one compute endpoint, so this costs nothing extra and is covered by the same branch backup, while remaining immune to `prisma migrate reset`. Put its URL in a new env var `PAYLOAD_DATABASE_URL`; do **not** reuse `DATABASE_URL`.

- [ ] **Step 1: Install**

```bash
pnpm add payload@3.88.0 @payloadcms/next@3.88.0 @payloadcms/db-postgres@3.88.0 \
  @payloadcms/richtext-lexical@3.88.0 @payloadcms/storage-r2@3.88.0 graphql
```

`sharp` is already a dependency. Verify all `@payloadcms/*` resolve to exactly 3.88.0: `pnpm list --depth 0 | grep payload`.

- [ ] **Step 2: Write the failing test**

Create `lib/__tests__/payload-config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import config from "@payload-config";

describe("payload config", () => {
  it("declares the four locales with Arabic marked RTL", async () => {
    const c = await config;
    const codes = c.localization ? c.localization.locales.map((l) => (typeof l === "string" ? l : l.code)) : [];
    expect(codes).toEqual(["en", "es", "fr", "ar"]);
    expect(c.localization && c.localization.defaultLocale).toBe("en");
    const ar = c.localization && c.localization.locales.find((l) => typeof l !== "string" && l.code === "ar");
    expect(ar && (ar as { rtl?: boolean }).rtl).toBe(true);
  });

  it("does not pin idType to uuid — 310 Sanity ids are slug-like", async () => {
    const c = await config;
    expect(JSON.stringify(c.db ?? {})).not.toContain("uuid");
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `pnpm exec vitest run lib/__tests__/payload-config.test.ts`
Expected: FAIL — cannot resolve `@payload-config`.

- [ ] **Step 4: Write the config**

Create `payload.config.ts` at the repo root:

```ts
import path from "path";
import { fileURLToPath } from "url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import sharp from "sharp";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default buildConfig({
  admin: { importMap: { baseDir: path.resolve(dirname) } },
  // The REST API must not mount at /api — this app already has 71 route
  // files under app/api/, and Payload's default catch-all would answer every
  // unmatched /api/* path with a Payload error instead of a 404.
  // /admin is free: Sanity's Studio lives at /studio.
  routes: { api: "/payload-api", admin: "/admin" },
  // Deliberately NOT idType: "uuid" — 310 of 446 Sanity ids are slug-like
  // (`tag-farmers`, `regional-community-page-oceania`), and uuid would reject
  // every one. Each collection declares its own custom text id field instead.
  db: postgresAdapter({
    pool: { connectionString: process.env.PAYLOAD_DATABASE_URL || "" },
  }),
  editor: lexicalEditor(),
  collections: [],
  globals: [],
  localization: {
    locales: [
      { label: "English", code: "en" },
      { label: "Español", code: "es" },
      { label: "Français", code: "fr" },
      { label: "العربية", code: "ar", rtl: true },
    ],
    defaultLocale: "en",
    fallback: true,
  },
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: { outputFile: path.resolve(dirname, "payload-types.ts") },
  sharp,
});
```

Add to `tsconfig.json` `compilerOptions.paths`: `"@payload-config": ["./payload.config.ts"]`.

Wrap `next.config.mjs`'s export: `import { withPayload } from "@payloadcms/next/withPayload"` and `export default withPayload(nextConfig)` — applied **outside** the existing `withNextIntl(...)` wrapper.

- [ ] **Step 5: Add the route group**

Copy `app/(payload)/**` from Payload's blank template at the matching version:
`https://github.com/payloadcms/payload/tree/v3.88.0/templates/blank/src/app/(payload)`.
Do not hand-write these files; they are generated glue.

**Then rename the template's API folder to match `routes.api`.** The template ships
`app/(payload)/api/[...slug]/route.ts`, resolving to `/api/[...slug]` — which collides with
this app's 71 existing `/api/*` routes. Move it (and the GraphQL routes beside it) to
`app/(payload)/payload-api/…` so it resolves to `/payload-api/*`.

**Verify before moving on:**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/nonexistent-path
```
The first must return its existing status; the second must be a **404 from Next**, not a
Payload error body. If Payload answers unmatched `/api/*` paths, the move did not take.

- [ ] **Step 6: Run the test**

Run: `pnpm exec vitest run lib/__tests__/payload-config.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 7: Prove it connects**

```bash
PAYLOAD_DATABASE_URL=... pnpm exec payload migrate:status
```
Expected: it connects and reports no migrations. **If it errors, stop** — every later task builds on this connection.

- [ ] **Step 8: Verify the existing app is unharmed**

```bash
pnpm typecheck
pnpm exec vitest run
```

Then start `pnpm dev` and spot-check three existing API routes still answer — `/api/health`,
`/api/communities`, `/api/maps/region-pins`. There are 71 of them and they are the app's
backend; a route collision breaks them at runtime while `typecheck` and the unit suite stay
green.

Expected: clean, and **1087 tests still passing plus your 2** — the `withPayload` wrapper and a new route group must not disturb the running site.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.mjs tsconfig.json payload.config.ts "app/(payload)" lib/__tests__/payload-config.test.ts
git commit -m "feat(payload): install Payload 3.88 against its own Neon database

Separate database inside the existing Neon project, never Prisma's —
prisma migrate reset drops the schema it manages, which would put 476
content documents one dev reset from deletion.

No idType: uuid. 310 of 446 Sanity ids are slug-like, not UUIDs; each
collection will declare a custom text id field so the import can
preserve every _id verbatim."
```

---

### Task 2: Clerk authentication and access control

**Files:**
- Create: `payload/auth/clerk-strategy.ts`, `payload/collections/users.ts`, `payload/access/index.ts`
- Modify: `payload.config.ts`
- Test: `lib/__tests__/payload-access.test.ts`

**Interfaces:**
- Consumes: Task 1's config.
- Produces: `isAdmin`, `isEditor`, `isAnyone`, `publishedOnly` access functions; a `users` collection with `disableLocalStrategy: true`.

**Clerk remains the sole identity system (D4).** Nobody signs up in Payload. The `users` collection exists so Payload has something to attach a session to; it is populated from Clerk, not from a signup form.

- [ ] **Step 1: Write the failing test**

Create `lib/__tests__/payload-access.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isAdmin, isEditor, publishedOnly } from "@/payload/access";

const req = (role?: string) => ({ user: role ? { role } : null }) as never;

describe("payload access control", () => {
  it("admits admins to admin-only operations", () => {
    expect(isAdmin({ req: req("admin") })).toBe(true);
  });

  it("refuses editors and anonymous callers from admin-only operations", () => {
    expect(isAdmin({ req: req("team_editor") })).toBe(false);
    expect(isAdmin({ req: req() })).toBe(false);
  });

  it("admits admins and team editors to editor operations", () => {
    expect(isEditor({ req: req("admin") })).toBe(true);
    expect(isEditor({ req: req("team_editor") })).toBe(true);
  });

  it("refuses community roles from CMS editing", () => {
    // community_editor is community-scoped, not a CMS role. Verify that
    // reading before shipping — if it should have Studio-equivalent access,
    // this test is what has to change, deliberately.
    expect(isEditor({ req: req("community_editor") })).toBe(false);
    expect(isEditor({ req: req("community_member") })).toBe(false);
  });

  it("returns a published-only constraint for anonymous reads, true for editors", () => {
    expect(publishedOnly({ req: req("team_editor") })).toBe(true);
    expect(publishedOnly({ req: req() })).toEqual({ _status: { equals: "published" } });
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `pnpm exec vitest run lib/__tests__/payload-access.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the access functions**

Create `payload/access/index.ts`:

```ts
import type { Access } from "payload";

/**
 * Roles come from Prisma's `User.role` enum — community_member,
 * community_editor, team_editor, admin — NOT from the Clerk session claim.
 * `lib/authz.ts` records why: the two vocabularies diverge, and
 * `utils/roles.ts`'s checkRole() "is for existing session-gated UI only and
 * must not back new authz".
 */
type WithRole = { role?: string | null } | null | undefined;

export const isAdmin: Access = ({ req }) => (req.user as WithRole)?.role === "admin";

export const isEditor: Access = ({ req }) => {
  const role = (req.user as WithRole)?.role;
  return role === "admin" || role === "team_editor";
};

export const isAnyone: Access = () => true;

/**
 * Anonymous callers see only published documents; editors see everything.
 *
 * This is the app-layer half of the fix for the exposure recorded in the
 * spec's §1 — non-approved case studies and reviewer notes were readable
 * anonymously because Sanity's ACL is dataset-wide. Payload's access control
 * is per-collection and enforced server-side, so it does not depend on a
 * dataset setting anyone can change in a web UI.
 */
export const publishedOnly: Access = ({ req }) => {
  if (isEditor({ req } as never)) return true;
  return { _status: { equals: "published" } };
};
```

- [ ] **Step 4: Run the test**

Run: `pnpm exec vitest run lib/__tests__/payload-access.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the Clerk strategy and users collection**

Create `payload/auth/clerk-strategy.ts`. It reads the Clerk session from the incoming request headers and maps the Clerk user onto a Payload user. Use `@clerk/backend`'s `verifyToken` or `authenticateRequest` — **read the installed version's API rather than assuming**; `@clerk/backend` is already a dependency at `^2.22.0`.

```ts
import type { AuthStrategy } from "payload";

/**
 * Clerk is the sole identity system (spec D4). Nobody signs up in Payload —
 * this strategy maps an existing Clerk session onto a Payload user so the
 * admin panel has something to authorise against.
 *
 * Returning `{ user: null }` denies access; it must never throw, or a failed
 * Clerk call becomes a 500 on every admin request.
 */
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Clerk is the sole identity system (spec D4). Nobody signs up in Payload —
 * this maps an existing Clerk session onto a Payload user so the admin panel
 * has something to authorise against.
 *
 * Mirrors `getActor()` in lib/authz.ts deliberately, including its two
 * hard-won details:
 *   1. `auth()` THROWS outside a clerkMiddleware request context. Catch it and
 *      read that as anonymous — an uncaught throw becomes a 500 on every
 *      admin request.
 *   2. The role comes from Prisma's `User.role`, not the Clerk session claim.
 *      The vocabularies diverge and utils/roles.ts must not back new authz.
 */
export const clerkStrategy: AuthStrategy = {
  name: "clerk",
  authenticate: async ({ payload }) => {
    let userId: string | null = null;
    try {
      ({ userId } = await auth());
    } catch {
      return { user: null };
    }
    if (!userId) return { user: null };

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true, name: true },
    });
    if (!actor) return { user: null };

    // Mirror into Payload's users collection so relationships and the admin
    // UI have a real document to point at. Keyed on the Clerk id, so this is
    // idempotent across sessions.
    const existing = await payload.find({
      collection: "users",
      where: { clerkId: { equals: actor.id } },
      limit: 1,
      overrideAccess: true,
    });

    const doc =
      existing.docs[0] ??
      (await payload.create({
        collection: "users",
        data: { clerkId: actor.id, role: actor.role, email: actor.email, name: actor.name },
        overrideAccess: true,
      }));

    // Prisma is the source of truth for role — refresh it on every request so
    // a revoked role takes effect immediately rather than at next signup.
    return { user: { collection: "users", ...doc, role: actor.role } };
  },
};
```

**Add three tests for this**: no Clerk session yields `{ user: null }`; an `auth()` that throws yields `{ user: null }` rather than propagating; and a signed-in user with no Prisma row yields `{ user: null }` rather than a partially-formed user.

Create `payload/collections/users.ts` with `auth: { disableLocalStrategy: true, strategies: [clerkStrategy] }`, a `role` select field whose options are exactly Prisma's enum — `community_member`, `community_editor`, `team_editor`, `admin` — and a unique `clerkId` text field.

- [ ] **Step 6: Verify in the running admin**

Register `Users` in `payload.config.ts`, run `pnpm dev`, and load `/admin`. Confirm a signed-in `admin` user reaches it and a signed-out request does not. **Three users already hold `team_editor`** — confirm one of them can sign in, and that a `community_member` cannot.

- [ ] **Step 7: Gates and commit**

```bash
pnpm typecheck && pnpm exec vitest run
git add payload payload.config.ts lib/__tests__/payload-access.test.ts
git commit -m "feat(payload): authenticate the admin through Clerk

Clerk stays the sole identity system: disableLocalStrategy plus a custom
strategy that maps an existing Clerk session onto a Payload user. Nobody
signs up in Payload.

Access control is per-collection and server-side, which is the app-layer
half of the fix for the anonymous-read exposure that motivated this
migration."
```

---

### Task 3: Shared field helpers and the twelve blocks

**Files:**
- Create: `payload/fields/localized.ts`, `payload/blocks/index.ts` and one file per block
- Test: `lib/__tests__/payload-blocks.test.ts`

**Interfaces:**
- Produces: `localizedText(name, opts)`, `localizedTextarea(name, opts)`, `localizedRichText(name, opts)`; and the twelve `Block` configs — `hero1`, `splitRow`, `splitContent`, `splitImage`, `cta1`, `sectionHeader`, `logoCloud1`, `gridRow`, `gridCard`, `gridAgenda`, `gridNews`, `carousel2`. Tasks 4–6 consume both.

**Payload's localization replaces both of Sanity's i18n lanes.** Sanity had two: document-level (one document per language) and field-level (`{en,es,fr,ar}` objects). Payload has one — `localized: true` on a field. Both lanes collapse onto it, which is why 36 `page` documents become 9 and 28 `regionalCommunityPage` become 7.

Build **only the twelve blocks that carry data**. The other ~28 registered Sanity block schemas were never authored into a single document (spec §6); porting them would recreate dead weight in a new system.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { blocks } from "@/payload/blocks";

describe("payload blocks", () => {
  it("defines exactly the twelve blocks that carry data", () => {
    const slugs = blocks.map((b) => b.slug).sort();
    expect(slugs).toEqual([
      "carousel2", "cta1", "gridAgenda", "gridCard", "gridNews", "gridRow",
      "hero1", "logoCloud1", "sectionHeader", "splitContent", "splitImage", "splitRow",
    ]);
  });

  it("gives every block an interfaceName so payload-types names them", () => {
    for (const b of blocks) expect(b.interfaceName).toBeTruthy();
  });
});
```

- [ ] **Step 2–4: Fail, implement, pass.** Model each block's fields on the Sanity schema in `sanity/schemas/blocks/`, which is still on disk. Read the real schema rather than inventing fields — and check the **stored data** too, since Sanity schemas contain fields no document uses.

- [ ] **Step 5: Commit.**

---

### Task 4: Taxonomy collections

**Files:** `payload/collections/{tags,work-types,expertise-areas,authors,organizations,regional-communities}.ts`; test `lib/__tests__/payload-taxonomy-collections.test.ts`

**Interfaces:** Produces six collections whose slugs are `tags`, `workTypes`, `expertiseAreas`, `authors`, `organizations`, `regionalCommunities`.

Live counts: 67 tags, 6 work types, 5 expertise areas, 95 authors, 24 organizations, 7 regional communities.

**Every collection in Tasks 4–7 must declare the custom text id field:**

```ts
{
  name: "id",
  type: "text",
  required: true,
  admin: { hidden: true },
  // Sanity's _id, preserved verbatim so the import is idempotent and the
  // handful of Prisma rows referencing content ids keep working.
}
```

`authors` carries one cross-system tie: Prisma's `User.sanityPersonId` references an author id. **Keep those ids exactly**; Phase 3's `getAuthorBySanityId` depends on it.

- [ ] Steps: failing test asserting the six slugs exist and each declares a text `id` field → implement → pass → `payload migrate:create` → commit.

---

### Task 5: Content collections

**Files:** `payload/collections/{case-studies,lived-experiences,research-outputs,agendas,news-posts,docs-chapters,testimonials,profile-prompts,external-sources,case-study-drafts}.ts`; test `lib/__tests__/payload-content-collections.test.ts`

Live counts: 27 case studies, 35 lived experiences, 29 research outputs, 29 agendas, 4 news posts, 12 docs chapters, 20 testimonials, 3 profile prompts, 1 external source, 1 case-study draft.

**Three things matter here beyond field mapping:**

1. **`versions: { drafts: true }` on every collection that has Sanity drafts.** The complete live census — verified against `production_2`, 30 content drafts in total:

   | Collection | Drafts | Kind | Owned by |
   |---|---|---|---|
   | `livedExperience` | 21 | edits of published | Task 5 |
   | `author` | 4 | 3 edits + **1 never published** | Task 4 (done) |
   | `caseStudy` | 1 | edit | Task 5 |
   | `newsPost` | 1 | edit | Task 5 |
   | `regionalCommunityPage` | 1 | edit | Task 6 |
   | `tag` | 1 | **never published** | Task 4 (done) |
   | `testimonial` | 1 | **never published** | Task 5 |

   An earlier version of this line listed only the "edit of published" drafts and omitted `tag` and `testimonial` entirely. Task 4's implementer found the stray `tag` draft itself and enabled versions on `tags` and `authors` accordingly — but **`testimonials` is yours**, and a collection without `versions.drafts` forces Task 13 either to discard that draft or publish an incomplete record.
2. **The moderation field must be named `moderationStatus`, not `status`** — this was discovered the hard way and is not optional.

   Sanity's editorial review state (`pending` / `rejected` / `revision` / `approved`) is a different thing from Payload's `_status` publish state, and both must exist. But a Payload field literally named `status` **collides with `_status` at the Postgres enum-type level** once `versions.drafts` is enabled. Task 5's first migration attempt failed with:

   ```
   invalid input value for enum enum_case_studies_status: "pending"
   ```

   Renamed to `moderationStatus` on `caseStudies`, `livedExperiences` and `researchOutputs`.

   **This is a general trap**: any future Payload collection that pairs `versions.drafts` with a field named `status` will hit it.

   **And it creates an obligation for Phase 3.** `lib/content/case-studies.ts` exposes `status?: CaseStudyStatus` and `getCaseStudiesByStatus(status)` as its public contract — the shape Phase 3 must keep serving. So the Payload-backed implementation has to map `moderationStatus` (storage) onto `status` (the content layer's public shape). Task 12's importer must write Sanity's `status` into `moderationStatus`.
3. **Rich text fields use `lexicalEditor()`** and are typed as Lexical, not Portable Text. Task 9 produces the conversion.

- [ ] Steps: failing test → implement → pass → migration → commit.

---

### Task 6: Page collections and globals

**Files:** `payload/collections/{pages,regional-community-pages}.ts`, `payload/globals/{homepage,onboarding-content,site-announcement,moderation-settings,hub-illustrations}.ts`; test `lib/__tests__/payload-pages.test.ts`

**This is where the remodel happens (D9), and it is the one place this phase deliberately does not preserve the Sanity shape.**

- **`pages`**: a `blocks` field over the twelve blocks. 9 documents (from 36), localized.
- **`regionalCommunityPage`**: the six near-identical grid slots — `agendasGrid`, `caseStudiesGrid`, `newsGrid`, `livedExperiencesCarousel`, `teamGrid`, `testimonialsBlock` — collapse into **one parameterised `contentGrid` block** repeated in a blocks array. They currently repeat the same ~15 fields (`mode`, `gridColumns`, `maxItems`, `initialDisplayCount`, `showTitle`/`title`/`subtitle`, `showDescription`/`description`, `headerImage`, `manualItems`). Drop the six `divider_*` fields (Studio-only spacers rendering `input: () => null`) and `useTemplate` (true on all 28 documents, so its false branch is dead).
- **`homepage` global**: a `blocks` array. The import runs `blocksFromFields` from `lib/homepage/blocks-from-fields.ts` — already written and unit-tested, never executed — to turn the 11 fixed slots into an ordered array.

**A defect the import must handle:** `regionalCommunityPage.whyJoinCTA` is declared `hero-1` in Sanity but every document stores `_type: "cta-1"`. The stored field set is hero-1's (`image` in 24 of 28, `imagePosition` in 20), which is why the declaration was left alone in Phase 0. **The importer maps it onto the `hero1` block** and ignores the stored `_type`. Spec §7.1 records this.

- [ ] Steps: failing test asserting `pages` has a blocks field, `regionalCommunityPage` has no `divider_*` or `useTemplate` fields, and `homepage` is a global with `blocks` → implement → pass → migration → commit.

---

### Task 7: The empty-but-wired collections

**Files:** `payload/collections/{events,projects}.ts`

`event` and `project` hold **zero documents** but have live submission and moderation code (17 and 7 references). The spec (§9) carries them across in full so launching needs no second migration. Build them; import nothing.

- [ ] Steps: failing test → implement → pass → commit.

---

### Task 8: Uploads on R2

**Files:** `payload/collections/{media,files}.ts`; modify `payload.config.ts`; test `lib/__tests__/payload-uploads.test.ts`

**Interfaces:** Produces `media` (images) and `files` (PDFs and documents) upload collections, stored on Cloudflare R2 via `@payloadcms/storage-r2`.

R2 is already in use (`lib/r2.ts`), so credentials exist. 347 images (223 MB) and 48 files (395 MB) will land here in Task 11.

`media` needs `imageSizes` covering what the site actually requests. Phase 1's `imageUrl()` in `lib/content/images.ts` is the authority on which transforms are used — read it. Two behaviours there are load-bearing and must survive into Payload's sizing: **SVGs bypass transforms entirely** (they rasterize otherwise), and the cropped path uses `auto("format")` while the uncropped path forces `webp`.

- [ ] Steps: failing test asserting both collections declare `upload` and that `media` restricts `mimeTypes` to images → implement → configure `r2Storage` in the config → pass → commit.

---

### Task 9: Portable Text → Lexical

**Files:** Create `lib/content/internal/lexical.ts`; test `lib/__tests__/lexical-converter.test.ts`

**Interfaces:** Produces `portableTextToLexical(blocks: unknown[]): SerializedEditorState`.

**The whole conversion surface, measured across every Portable Text field in the dataset:**

| | |
|---|---|
| Node types | `block`, `image`, `youtube` |
| Styles | `normal`, `h1`, `h2`, `h3`, `h4`, `blockquote` |
| Custom marks | `link`, `footnote` |

Plus five registered-but-unauthored embeds the spec chose to port: `break`, `info-box`, `story-timeline`, `story-chart`, `story-mermaid`. They have **no content to verify against**, so they are covered by unit tests and by authoring one of each in the admin — not by comparison against migrated documents.

- [ ] **Step 1: Establish the target shapes empirically — do not write Lexical JSON from documentation.**

In the running admin, create one throwaway document containing: a paragraph with bold/italic/link text, an h2, a blockquote, a bulleted list, and one embedded block. Then read the stored JSON back:

```bash
psql "$PAYLOAD_DATABASE_URL" -c "select <richtext column> from <table> limit 1;"
```

Record the exact node shapes — including the `format` bitmask values for bold/italic and the shape Payload uses for an embedded block — in your report. **These shapes are the specification for the converter.** Payload's docs describe the structure loosely; the database is the ground truth, and a converter written against a guess produces documents the editor cannot open.

- [ ] **Step 2–5:** failing test → converter → pass → commit. Test against **real fixtures**: pull three genuine Portable Text bodies from Sanity (a case study, a lived experience, a docs chapter) and assert the converted output round-trips through the adapter in Task 10 to the same rendered text.

---

### Task 10: The Lexical → Portable Text render adapter

**Files:** Create `lib/content/internal/lexical-to-portable-text.ts`; test `lib/__tests__/lexical-adapter.test.ts`

**Interfaces:** Produces `lexicalToPortableText(state: unknown): unknown[]`.

**This is what keeps Phase 3 from becoming a 36-file rendering rewrite (D7).** Thirty-six files render Portable Text through `@portabletext/react`. Rather than rewriting them all during the backend swap — where a rendering bug and a data bug look identical — Phase 3 feeds them Lexical converted back to Portable Text. Phase 4 removes the adapter and moves the renderers to Lexical natively.

The property that matters: **`lexicalToPortableText(portableTextToLexical(x))` must render identically to `x`.** Not byte-identical JSON — identical rendered output. Test it that way, against real fixtures.

- [ ] Steps: failing round-trip test → implement → pass → commit.

---

### Task 11: Import the assets

**Files:** Create `scripts/payload-import/assets.ts`, `scripts/payload-import/lib/sanity-export.ts`; test `lib/__tests__/payload-import-assets.test.ts`

**Interfaces:** Produces `importAssets(): Promise<Map<string, string>>` — a map from Sanity asset `_id` to the created Payload upload id. Task 12 needs it to rewrite image and file references.

Source the assets from the **Phase 0 archive** (`backups/sanity-production_2-*.tar.gz`, 634 MB, checksummed in `docs/migration/sanity-archive-manifest.json`) rather than re-downloading from Sanity. It is already verified, and it means the import does not depend on Sanity's API being up.

**Idempotency:** before creating an upload, look for an existing one with the same source asset id. Store that id on the upload document (`sanityAssetId`, unique) — that is what makes a re-run a no-op instead of a duplicate.

- [ ] Steps: failing test on the id-mapping and skip-if-exists logic → implement → run against the real archive → verify 347 + 48 uploads exist and byte sizes match the manifest → commit.

---

### Task 12: Import the documents

**Files:** Create `scripts/payload-import/documents.ts`, `scripts/payload-import/lib/transform.ts`; test `lib/__tests__/payload-import-documents.test.ts`

**Interfaces:** Consumes Task 11's asset map. Produces `importDocuments(): Promise<ImportSummary>` where `ImportSummary = { created: number; updated: number; skipped: number; byType: Record<string, number> }`.

**Four properties this script must have:**

1. **ID-preserving.** Every document keeps its Sanity `_id` as its Payload id. This is what makes the run idempotent and keeps Prisma's 8 cross-system references valid.
2. **Idempotent.** Re-running produces the same database — upsert by id, never blind-create.
3. **Reference-order aware.** Import in dependency order: taxonomy → authors/organizations → content → pages. A reference to a not-yet-imported document must fail loudly, not silently write null.
4. **Locale-collapsing.** The four `page` documents sharing a slug become one document with four locales. **Group by slug, not by `translation.metadata`** — only 1 of 9 page groups has that metadata, and it links 2 of 4 languages. Slug grouping is complete: all 9 page slugs and all 7 region slugs have a full `ar/en/es/fr` set.

Write localized fields by calling `payload.update` once per locale after the initial create, or by passing `locale` per call — **verify which the installed version supports before building on it**.

**Five obligations carried into this task from earlier reviews** (each one measured, not guessed):

1. **Sanity's `status` is written into `moderationStatus`.** The field could not keep the name `status` — it collides with Payload's `_status` enum. `lib/content/case-studies.ts` still exposes `status?: CaseStudyStatus` publicly, so the *reader* maps back the other way.
2. **`image.alt` stays `localized`; the importer writes the bare Sanity string into the `en` locale.** Real Sanity data stores a plain string, not an `{en,…}` lane. Payload's `fallback: true` then covers `es`/`fr`/`ar`. An importer that assumes the localized lane writes null.
3. **Coerce empty strings to null.** The single `caseStudyDraft` holds `studyPeriod: {startDate: "", endDate: ""}` and `studyLocation: {}` against `date` and `point` fields. Empty string is not a date.
4. **`livedExperience.region` is a `regionalCommunity` reference, not a region code** — 42/56 populated, 42 references, 0 strings, every one dereferencing to `_type: "regionalCommunity"`. The schema's declared fixed-7 code is fiction. `relatedCommunity` is 0/56.
5. **`livedExperience.videoUrl` is 56/56 populated and undeclared in the Sanity schema**, and read by five `lib/content/*.ts` modules. It must be carried across or five modules break.

- [ ] Steps: failing tests for id preservation, idempotency (run twice, assert `created` then `updated`), and slug-grouping → implement → dry-run → real run → commit.

---

### Task 13: Import the drafts, and verify the whole thing

**Files:** Create `scripts/payload-import/drafts.ts`, `scripts/payload-import/verify.ts`; test `lib/__tests__/payload-import-verify.test.ts`

**Interfaces:** Produces `importDrafts()` and `verifyImport(): Promise<VerificationReport>`.

**Drafts are not documents.** Sanity's 30 `drafts.*` records are unpublished edits, 27 of which have a published counterpart. They import as Payload **draft versions**: publish the `_id` document first, then apply the `drafts.<id>` content as a draft version on top (`payload.update({ ..., draft: true })`). The three never-published ones (`author`, `tag`, `testimonial`) import directly as `_status: 'draft'`.

The 21 lived-experience drafts are in-flight moderation work. **Losing them is the single most damaging thing this phase could do**, and it would be invisible — the published documents would all look fine.

**`verifyImport` must check, and fail loudly on any mismatch:**
- Per-type document counts against `docs/migration/sanity-archive-manifest.json`
- Every Sanity `_id` present as a Payload id
- All four locales populated on every localized document that had them in Sanity
- 30 draft versions present
- Every image and file reference resolves to a real upload
- No rich-text field is empty where Sanity had content

- [ ] Steps: failing verification tests → implement → run the complete import end-to-end against an empty database → `verifyImport` green → commit.

---

## Phase 2 exit criteria

- [ ] `pnpm typecheck` clean; full suite green (1087 baseline plus this phase's tests)
- [ ] `/admin` loads and a Clerk `team_editor` can sign in and edit a case study
- [ ] `verifyImport` passes against the manifest: 438 published documents, 30 draft versions, 395 assets
- [ ] The import is idempotent — running it twice yields `created: 0`
- [ ] **The public site is byte-identical and still served entirely by Sanity.** Nothing in `app/`, `components/` or `lib/content/`'s domain modules changed in this phase
- [ ] `payload-types.ts` generated and committed

## Phase 3 prerequisites this phase must leave in place

Two things Phase 3 needs that Phase 2 does not itself require. Both are recorded here so
they are scheduled rather than discovered.

**1. A production Payload database does not exist yet.** Phase 2 builds and imports against
`payload_cms` on the **dev** Neon branch, which is right — the import is re-run many times
while the schema settles, and it must not touch anything production depends on. Before Phase
3 can swap a single domain module, a production Payload database is needed:

- Create a second database — also inside the existing Neon project, also **not** Prisma's —
  on the production branch.
- Set `PAYLOAD_DATABASE_URL` for the production environment (Vercel), leaving the dev value
  in `.env.local`.
- Run the committed migrations against it, then the import, then `verifyImport`.
- The import is idempotent by design (Task 12), so this is a re-run rather than new work.

Do **not** create it during Phase 2. An empty production database that drifts from the dev
schema for weeks is worse than no database at all.

**2. A Sanity request timeout is unset, and that is a live exposure.** `sanity/lib/client.ts`
configures no `timeout`, and `@sanity/client` supports `timeout?: number`. A hung upstream
therefore blocks server rendering with no ceiling. The 2026-07-28 quota outage took every
content page down; a timeout would have turned that into fast, degraded responses via the
content layer's `safe()` wrappers instead.

This is a **behaviour change**, so it does not belong in Phase 2, whose whole premise is that
nothing user-facing changes. It belongs in its own reviewable commit — either before Phase 3
or alongside it, but deliberately, not folded into a refactor.

## What Phase 3 inherits

A populated Payload with the same document ids as Sanity, and `lib/content/internal/sanity-source.ts` gaining a `payload-source.ts` sibling. The domain modules' tests become the contract both backends must satisfy.

**Carry these forward into Phase 3's brief — each cost a real bug in Phase 1:**
- `query` and `queryPreviewable` differ **only inside draft mode**. Someone will try to merge them.
- A read feeding a write must not be cached. Use the live primitive for read-client originals, the raw one only for write-client originals — conflating those introduced an authorization bypass.
- `ContentTag.value` is typed `string` but holds `{_type:"slug",current:…}` at runtime wherever a projection binds bare `value`. Fix the type when Payload models it; do not carry the lie forward.
