import * as Sentry from "@sentry/nextjs";
import { assertEnv, checkEnv } from "@/lib/env";

/**
 * Server/edge instrumentation. Sentry only initializes when a DSN is configured,
 * so this is a no-op in local/CI and any environment without monitoring.
 */
export async function register() {
  // Fail fast on misconfiguration: a production server missing a required var
  // should die at boot, not 500 on first request. Outside production, report
  // instead of crashing so local/CI runs with partial env keep working.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (process.env.NODE_ENV === "production") {
      assertEnv();
    } else {
      const { missingRequired, disabledFeatures } = checkEnv();
      if (missingRequired.length > 0) {
        console.warn(`[env] Missing required vars: ${missingRequired.join(", ")}`);
      }
      if (disabledFeatures.length > 0) {
        console.warn(`[env] Features disabled by missing vars: ${disabledFeatures.join(", ")}`);
      }
    }
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  // Skip in development so the SDK doesn't load on every dev boot (keeps dev fast);
  // monitoring is a production concern.
  if (!dsn || process.env.NODE_ENV !== "production") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({ dsn, tracesSampleRate: 0.1, enabled: true });
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({ dsn, tracesSampleRate: 0.1, enabled: true });
  }
}

export const onRequestError = Sentry.captureRequestError;
