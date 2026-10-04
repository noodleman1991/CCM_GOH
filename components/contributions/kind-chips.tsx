"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { FilterChip } from "@/components/ui/filter-chip";
import { CONTRIBUTION_KINDS, type ContributionKind } from "@/lib/contributions/model";

/** All · Case studies · Lived experiences · … — single choice, kept in `?kind=` so the view can be shared. */
export function ContributionKindChips({ counts, total, chosen }: { counts: Record<ContributionKind, number>; total: number; chosen: ContributionKind | null }) {
  const t = useTranslations("dashboard.contributions.kinds");
  const router = useRouter();
  const pathname = usePathname();
  const go = (k: ContributionKind | null) => router.push(k ? `${pathname}?kind=${k}` : pathname, { scroll: false });
  return (
    <div role="group" aria-label={t("all")} className="flex flex-wrap gap-1.5">
      <FilterChip label={t("all")} count={total} active={chosen === null} onClick={() => go(null)} />
      {CONTRIBUTION_KINDS.filter((k) => counts[k] > 0).map((k) => (
        <FilterChip key={k} label={t(k)} count={counts[k]} active={chosen === k} onClick={() => go(chosen === k ? null : k)} />
      ))}
    </div>
  );
}
