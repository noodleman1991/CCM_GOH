/**
 * Index names, and the write-time prefix — with **no module side effects**.
 *
 * Split out of `lib/algolia.ts`, which runs `require('dotenv').config()` and
 * constructs two Algolia clients at import. That is fine inside Next, which
 * transpiles the module for the server, and fatal anywhere else: under `tsx`
 * (ESM) the bare `require` throws `require is not defined in ES module scope`.
 * A Payload hook and a verification script both need to know what an index is
 * called without paying for a client, so the names live here and `lib/algolia`
 * re-exports them — every existing import keeps working unchanged.
 */

// Index names
export const ALGOLIA_INDICES = {
  USERS: 'users',
  SANITY_CONTENT: 'sanity_content',
  AGENDAS: 'agendas',
  POSTS: 'posts',
  CASE_STUDIES: 'case_studies',
  NEWS: 'news'
} as const

/**
 * Optional prefix for the index a **write** targets.
 *
 * A verification affordance, and only that: set `ALGOLIA_INDEX_PREFIX` and the
 * sync routes and the Payload hooks write to `<prefix>case_studies` instead of
 * `case_studies`, so a parity run can build the real records and push them at a
 * scratch index without going anywhere near the live one.
 *
 * **Reads deliberately ignore it** — the search UI, `/api/search/counts` and
 * `/api/search/token` all keep naming the real indices. That asymmetry is the
 * safety property: a prefix left set by accident writes somewhere harmless
 * rather than silently pointing the whole site at an empty index.
 *
 * Unset in every environment, so in production `writeIndexName(x) === x`.
 */
export function writeIndexName(indexName: string): string {
  return `${process.env.ALGOLIA_INDEX_PREFIX ?? ''}${indexName}`
}

/**
 * May this process write to a **live** (unprefixed) Algolia index?
 *
 * `writeIndexName` above makes a prefix route writes to a scratch index. This
 * decides what happens when there is NO prefix — and the answer is "only on
 * Vercel production". Everywhere else that fires a write — `next dev` against
 * the dev database, a preview deployment, an import script re-populating a
 * dev copy, vitest — an unprefixed write would land on the same index the
 * live site searches, with the admin key.
 *
 * That was the state of things until 2026-09-16: the Payload search-sync hook
 * fires on every save of a case study, news post or agenda, no environment
 * set a prefix, and `.env` (production) supplied the key wherever `.env.local`
 * did not. One `pnpm import:documents` into the dev database would have
 * rewritten every record in the live `case_studies`, `news` and `agendas`
 * indices, and a draft save in local `/admin` would have deleted one.
 *
 * `VERCEL_ENV`, not `NODE_ENV`: `next build && next start` on a laptop is
 * `NODE_ENV=production` too. Vercel sets `VERCEL_ENV=production` only on the
 * production deployment, which is the only place the live index should be
 * written from.
 */
export function liveIndexWritesAllowed(env: Record<string, string | undefined> = process.env): boolean {
  if ((env.ALGOLIA_INDEX_PREFIX ?? '').length > 0) return true
  return env.VERCEL_ENV === 'production'
}
