'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Filter, X, MapPin, Tag as TagIcon, ArrowUpDown, Video } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { heading } from '@/lib/design-tokens'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FilterChip, RemovableChip } from '@/components/ui/filter-chip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getLocalizedText } from '@/lib/localization-utils'
import { rtlLocales } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import Image from "next/image";
import SectionContainer from "@/components/ui/section-container";
import { ScrollRow } from "@/components/ui/scroll-row";
import { LivedExperienceVideoCard } from "@/components/lived-experiences/video-card";

interface LivedExperiencesPageClientProps {
  initialCommunityVideos: Record<string, any[]>
  communities: any[]
  allTags: string[]
  locale: string
  initialSearch: string
  initialFilters: {
    regions: string[]
    tags: string[]
  }
}

export default function LivedExperiencesPageClient({
  initialCommunityVideos,
  communities,
  allTags,
  locale,
  initialSearch,
  initialFilters
}: LivedExperiencesPageClientProps) {
  const t = useTranslations('livedExperiences')
  const router = useRouter()
  const isRTL = rtlLocales.includes(locale)

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'default' | 'az'>('default')

  // Inclusion model: empty selection = show everything; selecting narrows.
  const [selectedRegions, setSelectedRegions] = useState<string[]>(initialFilters.regions)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialFilters.tags)

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('search', searchQuery)
    if (selectedRegions.length > 0) params.set('regions', selectedRegions.join(','))
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/${locale}/lived-experiences${newUrl}`, { scroll: false })
  }, [searchQuery, selectedRegions, selectedTags, locale, router])

  // Filter videos. Inclusion: no region/tag selected = no filter on that axis.
  const filteredCommunityVideos = useMemo(() => {
    const filtered: Record<string, any[]> = {}

    for (const [communityName, videos] of Object.entries(initialCommunityVideos)) {
      const community = communities.find(c => {
        const name = typeof c.name === 'string' ? c.name : c.name.en
        return name === communityName
      })

      // Region filter (inclusion): if any regions selected, this one must be among them.
      if (selectedRegions.length > 0 && (!community || !selectedRegions.includes(community.slug))) {
        continue
      }

      const filteredVideos = videos.filter(video => {
        // Tag filter (inclusion): if any tags selected, the video must match one.
        if (selectedTags.length > 0) {
          const hasMatchingTag = video.tags?.some((tag: string) => selectedTags.includes(tag))
          if (!hasMatchingTag) return false
        }

        // Check search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const titleMatch = video.title?.en?.toLowerCase().includes(query) ||
            video.title?.es?.toLowerCase().includes(query) ||
            video.title?.fr?.toLowerCase().includes(query) ||
            video.title?.ar?.toLowerCase().includes(query)

          if (!titleMatch) return false
        }

        return true
      })

      if (filteredVideos.length > 0) {
        filtered[communityName] = filteredVideos
      }
    }

    return filtered
  }, [initialCommunityVideos, selectedRegions, selectedTags, searchQuery, communities])

  const toggleRegion = (slug: string) => {
    setSelectedRegions(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedRegions([])
    setSelectedTags([])
  }

  const hasActiveFilters = Boolean(searchQuery) ||
    selectedRegions.length > 0 ||
    selectedTags.length > 0

  // Sort the rows: 'default' keeps the CMS order (by region order, newest videos
  // first within each row); 'az' alphabetises the rows by community name.
  const sortedEntries = useMemo(() => {
    const entries = Object.entries(filteredCommunityVideos)
    if (sortBy === 'az') {
      return [...entries].sort(([a], [b]) => a.localeCompare(b, locale))
    }
    return entries
  }, [filteredCommunityVideos, sortBy, locale])

  const totalVideos = Object.values(filteredCommunityVideos).flat().length

  // Label a region slug for the active-filter summary chips.
  const regionLabel = (slug: string) => {
    const c = communities.find(cm => cm.slug === slug)
    if (!c) return slug
    return typeof c.name === 'string' ? c.name : getLocalizedText(c.name, locale, c.name)
  }

  return (
    <div className="py-8 space-y-8">
        {/* Header */}
        <SectionContainer>
            <div
                dir={isRTL ? "rtl" : "ltr"}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
            >
                {/* Text Content - Always first in DOM */}
                <div className="flex flex-col justify-start min-w-0 w-full space-y-4 text-center lg:text-start">
                    <div className="space-y-2">
                        <h1 className={cn("font-bold font-heading tracking-tight text-balance text-ccm-midnight", heading('xl'))}>
                            {t("title")}
                        </h1>
                        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                            {t("description")}
                        </p>
                    </div>
                    <div className="flex justify-center lg:justify-start">
                        <Button asChild>
                            <Link href="/lived-experiences/submit" className="gap-2">
                                <Video className="w-4 h-4" />
                                {t("shareCta")}
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Image */}
                <div className="flex flex-col justify-center min-w-0 w-full">
                    <div className="relative w-full max-w-md mx-auto overflow-hidden">
                        <Image
                            className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0 w-full h-auto object-cover"
                            src="/illustrations/hubLivedExperiencespng.png"
                            alt="A figure jumping off a book - illustration"
                            width={800}
                            height={800}
                            priority
                        />
                    </div>
                </div>
            </div>
        </SectionContainer>

      {/* Search, Filters, and Results Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search and Filters */}
        <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className={cn(
            "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground",
            isRTL ? "right-3" : "left-3"
          )} />
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(isRTL ? "pr-10" : "pl-10")}
          />
        </div>

        {/* Filter toggle + sort + clear */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('filters')}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ms-1">
                {selectedRegions.length + selectedTags.length}
              </Badge>
            )}
          </Button>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'default' | 'az')}>
            <SelectTrigger size="sm" className="w-auto gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('sortNewest')}</SelectItem>
              <SelectItem value="az">{t('sortAZ')}</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            {totalVideos} {totalVideos === 1 ? t('video') : t('videos')}
          </span>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ms-auto flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('clearFilters')}
            </Button>
          )}
        </div>

        {/* Active-filter summary chips (click × to remove) */}
        {(selectedRegions.length > 0 || selectedTags.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {selectedRegions.map((slug) => (
              <RemovableChip
                key={`r-${slug}`}
                label={regionLabel(slug)}
                icon={MapPin}
                onRemove={() => toggleRegion(slug)}
                removeLabel={t('clearFilters')}
              />
            ))}
            {selectedTags.map((tag) => (
              <RemovableChip
                key={`t-${tag}`}
                label={tag}
                icon={TagIcon}
                onRemove={() => toggleTag(tag)}
                removeLabel={t('clearFilters')}
              />
            ))}
          </div>
        )}

        {/* Filters Panel — inclusion model: nothing selected shows everything */}
        {showFilters && (
          <div className="border rounded-lg p-6 space-y-6 bg-card">
            {/* Regions Filter */}
            <div className="space-y-3">
              <h3 className="font-semibold">{t('filterByRegion')}</h3>
              <div className="flex flex-wrap gap-2">
                {communities.map((community) => {
                  const communityName = typeof community.name === 'string'
                    ? community.name
                    : getLocalizedText(community.name, locale, community.name)
                  return (
                    <FilterChip
                      key={community._id}
                      label={communityName}
                      active={selectedRegions.includes(community.slug)}
                      onClick={() => toggleRegion(community.slug)}
                    />
                  )
                })}
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">{t('filterByTag')}</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <FilterChip
                      key={tag}
                      label={tag}
                      active={selectedTags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-12">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </div>
        ) : (
          sortedEntries.map(([communityName, videos]) => (
            <ScrollRow
              key={communityName}
              isRTL={isRTL}
              title={communityName}
              subtitle={`${videos.length} ${videos.length === 1 ? t('video') : t('videos')}`}
            >
              {videos.map((video) => (
                <LivedExperienceVideoCard
                  key={video._id}
                  title={getLocalizedText(video.title, locale, video.title)}
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  tags={video.tags}
                />
              ))}
            </ScrollRow>
          ))
        )}
      </div>
      </div>
    </div>
  )
}
