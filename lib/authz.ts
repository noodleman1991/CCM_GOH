import "server-only";
import { auth } from "@clerk/nextjs/server";
import { prisma, safeQuery } from "@/lib/prisma";
import type { Actor } from "./authz-core";

/**
 * Server-bound part of the authz core: resolving the current actor from Clerk +
 * Prisma. The pure capability matrix lives in `./authz-core` (no server-only
 * deps) so it can be unit-tested. Re-export the pure API for convenience.
 */
export * from "./authz-core";

/**
 * Resolve the current actor from the Clerk session. Returns `null` for
 * anonymous callers. Degrades to `null` (never throws) if the DB lookup fails,
 * so a transient DB issue reads as "not authorized" rather than a 500.
 *
 * Reads the Prisma `User.role` (NOT the Clerk claim in `utils/roles.ts` —
 * the two role vocabularies diverge; `checkRole()` is for existing
 * session-gated UI only and must not back new authz).
 */
export async function getActor(): Promise<Actor> {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    // auth() throws outside a clerkMiddleware request context — notably during
    // static prerender/export of force-static pages (e.g. /legal/*) when a
    // layout calls getActor(). Anonymous is the correct answer there.
    return null;
  }
  if (!userId) return null;

  const result = await safeQuery(() =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    })
  );

  if (!result.success || !result.data) return null;
  return { id: result.data.id, role: result.data.role };
}
