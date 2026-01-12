'use client'

import { useRefinementList, useCurrentRefinements, Configure } from 'react-instantsearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { X, Filter, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState, useCallback, useId } from 'react'

interface ContentSearchFiltersProps {
  type: 'case-studies' | 'agendas' | 'news'
}

function FilterSection({ title, children, isEmpty = false }: { title: string; children: React.ReactNode; isEmpty?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  // Always render DOM structure - use CSS to hide when empty (prevents hydration mismatch)
  return (
    <div className={`border-b border-border pb-4 last:border-b-0 last:pb-0 ${isEmpty ? 'hidden' : ''}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left py-2 hover:text-foreground/80 transition-colors"
      >
        <h4 className="font-medium text-sm">{title}</h4>
        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      {isOpen && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  )
}

function RefinementListFilter({ attribute, title, limit = 10 }: { attribute: string; title: string; limit?: number }) {
  const { items, refine } = useRefinementList({
    attribute,
    limit,
    sortBy: ['count:desc', 'name:asc']
  }, { skipSuspense: true })

  const hasItems = items && items.length > 0

  return (
    <FilterSection title={title} isEmpty={!hasItems}>
      <div className="space-y-2">
        {items?.map((item) => (
          <label key={item.value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={item.isRefined}
              onChange={() => refine(item.value)}
              className="rounded border-gray-300"
            />
            <span className="text-sm flex-1">{item.label}</span>
            <Badge variant="secondary" className="text-xs">
              {item.count}
            </Badge>
          </label>
        ))}
      </div>
    </FilterSection>
  )
}

// Year filter state hook - uses local state that triggers Configure re-render
function useYearFilterState() {
  const currentYear = new Date().getFullYear()
  const defaultMin = 2000
  const defaultMax = currentYear

  const [minValue, setMinValue] = useState(defaultMin)
  const [maxValue, setMaxValue] = useState(defaultMax)
  const [appliedMin, setAppliedMin] = useState<number | null>(null)
  const [appliedMax, setAppliedMax] = useState<number | null>(null)

  const applyFilter = useCallback(() => {
    const clampedMin = Math.max(defaultMin, Math.min(minValue, maxValue))
    const clampedMax = Math.max(clampedMin, Math.min(maxValue, defaultMax))

    // Only apply filter if different from full range
    if (clampedMin > defaultMin || clampedMax < defaultMax) {
      setAppliedMin(clampedMin)
      setAppliedMax(clampedMax)
    } else {
      // Clear filter
      setAppliedMin(null)
      setAppliedMax(null)
    }
  }, [minValue, maxValue, defaultMin, defaultMax])

  const clearFilter = useCallback(() => {
    setMinValue(defaultMin)
    setMaxValue(defaultMax)
    setAppliedMin(null)
    setAppliedMax(null)
  }, [defaultMin, defaultMax])

  const isFiltered = appliedMin !== null || appliedMax !== null

  // Build numeric filters array for Algolia
  const numericFilters: string[] = []
  if (appliedMin !== null) {
    numericFilters.push(`year>=${appliedMin}`)
  }
  if (appliedMax !== null) {
    numericFilters.push(`year<=${appliedMax}`)
  }

  return {
    minValue,
    maxValue,
    setMinValue,
    setMaxValue,
    appliedMin,
    appliedMax,
    applyFilter,
    clearFilter,
    isFiltered,
    numericFilters,
    defaultMin,
    defaultMax
  }
}

interface YearRangeFilterProps {
  state: ReturnType<typeof useYearFilterState>
}

function YearRangeFilterUI({ state }: YearRangeFilterProps) {
  const {
    minValue,
    maxValue,
    setMinValue,
    setMaxValue,
    applyFilter,
    clearFilter,
    isFiltered,
    defaultMin,
    defaultMax
  } = state

  return (
    <FilterSection title="Year Range">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={defaultMin}
            max={defaultMax}
            value={minValue}
            onChange={(e) => setMinValue(parseInt(e.target.value) || defaultMin)}
            onBlur={applyFilter}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="w-20 px-2 py-1 border rounded text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="number"
            min={defaultMin}
            max={defaultMax}
            value={maxValue}
            onChange={(e) => setMaxValue(parseInt(e.target.value) || defaultMax)}
            onBlur={applyFilter}
            onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
            className="w-20 px-2 py-1 border rounded text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={applyFilter}
            className="text-xs"
          >
            Apply
          </Button>
          {isFiltered && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilter}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
    </FilterSection>
  )
}

function ActiveFilters() {
  const { items, refine } = useCurrentRefinements({}, { skipSuspense: true })
  const t = useTranslations('search.filters')

  if (!items || items.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Active Filters</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div key={item.attribute} className="space-y-1">
            {item.refinements.map((refinement) => (
              <Badge
                key={refinement.value}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => refine(refinement)}
              >
                {refinement.label}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        ))}
      </div>
      <Separator className="mt-4" />
    </div>
  )
}

export default function ContentSearchFilters({ type }: ContentSearchFiltersProps) {
  const t = useTranslations('search.filters')
  const yearFilterState = useYearFilterState()

  return (
    <div className="space-y-6">
      {/* Apply year numeric filters via Configure component */}
      {type === 'agendas' && yearFilterState.numericFilters.length > 0 && (
        <Configure numericFilters={yearFilterState.numericFilters} />
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ActiveFilters />

          {type === 'case-studies' && (
            <>
              <RefinementListFilter
                attribute="status"
                title="Status"
                limit={5}
              />
              <RefinementListFilter
                attribute="authors.role"
                title="Author Role"
                limit={5}
              />
              <RefinementListFilter
                attribute="organizations"
                title="Organizations"
                limit={8}
              />
              <RefinementListFilter
                attribute="tags"
                title="Tags"
                limit={10}
              />
              <RefinementListFilter
                attribute="featured"
                title="Featured"
                limit={2}
              />
            </>
          )}

          {type === 'agendas' && (
            <>
              <RefinementListFilter
                attribute="agendaType"
                title="Agenda Type"
                limit={10}
              />
              <YearRangeFilterUI state={yearFilterState} />
              <RefinementListFilter
                attribute="organizations"
                title="Organizations"
                limit={8}
              />
              <RefinementListFilter
                attribute="regionalCommunities"
                title="Regional Communities"
                limit={8}
              />
              <RefinementListFilter
                attribute="tags"
                title="Tags"
                limit={10}
              />
              <RefinementListFilter
                attribute="featured"
                title="Featured"
                limit={2}
              />
            </>
          )}

          {type === 'news' && (
            <>
              <RefinementListFilter
                attribute="author.name"
                title="Author"
                limit={8}
              />
              <RefinementListFilter
                attribute="organizations"
                title="Organizations"
                limit={8}
              />
              <RefinementListFilter
                attribute="projects"
                title="Projects"
                limit={8}
              />
              <RefinementListFilter
                attribute="tags"
                title="Tags"
                limit={10}
              />
              <RefinementListFilter
                attribute="location.country"
                title="Country"
                limit={10}
              />
              <RefinementListFilter
                attribute="featured"
                title="Featured"
                limit={2}
              />
            </>
          )}

          {type !== 'news' && (
            <RefinementListFilter
              attribute="accessLevel"
              title="Access Level"
              limit={3}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}