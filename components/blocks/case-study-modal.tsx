"use client";

import { Dialog, DialogContent, DialogClose, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ExternalLink, Calendar, Users, MapPin, ArrowLeft } from "lucide-react";
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

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudy: any;
  locale: string;
}

export function CaseStudyModal({ isOpen, onClose, caseStudy, locale }: CaseStudyModalProps) {
  const isRTL = locale === 'ar';
  const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';
  const t = useTranslations('caseStudies');

  const title = getLocalizedText(caseStudy.title, supportedLocale, 'Case Study');
  const excerpt = getLocalizedText(caseStudy.excerpt, supportedLocale, '');
  const primaryAuthor = getPrimaryAuthor(caseStudy);
  const locationText = getStudyLocationText(caseStudy);
  const publishDate = caseStudy.publishedAt ? new Date(caseStudy.publishedAt) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-4xl w-full max-h-[90vh] p-0 overflow-y-auto",
          isRTL && "rtl"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* Add DialogHeader with sr-only title for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title || "Case Study"}</DialogTitle>
        </DialogHeader>

        {/* Close Button - RTL aware */}
        <DialogClose
          className={cn(
            "absolute top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 bg-background p-2",
            isRTL ? "left-4" : "right-4"
          )}
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {/* Case Study Content */}
        <div className="p-8 space-y-6">
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
