import type { CollaborationRole, CollaborationVisibility } from "@/generated/prisma";
import type { Actor } from "@/lib/authz-core";

/**
 * Collaboration-scoped authorization. Pure logic (no server deps) so it is
 * unit-testable. Gated on the MEMBERSHIP role, not the global role.
 *
 * Precedence rule: a global staff actor (team_editor | admin) may MODERATE
 * (remove content) and ARCHIVE a collaboration, but is NOT an implicit member —
 * they cannot read MEMBERS-visibility files or post as a member without joining.
 */

export type CollabAction =
  | "collab:read" // view the workspace
  | "collab:readFiles" // read MEMBERS-visibility files
  | "collab:comment" // post in threads
  | "collab:annotate" // annotate PDFs
  | "collab:upload" // upload files / add media
  | "collab:editThread" // create/rename threads
  | "collab:editPlan" // edit the research plan: stages/tasks (kanban)
  | "collab:editDoc" // create/edit/delete workspace documents
  | "collab:editOutputs" // link/create/remove the workspace's hub outputs
  | "collab:manageMembers" // invite/remove/change roles
  | "collab:archive" // archive/delete the workspace
  | "collab:moderate"; // staff: remove content

export type CollabContext = {
  /** The viewer's membership role, or null if not a member. */
  membershipRole: CollaborationRole | null;
  visibility: CollaborationVisibility;
  /** Whether the actor is global staff (team_editor | admin). */
  isStaff: boolean;
};

const RANK: Record<CollaborationRole, number> = {
  VIEWER: 0,
  COMMENTER: 1,
  EDITOR: 2,
  OWNER: 3,
};

function atLeast(role: CollaborationRole | null, min: CollaborationRole): boolean {
  return role !== null && RANK[role] >= RANK[min];
}

export function canInCollab(action: CollabAction, ctx: CollabContext): boolean {
  const { membershipRole, visibility, isStaff } = ctx;
  const isMember = membershipRole !== null;

  switch (action) {
    case "collab:read":
      // PUBLIC workspaces are readable by anyone; MEMBERS by members (or staff).
      return visibility === "PUBLIC" || isMember || isStaff;

    case "collab:readFiles":
      // MEMBERS files require actual membership — staff are NOT auto-granted.
      if (visibility === "PUBLIC") return true;
      return isMember;

    case "collab:comment":
      return atLeast(membershipRole, "COMMENTER");

    case "collab:annotate":
      return atLeast(membershipRole, "COMMENTER");

    case "collab:upload":
    case "collab:editThread":
    case "collab:editPlan":
    case "collab:editDoc":
    case "collab:editOutputs":
      return atLeast(membershipRole, "EDITOR");

    case "collab:manageMembers":
      return atLeast(membershipRole, "OWNER");

    case "collab:archive":
      // Owners, or global staff (moderation precedence).
      return atLeast(membershipRole, "OWNER") || isStaff;

    case "collab:moderate":
      return isStaff;

    default:
      return false;
  }
}

/** Build the context from an actor + their membership + the workspace. */
export function collabContext(
  actor: Actor,
  membershipRole: CollaborationRole | null,
  visibility: CollaborationVisibility,
  isStaff: boolean
): CollabContext {
  void actor;
  return { membershipRole, visibility, isStaff };
}
