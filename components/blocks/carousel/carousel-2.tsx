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
import { urlFor } from "@/sanity/lib/image";
import { StarRating } from "@/components/ui/star-rating";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

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

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="flex flex-col space-y-6">
        {title && (
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            {description && (
              <p className="mt-4 text-lg text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {testimonial && testimonial.length > 0 && (
        <Carousel>
          <CarouselContent>
            {testimonial.map((item) => (
              <CarouselItem
                key={item._id}
                className="pl-2 md:pl-4 md:basis-1/3"
              >
                <Card className="h-full">
                  <CardContent className="flex flex-col justify-between p-4 h-full">
                    <div>
                      <div className="flex items-center mb-2">
                        <Avatar className="w-10 h-10 mr-3">
                          {item.image && (
                            <AvatarImage
                              src={urlFor(item.image).url()}
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
                            {item.title}
                          </p>
                          {((item as any).organization?.name || (item as any).relatedCommunity?.name) && (
                            <p className="text-xs text-muted-foreground/80">
                              {(item as any).organization?.name || (item as any).relatedCommunity?.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <StarRating rating={item.rating ?? 0} />
                      {item.body && (
                        <div className="text-sm mt-2 line-clamp-4">
                          <PortableTextRenderer value={item.body} locale={locale} />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="-left-3 md:-left-8 xl:-left-12"
          />
          <CarouselNext
            variant="secondary"
            className="-right-3 md:-right-8 xl:-right-12"
          />
          <div className="w-full flex justify-center">
            <CarouselDots />
          </div>
        </Carousel>
        )}
      </div>
    </SectionContainer>
  );
}
