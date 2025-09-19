'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { onboardingContentQueryWithFallback } from '@/sanity/queries/onboarding-content'
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
  const locale = params.locale as string || 'en'

  const [showDialog, setShowDialog] = useState(false)
  const [content, setContent] = useState<OnboardingContent | null>(null)
  const [isLoadingContent, setIsLoadingContent] = useState(false)

  useEffect(() => {
    if (!isLoaded || !user) return

    const shouldShowDialog =
      // User is authenticated
      user &&
      // User hasn't completed onboarding
      !user.unsafeMetadata?.onboardingComplete &&
      // User hasn't been shown the dialog in this session
      !sessionStorage.getItem('onboarding-dialog-shown')

    if (shouldShowDialog) {
      setIsLoadingContent(true)

      // Fetch onboarding content from Sanity
      client
        .fetch(onboardingContentQueryWithFallback, { locale })
        .then((data) => {
          if (data) {
            setContent({
              redirectDialogTitle: data.redirectDialogTitle || 'Complete Your Profile',
              redirectDialogMessage: data.redirectDialogMessage || 'To get the most out of your experience, we recommend completing your profile.',
              proceedToOnboardingText: data.proceedToOnboardingText || 'Complete Profile',
              continueToHubText: data.continueToHubText || 'Continue to Hub',
              oneTimeWaiverText: data.oneTimeWaiverText || 'You can complete this later'
            })
            setShowDialog(true)

            // Mark dialog as shown in session storage
            sessionStorage.setItem('onboarding-dialog-shown', 'true')
          }
        })
        .catch((error) => {
          console.error('Failed to fetch onboarding content:', error)
          // Use fallback content if fetch fails
          setContent({
            redirectDialogTitle: 'Complete Your Profile',
            redirectDialogMessage: 'To get the most out of your experience, we recommend completing your profile.',
            proceedToOnboardingText: 'Complete Profile',
            continueToHubText: 'Continue to Hub',
            oneTimeWaiverText: 'You can complete this later'
          })
          setShowDialog(true)
          sessionStorage.setItem('onboarding-dialog-shown', 'true')
        })
        .finally(() => {
          setIsLoadingContent(false)
        })
    }
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
