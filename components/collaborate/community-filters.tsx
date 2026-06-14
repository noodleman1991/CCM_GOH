'use client'

/**
 * CommunityFilters Component
 * Provides checkbox filters for regional communities, work types, and expertise
 * Supports i18n and RTL layouts
 */

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, X } from 'lucide-react'

/** A tappable filter pill. Fills with the brand colour and shows a check when
 *  active — more engaging and scannable than a checkbox row, and the active
 *  state reads at a glance. */
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-transparent bg-[var(--color-ccm-sea)] text-white shadow-sm'
          : 'border-border bg-background text-foreground/80 hover:border-[var(--color-ccm-sea)]/40 hover:bg-muted'
      )}
    >
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
      <span className="text-start">{label}</span>
    </button>
  )
}

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

  // One filter group can be open at a time on this horizontal bar.
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const toggleGroup = (group: string) =>
    setOpenGroup(prev => (prev === group ? null : group))

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
    <div className={cn('w-full', className)} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Filter group triggers — a horizontal, wrapping, mobile-friendly row */}
      <div className="flex flex-wrap items-center gap-2">
        {groups.map(group => {
          const count = filters[group.key].length
          const isOpen = openGroup === group.id
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={isOpen}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                count > 0
                  ? 'border-[var(--color-ccm-sea)]/40 bg-[var(--color-ccm-sea)]/10 text-[var(--color-ccm-sea)]'
                  : 'border-border bg-background text-foreground/80 hover:bg-muted'
              )}
            >
              <span>{group.label}</span>
              {count > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-ccm-sea)] px-1.5 text-xs font-semibold text-white">
                  {count}
                </span>
              )}
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
              />
            </button>
          )
        })}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 me-1.5" />
            {t('clearFilters')}
          </Button>
        )}
      </div>

      {/* Expanded options for the open group — pills under the triggers */}
      {openGroup && (
        <div className="mt-3 rounded-xl border bg-muted/30 p-3">
          <div className="flex flex-wrap gap-2">
            {groups
              .find(g => g.id === openGroup)!
              .options.map(opt => {
                const group = groups.find(g => g.id === openGroup)!
                return (
                  <FilterChip
                    key={opt.value}
                    label={opt.label}
                    active={filters[group.key].includes(opt.value)}
                    onClick={() => toggleValue(group.key, opt.value)}
                  />
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
