'use client'

/**
 * CollaboratePageClient - Client Component
 * Handles search, filters, and interactive state for the collaborate page
 * Full i18n and RTL support
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { buildCollaborateParams } from '@/lib/collaborate-filters'
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
  /**
   * Decoded filter state from the URL (see lib/collaborate-filters.ts):
   * null = param absent = all selected; [] = explicitly none selected.
   */
  initialFilters?: {
    workTypes: string[] | null
    expertiseAreas: string[] | null
    communities: string[] | null
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
  const isRTL = locale === 'ar'

  // Get all community IDs (UUIDs) for filter initialization
  const ALL_COMMUNITY_IDS = useMemo(() => communities.map(c => c.id), [communities])

  const [searchInput, setSearchInput] = useState(initialSearch || '')

  // Inclusion model: filter state holds ONLY what the user actively selected.
  // Empty arrays mean "no filter" (show everyone), not "show no one".
  const filtersFromProps = useMemo<CommunityFiltersState>(() => ({
    communities: initialFilters?.communities ?? [],
    workTypes: initialFilters?.workTypes ?? [],
    expertiseAreas: initialFilters?.expertiseAreas ?? []
  }), [initialFilters])

  const [filters, setFilters] = useState<CommunityFiltersState>(filtersFromProps)

  // Re-sync local state when the URL-derived props change (e.g. back/forward
  // navigation). Serialize-compare to avoid render loops after router.push.
  useEffect(() => {
    setFilters(prev =>
      JSON.stringify(prev) === JSON.stringify(filtersFromProps) ? prev : filtersFromProps
    )
  }, [filtersFromProps])

  useEffect(() => {
    setSearchInput(initialSearch || '')
  }, [initialSearch])

  // No local state for community users - always use prop from server
  const communityUsers = initialCommunityUsers
  const searchQuery = initialSearch || ''

  // Handle search submission - updates URL to trigger server re-render
  const handleSearch = (query: string) => {
    const params = buildCollaborateParams(query, filters)
    // Navigate with new params - will trigger server component re-render
    router.push(`?${params.toString()}`)
  }

  // Handle filter changes - updates URL to trigger server re-render
  const handleFilterChange = (newFilters: CommunityFiltersState) => {
    setFilters(newFilters)

    const params = buildCollaborateParams(searchQuery, newFilters)
    // Navigate with new params - will trigger server component re-render
    router.push(`?${params.toString()}`)
  }

  // Render exactly the carousels the server returned.
  // All filtering (communities, work types, expertise, search) is applied server-side
  // and reflected in `communityUsers`. Re-filtering here would drop groups the server
  // intended to show (e.g. the "No Regional Community" group). We only impose a stable
  // display order: regional groups in the `communities` prop order, then "No Regional
  // Community" last, then any remaining keys.
  const filteredCommunities = useMemo(() => {
    const keys = Object.keys(communityUsers)
    const orderedRegional = communities
      .map(c => c.regionalName || c.name)
      .filter(name => keys.includes(name))

    const seen = new Set(orderedRegional)
    const noRegional = keys.includes('No Regional Community') ? ['No Regional Community'] : []
    seen.add('No Regional Community')
    const rest = keys.filter(name => !seen.has(name))

    return [...orderedRegional, ...rest, ...noRegional]
  }, [communityUsers, communities])

  // Inclusion model: a filter is "active" when the user has selected something
  // (or searched). Empty = no filter.
  const hasActiveFilters = Boolean(
    searchQuery ||
    filters.communities.length ||
    filters.workTypes.length ||
    filters.expertiseAreas.length
  )

  const handleClearFilters = () => {
    setSearchInput('')
    setFilters({ communities: [], workTypes: [], expertiseAreas: [] })
    // Navigate to clean URL (no params) — server re-renders with everyone.
    router.push('/collaborate')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('pageTitle')}</h1>
        <p className="text-muted-foreground">{t('pageDescription')}</p>
      </div>

      {/* Search + horizontal filters, full width */}
      <div className="mb-8 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(searchInput)
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="ps-10"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <Button type="submit">
            {tCommon('search')}
          </Button>
        </form>

        {/* Horizontal filter bar, directly under the search */}
        <CommunityFilters
          filters={filters}
          onChangeAction={handleFilterChange}
          communities={communities}
          isRTL={isRTL}
        />
      </div>

      {/* Community Carousels */}
      {filteredCommunities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium mb-2">{t('noResults')}</p>
          <p className="text-muted-foreground mb-4">{t('noResultsDescription')}</p>
          {hasActiveFilters && (
            <Button onClick={handleClearFilters}>
              {t('filters.clearFilters')}
            </Button>
          )}
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
    </div>
  )
}
