import { getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/section-header'
import SectionContainer from '@/components/ui/section-container'
import { AtlasExplorer } from '@/components/atlas/atlas-explorer'
import { Link } from '@/i18n/navigation'
import { isRegionCode, type RegionCode } from '@/lib/maps/region-codes'

/**
 * Server wrapper for the region-scoped atlas (spec A4). The country breakdown
 * is fetched by the client explorer's pins call; this wrapper only frames it.
 */
export default async function AtlasEmbedBlock({
  region,
}: {
  region?: string
  showBreakdown?: boolean
}) {
  if (!region || !isRegionCode(region)) return null
  const t = await getTranslations('atlas')

  return (
    <SectionContainer>
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title={t('embedTitle')} />
          <Link
            href={`/atlas?region=${region}`}
            className="font-heading text-sm font-semibold text-primary"
          >
            {t('openFullAtlas')} →
          </Link>
        </div>
        <AtlasExplorer lockedRegion={region as RegionCode} />
      </div>
    </SectionContainer>
  )
}
