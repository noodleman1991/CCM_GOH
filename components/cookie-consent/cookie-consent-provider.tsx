'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface CookieConsent {
  essential: true
  functional: boolean
  analytics: boolean
  timestamp: number
}

interface CookieConsentContextType {
  consent: CookieConsent | null
  hasConsented: boolean
  acceptAll: () => void
  rejectNonEssential: () => void
  updateConsent: (consent: Partial<Omit<CookieConsent, 'essential' | 'timestamp'>>) => void
  openPreferences: () => void
  isPreferencesOpen: boolean
  closePreferences: () => void
}

const STORAGE_KEY = 'ccm-cookie-consent'

const CookieConsentContext = createContext<CookieConsentContextType | null>(null)

const COOKIE_NAME = 'ccm-consent'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 365 days in seconds

function setConsentCookie(consent: CookieConsent) {
  const value = JSON.stringify({
    f: consent.functional ? 1 : 0,
    a: consent.analytics ? 1 : 0,
    t: consent.timestamp,
  })
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}${secure}`
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [hasConsented, setHasConsented] = useState(true)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setConsent(parsed)
        setHasConsented(true)
      } catch {
        setHasConsented(false)
      }
    } else {
      setHasConsented(false)
    }
  }, [])

  const saveConsent = useCallback((newConsent: CookieConsent) => {
    setConsent(newConsent)
    setHasConsented(true)
    setIsPreferencesOpen(false)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConsent))
    setConsentCookie(newConsent)
  }, [])

  const acceptAll = useCallback(() => {
    saveConsent({ essential: true, functional: true, analytics: true, timestamp: Date.now() })
  }, [saveConsent])

  const rejectNonEssential = useCallback(() => {
    saveConsent({ essential: true, functional: false, analytics: false, timestamp: Date.now() })
  }, [saveConsent])

  const updateConsent = useCallback((partial: Partial<Omit<CookieConsent, 'essential' | 'timestamp'>>) => {
    saveConsent({
      essential: true,
      functional: partial.functional ?? consent?.functional ?? false,
      analytics: partial.analytics ?? consent?.analytics ?? false,
      timestamp: Date.now(),
    })
  }, [consent, saveConsent])

  const openPreferences = useCallback(() => setIsPreferencesOpen(true), [])
  const closePreferences = useCallback(() => setIsPreferencesOpen(false), [])

  return (
    <CookieConsentContext.Provider value={{ consent, hasConsented, acceptAll, rejectNonEssential, updateConsent, openPreferences, isPreferencesOpen, closePreferences }}>
      {children}
    </CookieConsentContext.Provider>
  )
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider')
  }
  return context
}
