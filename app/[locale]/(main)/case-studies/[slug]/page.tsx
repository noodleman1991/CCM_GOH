import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { client } from '@/sanity/lib/client'
import { PortableText } from '@portabletext/react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Building,
  Share2,
  Bookmark,
  Download,
  Star,
  Tag
} from 'lucide-react'

import { portableTextComponents } from "@/components/portable-text-renderer"
import { format } from 'date-fns'
import { getLocalizedTitle, getLocalizedExcerpt, getLocalizedText } from '@/lib/localization-utils'

// Fetch single case study by slug
async function fetchCaseStudy(slug: string) {
  return await client.fetch(`
    *[_type == "caseStudy" && slug.current == $slug && status == "approved"][0] {
      _id,
      title,
      excerpt,
      topic,
      content,
      "slug": slug.current,
      "image": image.asset->url,
      "imageAlt": image.alt,
      "imageCaption": image.caption,
      publishedAt,
      featured,
      submittedAt,
      submittedBy,
      authors,
      tags[]-> {
        _id,
        title,
        "value": value.current
      },
      studyPeriod,
      "studyLocation": studyLocation,
      studyAreas,
      organizations[]-> {
        _id,
        name,
        "logo": logo.asset->url
      },
      projects[]-> {
        _id,
        title,
        "slug": slug.current
      },
      "relatedCommunity": relatedCommunity-> {
        _id,
        name,
        "slug": slug.current
      },
      seoTitle,
      seoDescription,
      canonicalUrl
    }
  `, { slug })
}

// Fetch related case studies
async function fetchRelatedCaseStudies(topic: string, currentId: string, limit = 3) {
  return await client.fetch(`
    *[_type == "caseStudy" && status == "approved" && topic == $topic && _id != $currentId] | order(publishedAt desc)[0...$limit] {
      _id,
      "slug": slug.current,
      title,
      excerpt,
      "image": image.asset->url,
      publishedAt,
      authors
    }
  `, { topic, currentId, limit })
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-8 w-24" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const caseStudy = await fetchCaseStudy(slug)

  if (!caseStudy) {
    return {
      title: 'Case Study Not Found'
    }
  }

  const title = caseStudy.seoTitle || caseStudy.title[locale] || caseStudy.title.en
  const description = caseStudy.seoDescription || caseStudy.excerpt[locale] || caseStudy.excerpt.en

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime: caseStudy.publishedAt,
      authors: caseStudy.authors?.map((author: any) => author.name),
      images: caseStudy.image ? [{ url: caseStudy.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: caseStudy.image ? [caseStudy.image] : [],
    },
    alternates: {
      canonical: caseStudy.canonicalUrl || undefined
    }
  }
}

export default async function CaseStudyPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CaseStudyContent locale={locale} slug={slug} />
    </Suspense>
  )
}

