"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { client } from "@/sanity/lib/client";
import type { RsvpStatus } from "@/generated/prisma";

type Result<T = {}> = ({ ok: true } & T) | { ok: false; error: string };

const statusSchema = z.enum(["GOING", "INTERESTED", "NOT_GOING"]);

/** Confirm the event exists and is approved (only approved events take RSVPs). */
async function eventIsApproved(eventId: string): Promise<boolean> {
  const ok = await client.fetch<string | null>(
    `*[_type == "event" && _id == $id && status == "approved"][0]._id`,
    { id: eventId }
  );
  return !!ok;
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

  if (!(await eventIsApproved(eventId))) return { ok: false, error: "Event not available." };

  await prisma.rsvp.upsert({
    where: { userId_eventId: { userId: actor.id, eventId } },
    create: { userId: actor.id, eventId, status: parsed.data as RsvpStatus },
    update: { status: parsed.data as RsvpStatus },
  });
  return { ok: true, status: parsed.data as RsvpStatus };
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
