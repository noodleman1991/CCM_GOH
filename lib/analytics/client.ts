import type { PostHog } from "posthog-js";

/**
 * The browser half of PostHog (Slice 11). One lazily imported instance;
 * `posthog-js` is not in any bundle a decliner downloads.
 *
 * Everything privacy-relevant is decided here, once:
 *  - the same-origin `/ingest` proxy (next.config.mjs), never the EU host
 *    directly, so the CSP's `connect-src 'self'` is what verifies it;
 *  - `person_profiles: identified_only` — anonymous events stay anonymous;
 *  - no autocapture, no session recording, no surveys, no heatmaps: on this
 *    site element text is comment bodies, lived-experience excerpts and
 *    profile headlines. Events are explicit and closed (lib/analytics/events.ts).
 */
let ph: PostHog | null = null;

export type PostHogEnv = Record<string, string | undefined>;

/**
 * Mirrors the Sentry client rule (instrumentation-client.ts): a key AND a
 * production build, unless `NEXT_PUBLIC_POSTHOG_DEBUG=1` asks for it locally.
 * `NEXT_PUBLIC_*` and `NODE_ENV` are inlined at build time, so the reads have
 * to stay as literal property accesses.
 */
export function posthogEnabled(): boolean {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return false;
  return process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "1";
}

export const POSTHOG_PROXY_PREFIX = "/ingest";

export type LoadOptions = { locale: string; dir: "ltr" | "rtl" };

export async function loadPostHog(opts: LoadOptions): Promise<PostHog | null> {
  if (ph) {
    // Re-accepting after a decline: the instance survived; capture resumes.
    ph.opt_in_capturing();
    ph.register(superProperties(opts));
    return ph;
  }
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;
  const { default: posthog } = await import("posthog-js");
  posthog.init(key, {
    api_host: POSTHOG_PROXY_PREFIX,
    ui_host: "https://eu.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false, // App Router: manual, see components/analytics/posthog-pageview.tsx
    capture_pageleave: true,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    disable_session_recording: true,
    session_recording: { maskAllInputs: true, maskTextSelector: "*" },
    mask_all_text: true,
    mask_all_element_attributes: true,
    capture_performance: { web_vitals: true, network_timing: false },
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: false,
    secure_cookie: true,
    disable_surveys: true,
    // Release flags live in Settings → Collaboration (lib/collaboration/access.ts), not PostHog (design §7), so the /flags request
    // is skipped: one call less per load, and no late response writing
    // `$feature_flag…` back into storage after a decline has wiped it
    // (observed in Chrome, 2026-09-17).
    advanced_disable_flags: true,
  });
  posthog.register(superProperties(opts));
  ph = posthog;
  return ph;
}

function superProperties({ locale, dir }: LoadOptions) {
  return {
    locale,
    dir,
    app_env: process.env.NEXT_PUBLIC_VERCEL_ENV ?? (process.env.NODE_ENV === "production" ? "production" : "development"),
  };
}

/**
 * posthog-js cannot be removed from the page once initialised, so "unload"
 * means: stop capturing, wipe identity and the ph_* storage for this key.
 * `opt_out_capturing` persists its own flag; that flag records a refusal and
 * belongs to the essential category.
 */
export function unloadPostHog(): void {
  if (!ph) return;
  ph.opt_out_capturing();
  ph.reset();
  // `reset()` re-seeds anonymous ids into the same storage key (verified in
  // Chrome, 2026-09-17), so the SDK's own persistence is cleared and every
  // `ph_` entry removed. The opt-out flag lives in its own key and survives.
  try {
    ph.persistence?.clear();
    ph.sessionPersistence?.clear();
  } catch {
    // best effort — storage may be unavailable
  }
  for (const store of [globalThis.localStorage, globalThis.sessionStorage]) {
    try {
      for (const key of Object.keys(store)) if (key.startsWith("ph_")) store.removeItem(key);
    } catch {
      // ditto
    }
  }
}

/** The live instance, or null when not loaded or opted out. */
export function getPostHog(): PostHog | null {
  return ph && !ph.has_opted_out_capturing() ? ph : null;
}
