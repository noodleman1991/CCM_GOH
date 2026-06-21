"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect, useTransition, useMemo } from 'react'
import { ContentFilters, type FilterGroup } from '@/components/ui/content-filters'
import { topicOptions } from '@/sanity/schemas/shared/topic-options'

interface Filters {
  topics?: string[]
  tags?: string[]
  communities?: string[]
  search?: string
}

interface CaseStudiesFiltersProps {
  currentFilters: Filters
  tags?: Array<{ _id: string; label: Record<string, string> | string; value: string; color?: string; caseStudyCount?: number }>
  communities?: Array<{ _id: string; name: Record<string, string> | string; slug: string; caseStudyCount?: number }>
}

/**
 * Case-studies filters — the shared collapsed multi-select ContentFilters
 * (Region · Topic · Tags), consistent with news + lived experiences. State lives
 * in the URL (comma-separated `communities`/`topics`/`tags`, `search`).
 */
export default function CaseStudiesFilters({ currentFilters, tags = [], communities = [] }: CaseStudiesFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('caseStudies.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  const localized = (v: Record<string, string> | string) =>
    typeof v === 'string' ? v : v[locale] || v['en'] || Object.values(v)[0] || ''

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

  const selectedTopics = currentFilters.topics || []
  const selectedTags = currentFilters.tags || []
  const selectedCommunities = currentFilters.communities || []

  const toggleInArray = (key: string, current: string[], value: string) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setParam(key, next)
  }

  const communityOptions = useMemo(
    () => communities.map((c) => ({ value: c.slug, label: localized(c.name) })),
    [communities, locale]
  )
  // 'Other' topic de-surfaced from the chips (sporadic fallback only).
  const topicGroupOptions = useMemo(
    () => topicOptions.filter((o) => o.value !== 'other').map((o) => ({ value: o.value, label: o.title })),
    []
  )
  const tagOptions = useMemo(
    () => tags.filter((tag) => tag.value !== 'other').map((tag) => ({ value: tag.value, label: localized(tag.label) })),
    [tags, locale]
  )

  const groups: FilterGroup[] = [
    {
      id: 'communities',
      label: t('community'),
      options: communityOptions,
      selected: selectedCommunities,
      onToggle: (v) => toggleInArray('communities', selectedCommunities, v),
    },
    {
      id: 'topics',
      label: t('topic'),
      options: topicGroupOptions,
      selected: selectedTopics,
      onToggle: (v) => toggleInArray('topics', selectedTopics, v),
    },
    ...(tagOptions.length
      ? [{
          id: 'tags',
          label: t('tags'),
          options: tagOptions,
          selected: selectedTags,
          onToggle: (v: string) => toggleInArray('tags', selectedTags, v),
        }]
      : []),
  ]

  return (
    <ContentFilters
      groups={groups}
      search={{ value: searchValue, onChange: setSearchValue, placeholder: t('searchPlaceholder') }}
      onClearAll={() => startTransition(() => router.push(pathname))}
    />
  )
}
