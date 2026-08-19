// Server component for grid section headers with optional images
// NO "use client" directive - this is a server component

import Image from "next/image";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import Blocks from "@/components/blocks";
import { SectionHeader } from "@/components/ui/section-header";

type BlocksList = ComponentProps<typeof Blocks>["blocks"];

/** Minimal image shape the header actually reads (Sanity image projection). */
export interface GridSectionHeaderImage {
  asset?: { _id?: string; url?: string | null } | null;
  alt?: string | null;
}

interface GridSectionHeaderProps {
  title?: string;
  subtitle?: string;
  /** Portable-text-ish block array rendered through Blocks; shape varies by caller. */
  description?: readonly unknown[] | null;
  headerImage?: GridSectionHeaderImage | null;
  locale: string;
  isRTL?: boolean;
}

// Section header for page-builder grid rows (toolkits, impact-reports,
// all-outputs, agendas, community grids). Uses the shared SectionHeader so the
// vertical colour bar + title type match the rest of the app, while keeping the
// grid block's two extras: an optional portable-text description and an optional
// header image floated to the trailing side.
export function GridSectionHeader({
  title,
  subtitle,
  description,
  headerImage,
  locale,
  isRTL = false,
}: GridSectionHeaderProps) {
  const hasImage = headerImage?.asset;

  if (!title && !subtitle && !description && !hasImage) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-6 @content-md/page:mb-8",
        hasImage && "grid grid-cols-1 gap-6 @content-md/page:grid-cols-[1fr_auto] @content-md/page:items-center",
        isRTL && hasImage && "@content-md/page:grid-cols-[auto_1fr]"
      )}
    >
      {/* Text Content */}
      <div className={cn(isRTL && hasImage && "@content-md/page:order-2")}>
        {title && <SectionHeader title={title} subtitle={subtitle} />}
        {!title && subtitle && (
          <p className="text-base text-muted-foreground @content-md/page:text-lg">{subtitle}</p>
        )}
        {description && (
          <div className="mt-4">
            <Blocks blocks={description as BlocksList} locale={locale} />
          </div>
        )}
      </div>

      {/* Header Image */}
      {hasImage && (
        <div
          className={cn(
            "relative h-32 w-48 overflow-hidden rounded-lg @content-md/page:h-40 @content-md/page:w-56",
            isRTL && "@content-md/page:order-1"
          )}
        >
          <Image
            src={urlFor(headerImage).url()}
            alt={headerImage.alt || title || "Section header image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 192px, 224px"
          />
        </div>
      )}
    </div>
  );
}
