'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Video } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { heading } from '@/lib/design-tokens'
import { Button } from '@/components/ui/button'
import { getLocalizedText } from '@/lib/localization-utils'
import { rtlLocales } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import Image from "next/image";
import SectionContainer from "@/components/ui/section-container";
import { ScrollRow } from "@/components/ui/scroll-row";
import { LivedExperienceVideoCard } from "@/components/lived-experiences/video-card";
import { ContentFilters } from "@/components/ui/content-filters";

/** Dereferenced tag doc on a lived-experience video (same CMS tag shape). */
interface LivedVideoTag {
  _id: string
  label?: Record<string, string> | string
  value?: string
  color?: string
}

/** The fields of a lived-experience video this page reads. */
interface LivedVideo {
  _id: string
  title?: { en?: string; es?: string; fr?: string; ar?: string } | string
  format?: 'video' | 'audio' | 'written'
  videoUrl?: string
  thumbnailUrl?: string
  tags?: LivedVideoTag[]
}

/** Regional community row used for the region filter chips. */
interface LivedCommunity {
  _id?: string
  name: Record<string, string> | string
  slug: string
}

interface LivedExperiencesPageClientProps {
  initialCommunityVideos: Record<string, LivedVideo[]>
  communities: LivedCommunity[]
  /** Dereferenced tag docs ({ _id, label, value, color }). */
  allTags: Array<{ _id: string; label?: Record<string, string> | string; value?: string; color?: string }>
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
    const filtered: Record<string, LivedVideo[]> = {}

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
        // Tags are now dereferenced docs — match on value (fall back to _id).
        if (selectedTags.length > 0) {
          const hasMatchingTag = video.tags?.some((tag) =>
            selectedTags.includes(tag?.value as string) || selectedTags.includes(tag?._id)
          )
          if (!hasMatchingTag) return false
        }

        // Check search query
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          const title = typeof video.title === 'string' ? undefined : video.title
          const titleMatch = title?.en?.toLowerCase().includes(query) ||
            title?.es?.toLowerCase().includes(query) ||
            title?.fr?.toLowerCase().includes(query) ||
            title?.ar?.toLowerCase().includes(query)

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

  // Rows keep the CMS order (region order, newest videos first within each row).
  const sortedEntries = Object.entries(filteredCommunityVideos)

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
        {/* Unified content filters — collapsed, multi-select (shared with news
            + case studies). Sort + count sit alongside. */}
        <div className="space-y-3">
          <ContentFilters
            search={{ value: searchQuery, onChange: setSearchQuery, placeholder: t('searchPlaceholder') }}
            onClearAll={clearFilters}
            groups={[
              {
                id: 'regions',
                label: t('filterByRegion'),
                selected: selectedRegions,
                onToggle: toggleRegion,
                options: communities.map((community) => ({
                  value: community.slug,
                  label: typeof community.name === 'string'
                    ? community.name
                    : getLocalizedText(community.name, locale, community.name as unknown as string),
                })),
              },
              {
                id: 'tags',
                label: t('filterByTag'),
                selected: selectedTags,
                // De-surface the 'Other' tag from the chips.
                options: allTags
                  .filter((tag) => (tag.value || tag._id) !== 'other')
                  .map((tag) => ({
                    value: tag.value || tag._id,
                    label: getLocalizedText(tag.label, locale, tag.value || tag._id),
                  })),
                onToggle: toggleTag,
              },
            ]}
          />

          <span className="text-sm text-muted-foreground">
            {totalVideos} {totalVideos === 1 ? t('video') : t('videos')}
          </span>
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
                  title={getLocalizedText(video.title, locale, video.title as string)}
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  tags={video.tags}
                  format={video.format}
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
