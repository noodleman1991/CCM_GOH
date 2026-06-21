// Server component for grid section headers with optional images
// NO "use client" directive - this is a server component

import Image from "next/image";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import Blocks from "@/components/blocks";
import { SectionHeader } from "@/components/ui/section-header";

interface GridSectionHeaderProps {
  title?: string;
  subtitle?: string;
  description?: any;
  headerImage?: any;
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
        "mb-6 md:mb-8",
        hasImage && "grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto] md:items-center",
        isRTL && hasImage && "md:grid-cols-[auto_1fr]"
      )}
    >
      {/* Text Content */}
      <div className={cn(isRTL && hasImage && "md:order-2")}>
        {title && <SectionHeader title={title} subtitle={subtitle} />}
        {!title && subtitle && (
          <p className="text-base text-muted-foreground md:text-lg">{subtitle}</p>
        )}
        {description && (
          <div className="mt-4">
            <Blocks blocks={description} locale={locale} />
          </div>
        )}
      </div>

      {/* Header Image */}
      {hasImage && (
        <div
          className={cn(
            "relative h-32 w-48 overflow-hidden rounded-lg md:h-40 md:w-56",
            isRTL && "md:order-1"
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
