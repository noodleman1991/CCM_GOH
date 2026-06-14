'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, usePathname } from 'next/navigation'
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

            // Built-in fallback copy used if the CMS content is unavailable.
            const fallback = {
              redirectDialogTitle: 'Complete Your Profile',
              redirectDialogMessage: 'To get the most out of your experience, we recommend completing your profile.',
              proceedToOnboardingText: 'Complete Profile',
              continueToHubText: 'Continue to Collaborate',
              oneTimeWaiverText: 'You can complete this later',
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
