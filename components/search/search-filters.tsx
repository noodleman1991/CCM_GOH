'use client'

import { useRefinementList, useClearRefinements } from 'react-instantsearch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import { useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTranslations } from 'next-intl'

interface FilterSectionProps {
  attribute: string
  title: string
  limit?: number
  showMore?: boolean
}

function FilterSection({ attribute, title, limit = 8, showMore = true }: FilterSectionProps) {
  const {
    items,
    refine,
    searchForItems,
    isShowingMore,
    toggleShowMore,
    canToggleShowMore,
  } = useRefinementList({
    attribute,
    limit,
    showMore,
    sortBy: ['count:desc', 'name:asc']
  }, { skipSuspense: true })

  const [isOpen, setIsOpen] = useState(true)
  const ft = useTranslations('search.filterOptions')

  if (items.length === 0) return null

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {title}
              <span className="text-xs text-muted-foreground">
                {items.filter(item => item.isRefined).length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {items.filter(item => item.isRefined).length}
                  </Badge>
                )}
              </span>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${attribute}-${item.value}`}
                    checked={item.isRefined}
                    onCheckedChange={() => refine(item.value)}
                  />
                  <label
                    htmlFor={`${attribute}-${item.value}`}
                    className="text-sm font-normal cursor-pointer flex-1 flex items-center justify-between"
                  >
                    <span className="capitalize">
                      {item.label.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.count}
                    </span>
                  </label>
                </div>
              ))}
            </div>
            
            {canToggleShowMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleShowMore}
                className="w-full mt-3 text-xs"
              >
                {isShowingMore ? ft('showLess') : ft('showMore')}
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

function ClearFilters() {
  const { refine, canRefine } = useClearRefinements({}, { skipSuspense: true })
  const t = useTranslations('search.filters')

  if (!canRefine) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => refine()}
      className="w-full mb-4"
    >
      <X className="h-4 w-4 mr-2" />
      {t('clearAll')}
    </Button>
  )
}

export default function SearchFilters() {
  const t = useTranslations('search')
  const ft = useTranslations('search.filterOptions')
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4" />
        <h2 className="font-semibold">{t('filters')}</h2>
      </div>

      <ClearFilters />

      <FilterSection
        attribute="workTypes"
        title={ft('workType')}
        limit={6}
      />

      <FilterSection
        attribute="expertiseAreas"
        title={ft('expertise')}
        limit={5}
      />

      <FilterSection
        attribute="country"
        title={ft('country')}
        limit={8}
      />

      <FilterSection
        attribute="communities"
        title={ft('communities')}
        limit={6}
      />

      <FilterSection
        attribute="role"
        title={ft('role')}
        limit={4}
        showMore={false}
      />
    </div>
  )
}