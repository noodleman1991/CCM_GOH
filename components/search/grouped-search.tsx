'use client'

import { InstantSearch, Configure, useHits, useStats } from 'react-instantsearch'
import type { SearchClient } from 'algoliasearch'
import { ALGOLIA_INDICES } from '@/lib/algolia'
import type {
  CaseStudySearchRecord,
  AgendaSearchRecord,
  NewsSearchRecord,
  UserSearchRecord,
} from '@/lib/algolia'
import { useAlgoliaSearchClient } from '@/lib/algolia-client'
import { SearchErrorBoundary } from './search-error-boundary'
import { Card, CardContent } from '@/components/ui/card'
import { TypedCard } from '@/components/cards/typed-card'
import type { TypedCardItem } from '@/lib/cards/type-style'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/components/ui/search-input'
import { FilterChip } from '@/components/ui/filter-chip'
import { FilterBar } from '@/components/ui/filter-bar'
import { RecentEverywhereCards } from '@/components/atlas/region-content-cards'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { getLocalizedTitle, getLocalizedExcerpt } from '@/lib/localization-utils'
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, REGION_COLOR } from '@/lib/maps/region-codes'
import { COLOR, regionColor } from '@/lib/ccm-colors'
import { cn } from '@/lib/utils'

/** How many hits each group previews before "See all". */
const PREVIEW_COUNT = 4
const SEARCH_DEBOUNCE_MS = 250

/* ------------------------------------------------------------------ */
/* Shared search field — owns the ?q= URL param, drives every group.   */
/* ------------------------------------------------------------------ */

function GroupedSearchBox({
  value,
  onChange,
}: {
  value: string
  onChange: (q: string) => void
}) {
  const t = useTranslations('search')
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional prop->draft sync for the debounced input
  useEffect(() => setLocal(value), [value])
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setLocal(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange(v), SEARCH_DEBOUNCE_MS)
  }

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setLocal('')
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <SearchInput
      containerClassName="w-full max-w-2xl"
      ref={inputRef}
      value={local}
      onChange={handleChange}
      placeholder={t('placeholder')}
      autoComplete="off"
      onClear={local ? clear : undefined}
      clearLabel={t('clear')}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Group shell — section header (icon + title + count) + see-all link. */
/* ------------------------------------------------------------------ */

/** Same group-header grammar as the atlas typed-card strips (region-content-
 *  cards.tsx / region-members-strip.tsx): a colour dot matching the type's
 *  atlas-layer colour + its uppercase label + count + an end-aligned "See
 *  all" link to the type's full listing page — so a mixed results page reads
 *  like one continuous system with the atlas's own mixed-type strips. */
function GroupHeader({
  dotColor,
  title,
  count,
  seeAllHref,
}: {
  dotColor: string
  title: string
  count: number | null
  seeAllHref?: string
}) {
  const t = useTranslations('search')
  return (
    <div className="mb-3 flex items-center gap-1.5">
      <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</span>
      {count !== null && (
        <span className="text-xs font-semibold tabular-nums text-[var(--color-ccm-sea)]">{count}</span>
      )}
      {seeAllHref && count !== null && count > PREVIEW_COUNT && (
        <Link
          href={seeAllHref}
          className="ms-auto inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-ccm-sea)] hover:underline"
        >
          {t('seeAll')}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
        </Link>
      )}
    </div>
  )
}

/** Small region chip with its brand-colour dot (via the canonical colour map). */
function RegionChip({ code }: { code: string }) {
  const t = useTranslations()
  const region = code as keyof typeof REGION_I18N_KEY
  const key = REGION_I18N_KEY[region]
  if (!key) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: regionColor(code) }}
        aria-hidden="true"
      />
      {t(`navigation.regions.${key}`)}
    </span>
  )
}

