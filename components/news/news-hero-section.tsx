import { useTranslations } from 'next-intl'
import FeaturedNewsCard from './featured-news-card'
import { SectionHeader } from '@/components/ui/section-header'
import type { NewsPost } from '@/lib/news-utils'
import type { HubIllustration } from '@/lib/content/illustrations'
import { cn } from '@/lib/utils'

interface NewsHeroSectionProps {
  featuredNews: NewsPost[]
  locale: string
  className?: string
  fallbackIllustration?: HubIllustration | null
}

/**
 * The featured area: ONE lead story, large (image at inline-start on desktop,
 * stacked on mobile). Other featured stories join the main date-sorted grid
 * (2026-09-30) — a lone compact card beside nothing left a half-empty row.
 */
export default function NewsHeroSection({ featuredNews, locale, className, fallbackIllustration }: NewsHeroSectionProps) {
  const t = useTranslations('news')
  if (!featuredNews || featuredNews.length === 0) return null

  const [lead] = featuredNews

  return (
    <section className={cn('space-y-6', className)}>
      <SectionHeader title={t('featured')} />

      <FeaturedNewsCard news={lead} locale={locale} variant="lead" fallbackIllustration={fallbackIllustration} />
    </section>
  )
}
