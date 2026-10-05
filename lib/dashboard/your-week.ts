/** The dashboard's "Your week" (dashboard spec D2): what needs you, then what's coming, soonest first. Pure. */
import type { EventTileData } from "@/lib/events/listing";
import type { Contribution } from "@/lib/contributions/model";

export type WeekItem =
  | { kind: "changes"; id: string; title: string | null; contributionKind: Contribution["kind"]; href: string }
  | { kind: "going"; id: string; title: string; startAt: string; href: string; external: boolean }
  | { kind: "task"; id: string; title: string; detail: string; href: string }
  | { kind: "community"; id: string; title: string; startAt: string; href: string; external: boolean };

export function buildYourWeek(input: {
  going: EventTileData[];
  community: EventTileData[];
  tasks: Array<{ id: string; title: string; collaborationId: string; collaborationTitle: string }>;
  changes: Contribution[];
  now: Date;
  limit?: number;
}): WeekItem[] {
  const limit = input.limit ?? 6;
  const byStart = (a: { startAt: string }, b: { startAt: string }) => a.startAt.localeCompare(b.startAt);
  const changes: WeekItem[] = input.changes
    .filter((c) => c.status === "revision" && c.editHref)
    .map((c) => ({ kind: "changes", id: c.id, title: c.title, contributionKind: c.kind, href: c.editHref! }));
  const going: WeekItem[] = [...input.going].sort(byStart).map((e) => ({ kind: "going", id: e.id, title: e.title, startAt: e.startAt, href: e.href, external: e.external }));
  const tasks: WeekItem[] = input.tasks.map((t) => ({ kind: "task", id: t.id, title: t.title, detail: t.collaborationTitle, href: `/collaborations/${t.collaborationId}?tab=plan` }));
  // Nothing on your calendar: your community's next event, as an invitation.
  const invite: WeekItem[] =
    going.length === 0 && input.community.length > 0
      ? [[...input.community].sort(byStart)[0]].map((e) => ({ kind: "community", id: e.id, title: e.title, startAt: e.startAt, href: e.href, external: e.external }))
      : [];
  return [...changes, ...going, ...tasks, ...invite].slice(0, limit);
}
