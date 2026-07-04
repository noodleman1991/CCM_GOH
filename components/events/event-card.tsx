import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Globe, Users } from "lucide-react";
import { RsvpButton } from "@/components/events/rsvp-button";
import type { EventListItem } from "@/lib/events";

const MODE_ICON = { online: Globe, in_person: MapPin, hybrid: Users } as const;

/**
 * Event card (WIREFRAMES §4.6): a date block · scope chip · title · meta · RSVP.
 * `signedIn` gates the RSVP control. `labels` are passed from the server parent
 * (this is a server component, so it can't call useTranslations directly without
 * a provider — labels keep it provider-free, matching the codebase pattern).
 */
export function EventCard({
  event,
  signedIn,
  labels,
}: {
  event: EventListItem;
  signedIn: boolean;
  labels: { community: string; project: string; modeOnline: string; modeInPerson: string; modeHybrid: string };
}) {
  const start = event.startAt ? new Date(event.startAt) : null;
  const Mode = event.mode ? MODE_ICON[event.mode] : null;
  const modeLabel =
    event.mode === "in_person" ? labels.modeInPerson : event.mode === "hybrid" ? labels.modeHybrid : labels.modeOnline;

  return (
    <Card className="flex gap-4 p-4">
      {/* Date block */}
      <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-ccm-sky/15 py-2 text-ccm-midnight">
        {start ? (
          <>
            <span className="text-xs font-medium uppercase">
              {start.toLocaleString(undefined, { month: "short" })}
            </span>
            <span className="text-xl font-bold leading-none">{start.getDate()}</span>
          </>
        ) : (
          <span className="text-xs">—</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {event.scope === "project" ? labels.project : labels.community}
          </Badge>
          {Mode && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Mode className="size-3" />
              {modeLabel}
            </span>
          )}
        </div>
        {event.slug ? (
          <Link
            href={`/collaborate/events/${event.slug}`}
            className="block truncate font-heading font-semibold text-ccm-midnight underline-offset-2 hover:underline"
          >
            <bdi>{event.title}</bdi>
          </Link>
        ) : (
          <h3 className="truncate font-heading font-semibold text-ccm-midnight">{event.title}</h3>
        )}
        <p className="mt-0.5 text-xs text-muted-foreground">
          {start && start.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          {event.locationName ? ` · ${event.locationName}` : ""}
        </p>
        {event.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
        )}
        {signedIn && (
          <div className="mt-3">
            <RsvpButton eventId={event._id} />
          </div>
        )}
      </div>
    </Card>
  );
}
