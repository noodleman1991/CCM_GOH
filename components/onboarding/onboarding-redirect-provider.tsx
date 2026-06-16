'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import OnboardingRedirectDialog from './onboarding-redirect-dialog'

interface OnboardingContent {
  redirectDialogTitle: string
  redirectDialogMessage: string
  proceedToOnboardingText: string
  continueToHubText: string
  oneTimeWaiverText: string
}

export default function OnboardingRedirectProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { user, isLoaded } = useUser()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string || 'en'
  const t = useTranslations('onboarding.redirectDialog')

  const [showDialog, setShowDialog] = useState(false)
  const [content, setContent] = useState<OnboardingContent | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return

    // Check onboarding status from our API
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/onboarding/status')
        if (response.ok) {
          const { completed } = await response.json()

          const shouldShowDialog =
            // User is authenticated
            user &&
            // User hasn't completed onboarding (check Prisma database)
            !completed &&
            // User hasn't been shown the dialog in this session
            !sessionStorage.getItem('onboarding-dialog-shown') &&
            // User is NOT already on the onboarding page
            !pathname?.includes('/onboarding')

          if (shouldShowDialog) {
            setIsLoadingContent(true)

            // Localised fallback copy (from the messages file, always available)
            // used if the CMS content is unavailable — so non-English users don't
            // see English when Sanity can't be reached.
            const fallback = {
              redirectDialogTitle: t('title'),
              redirectDialogMessage: t('message'),
              proceedToOnboardingText: t('proceed'),
              continueToHubText: t('continue'),
              oneTimeWaiverText: t('waiver'),
            }

            // Fetch onboarding copy via a server route (tokened client), so this
            // works whether or not the Sanity dataset is public.
            fetch(`/api/onboarding/content?locale=${encodeURIComponent(locale)}`)
              .then((res) => (res.ok ? res.json() : { content: null }))
              .then(({ content: data }) => {
                setContent(data ? {
                  redirectDialogTitle: data.redirectDialogTitle || fallback.redirectDialogTitle,
                  redirectDialogMessage: data.redirectDialogMessage || fallback.redirectDialogMessage,
                  proceedToOnboardingText: data.proceedToOnboardingText || fallback.proceedToOnboardingText,
                  continueToHubText: data.continueToHubText || fallback.continueToHubText,
                  oneTimeWaiverText: data.oneTimeWaiverText || fallback.oneTimeWaiverText,
                } : fallback)
                setShowDialog(true)
                sessionStorage.setItem('onboarding-dialog-shown', 'true')
              })
              .catch((error) => {
                console.error('Failed to fetch onboarding content:', error)
                setContent(fallback)
                setShowDialog(true)
                sessionStorage.setItem('onboarding-dialog-shown', 'true')
              })
              .finally(() => {
                setIsLoadingContent(false)
              })
          }
        } else {
          console.error('Failed to fetch onboarding status')
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error)
      }
    }

    checkOnboardingStatus()
  }, [isLoaded, user, locale])

  const handleDialogClose = () => {
    setShowDialog(false)
  }

  return (
    <>
      {children}
      {showDialog && content && (
        <OnboardingRedirectDialog
          isOpen={showDialog}
          onOpenChangeAction={handleDialogClose}
          content={content}
          locale={locale}
        />
      )}
    </>
  )
}
