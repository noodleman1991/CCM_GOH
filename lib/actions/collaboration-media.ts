"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";

import { youtubeId } from "@/lib/youtube";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

/** Add a YouTube media item (EDITOR+). */
export async function addMedia(collaborationId: string, url: string, title?: string): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  try {
    await authorizeCollab(collaborationId, "collab:upload");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const id = youtubeId(url);
  if (!id) return { ok: false, error: "Only YouTube links are supported." };

  const media = await prisma.collaborationMedia.create({
    data: {
      collaborationId,
      url: `https://www.youtube-nocookie.com/embed/${id}`,
      title: title?.slice(0, 200) ?? null,
      addedById: actor.id,
    },
    select: { id: true },
  });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true, id: media.id };
}

export async function deleteMedia(collaborationId: string, mediaId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  try {
    await authorizeCollab(collaborationId, "collab:upload");
  } catch {
    return { ok: false, error: "Not permitted." };
  }
  const m = await prisma.collaborationMedia.findUnique({ where: { id: mediaId }, select: { collaborationId: true } });
  if (!m || m.collaborationId !== collaborationId) return { ok: false, error: "Not found." };
  await prisma.collaborationMedia.delete({ where: { id: mediaId } });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true };
}
