import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { PAGE_QUERYResult } from "@/sanity.types";
import { cn } from "@/lib/utils";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitImage = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-image" }
>;

export default function SplitImage({ image }: SplitImage) {
  return image && image.asset?._id ? (
    <div className="relative rounded-lg overflow-hidden aspect-[3/2] lg:aspect-[4/3] w-full max-w-full min-w-0">
      <Image
        src={urlFor(image).url()}
        alt={image.alt || ""}
        placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
        blurDataURL={image?.asset?.metadata?.lqip || ""}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
      />
    </div>
  ) : null;
}
