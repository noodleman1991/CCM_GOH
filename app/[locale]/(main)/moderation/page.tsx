import { redirect } from "next/navigation";
import { getActor, isStaff } from "@/lib/authz";
import { getQueue, getQueueCounts, type QueueTab } from "@/lib/comments/moderation-queue";
import { ModerationQueue } from "@/components/comments/moderation-queue";

export const dynamic = "force-dynamic";

/**
 * In-app moderation queue. Gated on the Prisma role (team_editor | admin).
 * Reads from Postgres (Studio can't see comments). Tabs: pending (anon) /
 * flagged (wordlist) / reported.
 */
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const actor = await getActor();
  if (!isStaff(actor)) {
    redirect("/");
  }

  const { tab: rawTab } = await searchParams;
  const tab: QueueTab =
    rawTab === "flagged" || rawTab === "reported" ? rawTab : "pending";

  const [items, counts] = await Promise.all([getQueue(tab), getQueueCounts()]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-heading font-bold text-ccm-midnight">Moderation</h1>
      <ModerationQueue tab={tab} items={items} counts={counts} />
    </div>
  );
}
