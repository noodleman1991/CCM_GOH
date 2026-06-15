import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { stegaClean } from "next-sanity";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { urlForCropped } from "@/sanity/lib/image";
import { PAGE_QUERY_RESULT, ColorVariant } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type GridRow = Extract<Block, { _type: "grid-row" }>;
type GridColumn = NonNullable<NonNullable<GridRow["columns"]>>[number];
type GridCard = Extract<GridColumn, { _type: "grid-card" }>;

interface GridCardProps extends Omit<GridCard, "_type" | "_key"> {
  color?: string; //todo: what is the issue with colorVariant?
  cardVariant?: string;
  imageSizes?: string;
}

export default function GridCard({
  color,
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
          color === "primary"
            ? "group-hover:border-primary-foreground/50"
            : "group-hover:border-primary"
        )}
      >
        <div className="w-full min-w-0">
          {image && image.asset?._id && (
            <div className={cn("mb-4 relative rounded-2xl overflow-hidden w-full max-w-full", aspectRatioClass)}>
              <Image
                src={urlForCropped(image, 800, isWide ? 450 : 533).url()}
                alt={image.alt || ""}
                placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                blurDataURL={image?.asset?.metadata?.lqip || ""}
                fill
                sizes={imageSizes || "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
                className="object-cover"
              />
            </div>
          )}
          <div
            className={cn("break-words", color === "primary" ? "text-background" : undefined)}
          >
            {title && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-2xl break-words line-clamp-2">{title}</h3>
              </div>
            )}
            {excerpt && <p className="line-clamp-3">{excerpt}</p>}
          </div>
        </div>
        <Button
          className="mt-6"
          variant={stegaClean((link?.buttonVariant as any)?.variant)}
          size={stegaClean((link?.buttonVariant as any)?.size) || "lg"}
          stroke={stegaClean((link?.buttonVariant as any)?.stroke)}
          asChild
        >
          <div>{link?.title ?? t("learnMore")}</div>
        </Button>
      </div>
    </Link>
  );
}