function ContentHits({
  type,
  onCount,
}: {
  type: 'case-studies' | 'news' | 'agendas'
  onCount: (n: number) => void
}) {
  const locale = useLocale()
  const { hits } = useHits({}, { skipSuspense: true })
  const { nbHits } = useStats()

  useEffect(() => { onCount(nbHits) }, [nbHits, onCount])

  const fmtDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString(locale, { year: 'numeric', month: 'short' }) : null

  return (
    <div className="space-y-3">
      {hits.slice(0, PREVIEW_COUNT).map((raw) => {
        if (type === 'case-studies') {
          const hit = raw as unknown as CaseStudySearchRecord
          const author = hit.authors?.[0]?.name
          const item: TypedCardItem = {
            type: 'caseStudy',
            id: hit.objectID,
            title: getLocalizedTitle(hit.title, locale),
            href: `/research-and-action/case-studies/${hit.slug}`,
            place: hit.studyLocation?.name ?? null,
            meta: [author, getLocalizedExcerpt(hit.excerpt, locale)].filter(Boolean).join(' — ') || null,
          }
          return <TypedCard key={hit.objectID} item={item} variant="row" />
        }
        if (type === 'news') {
          const hit = raw as unknown as NewsSearchRecord
          const date = fmtDate(hit.publishedAt)
          const item: TypedCardItem = {
            type: 'newsPost',
            id: hit.objectID,
            title: getLocalizedTitle(hit.title, locale),
            href: `/news/${hit.slug}`,
            meta: [hit.author?.name, date].filter(Boolean).join(' · ') || getLocalizedExcerpt(hit.excerpt, locale) || null,
            date: hit.publishedAt ? new Date(hit.publishedAt).toISOString() : null,
          }
          return <TypedCard key={hit.objectID} item={item} variant="row" />
        }
        // Agendas are download-only docs with no detail page — link each hit
        // to its type's listing page rather than a dead generic href.
        const hit = raw as unknown as AgendaSearchRecord
        const AGENDA_HREF: Record<string, string> = {
          global: '/research-and-action/global-agenda',
          regional: '/research-and-action/regional-agendas',
          community: '/research-and-action/community-agendas',
        }
        const roItem: TypedCardItem = {
          type: 'researchOutput',
          id: hit.objectID,
          title: getLocalizedTitle(hit.title, locale),
          href: AGENDA_HREF[hit.agendaType] ?? '/research-and-action/all-outputs',
          meta: [hit.year, (hit.regionalCommunities || [])[0]].filter(Boolean).join(' · ') || null,
        }
        return <TypedCard key={hit.objectID} item={roItem} variant="row" />
      })}
    </div>
  )
}

