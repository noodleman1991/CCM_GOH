'use client'

import { InstantSearchNext } from 'react-instantsearch-nextjs'
import { Configure, useHits, useStats } from 'react-instantsearch'
import { searchClient, ALGOLIA_INDICES } from '@/lib/algolia'
import type {
  CaseStudySearchRecord,
  AgendaSearchRecord,
  NewsSearchRecord,
  UserSearchRecord,
} from '@/lib/algolia'
import { SearchErrorBoundary } from './search-error-boundary'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search as SearchIcon,
  X,
  ArrowRight,
  BookOpen,
  Newspaper,
  FileText,
  Users,
  Globe,
} from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from '@clerk/nextjs'
import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { getLocalizedTitle, getLocalizedExcerpt } from '@/lib/localization-utils'
import { REGION_CODES, REGION_I18N_KEY, REGION_TO_RC_SLUG, REGION_COLOR } from '@/lib/maps/region-codes'
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
    <div className="relative w-full max-w-2xl">
      <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        value={local}
        onChange={handleChange}
        placeholder={t('placeholder')}
        autoComplete="off"
        className="flex h-12 w-full rounded-full border border-input bg-background ps-11 pe-11 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {local && (
        <button
          type="button"
          onClick={clear}
          aria-label={t('clear')}
          className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Group shell — section header (icon + title + count) + see-all link. */
/* ------------------------------------------------------------------ */

