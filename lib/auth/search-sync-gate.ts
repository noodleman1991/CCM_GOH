import { NextResponse } from "next/server";
import { bearerMatches } from "@/lib/auth/bearer";
import { getActor, isStaff } from "@/lib/authz";
import { liveIndexWritesAllowed } from "@/lib/algolia-indices";

/**
 * Gate for the four `app/api/search/*\/sync` routes — the endpoints that run
 * `replaceAllObjects` against a whole Algolia index.
 *
 * Who may call them: the internal bearer (`INTERNAL_SYNC_SECRET`, sent by
 * `scripts/sync-all-search.js`) or a signed-in **staff** actor
 * (`team_editor | admin`, the Prisma role — see `lib/authz-core.ts`).
 *
 * Hub audit 2026-09-16, H3. The previous check in every route was
 *
 *     if (authHeader !== `Bearer ${internalSecret}` && !userId) return 401
 *
 * which had three holes at once:
 *  (a) `!userId` — ANY signed-in member could trigger a full re-index;
 *  (b) an unset secret interpolated to `Bearer undefined`, which is a header a
 *      caller can send — and CI's build step did send it (production had no
 *      `INTERNAL_SYNC_SECRET`);
 *  (c) GET had no check at all and returned DB/CMS counts to anyone.
 *
 * Order matters: the bearer is checked first so a script call never touches
 * Clerk or the database. Response codes follow the plan's tests: anonymous
 * gets 401, a signed-in non-staff actor gets 403.
 *
 * @returns `null` when the request may proceed, else the response to return.
 */
export async function authorizeSearchSync(request: Request): Promise<NextResponse | null> {
  if (bearerMatches(request.headers.get("authorization"), process.env.INTERNAL_SYNC_SECRET)) {
    return null;
  }

  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isStaff(actor)) {
    return NextResponse.json({ error: "Forbidden: staff only" }, { status: 403 });
  }
  return null;
}

/**
 * Refuse a sync before it writes when this process may not touch the live
 * index (`lib/algolia-indices.ts#liveIndexWritesAllowed`): no
 * `ALGOLIA_INDEX_PREFIX` and not `VERCEL_ENV=production`, i.e. `next dev`, a
 * preview deployment, CI. Until 2026-09-16 nothing in these routes asked, so a
 * preview deploy with the admin key could rewrite production's search.
 *
 * Call it AFTER authorisation (so it discloses nothing to anonymous callers)
 * and BEFORE the first Algolia write.
 *
 * @returns `null` when writes may proceed, else a 503 to return.
 */
export function refuseUnlessLiveIndexWritesAllowed(): NextResponse | null {
  if (liveIndexWritesAllowed()) return null;
  return NextResponse.json(
    {
      error:
        "Refusing to write to the live search index from this environment. " +
        "Only the Vercel production deployment may sync unprefixed indices; " +
        "set ALGOLIA_INDEX_PREFIX to sync into a scratch index instead.",
    },
    { status: 503 }
  );
}
