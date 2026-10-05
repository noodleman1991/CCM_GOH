"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { ContributionStatus } from "@/lib/contributions/model";
import { cn } from "@/lib/utils";

const COUNTS: Array<{ status: ContributionStatus; key: string }> = [
  { status: "revision", key: "needsChanges" },
  { status: "pending", key: "waiting" },
  { status: "approved", key: "published" },
  { status: "draft", key: "drafts" },
];

/** The dashboard's view of My contributions: the counts that matter, and anything waiting on the member. */
export function ContributionsCard({ counts }: { counts: Record<ContributionStatus, number> }) {
  const t = useTranslations("dashboard.contributions");
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <section aria-labelledby="your-contributions" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="your-contributions" className="font-heading text-xl font-bold text-ccm-midnight">
          {t("card.title")}
        </h2>
        {total > 0 && (
          <Link href="/dashboard/submissions" className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-ccm-sea hover:underline">
            {t("card.seeAll")}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        )}
      </div>
      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-ccm-midnight/15 bg-white p-4 text-sm text-muted-foreground">
          {t("card.nothingYet")}{" "}
          <Link href="/dashboard/submissions" className="font-bold text-ccm-sea hover:underline">
            {t("card.shareLink")}
          </Link>
        </p>
      ) : (
        <div className="@container overflow-hidden rounded-2xl border border-ccm-midnight/10 bg-white">
          <dl className="grid grid-cols-2 @md:grid-cols-4">
            {COUNTS.map(({ status, key }) => (
              <div key={status} className={cn("p-3", status === "revision" && counts.revision > 0 && "bg-ccm-sea/10")}>
                <dt className="text-xs text-muted-foreground">{t(`card.${key}`)}</dt>
                <dd className="font-heading text-2xl font-bold text-ccm-midnight">{counts[status]}</dd>
              </div>
            ))}
          </dl>
          {/* Items sent back live in Your week on the dashboard — counts only here (no repeats). */}
        </div>
      )}
    </section>
  );
}
