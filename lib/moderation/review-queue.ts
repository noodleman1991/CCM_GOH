import "server-only";
import { getPayload } from "payload";
import config from "@payload-config";
import { MODERATED_COLLECTIONS } from "@/payload/moderation/workflows";
import { getQueue, getQueueCounts } from "@/lib/comments/moderation-queue";
import { commentItem, mergeReviewItems, toSubmissionItem, type ReviewItem } from "./review-items";

/** Everything waiting for a decision: pending submissions + held and flagged comments. */
export async function getReviewQueue(locale: string): Promise<ReviewItem[]> {
  const payload = await getPayload({ config });
  const settings = (await payload.findGlobal({ slug: "eventSuggestions", depth: 0, overrideAccess: true }).catch(() => null)) as { blocked?: Array<{ userId?: string }> } | null;
  const blocked = new Set((settings?.blocked ?? []).map((b) => b.userId).filter((id): id is string => Boolean(id)));
  const submissions = await Promise.all(
    MODERATED_COLLECTIONS.map(async (collection) => {
      const res = await payload
        .find({ collection, where: { moderationStatus: { equals: "pending" } }, locale: "all", depth: 1, limit: 50, sort: "-createdAt", overrideAccess: true, draft: true })
        .catch(() => ({ docs: [] }));
      return (res.docs as unknown as Record<string, unknown>[]).map((d) => toSubmissionItem(collection, d, locale, blocked));
    }),
  );
  const [held, flagged] = await Promise.all([getQueue("pending"), getQueue("flagged")]);
  return mergeReviewItems(...submissions, [...held, ...flagged].map(commentItem));
}

/** How many things wait for a decision — the staff menu's badge. */
export async function getReviewCount(): Promise<number> {
  const payload = await getPayload({ config });
  const counts = await Promise.all(
    MODERATED_COLLECTIONS.map((collection) =>
      payload.count({ collection, where: { moderationStatus: { equals: "pending" } }, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0),
    ),
  );
  const comments = await getQueueCounts();
  return counts.reduce((a, b) => a + b, 0) + comments.pending + comments.flagged;
}
