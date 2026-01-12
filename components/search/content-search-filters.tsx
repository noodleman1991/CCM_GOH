'use client'

import { useRefinementList, useRange, useCurrentRefinements } from 'react-instantsearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { X, Filter } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useState } from 'react'

interface ContentSearchFiltersProps {
  type: 'case-studies' | 'agendas' | 'news'
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-0 h-auto">
          <h4 className="font-medium text-sm">{title}</h4>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

function RefinementListFilter({ attribute, title, limit = 10 }: { attribute: string; title: string; limit?: number }) {
  const { items, refine } = useRefinementList({
    attribute,
    limit,
    sortBy: ['count:desc', 'name:asc']
  }, { skipSuspense: true })

  if (!items || items.length === 0) return null

  return (
    <FilterSection title={title}>
      <div className="space-y-2">
        {items.map((item) => (
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

function YearRangeFilter() {
  const { range, start, refine } = useRange({
    attribute: 'year',
  }, { skipSuspense: true })

  if (!range) return null

  const currentYear = new Date().getFullYear()
  // Validate range values to prevent infinity display
  const minYear = (range.min && isFinite(range.min)) ? range.min : 2000
  const maxYear = (range.max && isFinite(range.max)) ? range.max : currentYear

  return (
    <FilterSection title="Year Range">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={start?.[0] || minYear}
            onChange={(e) => refine([parseInt(e.target.value), start?.[1] || maxYear])}
            className="flex-1"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{start?.[0] || minYear}</span>
          <span>{start?.[1] || maxYear}</span>
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

  return (
    <div className="space-y-6">
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
              <YearRangeFilter />
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