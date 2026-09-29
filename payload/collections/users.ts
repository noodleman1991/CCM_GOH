import type { CollectionConfig } from "payload";
import { clerkStrategy } from "@/payload/auth/clerk-strategy";
import { isAdmin, isEditor } from "@/payload/access";

/**
 * Clerk remains the sole identity system (spec D4) — nobody signs up in
 * Payload. This collection exists so Payload has something to attach a
 * session to; `disableLocalStrategy` removes email/password signup and login,
 * and `clerkStrategy` populates documents from an existing Clerk session
 * (see payload/auth/clerk-strategy.ts).
 *
 * **A row exists only for editors** (`team_editor`/`admin`). The strategy runs
 * on every authenticated request to /admin and /payload-api, so mirroring
 * every signed-in Clerk user would be an unbounded write on a read path across
 * 674 accounts. A non-editor authenticates as nobody and is served by the
 * anonymous access rules; this table is therefore a roster of CMS users, not a
 * copy of the user base.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: {
    disableLocalStrategy: true,
    strategies: [clerkStrategy],
  },
  admin: {
    group: "Settings",
    // Not an editorial surface: hidden from the nav for everyone but admins.
    hidden: ({ user }) => (user as { role?: string } | null)?.role !== "admin",
    useAsTitle: "email",
    defaultColumns: ["email", "role", "clerkId"],
  },
  access: {
    // Gates entry to the /admin panel itself. Without this, Payload's
    // default canAccessAdmin only checks "does this user belong to the
    // designated admin-user collection" — ANY signed-in Payload user,
    // including community_member, would reach the dashboard shell. isEditor
    // (team_editor | admin) is the CMS-editing gate established in
    // payload/access/index.ts; community_editor and community_member stay
    // out. Wrapped (rather than passed directly) because `access.admin`'s
    // type requires a plain boolean return, while `Access` more broadly
    // allows a `Where` query — isEditor never returns one in practice.
    admin: ({ req }) => Boolean(isEditor({ req })),
    // Only admins manage user documents directly through the admin UI — the
    // clerk strategy itself writes with overrideAccess: true and is
    // unaffected by these rules.
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      // disableLocalStrategy:true (a plain boolean, not { enableFields }) means
      // Payload does NOT auto-add its usual email/password/session fields —
      // this collection needs its own email field, both for admin's
      // useAsTitle and because payload.create() requires a value for it.
      name: "email",
      type: "email",
      required: true,
      unique: true,
      admin: {
        readOnly: true,
        description: "Mirrored from Prisma's User.email (or a placeholder); the Clerk auth strategy rewrites it whenever Prisma's differs.",
      },
    },
    {
      name: "clerkId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Clerk user id (also the Prisma User.id). Set by the Clerk auth strategy.",
      },
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "community_member",
      // Exactly Prisma's Role enum — see payload/access/index.ts.
      options: [
        { label: "Community member", value: "community_member" },
        { label: "Community editor", value: "community_editor" },
        { label: "Team editor", value: "team_editor" },
        { label: "Admin", value: "admin" },
      ],
      admin: {
        readOnly: true,
        description: "Mirrored from Prisma's User.role; the Clerk auth strategy rewrites it whenever Prisma's differs. Prisma stays the source of truth for authz — not editable here.",
      },
    },
  ],
};
