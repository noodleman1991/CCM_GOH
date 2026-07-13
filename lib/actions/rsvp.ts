"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor, isStaff } from "@/lib/authz";
import { client } from "@/sanity/lib/client";
import { createNotification } from "@/lib/notifications/service";
import type { RsvpStatus } from "@/generated/prisma";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const statusSchema = z.enum(["GOING", "INTERESTED", "NOT_GOING"]);

/** The approved event's receipt fields (null when missing/unapproved —
 *  only approved events take RSVPs). */
async function approvedEventMeta(
  eventId: string
): Promise<{ _id: string; title: string | null; startAt: string | null; slug: string | null; submittedBy: string | null } | null> {
  return client.fetch(
    `*[_type == "event" && _id == $id && status == "approved"][0]{
      _id, title, startAt, "slug": slug.current, submittedBy
    }`,
    { id: eventId }
  );
}

/** RSVP to an event (idempotent on (user, event)). */
export async function setRsvp(
  eventId: string,
  status: "GOING" | "INTERESTED" | "NOT_GOING" = "GOING"
): Promise<Result<{ status: RsvpStatus }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to RSVP." };
  if (!z.string().min(1).safeParse(eventId).success) return { ok: false, error: "Invalid event." };
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status." };

  const event = await approvedEventMeta(eventId);
  if (!event) return { ok: false, error: "Event not available." };

  const previous = await prisma.rsvp.findUnique({
    where: { userId_eventId: { userId: actor.id, eventId } },
    select: { status: true },
  });
  await prisma.rsvp.upsert({
    where: { userId_eventId: { userId: actor.id, eventId } },
    create: { userId: actor.id, eventId, status: parsed.data as RsvpStatus },
    update: { status: parsed.data as RsvpStatus },
  });

  // Receipt: confirm the spot in the attendee's own feed (fires on the first
  // GOING only — status flip-flops don't spam). actorId stays null so the
  // self-notification guard doesn't swallow it.
  if (parsed.data === "GOING" && previous?.status !== "GOING") {
    const when = event.startAt
      ? new Date(event.startAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
    await createNotification({
      recipientId: actor.id,
      type: "EVENT_REMINDER",
      actorId: null,
      entityType: "event",
      entityId: event.slug ?? eventId,
      snippet: `You're going to "${event.title ?? "an event"}"${when ? ` — ${when}` : ""}`,
    });
  }
  return { ok: true, status: parsed.data as RsvpStatus };
}

/** Attendee list — organiser (submittedBy) or staff only. Grouped by status. */
export async function listRsvpsForOrganiser(
  eventId: string
): Promise<Result<{ going: { name: string; username: string | null }[]; interested: number }>> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const event = await approvedEventMeta(eventId);
  if (!event) return { ok: false, error: "Event not available." };
  if (event.submittedBy !== actor.id && !isStaff(actor)) return { ok: false, error: "Not permitted." };

  const rows = await prisma.rsvp.findMany({
    where: { eventId, status: { in: ["GOING", "INTERESTED"] } },
    select: {
      status: true,
      user: { select: { firstName: true, lastName: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const going = rows
    .filter((r) => r.status === "GOING")
    .map((r) => ({
      name: [r.user.firstName, r.user.lastName].filter(Boolean).join(" ") || r.user.username || "Member",
      username: r.user.username,
    }));
  const interested = rows.filter((r) => r.status === "INTERESTED").length;
  return { ok: true, going, interested };
}

/** Remove the current user's RSVP. No-op if none. */
export async function clearRsvp(eventId: string): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  await prisma.rsvp.deleteMany({ where: { userId: actor.id, eventId } });
  return { ok: true };
}

/** The current user's RSVP status for an event (null if none / anonymous). */
export async function myRsvp(eventId: string): Promise<RsvpStatus | null> {
  const actor = await getActor();
  if (!actor) return null;
  const row = await prisma.rsvp.findUnique({
    where: { userId_eventId: { userId: actor.id, eventId } },
    select: { status: true },
  });
  return row?.status ?? null;
}

/** Count of GOING RSVPs for an event (for the public count). */
export async function goingCount(eventId: string): Promise<number> {
  return prisma.rsvp.count({ where: { eventId, status: "GOING" } });
}
