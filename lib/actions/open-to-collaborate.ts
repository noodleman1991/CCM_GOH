"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { LIMITS } from "@/lib/validation/limits";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";

/** Show (or stop showing) a member as open to collaborate, with what they'd like to work on. */
export async function setOpenToCollaborate(open: boolean, interests?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in first." };
  if (!(await getCollaborationAccessFor(actor)).people) return { ok: false, error: "Not available yet." };
  const line = (interests ?? "").trim().slice(0, LIMITS.profile.collaborationInterests);
  await prisma.user.update({ where: { id: actor.id }, data: { openToCollaboration: open, collaborationInterests: line || null } });
  revalidatePath("/[locale]/dashboard", "page");
  revalidatePath("/[locale]/profiles/[username]", "page");
  return { ok: true };
}
