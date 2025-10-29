import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

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

  return (
    <SectionContainer background={background} padding={padding}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
            isNarrow ? "max-w-[48rem] mx-auto" : undefined
          )}
        >
        <div>
          {tagLine && (
            <p className="text-base font-semibold mb-4">
              {tagLine}
            </p>
          )}
          <h2 className="mb-4">{title}</h2>
          {body && <PortableTextRenderer value={body} locale={locale} />}
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
