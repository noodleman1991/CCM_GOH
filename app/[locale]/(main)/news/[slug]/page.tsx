export const revalidate = 300;

import type { Metadata } from "next"
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, Building2, MapPin, ArrowLeft, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { urlFor } from '@/sanity/lib/image'
import { getLocalizedValue } from '@/i18n/i18n-helpers'
import { formatNewsDate, getReadingTime } from '@/lib/news-utils'
import { PortableText } from '@portabletext/react'
import { client } from '@/sanity/lib/client'
import { fetchNewsBySlug, fetchRelatedNews } from '@/sanity/queries/news-queries'
import { CommentIsland } from '@/components/comments/comment-island'
import { groq } from 'next-sanity'

// Generate static params for all news posts
export async function generateStaticParams() {
  const newsPosts = await client.fetch(
    groq`*[_type == "newsPost" && defined(slug.current)]{
      "slug": slug.current
    }`
  )

  const locales = ['en', 'es', 'fr', 'ar']
  const params = []

  for (const post of newsPosts) {
    for (const locale of locales) {
      params.push({
        locale,
        slug: post.slug,
      })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const newsPost = await fetchNewsBySlug(slug)

  if (!newsPost) {
    return {
      title: 'News Not Found',
    }
  }

  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar'
  const title = getLocalizedValue(newsPost.title, supportedLocale) || 'News'
  const description = getLocalizedValue(newsPost.excerpt, supportedLocale) || ''

  return {
    title: newsPost.meta_title || title,
    description: newsPost.meta_description || description,
    openGraph: {
      title: newsPost.meta_title || title,
      description: newsPost.meta_description || description,
      type: 'article',
      publishedTime: newsPost.publishedAt,
      modifiedTime: newsPost._updatedAt,
      images: newsPost.ogImage?.asset?.url || newsPost.image?.asset?.url
        ? [newsPost.ogImage?.asset?.url || newsPost.image?.asset?.url]
        : [],
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const newsPost = await fetchNewsBySlug(slug)

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
    ? await fetchRelatedNews(newsPost._id, tagIds, 3)
    : []

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href={`/news`} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('backToNews')}
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        {/* Featured badge */}
        {newsPost.featured && (
          <Badge className="bg-yellow-500 text-black font-semibold px-3 py-1.5 flex items-center gap-1 w-fit">
            <Star className="w-3 h-3 fill-black" />
            {t('featured')}
          </Badge>
        )}

        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>

        {subtitle && (
          <p className="text-xl text-muted-foreground">{subtitle}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {newsPost.publishedAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{formatNewsDate(newsPost.publishedAt, locale)}</span>
            </div>
          )}

          {newsPost.author && (
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{newsPost.author.name}</span>
            </div>
          )}

          {newsPost.locationDetails && (newsPost.locationDetails.city || newsPost.locationDetails.country) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>
                {[newsPost.locationDetails.city, newsPost.locationDetails.country]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            </div>
          )}

          {readingTime > 0 && (
            <div className="flex items-center gap-1.5">
              <span>{readingTime} min read</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {newsPost.tags && newsPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {newsPost.tags.map((tag: { _id: string; label: any; color?: string }) => {
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
      </div>

      <Separator />

      {/* Featured Image */}
      {newsPost.image?.asset?.url && (
        <div className="space-y-2">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={urlFor(newsPost.image).width(1200).height(675).url()}
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

      {/* Excerpt */}
      {excerpt && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <p className="text-lg leading-relaxed">{excerpt}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {newsPost.content && (
        <Card>
          <CardContent className="prose prose-lg mx-auto max-w-prose pt-6 dark:prose-invert">
            <PortableText value={newsPost.content} />
          </CardContent>
        </Card>
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
                  {t('metadata.organization')}
                  {newsPost.organizations.length > 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {newsPost.organizations.map((org: any) => (
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
                  {t('metadata.project')}
                  {newsPost.projects.length > 1 ? 's' : ''}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {newsPost.projects.map((project: any) => (
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
              {newsPost.sources.map((source: any, index: number) => (
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
          <div>
            <h2 className="text-2xl font-bold mb-6">{t('relatedNews')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedNews.map((related: any) => {
                const relatedTitle = getLocalizedValue(related.title, supportedLocale)
                const relatedExcerpt = getLocalizedValue(related.excerpt, supportedLocale)
                return (
                  <Link key={related._id} href={`/news/${related.slug}`}>
                    <Card className="group overflow-hidden h-full hover:shadow-lg transition-shadow">
                      {related.image?.asset?.url && (
                        <div className="relative aspect-video overflow-hidden bg-muted">
                          <Image
                            src={urlFor(related.image).width(400).height(225).url()}
                            alt={relatedTitle || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                          {relatedTitle}
                        </h3>
                        {relatedExcerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {relatedExcerpt}
                          </p>
                        )}
                      </CardContent>
                    </Card>
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
