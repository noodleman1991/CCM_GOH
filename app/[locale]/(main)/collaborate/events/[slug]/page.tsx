import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { CalendarPlus, Share2, Video } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import { fetchEventBySlug } from "@/lib/events";
import { goingCount } from "@/lib/actions/rsvp";
import { RsvpButton } from "@/components/events/rsvp-button";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { ShareButton } from "@/components/events/share-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  return { title: event?.title ?? "Event", description: event?.description ?? undefined };
}

/**
 * Public event page (experience-plan X6, mock F): a page worth sharing.
 * Date-block hero, RSVP + add-to-calendar + share, then the same editorial
 * body blocks as every other content page. When a recording lands the hero
 * flips into recap mode.
 */
export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  if (!FEATURES.engagement) redirect("/");
  const { locale, slug } = await params;
  const [event, { userId }, t] = await Promise.all([
    fetchEventBySlug(slug),
    auth(),
    getTranslations({ locale, namespace: "events" }),
  ]);
  if (!event || !event.title) notFound();

  const going = await goingCount(event._id);
  const start = event.startAt ? new Date(event.startAt) : null;
  const isPast = start ? start.getTime() < Date.now() : false;
  const day = start?.toLocaleDateString(locale, { day: "numeric" });
  const month = start?.toLocaleDateString(locale, { month: "short" });
  const timeLine = start
    ? start.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) +
      " · " +
      start.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
    : null;

  const modeLabel =
    event.mode === "online" ? t("modeOnline") : event.mode === "in_person" ? t("modeInPerson") : event.mode === "hybrid" ? t("modeHybrid") : null;

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      {/* Hero — navy band with the date block */}
      <section className="rounded-2xl bg-gradient-to-br from-ccm-midnight to-ccm-sea p-6 text-white sm:p-8">
        <div className="flex items-start gap-5">
          {start && (
            <div className="flex-none rounded-xl bg-white px-3.5 py-2 text-center text-ccm-midnight">
              <div className="text-[10px] font-bold uppercase tracking-widest text-ccm-sea">{month}</div>
              <div className="font-heading text-2xl font-bold leading-tight">{day}</div>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold text-balance sm:text-3xl">
              <bdi>{event.title}</bdi>
            </h1>
            {timeLine && <p className="mt-1.5 text-sm text-ccm-sky">{timeLine}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {modeLabel && <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{modeLabel}</span>}
              {event.locationName && (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                  <bdi>{event.locationName}</bdi>
                </span>
              )}
              {isPast && <span className="rounded-full bg-ccm-amber px-2.5 py-1 text-[11px] font-bold">{t("pastEvent")}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* CTA row — RSVP is the primary until the event passes */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!isPast && <RsvpButton eventId={event._id} />}
        {!isPast && (
          <Button asChild variant="outline" className="min-h-[44px] gap-1.5 rounded-full">
            {/* Plain anchor: an API download, not a locale route. */}
            <a href={`/api/events/${slug}/ics`}>
              <CalendarPlus className="size-4" aria-hidden />
              {t("addToCalendar")}
            </a>
          </Button>
        )}
        <ShareButton title={event.title} label={t("share")} copiedLabel={t("linkCopied")} />
        {event.recordingUrl && (
          <Button asChild className="min-h-[44px] gap-1.5 rounded-full">
            <a href={event.recordingUrl} target="_blank" rel="noopener noreferrer">
              <Video className="size-4" aria-hidden />
              {t("watchRecording")}
            </a>
          </Button>
        )}
        <span className="text-sm text-muted-foreground">{t("goingCount", { count: going })}</span>
      </div>

      {event.description && <p className="text-lg leading-relaxed text-foreground/90">{event.description}</p>}

      {/* Editorial body — same blocks as every content page (X1 renderer) */}
      {Array.isArray(event.body) && event.body.length > 0 && (
        <PortableTextRenderer value={event.body as never} locale={locale} />
      )}

      {event.relatedCollaboration && (
        <p className="text-sm text-muted-foreground">
          {t("partOf")}{" "}
          <Link href={`/collaborations/${event.relatedCollaboration}`} className="font-bold text-ccm-sea underline underline-offset-2">
            {t("theProject")}
          </Link>
        </p>
      )}
    </div>
  );
}
