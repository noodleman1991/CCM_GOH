'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Cookie, Shield, Video, BarChart3 } from 'lucide-react'
import { useCookieConsent } from './cookie-consent-provider'

export function CookieConsentBanner() {
  const t = useTranslations('cookieConsent')
  const {
    consent,
    hasConsented,
    acceptAll,
    rejectNonEssential,
    updateConsent,
    openPreferences,
    isPreferencesOpen,
    closePreferences,
  } = useCookieConsent()
  const [showInitialBanner, setShowInitialBanner] = useState(false)
  const [functional, setFunctional] = useState(false)

  // Sync functional toggle with current consent when preferences open
  useEffect(() => {
    if (isPreferencesOpen && consent) {
      setFunctional(consent.functional)
    }
  }, [isPreferencesOpen, consent])

  // Show initial banner only when user hasn't consented yet. It stays until the
  // user makes a choice (Accept / Reject / save preferences) — no auto-dismiss.
  useEffect(() => {
    if (!hasConsented) {
      setShowInitialBanner(true)
    } else {
      setShowInitialBanner(false)
    }
  }, [hasConsented])

  const handleSavePreferences = () => {
    updateConsent({ functional, analytics: true })
  }

  // Preferences panel (shared between initial banner and reopened state)
  const preferencesPanel = (
    <div className="space-y-4 mb-4">
      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-ccm-sea flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">{t('categories.essential.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.essential.description')}</p>
          </div>
        </div>
        <Switch checked disabled className="data-[state=checked]:bg-ccm-sea" />
      </div>

      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <Video className="h-5 w-5 text-ccm-water flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">{t('categories.functional.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.functional.description')}</p>
          </div>
        </div>
        <Switch checked={functional} onCheckedChange={setFunctional} />
      </div>

      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-ccm-water flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">{t('categories.analytics.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.analytics.description')}</p>
          </div>
        </div>
        <Switch checked disabled className="data-[state=checked]:bg-ccm-sea opacity-50" />
      </div>

      <Button onClick={handleSavePreferences} className="w-full">
        {t('savePreferences')}
      </Button>
    </div>
  )

  // User has already consented. No persistent floating button — it cluttered
  // the bottom-left on every page and mis-aligned with the collapsible sidebar.
  // Users reopen preferences via the "Cookie preferences" link in the footer
  // (components/cookie-consent/cookie-preferences-button.tsx), which sets
  // isPreferencesOpen and reveals the panel below.
  if (hasConsented) {
    return (
      <>
        {/* Preferences panel (reopened from the footer link) */}
        {isPreferencesOpen && (
          <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
            <Card className="mx-auto max-w-2xl shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <Cookie className="h-6 w-6 text-ccm-water flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="font-heading font-semibold text-lg">{t('title')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
                  </div>
                  <button
                    onClick={closePreferences}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {preferencesPanel}
              </CardContent>
            </Card>
          </div>
        )}
      </>
    )
  }

  // Initial banner for new visitors
  if (!showInitialBanner) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-2xl shadow-2xl border-2">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <Cookie className="h-6 w-6 text-ccm-water flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-heading font-semibold text-lg">{t('title')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
            </div>
          </div>

          {isPreferencesOpen ? (
            preferencesPanel
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={acceptAll} className="flex-1">
                {t('acceptAll')}
              </Button>
              <Button onClick={rejectNonEssential} variant="outline" className="flex-1">
                {t('rejectNonEssential')}
              </Button>
              <Button onClick={openPreferences} variant="ghost" className="flex-1">
                {t('managePreferences')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
