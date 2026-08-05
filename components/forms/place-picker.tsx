'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { SearchInput } from '@/components/ui/search-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FilterChip } from '@/components/ui/filter-chip'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { CCM } from '@/lib/ccm-colors'

export type PlaceValue = {
  lat: number
  lng: number
  text: string
  precision: 'exact' | 'city' | 'country' | 'region'
  countryCode3: string | null
}

type Suggestion = {
  label: string; lat: number; lng: number; countryCode3: string | null;
  kind: string; vx: number | null; vy: number | null;
}

const PRECISIONS: PlaceValue['precision'][] = ['exact', 'city', 'country', 'region']

/**
 * "Where did this happen?" (spec A2 author door): free-text geocode search →
 * suggestion list → precision picker → editable display name, with the region
 * choropleth as the preview canvas (pin at the projected point).
 */
export function PlacePicker({
  value,
  onChange,
  defaultPrecision = 'city',
}: {
  value: PlaceValue | null
  onChange: (v: PlaceValue | null) => void
  defaultPrecision?: PlaceValue['precision']
}) {
  const t = useTranslations('placePicker')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [pin, setPin] = useState<{ vx: number; vy: number } | null>(null)
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(debounce.current)
    if (query.trim().length < 2) { setSuggestions([]); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setSuggestions(json.results ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query])

  const pick = (s: Suggestion) => {
    onChange({
      lat: s.lat, lng: s.lng, text: s.label,
      precision: value?.precision ?? defaultPrecision,
      countryCode3: s.countryCode3,
    })
    if (s.vx != null && s.vy != null) setPin({ vx: s.vx, vy: s.vy })
    setSuggestions([])
    setQuery('')
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="place-search">{t('searchLabel')}</Label>
          <SearchInput
            id="place-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            autoComplete="off"
            onClear={query ? () => setQuery('') : undefined}
          />
          {searching && <p className="text-xs text-muted-foreground">{t('searching')}</p>}
          {suggestions.length > 0 && (
            <ul className="divide-y rounded-lg border bg-card shadow-sm" role="listbox">
              {suggestions.map((s, i) => (
                <li key={`${s.lat}-${s.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => pick(s)}
                    className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted"
                  >
                    <span className="min-w-0 flex-1 truncate"><bdi>{s.label}</bdi></span>
                    <span className="text-xs text-muted-foreground">{s.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {value && (
          <>
            <div className="space-y-1.5">
              <Label>{t('precisionLabel')}</Label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('precisionLabel')}>
                {PRECISIONS.map((p) => (
                  <FilterChip
                    key={p}
                    label={t(`precision.${p}`)}
                    active={value.precision === p}
                    onClick={() => onChange({ ...value, precision: p })}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{t('precisionHint')}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="place-text">{t('displayLabel')}</Label>
              <Input
                id="place-text"
                value={value.text}
                onChange={(e) => onChange({ ...value, text: e.target.value })}
              />
            </div>
            <button type="button" onClick={() => { onChange(null); setPin(null) }} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
              {t('clear')}
            </button>
          </>
        )}
      </div>

      <div className="relative min-w-0">
        <RegionChoropleth data={[]} labelFor={() => ''} />
        {pin && value && value.precision !== 'region' && (
          <svg viewBox="0 0 960 500" className="pointer-events-none absolute inset-0 h-auto w-full">
            <circle cx={pin.vx} cy={pin.vy} r={8} fill={CCM.amber} stroke="white" strokeWidth={2.5} />
          </svg>
        )}
      </div>
    </div>
  )
}
