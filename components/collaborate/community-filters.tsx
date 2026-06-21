'use client'

/**
 * CommunityFilters Component
 * Provides checkbox filters for regional communities, work types, and expertise
 * Supports i18n and RTL layouts
 */

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { FilterChip } from '@/components/ui/filter-chip'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

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

  // Inclusion model: toggling a value adds/removes it from the active selection.
  const toggleValue = (key: keyof CommunityFiltersState, value: string) => {
    const current = filters[key]
    const next = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onChangeAction({ ...filters, [key]: next })
  }

  const clearAll = () =>
    onChangeAction({ communities: [], workTypes: [], expertiseAreas: [] })

  const activeCount =
    filters.communities.length + filters.workTypes.length + filters.expertiseAreas.length

  const communityOptions = communities.map(c => {
    const key = c.regionalName ? REGIONAL_NAME_TO_TRANSLATION_KEY[c.regionalName] : null
    return { value: c.id, label: key ? tNav(`regions.${key}`) : c.name }
  })
  const workTypeOptions = WORK_TYPES.map(w => ({ value: w.value, label: tWorkTypes(w.labelKey) }))
  const expertiseOptions = EXPERTISE_AREAS.map(e => ({ value: e.value, label: tExpertise(e.labelKey) }))

  const groups: Array<{
    id: string
    key: keyof CommunityFiltersState
    label: string
    options: Array<{ value: string; label: string }>
  }> = [
    { id: 'communities', key: 'communities', label: t('communities'), options: communityOptions },
    { id: 'workTypes', key: 'workTypes', label: t('workTypes'), options: workTypeOptions },
    { id: 'expertise', key: 'expertiseAreas', label: t('expertise'), options: expertiseOptions },
  ]

  return (
    <div className={cn('w-full space-y-4', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* All groups shown inline (no collapse) — each is a labelled row of
          multi-select pills. */}
      {groups.map(group => (
        <div key={group.id} className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-2">
            {group.options.map(opt => (
              <FilterChip
                key={opt.value}
                label={opt.label}
                active={filters[group.key].includes(opt.value)}
                onClick={() => toggleValue(group.key, opt.value)}
              />
            ))}
          </div>
        </div>
      ))}

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="me-1.5 size-4" />
          {t('clearFilters')}
        </Button>
      )}
    </div>
  )
}
