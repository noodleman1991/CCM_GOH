"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, ListTodo, PencilLine } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useBrowserTimeZone } from "@/components/events/local-when";
import type { WeekItem } from "@/lib/dashboard/your-week";
import { cn } from "@/lib/utils";

/**
 * "Your week" (dashboard spec D2): one timeline of what needs you and what's
 * coming, soonest first — the dashboard's story. Dates show in the visitor's
 * own zone once the browser says which it is.
 */
export function YourWeek({ items, locale }: { items: WeekItem[]; locale: string }) {
  const t = useTranslations("dashboard.week");
  const zone = useBrowserTimeZone() ?? "UTC";

  if (items.length === 0) {
    return (
      <section aria-labelledby="your-week" className="space-y-3 rounded-2xl border border-dashed border-ccm-midnight/15 bg-white p-5">
        <h2 id="your-week" className="font-heading text-xl font-bold text-ccm-midnight">
          {t("emptyTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
        <div className="flex flex-wrap gap-2">
          {[
            ["/events", t("findEvent")],
            ["/dashboard/submissions", t("shareWork")],
            ["/collaborate?tab=people", t("findPeople")],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-full border border-ccm-midnight/15 px-4 text-sm font-bold text-ccm-midnight hover:bg-ccm-sky/15">
              {label}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  const day = (iso: string) => new Intl.DateTimeFormat(locale, { timeZone: zone, day: "numeric" }).format(new Date(iso));
  const month = (iso: string) => new Intl.DateTimeFormat(locale, { timeZone: zone, month: "short" }).format(new Date(iso));

  return (
    <section aria-labelledby="your-week" className="space-y-3">
      <h2 id="your-week" className="font-heading text-2xl font-bold text-ccm-midnight">
        {t("title")}
      </h2>
      <ul className="divide-y divide-ccm-midnight/10 overflow-hidden rounded-2xl border border-ccm-midnight/10 bg-white">
        {items.map((item) => {
          const isEvent = item.kind === "going" || item.kind === "community";
          const label = item.kind === "changes" ? t("changes") : item.kind === "going" ? t("going") : item.kind === "task" ? t("task") : t("community");
          const tile = isEvent ? (
            <span className={cn("flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5", item.kind === "going" ? "bg-ccm-sea text-white" : "bg-ccm-sky/20 text-ccm-midnight")} aria-hidden>
              <span className="text-[10px] font-bold uppercase">{month(item.startAt)}</span>
              <span className="font-heading text-lg font-bold leading-none">{day(item.startAt)}</span>
            </span>
          ) : (
            <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", item.kind === "changes" ? "bg-ccm-amber/20 text-ccm-midnight" : "bg-muted text-ccm-midnight")} aria-hidden>
              {item.kind === "changes" ? <PencilLine className="size-5" /> : <ListTodo className="size-5" />}
            </span>
          );
          const body = (
            <>
              {tile}
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold uppercase tracking-wide text-ccm-sea">{label}</span>
                <span className="line-clamp-2 font-semibold text-ccm-midnight">
                  <bdi>{item.title ?? ""}</bdi>
                  {isEvent && item.external && <ArrowUpRight className="ms-0.5 inline size-4 align-text-top rtl:-scale-x-100" aria-hidden />}
                </span>
                {item.kind === "task" && <span className="block truncate text-xs text-muted-foreground"><bdi>{item.detail}</bdi></span>}
              </span>
            </>
          );
          const rowClass = "flex min-h-16 items-center gap-3 p-3 transition-colors hover:bg-ccm-sky/10";
          return (
            <li key={`${item.kind}:${item.id}`}>
              {isEvent && item.external ? (
                <a href={item.href} target="_blank" rel="noopener" className={rowClass}>
                  {body}
                  <span className="sr-only"> {t("newTab")}</span>
                </a>
              ) : (
                <Link href={item.href} className={rowClass}>
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
