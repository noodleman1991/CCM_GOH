"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  BookOpen,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Filters {
  topic?: string
  tag?: string
  community?: string
  search?: string
}

interface CaseStudiesFiltersProps {
  currentFilters: Filters
}

const topicOptions = [
  { value: 'climate-environment', label: 'Climate Change & Environment' },
  { value: 'mental-health', label: 'Mental Health & Wellbeing' },
  { value: 'community-health', label: 'Community Health & Social Care' },
  { value: 'youth-education', label: 'Youth Engagement & Education' },
  { value: 'policy-governance', label: 'Policy Research & Governance' },
  { value: 'technology-innovation', label: 'Technology & Innovation' },
  { value: 'economic-development', label: 'Economic Development' },
  { value: 'cultural-arts', label: 'Cultural Heritage & Arts' },
  { value: 'food-agriculture', label: 'Food Security & Agriculture' },
  { value: 'urban-planning', label: 'Urban Planning & Infrastructure' },
  { value: 'human-rights', label: 'Human Rights & Social Justice' },
  { value: 'migration', label: 'Migration & Displacement' },
  { value: 'gender-equality', label: 'Gender Equality' },
  { value: 'disaster-resilience', label: 'Disaster Risk & Resilience' },
  { value: 'digital-inclusion', label: 'Digital Inclusion' },
  { value: 'other', label: 'Other' },
]

export default function CaseStudiesFilters({ currentFilters }: CaseStudiesFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('caseStudies.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

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
    startTransition(() => {
      router.push(pathname)
    })
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    updateFilter('search', value)
  }

  const getActiveFiltersCount = () => {
    return Object.values(currentFilters).filter(Boolean).length
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <Card className={cn(
      "transition-all duration-200",
      hasActiveFilters && "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Main Search and Quick Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
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

          {/* Topic Filter */}
          <Select
            value={currentFilters.topic || ''}
            onValueChange={(value) => updateFilter('topic', value)}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                <SelectValue placeholder={t('topicPlaceholder')} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topicOptions.map((topic) => (
                <SelectItem key={topic.value} value={topic.value}>
                  {topic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                  <h4 className="font-medium">Advanced Filters</h4>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Clear all
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Tag Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    {t('tag')}
                  </label>
                  <Select
                    value={currentFilters.tag || ''}
                    onValueChange={(value) => updateFilter('tag', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tagPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {/* These would be loaded from your tags */}
                      <SelectItem value="tag1">Tag 1</SelectItem>
                      <SelectItem value="tag2">Tag 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Community Filter */}
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
                      <SelectItem value="all">All Communities</SelectItem>
                      {/* These would be loaded from your communities */}
                      <SelectItem value="community1">Community 1</SelectItem>
                      <SelectItem value="community2">Community 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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

            {currentFilters.topic && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {topicOptions.find(t => t.value === currentFilters.topic)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter('topic', undefined)}
                  className="h-4 w-4 p-0 ml-1"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {currentFilters.tag && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {currentFilters.tag}
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