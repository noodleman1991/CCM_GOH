import type { Access } from "payload";

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
