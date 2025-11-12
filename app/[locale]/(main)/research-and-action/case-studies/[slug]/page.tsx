import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { fetchCaseStudyBySlug, fetchCaseStudiesStaticParams } from '@/sanity/queries/grid/grid-case-study'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users, Building, MapPin, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { getLocalizedText, formatCaseStudyDate, getPrimaryAuthor, getStudyLocationText } from '@/lib/case-study-utils'
import { PortableText } from '@portabletext/react'

export async function generateStaticParams() {
  const caseStudies = await fetchCaseStudiesStaticParams()

  // Generate params for all supported locales
  const locales = ['en', 'es', 'fr', 'ar']
  const params = []

  for (const caseStudy of caseStudies) {
    for (const locale of locales) {
      params.push({
        locale,
        slug: caseStudy.slug
      })
    }
  }

  return params
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const caseStudy = await fetchCaseStudyBySlug({ slug })

  if (!caseStudy) {
    return {
      title: 'Case Study Not Found'
    }
  }

  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar'
  const title = getLocalizedText(caseStudy.title, supportedLocale, 'Case Study')
  const description = getLocalizedText(caseStudy.excerpt, supportedLocale, '')

  return {
    title: caseStudy.seoTitle || title,
    description: caseStudy.seoDescription || description,
    openGraph: {
      title: caseStudy.seoTitle || title,
      description: caseStudy.seoDescription || description,
      type: 'article',
      publishedTime: caseStudy.publishedAt,
      images: caseStudy.image?.asset?.url ? [caseStudy.image.asset.url] : []
    }
  }
}

export default async function CaseStudyPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const caseStudy = await fetchCaseStudyBySlug({ slug })

  if (!caseStudy) {
    notFound()
  }

  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar'
  const title = getLocalizedText(caseStudy.title, supportedLocale, 'Case Study')
  const excerpt = getLocalizedText(caseStudy.excerpt, supportedLocale, '')
  const primaryAuthor = getPrimaryAuthor(caseStudy)
  const locationText = getStudyLocationText(caseStudy)
  const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      {/* Back button */}
      <Button variant="ghost" asChild>
        <Link href={`/${locale}/research-and-action/case-studies`} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Case Studies
        </Link>
      </Button>

      {/* Header */}
      <div className="space-y-4">
        {/* Featured badge */}
        {caseStudy.featured && (
          <Badge className="bg-yellow-500 text-black">
            ⭐ Featured Case Study
          </Badge>
        )}

        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>

        {excerpt && (
          <p className="text-xl text-muted-foreground">{excerpt}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {publishDate && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatCaseStudyDate(publishDate, supportedLocale)}</span>
            </div>
          )}

          {primaryAuthor && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>
                {primaryAuthor.name}
                {caseStudy.authors && caseStudy.authors.length > 1 && ` +${caseStudy.authors.length - 1} more`}
              </span>
            </div>
          )}

          {locationText && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{locationText}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {caseStudy.tags && caseStudy.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {caseStudy.tags.map((tag: any) => (
              <Badge
                key={tag._id}
                variant="outline"
                style={{
                  borderColor: tag.color,
                  color: tag.color
                }}
              >
                {getLocalizedText(tag.label, supportedLocale)}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Featured Image */}
      {caseStudy.image?.asset?.url && (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <Image
            src={urlFor(caseStudy.image).width(1200).height(675).url()}
            alt={caseStudy.image.alt || title}
            fill
            className="object-cover"
            priority
          />
          {caseStudy.image.caption && (
            <p className="text-sm text-muted-foreground mt-2 text-center italic">
              {caseStudy.image.caption}
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      {caseStudy.content && (
        <Card>
          <CardContent className="prose prose-lg max-w-none pt-6">
            <PortableText value={caseStudy.content} />
          </CardContent>
        </Card>
      )}

      {/* Study Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Authors */}
        {caseStudy.authors && caseStudy.authors.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Authors
              </h3>
              <div className="space-y-3">
                {caseStudy.authors.map((author: any, index: number) => (
                  <div key={index} className="space-y-1">
                    <p className="font-medium">{author.name}</p>
                    <p className="text-sm text-muted-foreground">{author.role}</p>
                    {author.affiliation?.name && (
                      <p className="text-sm text-muted-foreground">
                        {author.affiliation.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Organizations */}
        {caseStudy.organizations && caseStudy.organizations.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Organizations
              </h3>
              <div className="space-y-2">
                {caseStudy.organizations.map((org: any) => (
                  <p key={org._id} className="text-sm">
                    {org.name}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Study Period */}
      {caseStudy.studyPeriod && (caseStudy.studyPeriod.startDate || caseStudy.studyPeriod.endDate) && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">Study Period</h3>
            <p className="text-sm text-muted-foreground">
              {caseStudy.studyPeriod.startDate && new Date(caseStudy.studyPeriod.startDate).getFullYear()}
              {caseStudy.studyPeriod.endDate && ` - ${new Date(caseStudy.studyPeriod.endDate).getFullYear()}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
