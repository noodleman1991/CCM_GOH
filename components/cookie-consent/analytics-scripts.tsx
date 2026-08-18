'use client'

import Script from 'next/script'
import { useCookieConsent } from './cookie-consent-provider'

/**
 * Plausible, gated on the analytics consent category. Plausible is cookieless,
 * so loading before a choice is made is lawful — but an explicit decline must
 * actually stop it, otherwise the preferences toggle is a lie.
 */
export function AnalyticsScripts() {
  const { consent } = useCookieConsent()
  if (consent && !consent.analytics) return null

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
