"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useLocale } from "next-intl";
import type { PostHog } from "posthog-js";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";
import { rtlLocales } from "@/i18n/routing";
import { posthogAllowed } from "@/lib/analytics/consent";
import { getPostHog, loadPostHog, posthogEnabled, unloadPostHog } from "@/lib/analytics/client";
import { PostHogPageview } from "./posthog-pageview";

/**
 * The consent → SDK bridge (Slice 11). Mounted inside CookieConsentProvider
 * (for the choice), ClerkProvider (for the id) and NextIntlClientProvider
 * (for the locale) in app/[locale]/layout.tsx. No context of its own:
 * components call `track()` from lib/analytics/events.ts.
 *
 *  - false→true on the analytics category loads the SDK; true→false unloads.
 *  - The pageview reporter mounts only once `init()` has resolved. A child's
 *    effect runs before its parent's, so mounting it in the same commit as
 *    the load would lose the first pageview to a not-yet-initialised client.
 *  - Identity is the Clerk id, nothing else; `useAuth` also catches session
 *    expiry and Clerk's own <UserButton> sign-out, so the two signOut() call
 *    sites need no patch. Person properties are set server-side only.
 */
export function PostHogProvider() {
  const { consent, hasConsented } = useCookieConsent();
  const { userId, isLoaded } = useAuth();
  const locale = useLocale();
  const dir: "ltr" | "rtl" = rtlLocales.includes(locale) ? "rtl" : "ltr";
  const enabled = posthogEnabled();
  const allowed = posthogAllowed({ consent, hasConsented });

  // The in-flight load, so the identity effect below can order itself after
  // init() without loading twice.
  const loading = useRef<Promise<PostHog | null> | null>(null);
  const loadedOnce = useRef(false);
  const [ready, setReady] = useState(false);

  // 1. consent → load / unload (and re-register the locale on a switch).
  useEffect(() => {
    if (!enabled) return;
    if (!allowed) {
      loading.current = null;
      // A decline must take the pageview reporter down before a later
      // re-accept mounts it again over an opted-out instance.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see note above
      setReady(false);
      // Nothing to unload on the first, undecided frame; only a real decline
      // after a load has to opt the instance out and wipe its storage.
      if (loadedOnce.current) unloadPostHog();
      return;
    }
    let cancelled = false;
    loadedOnce.current = true;
    const load = loadPostHog({ locale, dir });
    loading.current = load;
    void load.then((ph) => {
      if (!cancelled) setReady(Boolean(ph));
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, allowed, locale, dir]);

  // 2. identity — after the load above has resolved.
  const prevUser = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled || !isLoaded) return;
    let cancelled = false;
    const run = async () => {
      const ph = loading.current ? await loading.current : getPostHog();
      if (cancelled) return;
      if (!ph) {
        prevUser.current = userId ?? null;
        return;
      }
      if (userId && prevUser.current !== userId) ph.identify(userId);
      if (!userId && prevUser.current) ph.reset();
      prevUser.current = userId ?? null;
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [enabled, isLoaded, userId, allowed]);

  if (!enabled || !allowed || !ready) return null;
  return (
    <Suspense fallback={null}>
      <PostHogPageview />
    </Suspense>
  );
}
