/**
 * How events show on /events (events spec §3.5). Pure: card mapping, the
 * upcoming rule and month grouping in the visitor's own time zone.
 */
import type { ContentEvent } from "@/lib/content/discovery";

export interface EventTileData {
  id: string;
  title: string;
  startAt: string;
  endAt: string | null;
  mode: "online" | "in_person" | "hybrid";
  place: string | null;
  href: string;
  /** Opens the organiser's own site in a new tab. */
  external: boolean;
  organiser: string | null;
  recordingUrl: string | null;
  image: string | null;
}

const isWebAddress = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

export function toEventTile(e: ContentEvent): EventTileData | null {
  if (!e.startAt || !e.slug) return null;
  const external = e.origin === "external" && isWebAddress(e.url);
  const mode = e.mode === "in_person" || e.mode === "hybrid" ? e.mode : "online";
  return {
    id: e._id,
    title: e.title ?? "",
    startAt: e.startAt,
    endAt: e.endAt ?? null,
    mode,
    place: mode === "online" ? null : (e.place?.text ?? e.locationName ?? null),
    href: external ? (e.url as string) : `/events/${e.slug}`,
    external,
    organiser: e.origin === "external" ? (e.organiser?.name ?? e.organiserName ?? null) : null,
    recordingUrl: isWebAddress(e.recordingUrl) ? e.recordingUrl : null,
    image: e.coverImage?.asset?.url ?? null,
  };
}

/** Still to come, or happening now: not over until its end (or its start, when it has no end). */
export function isUpcoming(e: { startAt: string; endAt: string | null }, now: Date): boolean {
  return new Date(e.endAt ?? e.startAt).getTime() >= now.getTime();
}

/** Months in the visitor's zone, in the order the events come. */
export function groupByMonth<T extends { startAt: string }>(items: T[], locale: string, timeZone: string): Array<{ key: string; label: string; items: T[] }> {
  const label = new Intl.DateTimeFormat(locale, { timeZone, year: "numeric", month: "long" });
  const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit" });
  const groups: Array<{ key: string; label: string; items: T[] }> = [];
  for (const item of items) {
    const date = new Date(item.startAt);
    const key = keyFmt.format(date);
    const last = groups.at(-1);
    if (last && last.key === key) last.items.push(item);
    else groups.push({ key, label: label.format(date), items: [item] });
  }
  return groups;
}
