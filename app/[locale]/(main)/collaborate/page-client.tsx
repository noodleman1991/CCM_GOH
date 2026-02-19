'use client'

/**
 * CollaboratePageClient - Client Component
 * Handles search, filters, and interactive state for the collaborate page
 * Full i18n and RTL support
 */

import { useState, useEffect, useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CommunityFilters, type CommunityFiltersState } from '@/components/collaborate/community-filters'
import { UserCarousel } from '@/components/collaborate/user-carousel'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import type { SupportedLocale, LocalizedUser } from '@/types/prisma'

// All possible filter values (workTypes and expertiseAreas are static enums)
const ALL_WORK_TYPES = [
  'RESEARCH',
  'POLICY',
  'LIVED_EXPERIENCE_EXPERT',
  'NGO',
  'COMMUNITY_ORGANIZATION',
  'EDUCATION_TEACHING'
]

const ALL_EXPERTISE_AREAS = [
  'CLIMATE_CHANGE',
  'MENTAL_HEALTH',
  'HEALTH',
  'EDUCATION',
  'SOCIAL_JUSTICE'
]

// Map regional name enum values to translation keys
const REGIONAL_NAME_TO_TRANSLATION_KEY: Record<string, string> = {
  'SUB_SAHARAN_AFRICA': 'subSaharanAfrica',
  'NORTHERN_AFRICA_AND_WESTERN_ASIA': 'northernAfricaWesternAsia',
  'CENTRAL_AND_SOUTHERN_ASIA': 'centralSouthernAsia',
  'EASTERN_AND_SOUTH_EASTERN_ASIA': 'easternSouthEasternAsia',
  'LATIN_AMERICA_AND_THE_CARIBBEAN': 'latinAmericaCaribbean',
  'OCEANIA': 'oceania',
  'EUROPE_AND_NORTH_AMERICA': 'europeNorthAmerica'
}

interface CollaboratePageClientProps {
  initialCommunityUsers: Record<string, LocalizedUser[]>
  communities: Array<{
    id: string
    name: string
    regionalName: string | null
  }>
  userCommunityIds: string[]
  locale: SupportedLocale
  initialSearch?: string
  initialFilters?: {
    workTypes: string[]
    expertiseAreas: string[]
    communities: string[]
  }
}

