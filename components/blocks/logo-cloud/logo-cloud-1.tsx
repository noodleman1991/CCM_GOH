"use client";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { Fragment } from "react";
import { motion } from "motion/react";
import { PAGE_QUERYResult } from "@/sanity.types";
import { getLocalizedField } from "@/lib/localization-utils";

type LogoCloud1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "logo-cloud-1" }
> & {
  locale?: string;
};

export default function LogoCloud1({
  padding,
  colorVariant,
  title,
  description,
  images,
  locale = "en",
}: LogoCloud1Props) {
  const color = stegaClean(colorVariant);

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  const localizedTitle = typeof title === 'string'
    ? title
    : getLocalizedField(title, supportedLocale, '');

  const localizedDescription = typeof description === 'string'
    ? description
    : getLocalizedField(description, supportedLocale, '');

  return (
    <SectionContainer
      color={color}
      padding={padding}
      className="overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {localizedTitle && (
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl animate-fade-up [animation-delay:100ms] opacity-0">
              {localizedTitle}
            </h2>
          )}
          {localizedDescription && (
            <p className="mt-4 text-lg text-muted-foreground animate-fade-up [animation-delay:200ms] opacity-0">
              {localizedDescription}
            </p>
          )}
        </div>
      </div>
      <div className="flex relative overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-10 before:bg-linear-to-r rtl:before:bg-linear-to-l before:from-background before:to-transparent before:content-[''] after:absolute after:right-0 after:top-0 after:h-full after:w-10 after:bg-linear-to-l rtl:after:bg-linear-to-r after:from-background after:to-transparent after:content-['']">
        <motion.div
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
          }}
          animate={{
            x: ["0%", "-50%"],
          }}
          className="flex w-max gap-24 pr-24"
        >
          {[...new Array(2)].map((_, arrayIndex) => (
            <Fragment key={arrayIndex}>
              {images?.map((image, index) => (
                <div
                  key={`${image.asset?._id}-${arrayIndex}-${index}`}
                  className="shrink-0 w-24 h-24 flex items-center justify-center"
                >
                  <Image
                    src={urlFor(image).url()}
                    alt={image.alt || ""}
                    priority={arrayIndex === 0 && index < 3}
                    placeholder={
                      image?.asset?.metadata?.lqip &&
                      image?.asset?.mimeType !== "image/svg+xml"
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
