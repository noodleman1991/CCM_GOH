import { cn } from "@/lib/utils";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createElement } from "react";
import { stegaClean } from "next-sanity";
import { PAGE_QUERYResult } from "@/sanity.types";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type Block = NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number];
type SplitRow = Extract<Block, { _type: "split-row" }>;
type SplitContent = Extract<
  NonNullable<SplitRow["splitColumns"]>[number],
  { _type: "split-content" }
>;

interface SplitContentProps extends SplitContent {
  noGap?: boolean;
  locale?: string;
}

export default function SplitContent({
  sticky,
  padding,
  noGap,
  tagLine,
  title,
  body,
  link,
  locale = "en",
}: SplitContentProps) {
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
    <div
      className={cn(
        !sticky ? "flex flex-col justify-center" : undefined,
        padding?.top ? "pt-8 lg:pt-12 xl:pt-16" : undefined,
        padding?.bottom ? "pb-8 lg:pb-12 xl:pb-16" : undefined
      )}
    >
      <div
        className={cn(
          "flex flex-col items-start overflow-hidden",
          sticky ? "lg:sticky lg:top-56" : undefined,
          noGap ? "px-10" : undefined
        )}
      >
        {localizedTagLine && <p className="text-base font-semibold break-words">{localizedTagLine}</p>}
        {localizedTitle &&
          createElement(
            "h2",
            {
              className: cn("my-4 font-semibold leading-[1.2] break-words"),
            },
            localizedTitle
          )}
        {localizedBody && (
          <div className="break-words w-full">
            <PortableTextRenderer value={localizedBody} locale={locale} />
          </div>
        )}
        {link?.href && (
          <div className="flex flex-col">
            <Button
              className="mt-6"
              variant={stegaClean((link?.buttonVariant as any)?.variant)}
              size={stegaClean((link?.buttonVariant as any)?.size) || "lg"}
              stroke={stegaClean((link?.buttonVariant as any)?.stroke)}
              asChild
            >
              <Link
                href={link.href}
                target={link.target ? "_blank" : undefined}
              >
                {link.title}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
