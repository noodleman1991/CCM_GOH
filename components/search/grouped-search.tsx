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
import { regionColor } from '@/lib/ccm-colors'
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
  meta,
  leading,
}: {
  href: string
  title: string
  subtitle?: string
  /** Right-aligned badge (e.g. type/featured). */
  badge?: React.ReactNode
  /** Below the subtitle: chips / byline / date — type-specific. */
  meta?: React.ReactNode
  /** Leading visual (avatar / type icon). */
  leading?: React.ReactNode
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-start gap-3 p-4">
        {leading}
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
          {meta && <div className="mt-2 flex flex-wrap items-center gap-1.5">{meta}</div>}
        </div>
      </CardContent>
    </Card>
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

/** Plain tag/topic chip. */
function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
      {children}
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
          return (
            <ResultRow
              key={hit.objectID}
              href={`/research-and-action/case-studies/${hit.slug}`}
              title={getLocalizedTitle(hit.title, locale)}
              subtitle={getLocalizedExcerpt(hit.excerpt, locale)}
              leading={<TypeIcon icon={BookOpen} />}
              meta={
                <>
                  {author && <span className="text-xs text-muted-foreground">{author}</span>}
                  {(hit.tags || []).slice(0, 2).map((tag) => (
                    <MetaChip key={tag}>{tag}</MetaChip>
                  ))}
                </>
              }
            />
          )
        }
        if (type === 'news') {
          const hit = raw as unknown as NewsSearchRecord
          const date = fmtDate(hit.publishedAt)
          return (
            <ResultRow
              key={hit.objectID}
              href={`/news/${hit.slug}`}
              title={getLocalizedTitle(hit.title, locale)}
              subtitle={getLocalizedExcerpt(hit.excerpt, locale)}
              leading={<TypeIcon icon={Newspaper} />}
              meta={
                <span className="text-xs text-muted-foreground">
                  {[hit.author?.name, date].filter(Boolean).join(' · ')}
                </span>
              }
            />
          )
        }
        const hit = raw as unknown as AgendaSearchRecord
        return (
          <ResultRow
            key={hit.objectID}
            href={`/research-and-action`}
            title={getLocalizedTitle(hit.title, locale)}
            leading={<TypeIcon icon={FileText} />}
            meta={
              <>
                {hit.year && <MetaChip>{hit.year}</MetaChip>}
                {(hit.regionalCommunities || []).slice(0, 1).map((rc) => (
                  <MetaChip key={rc}>{rc}</MetaChip>
                ))}
              </>
            }
          />
        )
      })}
    </div>
  )
}

/** Square type-icon tile used as the leading visual on content rows. */
function TypeIcon({ icon: Icon }: { icon: typeof BookOpen }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ccm-sky/20 text-ccm-sea">
      <Icon className="size-5" />
    </span>
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
        return (
          <ResultRow
            key={hit.objectID}
            href={`/profiles/${hit.username}`}
            title={hit.fullName || hit.username}
            subtitle={hit.showWorkDetails && (hit.position || hit.organization)
              ? [hit.position, hit.organization].filter(Boolean).join(' · ')
              : hit.bio}
            leading={
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={hit.profileImage} alt={hit.fullName} />
                <AvatarFallback>{initials(hit.firstName, hit.lastName)}</AvatarFallback>
              </Avatar>
            }
            meta={(hit.expertiseAreas || []).slice(0, 2).map((area) => (
              <MetaChip key={area}>{tidy(area)}</MetaChip>
            ))}
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
  visible = true,
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
  /** Group-filter visibility. The group stays MOUNTED when hidden so its count
   *  keeps updating the filter chip badge — we only hide it visually. */
  visible?: boolean
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

      {/* Group filter chips — scope the results to one category. Counts annotate
          each chip; a chip with 0 results (and no query-less state) is dimmed. */}
      {hasQuery && mounted && !nothingFound && (
        <div className="flex flex-wrap justify-center gap-2">
          {[
            { key: 'all', label: t('allResults'), count: null as number | null },
            { key: 'caseStudies', label: t('caseStudies'), count: counts.caseStudies ?? null },
            { key: 'news', label: t('news'), count: counts.news ?? null },
            { key: 'agendas', label: t('agendas'), count: counts.agendas ?? null },
            { key: 'people', label: t('people'), count: counts.people ?? null },
            { key: 'regions', label: t('regions'), count: regionMatchCount },
          ].map((chip) => {
            const active = activeFilter === chip.key
            const empty = chip.count === 0 && chip.key !== 'all'
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setActiveFilter(chip.key)}
                aria-pressed={active}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  empty && !active && 'opacity-50'
                )}
              >
                {chip.label}
                {chip.count !== null && chip.count > 0 && (
                  <span className={cn('text-xs', active ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {chip.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
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
              visible={showGroup('caseStudies')}
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
              visible={showGroup('news')}
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
              visible={showGroup('agendas')}
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
              visible={showGroup('people')}
            />

            {showGroup('regions') && <RegionGroup query={query} />}
          </div>
        </>
      )}
    </div>
  )
}
