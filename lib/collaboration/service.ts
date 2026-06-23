import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import { getActor, isStaff } from "@/lib/authz";
import { canInCollab, type CollabAction } from "./authz";
import type { CollaborationRole } from "@/generated/prisma";

/** Resolve the actor's membership role in a collaboration (null if not a member). */
export async function getMembershipRole(
  collaborationId: string,
  userId: string
): Promise<CollaborationRole | null> {
  const r = await safeQuery(() =>
    prisma.collaborationMember.findUnique({
      where: { collaborationId_userId: { collaborationId, userId } },
      select: { role: true },
    })
  );
  return r.success && r.data ? r.data.role : null;
}

/**
 * Authorize a collaboration action for the current actor. Throws on failure.
 * Loads the workspace visibility + the actor's membership and applies the
 * membership/staff rules from ./authz.
 */
export async function authorizeCollab(
  collaborationId: string,
  action: CollabAction
): Promise<{ actorId: string | null; role: CollaborationRole | null }> {
  const actor = await getActor();

  const r = await safeQuery(() =>
    prisma.collaboration.findUnique({
      where: { id: collaborationId },
      select: { visibility: true },
    })
  );
  if (!r.success || !r.data) throw new Error("Collaboration not found");

  const role = actor ? await getMembershipRole(collaborationId, actor.id) : null;
  const ok = canInCollab(action, {
    membershipRole: role,
    visibility: r.data.visibility,
    isStaff: isStaff(actor),
  });
  if (!ok) throw new Error("Forbidden");
  return { actorId: actor?.id ?? null, role };
}

/** Workspaces the user can see: their memberships + PUBLIC ones. */
export async function listVisibleCollaborations(userId: string | null) {
  const r = await safeQuery(() =>
    prisma.collaboration.findMany({
      where: {
        status: { not: "ARCHIVED" },
        OR: [
          { visibility: "PUBLIC" },
          ...(userId ? [{ members: { some: { userId } } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        visibility: true,
        status: true,
        updatedAt: true,
        _count: { select: { members: true, threads: true, files: true } },
      },
      take: 50,
    })
  );
  return r.success ? r.data : [];
}

/** A user's PUBLIC, non-archived workspaces — for display on their profile. */
export async function listPublicWorkspacesForUser(userId: string) {
  const r = await safeQuery(() =>
    prisma.collaboration.findMany({
      where: {
        visibility: "PUBLIC",
        status: { not: "ARCHIVED" },
        members: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true },
    })
  );
  return r.success ? r.data : [];
}

/** Threads in a workspace (caller must have authorized read). */
export async function listThreads(collaborationId: string) {
  const r = await safeQuery(() =>
    prisma.collaborationThread.findMany({
      where: { collaborationId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, createdAt: true },
      take: 100,
    })
  );
  return r.success ? r.data : [];
}

/** Full workspace detail (caller must have already authorized read). */
export async function getCollaboration(id: string) {
  const r = await safeQuery(() =>
    prisma.collaboration.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, firstName: true, lastName: true, image: true } } },
        },
        _count: { select: { threads: true, files: true, media: true, members: true } },
      },
    })
  );
  return r.success ? r.data : null;
}

/** Workspace documents (ordered) — title + Portable Text content. */
export async function getDocs(collaborationId: string) {
  const r = await safeQuery(() =>
    prisma.collaborationDoc.findMany({
      where: { collaborationId },
      orderBy: { order: "asc" },
      select: { id: true, title: true, content: true, updatedAt: true },
    })
  );
  return r.success ? r.data : [];
}

/** The research plan (ordered stages → tasks) for a collaboration's Home tab. */
export async function getPlan(collaborationId: string) {
  const r = await safeQuery(() =>
    prisma.plan.findUnique({
      where: { collaborationId },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                status: true,
                assignee: { select: { id: true, firstName: true, lastName: true, username: true } },
              },
            },
          },
        },
      },
    })
  );
  return r.success ? r.data : null;
}
