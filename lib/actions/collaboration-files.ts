"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { authorizeCollab } from "@/lib/collaboration/service";
import { objectExists, deleteObject } from "@/lib/r2";
import { isAllowedUpload } from "@/lib/file-policy";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Confirm an uploaded file: HEAD the R2 object, then persist the
 * CollaborationFile row (so a failed PUT never leaves an orphan DB row).
 */
export async function confirmFileUpload(input: {
  collaborationId: string;
  key: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<Result<{ id: string }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  try {
    await authorizeCollab(input.collaborationId, "collab:upload");
  } catch {
    return { ok: false, error: "Not permitted." };
  }

  const policy = isAllowedUpload(input.contentType, input.size);
  if (!policy.ok) return { ok: false, error: policy.error };

  // Key must belong to this collaboration (prevent cross-collab key injection).
  if (!input.key.includes(`/${input.collaborationId}/`)) {
    return { ok: false, error: "Invalid key." };
  }

  const exists = await objectExists(input.key);
  if (!exists) return { ok: false, error: "Upload not found. Please try again." };

  const file = await prisma.collaborationFile.create({
    data: {
      collaborationId: input.collaborationId,
      r2Key: input.key,
      fileName: input.fileName.slice(0, 255),
      contentType: input.contentType,
      size: input.size,
      uploadedById: actor.id,
    },
    select: { id: true },
  });
  revalidatePath(`/collaborations/${input.collaborationId}`);
  return { ok: true, id: file.id };
}

/** Delete a file (EDITOR+ or the uploader) — removes the R2 object too. */
export async function deleteFile(collaborationId: string, fileId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };

  const file = await prisma.collaborationFile.findUnique({
    where: { id: fileId },
    select: { r2Key: true, uploadedById: true, collaborationId: true },
  });
  if (!file || file.collaborationId !== collaborationId) return { ok: false, error: "Not found." };

  const isUploader = file.uploadedById === actor.id;
  if (!isUploader) {
    try {
      await authorizeCollab(collaborationId, "collab:upload"); // EDITOR+
    } catch {
      return { ok: false, error: "Not permitted." };
    }
  }

  await deleteObject(file.r2Key);
  await prisma.collaborationFile.delete({ where: { id: fileId } });
  revalidatePath(`/collaborations/${collaborationId}`);
  return { ok: true };
}
