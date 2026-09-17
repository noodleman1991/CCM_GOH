import * as Sentry from "@sentry/nextjs";

/**
 * The one sink for best-effort failures.
 *
 * Why this exists (2026-09-16 audit, findings "Error / not-found pages: no
 * captureException", "Sentry: error boundaries never call Sentry", and ~20
 * `catch {}` / `.catch(() => {})` blocks under lib/ and app/api/): the hub had
 * two ways to fail quietly — an error boundary that only `console.error`ed
 * in the browser, and best-effort code that swallowed its error entirely. In
 * production neither reaches anyone. Routing every one of those through this
 * function means each failure lands in Sentry when it is configured, and in
 * the server/browser console (with the same context) when it is not.
 *
 * Sentry is initialised only when `NEXT_PUBLIC_SENTRY_DSN` is set AND
 * `NODE_ENV === "production"` (instrumentation.ts, instrumentation-client.ts).
 * `Sentry.isInitialized()` is the SDK's own "do I have a client" check, so
 * this needs no second copy of that rule.
 *
 * Contract: NEVER throws, returns nothing, safe from client and server
 * components, route handlers, crons and server actions. A reporter that
 * throws inside a `catch {}` would turn a logged failure into a crash.
 */
export interface ReportErrorContext {
  /** Route or module name, e.g. "cron/event-reminders". Becomes the `route`
   *  tag in Sentry and the prefix on the console line. */
  route?: string;
  /** Indexed, low-cardinality labels (Sentry tags). */
  tags?: Record<string, string>;
  /** Free-form detail attached to the event (never indexed). */
  extra?: Record<string, unknown>;
}

export function reportError(error: unknown, context: ReportErrorContext = {}): void {
  const tags: Record<string, string> = { ...(context.tags ?? {}) };
  if (context.route) tags.route = context.route;

  try {
    if (Sentry.isInitialized()) {
      // Sentry groups by stack trace; a thrown string/object has none, so wrap
      // it and keep the original value where it can still be read.
      const captured = error instanceof Error ? error : new Error(describe(error));
      const extra =
        error instanceof Error ? context.extra : { ...(context.extra ?? {}), thrown: error };
      Sentry.captureException(captured, { tags, extra });
      return;
    }
  } catch {
    // An SDK failure must never mask the original error — fall through to the
    // console so the failure is still visible somewhere.
  }

  logToConsole(error, context.route, tags, context.extra);
}

function describe(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return `Non-Error thrown: ${JSON.stringify(value)}`;
  } catch {
    return `Non-Error thrown: ${String(value)}`;
  }
}

function logToConsole(
  error: unknown,
  route: string | undefined,
  tags: Record<string, string>,
  extra: Record<string, unknown> | undefined
): void {
  try {
    const details: Record<string, unknown> = {};
    if (Object.keys(tags).length > 0) details.tags = tags;
    if (extra !== undefined) details.extra = extra;
    const args: unknown[] = [`[${route ?? "app"}]`, error];
    if (Object.keys(details).length > 0) args.push(details);
    console.error(...args);
  } catch {
    // Nothing left to fall back to; swallowing here is the contract.
  }
}
