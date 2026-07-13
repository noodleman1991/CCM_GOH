"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor, isStaff } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import { createNotification } from "@/lib/notifications/service";
import { emitLifecycle } from "@/lib/notifications/emit";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const messageSchema = z.string().max(500).optional();

/* ---------------------------------------------------------------- join ----- */

/**
 * Request to join a collaboration workspace. Idempotent on (collaboration,
 * requester): a re-request reopens a previously resolved one as PENDING. The
 * workspace owner is notified (REQUEST).
 */
export async function requestToJoin(
  collaborationId: string,
  message?: string
): Promise<Result<{ status: "PENDING" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to request to join." };
  if (!z.string().min(1).safeParse(collaborationId).success) return { ok: false, error: "Invalid workspace." };
  const msg = messageSchema.safeParse(message);
  if (!msg.success) return { ok: false, error: "Message too long." };

  const collab = await prisma.collaboration.findUnique({
    where: { id: collaborationId },
    select: { id: true, title: true, createdById: true },
  });
  if (!collab) return { ok: false, error: "Workspace not found." };

  // Already a member? Nothing to request.
  const existingMember = await prisma.collaborationMember.findUnique({
    where: { collaborationId_userId: { collaborationId, userId: actor.id } },
    select: { userId: true },
  });
  if (existingMember) return { ok: false, error: "You're already a member." };

  await prisma.joinRequest.upsert({
    where: { collaborationId_requesterId: { collaborationId, requesterId: actor.id } },
    create: { collaborationId, requesterId: actor.id, message: msg.data ?? null },
    update: { status: "PENDING", message: msg.data ?? null, resolvedAt: null },
  });

  await createNotification({
    recipientId: collab.createdById,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "joinRequest",
    entityId: collaborationId,
    snippet: msg.data ?? null,
  });

  return { ok: true, status: "PENDING" };
}

/**
 * Owner (or staff) accepts/declines a join request. Accept adds the requester
 * as a CollaborationMember (VIEWER) and notifies them.
 */
export async function respondToJoinRequest(
  requestId: string,
  accept: boolean
): Promise<Result<{ status: "ACCEPTED" | "DECLINED" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const req = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      requesterId: true,
      collaborationId: true,
      collaboration: { select: { createdById: true } },
    },
  });
  if (!req) return { ok: false, error: "Request not found." };

  // Only the workspace owner or platform staff may resolve it.
  const isOwner = req.collaboration.createdById === actor.id;
  if (!isOwner && !isStaff(actor)) return { ok: false, error: "Not permitted." };
  if (req.status !== "PENDING") return { ok: false, error: "Already resolved." };

  const status = accept ? "ACCEPTED" : "DECLINED";

  await prisma.$transaction(async (tx) => {
    await tx.joinRequest.update({
      where: { id: requestId },
      data: { status, resolvedAt: new Date() },
    });
    if (accept) {
      await tx.collaborationMember.upsert({
        where: { collaborationId_userId: { collaborationId: req.collaborationId, userId: req.requesterId } },
        create: { collaborationId: req.collaborationId, userId: req.requesterId, role: "VIEWER" },
        update: {},
      });
    }
    // Resolve the resolver's own REQUEST notification: mark it read and flip its
    // entityType so the feed no longer renders Accept/Decline (it stays as a
    // read history row). Without this the row reappears actionable after refetch.
    await tx.notification.updateMany({
      where: {
        recipientId: actor.id,
        type: "REQUEST",
        entityType: "joinRequest",
        entityId: req.collaborationId,
        actorId: req.requesterId,
      },
      data: { entityType: "joinRequestResolved", readAt: new Date() },
    });
  });

  await createNotification({
    recipientId: req.requesterId,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "joinRequestResolved",
    entityId: req.collaborationId,
    snippet: accept ? "accepted your request to join" : "declined your request to join",
  });

  // X3: tell the rest of the team someone new is aboard.
  if (accept) {
    const [members, newMember] = await Promise.all([
      prisma.collaborationMember.findMany({
        where: { collaborationId: req.collaborationId, userId: { notIn: [req.requesterId, actor.id] } },
        select: { userId: true },
      }),
      prisma.user.findUnique({
        where: { id: req.requesterId },
        select: { firstName: true, lastName: true, username: true },
      }),
    ]);
    await emitLifecycle({
      kind: "member_joined",
      memberIds: members.map((m) => m.userId),
      newMemberId: req.requesterId,
      collaborationId: req.collaborationId,
      memberName:
        [newMember?.firstName, newMember?.lastName].filter(Boolean).join(" ") || newMember?.username || "A new member",
    });
  }

  return { ok: true, status };
}

