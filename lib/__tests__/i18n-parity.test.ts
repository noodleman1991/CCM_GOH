import { describe, it, expect } from 'vitest'
import en from '@/messages/en.json'
import es from '@/messages/es.json'
import fr from '@/messages/fr.json'
import ar from '@/messages/ar.json'

/** Flatten a nested messages object to a set of dotted leaf-key paths. */
function leafKeys(obj: Record<string, unknown>, prefix = '', acc = new Set<string>()): Set<string> {
  for (const k of Object.keys(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    const v = obj[k]
    if (v && typeof v === 'object' && !Array.isArray(v)) leafKeys(v as Record<string, unknown>, key, acc)
    else acc.add(key)
  }
  return acc
}

const locales = { en, es, fr, ar } as const

describe('i18n message-file parity', () => {
  const sets = Object.fromEntries(
    Object.entries(locales).map(([name, msgs]) => [name, leafKeys(msgs as Record<string, unknown>)])
  ) as Record<keyof typeof locales, Set<string>>

  const union = new Set<string>()
  for (const s of Object.values(sets)) for (const k of s) union.add(k)

  for (const name of Object.keys(locales) as (keyof typeof locales)[]) {
    it(`${name}.json has every key present in any locale`, () => {
      const missing = [...union].filter((k) => !sets[name].has(k))
      expect(missing, `${name} is missing: ${missing.slice(0, 20).join(', ')}`).toEqual([])
    })
  }

  it('all locales have the exact same number of leaf keys', () => {
    const counts = Object.fromEntries(
      Object.entries(sets).map(([n, s]) => [n, s.size])
    )
    const unique = new Set(Object.values(counts))
    expect(unique.size, `key counts differ: ${JSON.stringify(counts)}`).toBe(1)
  })
})
