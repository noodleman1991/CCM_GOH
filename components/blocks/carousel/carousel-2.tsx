import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { urlForCropped } from "@/sanity/lib/image";
import { StarRating } from "@/components/ui/star-rating";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type Carousel2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "carousel-2" }
> & {
  locale?: string;
};

export default function Carousel2({
  title,
  description,
  padding,
  colorVariant,
  testimonial,
  locale = "en",
}: Carousel2Props) {
  const color = stegaClean(colorVariant);

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  const localizedTitle = typeof title === 'string'
    ? title
    : getLocalizedField(title, supportedLocale, '');

  const localizedDescription = typeof description === 'string'
    ? description
    : getLocalizedField(description, supportedLocale, '');

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-6 overflow-hidden">
          {localizedTitle && (
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl break-words">
                {localizedTitle}
              </h2>
              {localizedDescription && (
                <p className="mt-4 text-lg text-muted-foreground">
                  {localizedDescription}
                </p>
              )}
            </div>
          )}
        {testimonial && testimonial.length > 0 && (
        <Carousel>
          <CarouselContent>
            {testimonial.map((item) => {
              const it = item as any;
              const jobTitle = typeof it.title === 'string'
                ? it.title
                : getLocalizedField(it.title, supportedLocale, '');
              const quoteBody = Array.isArray(it.quote)
                ? it.quote
                : getLocalizedPortableText(it.quote, supportedLocale);
              return (
              <CarouselItem
                key={item._id}
                className="ps-2 md:ps-4 md:basis-1/2 lg:basis-1/3 min-w-0"
              >
                <Card className="h-full overflow-hidden">
                  <CardContent className="flex flex-col justify-between p-6 h-full">
                    <div>
                      <div className="flex items-center mb-2">
                        <Avatar className="w-10 h-10 me-3">
                          {item.image && (
                            <AvatarImage
                              src={urlForCropped(item.image, 80, 80).url()}
                              alt={item.name ?? ""}
                            />
                          )}
                          <AvatarFallback>
                            {item.name?.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-sm font-semibold">{item.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {jobTitle}
                          </p>
                          {(it.organization?.name || it.relatedCommunity?.name) && (
                            <p className="text-xs text-muted-foreground/80">
                              {it.organization?.name || it.relatedCommunity?.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <StarRating rating={item.rating ?? 0} />
                      {quoteBody && (
                        <div className="text-sm mt-2 line-clamp-4">
                          <PortableTextRenderer value={quoteBody} locale={locale} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="-start-3 md:-start-8 xl:-start-12"
          />
          <CarouselNext
            variant="secondary"
            className="-end-3 md:-end-8 xl:-end-12"
          />
          <div className="w-full flex justify-center">
            <CarouselDots />
          </div>
        </Carousel>
        )}
        </div>
      </div>
    </SectionContainer>
  );
}
