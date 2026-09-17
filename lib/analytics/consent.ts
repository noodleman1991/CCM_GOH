/**
 * The two analytics gates, side by side so the asymmetry is explicit
 * (Slice 11, PostHog design §2).
 *
 * The consent provider has three states on first paint
 * (components/cookie-consent/cookie-consent-provider.tsx):
 *   consent=null + hasConsented=true  → the stored choice is still loading
 *   consent=null + hasConsented=false → no choice has been made
 *   consent set                       → decided; the analytics flag rules
 */
export type ConsentSnapshot = {
  consent: { analytics: boolean } | null;
  hasConsented: boolean;
};

/**
 * PostHog loads ONLY on an explicit, stored "analytics: true". Cookies are
 * not the point: even in memory mode the SDK posts the visitor's IP, user
 * agent and URL on every event, which is processing of personal data before
 * consent. The privacy policy promises nothing runs until you accept.
 */
export function posthogAllowed({ consent }: ConsentSnapshot): boolean {
  return consent?.analytics === true;
}

/**
 * Plausible is cookieless and discards identifiers server-side, so it keeps
 * its pre-existing rule: load until told not to, but wait for the stored
 * choice first (a next/script tag cannot be un-injected, so rendering during
 * the loading frame would override a stored decline).
 */
export function plausibleAllowed({ consent, hasConsented }: ConsentSnapshot): boolean {
  return consent ? consent.analytics : !hasConsented;
}
