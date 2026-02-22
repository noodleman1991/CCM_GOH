'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Video } from 'lucide-react'
import { useCookieConsent } from './cookie-consent-provider'

interface YouTubeConsentGateProps {
  children: React.ReactNode
}

export function YouTubeConsentGate({ children }: YouTubeConsentGateProps) {
  const t = useTranslations('cookieConsent')
  const { consent, hasConsented, acceptAll } = useCookieConsent()

  if (hasConsented && consent?.functional) {
    return <>{children}</>
  }

  return (
    <div className="w-full h-full bg-muted flex flex-col items-center justify-center gap-4 p-8 text-center">
      <Video className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{t('videoBlocked')}</p>
      <Button onClick={acceptAll} size="sm">{t('acceptAll')}</Button>
    </div>
  )
}
