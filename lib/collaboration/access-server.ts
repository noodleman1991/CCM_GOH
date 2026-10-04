import "server-only";
import { readCollaborationSettingsRow } from "@/lib/content/collaboration-settings";
import type { Actor } from "@/lib/authz";
import { ALL_OFF, ALL_ON, collaborationAccess, devOverride, toSettings, type CollaborationAccess, type CollaborationSettings } from "@/lib/collaboration/access";

/** Settings → Collaboration, cached and cleared when saved. A failed read hides every collaboration tool — never opens them. */
export async function getCollaborationSettings(): Promise<CollaborationSettings> {
  if (devOverride()) return ALL_ON;
  try {
    return toSettings(await readCollaborationSettingsRow());
  } catch (error) {
    console.error("[collaboration] settings read failed — the collaboration tools stay hidden", error);
    return ALL_OFF;
  }
}

/** What this viewer may use: the setting × their role. */
export async function getCollaborationAccessFor(actor: Actor): Promise<CollaborationAccess> {
  return collaborationAccess(await getCollaborationSettings(), actor?.role ?? null);
}
