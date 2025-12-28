'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getLocalizedText } from '@/lib/localization-utils'
import { rtlLocales } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import Image from "next/image";
import SectionContainer from "@/components/ui/section-container";

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
  const searchParams = useSearchParams()
  const isRTL = rtlLocales.includes(locale)

  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [showFilters, setShowFilters] = useState(false)

  // Initialize filters with all items checked by default
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialFilters.regions.length > 0
      ? initialFilters.regions
      : communities.map(c => c.slug)
  )

  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialFilters.tags.length > 0 ? initialFilters.tags : allTags
  )

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery) {
      params.set('search', searchQuery)
    }

    // Only add to URL if not all selected (optimization)
    if (selectedRegions.length !== communities.length) {
      params.set('regions', selectedRegions.join(','))
    }

    if (selectedTags.length !== allTags.length) {
      params.set('tags', selectedTags.join(','))
    }

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/${locale}/lived-experiences${newUrl}`, { scroll: false })
  }, [searchQuery, selectedRegions, selectedTags, communities.length, allTags.length, locale, router])

  // Filter videos based on selected filters and search
  const filteredCommunityVideos = useMemo(() => {
    const filtered: Record<string, any[]> = {}

    for (const [communityName, videos] of Object.entries(initialCommunityVideos)) {
      // Find the community to check if it's selected
      const community = communities.find(c => {
        const name = typeof c.name === 'string' ? c.name : c.name.en
        return name === communityName
      })

      if (!community || !selectedRegions.includes(community.slug)) {
        continue
      }

      // Filter videos by tags and search
      const filteredVideos = videos.filter(video => {
        // Check tags filter
        const hasMatchingTag = video.tags?.some((tag: string) => selectedTags.includes(tag))
        if (!hasMatchingTag) return false

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
    setSelectedRegions(communities.map(c => c.slug))
    setSelectedTags(allTags)
  }

  const hasActiveFilters = searchQuery ||
    selectedRegions.length !== communities.length ||
    selectedTags.length !== allTags.length

  const totalVideos = Object.values(filteredCommunityVideos).flat().length

  return (
    <div className="py-8 space-y-8">
        {/* Header */}
        <SectionContainer>
            <div
                dir={isRTL ? "rtl" : "ltr"}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center"
            >
                {/* Text Content - Always first in DOM */}
                <div className="flex flex-col justify-start min-w-0 w-full space-y-2 text-center lg:text-start">
                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                        {t("title")}
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                        {t("description")}
                    </p>
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
                            quality={100}
                            priority
                        />
                    </div>
                </div>
            </div>
        </SectionContainer>


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

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('filters')}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {totalVideos}
              </Badge>
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('clearFilters')}
            </Button>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border rounded-lg p-6 space-y-6 bg-card">
            {/* Regions Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t('filterByRegion')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedRegions.length === communities.length) {
                      setSelectedRegions([])
                    } else {
                      setSelectedRegions(communities.map(c => c.slug))
                    }
                  }}
                >
                  {selectedRegions.length === communities.length ? t('deselectAll') : t('selectAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {communities.map((community) => {
                  const communityName = typeof community.name === 'string'
                    ? community.name
                    : getLocalizedText(community.name, locale, community.name)
                  const isSelected = selectedRegions.includes(community.slug)

                  return (
                    <Badge
                      key={community._id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleRegion(community.slug)}
                    >
                      {communityName}
                    </Badge>
                  )
                })}
              </div>
            </div>

            {/* Tags Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{t('filterByTag')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedTags.length === allTags.length) {
                      setSelectedTags([])
                    } else {
                      setSelectedTags(allTags)
                    }
                  }}
                >
                  {selectedTags.length === allTags.length ? t('deselectAll') : t('selectAll')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-12">
        {Object.keys(filteredCommunityVideos).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('noResults')}</p>
          </div>
        ) : (
          Object.entries(filteredCommunityVideos).map(([communityName, videos]) => (
            <section key={communityName} className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{communityName}</h2>
                <p className="text-sm text-muted-foreground">
                  {videos.length} {videos.length === 1 ? t('video') : t('videos')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video._id} className="space-y-3">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                      {video.videoUrl && (
                        <iframe
                          src={video.videoUrl.replace('watch?v=', 'embed/')}
                          title={getLocalizedText(video.title, locale, video.title)}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h5 className="font-semibold line-clamp-4">
                        {getLocalizedText(video.title, locale, video.title)}
                      </h5>
                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {video.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
