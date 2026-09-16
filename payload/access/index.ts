import type { Access, FieldAccess, Where } from "payload";

/**
 * Roles come from Prisma's `User.role` enum — community_member,
 * community_editor, team_editor, admin — NOT from the Clerk session claim.
 * `lib/authz.ts` records why: the two vocabularies diverge, and
 * `utils/roles.ts`'s checkRole() "is for existing session-gated UI only and
 * must not back new authz".
 *
 * `community_editor` is community-scoped (Prisma `UserCommunity.role` — the
 * creator/editor of one Community) rather than a CMS-editing role. Confirmed
 * against `lib/authz-core.ts`'s `STAFF_ROLES = {team_editor, admin}` (and its
 * test asserting `isStaff(communityEditor) === false`): every existing
 * CMS-writing gate in this codebase already excludes community_editor, so
 * `isEditor` here does the same rather than widening CMS access on a guess.
 */
type WithRole = { role?: string | null } | null | undefined;
type WithRoleAndClerkId = { role?: string | null; clerkId?: string | null } | null | undefined;

/**
 * The one role predicate `isEditor` and `isEditorField` both read from, so
 * the document-level and field-level gates can never drift apart.
 *
 * Exported for `payload/auth/clerk-strategy.ts`, which decides whether a
 * signed-in Clerk user is mirrored into the `users` collection at all. That
 * decision must mean exactly what `/admin` access means — one predicate, so
 * "who gets a Payload user" and "who may use the admin" cannot diverge.
 */
export const hasEditorRole = (user: unknown): boolean => {
  const role = (user as WithRole)?.role;
  return role === "admin" || role === "team_editor";
};

export const isAdmin: Access = ({ req }) => (req.user as WithRole)?.role === "admin";

export const isEditor: Access = ({ req }) => hasEditorRole(req.user);

export const isAnyone: Access = () => true;

/**
 * For the two upload collections, `media` and `files`.
 *
 * Payload asks one `read` function two different questions. For a request to
 * `/payload-api/<slug>/file/<name>` (`payload/dist/uploads/checkFileAccess.js`)
 * it passes `isReadingStaticFile: true` and a `true` answer means "stream the
 * object, no lookup". For every other read — the REST list at
 * `/payload-api/<slug>`, `findByID`, GraphQL, and relationship population on
 * an anonymous REST read of another collection — it passes nothing extra.
 *
 * `isAnyone` answered `true` to both, which made `/payload-api/files?limit=0`
 * an anonymous index of every PDF, video and image in the CMS, including
 * assets whose parent document is hidden as pending or rejected and images
 * uploaded into private collaboration workspaces. Sanity's CDN never had a
 * listing, so this was a regression the migration introduced.
 *
 * This helper keeps the file route open (a rendered page still needs its
 * images without a session) and closes everything else to non-editors. The
 * file route stays safe because `randomizeUploadFilename`
 * (`payload/hooks/upload-filename.ts`) makes every new filename unguessable;
 * Sanity-imported assets keep their original names and are the residual
 * exposure — 395 files whose names are ordinary words, reachable by anyone
 * who can guess one.
 *
 * The site's own readers are unaffected: they use the Local API, which
 * defaults to `overrideAccess: true`.
 */
export const editorOrStaticFile: Access = ({ req, isReadingStaticFile }) =>
  isReadingStaticFile === true || hasEditorRole(req.user);

/**
 * `isEditor` at FIELD level — the gate for fields that must never leave the
 * server for an anonymous caller even on a document that is itself public.
 *
 * A separate export rather than a reuse of `isEditor` because Payload's
 * `FieldAccess` must return a plain `boolean`, while `Access` may also return
 * a `Where`; both delegate to `hasEditorRole`, so there is exactly one
 * definition of "editor" in this file. **Never pass a `Where`-returning
 * helper (`ownerOrEditor`, `publishedAndApproved`, …) as field access**:
 * `payload/dist/fields/hooks/afterRead/promise.js` only checks the result for
 * truthiness at field level, so a `Where` object would read as `true` and
 * grant the field to everyone.
 *
 * Used for internal review state, submitter identity and moderation
 * commentary — `submittedBy`, `reviewNotes`, `reviewedBy`/`reviewedAt`,
 * `notifiedStatus`, the Clerk ids/emails inside `caseStudies.authors[]`,
 * `authors.userId` and `externalSources.addedBy`/`addedAt`. Sanity never
 * exposed those to an anonymous caller (its dataset is private and no public
 * GROQ projection renders them); `/payload-api` is public by construction, so
 * without this the migration would introduce the leak rather than inherit it.
 *
 * Only `read` is gated at field level in this phase — `create`/`update` are
 * already editor-only at collection level on every collection that carries
 * one of these fields. The owner-facing reads that legitimately show a
 * submitter their own `reviewNotes` (the edit forms, the submissions
 * dashboard) run server-side, and Payload's Local API defaults to
 * `overrideAccess: true`, so they are unaffected by this gate.
 */
export const isEditorField: FieldAccess = ({ req }) => hasEditorRole(req.user);

/**
 * Anonymous callers see only published documents; editors see everything.
 *
 * This is the app-layer half of the fix for the exposure recorded in the
 * spec's §1 — non-approved case studies and reviewer notes were readable
 * anonymously because Sanity's ACL is dataset-wide. Payload's access control
 * is per-collection and enforced server-side, so it does not depend on a
 * dataset setting anyone can change in a web UI.
 *
 * Only checks Payload's own `_status` (published vs. draft). Collections
 * that ALSO carry a separate editorial `moderationStatus` field
 * (`caseStudies`, `livedExperiences`, `researchOutputs`) must NOT use this
 * alone for `read` — see `publishedAndApproved`/`moderationApprovedOnly`
 * below. `_status` and `moderationStatus` are independent: a document can be
 * `published` and `pending` at once (two real caseStudies are, in
 * production_2), and `publishedOnly` would serve those anonymously.
 */
