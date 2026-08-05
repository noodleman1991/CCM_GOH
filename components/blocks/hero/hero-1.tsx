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
            className="-mt-4 @content-md/page:-mt-8 pt-2"
        >
            <div className={cn(
                // Two-column split has an actual-viewport `md:` floor in addition to
                // the `@content-md/page` container query: the sidebar's fixed width
                // (17.625rem) eats enough of a real 768px viewport that the content
                // container itself never reaches the container-md threshold, which
                // left the hero stacked on tablets even though it "should" have gone
                // 2-up at content-md. The viewport floor guarantees text+illustration
                // sit side by side from md (768px) up regardless of sidebar state;
                // the container query still applies for narrower containers that
                // happen to be wide enough (e.g. collapsed sidebar) or embeds.
                //
                // 3:2 (not even halves): an even split wraps the headline into a
                // very tall single-word-per-line stack at tablet-narrow content
                // widths. Giving text the larger share keeps it readable at every
                // size the split is active, including full desktop widths — tested
                // at 768/1024/1440 — while the illustration stays comfortably sized.
                "relative overflow-hidden grid grid-cols-1 gap-4 @content-md/page:gap-6 @content-lg/page:gap-8 items-center",
                hasImage && "md:grid-cols-[3fr_2fr] @content-md/page:grid-cols-[3fr_2fr]"
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
                        "h-40 w-40 @content-sm/page:h-56 @content-sm/page:w-56 @content-lg/page:h-72 @content-lg/page:w-72",
                        "bg-ccm-sky/30 motion-safe:animate-[ccmblob_18s_ease-in-out_infinite]"
                    )}
                    style={{ borderRadius: "58% 42% 55% 45% / 52% 48% 52% 48%" }}
                />
                <span
                    aria-hidden="true"
                    className={cn(
                        "pointer-events-none absolute -z-10 hidden @content-lg/page:block -bottom-20 start-[-8%] blur-[2px]",
                        "h-48 w-48 bg-ccm-sea/20 motion-safe:animate-[ccmblob_18s_ease-in-out_infinite]"
                    )}
                    style={{ borderRadius: "52% 48% 58% 42% / 55% 45% 52% 48%", animationDelay: "-6s" }}
                />
                <div className={cn(
                    "flex flex-col justify-center min-w-0 w-full",
                    // Without an image, center the text column and cap its width
                    // so it doesn't stretch awkwardly across the full container.
                    !hasImage && "max-w-3xl mx-auto text-center items-center",
                    // Order flips at the same `md:` floor the grid actually goes
                    // 2-up (see the grid wrapper above), so an `imagePosition="left"`
                    // hero doesn't sit in the wrong column once columns appear.
                    hasImage && (rtl
                        ? isImageRight ? "md:order-2" : "md:order-1"
                        : isImageRight ? "md:order-1" : "md:order-2")
                )}>
                    {localizedTagLine && (
                        <p className="text-sm font-semibold text-ccm-water uppercase tracking-wider">
                            {localizedTagLine}
                        </p>
                    )}
                    {localizedTitle && (
                        <h1 className="mt-4 font-bold font-heading leading-tight text-balance text-pretty [overflow-wrap:anywhere] text-3xl @content-md/page:text-4xl @content-lg/page:text-5xl text-ccm-midnight">
                            {localizedTitle}
                        </h1>
                    )}
                    {localizedBody && (
                        <div className="text-base @content-md/page:text-lg text-muted-foreground mt-5 max-w-prose">
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
                            ? isImageRight ? "md:order-1" : "md:order-2"
                            : isImageRight ? "md:order-2" : "md:order-1"
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