/**
 * Resolve a join request from a notification row, which carries the requester
 * (actorId) + collaboration (entityId) rather than the requestId. Looks up the
 * request via its unique (collaboration, requester) and delegates.
 */
export async function respondToJoinByTarget(
  collaborationId: string,
  requesterId: string,
  accept: boolean
): Promise<Result<{ status: "ACCEPTED" | "DECLINED" }>> {
  const req = await prisma.joinRequest.findUnique({
    where: { collaborationId_requesterId: { collaborationId, requesterId } },
    select: { id: true },
  });
  if (!req) return { ok: false, error: "Request not found." };
  return respondToJoinRequest(req.id, accept);
}

/* ------------------------------------------------------------- invite ----- */

/**
 * OWNER invites a hub member into the workspace (the outbound inverse of
 * requestToJoin). Idempotent on (collaboration, invitee): re-inviting reopens
 * a resolved invite as PENDING. The invitee is notified (REQUEST) and accepts
 * or declines from their notification feed.
 */
export async function inviteToCollaboration(
  collaborationId: string,
  inviteeId: string
): Promise<Result<{ status: "PENDING" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  if (inviteeId === actor.id) return { ok: false, error: "That's you." };

  try {
    await authorizeCollab(collaborationId, "collab:manageMembers");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const [collab, invitee, existingMember] = await Promise.all([
    prisma.collaboration.findUnique({ where: { id: collaborationId }, select: { title: true } }),
    prisma.user.findUnique({ where: { id: inviteeId }, select: { id: true } }),
    prisma.collaborationMember.findUnique({
      where: { collaborationId_userId: { collaborationId, userId: inviteeId } },
      select: { userId: true },
    }),
  ]);
  if (!collab) return { ok: false, error: "Workspace not found." };
  if (!invitee) return { ok: false, error: "Member not found." };
  if (existingMember) return { ok: false, error: "Already a member." };

  await prisma.collaborationInvite.upsert({
    where: { collaborationId_inviteeId: { collaborationId, inviteeId } },
    create: { collaborationId, inviteeId, inviterId: actor.id },
    update: { status: "PENDING", inviterId: actor.id, resolvedAt: null },
  });

  await createNotification({
    recipientId: inviteeId,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "collaborationInvite",
    entityId: collaborationId,
    snippet: `invited you to join "${collab.title}"`,
  });

  return { ok: true, status: "PENDING" };
}

/**
 * Invitee accepts/declines a workspace invite from their notification row
 * (entityId = collaborationId). Accept joins them as VIEWER, notifies the
 * inviter, and announces to the team (MEMBER_JOINED).
 */
export async function respondToInviteByTarget(
  collaborationId: string,
  accept: boolean
): Promise<Result<{ status: "ACCEPTED" | "DECLINED" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const invite = await prisma.collaborationInvite.findUnique({
    where: { collaborationId_inviteeId: { collaborationId, inviteeId: actor.id } },
    select: { id: true, status: true, inviterId: true, collaboration: { select: { title: true } } },
  });
  if (!invite) return { ok: false, error: "Invite not found." };
  if (invite.status !== "PENDING") return { ok: false, error: "Already resolved." };

  const status = accept ? "ACCEPTED" : "DECLINED";
  await prisma.$transaction(async (tx) => {
    await tx.collaborationInvite.update({
      where: { id: invite.id },
      data: { status, resolvedAt: new Date() },
    });
    if (accept) {
      await tx.collaborationMember.upsert({
        where: { collaborationId_userId: { collaborationId, userId: actor.id } },
        create: { collaborationId, userId: actor.id, role: "VIEWER" },
        update: {},
      });
    }
    // Resolve the invitee's own REQUEST notification (see respondToJoinRequest).
    await tx.notification.updateMany({
      where: {
        recipientId: actor.id,
        type: "REQUEST",
        entityType: "collaborationInvite",
        entityId: collaborationId,
      },
      data: { entityType: "collaborationInviteResolved", readAt: new Date() },
    });
  });

  await createNotification({
    recipientId: invite.inviterId,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "collaborationInviteResolved",
    entityId: collaborationId,
    snippet: accept
      ? `accepted your invitation to "${invite.collaboration.title}"`
      : `declined your invitation to "${invite.collaboration.title}"`,
  });

  if (accept) {
    const [members, joined] = await Promise.all([
      prisma.collaborationMember.findMany({
        where: { collaborationId, userId: { notIn: [actor.id] } },
        select: { userId: true },
      }),
      prisma.user.findUnique({
        where: { id: actor.id },
        select: { firstName: true, lastName: true, username: true },
      }),
    ]);
    await emitLifecycle({
      kind: "member_joined",
      memberIds: members.map((m) => m.userId),
      newMemberId: actor.id,
      collaborationId,
      memberName:
        [joined?.firstName, joined?.lastName].filter(Boolean).join(" ") || joined?.username || "A new member",
    });
  }

  return { ok: true, status };
}

/* ------------------------------------------------------------- contact ----- */

/** Request to connect with another member. The recipient is notified (REQUEST). */
export async function requestContact(
  recipientId: string,
  message?: string
): Promise<Result<{ status: "PENDING" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to send a request." };
  if (recipientId === actor.id) return { ok: false, error: "That's you." };
  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true } });
  if (!recipient) return { ok: false, error: "Member not found." };
  const msg = messageSchema.safeParse(message);
  if (!msg.success) return { ok: false, error: "Message too long." };

  await prisma.contactRequest.upsert({
    where: { requesterId_recipientId: { requesterId: actor.id, recipientId } },
    create: { requesterId: actor.id, recipientId, message: msg.data ?? null },
    update: { status: "PENDING", message: msg.data ?? null, resolvedAt: null },
  });

  await createNotification({
    recipientId,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "contactRequest",
    entityId: actor.id,
    snippet: msg.data ?? null,
  });

  return { ok: true, status: "PENDING" };
}

