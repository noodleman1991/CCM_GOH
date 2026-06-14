import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
  CarouselCounter,
} from "@/components/ui/carousel";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { cn } from "@/lib/utils";
import { PAGE_QUERYResult } from "@/sanity.types";
import { getLocalizedField } from "@/lib/localization-utils";

const CAROUSEL_SIZES = {
  one: "basis-full",
  two: "basis-full md:basis-1/2",
  three: "basis-full md:basis-1/2 lg:basis-1/3",
} as const;

// Aspect ratios scale predictably with the card width instead of jumping
// between arbitrary fixed heights (the old values shrank then grew across
// breakpoints, causing inconsistent cropping). Wider cards get a wider ratio.
const IMAGE_SIZES = {
  one: "aspect-video sm:aspect-[2/1]",
  two: "aspect-[4/3]",
  three: "aspect-[4/3]",
} as const;

// Honest `sizes` per carousel variant: the content area is capped at
// max-w-6xl (1152px); "one" is additionally capped at max-w-[35rem] (560px).
const SIZES_ATTR = {
  one: "(min-width: 560px) 560px, 100vw",
  two: "(min-width: 1152px) 576px, (min-width: 768px) 50vw, 100vw",
  three:
    "(min-width: 1152px) 384px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw",
} as const;

type CarouselSize = keyof typeof CAROUSEL_SIZES;

type Carousel1 = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "carousel-1" }
>;

interface Carousel1Props
  extends Omit<NonNullable<Carousel1>, "_type" | "_key"> {
  size: CarouselSize | null;
  indicators: "none" | "dots" | "count" | null;
  locale?: string;
}

export default function Carousel1({
  title,
  description,
  background,
  padding,
  colorVariant,
  size = "one",
  indicators = "none",
  images,
  locale = "en",
}: Carousel1Props) {
  const color = stegaClean(colorVariant);
  const stegaIndicators = stegaClean(indicators);
  const stegaSize = stegaClean(size) as CarouselSize;

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  const localizedTitle = typeof title === 'string'
    ? title
    : getLocalizedField(title, supportedLocale, '');

  const localizedDescription = typeof description === 'string'
    ? description
    : getLocalizedField(description, supportedLocale, '');

  return (
    <SectionContainer color={color} padding={padding} background={background as any}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6">
          {localizedTitle && (
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {localizedTitle}
              </h2>
              {localizedDescription && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {localizedDescription}
                </p>
              )}
            </div>
          )}
        {images && images.length > 0 && (
        <Carousel>
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem
                key={`${index}-${image.alt}`}
                className={CAROUSEL_SIZES[stegaSize]}
              >
                {image && (
                  <div
                    className={cn(
                      "relative mx-auto overflow-hidden rounded-2xl",
                      IMAGE_SIZES[stegaSize],
                      stegaSize === "one" ? "max-w-[35rem]" : undefined
                    )}
                  >
                    <Image
                      className="object-cover"
                      src={urlFor(image).url()}
                      alt={image.alt || ""}
                      fill
                      placeholder={
                        image?.asset?.metadata?.lqip ? "blur" : undefined
                      }
                      blurDataURL={image.asset?.metadata?.lqip || ""}
                      sizes={SIZES_ATTR[stegaSize]}
                    />
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="-start-3 md:-start-8 xl:-start-12"
          />
          <CarouselNext
            variant="secondary"
            className="-end-3 md:-end-8 xl:-end-12"
          />
          {stegaIndicators !== "none" && (
            <div className="w-full flex justify-center">
              {stegaIndicators === "dots" && <CarouselDots />}
              {stegaIndicators === "count" && <CarouselCounter />}
            </div>
          )}
        </Carousel>
        )}
        </div>
      </div>
    </SectionContainer>
  );
}
