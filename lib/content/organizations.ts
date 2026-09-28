import "server-only";
import { activeBackend } from "@/lib/content/internal/backend";
import { findOrganization, type Organization } from "@/lib/content/internal/payload/organizations";
import type { Locale } from "@/lib/content/types";

export type { Organization };

/** Organisation pages exist on the Payload backend only; Sanity never had them. */
export async function getOrganization(slug: string, locale: Locale): Promise<Organization | null> {
  if (activeBackend() !== "payload") return null;
  return findOrganization(slug, locale);
}
