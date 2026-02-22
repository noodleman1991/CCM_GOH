'use client'

import { useTranslations } from 'next-intl'
import { useCookieConsent } from './cookie-consent-provider'

export function CookiePreferencesButton() {
  const t = useTranslations('cookieConsent')
  const { openPreferences } = useCookieConsent()

  return (
    <button
      onClick={openPreferences}
      className="transition-colors hover:text-foreground/80 text-foreground/60 text-xs underline-offset-4 hover:underline"
    >
      {t('changePreferences')}
    </button>
  )
}
