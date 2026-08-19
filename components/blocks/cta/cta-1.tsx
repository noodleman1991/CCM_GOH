import { cn } from "@/lib/utils";
import { SanityButton, type SanityLinkData } from "@/components/ui/sanity-button";
import { type BackgroundOptionType } from "@/types/background-option";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";
import { heading } from "@/lib/design-tokens";

type Cta1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "cta-1" }
> & {
  locale?: string;
};

export default function Cta1({
  padding,
  background,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  body,
  links,
  locale = "en",
}: Cta1Props) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

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
        <div
          className={cn(
            align === "center" ? "max-w-3xl text-center mx-auto" : undefined,
            isNarrow ? "max-w-3xl mx-auto" : undefined
          )}
        >
        <div>
          {localizedTagLine && (
            <p className="text-sm font-semibold text-ccm-water uppercase tracking-wider mb-3">
              {localizedTagLine}
            </p>
          )}
          <h2 className={cn('mb-4 font-bold font-heading text-balance text-ccm-midnight', heading('lg'))}>{localizedTitle}</h2>
          {localizedBody && (
            <div className="text-lg text-muted-foreground">
              <PortableTextRenderer value={localizedBody} locale={locale} />
            </div>
          )}
        </div>
        {links && links.length > 0 && (
          <div
            className={cn(
              "mt-10 flex flex-wrap gap-4",
              align === "center" ? "justify-center" : undefined
            )}
          >
            {links &&
              links.length > 0 &&
              links.map((link) => (
                <SanityButton key={link.title} link={link as SanityLinkData} locale={locale} />
              ))}
          </div>
        )}
        </div>
    </SectionContainer>
  );
}
