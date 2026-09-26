import type { Role } from "@/generated/prisma";

/**
 * Pure authorization logic — no server-only dependencies, so it is unit-testable.
 * The server-bound `getActor()` lives in `./authz` and re-exports this module.
 *
 * authz reads the Prisma `User.role` enum
 * (`community_member | community_editor | team_editor | admin`), NOT the Clerk
 * session claim in `utils/roles.ts`.
 */

export type Actor = {
  /** Clerk user id, which is also the Prisma User.id. */
  id: string;
  role: Role;
} | null;

/** Global capabilities gated on the Prisma role. */
export type GlobalAction =
  | "comment:create"
  | "comment:remove"
  | "comment:approve"
  | "moderation:view"
  | "report:resolve";

/** Roles allowed to moderate / act as staff. */
const STAFF_ROLES: ReadonlySet<Role> = new Set<Role>(["team_editor", "admin"]);

/** A typed 403. Throw from server actions / route handlers; map to a response. */
export class ForbiddenError extends Error {
  readonly status = 403 as const;
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Is this actor global staff (team_editor | admin)? */
export function isStaff(actor: Actor): boolean {
  return !!actor && STAFF_ROLES.has(actor.role);
}

/**
 * Whether `actor` may perform a GLOBAL action. Collaboration-scoped actions are
 * gated separately by membership role — a global admin can moderate/remove/
 * archive but is NOT an implicit member and cannot read MEMBERS-visibility files
 * without joining.
 */
export function can(actor: Actor, action: GlobalAction): boolean {
  switch (action) {
    case "comment:create":
      // Anyone (incl. anonymous) may attempt to create; the comment pipeline
      // decides moderation/hold. Authorization here is just "not blocked".
      return true;
    case "comment:remove":
    case "comment:approve":
    case "moderation:view":
    case "report:resolve":
      return isStaff(actor);
    default:
      return false;
  }
}

/** Throw `ForbiddenError` unless `actor` may perform `action`. */
export function assertCan(actor: Actor, action: GlobalAction): void {
  if (!can(actor, action)) {
    throw new ForbiddenError(`Not permitted: ${action}`);
  }
}
