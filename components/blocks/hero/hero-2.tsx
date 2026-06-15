import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { isRTL } from "@/i18n/i18n-helpers";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "hero-2" }
> & {
  locale?: string;
};

export default function Hero2({ background, tagLine, title, body, links, padding, locale = "en" }: Hero2Props & { padding?: any }) {
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
    <SectionContainer background={background as any} padding={padding}>
      <div className="text-center">
      {localizedTagLine && (
        <p className="text-base font-semibold text-ccm-water uppercase tracking-wider animate-fade-up [animation-delay:100ms] opacity-0">
          {localizedTagLine}
        </p>
      )}
      {localizedTitle && (
        <h1 className="mt-6 font-bold font-heading leading-[1.1] text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-ccm-midnight animate-fade-up [animation-delay:200ms] opacity-0">
          {localizedTitle}
        </h1>
      )}
      {localizedBody && (
        <div className="text-lg mt-6 max-w-2xl mx-auto animate-fade-up [animation-delay:300ms] opacity-0">
          <PortableTextRenderer value={localizedBody} locale={locale} />
        </div>
      )}
      {links && links.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms] opacity-0">
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
    </SectionContainer>
  );
}
