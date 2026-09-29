/**
 * Community leads (editor-experience spec §3.5): a Prisma `community_editor`
 * listed in a regional community's `leadIds` may edit and publish that
 * community — and nothing else. These functions are the server-side gate;
 * hiding admin menu entries is convenience only.
 *
 * Pure (no Payload runtime imports), so tests and the admin config can use it.
 */
import type { Access, FieldAccess } from "payload";

type U = { role?: string | null; clerkId?: string | null } | null | undefined;
const role = (user: unknown) => (user as U)?.role ?? null;
const isStaffUser = (user: unknown) => role(user) === "admin" || role(user) === "team_editor";

export const isLead = (user: unknown): boolean => role(user) === "community_editor";

/** Who may sign into /admin at all: staff and community leads. */
export const mayUseAdmin = (user: unknown): boolean => isStaffUser(user) || isLead(user);

/** The lead's user id (Clerk id = Prisma id), or null when not a lead. */
export function leadOf(user: unknown): string | null {
  const id = (user as U)?.clerkId;
  return isLead(user) && typeof id === "string" && id.length > 0 ? id : null;
}

const published = { _status: { equals: "published" } };

export const communityRead: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  const id = leadOf(req.user);
  return id ? { or: [published, { leadIds: { in: [id] } }] } : published;
};

export const communityUpdate: Access = ({ req }) => {
  if (isStaffUser(req.user)) return true;
  const id = leadOf(req.user);
  return id ? { leadIds: { in: [id] } } : false;
};

/** Boolean on purpose — a field access returning a Where is truthy and silently opens the field. */
export const staffOnlyField: FieldAccess = ({ req }) => isStaffUser(req.user);

/** The role someone should have given how many communities they lead. Never touches staff. */
export function nextRole(current: string, leadsCount: number): string {
  if (current === "admin" || current === "team_editor") return current;
  return leadsCount > 0 ? "community_editor" : "community_member";
}

/** A lead sees only their community (and media) in the admin menu. */
export function hideFromLeads<T extends { admin?: { hidden?: unknown } }>(c: T): T {
  const prev = c.admin?.hidden;
  const hidden = (args: { user: unknown }) =>
    isLead(args.user) || (typeof prev === "function" ? Boolean((prev as (a: { user: unknown }) => unknown)(args)) : Boolean(prev));
  return { ...c, admin: { ...c.admin, hidden } };
}
