import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import SectionContainer from "@/components/ui/section-container";
import { cn } from "@/lib/utils";
import { isRTL } from "@/i18n/i18n-helpers";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
> & {
  locale?: string;
};

export default function Hero2({ background, tagLine, title, body, links, padding, locale = "en" }: Hero2Props & { padding?: any }) {
  const rtl = isRTL(locale);
  return (
    <SectionContainer background={background} padding={padding}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center" dir={rtl ? "rtl" : "ltr"}>
        {tagLine && (
          <p className="text-base font-semibold font-sans animate-fade-up [animation-delay:100ms] opacity-0">
            {tagLine}
          </p>
        )}
        {title && (
          <h2 className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0">
            {title}
          </h2>
        )}
        {body && (
          <div className="text-lg mt-6 max-w-2xl mx-auto animate-fade-up [animation-delay:300ms] opacity-0">
            <PortableTextRenderer value={body} locale={locale} />
          </div>
        )}
        {links && links.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-fade-up [animation-delay:400ms] opacity-0">
            {links.map((link) => (
              <Button
                key={link.title}
                variant={stegaClean(link?.buttonVariant?.variant)}
                size={stegaClean(link?.buttonVariant?.size) || "lg"}
                stroke={stegaClean(link?.buttonVariant?.stroke)}
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
