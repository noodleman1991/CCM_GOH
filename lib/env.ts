/**
 * Lightweight environment validation. Required vars (the app can't run without
 * them) are checked; optional vars (features degrade gracefully without them)
 * are reported. Designed not to break local/CI builds — it logs rather than
 * hard-crashes unless explicitly told to assert.
 */

const REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
] as const;

const OPTIONAL_FEATURES: Record<string, string[]> = {
  "Email (Resend)": ["RESEND_API_KEY"],
  "Search (Algolia)": ["NEXT_PUBLIC_ALGOLIA_APP_ID", "ALGOLIA_ADMIN_KEY"],
  "File storage (R2)": ["CLOUDFLARE_R2_ENDPOINT", "CLOUDFLARE_R2_ACCESS_KEY_ID", "CLOUDFLARE_R2_SECRET_ACCESS_KEY"],
  "Anonymous comments (Turnstile)": ["TURNSTILE_SECRET_KEY"],
  "Rate limiting (Upstash)": ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  "Error monitoring (Sentry)": ["NEXT_PUBLIC_SENTRY_DSN"],
};

export type EnvReport = {
  missingRequired: string[];
  disabledFeatures: string[];
};

export function checkEnv(): EnvReport {
  const missingRequired = REQUIRED.filter((k) => !process.env[k]);
  const disabledFeatures = Object.entries(OPTIONAL_FEATURES)
    .filter(([, keys]) => keys.some((k) => !process.env[k]))
    .map(([name]) => name);
  return { missingRequired, disabledFeatures };
}

/** Throw if a required var is missing. Call from server entry points that need it. */
export function assertEnv(): void {
  const { missingRequired } = checkEnv();
  if (missingRequired.length > 0) {
    throw new Error(`Missing required environment variables: ${missingRequired.join(", ")}`);
  }
}
