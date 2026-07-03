import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Calendar } from 'lucide-react'
import { urlFor } from '@/sanity/lib/image'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import { formatNewsDate } from '@/lib/news-utils'
import { normalizeTagColor } from '@/lib/tags'
import { CARD_ASPECT, CARD_ASPECT_SOURCE } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import type { NewsPost } from '@/lib/news-utils'

interface FeaturedNewsCardProps {
  news: NewsPost
  locale: string
  /**
   * `lead` — the single large lead story (image at inline-start on desktop,
   * stacked on mobile). `compact` — the smaller companion cards.
   */
  variant?: 'lead' | 'compact'
  className?: string
}

/**
 * Featured-news card for the news list hero. One lead story carries the
 * emphasis; the remaining featured items render as compact cards. Both share
 * the unified card ratio (CARD_ASPECT.wide) and the quiet kicker → title →
 * summary → date/author hierarchy used across CCM cards.
 */
export default function FeaturedNewsCard({
  news,
  locale,
  variant = 'compact',
  className,
}: FeaturedNewsCardProps) {
  const t = useTranslations('news')
  const title = getLocalizedValue(news.title, locale)
  const subtitle = getLocalizedValue(news.subtitle, locale)
  const excerpt = getLocalizedValue(news.excerpt, locale)
  const imageAlt = getLocalizedValue(news.image?.alt, locale)
  const kicker = news.tags?.[0]
  const isLead = variant === 'lead'
  const { w, h } = CARD_ASPECT_SOURCE.wide

  const image = news.image?.asset?.url ? (
    <Image
      src={urlFor(news.image).width(isLead ? 1200 : w).height(isLead ? 675 : h).url()}
      alt={imageAlt || title || ''}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes={isLead ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 100vw, 50vw'}
      priority={isLead}
      placeholder={news.image?.asset?.metadata?.lqip ? 'blur' : undefined}
      blurDataURL={news.image?.asset?.metadata?.lqip || ''}
    />
  ) : null

  const featuredBadge = (
    <span className="absolute top-2 end-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
      {t('featuredBadge')}
    </span>
  )

  const meta = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
      {news.publishedAt && (
        <span className="inline-flex shrink-0 items-center gap-1">
          <Calendar className="size-3 shrink-0" />
          <time dateTime={news.publishedAt}>{formatNewsDate(news.publishedAt, locale)}</time>
        </span>
      )}
      {news.publishedAt && news.author && <span aria-hidden="true">·</span>}
      {news.author && (
        <span className="min-w-0 truncate font-medium text-foreground/80">
          <bdi>{news.author.name}</bdi>
        </span>
      )}
    </div>
  )

  return (
    <Link
      href={`/news/${news.slug}`}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300',
        'hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isLead && 'md:flex-row',
        className
      )}
    >
      {/* Image (or on-brand gradient fallback) — inline-start half on desktop
          for the lead, unified wide ratio on the compact cards. */}
      <div
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-ccm-sky/40 to-ccm-water/30',
          CARD_ASPECT.wide,
          isLead && 'md:aspect-auto md:w-1/2 md:self-stretch'
        )}
      >
        {image}
        {featuredBadge}
      </div>

      {/* Content */}
      <div className={cn('flex flex-1 flex-col p-6', isLead && 'md:w-1/2 md:justify-center lg:p-8')}>
        {kicker && (
          <p
            className="mb-1.5 truncate text-xs font-semibold uppercase tracking-wide"
            style={{ color: normalizeTagColor(kicker.color) }}
          >
            {getLocalizedValue(kicker.label, locale)}
          </p>
        )}

        <h3
          className={cn(
            'font-heading font-bold leading-snug text-balance break-words text-ccm-midnight transition-colors group-hover:text-primary',
            isLead ? 'text-2xl sm:text-3xl line-clamp-3' : 'text-lg sm:text-xl line-clamp-2'
          )}
        >
          {title}
        </h3>

        {/* Summary: subtitle if present, otherwise excerpt — never both. */}
        {(subtitle || excerpt) && (
          <p
            className={cn(
              'mt-2 text-muted-foreground',
              isLead ? 'text-base leading-relaxed line-clamp-3' : 'text-sm line-clamp-2'
            )}
          >
            {subtitle || excerpt}
          </p>
        )}

        <div className={cn('pt-4', isLead ? 'mt-2' : 'mt-auto')}>{meta}</div>
      </div>
    </Link>
  )
}
