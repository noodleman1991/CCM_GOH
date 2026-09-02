import { getCaseStudyOgData } from '@/lib/content/case-studies'
import { contentOgCard } from '@/lib/seo/og-card'

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
  const doc = await getCaseStudyOgData(slug)
  const t = doc?.title
  const title =
    (typeof t === 'string' ? t : t?.[locale] || t?.en || Object.values(t ?? {})[0]) || 'Case study'
  return contentOgCard({ title, typeLabel: 'Case study', type: 'caseStudy', regionLabel: doc?.region })
}
