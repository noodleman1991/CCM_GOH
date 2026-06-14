// Server component for grid section headers with optional images
// NO "use client" directive - this is a server component

import Image from "next/image";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import Blocks from "@/components/blocks";

interface GridSectionHeaderProps {
  title?: string;
  subtitle?: string;
  description?: any;
  headerImage?: any;
  locale: string;
  isRTL?: boolean;
}

export function GridSectionHeader({
  title,
  subtitle,
  description,
  headerImage,
  locale,
  isRTL = false,
}: GridSectionHeaderProps) {
  const hasImage = headerImage?.asset;

  // If no content, don't render
  if (!title && !subtitle && !description && !hasImage) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-8 md:mb-12",
        hasImage && "grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6",
        isRTL && hasImage && "md:grid-cols-[auto_1fr]"
      )}
    >
      {/* Text Content */}
      <div className={cn(isRTL && hasImage && "md:order-2")}>
        {title && (
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance break-words">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-2 text-lg text-muted-foreground break-words">{subtitle}</p>
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
