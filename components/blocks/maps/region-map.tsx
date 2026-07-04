'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import SectionContainer from '@/components/ui/section-container'
import { FilterChip } from '@/components/ui/filter-chip'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RegionDataPanel } from '@/components/maps/region-data-panel'
import { FACETS, type FacetId, type RegionDatum } from '@/lib/maps/region-facets'
import { REGION_I18N_KEY, REGION_TO_RC_SLUG, type RegionCode } from '@/lib/maps/region-codes'
import { getLocalizedField } from '@/lib/localization-utils'
import { useRouter } from '@/i18n/navigation'
import { heading } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type RegionMapProps = {
  title?: unknown
  description?: unknown
  defaultFacet?: FacetId
  allowedFacets?: FacetId[]
  locale?: string
}

/**
 * Region map page-builder block: a CCM-styled choropleth of the 7 regions with a
 * facet switcher and a data panel. Stacks vertically on mobile, sits side-by-side
 * on large screens. Clicking a region deep-links to search filtered by that
 * region's name. Data comes from /api/maps/region-data (cached, SWR-deduped).
 */
export default function RegionMapBlock({
  title,
  description,
  defaultFacet = 'caseStudyCount',
  allowedFacets,
  locale = 'en',
}: RegionMapProps) {
  const t = useTranslations('map')
  const tRegions = useTranslations('navigation.regions')
  const router = useRouter()

  const facets = useMemo(
    () => FACETS.filter((f) => !allowedFacets?.length || allowedFacets.includes(f.id)),
    [allowedFacets]
  )
  const [facet, setFacet] = useState<FacetId>(defaultFacet)
  const [active, setActive] = useState<RegionCode | null>(null)

  const { data } = useSWR<{ facet: FacetId; data: RegionDatum[] }>(
    `/api/maps/region-data?facet=${facet}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const regionData = data?.data ?? []

  const supported = (locale || 'en') as 'en' | 'es' | 'fr' | 'ar'
  const localizedTitle =
    typeof title === 'string' ? title : getLocalizedField(title as never, supported, '')
  const localizedDescription =
    typeof description === 'string'
      ? description
      : getLocalizedField(description as never, supported, '')

  const labelFor = (code: RegionCode) => tRegions(REGION_I18N_KEY[code])
  const activeFacetDef = FACETS.find((f) => f.id === facet)
  const facetLabel = activeFacetDef ? t(activeFacetDef.labelKey) : ''

  // Clicking a region is the connective tissue: go to that region's community
  // page (its people + content), falling back to search if there's no slug.
  // The homepage block is a GATEWAY, not an explorer: clicking a region lands
  // in the Atlas with that region selected AND the block's active facet as the
  // layer — so the result cards for exactly what the visitor tapped are already
  // on screen. (The community page stays reachable from the Atlas itself.)
  const goToRegion = (code: RegionCode) => {
    router.push(`/atlas?region=${code}&layers=${facet}`)
  }

  return (
    <SectionContainer>
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2 text-center">
          <h2 className={cn('font-heading font-bold text-balance text-ccm-midnight', heading('md'))}>
            {localizedTitle || t('title')}
          </h2>
          {localizedDescription && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              {localizedDescription}
            </p>
          )}
        </div>

        {/* Facet switcher */}
        {facets.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            {facets.map((f) => (
              <FilterChip
                key={f.id}
                label={t(f.labelKey)}
                active={facet === f.id}
                onClick={() => {
                  setFacet(f.id)
                  setActive(null)
                }}
              />
            ))}
          </div>
        )}

        {/* Map + panel: stacked on mobile, side-by-side on lg */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
          <div className="min-w-0">
            <RegionChoropleth
              data={regionData}
              activeCode={active}
              onHover={setActive}
              onSelect={goToRegion}
              labelFor={labelFor}
            />
          </div>
          <RegionDataPanel
            data={regionData}
            activeCode={active}
            facetLabel={facetLabel}
            labelFor={labelFor}
            onSelect={goToRegion}
          />
        </div>
      </div>
    </SectionContainer>
  )
}
