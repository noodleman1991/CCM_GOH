import "server-only";
import { query } from "@/lib/content/internal/payload-source";

/** The stored Settings → Collaboration row (cached, cleared when saved). Throws on failure; the caller decides the fallback. */
export async function readCollaborationSettingsRow(): Promise<unknown> {
  return query<unknown>({ type: "global", slug: "collaborationSettings", depth: 0 });
}
