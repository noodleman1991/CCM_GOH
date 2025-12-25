"use client"

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  tags?: string[]
  communities?: string[]
  search?: string
}

interface CaseStudiesFiltersProps {
  currentFilters: Filters
  tags?: Array<{
    _id: string
    label: Record<string, string> | string
    value: string
    color?: string
    caseStudyCount?: number
  }>
  communities?: Array<{
    _id: string
    name: Record<string, string> | string
    slug: string
    caseStudyCount?: number
  }>
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

export default function CaseStudiesFilters({
  currentFilters,
  tags = [],
  communities = []
}: CaseStudiesFiltersProps) {
  const locale = useLocale()
  const t = useTranslations('caseStudies.filters')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentFilters.search || '')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Helper function to get localized text
  const getLocalizedValue = (value: Record<string, string> | string, locale: string) => {
    if (typeof value === 'string') return value
    return value[locale] || value['en'] || Object.values(value)[0] || ''
  }

  // Get localized tag label
  const getTagLabel = (tag: typeof tags[0]) => {
    return getLocalizedValue(tag.label, locale)
  }

  // Get localized community name
  const getCommunityName = (community: typeof communities[0]) => {
    return getLocalizedValue(community.name, locale)
  }

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

  const toggleArrayFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentValues = params.getAll(key)

    if (currentValues.includes(value)) {
      // Remove the value
      params.delete(key)
      currentValues.filter(v => v !== value).forEach(v => params.append(key, v))
    } else {
      // Add the value
      params.append(key, value)
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
    let count = 0
    if (currentFilters.topic) count++
    if (currentFilters.tags && currentFilters.tags.length > 0) count += currentFilters.tags.length
    if (currentFilters.communities && currentFilters.communities.length > 0) count += currentFilters.communities.length
    if (currentFilters.search) count++
    return count
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
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {currentFilters.topic
                    ? topicOptions.find(t => t.value === currentFilters.topic)?.label || t('topicPlaceholder')
                    : t('topicPlaceholder')}
                </span>
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
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      {t('tag')}
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {tags.map((tag) => (
                        <div key={tag._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag._id}`}
                            checked={currentFilters.tags?.includes(tag.value) || false}
                            onCheckedChange={() => toggleArrayFilter('tags', tag.value)}
                          />
                          <Label
                            htmlFor={`tag-${tag._id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {getTagLabel(tag)}
                            {tag.caseStudyCount !== undefined && tag.caseStudyCount > 0 && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({tag.caseStudyCount})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Filter */}
                {communities.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t('community')}
                    </label>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {communities.map((community) => (
                        <div key={community._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`community-${community._id}`}
                            checked={currentFilters.communities?.includes(community.slug) || false}
                            onCheckedChange={() => toggleArrayFilter('communities', community.slug)}
                          />
                          <Label
                            htmlFor={`community-${community._id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {getCommunityName(community)}
                            {community.caseStudyCount !== undefined && community.caseStudyCount > 0 && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({community.caseStudyCount})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {currentFilters.tags && currentFilters.tags.map((tagValue) => {
              const tag = tags.find(t => t.value === tagValue)
              return (
                <Badge key={tagValue} variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tag ? getTagLabel(tag) : tagValue}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArrayFilter('tags', tagValue)}
                    className="h-4 w-4 p-0 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )
            })}

            {currentFilters.communities && currentFilters.communities.map((communitySlug) => {
              const community = communities.find(c => c.slug === communitySlug)
              return (
                <Badge key={communitySlug} variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {community ? getCommunityName(community) : communitySlug}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleArrayFilter('communities', communitySlug)}
                    className="h-4 w-4 p-0 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )
            })}

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