/** Resolve a contact request from a notification row (actorId = requester). */
export async function respondToContactByTarget(
  requesterId: string,
  accept: boolean
): Promise<Result<{ status: "ACCEPTED" | "DECLINED" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const req = await prisma.contactRequest.findUnique({
    where: { requesterId_recipientId: { requesterId, recipientId: actor.id } },
    select: { id: true },
  });
  if (!req) return { ok: false, error: "Request not found." };
  return respondToContactRequest(req.id, accept);
}

/** Recipient accepts/declines a contact request; the requester is notified. */
export async function respondToContactRequest(
  requestId: string,
  accept: boolean
): Promise<Result<{ status: "ACCEPTED" | "DECLINED" }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const req = await prisma.contactRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true, requesterId: true, recipientId: true },
  });
  if (!req) return { ok: false, error: "Request not found." };
  if (req.recipientId !== actor.id) return { ok: false, error: "Not permitted." };
  if (req.status !== "PENDING") return { ok: false, error: "Already resolved." };

  const status = accept ? "ACCEPTED" : "DECLINED";
  await prisma.$transaction(async (tx) => {
    await tx.contactRequest.update({
      where: { id: requestId },
      data: { status, resolvedAt: new Date() },
    });
    // Resolve the resolver's own REQUEST notification (see respondToJoinRequest).
    await tx.notification.updateMany({
      where: {
        recipientId: actor.id,
        type: "REQUEST",
        entityType: "contactRequest",
        entityId: req.requesterId,
        actorId: req.requesterId,
      },
      data: { entityType: "contactRequestResolved", readAt: new Date() },
    });
  });

  await createNotification({
    recipientId: req.requesterId,
    type: "REQUEST",
    actorId: actor.id,
    entityType: "contactRequestResolved",
    entityId: actor.id,
    snippet: accept ? "accepted your contact request" : "declined your contact request",
  });

  return { ok: true, status };
}
