'use client'

/**
 * CollaboratePageClient - Client Component
 * Handles search, filters, and interactive state for the collaborate page
 * Full i18n and RTL support
 */

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { buildCollaborateParams } from '@/lib/collaborate-filters'
import { CommunityFilters, type CommunityFiltersState } from '@/components/collaborate/community-filters'
import { UserCarousel } from '@/components/collaborate/user-carousel'
import { cn } from '@/lib/utils'
import { heading } from '@/lib/design-tokens'
import { PageContainer } from '@/components/ui/page-container'
import { Search, X, FolderKanban } from 'lucide-react'
import { FEATURES } from '@/lib/features'
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
  'ssa': 'subSaharanAfrica',
  'nawa': 'northernAfricaWesternAsia',
  'csa': 'centralSouthernAsia',
  'esea': 'easternSouthEasternAsia',
  'lac': 'latinAmericaCaribbean',
  'oce': 'oceania',
  'enam': 'europeNorthAmerica'
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
  /** Rendered inside the Collaborate tabs shell — the parent owns the page
   *  container and header, so skip both here. */
  embedded?: boolean
}

export function CollaboratePageClient({
  initialCommunityUsers,
  communities,
  userCommunityIds,
  locale,
  initialSearch,
  initialFilters,
  embedded
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

  const Wrapper = embedded ? "div" : PageContainer
  return (
    <Wrapper>
      {!embedded && (
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={cn("font-bold font-heading text-ccm-midnight mb-2 text-balance", heading('lg'))}>{t('pageTitle')}</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">{t('pageDescription')}</p>
        </div>
        {/* Workspaces UI hidden in the intermediate release; infra stays. */}
        {FEATURES.engagement && (
          <Button asChild variant="outline" className="flex-shrink-0">
            <Link href="/collaborations" className="flex items-center gap-2">
              <FolderKanban className="size-4" />
              <span>{t('startCollaboration')}</span>
            </Link>
          </Button>
        )}
      </div>
      )}

      {/* Search + horizontal filters, full width */}
      <div className="mb-8 space-y-4">
        {/* Search — matches the rounded pill used across content pages. */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(searchInput)
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            className="h-11 w-full rounded-full border border-input bg-background ps-10 pe-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(''); handleSearch('') }}
              aria-label={tCommon('clear')}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
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
            // communityName is the regionalName enum value (e.g., "esea")
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
              />
            )
          })}
        </div>
      )}
    </Wrapper>
  )
}
