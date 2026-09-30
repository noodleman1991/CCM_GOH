'use client'

import { FilterBar } from '@/components/filters/filter-bar'
import { isFiltering, type ActiveFilters, type FilterOptions } from '@/lib/filters/core'
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
import type { LivedExperience } from "@/lib/content/lived-experiences";

interface LivedExperiencesPageClientProps {
  /** Already filtered on the server by the shared engine, grouped by community. */
  communityVideos: Record<string, LivedExperience[]>
  locale: string
  /** The shared filter bar's options and the current selection, from the server page. */
  filterOptions: FilterOptions
  activeFilters: ActiveFilters
}

export default function LivedExperiencesPageClient({
  communityVideos,
  locale,
  filterOptions,
  activeFilters,
}: LivedExperiencesPageClientProps) {
  const filtering = isFiltering(activeFilters)
  const t = useTranslations('livedExperiences')
  const tFilters = useTranslations('filters')
  const isRTL = rtlLocales.includes(locale)

  // Rows keep the CMS order (region order, newest videos first within each row).
  const sortedEntries = Object.entries(communityVideos)
  const totalVideos = Object.values(communityVideos).flat().length

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
        {/* The hub's one filter bar (spec 2026-09-30). */}
        <div className="space-y-3">
          <FilterBar options={filterOptions} active={activeFilters} />

          <span className="text-sm text-muted-foreground">
            {t('videoCount', { count: totalVideos })}
          </span>
        </div>

      {/* Results */}
      <div className="space-y-12">
        {sortedEntries.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">{filtering ? tFilters('empty') : t('noResults')}</p>
            {filtering && (
              <Link href="/lived-experiences" className="text-sm font-semibold text-ccm-sea hover:underline">
                {tFilters('clear')}
              </Link>
            )}
          </div>
        ) : (
          sortedEntries.map(([communityName, videos]) => (
            <ScrollRow
              key={communityName}
              isRTL={isRTL}
              title={communityName}
              subtitle={t('videoCount', { count: videos.length })}
            >
              {videos.map((video) => (
                <LivedExperienceVideoCard
                  key={video.id}
                  title={getLocalizedText(video.title, locale, video.title as string)}
                  videoUrl={video.videoUrl}
                  thumbnailUrl={video.thumbnailUrl}
                  // LivedExperienceVideoCard still speaks the raw CMS tag
                  // shape (`_id`) — adapt at this one boundary rather than
                  // change that component's (out of scope) prop type.
                  tags={video.tags.map((tag) => ({
                    _id: tag.id,
                    label: tag.label,
                    value: tag.value,
                    color: tag.color,
                  }))}
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
