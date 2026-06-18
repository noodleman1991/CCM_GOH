import * as Sentry from "@sentry/nextjs";

/**
 * Client instrumentation. No-op unless a DSN is configured. Conservative
 * sampling; no session replay by default (privacy-first for a vulnerable
 * audience — enable explicitly if ever needed).
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    enabled: true,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
