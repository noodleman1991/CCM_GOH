import { cn } from "@/lib/utils";
import { SanityButton, type SanityLinkData } from "@/components/ui/sanity-button";
import { type BackgroundOptionType } from "@/types/background-option";
import SectionContainer, { type SectionPadding } from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";
import { heading } from "@/lib/design-tokens";
import type { PortableTextBlock } from "@portabletext/types";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map —
 *  the shape `getLocalizedField` resolves. Matches the precedent already
 *  used for this exact pattern in lib/content/discovery.ts's LocalizedText. */
type LocalizedText = string | Record<string, string> | null;

interface Cta1Props {
  padding?: SectionPadding | null;
  background?: unknown;
  sectionWidth?: "default" | "narrow" | string | null;
  stackAlign?: "left" | "center" | string | null;
  tagLine?: LocalizedText;
  title?: LocalizedText;
  body?: PortableTextBlock[] | Record<string, unknown> | null;
  links?: SanityLinkData[] | null;
  locale?: string;
}

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
