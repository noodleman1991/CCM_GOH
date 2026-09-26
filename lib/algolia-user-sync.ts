import { prisma } from '@/lib/prisma'
import { algoliaClient, ALGOLIA_INDICES, transformUserForIndex, shouldIndexUser } from '@/lib/algolia'
import { liveIndexWritesAllowed, writeIndexName } from '@/lib/algolia-indices'

/**
 * Write or remove ONE user's record in the Algolia `users` index.
 *
 * This is the function the Clerk webhook, the profile route and the onboarding
 * route call directly — inside `after()`, so the response is not held up and a
 * failure is logged rather than swallowed. Until 2026-09-16 each of them fired
 * an un-awaited `fetch` at `${NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
 * /api/search/users/webhook` with only a `.catch` on the network error: a 401
 * (the caller had no `SEARCH_WEBHOOK_SECRET`) or a 404 (base URL unset in
 * production, so the hop went to `localhost:3000`) resolved successfully and
 * nothing was ever logged (audit finding H5). An HTTP hop to ourselves buys
 * nothing here — the index write is a few milliseconds of Node code.
 *
 * `/api/search/users/webhook` remains as the HTTP face of the same operation
 * for external callers and delegates here, so there is one implementation.
 *
 * Outcomes: `indexed` (record saved), `removed` (record deleted — user gone,
 * opted out, or unindexable), `skipped` (Algolia not configured, or this
 * process may not write to the live index — see `liveIndexWritesAllowed`).
 * Algolia failures are thrown to the caller, who is expected to log them.
 */
export type UserIndexAction = 'update' | 'delete'
export type UserIndexOutcome = 'indexed' | 'removed' | 'skipped'

export async function syncUserSearchRecord(
  userId: string,
  action: UserIndexAction = 'update',
): Promise<UserIndexOutcome> {
  // Same guard as the Payload search-sync hook: outside Vercel production an
  // unprefixed write would land on the index the live site searches — from
  // `next dev` against the dev database with the production key in `.env`.
  if (!liveIndexWritesAllowed()) {
    console.warn(
      '[user-index] not Vercel production and ALGOLIA_INDEX_PREFIX is unset — ' +
        'refusing to write to the live users index. Set a prefix to sync to a scratch index.',
    )
    return 'skipped'
  }

  // Bound to a local so the narrowing holds inside `remove` below.
  const client = algoliaClient
  if (!client) {
    console.warn('[user-index] Algolia not configured — skipping')
    return 'skipped'
  }

  const indexName = writeIndexName(ALGOLIA_INDICES.USERS)
  const remove = async (): Promise<UserIndexOutcome> => {
    await client.deleteObject({ indexName, objectID: userId })
    return 'removed'
  }

  if (action === 'delete') return remove()

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      communityMemberships: {
        include: { community: { select: { name: true, type: true } } },
      },
    },
  })

  // Row gone, or the user opted out / lacks the minimum public fields: the
  // index must not keep a record the database no longer justifies.
  if (!user || !shouldIndexUser(user)) return remove()

  try {
    const record = transformUserForIndex(user)
    await client.saveObjects({ indexName, objects: [record] })
    return 'indexed'
  } catch (error) {
    // `transformUserForIndex` throws on a row it cannot represent; the record
    // is removed rather than left stale. A failing `deleteObject` propagates.
    console.warn(`[user-index] could not build the record for ${userId}, removing it:`, error)
    return remove()
  }
}
