/**
 * Run work after the current Payload write's transaction has committed.
 *
 * Payload runs a collection's `afterChange`/`afterDelete` hooks INSIDE the
 * write's Postgres transaction — `commitTransaction` follows the hook loop in
 * `payload/dist/collections/operations/{create,updateByID,deleteByID}.js`.
 * Anything a hook awaits therefore holds that transaction, and a connection,
 * open for the duration. Task 16 met the consequence: an outbound email in a
 * hook stalled until Neon killed the connection with `25P03
 * idle-in-transaction`, and the editorial write went down with it.
 *
 * So a hook with side effects outside the database does not await them. It
 * hands them here and returns; they run once the write is done:
 *
 *   - Inside a Next request (an admin save over REST, a server action),
 *     `after()` from `next/server` runs the callback once the response has
 *     been flushed and keeps the Vercel invocation alive until it settles — so
 *     the work completes instead of being frozen mid-flight, and it runs with
 *     request scope, which `revalidateTag` requires.
 *   - Outside one (`payload migrate`, the import scripts, vitest), `after()`
 *     throws and the work is detached instead. Detached still means *after the
 *     hook returned*, which is the property that matters.
 *
 * Every piece of work is tracked so that tests and scripts can `flushDeferred()`
 * and observe the outcome rather than race it. Shared by
 * `payload/hooks/search-sync.ts` and `payload/hooks/revalidate-content.ts`.
 */

const inFlight = new Set<Promise<unknown>>();

export class AfterCommitTimeoutError extends Error {
  constructor(what: string, ms: number) {
    super(`${what} did not settle within ${ms}ms`);
    this.name = "AfterCommitTimeoutError";
  }
}

/** Bound one piece of deferred work, so a hung transport cannot leak an invocation. */
export function withTimeout<T>(work: Promise<T>, ms: number, what = "the deferred work"): Promise<T> {
  if (ms <= 0) return work;
  let timer: ReturnType<typeof setTimeout>;
  return Promise.race([
    work,
    new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new AfterCommitTimeoutError(what, ms)), ms);
    }),
  ]).finally(() => clearTimeout(timer!));
}

/**
 * Await every piece of deferred work this process has scheduled and not yet
 * finished. For tests and scripts only — nothing in the request path calls
 * it. Loops because settling work may schedule more.
 */
export async function flushDeferred(): Promise<void> {
  while (inFlight.size > 0) {
    await Promise.allSettled([...inFlight]);
  }
}

/** Live for tests: how much deferred work is outstanding. */
export function pendingDeferredCount(): number {
  return inFlight.size;
}

/**
 * Register work so `flushDeferred()` can see it. Callers invoke this
 * synchronously, in the same tick they schedule, so a flush can never observe
 * an empty set for work that has already been scheduled.
 */
export function track(work: Promise<unknown>): Promise<unknown> {
  const tracked = work.finally(() => {
    inFlight.delete(tracked);
  });
  inFlight.add(tracked);
  return tracked;
}

/**
 * Schedule `run` for after the current write. The returned promise settles
 * when the work does; pair it with `track()`.
 */
export function defer(run: () => Promise<unknown>): Promise<void> {
  let settle!: () => void;
  const settled = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const guarded = async () => {
    try {
      await run();
    } finally {
      settle();
    }
  };
  return (async () => {
    try {
      const { after } = await import("next/server");
      after(guarded);
      return settled;
    } catch {
      // No request scope (or no Next at all). Detach it.
      await guarded();
    }
  })();
}

/** `track(defer(run))` — the one-liner every hook wants. */
export function runAfterCommit(run: () => Promise<unknown>): void {
  void track(defer(run));
}
