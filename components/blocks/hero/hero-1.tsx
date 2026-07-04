import { SanityButton } from "@/components/ui/sanity-button";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { isRTL } from "@/i18n/i18n-helpers";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type Hero1BaseProps = Extract<
    NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
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
    const hasImage = Boolean(image && image.asset?._id);
    const supportedLocale = locale as 'en' | 'es' | 'fr' | 'ar';

    // Extract localized content
    const localizedTagLine = typeof tagLine === 'string'
        ? tagLine
        : getLocalizedField(tagLine, supportedLocale, '');

    const localizedTitle = typeof title === 'string'
        ? title
        : getLocalizedField(title, supportedLocale, '');

    const localizedBody = Array.isArray(body)
        ? body
        : getLocalizedPortableText(body, supportedLocale);

    return (
        <SectionContainer
            background={background as any}
            padding={padding}
            spacing="none"
            className="-mt-4 md:-mt-8 pt-2"
        >
            <div className={cn(
                "relative overflow-hidden grid grid-cols-1 gap-4 md:gap-6 lg:gap-8 items-center",
                hasImage && "lg:grid-cols-2"
            )}>
                {/* Decorative organic "blob" brand accent (redesign §1.5/§1.6).
                    Sits behind the content (-z-10) in the trailing corners so it
                    never overlaps the hero text. aria-hidden + pointer-events-none;
                    the slow morph only runs under `motion-safe`, so reduced-motion
                    users get a static shape. Logical inset (`end`/`start`) keeps it
                    correct in RTL, and the parent's overflow-hidden clips it at
                    375px so it can never cause horizontal scroll. */}
                <span
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute -z-10 -top-16 end-[-12%] blur-[2px]",
                        "h-40 w-40 sm:h-56 sm:w-56 lg:h-72 lg:w-72",
                        "bg-ccm-sky/30 motion-safe:animate-[ccmblob_18s_ease-in-out_infinite]"
                    )}
                    style={{ borderRadius: "58% 42% 55% 45% / 52% 48% 52% 48%" }}
                />
                <span
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute -z-10 hidden lg:block -bottom-20 start-[-8%] blur-[2px]",
                        "h-48 w-48 bg-ccm-sea/20 motion-safe:animate-[ccmblob_18s_ease-in-out_infinite]"
                    )}
                    style={{ borderRadius: "52% 48% 58% 42% / 55% 45% 52% 48%", animationDelay: "-6s" }}
                />
                <div className={cn(
                    "flex flex-col justify-center min-w-0 w-full",
                    // Without an image, center the text column and cap its width
                    // so it doesn't stretch awkwardly across the full container.
                    !hasImage && "max-w-3xl mx-auto text-center items-center",
                    hasImage && (rtl
                        ? isImageRight ? "lg:order-2" : "lg:order-1"
                        : isImageRight ? "lg:order-1" : "lg:order-2")
                )}>
                    {localizedTagLine && (
                        <p className="text-sm font-semibold text-ccm-water uppercase tracking-wider">
                            {localizedTagLine}
                        </p>
                    )}
                    {localizedTitle && (
                        <h1 className="mt-4 font-bold font-heading leading-tight text-balance text-pretty [overflow-wrap:anywhere] text-3xl md:text-4xl lg:text-5xl text-ccm-midnight">
                            {localizedTitle}
                        </h1>
                    )}
                    {localizedBody && (
                        <div className="text-base md:text-lg text-muted-foreground mt-5 max-w-prose">
                            <PortableTextRenderer value={localizedBody} locale={locale} />
                        </div>
                    )}
                    {links && links.length > 0 && (
                        <div className={cn(
                            "mt-8 flex flex-wrap gap-4",
                            !hasImage && "justify-center"
                        )}>
                            {links.map((link) => (
                                <SanityButton key={link.title} link={link as any} locale={locale} isRTL={rtl} />
                            ))}
                        </div>
                    )}
                </div>
                {hasImage && (
                    <div className={cn(
                        "flex flex-col justify-center min-w-0 w-full",
                        rtl
                            ? isImageRight ? "lg:order-1" : "lg:order-2"
                            : isImageRight ? "lg:order-2" : "lg:order-1"
                    )}>
                        <div className="relative mx-auto w-full max-w-[82%] min-w-0">
                            <Image
                                className="rounded-xl w-full h-auto object-contain"
                                src={urlFor(image!).width(1100).url()}
                                alt={image!.alt || ""}
                                width={image!.asset?.metadata?.dimensions?.width || 800}
                                height={image!.asset?.metadata?.dimensions?.height || 800}
                                placeholder={image!.asset?.metadata?.lqip ? "blur" : undefined}
                                blurDataURL={image!.asset?.metadata?.lqip || ""}
                                sizes="(min-width: 1152px) 576px, (min-width: 1024px) 50vw, 100vw"
                            />
                        </div>
                    </div>
                )}
            </div>
        </SectionContainer>
    );
}
