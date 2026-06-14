import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import { getLocalizedField, getLocalizedPortableText } from "@/lib/localization-utils";
import { heading } from "@/lib/design-tokens";

type Cta1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
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
    <SectionContainer background={background as any} padding={padding}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
            isNarrow ? "max-w-[48rem] mx-auto" : undefined
          )}
        >
        <div>
          {localizedTagLine && (
            <p className="text-base font-semibold text-ccm-water uppercase tracking-wider mb-4">
              {localizedTagLine}
            </p>
          )}
          <h2 className={cn('mb-4 font-bold font-heading text-balance text-ccm-midnight', heading('lg'))}>{localizedTitle}</h2>
          {localizedBody && <PortableTextRenderer value={localizedBody} locale={locale} />}
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
      </div>
    </SectionContainer>
  );
}
