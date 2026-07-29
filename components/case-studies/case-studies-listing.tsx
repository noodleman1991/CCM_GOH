"use client"

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Calendar,
  User,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { getLocalizedTitle, getLocalizedExcerpt, getLocalizedText } from '@/lib/localization-utils'

interface CaseStudy {
  _id: string
  topic?: string
  slug: string
  title: Record<string, string>
  excerpt: Record<string, string>
  image?: string
  imageAlt?: string
  publishedAt: string
  featured?: boolean
  tags?: Array<{
    _id: string
    title: Record<string, string>
    value: string
  }>
  authors: Array<{
    name: string
    email?: string
    role: string
  }>
  relatedCommunity?: string
}

interface CaseStudiesListingProps {
  caseStudies: CaseStudy[]
  layout?: 'grid' | 'horizontal-scroll' | 'list'
  showFeaturedBadge?: boolean
  className?: string
}

export default function CaseStudiesListing({
  caseStudies,
  layout = 'grid',
  showFeaturedBadge = false,
  className
}: CaseStudiesListingProps) {
  const locale = useLocale()
  const [scrollPosition, setScrollPosition] = useState(0)

  const getTitle = (caseStudy: CaseStudy) => {
    return getLocalizedTitle(caseStudy.title, locale)
  }

  const getExcerpt = (caseStudy: CaseStudy) => {
    return getLocalizedExcerpt(caseStudy.excerpt, locale)
  }

  const getAuthorInitials = (author: { name: string }) => {
    if (!author?.name || typeof author.name !== 'string') return 'NA'
    return author.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('horizontal-scroll-container')
    if (container) {
      const scrollAmount = 320 // Card width + gap
      const newPosition = direction === 'left'
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount

      container.scrollTo({ left: newPosition, behavior: 'smooth' })
      setScrollPosition(newPosition)
    }
  }

  const CaseStudyCard = ({ caseStudy, compact = false }: { caseStudy: CaseStudy, compact?: boolean }) => (
    <Card className={cn(
      "group hover:shadow-lg transition-all duration-200 overflow-hidden",
      compact && "min-w-[300px]",
      layout === 'horizontal-scroll' && "flex-shrink-0"
    )}>
      <Link href={`/${locale}/research-and-action/case-studies/${caseStudy.slug}`}>
        <div className="relative">
          {/* Image */}
          <div className={cn(
            "relative overflow-hidden bg-muted",
            compact ? "h-40" : "h-48"
          )}>
            {caseStudy.image ? (
              <Image
                src={caseStudy.image}
                alt={caseStudy.imageAlt || getTitle(caseStudy)}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-8 h-8 bg-primary/30 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ExternalLink className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Case Study</p>
                </div>
              </div>
            )}

            {/* Featured badge */}
            {showFeaturedBadge && caseStudy.featured && (
              <div className="absolute top-3 start-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Topic badge */}
            {caseStudy.topic && (
              <div className="absolute top-3 end-3">
                <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
                  {caseStudy.topic.replace('-', ' ')}
                </Badge>
              </div>
            )}
          </div>

          <CardContent className={cn("p-4", compact && "p-3")}>
            {/* Title */}
            <h3 className={cn(
              "font-semibold leading-tight mb-2 group-hover:text-primary transition-colors",
              compact ? "text-sm line-clamp-2" : "text-base line-clamp-2"
            )}>
              {getTitle(caseStudy)}
            </h3>

            {/* Excerpt */}
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {getExcerpt(caseStudy)}
              </p>
            )}

            {/* Meta information */}
            <div className="space-y-2">
              {/* Authors */}
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  {caseStudy.authors.slice(0, 3).map((author, index) => (
                    <Avatar key={index} className="w-5 h-5">
                      <AvatarFallback className="text-xs">
                        {getAuthorInitials(author)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {caseStudy.authors.length > 3 && (
                    <span className="text-xs text-muted-foreground ms-1">
                      +{caseStudy.authors.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Date and Community */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(caseStudy.publishedAt), 'MMM yyyy')}
                </div>
                {caseStudy.relatedCommunity && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[100px]">
                      {caseStudy.relatedCommunity}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {caseStudy.tags && caseStudy.tags.length > 0 && !compact && (
              <div className="flex flex-wrap gap-1 mt-3">
                {caseStudy.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag._id} variant="secondary" className="text-xs">
                    {getLocalizedText(tag.title, locale, tag.value)}
                  </Badge>
                ))}
                {caseStudy.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{caseStudy.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Link>
    </Card>
  )

  if (caseStudies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            No case studies found
          </h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or check back later for new content.
          </p>
        </div>
      </Card>
    )
  }

  if (layout === 'horizontal-scroll') {
    return (
      <div className={cn("relative", className)}>
        {/* Scroll controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollContainer('left')}
              disabled={scrollPosition === 0}
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scrollContainer('right')}
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          id="horizontal-scroll-container"
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {caseStudies.map((caseStudy) => (
            <CaseStudyCard
              key={caseStudy._id}
              caseStudy={caseStudy}
              compact={true}
            />
          ))}
        </div>
      </div>
    )
  }

  if (layout === 'list') {
    return (
      <div className={cn("space-y-4", className)}>
        {caseStudies.map((caseStudy) => (
          <Card key={caseStudy._id} className="overflow-hidden">
            <Link href={`/${locale}/research-and-action/case-studies/${caseStudy.slug}`}>
              <div className="flex">
                {/* Image */}
                <div className="relative w-48 h-32 flex-shrink-0 bg-muted">
                  {caseStudy.image ? (
                    <Image
                      src={caseStudy.image}
                      alt={caseStudy.imageAlt || getTitle(caseStudy)}
                      fill
                      className="object-cover"
                      sizes="192px"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-primary/60" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="flex-1 p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold line-clamp-1 flex-1">
                      {getTitle(caseStudy)}
                    </h3>
                    {caseStudy.featured && showFeaturedBadge && (
                      <Badge variant="secondary" className="ms-2">
                        <Star className="w-3 h-3 fill-current me-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {getExcerpt(caseStudy)}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {caseStudy.authors.length} author{caseStudy.authors.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(caseStudy.publishedAt), 'MMM yyyy')}
                      </div>
                      {caseStudy.relatedCommunity && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {caseStudy.relatedCommunity}
                        </div>
                      )}
                    </div>

                    {caseStudy.tags && caseStudy.tags.length > 0 && (
                      <div className="flex gap-1">
                        {caseStudy.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag._id} variant="secondary" className="text-xs">
                            {getLocalizedText(tag.title, locale, tag.value)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    )
  }

  // Grid layout (default)
  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      className
    )}>
      {caseStudies.map((caseStudy) => (
        <CaseStudyCard key={caseStudy._id} caseStudy={caseStudy} />
      ))}
    </div>
  )
}