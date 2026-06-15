import { describe, it, expect } from 'vitest'
import { getLocalizedText, isRTLLocale } from '@/lib/localization-utils'

describe('getLocalizedText — the universal localized-field reader', () => {
  const obj = { en: 'Hello', es: 'Hola', fr: 'Bonjour', ar: 'مرحبا' }

  it('returns the requested locale from a localized object', () => {
    expect(getLocalizedText(obj, 'es')).toBe('Hola')
    expect(getLocalizedText(obj, 'ar')).toBe('مرحبا')
  })

  it('falls back to English when the requested locale is missing', () => {
    expect(getLocalizedText({ en: 'Hello', es: '' }, 'es')).toBe('Hello')
    expect(getLocalizedText({ en: 'Hello' }, 'fr')).toBe('Hello')
  })

  it('falls back to any available value when English is also missing', () => {
    expect(getLocalizedText({ es: 'Hola' }, 'fr')).toBe('Hola')
  })

  it('passes a plain string through (document-i18n / migrated flat value)', () => {
    expect(getLocalizedText('Already resolved', 'es')).toBe('Already resolved')
  })

  it('returns the fallback for null/undefined/empty', () => {
    expect(getLocalizedText(null, 'en', 'N/A')).toBe('N/A')
    expect(getLocalizedText(undefined, 'en', 'N/A')).toBe('N/A')
    expect(getLocalizedText({}, 'en', 'N/A')).toBe('N/A')
    expect(getLocalizedText('', 'en', 'N/A')).toBe('N/A')
  })

  it('defaults the fallback to an empty string', () => {
    expect(getLocalizedText(null, 'en')).toBe('')
  })
})

describe('isRTLLocale', () => {
  it('is true only for Arabic', () => {
    expect(isRTLLocale('ar')).toBe(true)
    expect(isRTLLocale('en')).toBe(false)
    expect(isRTLLocale('es')).toBe(false)
    expect(isRTLLocale('fr')).toBe(false)
  })
})
