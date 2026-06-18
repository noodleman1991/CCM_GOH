import * as Sentry from "@sentry/nextjs";

/**
 * Server/edge instrumentation. Sentry only initializes when a DSN is configured,
 * so this is a no-op in local/CI and any environment without monitoring.
 */
export async function register() {
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
