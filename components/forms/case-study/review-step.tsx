"use client";

import { useTranslations } from "next-intl";
import { FileText, MapPin, Send, Tag, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mainTheme } from "@/lib/case-studies/main-theme";
import type { CaseStudyValues } from "@/components/forms/case-study/values";
import type { CommunityOption } from "@/components/forms/case-study/where-section";

type TagOption = { _id: string; label: Record<string, string>; category?: string | null };

/** The preview step: what reviewers will see — the place by name, never coordinates. */
export function ReviewStep({
  values,
  locale,
  tags,
  communities,
  isSubmitting,
  onBack,
  onSubmit,
}: {
  values: CaseStudyValues;
  locale: string;
  tags: TagOption[];
  communities: CommunityOption[];
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations("caseStudySubmission");
  const lang = values.originalLanguage;
  const dir = lang === "ar" ? "rtl" : "ltr";
  const label = (tag: TagOption) => tag.label?.[locale] || tag.label?.en || tag._id;
  const chosen = values.tags.map((id) => tags.find((tag) => tag._id === id)).filter((tag): tag is TagOption => Boolean(tag));
  const theme = mainTheme(chosen);
  const community = communities.find((c) => c._id === values.relatedCommunity);
  const communityName = community ? community.name?.[locale] || community.name?.en || "" : "";
  const where = values.place?.text || communityName;
  const date = (value: string) => new Date(value).toLocaleDateString(locale);
  const { startDate, endDate } = values.studyPeriod;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{t("review.heading")}</h2>
          <p className="mt-1 text-muted-foreground">{t("review.subheading")}</p>
        </div>
        <Button variant="outline" className="min-h-11" onClick={onBack}>{t("review.goBack")}</Button>
      </div>

      {values.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- the uploaded cover, any host the upload route returns
        <img src={values.imageUrl} alt={t("hero.previewAlt")} className="h-52 w-full rounded-xl object-cover sm:h-64" />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="size-5" aria-hidden />{t("review.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("review.titleLabel")}</p>
            <p className="font-medium" dir={dir} lang={lang}>{values.title[lang]}</p>
          </div>
          {theme && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t("tags.main")}</p>
              <Badge variant="secondary"><bdi>{label(theme)}</bdi></Badge>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("review.descriptionLabel")}</p>
            <p className="text-sm" dir={dir} lang={lang}>{values.excerpt[lang]}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-5" aria-hidden />{t("review.authorsHeading", { count: values.authors.length })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {values.authors.map((author, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
              <div className="min-w-0">
                <p className="font-medium" dir="auto">{author.name}</p>
                {author.email && <p className="text-sm text-muted-foreground"><bdi>{author.email}</bdi></p>}
              </div>
              <Badge variant="outline">{t(`byline.roles.${author.role}`)}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Tag className="size-5" aria-hidden />{t("review.tagsCommunity")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {chosen.map((tag) => <Badge key={tag._id} variant="secondary"><bdi>{label(tag)}</bdi></Badge>)}
          </div>
          {communityName && <p className="text-sm text-muted-foreground">{t("review.community", { name: communityName })}</p>}
        </CardContent>
      </Card>

      {(where || startDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="size-5" aria-hidden />{t("review.context")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {where && <p className="text-sm" dir="auto">{t("review.location", { location: where })}</p>}
            {startDate && (
              <p className="text-sm">{t("review.period", { start: date(startDate), end: endDate ? date(endDate) : t("review.ongoing") })}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="flex flex-wrap justify-center gap-4">
        <Button variant="outline" className="min-h-11" onClick={onBack}>{t("review.goBack")}</Button>
        <Button size="lg" className="min-h-11 min-w-48" onClick={onSubmit} disabled={isSubmitting}>
          <Send className="me-2 size-4" aria-hidden />
          {t("review.confirmSubmit")}
        </Button>
      </div>
    </div>
  );
}
