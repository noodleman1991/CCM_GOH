"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { verifyTurnstile, turnstileConfigured } from "@/lib/turnstile";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { ipActorKey } from "@/lib/rate-limit-actor";
import { connectedEmail } from "@/lib/collaborate/connection";

export type RevealResult = { ok: true; email: string } | { ok: false; error: "notHuman" | "unavailable" | "notShared" | "tooMany" };

/**
 * A member's email, on request, to a human (user, 2026-10-05): emails are never
 * in a page — a click, a Cloudflare Turnstile check, then this. Given only when
 * the member chose to show it (and their profile is visible to the viewer) or
 * the two are connected. Rate-limited per member, or per address for visitors.
 */
export async function revealContactEmail(input: { profileUserId: string; token: string }): Promise<RevealResult> {
  if (!turnstileConfigured()) return { ok: false, error: "unavailable" };
  if (!(await verifyTurnstile(input.token))) return { ok: false, error: "notHuman" };

  const actor = await getActor();
  try {
    await assertRateLimit(actor?.id ?? ipActorKey(await headers()), "contact:reveal-email", { limit: 30, windowSeconds: 3600 });
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, error: "tooMany" };
    throw e;
  }

  if (actor) {
    const viaConnection = await connectedEmail(actor.id, input.profileUserId);
    if (viaConnection) return { ok: true, email: viaConnection };
  }
  const user = await prisma.user.findUnique({
    where: { id: input.profileUserId },
    select: { email: true, showEmail: true, profileVisibility: true },
  });
  const visible = user?.profileVisibility === "PUBLIC" || (user?.profileVisibility === "MEMBERS" && !!actor);
  if (user?.email && user.showEmail && visible) return { ok: true, email: user.email };
  return { ok: false, error: "notShared" };
}
