import { getLivedExperienceOgData } from '@/lib/content/lived-experiences'
import { contentOgCard } from '@/lib/seo/og-card'
import { getTranslations } from 'next-intl/server'

export const revalidate = 3600

/** Per-content share card (B7 follow-up): type-coloured, dir-aware title.
 *  A plain Route Handler, not the opengraph-image file convention — that
 *  convention 404s inside a route group + nested dynamic segment on
 *  Next 16.1.1/Turbopack (verified by bisection); generateMetadata on each
 *  page points og:image here explicitly instead. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await params
  // The share card is localised like the page it fronts (Slice 10a).
  const tType = await getTranslations({ locale, namespace: 'typedCards' })
  const doc = await getLivedExperienceOgData(slug)
  const t = doc?.title
  const title =
    (typeof t === 'string' ? t : t?.[locale] || t?.en || Object.values(t ?? {})[0]) ||
    'Lived experience'
  return contentOgCard({ title, typeLabel: tType('type.livedExperience'), type: 'livedExperience', regionLabel: doc?.region })
}
