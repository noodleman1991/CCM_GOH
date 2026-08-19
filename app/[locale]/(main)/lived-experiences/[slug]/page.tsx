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
import PortableTextRenderer from "@/components/portable-text-renderer";
import { JsonLd, articleJsonLd } from "@/lib/seo/json-ld";
import { FollowButton } from "@/components/follow/follow-button";

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
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [`${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/lived-experiences/${slug}/og.png`],
    },
  };
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

  type Tag = { _id: string; label?: Record<string, string> | string | null; color?: string };
  const visibleTags = (le.tags ?? []).filter(
    (tag: Tag) => tag?.label && tag.color && getLocalizedValue(tag.label, locale)
  );

  // Detail layout archetype (WIREFRAMES §4.12), mirroring the case-study page:
  // "story" = centered reading layout (default); "feature" leads with a bold
  // navy header panel; "report" adds a sticky "At a glance" aside.
  const layout = (le.layout as "story" | "feature" | "report") || "story";

  return (
    <div
      className={cn("container py-8 space-y-8", layout === "report" ? "max-w-5xl" : "max-w-4xl")}
      data-layout={layout}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <JsonLd
        data={articleJsonLd({
          title: title || "Lived experience",
          description: description || issue || undefined,
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/lived-experiences/${slug}`,
          datePublished: le.publishedAt ?? null,
          authorName: le.author?.name ?? null,
          inLanguage: locale,
        })}
      />
      <BackLink href="/lived-experiences" label={t("backToGallery")} />

      {/* Person header + title — the Feature archetype wraps both in a bold
          navy panel; Story/Report use the standard header. */}
      <div className={cn("space-y-8", layout === "feature" && "rounded-2xl bg-ccm-midnight p-8 md:p-10")}>
        {/* Person header — leads, dignity first (matches the modal voice) */}
        <header className="flex items-start gap-3">
          <Avatar className="size-12 flex-shrink-0">
            <AvatarFallback className="bg-ccm-sky/30 text-ccm-sea">
              <User className="size-6" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {le.author?.name && (
              <p className={cn("font-heading font-semibold", layout === "feature" ? "text-white" : "text-ccm-midnight")}>
                <bdi>{le.author.name}</bdi>
              </p>
            )}
            <p className={cn("text-sm", layout === "feature" ? "text-white/70" : "text-muted-foreground")}>
              {communityName && (
                <bdi className={layout === "feature" ? "text-ccm-sky" : "text-ccm-water"}>{communityName}</bdi>
              )}
              {communityName && le.author?.organizationalAffiliation && <span className="mx-1.5">·</span>}
              {le.author?.organizationalAffiliation && <bdi>{le.author.organizationalAffiliation}</bdi>}
            </p>
          </div>
        </header>

        {title && (
          <h1
            dir="auto"
            className={cn(
              "text-balance font-heading font-bold",
              layout === "feature" ? "text-white" : "text-ccm-midnight",
              heading("lg")
            )}
          >
            {title}
          </h1>
        )}

        {/* Follow the story's region — ISR-safe (self-resolving). */}
        {communityName && le.relatedCommunity?.slug?.current && (
          <FollowButton targetType="REGION" targetId={le.relatedCommunity.slug.current} />
        )}
      </div>

      {/* Media — format-aware (video/audio); written stories render no frame.
          Source-aware: YouTube/Vimeo consent-gated embeds or a natively played
          uploaded file (legacy docs derive the source from videoLink).
          Consent handled inside the player. */}
      {(le.videoLink || le.videoFileUrl) && le.format !== "written" && (
        <LivedExperiencePlayer
          url={le.videoLink}
          title={title || ""}
          locale={locale}
          format={le.format}
          videoSource={le.videoSource}
          fileUrl={le.videoFileUrl}
          posterUrl={le.thumbnail?.asset?.url}
        />
      )}

      {/* Story + body — the Report archetype pairs the text with a sticky
          "At a glance" aside; Story/Feature center the reading column. */}
      <div className={cn(layout === "report" && "grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start")}>
        <div className={cn("space-y-8", layout === "report" && "min-w-0")}>
          {/* Story — quiet noun label, the person's own framing */}
          {(issue || personContext || description) && (
            <section className={cn("space-y-3", layout === "report" ? "max-w-prose" : "mx-auto max-w-prose")}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ccm-sea">{t("storyLabel")}</p>
              {issue && <p className="text-base leading-relaxed text-foreground/90">{issue}</p>}
              {personContext && <p className="text-base leading-relaxed text-foreground/75">{personContext}</p>}
              {!issue && !personContext && description && (
                <p className="text-base leading-relaxed text-foreground/90">{description}</p>
              )}
            </section>
          )}

          {/* Long-form story body — blog-post feel: rich text + images with
              captions (shared styled-block-content renderer). */}
          {Array.isArray(le.body) && le.body.length > 0 && (
            <section className={cn(layout === "report" ? "max-w-prose" : "mx-auto max-w-prose")}>
              <PortableTextRenderer value={le.body} locale={locale} isRTL={isRTL} />
            </section>
          )}
        </div>

        {layout === "report" && (
          <aside className="lg:sticky lg:top-24 rounded-xl border bg-muted/20 p-5 text-sm">
            <h2 className="mb-3 font-heading font-semibold text-ccm-midnight">{t("atAGlance")}</h2>
            <dl className="space-y-2">
              {le.publishedAt && (
                <div>
                  <dt className="text-muted-foreground">{t("published")}</dt>
                  <dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(le.publishedAt))}</dd>
                </div>
              )}
              {le.author?.name && (
                <div>
                  <dt className="text-muted-foreground">{t("author")}</dt>
                  <dd><bdi>{le.author.name}</bdi></dd>
                </div>
              )}
              {communityName && (
                <div>
                  <dt className="text-muted-foreground">{t("community")}</dt>
                  <dd><bdi>{communityName}</bdi></dd>
                </div>
              )}
            </dl>
          </aside>
        )}
      </div>

      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag: Tag) => (
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
