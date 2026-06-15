import Image from "next/image";
import { urlForCropped } from "@/sanity/lib/image";
import { PAGE_QUERY_RESULT } from "@/sanity.types";

type Block = NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImage = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image" }
>;

export default function SplitImage({ image }: SplitImage) {
  return image && image.asset?._id ? (
    // Fixed aspect + object-cover crops the image to a consistent shape;
    // urlForCropped respects the Sanity hotspot so the focal point stays in
    // frame. The parent split column centres this vertically against the text.
    <div className="relative w-full max-w-full min-w-0 overflow-hidden rounded-xl aspect-[3/2] lg:aspect-[4/3]">
      <Image
        src={urlForCropped(image, 1000, 750).url()}
        alt={image.alt || ""}
        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
        blurDataURL={image?.asset?.metadata?.lqip || ""}
        fill
        className="object-cover"
        sizes="(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 100vw"
      />
    </div>
  ) : null;
}
