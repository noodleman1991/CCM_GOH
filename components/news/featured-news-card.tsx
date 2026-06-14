import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, MapPin, Star } from 'lucide-react'
import { urlFor } from '@/sanity/lib/image'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import { formatNewsDate } from '@/lib/news-utils'
import { cn } from '@/lib/utils'
import type { NewsPost } from '@/lib/news-utils'

interface FeaturedNewsCardProps {
  news: NewsPost
  locale: string
  className?: string
}

export default function FeaturedNewsCard({ news, locale, className }: FeaturedNewsCardProps) {
  const title = getLocalizedValue(news.title, locale)
  const subtitle = getLocalizedValue(news.subtitle, locale)
  const excerpt = getLocalizedValue(news.excerpt, locale)
  const imageAlt = getLocalizedValue(news.image?.alt, locale)

  return (
    <Link href={`/${locale}/news/${news.slug}`}>
      <Card className={cn(
        "group overflow-hidden h-full hover:shadow-2xl transition-all duration-300",
        "border-2 hover:border-primary/50",
        className
      )}>
        {/* Large Image - Hero style */}
        {news.image?.asset?.url && (
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image
              src={urlFor(news.image).width(800).height(450).url()}
              alt={imageAlt || title || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              placeholder={news.image?.asset?.metadata?.lqip ? "blur" : undefined}
              blurDataURL={news.image?.asset?.metadata?.lqip || ''}
            />
            {/* Featured Badge Overlay */}
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-500 text-black font-semibold px-3 py-1.5 shadow-lg flex items-center gap-1">
                <Star className="w-3 h-3 fill-black" />
                Featured
              </Badge>
            </div>
          </div>
        )}

        {/* Content */}
        <CardContent className="p-6 space-y-4">
          {/* Tags */}
          {news.tags && news.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {news.tags.slice(0, 2).map((tag) => {
                const tagLabel = getLocalizedValue(tag.label, locale)
                return (
                  <Badge
                    key={tag._id}
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                    className="text-xs font-medium border"
                  >
                    {tagLabel}
                  </Badge>
                )
              })}
              {news.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{news.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-2xl lg:text-3xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
              {title}
            </h3>
          </div>

          {/* Summary: subtitle if present, otherwise excerpt — never both, so
              the card stays readable instead of stacking two text blocks. */}
          {(subtitle || excerpt) && (
            <p className="text-base text-muted-foreground line-clamp-3 leading-relaxed">
              {subtitle || excerpt}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pt-2">
            {/* Date */}
            {news.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <time dateTime={news.publishedAt}>
                  {formatNewsDate(news.publishedAt, locale)}
                </time>
              </div>
            )}

            {/* Author */}
            {news.author && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="font-medium">{news.author.name}</span>
              </div>
            )}

            {/* Location */}
            {news.locationDetails && (news.locationDetails.city || news.locationDetails.country) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>
                  {[news.locationDetails.city, news.locationDetails.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Organizations */}
          {news.organizations && news.organizations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {news.organizations.slice(0, 3).map((org) => (
                <Badge key={org._id} variant="outline" className="text-xs">
                  {org.name}
                </Badge>
              ))}
              {news.organizations.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{news.organizations.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
