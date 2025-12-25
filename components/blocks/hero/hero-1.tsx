import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { isRTL } from "@/i18n/i18n-helpers";

type Hero1BaseProps = Extract<
    NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
    { _type: "hero-1" }
>;

type Hero1Props = Omit<Hero1BaseProps, 'imagePosition'> & {
    locale?: string;
    padding?: any;
    imagePosition?: "left" | "right" | string | null;
};

export default function Hero1({
                                  background,
                                  tagLine,
                                  title,
                                  body,
                                  image,
                                  links,
                                  padding,
                                  imagePosition = "right",
                                  locale = "en",
                              }: Hero1Props) {
    const rtl = isRTL(locale);
    const isImageRight = imagePosition === "right" || imagePosition === null;

    return (
        <SectionContainer background={background} padding={padding}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
                <div className={cn(
                    "flex flex-col justify-start min-w-0 w-full",
                    rtl
                        ? isImageRight ? "lg:order-1" : "lg:order-2"
                        : isImageRight ? "lg:order-1" : "lg:order-2"
                )}>
                    {tagLine && (
                        <p className="text-base font-semibold font-sans animate-fade-up [animation-delay:100ms] opacity-0">
                            {tagLine}
                        </p>
                    )}
                    {title && (
                        <h3 className="mt-6 font-bold leading-[1.1] text-2xl md:text-4xl lg:text-5xl animate-fade-up [animation-delay:200ms] opacity-0">
                            {title}
                        </h3>
                    )}
                    {body && (
                        <div className="text-lg mt-6 animate-fade-up [animation-delay:300ms] opacity-0">
                            <PortableTextRenderer value={body} locale={locale} />
                        </div>
                    )}
                    {links && links.length > 0 && (
                        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up [animation-delay:400ms] opacity-0">
                            {links.map((link) => (
                                <Button
                                    key={link.title}
                                    variant={stegaClean((link?.buttonVariant as any)?.variant)}
                                    size={stegaClean((link?.buttonVariant as any)?.size) || "lg"}
                                    stroke={stegaClean((link?.buttonVariant as any)?.stroke)}
                                    asChild
                                >
                                    <Link
                                        href={link.href as string}
                                        target={link.target ? "_blank" : undefined}
                                        rel={link.target ? "noopener" : undefined}
                                    >
                                        {link.title}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
                <div className={cn(
                    "flex flex-col justify-center min-w-0 w-full",
                    rtl
                        ? isImageRight ? "lg:order-2" : "lg:order-1"
                        : isImageRight ? "lg:order-2" : "lg:order-1"
                )}>
                    {image && image.asset?._id && (
                        <div className="relative w-full max-w-full overflow-hidden min-w-0">
                            <Image
                                className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0 w-full h-auto object-cover max-w-full"
                                src={urlFor(image).url()}
                                alt={image.alt || ""}
                                width={image.asset?.metadata?.dimensions?.width || 800}
                                height={image.asset?.metadata?.dimensions?.height || 800}
                                placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
                                blurDataURL={image?.asset?.metadata?.lqip || ""}
                                quality={100}
                                style={{ maxWidth: "100%", height: "auto" }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </SectionContainer>
    );
}
