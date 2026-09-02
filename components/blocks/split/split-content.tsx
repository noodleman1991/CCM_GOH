import { cn } from "@/lib/utils";
import { heading } from "@/lib/design-tokens";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { SanityButton, type SanityLinkData } from "@/components/ui/sanity-button";
import { createElement } from "react";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";
import type { SectionPadding } from "@/components/ui/section-container";
import type { PortableTextBlock } from "@portabletext/types";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map —
 *  the shape `getLocalizedField` resolves. Matches the precedent already
 *  used for this exact pattern in lib/content/discovery.ts's LocalizedText. */
type LocalizedText = string | Record<string, string> | null;

interface SplitContentProps {
  sticky?: boolean;
  padding?: SectionPadding | null;
  tagLine?: LocalizedText;
  title?: LocalizedText;
  body?: PortableTextBlock[] | Record<string, unknown> | null;
  link?: SanityLinkData | null;
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
        padding?.top ? "pt-8 @content-lg/page:pt-12 @content-xl/page:pt-16" : undefined,
        padding?.bottom ? "pb-8 @content-lg/page:pb-12 @content-xl/page:pb-16" : undefined
      )}
    >
      <div
        className={cn(
          "flex flex-col items-start overflow-hidden",
          sticky ? "@content-lg/page:sticky @content-lg/page:top-56" : undefined,
          noGap ? "px-10" : undefined
        )}
      >
        {localizedTagLine && <p className="text-base font-semibold text-ccm-water uppercase tracking-wider break-words">{localizedTagLine}</p>}
        {localizedTitle &&
          createElement(
            "h2",
            {
              className: cn("my-4 font-bold font-heading text-ccm-midnight leading-[1.2] text-balance break-words", heading("lg")),
            },
            localizedTitle
          )}
        {localizedBody && (
          <div className="break-words w-full">
            <PortableTextRenderer value={localizedBody} locale={locale} />
          </div>
        )}
        {link?.href && (
          <div className="mt-6 flex flex-col">
            <SanityButton link={link as SanityLinkData} locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}