function PeopleHits({ onCount }: { onCount: (n: number) => void }) {
  const locale = useLocale()
  const { hits } = useHits({}, { skipSuspense: true })
  const { nbHits } = useStats()

  useEffect(() => { onCount(nbHits) }, [nbHits, onCount])

  const initials = (first?: string, last?: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()

  const tidy = (s: string) => s.replace(/_/g, ' ').toLowerCase()

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {hits.slice(0, PREVIEW_COUNT).map((raw) => {
        const hit = raw as unknown as UserSearchRecord
        const item: TypedCardItem = {
          type: 'person',
          id: hit.objectID,
          title: hit.fullName || hit.username,
          href: `/profiles/${hit.username}`,
          meta:
            (hit.showWorkDetails && (hit.position || hit.organization)
              ? [hit.position, hit.organization].filter(Boolean).join(' · ')
              : (hit.expertiseAreas || []).slice(0, 3).map(tidy).join(' · ')) || null,
          person: { initials: initials(hit.firstName, hit.lastName), image: hit.profileImage ?? null },
        }
        return <TypedCard key={hit.objectID} item={item} variant="row" />
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Regions — fixed 7, client-side name match (no Algolia index).       */
/* ------------------------------------------------------------------ */

function RegionGroup({ query }: { query: string }) {
  const t = useTranslations()
  const tSearch = useTranslations('search')
  const q = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!q) return []
    return REGION_CODES.filter((code) => {
      const label = t(`navigation.regions.${REGION_I18N_KEY[code]}`).toLowerCase()
      return label.includes(q) || code.toLowerCase().includes(q)
    })
  }, [q, t])

  if (matches.length === 0) return null

  return (
    <section>
      <GroupHeader dotColor={COLOR.global} title={tSearch('regions')} count={matches.length} />
      <div className="grid gap-3 sm:grid-cols-2">
        {matches.map((code) => (
          <Card key={code} className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: REGION_COLOR[code] }}
                aria-hidden="true"
              />
              <Link
                href={`/communities/${REGION_TO_RC_SLUG[code]}`}
                className="font-medium text-foreground hover:underline"
              >
                {t(`navigation.regions.${REGION_I18N_KEY[code]}`)}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* A single Algolia-backed group (own index, shared query via Configure)*/
/* ------------------------------------------------------------------ */

function AlgoliaGroup({
  groupKey,
  indexName,
  query,
  filters,
  dotColor,
  title,
  seeAllHref,
  render,
  onCount,
  visible = true,
  searchClient,
}: {
  groupKey: string
  indexName: string
  query: string
  filters: string
  dotColor: string
  title: string
  seeAllHref: string
  render: (onCount: (n: number) => void) => React.ReactNode
  onCount: (key: string, n: number) => void
  /** Group-filter visibility. The group stays MOUNTED when hidden so its count
   *  keeps updating the filter chip badge — we only hide it visually. */
  visible?: boolean
  /** Minted from the /api/search/token secured key (see lib/algolia-client) —
   *  passed in rather than imported so the group never mounts InstantSearch
   *  before a real, working client exists. */
  searchClient: SearchClient
}) {
  const [count, setCount] = useState<number | null>(null)
  const handleCount = useCallback((n: number) => {
    setCount(n)
    onCount(groupKey, n)
  }, [groupKey, onCount])

  // Hide the whole group when empty (STATES §2) or when filtered out.
  const hidden = !visible || (query.trim().length > 0 && count === 0)

  return (
    <SearchErrorBoundary>
      {/* Plain `InstantSearch`, NOT the Next-specific `InstantSearchNext` —
          this group only ever mounts client-side (the `mounted` gate in
          GroupedSearch exists precisely to dodge the documented SSR-hang
          bug), so there's never a real SSR pass for InstantSearchNext to
          hydrate from. Its SSR machinery unconditionally treats the first
          render as "SSR already ran with empty results" (via a truthy but
          server-less `waitForResultsRef`) and skips the real initial query —
          verified 2026-08: with a working key, every group sat at 0 hits
          until a LATER query change forced a refetch. Plain InstantSearch has
          no such assumption and searches correctly on mount. */}
      <InstantSearch
        searchClient={searchClient}
        indexName={indexName}
        insights={false}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure query={query} filters={filters} hitsPerPage={PREVIEW_COUNT} />
        <section className={cn(hidden && 'hidden')}>
          <GroupHeader dotColor={dotColor} title={title} count={count} seeAllHref={seeAllHref} />
          {render(handleCount)}
        </section>
      </InstantSearch>
    </SearchErrorBoundary>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function GroupedSearch() {
  const t = useTranslations('search')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const { isSignedIn } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Mount Algolia widgets only on the client (preserves the SSR-hang fix:
  // several forceMount'd InstantSearch SSR queries can hold the RSC stream open).
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate client-only mount gate (preserves the InstantSearch SSR-hang fix)
  useEffect(() => setMounted(true), [])

  // Search-only client, minted from /api/search/token (see lib/algolia-client) —
  // the env NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY has been invalid since June, so
  // this is the only working path until it's ready.
  const { client: searchClient, error: searchClientError, isLoading: searchClientLoading } = useAlgoliaSearchClient()
  useEffect(() => {
    if (searchClientError) console.error('[search] Algolia search client unavailable:', searchClientError)
  }, [searchClientError])

  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Group filter: 'all' or a specific group key. Lets users scope a cross-type
  // search to one category (the useful filter for a grouped results page).
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const showGroup = (key: string) => activeFilter === 'all' || activeFilter === key

  // Aggregate per-group counts so we can show one "nothing found" state when
  // every group is empty (instead of a blank page of hidden sections).
  const [counts, setCounts] = useState<Record<string, number>>({})
  const onGroupCount = useCallback((key: string, n: number) => {
    setCounts((prev) => (prev[key] === n ? prev : { ...prev, [key]: n }))
  }, [])
  // Reset counts whenever the query changes so stale counts don't linger.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset of stale per-group counts when the query changes
  useEffect(() => { setCounts({}) }, [query])

  // Reflect the query into the URL (?q=) without a full navigation, so it's
  // shareable and the back button works.
  const setQueryAndUrl = useCallback((q: string) => {
    setQuery(q)
    const params = new URLSearchParams(Array.from(searchParams.entries()))
    if (q) params.set('q', q)
    else params.delete('q')
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [router, pathname, searchParams])

  const contentFilter = isSignedIn
    ? 'accessLevel:public OR accessLevel:registered'
    : 'accessLevel:public'

  // People: the index already excludes opted-out users and redacts hidden fields
  // at index time. Respect profileVisibility for the viewer: anonymous sees only
  // PUBLIC profiles; signed-in members also see MEMBERS profiles.
  const peopleFilter = isSignedIn
    ? 'isSearchable:true AND (profileVisibility:PUBLIC OR profileVisibility:MEMBERS)'
    : 'isSearchable:true AND profileVisibility:PUBLIC'

  const hasQuery = query.trim().length > 0

  // Region matches are computed client-side (no Algolia index); include them in
  // the aggregate so the empty state only shows when EVERYTHING is empty.
  const tRoot = useTranslations()
  const regionMatchCount = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return 0
    return REGION_CODES.filter((code) => {
      const label = tRoot(`navigation.regions.${REGION_I18N_KEY[code]}`).toLowerCase()
      return label.includes(q) || code.toLowerCase().includes(q)
    }).length
  }, [query, tRoot])

  // All Algolia groups reported in AND every one is zero AND no region match.
  const ALGOLIA_GROUP_KEYS = ['caseStudies', 'news', 'agendas', 'people']
  const allReported = ALGOLIA_GROUP_KEYS.every((k) => k in counts)
  const algoliaTotal = ALGOLIA_GROUP_KEYS.reduce((sum, k) => sum + (counts[k] || 0), 0)
  const nothingFound =
    hasQuery && allReported && algoliaTotal === 0 && regionMatchCount === 0

  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex justify-center">
        <GroupedSearchBox value={query} onChange={setQueryAndUrl} />
      </div>

      {/* Heading reflecting the active query (WIREFRAMES §4.18). */}
      {hasQuery && (
        <p className="text-center text-sm text-muted-foreground">
          {t('resultsFor', { q: query })}
        </p>
      )}

      {/* Type filter chips (shared FilterChip geometry — atlas's FilterRow
          uses the exact same component). Always available once mounted:
          before a query (priming the scope for when the user types), on a
          result set (scoping it), and on a no-results page (so there's a way
          to pivot instead of a dead end). "All" is the default. */}
      {mounted && (
        <FilterBar aria-label={t('allResults')}>
          {[
            { key: 'all', label: t('allResults'), count: undefined as number | undefined },
            { key: 'caseStudies', label: t('caseStudies'), count: counts.caseStudies },
            { key: 'news', label: t('news'), count: counts.news },
            { key: 'agendas', label: t('agendas'), count: counts.agendas },
            { key: 'people', label: t('people'), count: counts.people },
            { key: 'regions', label: t('regions'), count: hasQuery ? regionMatchCount : undefined },
          ].map((tab) => (
            <FilterChip
              key={tab.key}
              label={tab.label}
              count={tab.count}
              active={activeFilter === tab.key}
              onClick={() => setActiveFilter(tab.key)}
            />
          ))}
        </FilterBar>
      )}

      {!mounted ? (
        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-7 w-40" />
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : !hasQuery ? (
        /* Pre-query "Browse" panel (never a bare empty state): the invitation
           copy, then the same "most recent, everywhere" strip the atlas's own
           no-selection state shows — reusing RecentEverywhereCards verbatim so
           this reads as the SAME feature, not a lookalike. */
        <div className="space-y-8">
          <div className="py-8 text-center">
            <p className="font-heading text-lg font-semibold text-ccm-midnight">{t('typeToSearch')}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t('typeToSearchHint')}</p>
          </div>
          <div>
            <h2 className="mb-3 font-heading text-lg font-semibold text-ccm-midnight">
              {tRoot('atlas.latestEverywhere')}
            </h2>
            <RecentEverywhereCards limit={6} />
          </div>
        </div>
      ) : (
        <>
          {nothingFound && (
            <div className="py-16 text-center">
              <p className="font-heading text-lg font-semibold text-ccm-midnight">
                {t('nothingFound', { q: query })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t.rich('nothingFoundHint', {
                  link: (chunks) => (
                    <Link href="/atlas" className="font-medium text-[var(--color-ccm-sea)] hover:underline">
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          )}
          <div className={cn('space-y-10', nothingFound && 'hidden')}>
            {searchClient ? (
              <>
                <AlgoliaGroup
                  searchClient={searchClient}
                  groupKey="caseStudies"
                  indexName={ALGOLIA_INDICES.CASE_STUDIES}
                  query={query}
                  filters="status:approved AND accessLevel:public"
                  dotColor={COLOR.layer.cases}
                  title={t('caseStudies')}
                  seeAllHref={`/research-and-action/case-studies?q=${encodeURIComponent(query)}`}
                  render={(onCount) => <ContentHits type="case-studies" onCount={onCount} />}
                  onCount={onGroupCount}
                  visible={showGroup('caseStudies')}
                />
                <AlgoliaGroup
                  searchClient={searchClient}
                  groupKey="news"
                  indexName={ALGOLIA_INDICES.NEWS}
                  query={query}
                  filters={contentFilter}
                  dotColor={COLOR.layer.projects}
                  title={t('news')}
                  seeAllHref={`/news?q=${encodeURIComponent(query)}`}
                  render={(onCount) => <ContentHits type="news" onCount={onCount} />}
                  onCount={onGroupCount}
                  visible={showGroup('news')}
                />
                <AlgoliaGroup
                  searchClient={searchClient}
                  groupKey="agendas"
                  indexName={ALGOLIA_INDICES.AGENDAS}
                  query={query}
                  filters={contentFilter}
                  dotColor={COLOR.layer.projects}
                  title={t('agendas')}
                  seeAllHref={`/research-and-action/all-outputs?q=${encodeURIComponent(query)}`}
                  render={(onCount) => <ContentHits type="agendas" onCount={onCount} />}
                  onCount={onGroupCount}
                  visible={showGroup('agendas')}
                />
                <AlgoliaGroup
                  searchClient={searchClient}
                  groupKey="people"
                  indexName={ALGOLIA_INDICES.USERS}
                  query={query}
                  filters={peopleFilter}
                  dotColor={COLOR.layer.people}
                  title={t('people')}
                  seeAllHref={`/collaborate?q=${encodeURIComponent(query)}`}
                  render={(onCount) => <PeopleHits onCount={onCount} />}
                  onCount={onGroupCount}
                  visible={showGroup('people')}
                />
              </>
            ) : searchClientLoading ? (
              <div className="space-y-8">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              // Token mint failed and no working fallback key — say so plainly
              // (searchClientError has the real cause, logged above) rather
              // than silently showing zero results.
              <p className="text-sm text-muted-foreground">{t('searchUnavailable')}</p>
            )}

            {showGroup('regions') && <RegionGroup query={query} />}
          </div>
        </>
      )}
    </div>
  )
}
