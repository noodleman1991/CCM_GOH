"use server";
import { revalidatePath } from "next/cache";
import { getPayload } from "payload";
import config from "@payload-config";
import { getActor, isStaff } from "@/lib/authz";
import { withBlocked, withoutBlocked, type BlockedEntry } from "@/lib/events/blocked-list";

/**
 * The review queue's "Stop this person suggesting events" / "Allow again"
 * (events spec §3.3). Team only; the list lives on the Event suggestions
 * settings, where editors can also see and change it.
 */
async function changeBlocked(change: (list: BlockedEntry[]) => BlockedEntry[]): Promise<{ ok: boolean; error?: string }> {
  if (!isStaff(await getActor())) return { ok: false, error: "Only the team can do this." };
  const payload = await getPayload({ config });
  const settings = (await payload.findGlobal({ slug: "eventSuggestions", depth: 0, overrideAccess: true })) as { blocked?: Array<{ userId?: string; note?: string | null }> };
  const current: BlockedEntry[] = (settings?.blocked ?? [])
    .filter((b): b is { userId: string; note?: string | null } => typeof b.userId === "string" && b.userId.length > 0)
    .map((b) => (b.note ? { userId: b.userId, note: b.note } : { userId: b.userId }));
  await payload.updateGlobal({ slug: "eventSuggestions", data: { blocked: change(current) } as never, overrideAccess: true });
  revalidatePath("/[locale]/moderation", "page");
  return { ok: true };
}

export async function stopEventSuggestions(userId: string) {
  return changeBlocked((list) => withBlocked(list, userId));
}

export async function allowEventSuggestions(userId: string) {
  return changeBlocked((list) => withoutBlocked(list, userId));
}
