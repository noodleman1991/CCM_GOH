'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { useTranslations } from 'next-intl'
import { FilterChip } from '@/components/ui/filter-chip'
import { RegionChoropleth } from '@/components/maps/region-choropleth'
import { RegionDataPanel } from '@/components/maps/region-data-panel'
import { SectionHeader } from '@/components/ui/section-header'
import { FACETS, type FacetId, type RegionDatum } from '@/lib/maps/region-facets'
import {
  REGION_I18N_KEY,
  REGION_TO_RC_SLUG,
  type RegionCode,
} from '@/lib/maps/region-codes'
import { useRouter, Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Each layer (facet) deep-links to the listing that shows that content type,
// pre-filtered to the selected region's community slug.
const FACET_DESTINATION: Record<FacetId, (slug: string) => string> = {
  caseStudyCount: (slug) => `/research-and-action/case-studies?communities=${slug}`,
  livedExpCount: (slug) => `/lived-experiences?regions=${slug}`,
  newsCount: (slug) => `/news?communities=${slug}`,
  memberCount: (slug) => `/collaborate?communities=${slug}`,
  agendaCount: (slug) => `/research-and-action/community-agendas`,
  reportCount: (slug) => `/research-and-action/impact-reports`,
}

/**
 * Atlas & Explore — the geo-faceted discovery page. A full-width choropleth of
 * the 7 regions with a data-layer (facet) switcher; selecting a region surfaces
 * its count and a deep link into the matching, region-filtered listing.
 * Reuses the map block's pieces (choropleth, data panel, region-data API).
 */
export function AtlasExplorer() {
  const t = useTranslations('map')
  const tAtlas = useTranslations('atlas')
  const tRegions = useTranslations('navigation.regions')
  const router = useRouter()

  const [facet, setFacet] = useState<FacetId>('caseStudyCount')
  const [active, setActive] = useState<RegionCode | null>(null)
  const [selected, setSelected] = useState<RegionCode | null>(null)

  const { data } = useSWR<{ facet: FacetId; data: RegionDatum[] }>(
    `/api/maps/region-data?facet=${facet}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  )
  const regionData = data?.data ?? []

  const labelFor = (code: RegionCode) => tRegions(REGION_I18N_KEY[code])
  const activeFacetDef = FACETS.find((f) => f.id === facet)
  const facetLabel = activeFacetDef ? t(activeFacetDef.labelKey) : ''

  // Click selects the region (shows the deep-link panel below) rather than
  // navigating immediately — so the user sees the count + chooses to drill in.
  const onSelect = (code: RegionCode) => setSelected((prev) => (prev === code ? null : code))

  const selectedDatum = useMemo(
    () => (selected ? regionData.find((d) => d.code === selected) : null),
    [selected, regionData]
  )
  const destinationHref = selected
    ? FACET_DESTINATION[facet](REGION_TO_RC_SLUG[selected])
    : null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-balance text-ccm-midnight lg:text-4xl">
          {tAtlas('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{tAtlas('description')}</p>
      </div>

      {/* Data-layer switcher (the facets) */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tAtlas('dataLayer')}
        </span>
        <div className="flex flex-wrap gap-2">
          {FACETS.map((f) => (
            <FilterChip
              key={f.id}
              label={t(f.labelKey)}
              active={facet === f.id}
              onClick={() => {
                setFacet(f.id)
                setActive(null)
                setSelected(null)
              }}
            />
          ))}
        </div>
      </div>

      {/* Map + panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr] lg:items-start">
        <div className="min-w-0">
          <RegionChoropleth
            data={regionData}
            activeCode={active ?? selected}
            onHover={setActive}
            onSelect={onSelect}
            labelFor={labelFor}
          />
        </div>
        <RegionDataPanel
          data={regionData}
          activeCode={active ?? selected}
          facetLabel={facetLabel}
          labelFor={labelFor}
          onSelect={onSelect}
        />
      </div>

      {/* Selected-region drill-in */}
      {selected && selectedDatum && destinationHref && (
        <section className="rounded-2xl border bg-ccm-sky/10 p-6">
          <SectionHeader
            title={labelFor(selected)}
            subtitle={`${selectedDatum.value} · ${facetLabel}`}
          />
          <div className="mt-4">
            {selectedDatum.value > 0 ? (
              <Link
                href={destinationHref}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                {tAtlas('explore', { region: labelFor(selected) })}
                <ArrowRight className="size-4 rtl:-scale-x-100" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                {tAtlas('empty', { layer: facetLabel })}
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default AtlasExplorer
