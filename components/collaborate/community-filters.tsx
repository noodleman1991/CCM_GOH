'use client'

/**
 * CommunityFilters Component
 * Provides checkbox filters for regional communities, work types, and expertise
 * Supports i18n and RTL layouts
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

export interface CommunityFiltersState {
  communities: string[]
  workTypes: string[]
  expertiseAreas: string[]
}

interface CommunityFiltersProps {
  filters: CommunityFiltersState
  onChangeAction: (filters: CommunityFiltersState) => void
  communities: Array<{
    id: string
    name: string
    regionalName: string | null
  }>
  className?: string
  isRTL?: boolean
}

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

const WORK_TYPES = [
  { value: 'RESEARCH', labelKey: 'research' },
  { value: 'POLICY', labelKey: 'policy' },
  { value: 'LIVED_EXPERIENCE_EXPERT', labelKey: 'livedExperience' },
  { value: 'NGO', labelKey: 'ngo' },
  { value: 'COMMUNITY_ORGANIZATION', labelKey: 'communityOrg' },
  { value: 'EDUCATION_TEACHING', labelKey: 'education' }
]

const EXPERTISE_AREAS = [
  { value: 'CLIMATE_CHANGE', labelKey: 'climate' },
  { value: 'MENTAL_HEALTH', labelKey: 'mentalHealth' },
  { value: 'HEALTH', labelKey: 'health' },
  { value: 'EDUCATION', labelKey: 'education' },
  { value: 'SOCIAL_JUSTICE', labelKey: 'socialJustice' }
]

export function CommunityFilters({ filters, onChangeAction, communities, className, isRTL = false }: CommunityFiltersProps) {
  const t = useTranslations('collaborate.filters')
  const tNav = useTranslations('navigation')
  const tWorkTypes = useTranslations('profile.edit.workTypes')
  const tExpertise = useTranslations('profile.edit.expertise')

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['communities', 'workTypes', 'expertise'])
  )

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const handleCommunityToggle = (community: string) => {
    const newCommunities = filters.communities.includes(community)
      ? filters.communities.filter(c => c !== community)
      : [...filters.communities, community]

    onChangeAction({ ...filters, communities: newCommunities })
  }

  const handleWorkTypeToggle = (workType: string) => {
    const newWorkTypes = filters.workTypes.includes(workType)
      ? filters.workTypes.filter(w => w !== workType)
      : [...filters.workTypes, workType]

    onChangeAction({ ...filters, workTypes: newWorkTypes })
  }

  const handleExpertiseToggle = (expertise: string) => {
    const newExpertise = filters.expertiseAreas.includes(expertise)
      ? filters.expertiseAreas.filter(e => e !== expertise)
      : [...filters.expertiseAreas, expertise]

    onChangeAction({ ...filters, expertiseAreas: newExpertise })
  }

  const handleSelectAll = () => {
    onChangeAction({
      communities: communities.map(c => c.id),
      workTypes: WORK_TYPES.map(w => w.value),
      expertiseAreas: EXPERTISE_AREAS.map(e => e.value)
    })
  }

  const handleDeselectAll = () => {
    onChangeAction({
      communities: [],
      workTypes: [],
      expertiseAreas: []
    })
  }

  // In exclusion mode: filters are "active" when something is unchecked
  const totalPossible = communities.length + WORK_TYPES.length + EXPERTISE_AREAS.length
  const totalSelected = filters.communities.length + filters.workTypes.length + filters.expertiseAreas.length
  const hasExclusions = totalSelected < totalPossible
  const allSelected = totalSelected === totalPossible

  return (
    <Card className={cn('w-full max-w-full overflow-hidden', className)}>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle>{t('title')}</CardTitle>
          </div>
          <CardDescription>
            {t('selectedCount', { selected: totalSelected, total: totalPossible })}
          </CardDescription>
          <div className="flex gap-2">
            {totalSelected === 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 w-full"
              >
                {t('selectAll')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                className="h-8 w-full"
              >
                <X className="h-4 w-4 mr-2" />
                {t('clearFilters')}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Regional Communities Filter */}
        <div>
          <button
            onClick={() => toggleSection('communities')}
            className={cn(
              'flex items-center justify-between w-full text-sm font-medium py-2',
              'hover:text-primary transition-colors'
            )}
          >
            <span>{t('communities')}</span>
            {expandedSections.has('communities') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('communities') && (
            <div className="space-y-2 mt-2">
              {communities.map(community => {
                // Get translation key from regionalName enum
                const translationKey = community.regionalName
                  ? REGIONAL_NAME_TO_TRANSLATION_KEY[community.regionalName]
                  : null

                const displayName = translationKey
                  ? tNav(`regions.${translationKey}`)
                  : community.name

                return (
                  <div key={community.id} className="flex items-center gap-3">
                    <Checkbox
                      id={`community-${community.id}`}
                      checked={filters.communities.includes(community.id)}
                      onCheckedChange={() => handleCommunityToggle(community.id)}
                    />
                    <label
                      htmlFor={`community-${community.id}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words flex-1"
                    >
                      {displayName}
                    </label>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Separator />

        {/* Work Types Filter */}
        <div>
          <button
            onClick={() => toggleSection('workTypes')}
            className={cn(
              'flex items-center justify-between w-full text-sm font-medium py-2',
              'hover:text-primary transition-colors'
            )}
          >
            <span>{t('workTypes')}</span>
            {expandedSections.has('workTypes') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('workTypes') && (
            <div className="space-y-2 mt-2">
              {WORK_TYPES.map(workType => (
                <div key={workType.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`workType-${workType.value}`}
                    checked={filters.workTypes.includes(workType.value)}
                    onCheckedChange={() => handleWorkTypeToggle(workType.value)}
                  />
                  <label
                    htmlFor={`workType-${workType.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words flex-1"
                  >
                    {tWorkTypes(workType.labelKey)}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Expertise Areas Filter */}
        <div>
          <button
            onClick={() => toggleSection('expertise')}
            className={cn(
              'flex items-center justify-between w-full text-sm font-medium py-2',
              'hover:text-primary transition-colors'
            )}
          >
            <span>{t('expertise')}</span>
            {expandedSections.has('expertise') ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.has('expertise') && (
            <div className="space-y-2 mt-2">
              {EXPERTISE_AREAS.map(expertise => (
                <div key={expertise.value} className="flex items-center gap-3">
                  <Checkbox
                    id={`expertise-${expertise.value}`}
                    checked={filters.expertiseAreas.includes(expertise.value)}
                    onCheckedChange={() => handleExpertiseToggle(expertise.value)}
                  />
                  <label
                    htmlFor={`expertise-${expertise.value}`}
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer break-words flex-1"
                  >
                    {tExpertise(expertise.labelKey)}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