export function CollaboratePageClient({
  initialCommunityUsers,
  communities,
  userCommunityIds,
  locale,
  initialSearch,
  initialFilters
}: CollaboratePageClientProps) {
  const t = useTranslations('collaborate')
  const tNav = useTranslations('navigation')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const isRTL = locale === 'ar'

  // Get all community IDs (UUIDs) for filter initialization
  const ALL_COMMUNITY_IDS = useMemo(() => communities.map(c => c.id), [communities])

  const [searchInput, setSearchInput] = useState(initialSearch || '')

  // Initialize filters from URL params or defaults to all checked
  const [filters, setFilters] = useState<CommunityFiltersState>({
    communities: initialFilters?.communities.length ?
      initialFilters.communities :
      [...ALL_COMMUNITY_IDS],
    workTypes: initialFilters?.workTypes.length ?
      initialFilters.workTypes :
      [...ALL_WORK_TYPES],
    expertiseAreas: initialFilters?.expertiseAreas.length ?
      initialFilters.expertiseAreas :
      [...ALL_EXPERTISE_AREAS]
  })

  // No local state for community users - always use prop from server
  const communityUsers = initialCommunityUsers
  const searchQuery = initialSearch || ''

  // Handle search submission - updates URL to trigger server re-render
  const handleSearch = (query: string) => {
    const params = new URLSearchParams()

    // Add search query
    if (query) {
      params.set('search', query)
    }

    // Add filter params only if not "all selected" (to keep URL clean)
    if (filters.workTypes.length > 0 && filters.workTypes.length < ALL_WORK_TYPES.length) {
      params.set('workTypes', filters.workTypes.join(','))
    }
    if (filters.expertiseAreas.length > 0 && filters.expertiseAreas.length < ALL_EXPERTISE_AREAS.length) {
      params.set('expertiseAreas', filters.expertiseAreas.join(','))
    }
    if (filters.communities.length > 0 && filters.communities.length < ALL_COMMUNITY_IDS.length) {
      params.set('communities', filters.communities.join(','))
    }

    // Navigate with new params - will trigger server component re-render
    router.push(`?${params.toString()}`)
  }

  // Handle filter changes - updates URL to trigger server re-render
  const handleFilterChange = (newFilters: CommunityFiltersState) => {
    setFilters(newFilters)

    const params = new URLSearchParams()

    // Preserve search query
    if (searchQuery) {
      params.set('search', searchQuery)
    }

    // Add filter params only if not "all selected"
    if (newFilters.workTypes.length > 0 && newFilters.workTypes.length < ALL_WORK_TYPES.length) {
      params.set('workTypes', newFilters.workTypes.join(','))
    }
    if (newFilters.expertiseAreas.length > 0 && newFilters.expertiseAreas.length < ALL_EXPERTISE_AREAS.length) {
      params.set('expertiseAreas', newFilters.expertiseAreas.join(','))
    }
    if (newFilters.communities.length > 0 && newFilters.communities.length < ALL_COMMUNITY_IDS.length) {
      params.set('communities', newFilters.communities.join(','))
    }

    // Navigate with new params - will trigger server component re-render
    router.push(`?${params.toString()}`)
  }

  // Filter communities based on active filters
  // In exclusion mode: checked items are shown, unchecked items are hidden
  const filteredCommunities = useMemo(() => {
    // If all communities are checked, show all
    if (filters.communities.length === ALL_COMMUNITY_IDS.length) {
      return Object.keys(communityUsers)
    }

    // Otherwise, only show checked communities
    const selectedCommunityNames = filters.communities.map(id => {
      const community = communities.find(c => c.id === id)
      return community?.regionalName || community?.name || ''
    })

    return Object.keys(communityUsers).filter(name =>
      selectedCommunityNames.includes(name)
    )
  }, [communityUsers, filters.communities, communities, ALL_COMMUNITY_IDS])

  // Check if there are active filters (filters differ from "all selected")
  const hasActiveFilters =
    searchQuery ||
    filters.communities.length < ALL_COMMUNITY_IDS.length ||
    filters.workTypes.length < ALL_WORK_TYPES.length ||
    filters.expertiseAreas.length < ALL_EXPERTISE_AREAS.length

  const handleClearFilters = () => {
    setSearchInput('')
    // Reset to all checked (show all)
    setFilters({
      communities: [...ALL_COMMUNITY_IDS],
      workTypes: [...ALL_WORK_TYPES],
      expertiseAreas: [...ALL_EXPERTISE_AREAS]
    })
    // Navigate to clean URL (no params) - will trigger server re-render with all data
    router.push(`/${locale}/collaborate`)
  }

  return (
    <div className={cn('container mx-auto py-8 px-4', isRTL && 'rtl')}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('pageDescription')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24">
            <CommunityFilters
              filters={filters}
              onChangeAction={handleFilterChange}
              communities={communities}
              isRTL={isRTL}
            />
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {/* Search */}
          <div className="mb-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSearch(searchInput)
              }}
              className={cn('flex gap-2', isRTL && 'flex-row-reverse')}
            >
              <div className="relative flex-1">
                <Search className={cn(
                  'absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground',
                  isRTL ? 'right-3' : 'left-3'
                )} />
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className={cn(isRTL ? 'pr-10' : 'pl-10')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              <Button type="submit">
                {tCommon('search')}
              </Button>
            </form>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className={cn('flex flex-wrap items-center gap-2 mt-4', isRTL && 'flex-row-reverse')}>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('activeFilters.title')}
                </span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    {t('activeFilters.search', { query: searchQuery })}
                    <button
                      onClick={() => {
                        setSearchInput('')
                        handleSearch('')
                      }}
                      className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-7"
                >
                  {t('activeFilters.clear')}
                </Button>
              </div>
            )}
          </div>

          {/* Community Carousels */}
          {filteredCommunities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium mb-2">{t('noResults')}</p>
              <p className="text-muted-foreground mb-4">{t('noResultsDescription')}</p>
              <Button onClick={handleClearFilters}>
                {t('filters.clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredCommunities.map(communityName => {
                // communityName is the regionalName enum value (e.g., "EASTERN_AND_SOUTH_EASTERN_ASIA")
                // or "No Regional Community" for users without a regional community
                const translationKey = communityName === 'No Regional Community'
                  ? 'noRegionalCommunity'
                  : REGIONAL_NAME_TO_TRANSLATION_KEY[communityName]

                const translatedTitle = translationKey
                  ? tNav(`regions.${translationKey}`)
                  : communityName

                return (
                  <UserCarousel
                    key={communityName}
                    title={translatedTitle}
                    users={communityUsers[communityName] || []}
                    defaultExpanded={false}
                  />
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
