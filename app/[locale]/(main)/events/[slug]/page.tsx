import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, CalendarPlus, Video } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FEATURES } from "@/lib/features";
import { fetchEventBySlug } from "@/lib/events";
import { goingCount, listRsvpsForOrganiser } from "@/lib/actions/rsvp";
import { RsvpButton } from "@/components/events/rsvp-button";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { ShareButton } from "@/components/events/share-button";
import { CommentIsland } from "@/components/comments/comment-island";
import { JsonLd, eventJsonLd } from "@/lib/seo/json-ld";
import { siteUrl } from "@/lib/seo/site-url"
import { StaffEditLink } from "@/components/cms/staff-edit-link";
import { BackLink } from "@/components/ui/back-link";
import { LocalWhen } from "@/components/events/local-when";

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
 *
 * Open to everyone (events spec 2026-09-30) — only RSVP and the attendee list
 * wait for the engagement switch. Another organisation's event sends people to
 * its own website instead of an RSVP.
 */
export default async function EventPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [event, { userId }, t] = await Promise.all([
    fetchEventBySlug(slug),
    auth(),
    getTranslations({ locale, namespace: "events" }),
  ]);
  if (!event || !event.title) notFound();

  const external = event.origin === "external";
  const website = event.url && /^https?:\/\//i.test(event.url) ? event.url : null;
  const organiser = external ? (event.organiser?.name ?? event.organiserName ?? null) : null;
  const rsvp = FEATURES.engagement && !external;
  const going = rsvp ? await goingCount(event._id) : 0;
  // Organiser-only attendee list (the action itself enforces submittedBy/staff).
  const attendees = rsvp && userId ? await listRsvpsForOrganiser(event._id) : { ok: false as const, error: "" };
  const start = event.startAt ? new Date(event.startAt) : null;
  // eslint-disable-next-line react-hooks/purity -- async server component (force-dynamic): rendered once per request, so reading the clock here is stable for the render
  const isPast = start ? start.getTime() < Date.now() : false;

  const modeLabel =
    event.mode === "online" ? t("modeOnline") : event.mode === "in_person" ? t("modeInPerson") : event.mode === "hybrid" ? t("modeHybrid") : null;

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      <BackLink href="/events" label={t("suggest.back")} />
      <StaffEditLink collection="events" id={String(event._id ?? "")} from={`/${locale}/events/${slug}`} />
      <JsonLd
        data={eventJsonLd({
          name: event.title,
          description: event.description ?? undefined,
          url: `${siteUrl()}/${locale}/events/${slug}`,
          startDate: event.startAt ?? null,
          endDate: event.endAt ?? null,
          locationName: event.locationName ?? null,
          isOnline: event.mode === "online",
        })}
      />
      {/* Hero — navy band with the date block */}
      <section className="rounded-2xl bg-gradient-to-br from-ccm-midnight to-ccm-sea p-6 text-white sm:p-8">
        <div className="flex items-start gap-5">
          {/* Date and time in the visitor's own zone (filled in by the browser). */}
          {event.startAt && (
            <div className="flex min-h-14 min-w-12 flex-none flex-col rounded-xl bg-white px-3.5 py-2 text-center text-ccm-midnight">
              <LocalWhen iso={event.startAt} locale={locale} options={{ month: "short" }} className="text-[10px] font-bold uppercase tracking-widest text-ccm-sea" />
              <LocalWhen iso={event.startAt} locale={locale} options={{ day: "numeric" }} className="font-heading text-2xl font-bold leading-tight" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold text-balance text-white sm:text-3xl">
              <bdi>{event.title}</bdi>
            </h1>
            {event.startAt && (
              <p className="mt-1.5 min-h-5 text-sm text-ccm-sky">
                <LocalWhen
                  iso={event.startAt}
                  locale={locale}
                  options={{ weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }}
                />
              </p>
            )}
            {organiser && (
              <p className="mt-1 text-sm text-white/85">
                {t("organisedBy", { name: organiser })}
              </p>
            )}
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

      {/* CTA row — RSVP (or the organiser's website) is the primary until the event passes */}
      <div className="flex flex-wrap items-center gap-2.5">
        {!isPast && rsvp && <RsvpButton eventId={event._id} />}
        {!isPast && external && website && (
          <Button asChild className="min-h-[44px] gap-1.5 rounded-full">
            <a href={website} target="_blank" rel="noopener">
              {t("goToWebsite")}
              <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden />
              <span className="sr-only"> {t("list.newTab")}</span>
            </a>
          </Button>
        )}
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
        {rsvp && <span className="text-sm text-muted-foreground">{t("goingCount", { count: going })}</span>}
      </div>

      {/* dir="auto": a description in another language than the page keeps its own direction. */}
      {event.description && (
        <p dir="auto" className="text-lg leading-relaxed text-foreground/90">
          {event.description}
        </p>
      )}

      {/* Editorial body — same blocks as every content page (X1 renderer) */}
      {Array.isArray(event.body) && event.body.length > 0 && (
        <PortableTextRenderer value={event.body as never} locale={locale} />
      )}

      {/* Organiser view: who's coming */}
      {attendees.ok && (
        <section className="rounded-xl border bg-muted/20 p-5">
          <h2 className="font-heading text-lg font-semibold text-ccm-midnight">
            {t("attendeesHeading", { count: attendees.going.length })}
          </h2>
          {attendees.going.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {attendees.going.map((a) => (
                <li key={`${a.username}-${a.name}`} className="rounded-full bg-white px-3 py-1 text-sm shadow-sm">
                  <bdi>{a.name}</bdi>
                  {a.username && <span className="ms-1 text-xs text-muted-foreground">@{a.username}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("attendeesNone")}</p>
          )}
          {attendees.interested > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">{t("attendeesInterested", { count: attendees.interested })}</p>
          )}
        </section>
      )}

      {/* Community discussion — the same moderated engine as every content page */}
      {event._id && <CommentIsland targetType="event" targetId={event._id} />}

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
