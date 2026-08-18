'use client'

import Script from 'next/script'
import { useCookieConsent } from './cookie-consent-provider'

/**
 * Plausible, gated on the analytics consent category. Plausible is cookieless,
 * so loading before a choice is made is lawful — but an explicit decline must
 * actually stop it, otherwise the preferences toggle is a lie.
 */
export function AnalyticsScripts() {
  const { consent, hasConsented } = useCookieConsent()
  // Wait for the stored consent to resolve before injecting anything — a
  // next/script tag can't be un-injected, so rendering during the initial
  // consent=null frame would override a stored decline. States:
  //   consent=null + hasConsented=true  → still loading   → render nothing yet
  //   consent=null + hasConsented=false → no choice stored → load (cookieless)
  //   consent set                       → analytics flag decides
  const allowed = consent ? consent.analytics : !hasConsented
  if (!allowed) return null

  return (
    <>
      <Script
        src="https://plausible.io/js/pa-3hEF5jJ5x-S__sKhqgipY.js"
        strategy="afterInteractive"
        async
      />
      <Script id="plausible-init" strategy="afterInteractive">
        {`
          window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)};
          plausible.init=plausible.init||function(i){plausible.o=i||{}};
          plausible.init();
        `}
      </Script>
    </>
  )
}
