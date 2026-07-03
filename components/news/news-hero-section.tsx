import { useTranslations } from 'next-intl'
import FeaturedNewsCard from './featured-news-card'
import { SectionHeader } from '@/components/ui/section-header'
import type { NewsPost } from '@/lib/news-utils'
import { cn } from '@/lib/utils'

interface NewsHeroSectionProps {
  featuredNews: NewsPost[]
  locale: string
  className?: string
}

/**
 * Featured hero with lead-story emphasis: the first featured item is a large
 * lead card (image at inline-start on desktop, stacked on mobile); the
 * remaining items (up to two) follow as compact cards.
 */
export default function NewsHeroSection({ featuredNews, locale, className }: NewsHeroSectionProps) {
  const t = useTranslations('news')
  if (!featuredNews || featuredNews.length === 0) return null

  const [lead, ...rest] = featuredNews.slice(0, 3)

  return (
    <section className={cn('space-y-6', className)}>
      <SectionHeader title={t('featured')} />

      <FeaturedNewsCard news={lead} locale={locale} variant="lead" />

      {rest.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {rest.map((news) => (
            <FeaturedNewsCard key={news._id} news={news} locale={locale} variant="compact" />
          ))}
        </div>
      )}
    </section>
  )
}
