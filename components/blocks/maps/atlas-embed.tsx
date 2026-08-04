import { getTranslations } from 'next-intl/server'
import { SectionHeader } from '@/components/ui/section-header'
import SectionContainer from '@/components/ui/section-container'
import { AtlasExplorer } from '@/components/atlas/atlas-explorer'
import { Link } from '@/i18n/navigation'
import { isRegionCode, type RegionCode } from '@/lib/maps/region-codes'
import { getRegionArt } from '@/lib/maps/region-art'
import { getThemeOptions } from '@/lib/maps/themes'

/**
 * Server wrapper for the region-scoped atlas (spec A4). The country breakdown
 * is fetched by the client explorer's pins call; this wrapper only frames it.
 */
export default async function AtlasEmbedBlock({
  region,
  showBreakdown,
}: {
  region?: string
  showBreakdown?: boolean
}) {
  if (!region || !isRegionCode(region)) return null
  const t = await getTranslations('atlas')
  const [themes, regionArt] = await Promise.all([getThemeOptions(), getRegionArt()])

  return (
    <SectionContainer>
      {/* SectionContainer owns the page edge (max-w-6xl + px) — no nested
          container, so the embed's edge matches every sibling block (B2.5). */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeader title={t('embedTitle')} />
          <Link
            href={`/atlas?region=${region}`}
            className="font-heading text-sm font-semibold text-primary"
          >
            {t('openFullAtlas')} →
          </Link>
        </div>
        <AtlasExplorer lockedRegion={region as RegionCode} themes={themes} regionArt={regionArt} showBreakdown={showBreakdown} />
      </div>
    </SectionContainer>
  )
}
