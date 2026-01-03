"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  Filter,
  X,
  Tag,
  MapPin,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { NewsFilters as NewsFiltersType } from '@/lib/news-utils'
import { getLocalizedValue } from '@/i18n/i18n-helpers'

interface NewsFiltersProps {
  currentFilters: NewsFiltersType
  tags?: Array<{
    _id: string
    label: Record<string, string> | string
    value: string
    color?: string
    newsCount?: number
  }>
  communities?: Array<{
    _id: string
    name: Record<string, string> | string
    slug: string
    newsCount?: number
  }>
}

export default function NewsFilters({ currentFilters, tags = [], communities = [] }: NewsFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('news.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== currentFilters.search) {
        updateFilter('search', searchValue)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchValue])

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== '' && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const clearAllFilters = () => {
    setSearchValue('')
    setDateFrom(undefined)
    setDateTo(undefined)
    startTransition(() => {
      router.push(pathname)
    })
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
  }

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date)
    updateFilter('dateFrom', date?.toISOString())
  }

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date)
    updateFilter('dateTo', date?.toISOString())
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (currentFilters.tag) count++
    if (currentFilters.community) count++
    if (currentFilters.dateFrom || currentFilters.dateTo) count++
    if (currentFilters.search) count++
    return count
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  // Get localized tag label
  const getTagLabel = (tag: any) => {
    return getLocalizedValue(tag.label, locale)
  }

  // Get localized community name
  const getCommunityName = (community: any) => {
    return getLocalizedValue(community.name, locale)
  }

  return (
    <Card className={cn(
      "transition-all duration-200",
      hasActiveFilters && "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Main Search and Quick Filters */}
        <div className="flex flex-col gap-4">
          {/* First Row: Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSearch('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Second Row: Date Range and Advanced Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : t('dateFrom')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={handleDateFromChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal flex-1",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : t('dateTo')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={handleDateToChange}
                  initialFocus
                  disabled={(date: Date) => dateFrom ? date < dateFrom : false}
                />
              </PopoverContent>
            </Popover>

            {/* Advanced Filters Toggle */}
            <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {t('filters')}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t('advancedFilters')}</h4>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs"
                      >
                        {t('clearAll')}
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Tag Filter */}
                  {tags.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        {t('tags')}
                      </label>
                      <Select
                        value={currentFilters.tag || ''}
                        onValueChange={(value) => updateFilter('tag', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('tagsPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('tagsPlaceholder')}</SelectItem>
                          {tags.map((tag) => (
                            <SelectItem key={tag._id} value={tag.value}>
                              {getTagLabel(tag)}
                              {tag.newsCount !== undefined && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({tag.newsCount})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Community Filter */}
                  {communities.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {t('community')}
                      </label>
                      <Select
                        value={currentFilters.community || ''}
                        onValueChange={(value) => updateFilter('community', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('communityPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('communityPlaceholder')}</SelectItem>
                          {communities.map((community) => (
                            <SelectItem key={community._id} value={community.slug}>
                              {getCommunityName(community)}
                              {community.newsCount !== undefined && (
                                <span className="ml-1 text-xs text-muted-foreground">
                                  ({community.newsCount})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-muted-foreground">{t('activeFilters')}:</span>

            {currentFilters.search && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="w-3 h-3" />
                "{currentFilters.search}"
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSearch('')}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {currentFilters.tag && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tags.find(t => t.value === currentFilters.tag)
                  ? getTagLabel(tags.find(t => t.value === currentFilters.tag)!)
                  : currentFilters.tag}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('tag', undefined)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {currentFilters.community && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {currentFilters.community}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('community', undefined)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {(currentFilters.dateFrom || currentFilters.dateTo) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {currentFilters.dateFrom && format(new Date(currentFilters.dateFrom), 'MMM dd, yyyy')}
                {currentFilters.dateFrom && currentFilters.dateTo && ' - '}
                {currentFilters.dateTo && format(new Date(currentFilters.dateTo), 'MMM dd, yyyy')}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined)
                    setDateTo(undefined)
                    updateFilter('dateFrom', undefined)
                    updateFilter('dateTo', undefined)
                  }}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs"
            >
              {t('clearAll')}
            </Button>
          </div>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {t('updating')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
