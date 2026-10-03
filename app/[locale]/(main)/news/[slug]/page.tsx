import type { Metadata } from "next"
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, Building2, MapPin, Star, ExternalLink } from 'lucide-react'
import { BackLink } from '@/components/ui/back-link'
import { SectionHeader } from '@/components/ui/section-header'
import { CARD_ASPECT, CARD_ASPECT_SOURCE } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { imageUrl } from '@/lib/content/images'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import { formatNewsDate, getReadingTime } from '@/lib/news-utils'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { softBreaksToParagraphs } from '@/lib/content/soft-breaks-to-paragraphs'
import { getNewsPostBySlug, getRelatedNews } from '@/lib/content/news'
import { CommentIsland } from '@/components/comments/comment-island'
import { JsonLd, articleJsonLd } from '@/lib/seo/json-ld'
import { FollowButton } from "@/components/follow/follow-button";
import { absoluteUrl, siteUrl } from "@/lib/seo/site-url"
import { StaffEditLink } from "@/components/cms/staff-edit-link";

// Generate static params for all news posts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const newsPost = await getNewsPostBySlug(slug)
  const t = await getTranslations({ locale, namespace: 'news' })

  if (!newsPost) {
    return {
      title: t('metaNotFound'),
    }
  }

  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar'
  const title = getLocalizedValue(newsPost.title, supportedLocale) || t('title')
  const description = getLocalizedValue(newsPost.excerpt, supportedLocale) || ''
  // Crawlers fetch this directly, so it is the 1200x675 derivative made absolute,
  // never the multi-megabyte original.
  const ogImageUrl = absoluteUrl(imageUrl(newsPost.ogImage ?? newsPost.image, { width: 1200, height: 675 }))

  return {
    title: newsPost.meta_title || title,
    description: newsPost.meta_description || description,
    openGraph: {
      title: newsPost.meta_title || title,
      description: newsPost.meta_description || description,
      type: 'article',
      publishedTime: newsPost.publishedAt,
      modifiedTime: newsPost._updatedAt,
      images: [
        `${siteUrl()}/${locale}/news/${slug}/og.png`,
        ...(ogImageUrl ? [ogImageUrl] : []),
      ],
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const newsPost = await getNewsPostBySlug(slug)

  if (!newsPost) {
    notFound()
  }

  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar'
  const t = await getTranslations({ locale, namespace: 'news' })

  // Get localized content
  const title = getLocalizedValue(newsPost.title, supportedLocale) || 'News'
  const subtitle = getLocalizedValue(newsPost.subtitle, supportedLocale)
  const excerpt = getLocalizedValue(newsPost.excerpt, supportedLocale)
  const imageAlt = getLocalizedValue(newsPost.image?.alt, supportedLocale)
  const imageCaption = getLocalizedValue(newsPost.image?.caption, supportedLocale)

  // Get reading time
  const readingTime = getReadingTime(newsPost.content)

  // Fetch related news if tags exist
  const tagIds = newsPost.tags?.map((tag: { _id: string }) => tag._id) || []
  const relatedNews = tagIds.length > 0
    ? await getRelatedNews(newsPost._id, tagIds, 3)
    : []

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <StaffEditLink collection="newsPosts" id={String(newsPost._id ?? "")} from={`/${locale}/news/${slug}`} />
      <JsonLd
        data={articleJsonLd({
          title,
          description: excerpt || subtitle || undefined,
          url: `${siteUrl()}/${locale}/news/${slug}`,
          // Absolute: Next absolutises `openGraph.images` but not raw JSON-LD,
          // and under Payload this url is a relative `/payload-api/…` path.
          image: absoluteUrl(newsPost.image?.asset?.url),
          datePublished: newsPost.publishedAt ?? null,
          authorName: newsPost.author?.name ?? null,
          inLanguage: locale,
        })}
      />
      {/* Back link */}
      <BackLink href="/news" label={t('backToNews')} />

      {/* Header — kicker chip row · balanced title · quiet meta row */}
      <header className="space-y-4">
        {/* Kicker: featured + region + topic chips in one quiet row */}
        {(newsPost.featured || newsPost.relatedCommunity || (newsPost.tags && newsPost.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2">
            {newsPost.featured && (
              <Badge className="flex items-center gap-1 px-3 py-1">
                <Star className="w-3 h-3 fill-current" />
                {t('featuredBadge')}
              </Badge>
            )}
            {newsPost.relatedCommunity && (
              <>
                <Link href={`/news?communities=${newsPost.relatedCommunity.slug}`}>
                  <Badge variant="secondary" className="px-3 py-1 hover:bg-ccm-sea/10 hover:text-ccm-sea transition-colors">
                    <bdi>{getLocalizedValue(newsPost.relatedCommunity.name, supportedLocale)}</bdi>
                  </Badge>
                </Link>
                {/* Follow the story's region — ISR-safe (self-resolving). */}
                <FollowButton targetType="REGION" targetId={newsPost.relatedCommunity.slug} />
              </>
            )}
            {newsPost.tags?.map((tag: { _id: string; label: Record<string, string> | string; color?: string }) => {
              const tagLabel = getLocalizedValue(tag.label, supportedLocale)
              return (
                <Badge
                  key={tag._id}
                  variant="outline"
                  style={{
                    borderColor: tag.color,
                    color: tag.color,
                  }}
                >
                  {tagLabel}
                </Badge>
              )
            })}
          </div>
        )}

        <h1 dir="auto" className="font-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-balance text-ccm-midnight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-lg sm:text-xl text-muted-foreground text-balance">{subtitle}</p>
        )}

        {/* Meta row: date · author · location · reading time */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-muted-foreground">
          {newsPost.publishedAt && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <time dateTime={newsPost.publishedAt}>
                {formatNewsDate(newsPost.publishedAt, locale)}
              </time>
            </span>
          )}

          {newsPost.author && (
            <>
              {newsPost.publishedAt && <span aria-hidden="true">·</span>}
              <span className="inline-flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span className="font-medium text-foreground/80"><bdi>{newsPost.author.name}</bdi></span>
              </span>
            </>
          )}

          {newsPost.locationDetails && (newsPost.locationDetails.city || newsPost.locationDetails.country) && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>
                  {[newsPost.locationDetails.city, newsPost.locationDetails.country]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </span>
            </>
          )}

          {readingTime > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{t('minRead', { minutes: readingTime })}</span>
            </>
          )}
        </div>
      </header>

      <Separator />

      {/* Featured Image */}
      {newsPost.image?.asset?.url && (
        <div className="space-y-2">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={imageUrl(newsPost.image, { width: 1200, height: 675 })}
              alt={imageAlt || title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
          </div>
          {imageCaption && (
            <p className="text-sm text-muted-foreground text-center italic">
              {imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Excerpt — the story's standfirst: the same ccm-water start rule, in
          calm body type (2026-09-30: the heading-size version out-shouted the
          story itself). */}
      {excerpt && (
        <blockquote className="mx-auto max-w-prose border-s-4 border-ccm-water ps-5 py-1">
          <p dir="auto" className="text-lg sm:text-xl leading-relaxed text-ccm-midnight/90">
            {excerpt}
          </p>
        </blockquote>
      )}

      {/* Main Content */}
      {/* The hub's own text renderer (as case studies and lived experiences):
          real paragraph spacing, headings, quotes, images — no box around it. */}
      {newsPost.content && (
        <div className="mx-auto max-w-prose text-lg leading-relaxed">
          <PortableTextRenderer
            value={(Array.isArray(newsPost.content) ? softBreaksToParagraphs(newsPost.content) : newsPost.content) as never}
            locale={supportedLocale}
            isRTL={supportedLocale === 'ar'}
          />
        </div>
      )}

      {/* Discussion — lazy, ISR-safe island */}
      {newsPost._id && (
        <CommentIsland targetType="newsPost" targetId={newsPost._id} />
      )}

      {/* Organizations & Projects */}
      {((newsPost.organizations && newsPost.organizations.length > 0) ||
        (newsPost.projects && newsPost.projects.length > 0)) && (
        <Card>
          <CardContent className="p-6 space-y-4">
            {newsPost.organizations && newsPost.organizations.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t('metadata.organizations', { count: newsPost.organizations.length })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {newsPost.organizations.map((org: { _id: string; name: string }) => (
                    <Badge key={org._id} variant="secondary">
                      {org.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {newsPost.projects && newsPost.projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  {t('metadata.projects', { count: newsPost.projects.length })}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {newsPost.projects.map((project: { _id: string; name: string }) => (
                    <Badge key={project._id} variant="secondary">
                      {project.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {newsPost.sources && newsPost.sources.length > 0 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold">{t('sources')}</h3>
            <div className="space-y-3">
              {newsPost.sources.map((source: { url?: string; title?: string; publisher?: string; date?: string }, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div className="space-y-1">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      {source.title}
                    </a>
                    {(source.publisher || source.date) && (
                      <p className="text-sm text-muted-foreground">
                        {source.publisher}
                        {source.publisher && source.date && ' • '}
                        {source.date && new Date(source.date).toLocaleDateString(locale)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related News */}
      {relatedNews.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <div className="space-y-6">
            <SectionHeader title={t('relatedNews')} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((related: { _id: string; slug: string; title?: Record<string, string> | string; excerpt?: Record<string, string> | string; publishedAt?: string; image?: { asset?: { url?: string } } }) => {
                const relatedTitle = getLocalizedValue(related.title, supportedLocale)
                const relatedExcerpt = getLocalizedValue(related.excerpt, supportedLocale)
                return (
                  <Link
                    key={related._id}
                    href={`/news/${related.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {/* Unified wide card ratio; gradient fallback keeps cards even. */}
                    <div className={cn("relative overflow-hidden bg-gradient-to-br from-ccm-sky/40 to-ccm-water/30", CARD_ASPECT.wide)}>
                      {related.image?.asset?.url && (
                        <Image
                          src={imageUrl(related.image, {
                            width: CARD_ASPECT_SOURCE.wide.w,
                            height: CARD_ASPECT_SOURCE.wide.h,
                          })}
                          alt={relatedTitle || ''}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-heading font-semibold text-balance line-clamp-3 group-hover:text-primary transition-colors">
                        {relatedTitle}
                      </h3>
                      {relatedExcerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {relatedExcerpt}
                        </p>
                      )}
                      {related.publishedAt && (
                        <time
                          dateTime={related.publishedAt}
                          className="mt-auto pt-3 text-xs text-muted-foreground"
                        >
                          {formatNewsDate(related.publishedAt, locale)}
                        </time>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
