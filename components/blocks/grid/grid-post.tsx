import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { urlForCropped } from "@/sanity/lib/image";
import { ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PAGE_QUERY_RESULT } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>>[number];
type GridPost = Extract<GridColumn, { _type: "grid-post" }>;

interface NewsPost {
  _id: string;
  title?: { [key: string]: string };
  subtitle?: { [key: string]: string };
  slug?: { current: string };
  image?: {
    asset?: {
      _id: string;
      metadata?: {
        lqip?: string;
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string;
  };
  publishedAt?: string;
  tags?: Array<{
    _id: string;
    label?: { [key: string]: string };
  }>;
}

interface GridPostProps {
  newsPost?: NewsPost;
  featured?: boolean;
  locale?: string;
  userId?: string;
  imageSizes?: string;
}

export default function GridPost({ newsPost, featured, locale = "en", userId, imageSizes }: GridPostProps) {
  // Server component: useTranslations resolves from the request config, no
  // NextIntlClientProvider needed. Called before the early return to satisfy
  // the rules-of-hooks lint.
  const t = useTranslations("common");
  const tBlocks = useTranslations("blocks");

  if (!newsPost) return null;

  const { title, slug, subtitle, image, publishedAt, tags } = newsPost;

  // Get localized content
  const localizedTitle = title?.[locale as keyof typeof title] || title?.en || t("untitled");
  const localizedSubtitle = subtitle?.[locale as keyof typeof subtitle] || subtitle?.en;

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(locale === "ar" ? "ar-EG" : locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Link
      className={cn(
        "flex w-full h-full rounded-3xl ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group",
        "transition-all duration-200 hover:scale-[1.02]"
      )}
      href={`/news/${slug?.current}`}
    >
      <article
        className={cn(
          "relative flex w-full flex-col h-full overflow-hidden transition ease-in-out group border rounded-2xl p-4 @content-sm/page:p-5 @content-lg/page:p-6 hover:border-primary hover:shadow-lg bg-card",
          featured && "ring-2 ring-yellow-500/20 border-yellow-500/30"
        )}
      >
        {/* Featured badge */}
        {featured && (
          <div className="absolute top-4 end-4 z-10">
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              {tBlocks("featured")}
            </Badge>
          </div>
        )}

        <div className="flex flex-col flex-1">
          {/* Image */}
          {image && image.asset?._id && (
            <div className="mb-3 @content-sm/page:mb-4 relative aspect-[3/2] w-full rounded-xl overflow-hidden">
              <Image
                src={urlForCropped(image, 800, 533).url()}
                alt={image.alt || localizedTitle}
                placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                blurDataURL={image?.asset?.metadata?.lqip || ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes={imageSizes || "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
                quality={85}
              />
            </div>
          )}

          {/* Title */}
          <div className="mb-2 @content-sm/page:mb-3">
            <h3 dir="auto" className="font-bold text-lg @content-sm/page:text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {localizedTitle}
            </h3>
          </div>

          {/* Subtitle */}
          {localizedSubtitle && (
            <p className="text-foreground text-sm leading-relaxed mb-2 @content-sm/page:mb-3 line-clamp-2">
              {localizedSubtitle}
            </p>
          )}

          {/* Date */}
          {publishedAt && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs @content-sm/page:text-sm mb-2 @content-sm/page:mb-3">
              <Calendar size={12} className="@content-sm/page:w-4 @content-sm/page:h-4" />
              <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
            </div>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 @content-sm/page:gap-2 mb-3 @content-sm/page:mb-4">
              {tags.slice(0, 2).map((tag) => {
                const tagLabel = tag.label?.[locale as keyof typeof tag.label] || tag.label?.en || "Tag";
                return (
                  <Badge key={tag._id} variant="outline" className="text-xs px-2 py-1">
                    {tagLabel}
                  </Badge>
                );
              })}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Read more arrow */}
        <div className="mt-auto pt-2 @content-sm/page:pt-3">
          <div className="w-8 h-8 @content-sm/page:w-10 @content-sm/page:h-10 border rounded-full flex items-center justify-center group-hover:border-primary group-hover:bg-primary/5 transition-all duration-200">
            <ChevronRight
              className="text-muted-foreground group-hover:text-primary transition-colors"
              size={16}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}
