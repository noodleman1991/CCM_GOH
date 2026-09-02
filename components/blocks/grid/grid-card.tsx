import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import { cleanText } from "@/lib/content/text";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { imageUrl } from "@/lib/content/images";
import type { SanityLinkData } from "@/components/ui/sanity-button";

interface GridCardImage {
  alt?: string | null;
  asset?: {
    _id?: string;
    metadata?: {
      lqip?: string | null;
      dimensions?: { width?: number | null; height?: number | null } | null;
    } | null;
  } | null;
}

interface GridCardProps {
  title?: string | null;
  excerpt?: string | null;
  image?: GridCardImage | null;
  link?: SanityLinkData | null;
  cardVariant?: string;
  imageSizes?: string;
}

type ButtonProps = ComponentProps<typeof Button>;

export default function GridCard({
  title,
  excerpt,
  image,
  link,
  cardVariant = "classic",
  imageSizes,
}: GridCardProps) {
  const t = useTranslations("blocks");
  const isWide = cardVariant === "wide";
  const aspectRatioClass = isWide ? "aspect-video" : "aspect-[3/2]";
  return (
    <Link
      key={title}
      className="flex w-full h-full rounded-3xl ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 group"
      href={link?.href ?? "#"}
      target={link?.target ? "_blank" : undefined}
    >
      <div
        className={cn(
          "flex w-full flex-col justify-between overflow-hidden transition ease-in-out border rounded-3xl p-6",
          "group-hover:border-primary"
        )}
      >
        <div className="w-full min-w-0">
          {image && image.asset?._id && (
            <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full", aspectRatioClass)}>
              <Image
                src={imageUrl(image, { width: 800, height: isWide ? 450 : 533, crop: true })}
                alt={image.alt || ""}
                placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                blurDataURL={image?.asset?.metadata?.lqip || ""}
                fill
                sizes={imageSizes || "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover"
              />
            </div>
          )}
          <div className="break-words">
            {title && (
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-2xl text-balance break-words line-clamp-3">{title}</h3>
              </div>
            )}
            {excerpt && <p className="line-clamp-4 break-words">{excerpt}</p>}
          </div>
        </div>
        <Button
          className="mt-6"
          variant={cleanText(link?.buttonVariant?.variant) as ButtonProps["variant"]}
          size={(cleanText(link?.buttonVariant?.size) || "default") as ButtonProps["size"]}
          stroke={cleanText(link?.buttonVariant?.stroke)}
          asChild
        >
          <div>{link?.title ?? t("learnMore")}</div>
        </Button>
      </div>
    </Link>
  );
}
