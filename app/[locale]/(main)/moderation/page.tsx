import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getActor, isStaff } from "@/lib/authz";
import { getQueue, getQueueCounts } from "@/lib/comments/moderation-queue";
import { ModerationQueue, type ModerationTab } from "@/components/comments/moderation-queue";
import { getReviewQueue } from "@/lib/moderation/review-queue";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "navigation" });
  return { title: t("moderation") };
}

/**
 * In-app moderation queue. Gated on the Prisma role (team_editor | admin).
 * Tabs: "Waiting for review" (member submissions + held and flagged comments,
 * the default — editor-experience spec §3.7) / pending (anon) / flagged
 * (wordlist) / reported.
 */
export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const locale = await getLocale();
  const actor = await getActor();
  if (!isStaff(actor)) {
    redirect({ href: "/", locale });
  }

  const { tab: rawTab } = await searchParams;
  const tab: ModerationTab =
    rawTab === "flagged" || rawTab === "reported" || rawTab === "pending" ? rawTab : "review";

  const tMod = await getTranslations("moderation");
  const [items, counts, reviewItems] = await Promise.all([
    tab === "review" ? Promise.resolve([]) : getQueue(tab),
    getQueueCounts(),
    getReviewQueue(locale),
  ]);

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="mb-6 text-3xl font-heading font-bold text-ccm-midnight">{tMod("queue.title")}</h1>
      <ModerationQueue tab={tab} items={items} counts={{ ...counts, review: reviewItems.length }} reviewItems={reviewItems} />
    </div>
  );
}
