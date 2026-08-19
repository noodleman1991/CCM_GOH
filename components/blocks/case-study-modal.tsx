"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Users, MapPin, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from 'next-intl';
import PortableTextRenderer from "@/components/portable-text-renderer";
import { getLocalizedText, formatCaseStudyDate, getPrimaryAuthor, getStudyLocationText } from "@/lib/case-study-utils";
import type { CaseStudy, LocalizedString } from "@/types/case-study";

/**
 * Minimal case-study shape actually consumed by this modal (and by the grid
 * card that opens it). The data comes from loosely-typed Sanity projections,
 * so only the fields rendered here are modeled.
 */
export interface CaseStudyModalData {
  _id?: string;
  title?: LocalizedString;
  excerpt?: LocalizedString;
  featured?: boolean | null;
  publishedAt?: string | null;
  topic?: string | null;
  status?: string | null;
  authors?: Array<{
    _id?: string;
    name?: string;
    role?: string;
    affiliation?: string | null;
  }> | null;
  tags?: Array<{
    _id?: string;
    label?: LocalizedString;
    color?: string | null;
  } | null> | null;
  image?: {
    asset?: { _id?: string; url?: string | null } | null;
    alt?: string | null;
    caption?: string | null;
  } | null;
  content?: Array<{ _type: string; _key?: string; [key: string]: unknown }> | null;
  studyPeriod?: { startDate?: string; endDate?: string } | null;
  organizations?: Array<{ _id?: string; name?: string | null }> | null;
  projects?: Array<{ _id?: string; name?: string | null }> | null;
  studyAreas?: string[] | null;
}

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudy: CaseStudyModalData;
  locale: string;
}

export function CaseStudyModal({ isOpen, onClose, caseStudy, locale }: CaseStudyModalProps) {
  const isRTL = locale === 'ar';
  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';
  const t = useTranslations('caseStudies');

  const title = getLocalizedText(caseStudy.title, supportedLocale, 'Case Study');
  const excerpt = getLocalizedText(caseStudy.excerpt, supportedLocale, '');
  // The shared utils are typed against the fuller CaseStudy interface but only
  // read fields present on CaseStudyModalData — bridge the type gap here.
  const primaryAuthor = getPrimaryAuthor(caseStudy as unknown as CaseStudy);
  const locationText = getStudyLocationText(caseStudy as unknown as CaseStudy);
  const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl",
          "h-[95vh]",
          "flex flex-col",
          "p-0",
          isRTL && "rtl"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Add DialogHeader with sr-only title for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title || "Case Study"}</DialogTitle>
        </DialogHeader>

        {/* Case Study Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            {/* Featured badge */}
            {caseStudy.featured && (
              <Badge className="bg-yellow-500 text-black">
                ⭐ Featured Case Study
              </Badge>
            )}

            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>

            {excerpt && (
              <p className="text-lg text-muted-foreground">{excerpt}</p>
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
                {caseStudy.tags.map((tag) => {
                  // Skip null or incomplete tags
                  if (!tag || !tag.color) return null;

                  return (
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
                  );
                })}
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
                sizes="(min-width: 1280px) 832px, 95vw"
              />
              {caseStudy.image.caption && (
                <p className="text-sm text-muted-foreground mt-2 text-center italic">
                  {caseStudy.image.caption}
                </p>
              )}
            </div>
          )}

          {/* Main Content - Full display */}
          {caseStudy.content && (
            <PortableTextRenderer
              value={caseStudy.content}
              locale={supportedLocale}
              isRTL={isRTL}
            />
          )}

          <Separator />

          {/* Study Metadata Section */}
          <div className="space-y-4">
            {/* Study Period */}
            {caseStudy.studyPeriod && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t('studyPeriod')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formatCaseStudyDate(new Date(caseStudy.studyPeriod.startDate ?? NaN), supportedLocale)}
                  {caseStudy.studyPeriod.endDate && (
                    <> – {formatCaseStudyDate(new Date(caseStudy.studyPeriod.endDate), supportedLocale)}</>
                  )}
                </p>
              </div>
            )}

            {/* Organizations */}
            {caseStudy.organizations && caseStudy.organizations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t('organizations')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.organizations.map((org) => (
                    <Badge key={org._id} variant="outline">
                      {org.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {caseStudy.projects && caseStudy.projects.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t('relatedProjects')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.projects.map((project) => (
                    <Badge key={project._id} variant="outline">
                      {project.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Study Areas */}
            {caseStudy.studyAreas && caseStudy.studyAreas.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t('studyAreas')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {caseStudy.studyAreas.map((area) => (
                    <Badge key={area} variant="secondary">
                      {area.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* All Authors */}
            {caseStudy.authors && caseStudy.authors.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t('allAuthors')}
                </h3>
                <div className="space-y-2">
                  {caseStudy.authors.map((author) => (
                    <div key={author._id} className="flex items-center gap-2">
                      <div className="text-sm">
                        <p className="font-medium">{author.name}</p>
                        {author.affiliation && (
                          <p className="text-muted-foreground">{author.affiliation}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link back to case studies listing */}
          <div className="flex justify-center pt-4 border-t">
            <Link href={`/${locale}/research-and-action/case-studies`}>
              <Button className="gap-2" variant="outline">
                {isRTL ? (
                  <>
                    {t('viewAll')}
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </>
                ) : (
                  <>
                    <ArrowLeft className="h-4 w-4" />
                    {t('viewAll')}
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
