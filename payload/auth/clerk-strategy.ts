import type { AuthStrategy } from "payload";
import { prisma } from "@/lib/prisma";

/**
 * Clerk is the sole identity system (spec D4). Nobody signs up in Payload —
 * this strategy maps an existing Clerk session onto a Payload user so the
 * admin panel has something to authorise against.
 *
 * Mirrors `getActor()` in lib/authz.ts deliberately, including its two
 * hard-won details:
 *   1. `auth()` THROWS outside a clerkMiddleware request context. Catch it and
 *      read that as anonymous — an uncaught throw becomes a 500 on every
 *      admin request.
 *   2. The role comes from Prisma's `User.role`, not the Clerk session claim.
 *      The vocabularies diverge and utils/roles.ts must not back new authz.
 *
 * `@clerk/nextjs/server` is imported lazily, INSIDE the try below, rather than
 * at module top level. Its ESM build resolves a Next.js app-router-only
 * subpath internally, which ERR_MODULE_NOT_FOUNDs in a plain Node process —
 * exactly the process the Payload CLI and the standalone import scripts run
 * in (they call the Local API via getPayload({ config}), never through
 * Next). A top-level import would make payload.config.ts itself unloadable
 * outside Next, breaking `payload migrate`, `generate:types`, and every
 * import script. Because the import is inside this try/catch, a failed
 * *import* is caught the same way a failed `auth()` call is: read as
 * anonymous, never thrown. The admin panel itself always runs inside Next,
 * where this import resolves normally, so request-time behaviour is
 * unchanged.
 *
 * Returning `{ user: null }` denies access; it must never throw.
 */
export const clerkStrategy: AuthStrategy = {
  name: "clerk",
  authenticate: async ({ payload }) => {
    let userId: string | null = null;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      ({ userId } = await auth());
    } catch {
      return { user: null };
    }
    if (!userId) return { user: null };

    // Prisma's User has no `name` field (firstName/lastName instead) — select
    // only what the Payload users collection actually stores.
    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });
    // A signed-in Clerk user with no Prisma row (never synced / removed) is
    // not a partially-formed Payload user — deny rather than guess a role.
    if (!actor) return { user: null };

    // Mirror into Payload's users collection so relationships and the admin
    // UI have a real document to point at. Keyed on the Clerk id, so this is
    // idempotent across sessions.
    const existing = await payload.find({
      collection: "users",
      where: { clerkId: { equals: actor.id } },
      limit: 1,
      overrideAccess: true,
    });

    const doc =
      existing.docs[0] ??
      (await payload.create({
        collection: "users",
        data: {
          clerkId: actor.id,
          role: actor.role,
          // Payload's auth collections require an email; Prisma's is
          // optional. Fall back to a stable placeholder tied to the Clerk id
          // rather than failing the create outright.
          email: actor.email ?? `${actor.id}@no-email.clerk.local`,
        },
        overrideAccess: true,
      }));

    // Prisma is the source of truth for role — refresh it on every request so
    // a revoked role takes effect immediately rather than at next signup.
    // `doc` already carries `collection: "users"` (Payload's generated type
    // for the config.admin.user collection includes it).
    return { user: { ...doc, role: actor.role } };
  },
};
