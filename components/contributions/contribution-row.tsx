"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RelativeTime } from "@/components/ui/relative-time";
import { TYPE_STYLE } from "@/lib/cards/type-style";
import { STATUS_TONE } from "@/components/contributions/status-tone";
import type { Contribution } from "@/lib/contributions/model";
import { cn } from "@/lib/utils";

/** One thing a member sent: kind · title · when · status, the team's note, and the one next step. */
export function ContributionRow({ item, showAdmin = false }: { item: Contribution; showAdmin?: boolean }) {
  const t = useTranslations("dashboard.contributions");
  const color = TYPE_STYLE[item.kind].color;
  const action =
    item.status === "draft" ? { href: item.editHref, label: t("actions.continue") }
    : item.status === "revision" ? { href: item.editHref, label: t("actions.makeChanges") }
    : item.status === "pending" ? { href: item.editHref, label: t("actions.edit") }
    : item.status === "approved" ? { href: item.href, label: t("actions.view") }
    : null;
  const showNote = (item.status === "revision" || item.status === "rejected") && item.reviewNotes;

  return (
    // Sized by its own width (the page list, or the dashboard's narrow column).
    <li className="@container space-y-2 p-4">
      <div className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-[0.12em]" style={{ color }}>
            <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
            {t(`kind.${item.kind}`)}
          </p>
          <p className="line-clamp-2 font-semibold text-ccm-midnight">
            <bdi>{item.title ?? t(`untitled.${item.kind}`)}</bdi>
          </p>
          {item.date && (
            <p className="text-xs text-muted-foreground">
              {t(item.status === "draft" ? "saved" : "sent")} · <RelativeTime date={item.date} />
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_TONE[item.status])}>{t(`status.${item.status}`)}</span>
          {action?.href && (
            <Link href={action.href} className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-ccm-sea hover:underline">
              {action.label}
              <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
            </Link>
          )}
          {showAdmin && (
            // A plain anchor: the admin is not a locale route.
            <a href={item.adminHref} className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:underline">
              {t("actions.openInAdmin")}
            </a>
          )}
        </div>
      </div>
      {showNote && (
        <p className="rounded-lg bg-ccm-sky/15 px-3 py-2 text-sm text-ccm-midnight">
          <span className="font-semibold">{t("teamNote")}: </span>
          {/* The note keeps its own direction (an English note on an Arabic page). */}
          <bdi>{item.reviewNotes}</bdi>
        </p>
      )}
    </li>
  );
}