async function CaseStudyContent({ locale, slug }: { locale: string; slug: string }) {
  const [caseStudy, t] = await Promise.all([
    fetchCaseStudy(slug),
    getTranslations({ locale, namespace: 'caseStudy' })
  ])

  if (!caseStudy) {
    notFound()
  }

  const relatedCaseStudies = caseStudy.topic
    ? await fetchRelatedCaseStudies(caseStudy.topic, caseStudy._id)
    : []

  const getTitle = (title: Record<string, string>) => {
    return getLocalizedTitle(title, locale)
  }

  const getExcerpt = (excerpt: Record<string, string>) => {
    return getLocalizedExcerpt(excerpt, locale)
  }

  const getAuthorInitials = (author: { name: string }) => {
    return author.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const topicLabels: Record<string, string> = {
    'climate-environment': 'Climate Change & Environment',
    'mental-health': 'Mental Health & Wellbeing',
    'community-health': 'Community Health & Social Care',
    'youth-education': 'Youth Engagement & Education',
    'policy-governance': 'Policy Research & Governance',
    'technology-innovation': 'Technology & Innovation',
    'economic-development': 'Economic Development',
    'cultural-arts': 'Cultural Heritage & Arts',
    'food-agriculture': 'Food Security & Agriculture',
    'urban-planning': 'Urban Planning & Infrastructure',
    'human-rights': 'Human Rights & Social Justice',
    'migration': 'Migration & Displacement',
    'gender-equality': 'Gender Equality',
    'disaster-resilience': 'Disaster Risk & Resilience',
    'digital-inclusion': 'Digital Inclusion',
    'other': 'Other'
  }

  return (
    <div className="container max-w-7xl py-8">
      {/* Back Navigation */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="flex items-center gap-2">
          <Link href={`/${locale}/case-studies`}>
            <ArrowLeft className="w-4 h-4" />
            {t('backToCaseStudies')}
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-6 mb-12">
        {/* Topic and Featured Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {caseStudy.topic && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {topicLabels[caseStudy.topic] || caseStudy.topic}
            </Badge>
          )}
          {caseStudy.featured && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </Badge>
          )}
        </div>

        {/* Title */}
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
          {getTitle(caseStudy.title)}
        </h1>

        {/* Excerpt */}
        <p className="text-xl text-muted-foreground leading-relaxed max-w-4xl">
          {getExcerpt(caseStudy.excerpt)}
        </p>

        {/* Meta Information */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Published {format(new Date(caseStudy.publishedAt), 'MMMM d, yyyy')}
          </div>

          {caseStudy.authors && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              {caseStudy.authors.length} author{caseStudy.authors.length !== 1 ? 's' : ''}
            </div>
          )}

          {caseStudy.relatedCommunity && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <Link
                href={`/${locale}/communities/${caseStudy.relatedCommunity.slug}`}
                className="hover:text-primary"
              >
                {caseStudy.relatedCommunity.name}
              </Link>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Save
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Featured Image */}
      {caseStudy.image && (
        <div className="mb-12">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <Image
              src={caseStudy.image}
              alt={caseStudy.imageAlt || getTitle(caseStudy.title)}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
          {caseStudy.imageCaption && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              {caseStudy.imageCaption}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Article Content */}
        <div className="lg:col-span-2">
          <div className="prose prose-lg max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold prose-code:text-primary prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
            {caseStudy.content && (
              // <PortableText
              //   value={caseStudy.content}
              //   components={portableTextComponents(locale)}
              // />
              <PortableText
                  value={caseStudy.content as any}
                  components={portableTextComponents(locale)}
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Authors */}
          {caseStudy.authors && caseStudy.authors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Authors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {caseStudy.authors.map((author: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getAuthorInitials(author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{author.name}</p>
                      <p className="text-sm text-muted-foreground">{author.role}</p>
                      {author.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {author.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Study Details */}
          <Card>
            <CardHeader>
              <CardTitle>Study Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Study Period */}
              {(caseStudy.studyPeriod?.startDate || caseStudy.studyPeriod?.endDate) && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Study Period</p>
                    <p className="text-muted-foreground">
                      {caseStudy.studyPeriod.startDate && format(new Date(caseStudy.studyPeriod.startDate), 'MMM yyyy')}
                      {caseStudy.studyPeriod.startDate && caseStudy.studyPeriod.endDate && ' - '}
                      {caseStudy.studyPeriod.endDate ? format(new Date(caseStudy.studyPeriod.endDate), 'MMM yyyy') :
                        (caseStudy.studyPeriod.startDate && ' - Ongoing')}
                    </p>
                  </div>
                </div>
              )}

              {/* Organizations */}
              {caseStudy.organizations && caseStudy.organizations.length > 0 && (
                <div className="flex items-start gap-2">
                  <Building className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="text-sm space-y-1">
                    <p className="font-medium">Organizations</p>
                    {caseStudy.organizations.map((org: any) => (
                      <div key={org._id} className="flex items-center gap-2">
                        {org.logo && (
                          <Image
                            src={org.logo}
                            alt={org.name}
                            width={16}
                            height={16}
                            className="rounded"
                          />
                        )}
                        <span className="text-muted-foreground">{org.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {caseStudy.tags && caseStudy.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.tags.map((tag: any) => (
                    <Badge key={tag._id} variant="secondary">
                      {getLocalizedText(tag.title, locale, tag.value)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Related Case Studies */}
      {relatedCaseStudies.length > 0 && (
        <div className="mt-16">
          <Separator className="mb-8" />
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Related Case Studies</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedCaseStudies.map((related: any) => (
                <Card key={related._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <Link href={`/${locale}/case-studies/${related.slug}`}>
                    {related.image && (
                      <div className="relative h-48 bg-muted">
                        <Image
                          src={related.image}
                          alt={getTitle(related.title)}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {getTitle(related.title)}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {getExcerpt(related.excerpt)}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {related.authors?.length} author{related.authors?.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {format(new Date(related.publishedAt), 'MMM yyyy')}
                        </span>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
