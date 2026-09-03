import type { Access, Where } from "payload";

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
 * The `moderationStatus: { exists: false }` arm matters for
 * `livedExperiences` specifically: the field is 0/56 populated in real data,
 * and the live Sanity app already treats an unset value as approved
 * (`status == "approved" || !defined(status)`, `lib/content/
 * lived-experiences.ts`) — without this arm, every real lived experience
 * would become anonymously unreadable, not just the unapproved ones.
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
 * For `researchOutputs`: no `versions.drafts` (no `_status` field exists at
 * all on this collection — every document is simply live), so only the
 * `moderationStatus` gate applies. Mirrors the same fallback
 * `publishedAndApproved` uses (real data is 29/29 "approved" today, but an
 * unset value is treated the same way for consistency, not stricter).
 */
export const moderationApprovedOnly: Access = (args) => {
  if (isEditor(args)) return true;
  const where: Where = {
    or: [{ moderationStatus: { equals: "approved" } }, { moderationStatus: { exists: false } }],
  };
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
