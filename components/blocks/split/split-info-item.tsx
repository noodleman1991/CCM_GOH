"use client";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { imageUrl } from "@/lib/content/images";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { PortableTextBlock } from "@portabletext/types";

interface SplitInfoItemImage {
  alt?: string | null;
  asset?: {
    _id?: string;
    mimeType?: string | null;
    metadata?: {
      lqip?: string | null;
      dimensions?: { width?: number | null; height?: number | null } | null;
    } | null;
  } | null;
}

/** Fields one split-info-list entry carries. Exported so split-info-list.tsx
 *  (the array owner) can type its `list` prop against the same shape rather
 *  than redeclaring it. */
export interface SplitInfoItemFields {
  image?: SplitInfoItemImage | null;
  title?: string | null;
  body?: PortableTextBlock[] | null;
  tags?: string[] | null;
}

interface SplitInfoItemProps extends SplitInfoItemFields {
  locale?: string;
}

export default function SplitCardsItem({
  image,
  title,
  body,
  tags,
  locale = "en",
}: SplitInfoItemProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    amount: 1,
  });

  return (
    <motion.div
      ref={ref}
      className={cn(
        "border border-primary rounded-3xl px-6 @content-lg/page:px-8 py-6 @content-lg/page:py-8 transition-colors duration-1000 ease-in-out",
        isInView ? "bg-foreground/85" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 transition-colors duration-1000 ease-in-out",
          isInView ? "text-background" : "text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          {image && image.asset?._id && (
            <div className="shrink-0 w-10 h-10 flex items-center justify-center">
              <Image
                src={imageUrl(image)}
                alt={image.alt || ""}
                placeholder={
                  image?.asset?.metadata?.lqip &&
                  image?.asset?.mimeType !== "image/svg+xml"
                    ? "blur"
                    : undefined
                }
                blurDataURL={image?.asset?.metadata?.lqip || ""}
                width={image.asset?.metadata?.dimensions?.width || 40}
                height={image?.asset?.metadata?.dimensions?.height || 40}
              />
            </div>
          )}
          {title && (
            <div className="text-xl font-semibold leading-[1.1]">{title}</div>
          )}
        </div>
        {body && <PortableTextRenderer value={body} locale={locale} />}
      </div>
      {tags && (
        <div
          className={cn(
            "flex flex-wrap gap-3 mt-4 transition-colors duration-1000 ease-in-out",
            isInView ? "text-background" : "text-foreground"
          )}
        >
          {tags.map((tag) => (
            <Badge
              key={tag}
              className={cn(
                "transition-colors duration-1000 ease-in-out",
                isInView
                  ? "bg-background text-foreground"
                  : "bg-foreground text-background"
              )}
            >
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}
