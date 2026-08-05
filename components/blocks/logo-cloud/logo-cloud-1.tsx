"use client";
import SectionContainer from "@/components/ui/section-container";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { getLocalizedField } from "@/lib/localization-utils";
import { useTranslations } from "next-intl";
import { isRTL } from "@/i18n/i18n-helpers";
import { cn } from "@/lib/utils";
import { heading, gridGap } from "@/lib/design-tokens";

// The new fields (layout/motionSpeed + per-image label/orgType) aren't in the
// generated PAGE_QUERY types yet, so widen here.
type LogoCloud1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "logo-cloud-1" }
> & {
  locale?: string;
  layout?: "marquee" | "grid";
  motionSpeed?: "default" | "slow";
};

type LogoImage = {
  asset?: { _id?: string; mimeType?: string; metadata?: { lqip?: string; dimensions?: { width?: number; height?: number } } };
  alt?: string;
  label?: string;
  orgType?: string;
};

const TYPE_ORDER = [
  "ngo", "research", "university", "government",
  "international", "company", "community", "foundation", "other",
];

function LogoTile({ image, label }: { image: LogoImage; label?: string }) {
  return (
    <figure className="flex flex-col items-center justify-center gap-2 text-center">
      <div className="flex h-20 w-full items-center justify-center">
        <Image
          src={urlFor(image as never).url()}
          alt={image.alt || label || ""}
          className="max-h-20 w-auto object-contain"
          placeholder={
            image?.asset?.metadata?.lqip && image?.asset?.mimeType !== "image/svg+xml" ? "blur" : undefined
          }
          blurDataURL={image?.asset?.metadata?.lqip || ""}
          width={image.asset?.metadata?.dimensions?.width || 220}
          height={image?.asset?.metadata?.dimensions?.height || 90}
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 40vw"
        />
      </div>
      {label && <figcaption className="text-xs font-medium text-muted-foreground">{label}</figcaption>}
    </figure>
  );
}

export default function LogoCloud1({
  padding,
  title,
  description,
  images,
  locale = "en",
  layout = "marquee",
  motionSpeed = "default",
}: LogoCloud1Props) {
  const rtl = isRTL(locale);
  const prefersReducedMotion = useReducedMotion();
  const tTypes = useTranslations("organizations.types");

  const supportedLocale = (locale || "en") as "en" | "es" | "fr" | "ar";
  const localizedTitle =
    typeof title === "string" ? title : getLocalizedField(title, supportedLocale, "");
  const localizedDescription =
    typeof description === "string" ? description : getLocalizedField(description, supportedLocale, "");

  const imgs = (images as LogoImage[] | undefined) ?? [];
  const hasTypes = imgs.some((i) => i.orgType);

  const header = (
    <div className="mx-auto max-w-6xl px-4 @content-sm/page:px-6 @content-lg/page:px-8">
      <div className="mb-8 text-center">
        {localizedTitle && (
          <h2 className={cn("font-bold font-heading text-balance text-ccm-midnight", heading("md"))}>
            {localizedTitle}
          </h2>
        )}
        {localizedDescription && (
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground @content-md/page:text-lg">
            {localizedDescription}
          </p>
        )}
      </div>
    </div>
  );

  // GRID layout — calm, spacious, optionally grouped by institution type.
  if (layout === "grid") {
    const groups = hasTypes
      ? TYPE_ORDER.map((type) => ({ type, items: imgs.filter((i) => i.orgType === type) })).filter(
          (g) => g.items.length > 0
        )
      : [{ type: null as string | null, items: imgs }];

    return (
      <SectionContainer padding={padding}>
        {header}
        <div className="mx-auto max-w-6xl px-4 @content-sm/page:px-6 @content-lg/page:px-8">
          {groups.map((group) => (
            <div key={group.type ?? "all"} className="mb-10 last:mb-0">
              {group.type && (
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ccm-water">
                  {tTypes(group.type)}
                </h3>
              )}
              <div className={cn("grid grid-cols-2 @content-sm/page:grid-cols-3 @content-xl/page:grid-cols-4", gridGap("lg"))}>
                {group.items.map((image, index) => (
                  <LogoTile key={`${image.asset?._id}-${index}`} image={image} label={image.label} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionContainer>
    );
  }

  // MARQUEE layout (default) — scrolling strip, reduced-motion + speed aware.
  const duration = motionSpeed === "slow" ? 40 : 20;
  return (
    <SectionContainer padding={padding} className="overflow-hidden">
      {header}
      <div className="relative flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-10 before:bg-linear-to-r rtl:before:bg-linear-to-l before:from-background before:to-transparent before:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-10 after:bg-linear-to-l rtl:after:bg-linear-to-r after:from-background after:to-transparent after:content-['']">
        <motion.div
          transition={prefersReducedMotion ? undefined : { duration, ease: "linear", repeat: Infinity }}
          animate={prefersReducedMotion ? undefined : { x: rtl ? ["0%", "50%"] : ["0%", "-50%"] }}
          className="flex w-max gap-24 pe-24"
        >
          {[...new Array(2)].map((_, arrayIndex) => (
            <Fragment key={arrayIndex}>
              {imgs.map((image, index) => (
                <div
                  key={`${image.asset?._id}-${arrayIndex}-${index}`}
                  className="flex h-24 w-24 shrink-0 items-center justify-center"
                >
                  <Image
                    src={urlFor(image as never).url()}
                    alt={image.alt || image.label || ""}
                    className="max-h-24 w-auto object-contain"
                    priority={arrayIndex === 0 && index < 3}
                    placeholder={
                      image?.asset?.metadata?.lqip && image?.asset?.mimeType !== "image/svg+xml"
                        ? "blur"
                        : undefined
                    }
                    blurDataURL={image?.asset?.metadata?.lqip || ""}
                    width={image.asset?.metadata?.dimensions?.width || 220}
                    height={image?.asset?.metadata?.dimensions?.height || 90}
                    sizes="96px"
                  />
                </div>
              ))}
            </Fragment>
          ))}
        </motion.div>
      </div>
    </SectionContainer>
  );
}
