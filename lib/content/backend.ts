import { activeBackend } from "@/lib/content/internal/backend";

/** Is this deployment still serving content from Sanity? Draft mode means
 *  Sanity's Presentation there, and Payload live preview otherwise. */
export function isSanityContentBackend(): boolean {
  return activeBackend() === "sanity";
}
