"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { MySuggestion } from "@/lib/content/discovery";
import { cn } from "@/lib/utils";

const TONE: Record<MySuggestion["status"], string> = {
  pending: "bg-ccm-amber/15 text-ccm-midnight",
  approved: "bg-emerald-100 text-emerald-900",
  revision: "bg-ccm-sea/10 text-ccm-sea",
  rejected: "bg-muted text-muted-foreground",
};

/** A member's own event suggestions: each one's outcome, the team's note, and Edit while it can still change (events spec §3.2). */
export function YourSuggestions({ items, locale }: { items: MySuggestion[]; locale: string }) {
  const t = useTranslations("events.suggest");
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="your-suggestions" className="space-y-3">
      <h2 id="your-suggestions" className="font-heading text-xl font-bold text-ccm-midnight">
        {t("yours")}
      </h2>
      <ul className="divide-y divide-ccm-midnight/10 rounded-2xl border border-ccm-midnight/10 bg-white">
        {items.map((item) => {
          const editable = item.status === "pending" || item.status === "revision";
          const showNote = (item.status === "revision" || item.status === "rejected") && item.reviewNotes;
          return (
            <li key={item.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0 space-y-0.5">
                  {item.status === "approved" && item.slug ? (
                    <Link href={`/events/${item.slug}`} className="font-semibold text-ccm-midnight hover:underline">
                      <bdi>{item.title}</bdi>
                    </Link>
                  ) : (
                    <p className="font-semibold text-ccm-midnight">
                      <bdi>{item.title}</bdi>
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{item.startAt ? when.format(new Date(item.startAt)) : t("noDate")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", TONE[item.status])}>{t(`status.${item.status}`)}</span>
                  {editable && (
                    <Link href={`/events/suggest?edit=${encodeURIComponent(item.id)}`} className="inline-flex min-h-11 items-center text-sm font-bold text-ccm-sea hover:underline">
                      {t("edit")}
                    </Link>
                  )}
                </div>
              </div>
              {showNote && (
                <p className="rounded-lg bg-ccm-sky/15 px-3 py-2 text-sm text-ccm-midnight">
                  <span className="font-semibold">{t("teamNote")}: </span>
                  {item.reviewNotes}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
