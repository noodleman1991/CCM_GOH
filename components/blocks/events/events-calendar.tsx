import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { stegaClean } from "next-sanity";
import SectionContainer from "@/components/ui/section-container";
import { fetchApprovedEvents } from "@/lib/events";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import EventsCalendarClient, { type EventsCalendarLabels } from "./events-calendar-client";

type EventsCalendarProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "events-calendar" }
> & {
  locale?: string;
};

/**
 * Events calendar homepage block (server). Fetches approved events
 * (lib/events.ts fetchApprovedEvents — server-only), resolves the viewer's
 * signed-in state to gate the inline RSVP, and resolves i18n labels server-side
 * (provider-free, mirroring event-card.tsx). All interactivity — the month grid,
 * paging, RSVP, and the iCal download — lives in the client child.
 */
export default async function EventsCalendar({
  padding,
  title,
  description,
  upcomingLimit,
  locale = "en",
}: EventsCalendarProps) {
  const supportedLocale = locale as "en" | "es" | "fr" | "ar";
  const [events, { userId }, t] = await Promise.all([
    fetchApprovedEvents(),
    auth(),
    getTranslations({ locale: supportedLocale, namespace: "events" }),
  ]);

  const labels: EventsCalendarLabels = {
    community: t("scopeCommunity"),
    project: t("scopeProject"),
    modeOnline: t("modeOnline"),
    modeInPerson: t("modeInPerson"),
    modeHybrid: t("modeHybrid"),
    upcomingHeading: t("upcomingHeading"),
    subscribe: t("subscribe"),
    noUpcoming: t("noUpcoming"),
    prevMonth: t("prevMonth"),
    nextMonth: t("nextMonth"),
    today: t("today"),
  };

  return (
    <SectionContainer padding={padding}>
      <EventsCalendarClient
        events={events}
        signedIn={!!userId}
        labels={labels}
        title={stegaClean(title)}
        description={stegaClean(description)}
        upcomingLimit={stegaClean(upcomingLimit)}
        locale={supportedLocale}
      />
    </SectionContainer>
  );
}
