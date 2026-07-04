export const revalidate = 300;

import type { Metadata } from "next"
import { notFound } from 'next/navigation'
//import { getTranslations } from 'next-intl/server'
import { SafeCoverImage } from '@/components/content/safe-cover-image'
import { fetchCaseStudyBySlug, fetchCaseStudiesStaticParams } from '@/sanity/queries/grid/grid-case-study'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar, Users, Building, MapPin, FolderKanban } from 'lucide-react'
import { BackLink } from '@/components/ui/back-link'
import { Link } from '@/i18n/navigation'
import { urlFor } from '@/sanity/lib/image'
import { getLocalizedText, formatCaseStudyDate, getPrimaryAuthor, getStudyLocationText } from '@/lib/case-study-utils'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { CommentIsland } from '@/components/comments/comment-island'
import { RelatedContent } from '@/components/content/related-content'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { heading } from '@/lib/design-tokens'
import { sortedTags, normalizeTagColor } from '@/lib/tags'

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
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
  const t = await getTranslations('caseStudies')
  const title = getLocalizedText(caseStudy.title, supportedLocale, 'Case Study')
  const excerpt = getLocalizedText(caseStudy.excerpt, supportedLocale, '')
  const primaryAuthor = getPrimaryAuthor(caseStudy)
  const locationText = getStudyLocationText(caseStudy)
  const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null

  // Detail layout archetype (WIREFRAMES §4.12). "story" = the centered reading
  // layout (default); "feature" leads with a bold split header; "report" adds a
  // sticky "At a glance" sidebar. All render the SAME content/blocks.
  const layout = (caseStudy.layout as 'story' | 'feature' | 'report') || 'story'

  return (
    <div className={cn("container py-8 space-y-8", layout === 'report' ? "max-w-5xl" : "max-w-4xl")} data-layout={layout}>
      {/* Back link */}
      <BackLink href="/research-and-action/case-studies" label={t('backToCaseStudies')} />

      {/* Header — Feature archetype renders a bold navy title panel; Story/Report
          use the standard header. */}
      <div className={cn("space-y-4", layout === 'feature' && "rounded-2xl bg-ccm-midnight p-8 text-white md:p-10")}>
        {/* Featured badge */}
        {caseStudy.featured && (
          <Badge className="bg-[var(--color-ccm-sky)]/30 text-[var(--color-ccm-sea)] border-0">
            {t('featuredBadge')}
          </Badge>
        )}

        <h1 className={cn("font-bold tracking-tight text-balance", heading('xl'), layout === 'feature' ? "text-white" : "text-ccm-midnight")}>{title}</h1>

        {excerpt && (
          <p className={cn("text-lg md:text-xl text-pretty", layout === 'feature' ? "text-white/80" : "text-muted-foreground")}>{excerpt}</p>
        )}

        {/* Metadata */}
        <div className={cn("flex flex-wrap gap-4 text-sm", layout === 'feature' ? "text-white/70" : "text-muted-foreground")}>
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

        {/* Tags — sorted + on-brand colours (L2 tag unification) */}
        {caseStudy.tags && caseStudy.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortedTags(caseStudy.tags, supportedLocale).map((tag: any) => {
              const color = normalizeTagColor(tag.color)
              return (
                <Badge key={tag._id} variant="outline" style={{ borderColor: color, color }}>
                  {getLocalizedText(tag.label, supportedLocale)}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Featured Image — resilient to a missing/404 CMS asset. */}
      {caseStudy.image?.asset?.url && (
        <figure>
          <SafeCoverImage
            src={urlFor(caseStudy.image).width(1200).height(675).url()}
            alt={caseStudy.image.alt || title}
          />
          {caseStudy.image.caption && (
            <figcaption className="text-sm text-muted-foreground mt-2 text-center italic">
              {caseStudy.image.caption}
            </figcaption>
          )}
        </figure>
      )}

      {/* Main Content — clean long-form article. The Report archetype pairs it
          with a sticky "At a glance" sidebar; Story/Feature center the column. */}
      {caseStudy.content && (
        layout === 'report' ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
            <article className="min-w-0 text-base md:text-lg leading-relaxed">
              <PortableTextRenderer value={caseStudy.content} locale={supportedLocale} isRTL={supportedLocale === 'ar'} />
            </article>
            <aside className="lg:sticky lg:top-24 rounded-xl border bg-muted/20 p-5 text-sm">
              <h3 className="mb-3 font-heading font-semibold text-ccm-midnight">{t('atAGlance')}</h3>
              <dl className="space-y-2">
                {publishDate && (
                  <div><dt className="text-muted-foreground">{t('published')}</dt><dd>{formatCaseStudyDate(publishDate, supportedLocale)}</dd></div>
                )}
                {primaryAuthor && (
                  <div><dt className="text-muted-foreground">{t('author')}</dt><dd>{primaryAuthor.name}</dd></div>
                )}
                {locationText && (
                  <div><dt className="text-muted-foreground">{t('location')}</dt><dd>{locationText}</dd></div>
                )}
                {caseStudy.organizations && caseStudy.organizations.length > 0 && (
                  <div><dt className="text-muted-foreground">{t('organizations')}</dt><dd>{caseStudy.organizations.map((o: any) => o.name).join(', ')}</dd></div>
                )}
              </dl>
            </aside>
          </div>
        ) : (
          <article className="mx-auto max-w-prose text-base md:text-lg leading-relaxed">
            <PortableTextRenderer value={caseStudy.content} locale={supportedLocale} isRTL={supportedLocale === 'ar'} />
          </article>
        )
      )}

      {/* Contributors — a quiet editorial colophon, not a card bubble. */}
      {((caseStudy.authors && caseStudy.authors.length > 0) ||
        (caseStudy.organizations && caseStudy.organizations.length > 0)) && (
        <section className="border-t border-border pt-5 text-start">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {t('writtenBy')}
          </p>
          {caseStudy.authors && caseStudy.authors.length > 0 && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {caseStudy.authors.map((author: any, index: number) => (
                <span key={index}>
                  {index > 0 && " · "}
                  <span className="font-bold text-foreground"><bdi>{author.name}</bdi></span>
                  {author.role && <span> ({author.role})</span>}
                  {author.affiliation?.name && <span>, <bdi>{author.affiliation.name}</bdi></span>}
                </span>
              ))}
            </p>
          )}
          {caseStudy.organizations && caseStudy.organizations.length > 0 && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('withOrgs')}{" "}
              {caseStudy.organizations.map((org: any, i: number) => (
                <span key={org._id}>
                  {i > 0 && " · "}
                  <bdi>{org.name}</bdi>
                </span>
              ))}
            </p>
          )}
        </section>
      )}

      {/* Study Details */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Produced by project(s) — provenance: the project(s) that output this. */}
        {caseStudy.projects && caseStudy.projects.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                {t('producedBy')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {caseStudy.projects.map((project: any) => (
                  <span
                    key={project._id}
                    className="inline-flex items-center rounded-full border border-ccm-sea/30 px-3 py-1 text-sm text-ccm-sea"
                  >
                    {project.name}
                  </span>
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

      {/* Related content — content-type-aware strip (lived experiences, news…) */}
      <RelatedContent
        items={caseStudy.relatedContent}
        locale={locale}
        heading={t('relatedContent')}
      />

      {/* Discussion — lazy, ISR-safe island */}
      {caseStudy._id && (
        <CommentIsland targetType="caseStudy" targetId={caseStudy._id} />
      )}
    </div>
  )
}
