"use server";
import { revalidatePath } from "next/cache";
import { getActor, isStaff } from "@/lib/authz";
import { runModerationAction } from "@/payload/components/moderation-actions-server";

/** Approve / ask for changes / reject from the site's queue — the admin buttons' own action. */
export async function reviewSubmission(input: {
  collection: string;
  id: string;
  action: string;
  reviewNotes?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isStaff(await getActor())) return { ok: false, error: "Only the team can review submissions." };
  const res = await runModerationAction(input);
  if (!res.ok) return { ok: false, error: res.error };
  revalidatePath("/[locale]/moderation", "page");
  return { ok: true };
}
