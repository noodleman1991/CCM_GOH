import "server-only";
import { safe } from "@/lib/content/internal/safe";
import { readMyContributions } from "@/lib/content/internal/payload/contributions";
import type { Contribution } from "@/lib/contributions/model";

/** Everything the signed-in member has sent, any kind (my-contributions spec). */
export async function listMyContributions(clerkUserId: string, locale: string): Promise<Contribution[]> {
  return safe("my-contributions", [] as Contribution[], () => readMyContributions(clerkUserId, locale));
}
