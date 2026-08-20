import Link from "next/link";
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { getQueryMetadata, type QueryType } from "@/lib/dynamic-queries-types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsCard } from "@/components/ui/news-card";
import { CaseStudyCard } from "@/components/ui/case-study-card";
import { LivedExperienceCard } from "@/components/ui/lived-experience-card";

interface DynamicContentBlockProps {
  section: {
    queryType?: QueryType;
    displayStyle?: "grid" | "carousel" | "list" | "minimal";
    itemCount?: number;
    title?: string;
    subtitle?: string;
    showViewAllButton?: boolean;
    backgroundColor?: "none" | "light-gray" | "dark-gray" | "brand-primary" | "brand-secondary";
    padding?: "none" | "small" | "medium" | "large";
  };
  data: unknown[] | null;
  loading: boolean;
  error: string | null;
  locale: string;
  userId: string;
  communitySlug: string;
}

const backgroundClasses = {
  none: "",
  "light-gray": "bg-gray-50",
  "dark-gray": "bg-muted",
  "brand-primary": "bg-primary/5",
  "brand-secondary": "bg-secondary/5",
};

const paddingClasses = {
  none: "",
  small: "py-8",
  medium: "py-12",
  large: "py-16",
};

export function DynamicContentBlock({
  section,
  data,
  loading,
  error,
  locale,
  userId,
  communitySlug,
}: DynamicContentBlockProps) {
  const t = useTranslations("blocks");

  // Handle missing queryType
  if (!section.queryType) {
    return (
      <section className="w-full py-12">
        <div className="mx-auto max-w-7xl px-6 @content-lg/page:px-8">
          <div className="text-center">
            <p className="text-red-600">{t("errorLoadingContent", { error: t("noQueryType") })}</p>
          </div>
        </div>
      </section>
    );
  }

  const metadata = getQueryMetadata(section.queryType);
  const bgClass = backgroundClasses[section.backgroundColor || "none"];
  const paddingClass = paddingClasses[section.padding || "medium"];

  const sectionTitle = section.title || metadata.title;
  const sectionSubtitle = section.subtitle || metadata.description;

  if (error) {
    return (
      <section className={cn("w-full", bgClass, paddingClass)}>
        <div className="mx-auto max-w-7xl px-6 @content-lg/page:px-8">
          <div className="text-center">
            <p className="text-red-600">{t("errorLoadingContent", { error })}</p>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className={cn("w-full", bgClass, paddingClass)}>
        <div className="mx-auto max-w-7xl px-6 @content-lg/page:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className={getGridClasses(section.displayStyle || "grid")}>
            {Array.from({ length: section.itemCount || 6 }).map((_, i) => (
              <ContentSkeleton key={i} type={metadata.contentType} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.length === 0) {
    return (
      <section className={cn("w-full", bgClass, paddingClass)}>
        <div className="mx-auto max-w-7xl px-6 @content-lg/page:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
              {sectionTitle}
            </h2>
            <p className="text-muted-foreground">{t("noContent")}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full", bgClass, paddingClass)}>
      <div className="mx-auto max-w-7xl px-6 @content-lg/page:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-4">
            {sectionTitle}
          </h2>
          {sectionSubtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {sectionSubtitle}
            </p>
          )}
        </div>

        <div className={getGridClasses(section.displayStyle || "grid")}>
          {data.map((item, index) => (
            <ContentCard
              key={(item as { _id?: string })._id || index}
              item={item}
              type={metadata.contentType}
              displayStyle={section.displayStyle || "grid"}
              locale={locale}
              userId={userId}
            />
          ))}
        </div>

        {section.showViewAllButton && (
          <div className="text-center mt-12">
            <Button asChild variant="outline">
              <Link href={getViewAllUrl(metadata.contentType, communitySlug, locale)}>
                {t("viewAll")} {metadata.title}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function getGridClasses(displayStyle: string): string {
  switch (displayStyle) {
    case "grid":
      return "grid grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3 gap-8";
    case "carousel":
      return "flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory";
    case "list":
      return "space-y-6";
    case "minimal":
      return "grid grid-cols-1 @content-md/page:grid-cols-2 @content-xl/page:grid-cols-4 gap-4";
    default:
      return "grid grid-cols-1 @content-md/page:grid-cols-2 @content-lg/page:grid-cols-3 gap-8";
  }
}

function ContentCard({
  item,
  type,
  displayStyle,
  locale,
}: {
  item: unknown;
  type: string;
  displayStyle: string;
  locale: string;
  userId: string;
}) {
  const cardClasses = displayStyle === "carousel" ? "flex-none w-80 snap-start" : "";

  switch (type) {
    case "newsPost":
      return (
        <div className={cardClasses}>
          <NewsCard
            post={item as ComponentProps<typeof NewsCard>["post"]}
            locale={locale}
            variant={displayStyle === "minimal" ? "minimal" : "default"}
          />
        </div>
      );
    case "caseStudy":
      return (
        <div className={cardClasses}>
          <CaseStudyCard
            caseStudy={item as ComponentProps<typeof CaseStudyCard>["caseStudy"]}
            locale={locale}
            variant={displayStyle === "minimal" ? "minimal" : "default"}
          />
        </div>
      );
    case "livedExperience":
      return (
        <div className={cardClasses}>
          <LivedExperienceCard
            experience={item as ComponentProps<typeof LivedExperienceCard>["experience"]}
            locale={locale}
            variant={displayStyle === "minimal" ? "minimal" : "default"}
          />
        </div>
      );
    default:
      return null;
  }
}

function ContentSkeleton({ type }: { type: string }) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        {type === "livedExperience" && <Skeleton className="h-4 w-1/2" />}
      </div>
    </div>
  );
}

function getViewAllUrl(contentType: string, communitySlug: string, locale: string): string {
  const baseUrl = `/${locale}/communities/${communitySlug}`;

  switch (contentType) {
    case "newsPost":
      return `${baseUrl}/news`;
    case "caseStudy":
      return `${baseUrl}/case-studies`;
    case "livedExperience":
      return `${baseUrl}/lived-experiences`;
    default:
      return baseUrl;
  }
}