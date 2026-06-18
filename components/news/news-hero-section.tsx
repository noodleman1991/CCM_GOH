import { useTranslations } from 'next-intl'
import FeaturedNewsCard from './featured-news-card'
import type { NewsPost } from '@/lib/news-utils'
import { cn } from '@/lib/utils'

interface NewsHeroSectionProps {
  featuredNews: NewsPost[]
  locale: string
  className?: string
}

export default function NewsHeroSection({ featuredNews, locale, className }: NewsHeroSectionProps) {
  const t = useTranslations('news')
  if (!featuredNews || featuredNews.length === 0) return null

  // Determine grid layout based on number of featured items
  const getGridLayout = () => {
    const count = Math.min(featuredNews.length, 3)
    switch (count) {
      case 1:
        return 'grid-cols-1' // Single large card
      case 2:
        return 'grid-cols-1 md:grid-cols-2' // Two cards side by side
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // Three cards
      default:
        return 'grid-cols-1'
    }
  }

  const gridLayout = getGridLayout()

  return (
    <section className={cn("space-y-6", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {t('featured')}
        </h2>
      </div>

      {/* Featured News Grid */}
      <div className={cn("grid gap-6", gridLayout)}>
        {featuredNews.slice(0, 3).map((news) => (
          <FeaturedNewsCard
            key={news._id}
            news={news}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}
