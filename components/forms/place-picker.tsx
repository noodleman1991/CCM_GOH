'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { CCM } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'

export type PlaceValue = {
  lat: number
  lng: number
  text: string
  precision: 'exact' | 'city' | 'country' | 'region'
  countryCode3: string | null
  country?: string | null
  city?: string | null
}

type Suggestion = {
  label: string; lat: number; lng: number; countryCode3: string | null; kind: string
  country: string | null; city: string | null; precision: PlaceValue['precision']
  vx: number | null; vy: number | null
}

/** "Where did this take place?": one search, a preview, and a name. No coordinates, no precision chips. */
export function PlacePicker({
  value,
  onChange,
  inputId = 'place-search',
  describedBy,
  onBlur,
}: {
  value: PlaceValue | null
  onChange: (v: PlaceValue | null) => void
  inputId?: string
  describedBy?: { 'aria-invalid'?: true; 'aria-describedby'?: string }
  onBlur?: () => void
}) {
  const t = useTranslations('placePicker')
  const listId = useId()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [active, setActive] = useState(0)
  const [pin, setPin] = useState<{ vx: number; vy: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    clearTimeout(debounce.current)
    if (query.trim().length < 2) { setSuggestions([]); setSearched(false); return }
    debounce.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/geo/search?q=${encodeURIComponent(query)}`)
        const json = await res.json()
        setSuggestions(json.results ?? [])
      } catch { setSuggestions([]) }
      finally { setSearching(false); setSearched(true); setActive(0) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [query])

  const pick = (s: Suggestion) => {
    onChange({ lat: s.lat, lng: s.lng, text: s.label, precision: s.precision, countryCode3: s.countryCode3, country: s.country, city: s.city })
    setPin(s.vx != null && s.vy != null ? { vx: s.vx, vy: s.vy } : null)
    setSuggestions([]); setSearched(false); setQuery('')
  }

  const open = suggestions.length > 0

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3">
        {!value ? (
          <div className="space-y-1.5">
            <Label htmlFor={inputId}>{t('searchLabel')}</Label>
            <Input
              ref={inputRef}
              id={inputId}
              role="combobox"
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={open ? `${listId}-option-${active}` : undefined}
              value={query}
              autoComplete="off"
              placeholder={t('searchPlaceholder')}
              className="min-h-11"
              onChange={(e) => setQuery(e.target.value)}
              onBlur={onBlur}
              onKeyDown={(e) => {
                if (!open) return
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)) }
                if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
                if (e.key === 'Enter') { e.preventDefault(); pick(suggestions[active]) }
                if (e.key === 'Escape') setSuggestions([])
              }}
              {...describedBy}
            />
            {searching && <p className="text-xs text-muted-foreground">{t('searching')}</p>}
            {open && (
              <ul id={listId} role="listbox" className="divide-y rounded-lg border bg-card shadow-sm">
                {suggestions.map((s, i) => (
                  <li
                    key={`${s.lat}-${s.lng}-${i}`}
                    id={`${listId}-option-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(s)}
                    className={cn('flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 py-2 text-start text-sm hover:bg-muted', i === active && 'bg-muted')}
                  >
                    <MapPin className="size-4 shrink-0 text-ccm-water" aria-hidden />
                    <span className="min-w-0 flex-1 truncate"><bdi>{s.label}</bdi></span>
                    <span className="shrink-0 text-xs text-muted-foreground">{t(`kind.${s.precision}`)}</span>
                  </li>
                ))}
              </ul>
            )}
            {searched && !searching && !open && <p className="text-sm text-muted-foreground">{t('noResults')}</p>}
            <p className="text-xs text-muted-foreground">{t('hint')}</p>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border bg-card p-4">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ccm-amber" aria-hidden />
              <p className="min-w-0 flex-1 text-sm font-medium"><bdi>{value.text}</bdi></p>
              <button
                type="button"
                className="min-h-11 text-sm font-medium text-ccm-water underline-offset-2 hover:underline"
                onClick={() => { onChange(null); setPin(null); requestAnimationFrame(() => inputRef.current?.focus()) }}
              >
                {t('change')}
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${inputId}-name`}>{t('displayLabel')}</Label>
              <Input
                id={`${inputId}-name`}
                className="min-h-11"
                value={value.text}
                onChange={(e) => onChange({ ...value, text: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative min-w-0" aria-hidden>
        <RegionChoropleth data={[]} labelFor={() => ''} />
        {pin && value && value.precision !== 'region' && value.precision !== 'country' && (
          <svg viewBox="0 0 960 500" className="pointer-events-none absolute inset-0 h-auto w-full">
            <circle cx={pin.vx} cy={pin.vy} r={8} fill={CCM.amber} stroke="white" strokeWidth={2.5} />
          </svg>
        )}
      </div>
    </div>
  )
}
