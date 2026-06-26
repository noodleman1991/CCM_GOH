"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab, getMembershipRole } from "@/lib/collaboration/service";
import { seedWorkspace } from "@/lib/collaboration/seed";
import type { CollaborationRole } from "@/generated/prisma";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional(),
  visibility: z.enum(["PUBLIC", "MEMBERS"]).default("MEMBERS"),
});

/** Create a workspace — the creator becomes OWNER. */
export async function createCollaboration(input: z.infer<typeof createSchema>): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to create a workspace." };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const collab = await prisma.collaboration.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility,
      createdById: actor.id,
      members: { create: { userId: actor.id, role: "OWNER" } },
    },
    select: { id: true },
  });

  // Seed the workspace so it is never empty: a plan with the three starter
  // stages + a starter doc. Best-effort — never fail creation on a seed error.
  try {
    await seedWorkspace(prisma, collab.id, actor.id);
  } catch {
    // Seeding is convenience-only; the workspace is the source of truth.
  }

  revalidatePath("/collaborations");
  return { ok: true, id: collab.id };
}

/** Join a PUBLIC workspace as a VIEWER. */
export async function joinCollaboration(id: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to join." };
  const collab = await prisma.collaboration.findUnique({ where: { id }, select: { visibility: true } });
  if (!collab) return { ok: false, error: "Not found." };
  if (collab.visibility !== "PUBLIC") return { ok: false, error: "This workspace is invite-only." };

  await prisma.collaborationMember.upsert({
    where: { collaborationId_userId: { collaborationId: id, userId: actor.id } },
    create: { collaborationId: id, userId: actor.id, role: "VIEWER" },
    update: {},
  });
  revalidatePath(`/collaborations/${id}`);
  return { ok: true };
}

/** Owner sets a member's role. */
export async function setMemberRole(
  collaborationId: string,
  userId: string,
  role: CollaborationRole
): Promise<Result> {
  try {
    await authorizeCollab(collaborationId, "collab:manageMembers");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  // Guard: don't demote the sole OWNER.
  if (role !== "OWNER") {
    const target = await getMembershipRole(collaborationId, userId);
    if (target === "OWNER") {
      const owners = await prisma.collaborationMember.count({
        where: { collaborationId, role: "OWNER" },
      });
      if (owners <= 1) return { ok: false, error: "Assign another owner before changing this role." };
    }
  }
  await prisma.collaborationMember.update({
    where: { collaborationId_userId: { collaborationId, userId } },
    data: { role },
  });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true };
}

/** Leave a workspace — blocked for the sole OWNER (transfer or archive first). */
export async function leaveCollaboration(id: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const role = await getMembershipRole(id, actor.id);
  if (!role) return { ok: true };
  if (role === "OWNER") {
    const owners = await prisma.collaborationMember.count({ where: { collaborationId: id, role: "OWNER" } });
    if (owners <= 1) {
      return { ok: false, error: "You are the only owner. Transfer ownership or archive the workspace first." };
    }
  }
  await prisma.collaborationMember.delete({
    where: { collaborationId_userId: { collaborationId: id, userId: actor.id } },
  });
  revalidatePath(`/collaborations/${id}`);
  return { ok: true };
}

/** Archive the workspace (owner or staff). */
export async function archiveCollaboration(id: string): Promise<Result> {
  try {
    await authorizeCollab(id, "collab:archive");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  await prisma.collaboration.update({ where: { id }, data: { status: "ARCHIVED" } });
  revalidatePath("/collaborations");
  return { ok: true };
}

/** Create a discussion thread (EDITOR+). */
/** Inline-edit the workspace title and/or description (EDITOR+ via editThread cap). */
export async function updateCollaboration(
  collaborationId: string,
  patch: { title?: string; description?: string }
): Promise<Result> {
  try {
    await authorizeCollab(collaborationId, "collab:editThread");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const data: { title?: string; description?: string } = {};
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (t.length < 1 || t.length > 200) return { ok: false, error: "Title must be 1–200 chars." };
    data.title = t;
  }
  if (patch.description !== undefined) {
    data.description = patch.description.trim().slice(0, 2000) || "";
  }
  if (Object.keys(data).length === 0) return { ok: true };
  await prisma.collaboration.update({ where: { id: collaborationId }, data });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true };
}

/** Inline-rename a thread (EDITOR+). */
export async function renameThread(
  collaborationId: string,
  threadId: string,
  title: string
): Promise<Result> {
  try {
    await authorizeCollab(collaborationId, "collab:editThread");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const t = title.trim();
  if (t.length < 1 || t.length > 160) return { ok: false, error: "Invalid title." };
  await prisma.collaborationThread.update({ where: { id: threadId }, data: { title: t } });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true };
}

export async function createThread(collaborationId: string, title: string): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  try {
    await authorizeCollab(collaborationId, "collab:editThread");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const t = title.trim();
  if (t.length < 1 || t.length > 160) return { ok: false, error: "Invalid title." };

  const thread = await prisma.collaborationThread.create({
    data: { collaborationId, title: t, createdById: actor.id },
    select: { id: true },
  });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true, id: thread.id };
}
