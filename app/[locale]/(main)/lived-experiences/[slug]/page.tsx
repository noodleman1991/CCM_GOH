export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { User } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getLocalizedValue } from "@/i18n/i18n-helpers";
import { heading } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import {
  fetchLivedExperienceBySlug,
  fetchLivedExperienceSlugs,
} from "@/sanity/queries/lived-experience-detail";
import { LivedExperiencePlayer } from "@/components/lived-experiences/lived-experience-player";
import { CommentIsland } from "@/components/comments/comment-island";
import { RelatedContent } from "@/components/content/related-content";

export async function generateStaticParams() {
  const slugs = await fetchLivedExperienceSlugs();
  const locales = ["en", "es", "fr", "ar"];
  return locales.flatMap((locale) => slugs.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const le = await fetchLivedExperienceBySlug(slug);
  if (!le) return {};
  const title = getLocalizedValue(le.title, locale) || "Lived experience";
  const description = getLocalizedValue(le.description, locale) || getLocalizedValue(le.issue, locale) || "";
  return { title, description };
}

export default async function LivedExperiencePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const le = await fetchLivedExperienceBySlug(slug);
  if (!le) notFound();

  const t = await getTranslations("livedExperiences");
  const isRTL = locale === "ar";

  const title = getLocalizedValue(le.title, locale);
  const issue = getLocalizedValue(le.issue, locale);
  const personContext = getLocalizedValue(le.personContext, locale);
  const description = getLocalizedValue(le.description, locale);
  const communityName = le.relatedCommunity?.name ? getLocalizedValue(le.relatedCommunity.name, locale) : null;

  const visibleTags = (le.tags ?? []).filter(
    (tag: any) => tag?.label && tag.color && getLocalizedValue(tag.label, locale)
  );

  return (
    <div className="container max-w-4xl py-8 space-y-8" dir={isRTL ? "rtl" : "ltr"}>
      <BackLink href="/lived-experiences" label={t("backToGallery")} />

      {/* Person header — leads, dignity first (matches the modal voice) */}
      <header className="flex items-start gap-3">
        <Avatar className="size-12 flex-shrink-0">
          <AvatarFallback className="bg-ccm-sky/30 text-ccm-sea">
            <User className="size-6" aria-hidden="true" />
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          {le.author?.name && (
            <p className="font-heading font-semibold text-ccm-midnight">
              <bdi>{le.author.name}</bdi>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {communityName && <bdi className="text-ccm-water">{communityName}</bdi>}
            {communityName && le.author?.organizationalAffiliation && <span className="mx-1.5">·</span>}
            {le.author?.organizationalAffiliation && <bdi>{le.author.organizationalAffiliation}</bdi>}
          </p>
        </div>
      </header>

      {title && (
        <h1 className={cn("text-balance font-heading font-bold text-ccm-midnight", heading("lg"))}>
          {title}
        </h1>
      )}

      {/* Media — consent handled inside the player */}
      {le.videoLink && <LivedExperiencePlayer url={le.videoLink} title={title || ""} locale={locale} />}

      {/* Story — quiet noun label, the person's own framing */}
      {(issue || personContext || description) && (
        <section className="mx-auto max-w-prose space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ccm-sea">{t("storyLabel")}</p>
          {issue && <p className="text-base leading-relaxed text-foreground/90">{issue}</p>}
          {personContext && <p className="text-base leading-relaxed text-foreground/75">{personContext}</p>}
          {!issue && !personContext && description && (
            <p className="text-base leading-relaxed text-foreground/90">{description}</p>
          )}
        </section>
      )}

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag: any) => (
            <span
              key={tag._id}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
              style={{ borderColor: tag.color, color: tag.color, backgroundColor: `${tag.color}10` }}
            >
              {getLocalizedValue(tag.label, locale)}
            </span>
          ))}
        </div>
      )}

      {/* Related content — content-type-aware strip */}
      <RelatedContent items={le.relatedContent} locale={locale} heading={t('relatedContent')} />

      {/* Discussion */}
      {le._id && <CommentIsland targetType="livedExperience" targetId={le._id} />}
    </div>
  );
}
