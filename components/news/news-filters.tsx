"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition, useEffect, useMemo } from 'react'
import { ContentFilters, type FilterGroup } from '@/components/ui/content-filters'
import { TIME_FRAMES, timeFrameToDateFrom, dateFromToTimeFrame, type TimeFrame } from '@/lib/filters/time-frame'
import { GLOBAL_REGION, type NewsFilters as NewsFiltersType } from '@/lib/news-utils'
import { getLocalizedValue } from '@/i18n/i18n-helpers'

interface NewsFiltersProps {
  currentFilters: NewsFiltersType
  tags?: Array<{ _id: string; label: Record<string, string> | string; value: string; color?: string; newsCount?: number }>
  communities?: Array<{ _id: string; name: Record<string, string> | string; slug: string; newsCount?: number }>
}

/**
 * News listing filters — the shared ContentFilters (collapsed group triggers,
 * multi-select) for Region + Topics, plus a Date group of time-frame pills
 * (Any time · month · 3 months · year · 3 years). All state is in the URL
 * (comma-separated `communities`/`tags`, single `dateFrom`, `search`).
 */
export default function NewsFilters({ currentFilters, tags = [], communities = [] }: NewsFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('news.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  const selectedTags = currentFilters.tags || []
  const selectedCommunities = currentFilters.communities || []
  const activeTimeFrame = dateFromToTimeFrame(currentFilters.dateFrom)

  // Push a param update to the URL (multi-value params are comma-joined).
  const setParam = (key: string, values: string[] | string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    const v = Array.isArray(values) ? values.join(',') : values
    if (v) params.set(key, v)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Debounce search → URL.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== (currentFilters.search || '')) setParam('search', searchValue || undefined)
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const toggleInArray = (key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setParam(key, next)
  }

  const setTimeFrame = (tf: TimeFrame) => {
    const from = timeFrameToDateFrom(tf)
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set('dateFrom', from)
    else params.delete('dateFrom')
    params.delete('dateTo')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const clearAll = () => startTransition(() => router.push(pathname))

  // "Other" tag is de-surfaced from the filter chips (used sporadically as a
  // fallback only, not a primary facet).
  const topicOptions = useMemo(
    () =>
      tags
        .filter((tag) => tag.value !== 'other')
        .map((tag) => ({ value: tag.value, label: getLocalizedValue(tag.label, locale) })),
    [tags, locale]
  )
  // "Global" leads the region chips: news not tied to any regional community
  // (reserved value alongside the CMS-driven region slugs, never replacing them).
  const communityOptions = useMemo(
    () => [
      { value: GLOBAL_REGION, label: t('global') },
      ...communities.map((c) => ({ value: c.slug, label: getLocalizedValue(c.name, locale) })),
    ],
    [communities, locale, t]
  )
  // Date pills as a "group" of mutually-exclusive options (single active).
  const dateOptions = TIME_FRAMES.map((tf) => ({ value: tf, label: t(`timeFrame.${tf}`) }))

  const groups: FilterGroup[] = [
    {
      id: 'communities',
      label: t('community'),
      options: communityOptions,
      selected: selectedCommunities,
      onToggle: (v) => toggleInArray('communities', selectedCommunities, v),
    },
    {
      id: 'tags',
      label: t('tags'),
      options: topicOptions,
      selected: selectedTags,
      onToggle: (v) => toggleInArray('tags', selectedTags, v),
    },
    {
      id: 'date',
      label: activeTimeFrame && activeTimeFrame !== 'any' ? t(`timeFrame.${activeTimeFrame}`) : t('byDate'),
      options: dateOptions,
      // The active date is single-select; show it selected, toggling sets it.
      selected: activeTimeFrame && activeTimeFrame !== 'any' ? [activeTimeFrame] : [],
      onToggle: (v) => setTimeFrame(v as TimeFrame),
    },
  ]

  return (
    <ContentFilters
      groups={groups}
      search={{ value: searchValue, onChange: setSearchValue, placeholder: t('searchPlaceholder') }}
      onClearAll={clearAll}
    />
  )
}
