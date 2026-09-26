'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Cookie, Shield, Video, BarChart3 } from 'lucide-react'
import { useCookieConsent } from './cookie-consent-provider'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'

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
  const [functional, setFunctional] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  // Sync toggles with current consent when the preferences panel opens —
  // adjust-state-during-render (no effect, no cascading re-render).
  const [prevPreferencesOpen, setPrevPreferencesOpen] = useState(false)
  if (isPreferencesOpen !== prevPreferencesOpen) {
    setPrevPreferencesOpen(isPreferencesOpen)
    if (isPreferencesOpen && consent) {
      setFunctional(consent.functional)
      setAnalytics(consent.analytics)
    }
  }

  // Initial banner shows until the user makes a choice (Accept / Reject /
  // save preferences) — derived, no auto-dismiss.
  const showInitialBanner = !hasConsented

  const handleSavePreferences = () => {
    updateConsent({ functional, analytics })
  }

  // Preferences panel (shared between initial banner and reopened state)
  const preferencesPanel = (
    <div className="space-y-4 mb-4">
      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-ccm-sea flex-shrink-0 mt-0.5" />
          <div>
            <p id="cookie-category-essential" className="font-medium text-sm">{t('categories.essential.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.essential.description')}</p>
          </div>
        </div>
        <Switch checked disabled className="data-[state=checked]:bg-ccm-sea" aria-labelledby="cookie-category-essential" />
      </div>

      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <Video className="h-5 w-5 text-ccm-water flex-shrink-0 mt-0.5" />
          <div>
            <p id="cookie-category-functional" className="font-medium text-sm">{t('categories.functional.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.functional.description')}</p>
          </div>
        </div>
        <Switch checked={functional} onCheckedChange={setFunctional} aria-labelledby="cookie-category-functional" />
      </div>

      <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-start gap-3">
          <BarChart3 className="h-5 w-5 text-ccm-water flex-shrink-0 mt-0.5" />
          <div>
            <p id="cookie-category-analytics" className="font-medium text-sm">{t('categories.analytics.title')}</p>
            <p className="text-xs text-muted-foreground">{t('categories.analytics.description')}</p>
          </div>
        </div>
        <Switch checked={analytics} onCheckedChange={setAnalytics} aria-labelledby="cookie-category-analytics" />
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
        {/* Preferences panel (reopened from the sidebar or the privacy page):
            a drawer below sm, a dialog above, capped at 92dvh so Save is
            always reachable (Slice 13d). */}
        <ResponsiveDialog
          open={isPreferencesOpen}
          onOpenChange={(open) => {
            if (!open) closePreferences()
          }}
          title={t('title')}
          description={t('description')}
        >
          {preferencesPanel}
        </ResponsiveDialog>
      </>
    )
  }

  // Initial banner for new visitors
  if (!showInitialBanner) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
      {/* Capped and scrollable so the expanded preferences' Save button stays
          reachable on a landscape phone (Slice 13d). */}
      <Card className="mx-auto max-h-[92dvh] max-w-2xl overflow-y-auto shadow-2xl border-2">
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
