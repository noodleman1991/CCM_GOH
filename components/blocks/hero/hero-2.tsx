import { SanityButton, type SanityLinkData } from "@/components/ui/sanity-button";
import { type BackgroundOptionType } from "@/types/background-option";
import { type SectionPadding } from "@/sanity.types";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { heading } from "@/lib/design-tokens";
import { isRTL } from "@/i18n/i18n-helpers";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "hero-2" }
> & {
  locale?: string;
};

export default function Hero2({ background, tagLine, title, body, links, padding, locale = "en" }: Hero2Props & { padding?: SectionPadding | null }) {
  const rtl = isRTL(locale);
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
    <SectionContainer background={background as BackgroundOptionType | null} padding={padding}>
      <div className="text-center">
      {localizedTagLine && (
        <p className="text-sm font-semibold text-ccm-water uppercase tracking-wider">
          {localizedTagLine}
        </p>
      )}
      {localizedTitle && (
        <h1 className={cn('mt-4 font-bold font-heading text-balance text-pretty break-words text-ccm-midnight', heading('xl'))}>
          {localizedTitle}
        </h1>
      )}
      {localizedBody && (
        <div className="text-base @content-md/page:text-lg text-muted-foreground mt-5 max-w-2xl mx-auto">
          <PortableTextRenderer value={localizedBody} locale={locale} />
        </div>
      )}
      {links && links.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {links.map((link) => (
            <SanityButton key={link.title} link={link as SanityLinkData} locale={locale} />
          ))}
        </div>
      )}
      </div>
    </SectionContainer>
  );
}
