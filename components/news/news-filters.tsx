"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RemovableChip, FilterChip } from '@/components/ui/filter-chip'
import { TIME_FRAMES, timeFrameToDateFrom, dateFromToTimeFrame, type TimeFrame } from '@/lib/filters/time-frame'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Search, X, Tag, MapPin, Calendar as CalendarIcon, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { NewsFilters as NewsFiltersType } from '@/lib/news-utils'
import { getLocalizedValue } from '@/i18n/i18n-helpers'

interface NewsFiltersProps {
  currentFilters: NewsFiltersType
  tags?: Array<{ _id: string; label: Record<string, string> | string; value: string; color?: string; newsCount?: number }>
  communities?: Array<{ _id: string; name: Record<string, string> | string; slug: string; newsCount?: number }>
}

/** Secondary date controls (presets + from/to), lifted into the "by date" popover. */
function DateRange({
  t, dateFrom, dateTo, onFrom, onTo,
}: {
  t: (k: string) => string
  dateFrom?: Date
  dateTo?: Date
  onFrom: (d?: Date) => void
  onTo: (d?: Date) => void
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="date"
            value={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : ''}
            onChange={(e) => onFrom(e.target.value ? new Date(e.target.value) : undefined)}
            className="h-9 w-full rounded-md border border-input bg-background ps-8 pe-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('dateFrom')}
            aria-label={t('dateFrom')}
          />
        </div>
        <div className="relative">
          <CalendarIcon className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="date"
            value={dateTo ? format(dateTo, 'yyyy-MM-dd') : ''}
            min={dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined}
            onChange={(e) => onTo(e.target.value ? new Date(e.target.value) : undefined)}
            className="h-9 w-full rounded-md border border-input bg-background ps-8 pe-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder={t('dateTo')}
            aria-label={t('dateTo')}
          />
        </div>
      </div>
    </div>
  )
}

export default function NewsFilters({ currentFilters, tags = [], communities = [] }: NewsFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('news.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentFilters.search) updateFilter('search', searchValue)
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== '' && value !== 'all') params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const clearDateFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('dateFrom')
    params.delete('dateTo')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const clearAllFilters = () => {
    setSearchValue('')
    setDateFrom(undefined)
    setDateTo(undefined)
    startTransition(() => router.push(pathname))
  }

  const handleDateFromChange = (date?: Date) => {
    setDateFrom(date)
    updateFilter('dateFrom', date?.toISOString())
  }
  const handleDateToChange = (date?: Date) => {
    setDateTo(date)
    updateFilter('dateTo', date?.toISOString())
  }

  const activeTimeFrame = dateFromToTimeFrame(currentFilters.dateFrom)
  const handleTimeFrame = (tf: TimeFrame) => {
    const from = timeFrameToDateFrom(tf)
    setDateFrom(from ? new Date(from) : undefined)
    setDateTo(undefined)
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set('dateFrom', from)
    else params.delete('dateFrom')
    params.delete('dateTo')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const activeCount =
    (currentFilters.tag ? 1 : 0) +
    (currentFilters.community ? 1 : 0) +
    (currentFilters.dateFrom || currentFilters.dateTo ? 1 : 0) +
    (currentFilters.search ? 1 : 0)
  const hasActiveFilters = activeCount > 0
  const hasDate = Boolean(currentFilters.dateFrom || currentFilters.dateTo)

  const getTagLabel = (tag: any) => getLocalizedValue(tag.label, locale)
  const getCommunityName = (c: any) => getLocalizedValue(c.name, locale)

  return (
    <Card className={cn("transition-all duration-200", hasActiveFilters && "border-primary/50 bg-primary/5")}>
      <CardContent className="space-y-4 p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="ps-10 pe-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue('')}
              className="absolute end-1 top-1/2 size-6 -translate-y-1/2 p-0"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* PRIMARY: region pills */}
        {communities.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('community')}</span>
            <div className="flex flex-wrap gap-2">
              {communities.map((c) => (
                <FilterChip
                  key={c._id}
                  label={getCommunityName(c)}
                  active={currentFilters.community === c.slug}
                  onClick={() => updateFilter('community', currentFilters.community === c.slug ? undefined : c.slug)}
                />
              ))}
            </div>
          </div>
        )}

        {/* PRIMARY: topic pills */}
        {tags.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('tags')}</span>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 12).map((tag) => (
                <FilterChip
                  key={tag._id}
                  label={getTagLabel(tag)}
                  active={currentFilters.tag === tag.value}
                  onClick={() => updateFilter('tag', currentFilters.tag === tag.value ? undefined : tag.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* SECONDARY: by-date popover + clear */}
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasDate ? "secondary" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <CalendarIcon className="size-4" />
                {activeTimeFrame && activeTimeFrame !== 'any' ? t(`timeFrame.${activeTimeFrame}`) : t('byDate')}
                <ChevronDown className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">{t('byDate')}</h4>
                <div className="flex flex-wrap gap-2">
                  {TIME_FRAMES.map((tf) => (
                    <FilterChip
                      key={tf}
                      label={t(`timeFrame.${tf}`)}
                      active={activeTimeFrame === tf}
                      onClick={() => handleTimeFrame(tf)}
                    />
                  ))}
                </div>
                <Separator />
                <DateRange t={t} dateFrom={dateFrom} dateTo={dateTo} onFrom={handleDateFromChange} onTo={handleDateToChange} />
                {hasDate && (
                  <Button variant="ghost" size="sm" onClick={clearDateFilters} className="text-xs">
                    {t('clearAll')}
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ms-auto text-xs">
              {t('clearAll')}
            </Button>
          )}
        </div>

        {/* Active filters summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('activeFilters')}:</span>
            {currentFilters.search && (
              <RemovableChip icon={Search} label={`"${currentFilters.search}"`} onRemove={() => setSearchValue('')} />
            )}
            {currentFilters.community && (
              <RemovableChip
                icon={MapPin}
                label={
                  communities.find((c) => c.slug === currentFilters.community)
                    ? getCommunityName(communities.find((c) => c.slug === currentFilters.community)!)
                    : currentFilters.community
                }
                onRemove={() => updateFilter('community', undefined)}
              />
            )}
            {currentFilters.tag && (
              <RemovableChip
                icon={Tag}
                label={
                  tags.find((t) => t.value === currentFilters.tag)
                    ? getTagLabel(tags.find((t) => t.value === currentFilters.tag)!)
                    : currentFilters.tag
                }
                onRemove={() => updateFilter('tag', undefined)}
              />
            )}
            {hasDate && (
              <RemovableChip
                icon={CalendarIcon}
                label={`${currentFilters.dateFrom ? format(new Date(currentFilters.dateFrom), 'MMM dd, yyyy') : ''}${currentFilters.dateFrom && currentFilters.dateTo ? ' – ' : ''}${currentFilters.dateTo ? format(new Date(currentFilters.dateTo), 'MMM dd, yyyy') : ''}`}
                onRemove={clearDateFilters}
              />
            )}
          </div>
        )}

        {isPending && (
          <div className="py-1 text-center">
            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              {t('updating')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