export const publishedOnly: Access = (args) => {
  if (isEditor(args)) return true;
  return { _status: { equals: "published" } };
};

/**
 * For `caseStudies`/`livedExperiences`: anonymous callers see only documents
 * that are BOTH published (`_status`) AND approved (`moderationStatus`);
 * editors see everything. `publishedOnly` alone is not enough on these two
 * collections — `_status` (Payload's publish state) and `moderationStatus`
 * (Sanity's editorial review state, kept deliberately distinct per each
 * collection's header) are independent fields, and real data proves the gap
 * is not theoretical: `2U42vBhgRaBYxnTE6w726U` and
 * `pbVPtgVbwyH6oOhWZ3wD3a` are published caseStudies with
 * `moderationStatus: "pending"` — `publishedOnly` alone would serve them,
 * plus their `reviewNotes`/`submittedBy`, to anonymous callers of
 * `/payload-api/caseStudies`. Sanity's own frontend query
 * (`lib/content/pages.ts`) never showed them — it filters
 * `status == "approved"` — so this closes a real regression, not a
 * theoretical one.
 *
 * The `moderationStatus: { exists: false }` arm belongs to `livedExperiences`
 * ALONE: the field is 0/56 populated in real data, and the live Sanity app
 * already treats an unset value as approved (`status == "approved" ||
 * !defined(status)`, `lib/content/lived-experiences.ts:…`, `system.ts:136`,
 * `discovery.ts:608`) — without this arm, every real lived experience would
 * become anonymously unreadable, not just the unapproved ones. No other
 * collection's GROQ carries that fallback, which is why
 * `moderationApprovedOnly` below is strict.
 *
 * `caseStudies` also uses this helper and its own GROQ *is* strict
 * (`status == "approved"`, no `!defined` arm), but the loose arm cannot fire
 * there: `caseStudies.moderationStatus` is `required: true` with
 * `defaultValue: "pending"`, so no case study can exist without a value —
 * 28/28 are populated in production_2 (25 approved, 3 pending). The one
 * helper therefore matches both collections' live behaviour exactly.
 */
export const publishedAndApproved: Access = (args) => {
  if (isEditor(args)) return true;
  const moderationApproved: Where = {
    or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
  };
  const where: Where = {
    and: [{ _status: { equals: "published" } }, moderationApproved],
  };
  return where;
};

/**
 * For `events` and `researchOutputs`: neither enables `versions.drafts` (no
 * `_status` field exists on either — every document is simply live), so
 * `moderationStatus` alone is the public gate.
 *
 * **Strict — approved and nothing else.** This deliberately does NOT carry
 * `publishedAndApproved`'s `exists: false` arm, because no live GROQ filter
 * on either type carries one either. All six event filters are exactly
 * `_type == "event" && status == "approved"` (`lib/content/system.ts:144`,
 * `lib/content/discovery.ts:609`, `:723`, `:728`, `:915`, `:948`) and every
 * researchOutput filter is exactly `status == "approved"`
 * (`lib/content/system.ts:142`, `:289`, `discovery.ts:608`,
 * `outputs.ts:639`, `:647`, `:653`, `:1144`). The `!defined(status)` fallback
 * exists in this codebase for `livedExperience` only — see
 * `publishedAndApproved`. An earlier version of this helper mirrored that
 * fallback "for consistency"; that made an unset `moderationStatus`
 * anonymously readable on two collections where Sanity hides it, so it is
 * gone. Both fields carry `defaultValue: "approved"`, so a normal write is
 * unaffected; only a value-less row written around Payload is now hidden,
 * which is the same thing GROQ does.
 */
export const moderationApprovedOnly: Access = (args) => {
  if (isEditor(args)) return true;
  const where: Where = { moderationStatus: { equals: "approved" } };
  return where;
};

/**
 * For `externalSources`: its own boolean `approved` flag (Sanity's field
 * name, defaulting to `true`), not a `moderationStatus` select. Anonymous
 * callers see only `approved: true`; editors see everything. `isAnyone`
 * alone would make an unapproved source public from the moment it's
 * created.
 */
export const approvedOnly: Access = (args) => {
  if (isEditor(args)) return true;
  return { approved: { equals: true } };
};

/**
 * For `caseStudyDrafts`: private, member-owned autosave documents (see that
 * collection's header). Editors get full access; everyone else may act only
 * on their own — matched via the collection's plain `userId` field (the
 * Clerk id of the draft's owner) against `req.user.clerkId` (the signed-in
 * Payload user's own Clerk id — see `payload/collections/users.ts`).
 *
 * Returned as a `Where` clause, not a boolean: for `read`/`update`/`delete`,
 * Payload merges it into the query used to find the target document(s), so
 * a non-editor genuinely cannot touch another member's draft — the
 * ownership check runs against the PERSISTED `userId`, not whatever a caller
 * puts in the request body. For `create` (no existing document to filter
 * against), Payload's own `executeAccess` only checks truthiness of the
 * result, so any signed-in member with a `clerkId` may create a draft — they
 * set their own `userId` in the payload, matching how
 * `lib/content/case-studies.ts`'s `saveCaseStudyDraft` already works against
 * Sanity today.
 */
export const ownerOrEditor: Access = (args) => {
  if (isEditor(args)) return true;
  const clerkId = (args.req.user as WithRoleAndClerkId)?.clerkId;
  if (!clerkId) return false;
  return { userId: { equals: clerkId } };
};
