"use client";

import { useTranslations } from "next-intl";
import { ArrowUpRight, Globe, MapPin, PlayCircle, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { EventTileData } from "@/lib/events/listing";
import { cn } from "@/lib/utils";

const MODE_ICON = { online: Globe, in_person: MapPin, hybrid: Users } as const;

/** When it happens, in the visitor's zone: a time range on one day, a date range across days. */
function whenText(e: EventTileData, locale: string, timeZone: string): string {
  const start = new Date(e.startAt);
  const end = e.endAt ? new Date(e.endAt) : null;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" });
  if (end && day.format(start) !== day.format(end)) {
    return new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "short" }).formatRange(start, end);
  }
  const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "numeric", minute: "2-digit" });
  return end && end > start ? time.formatRange(start, end) : time.format(start);
}

/**
 * One event on /events (events spec §3.5): date block · CCM / External badge ·
 * title · when and where. Outside events open the organiser's site in a new tab.
 */
export function EventTile({ event, locale, timeZone, past = false }: { event: EventTileData; locale: string; timeZone: string | null; past?: boolean }) {
  const t = useTranslations("events.list");
  const zone = timeZone ?? "UTC";
  const start = new Date(event.startAt);
  const Mode = MODE_ICON[event.mode];
  const where = event.mode === "online" ? t("online") : event.place;
  const title = <bdi>{event.title}</bdi>;
  // Upcoming tiles sit under a month heading (h3); past ones straight under "Past events" (h2).
  const Heading = past ? "h3" : "h4";
  const stretch = "after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none";

  return (
    <article
      className={cn(
        "relative flex gap-4 rounded-2xl border border-ccm-midnight/10 bg-white p-4 transition-colors",
        "hover:border-ccm-sea/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ccm-sea",
        past && "bg-white/70",
      )}
    >
      <div
        className={cn(
          "flex w-14 shrink-0 flex-col items-center justify-center self-start rounded-xl py-2",
          past ? "bg-muted text-muted-foreground" : "bg-ccm-sky/20 text-ccm-midnight",
        )}
        aria-hidden
      >
        <span className="text-xs font-bold uppercase">{new Intl.DateTimeFormat(locale, { timeZone: zone, month: "short" }).format(start)}</span>
        <span className="font-heading text-2xl font-bold leading-none">{new Intl.DateTimeFormat(locale, { timeZone: zone, day: "numeric" }).format(start)}</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {event.external ? (
            <span className="rounded-full bg-ccm-amber/20 px-2 py-0.5 font-bold text-ccm-midnight">{t("external")}</span>
          ) : (
            <span className="rounded-full bg-ccm-sea/10 px-2 py-0.5 font-bold text-ccm-sea">{t("ccm")}</span>
          )}
          {event.organiser && (
            <span className="min-w-0 truncate text-muted-foreground">
              {t("organisedBy", { name: event.organiser })}
            </span>
          )}
        </div>

        <Heading className="line-clamp-3 font-heading text-base font-bold leading-snug text-ccm-midnight">
          {event.external ? (
            <a href={event.href} target="_blank" rel="noopener" className={stretch}>
              {title}
              <ArrowUpRight className="ms-0.5 inline size-4 align-text-top text-ccm-sea rtl:-scale-x-100" aria-hidden />
              <span className="sr-only"> {t("newTab")}</span>
            </a>
          ) : (
            <Link href={event.href} className={stretch}>
              {title}
            </Link>
          )}
        </Heading>

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <time dateTime={event.startAt} className="min-w-16">{timeZone ? whenText(event, locale, timeZone) : null}</time>
          {where && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Mode className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{where}</span>
            </span>
          )}
        </p>

        {past && event.recordingUrl && (
          <a
            href={event.recordingUrl}
            target="_blank"
            rel="noopener"
            className="relative z-10 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-ccm-sea hover:underline"
          >
            <PlayCircle className="size-4" aria-hidden />
            {t("watchRecording")}
            <span className="sr-only"> {t("newTab")}</span>
          </a>
        )}
      </div>
    </article>
  );
}
