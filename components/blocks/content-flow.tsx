"use client";

import { useEffect, useState } from "react";
import type { QueryType } from "@/lib/dynamic-queries-types";
import { fetchDynamicContent } from "@/lib/dynamic-queries-client";
// Remove Blocks import - handle server components in parent
import { ManualContentBlock } from "./inserts/manual-content-block";
import { DynamicContentBlock } from "./inserts/dynamic-content-block";
import { SeparatorBlock } from "./inserts/separator-block";

interface ContentFlowProps {
  sections: ContentSection[];
  locale: string;
  userId: string;
  communitySlug: string;
}

interface ContentSection {
  _type: string;
  _key: string;
  // Dynamic content insert specific properties
  queryType?: "recentNews" | "recentCaseStudies" | "recentLivedExperiences" | "featuredNews" | "featuredCaseStudies" | "featuredLivedExperiences";
  displayStyle?: "grid" | "carousel" | "list" | "minimal";
  itemCount?: number;
  title?: string;
  subtitle?: string;
  showViewAllButton?: boolean;
  backgroundColor?: "none" | "light-gray" | "dark-gray" | "brand-primary" | "brand-secondary";
  padding?: "none" | "small" | "medium" | "large";
  // Manual content insert properties
  content?: unknown[];
  image?: unknown;
  layout?: "left-image" | "right-image" | "full-width" | "content-above" | "image-above";
  // Other block properties
  [key: string]: unknown;
}

export default function ContentFlow({ sections, locale, userId, communitySlug }: ContentFlowProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="content-flow">
      {sections.map((section: ContentSection, index: number) => (
        <ContentSection
          key={section._key || `section-${index}`}
          section={section}
          locale={locale}
          userId={userId}
          communitySlug={communitySlug}
        />
      ))}
    </div>
  );
}

interface ContentSectionProps {
  section: ContentSection;
  locale: string;
  userId: string;
  communitySlug: string;
}

function ContentSection({ section, locale, userId, communitySlug }: ContentSectionProps) {
  const [dynamicData, setDynamicData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (section._type === "dynamicContentInsert") {
      const params = {
        communitySlug,
        count: section.itemCount || 6,
      };

      if (!section.queryType) {
        setError("No query type specified");
        return;
      }

      setLoading(true);
      setError(null);

      fetchDynamicContent(section.queryType as QueryType, params)
        .then((data) => {
          setDynamicData(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error loading dynamic content:", err);
          setError("Failed to load content");
          setLoading(false);
        });
    }
  }, [section, communitySlug]);

  // Handle different section types
  switch (section._type) {
    case "manualContentInsert":
      return (
        <ManualContentBlock
          title={section.title}
          content={section.content}
          image={section.image as any}
          layout={section.layout as "left-image" | "right-image" | "full-width" | "content-above" | "image-above"}
          backgroundColor={section.backgroundColor as "none" | "light-gray" | "dark-gray" | "brand-primary" | "brand-secondary"}
          padding={section.padding as "none" | "small" | "medium" | "large"}
          locale={locale}
          key={section._key}
        />
      );

    case "dynamicContentInsert":
      return (
        <DynamicContentBlock
          section={section}
          data={dynamicData}
          loading={loading}
          error={error}
          locale={locale}
          userId={userId}
          communitySlug={communitySlug}
          key={section._key}
        />
      );

    case "separatorBlock":
      return (
        <SeparatorBlock
          {...section}
          key={section._key}
        />
      );

    // Handle existing block types - these should be rendered by parent server component
    case "hero-1":
    case "hero-2":
    case "section-header":
    case "split-row":
    case "grid-row":
    case "carousel-1":
    case "carousel-2":
    case "lived-experiences-carousel":
    case "timeline-row":
    case "cta-1":
    case "logo-cloud-1":
    case "faqs":
    case "form-newsletter":
    case "all-posts":
      // These blocks contain server-only code and should be handled by the parent server component
      console.warn(`Server block type ${section._type} should be rendered by parent server component`);
      return null;

    default:
      console.warn(`Unknown section type: ${section._type}`);
      return null;
  }
}