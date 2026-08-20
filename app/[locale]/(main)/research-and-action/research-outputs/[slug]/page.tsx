export const revalidate = 300;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SafeCoverImage } from "@/components/content/safe-cover-image";
import { getTranslations } from "next-intl/server";
import { fetchResearchOutputBySlug, fetchResearchOutputsStaticParams } from "@/sanity/queries/research-output";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Building } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { urlFor } from "@/sanity/lib/image";
import { getLocalizedText } from "@/lib/case-study-utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { CommentIsland } from "@/components/comments/comment-island";
import { RelatedContent } from "@/components/content/related-content";
import { ResearchOutputVersions } from "@/components/content/research-output-versions";
import { cn } from "@/lib/utils";
import { heading } from "@/lib/design-tokens";
import { sortedTags, normalizeTagColor } from "@/lib/tags";
import type { LocalizedString, Organization } from "@/types/case-study";

export async function generateStaticParams() {
  const outputs = await fetchResearchOutputsStaticParams();
  const locales = ["en", "es", "fr", "ar"];
  return outputs.flatMap((o) => locales.map((locale) => ({ locale, slug: o.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const ro = await fetchResearchOutputBySlug({ slug });
  const t = await getTranslations({ locale, namespace: "researchOutputs" });
  if (!ro) return { title: t("metaNotFound") };
  const supportedLocale = locale as "en" | "es" | "fr" | "ar";
  const title = getLocalizedText(ro.title, supportedLocale, t("metaFallbackTitle"));
  const description = getLocalizedText(ro.excerpt, supportedLocale, "");
  return {
    title,
    description,
    openGraph: { title, description, type: "article", images: ro.image?.asset?.url ? [ro.image.asset.url] : [] },
  };
}

export default async function ResearchOutputPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const ro = await fetchResearchOutputBySlug({ slug });
  if (!ro) notFound();

  const supportedLocale = locale as "en" | "es" | "fr" | "ar";
  const t = await getTranslations("researchOutputs");
  const title = getLocalizedText(ro.title, supportedLocale, "Research Output");
  const excerpt = getLocalizedText(ro.excerpt, supportedLocale, "");
  const publishDate = ro.publishDate ? new Date(ro.publishDate) : null;
  const layout = (ro.layout as "story" | "feature" | "report") || "report";

  return (
    <div className={cn("container py-8 space-y-8", layout === "report" ? "max-w-5xl" : "max-w-4xl")} data-layout={layout}>
      <BackLink href="/research-and-action" label={t("backToResearch")} />

      {/* Header — feature archetype renders a bold navy panel. */}
      <div className={cn("space-y-4", layout === "feature" && "rounded-2xl bg-ccm-midnight p-8 text-white md:p-10")}>
        <div className="flex flex-wrap items-center gap-2">
          {ro.outputType && (
            <Badge className="bg-ccm-sky/30 text-ccm-sea border-0 capitalize">{ro.outputType.replace("-", " ")}</Badge>
          )}
          {ro.featured && <Badge className="bg-ccm-sky/30 text-ccm-sea border-0">{t("featured")}</Badge>}
        </div>

        <h1 dir="auto" className={cn("font-bold tracking-tight text-balance", heading("xl"), layout === "feature" ? "text-white" : "text-ccm-midnight")}>
          {title}
        </h1>

        {excerpt && (
          <p className={cn("text-lg md:text-xl text-pretty", layout === "feature" ? "text-white/80" : "text-muted-foreground")}>{excerpt}</p>
        )}

        <div className={cn("flex flex-wrap gap-4 text-sm", layout === "feature" ? "text-white/70" : "text-muted-foreground")}>
          {publishDate && (
            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>{publishDate.toLocaleDateString(supportedLocale, { year: "numeric", month: "long" })}</span>
            </div>
          )}
          {ro.organizations?.length > 0 && (
            <div className="flex items-center gap-1">
              <Building className="size-4" />
              <span>{ro.organizations.map((o: Organization) => o.name).join(", ")}</span>
            </div>
          )}
        </div>

        {ro.tags && ro.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortedTags(ro.tags, supportedLocale).map((tag) => {
              const color = normalizeTagColor(tag.color);
              return (
                <Badge key={tag._id} variant="outline" style={{ borderColor: color, color }}>
                  {getLocalizedText(tag.label as LocalizedString | undefined, supportedLocale)}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

      {/* Cover image */}
      {ro.image?.asset?.url && (
        <SafeCoverImage src={urlFor(ro.image).width(1200).height(675).url()} alt={ro.image.alt || title} />
      )}

      {/* Documents (version × language switcher) */}
      <ResearchOutputVersions versions={ro.versions || []} />

      {/* In-hub body, archetype-aware (Report = sticky "At a glance" sidebar). */}
      {ro.content && (
        layout === "report" ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_280px] lg:items-start">
            <article className="min-w-0 text-base md:text-lg leading-relaxed">
              <PortableTextRenderer value={ro.content} locale={supportedLocale} isRTL={supportedLocale === "ar"} />
            </article>
            <aside className="rounded-xl border bg-muted/20 p-5 text-sm lg:sticky lg:top-24">
              <h3 className="mb-3 font-heading font-semibold text-ccm-midnight">{t("atAGlance")}</h3>
              <dl className="space-y-2">
                {ro.outputType && (
                  <div><dt className="text-muted-foreground">{t("type")}</dt><dd className="capitalize">{ro.outputType.replace("-", " ")}</dd></div>
                )}
                {publishDate && (
                  <div><dt className="text-muted-foreground">{t("published")}</dt><dd>{publishDate.getFullYear()}</dd></div>
                )}
                {ro.organizations && ro.organizations.length > 0 && (
                  <div><dt className="text-muted-foreground">{t("organizations")}</dt><dd>{ro.organizations.map((o: Organization) => o.name).join(", ")}</dd></div>
                )}
              </dl>
            </aside>
          </div>
        ) : (
          <article className="mx-auto max-w-prose text-base md:text-lg leading-relaxed">
            <PortableTextRenderer value={ro.content} locale={supportedLocale} isRTL={supportedLocale === "ar"} />
          </article>
        )
      )}

      {/* Related content + discussion */}
      <RelatedContent items={ro.relatedContent} locale={locale} heading={t("relatedContent")} />
      {ro._id && <CommentIsland targetType="researchOutput" targetId={ro._id} />}
    </div>
  );
}