function GroupHeader({
  icon: Icon,
  title,
  count,
  seeAllHref,
}: {
  icon: typeof BookOpen
  title: string
  count: number | null
  seeAllHref?: string
}) {
  const t = useTranslations('search')
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-ccm-sea/10 text-ccm-sea">
          <Icon className="size-4" />
        </span>
        <h2 className="font-heading text-lg font-semibold text-ccm-midnight">{title}</h2>
        {count !== null && (
          <Badge variant="secondary" className="ms-1">{count}</Badge>
        )}
      </div>
      {seeAllHref && count !== null && count > PREVIEW_COUNT && (
        <Link
          href={seeAllHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-ccm-water hover:underline"
        >
          {t('seeAll')}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" />
        </Link>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Compact result rows (reuse existing detail routes).                 */
/* ------------------------------------------------------------------ */

function ResultRow({
  href,
  title,
  subtitle,
  badge,
  onDark,
}: {
  href: string
  title: string
  subtitle?: string
  badge?: React.ReactNode
  onDark?: React.ReactNode
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-3 p-4">
        {onDark}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-foreground">
              <Link href={href} className="hover:underline">{title}</Link>
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-3">
      {hits.slice(0, PREVIEW_COUNT).map((raw) => {
        if (type === 'case-studies') {
          const hit = raw as unknown as CaseStudySearchRecord
          return (
            <ResultRow
              key={hit.objectID}
              href={`/research-and-action/case-studies/${hit.slug}`}
              title={getLocalizedTitle(hit.title, locale)}
              subtitle={getLocalizedExcerpt(hit.excerpt, locale)}
            />
          )
        }
        if (type === 'news') {
          const hit = raw as unknown as NewsSearchRecord
          return (
            <ResultRow
              key={hit.objectID}
              href={`/news/${hit.slug}`}
              title={getLocalizedTitle(hit.title, locale)}
              subtitle={getLocalizedExcerpt(hit.excerpt, locale)}
            />
          )
        }
        const hit = raw as unknown as AgendaSearchRecord
        return (
          <ResultRow
            key={hit.objectID}
            href={`/research-and-action`}
            title={getLocalizedTitle(hit.title, locale)}
          />
        )
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

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {hits.slice(0, PREVIEW_COUNT).map((raw) => {
        const hit = raw as unknown as UserSearchRecord
        return (
          <ResultRow
            key={hit.objectID}
            href={`/profiles/${hit.username}`}
            title={hit.fullName || hit.username}
            subtitle={hit.showWorkDetails && (hit.position || hit.organization)
              ? [hit.position, hit.organization].filter(Boolean).join(' · ')
              : hit.bio}
            onDark={
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={hit.profileImage} alt={hit.fullName} />
                <AvatarFallback>{initials(hit.firstName, hit.lastName)}</AvatarFallback>
              </Avatar>
            }
          />
        )
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
      <GroupHeader icon={Globe} title={tSearch('regions')} count={matches.length} />
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
  icon,
  title,
  seeAllHref,
  render,
  onCount,
}: {
  groupKey: string
  indexName: string
  query: string
  filters: string
  icon: typeof BookOpen
  title: string
  seeAllHref: string
  render: (onCount: (n: number) => void) => React.ReactNode
  onCount: (key: string, n: number) => void
}) {
  const [count, setCount] = useState<number | null>(null)
  const handleCount = useCallback((n: number) => {
    setCount(n)
    onCount(groupKey, n)
  }, [groupKey, onCount])

  // Hide the whole group when the query yields nothing (keeps the page tight,
  // per STATES §2: "section hidden if empty").
  const hidden = query.trim().length > 0 && count === 0

  return (
    <SearchErrorBoundary>
      <InstantSearchNext
        searchClient={searchClient}
        indexName={indexName}
        insights={false}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure query={query} filters={filters} hitsPerPage={PREVIEW_COUNT} />
        <section className={cn(hidden && 'hidden')}>
          <GroupHeader icon={icon} title={title} count={count} seeAllHref={seeAllHref} />
          {render(handleCount)}
        </section>
      </InstantSearchNext>
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
  useEffect(() => setMounted(true), [])

  const [query, setQuery] = useState(searchParams.get('q') || '')

  // Aggregate per-group counts so we can show one "nothing found" state when
  // every group is empty (instead of a blank page of hidden sections).
  const [counts, setCounts] = useState<Record<string, number>>({})
  const onGroupCount = useCallback((key: string, n: number) => {
    setCounts((prev) => (prev[key] === n ? prev : { ...prev, [key]: n }))
  }, [])
  // Reset counts whenever the query changes so stale counts don't linger.
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
        <div className="py-16 text-center">
          <p className="font-heading text-lg font-semibold text-ccm-midnight">{t('typeToSearch')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('typeToSearchHint')}</p>
        </div>
      ) : (
        <>
          {nothingFound && (
            <div className="py-16 text-center">
              <p className="font-heading text-lg font-semibold text-ccm-midnight">
                {t('nothingFound', { q: query })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t('nothingFoundHint')}</p>
            </div>
          )}
          <div className={cn('space-y-10', nothingFound && 'hidden')}>
            <AlgoliaGroup
              groupKey="caseStudies"
              indexName={ALGOLIA_INDICES.CASE_STUDIES}
              query={query}
              filters="status:approved AND accessLevel:public"
              icon={BookOpen}
              title={t('caseStudies')}
              seeAllHref={`/research-and-action/case-studies?q=${encodeURIComponent(query)}`}
              render={(onCount) => <ContentHits type="case-studies" onCount={onCount} />}
              onCount={onGroupCount}
            />
            <AlgoliaGroup
              groupKey="news"
              indexName={ALGOLIA_INDICES.NEWS}
              query={query}
              filters={contentFilter}
              icon={Newspaper}
              title={t('news')}
              seeAllHref={`/news?q=${encodeURIComponent(query)}`}
              render={(onCount) => <ContentHits type="news" onCount={onCount} />}
              onCount={onGroupCount}
            />
            <AlgoliaGroup
              groupKey="agendas"
              indexName={ALGOLIA_INDICES.AGENDAS}
              query={query}
              filters={contentFilter}
              icon={FileText}
              title={t('agendas')}
              seeAllHref={`/research-and-action/all-outputs?q=${encodeURIComponent(query)}`}
              render={(onCount) => <ContentHits type="agendas" onCount={onCount} />}
              onCount={onGroupCount}
            />
            <AlgoliaGroup
              groupKey="people"
              indexName={ALGOLIA_INDICES.USERS}
              query={query}
              filters={peopleFilter}
              icon={Users}
              title={t('people')}
              seeAllHref={`/collaborate?q=${encodeURIComponent(query)}`}
              render={(onCount) => <PeopleHits onCount={onCount} />}
              onCount={onGroupCount}
            />

            <RegionGroup query={query} />
          </div>
        </>
      )}
    </div>
  )
}
