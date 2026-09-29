import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { findCommunity, type CommunityPage } from "@/lib/content/internal/payload/community";
import type { Locale } from "@/lib/content/types";

export type { CommunityPage };

/** A regional community's page from its record (CMS project 3). Payload only —
 *  on the Sanity backend the old Community page renders instead. */
export async function getCommunity(slug: string, locale: Locale): Promise<CommunityPage | null> {
  if (activeBackend() !== "payload") return null;
  return findCommunity(slug, locale);
}
