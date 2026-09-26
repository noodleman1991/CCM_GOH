import type { AuthStrategy } from "payload";
import { prisma, safeQuery } from "@/lib/prisma";
import { hasEditorRole } from "@/payload/access";

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
    //
    // Through `safeQuery`, not bare, for the same reason `getActor()` in
    // lib/authz.ts does: Neon suspends its compute when idle, and the first
    // query after that can fail before the server accepts connections
    // (P1001/P1002, pre-execution — safe to retry). Bare, that cold start
    // denies a legitimate editor with `{ user: null }` and no second attempt;
    // the retry is bounded at one, after 250ms, and only for connection-level
    // failures. A read is idempotent, so retrying it cannot double-apply
    // anything.
    const lookup = await safeQuery(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true },
      }),
    );
    if (!lookup.success) {
      // Deny — but say so. Silent denial on an unreachable database is
      // indistinguishable from "you are not an editor", which is the failure
      // the final review named.
      console.warn(`[payload/clerk-strategy] denying ${userId}: ${lookup.error.message}`);
      return { user: null };
    }
    const actor = lookup.data;
    // A signed-in Clerk user with no Prisma row (never synced / removed) is
    // not a partially-formed Payload user — deny rather than guess a role.
    if (!actor) return { user: null };

    // The mirror in Payload's `users` collection, keyed on the Clerk id.
    const existing = await payload.find({
      collection: "users",
      where: { clerkId: { equals: actor.id } },
      limit: 1,
      overrideAccess: true,
    });
    let doc = existing.docs[0];

    if (!doc) {
      // **Create only for editors.** This runs on every authenticated request
      // to /admin and /payload-api, so creating a row for any signed-in Clerk
      // user is an unbounded write on a read path — 674 accounts exist, and
      // Phase 3 exposes /payload-api publicly. `hasEditorRole` is the same
      // predicate `isEditor` uses, so the set of people who get a Payload user
      // is exactly the set who may use the admin.
      //
      // A non-editor therefore authenticates as nobody and is served by the
      // anonymous access rules, which is what the public read surface is
      // designed around. The one place that would notice is
      // `caseStudyDrafts`' `ownerOrEditor`, if Phase 3 ever routes member
      // autosave through the authenticated REST API rather than the Local API
      // with `overrideAccess: true`. It does not today; if it ever does, this
      // is the line to revisit, and it should be revisited deliberately rather
      // than by leaving the write-on-read open.
      if (!hasEditorRole(actor)) return { user: null };
      doc = await payload.create({
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
      });
    } else {
      // Persist the mirror when Prisma has moved on. Without this the stored
      // `role`/`email` were written once, at creation, and never again —
      // while payload/collections/users.ts documented them as "mirrored from
      // Prisma on every sign-in". Runtime authz was unaffected (the returned
      // user carries the fresh role either way), but the admin's Users list,
      // and anything in Phase 3 reading the persisted document, saw a role
      // that could be years old. Written only on a real difference, so an
      // ordinary request stays a read.
      const email = actor.email ?? `${actor.id}@no-email.clerk.local`;
      if (doc.role !== actor.role || doc.email !== email) {
        doc = await payload.update({
          collection: "users",
          id: doc.id,
          data: { role: actor.role, email },
          overrideAccess: true,
        });
      }
    }

    // Prisma is the source of truth for role — carried through on every
    // request so a revoked role takes effect immediately, even if the write
    // above were to fail. `doc` already carries `collection: "users"`
    // (Payload's generated type for the config.admin.user collection
    // includes it).
    return { user: { ...doc, role: actor.role } };
  },
};
