import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERY_RESULT } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImage = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image" }
>;

export default function SplitImage({ image }: SplitImage) {
  if (!image || !image.asset?._id) return null;

  // Render at the image's natural aspect ratio with object-contain so the WHOLE
  // image shows — these are stylised illustrations that must not be cropped by a
  // fixed-aspect cover. The parent split column centres it vertically.
  const dims = image.asset?.metadata?.dimensions;
  const width = dims?.width || 1000;
  const height = dims?.height || 750;

  return (
    <div className="relative mx-auto w-full max-w-[82%] min-w-0">
      <Image
        src={urlFor(image).width(1100).url()}
        alt={image.alt || ""}
        width={width}
        height={height}
        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
        blurDataURL={image?.asset?.metadata?.lqip || ""}
        className="h-auto w-full object-contain rounded-xl"
        sizes="(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 100vw"
      />
    </div>
  );
}
