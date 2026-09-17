/**
 * Lightweight environment validation. Required vars (the app can't run without
 * them) are checked; optional vars (features degrade gracefully without them)
 * are reported. Designed not to break local/CI builds — it logs rather than
 * hard-crashes unless explicitly told to assert.
 *
 * `instrumentation.ts` is the consumer: in production it calls `assertEnv()`
 * and the server dies at boot on anything missing; everywhere else it prints
 * `checkEnv()`'s report as warnings.
 *
 * Every name below must be one the code reads — `lib/__tests__/env-manifest.test.ts`
 * greps for each. The 2026-09-16 audit found this file checking
 * `ALGOLIA_ADMIN_KEY` (nothing reads it; `lib/algolia.ts` reads
 * `ALGOLIA_API_KEY`) and reporting R2 disabled whenever only the canonical
 * `R2_*` names were set, so the boot report was wrong in both directions.
 */

/**
 * Asserted in production, warned about elsewhere.
 *
 * The four secrets: without `CLERK_SECRET_KEY` no server-side auth call works;
 * without `CLERK_WEBHOOK_SECRET` `/api/webhooks/clerk` refuses every delivery
 * and users never reach the database; without `SEARCH_WEBHOOK_SECRET` the
 * search webhook routes 401 every delivery; without `CRON_SECRET` the digest
 * and retention crons fail closed and never run. Each is a silent outage.
 */
const REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "SEARCH_WEBHOOK_SECRET",
  "CRON_SECRET",
] as const;

/**
 * Required as soon as any content-backend switch says `payload`.
 * `payload.config.ts` defaults both to `""`, so a deployment flipped to
 * Payload without them does not fail at config load — it fails on the first
 * query, with a Postgres connection error that says nothing about the cause.
 */
const REQUIRED_WHEN_PAYLOAD = ["PAYLOAD_DATABASE_URL", "PAYLOAD_SECRET"] as const;

/**
 * Each feature lists the variables it needs. An entry is either one name or a
 * list of alternative spellings of which ONE must be set, mirroring the
 * `??` chains in the readers:
 *
 *   - `lib/algolia.ts:17` reads `ALGOLIA_APP_ID || NEXT_PUBLIC_ALGOLIA_APP_ID`.
 *   - `lib/r2.ts:16-18` and `payload/storage/r2.ts:30-36` read `R2_*` first and
 *     fall back to the long `CLOUDFLARE_R2_*` names.
 */
type FeatureKey = string | readonly string[];

const OPTIONAL_FEATURES: Record<string, readonly FeatureKey[]> = {
  "Email (Resend)": ["RESEND_API_KEY"],
  "Search (Algolia)": [["NEXT_PUBLIC_ALGOLIA_APP_ID", "ALGOLIA_APP_ID"], "ALGOLIA_API_KEY"],
  "File storage (R2)": [
    ["R2_ENDPOINT", "CLOUDFLARE_R2_ENDPOINT"],
    ["R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_ACCESS_KEY_ID"],
    ["R2_SECRET_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  ],
  "Anonymous comments (Turnstile)": ["TURNSTILE_SECRET_KEY"],
  "Rate limiting (Upstash)": ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  "Error monitoring (Sentry)": ["NEXT_PUBLIC_SENTRY_DSN"],
};

type Env = Record<string, string | undefined>;

const isSet = (env: Env, key: string): boolean => Boolean(env[key]);
const isSatisfied = (env: Env, key: FeatureKey): boolean =>
  typeof key === "string" ? isSet(env, key) : key.some((alt) => isSet(env, alt));

/**
 * The content-backend vocabulary from `lib/content/internal/backend.ts`:
 * `CONTENT_BACKEND`, `CONTENT_BACKEND_<DOMAIN>`, and the `NEXT_PUBLIC_` twin of
 * each. That module trims and lower-cases before comparing, so do the same
 * here — `CONTENT_BACKEND_NEWS=" Payload "` turns news onto Payload and must
 * count.
 */
const CONTENT_SWITCH = /^(NEXT_PUBLIC_)?CONTENT_BACKEND(_[A-Z0-9_]+)?$/;

/** The first switch set to `payload`, or null when nothing reads from Payload. */
function payloadSwitch(env: Env): string | null {
  for (const [name, raw] of Object.entries(env)) {
    if (!CONTENT_SWITCH.test(name)) continue;
    if ((raw ?? "").trim().toLowerCase() === "payload") return name;
  }
  return null;
}

export type EnvReport = {
  /** Includes `PAYLOAD_DATABASE_URL` / `PAYLOAD_SECRET` when `payloadSwitch` is set. */
  missingRequired: string[];
  /** Which variable turned a content domain onto Payload, so a boot message can say why the Payload vars are required. */
  payloadSwitch: string | null;
  disabledFeatures: string[];
};

/**
 * @param env defaults to `process.env`; injectable so the manifest can be
 *   tested without mutating the test runner's own environment.
 */
export function checkEnv(env: Env = process.env): EnvReport {
  const missingRequired: string[] = REQUIRED.filter((k) => !isSet(env, k));
  const onPayload = payloadSwitch(env);
  if (onPayload) {
    missingRequired.push(...REQUIRED_WHEN_PAYLOAD.filter((k) => !isSet(env, k)));
  }
  const disabledFeatures = Object.entries(OPTIONAL_FEATURES)
    .filter(([, keys]) => keys.some((k) => !isSatisfied(env, k)))
    .map(([name]) => name);
  return { missingRequired, payloadSwitch: onPayload, disabledFeatures };
}

/** One line naming what is missing and, for the Payload pair, why it is required. */
export function describeMissing({ missingRequired, payloadSwitch: onPayload }: EnvReport): string {
  const why =
    onPayload && missingRequired.some((k) => (REQUIRED_WHEN_PAYLOAD as readonly string[]).includes(k))
      ? ` (${REQUIRED_WHEN_PAYLOAD.join(" and ")} are required because ${onPayload}=payload)`
      : "";
  return `Missing required environment variables: ${missingRequired.join(", ")}${why}`;
}

/** Throw if a required var is missing. Call from server entry points that need it. */
export function assertEnv(env: Env = process.env): void {
  const report = checkEnv(env);
  if (report.missingRequired.length > 0) {
    throw new Error(describeMissing(report));
  }
}
