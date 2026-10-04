"use client";

import { useTranslations } from "next-intl";
import { ContributionRow } from "@/components/contributions/contribution-row";
import type { Contribution } from "@/lib/contributions/model";

/**
 * A member's own event suggestions (events spec §3.2), with the same rows as
 * Dashboard → My contributions: the outcome, the team's note and the next step.
 */
export function YourSuggestions({ items }: { items: Contribution[] }) {
  const t = useTranslations("events.suggest");
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="your-suggestions" className="space-y-3">
      <h2 id="your-suggestions" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("yours")}
      </h2>
      <ul className="divide-y divide-ccm-midnight/10 rounded-2xl border border-ccm-midnight/10 bg-white">
        {items.map((item) => (
          <ContributionRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
