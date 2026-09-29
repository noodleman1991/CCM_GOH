import { isStaff, type Actor } from "@/lib/authz-core";

/** Staff, or a community lead listed on this community (editor-experience spec §3.5). */
export function canEditCommunity(actor: Actor, leadIds: string[]): boolean {
  if (isStaff(actor)) return true;
  return !!actor && actor.role === "community_editor" && leadIds.includes(actor.id);
}
