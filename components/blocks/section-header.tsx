import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { getLocalizedField } from "@/lib/localization-utils";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { heading } from "@/lib/design-tokens";

type SectionHeaderProps = Extract<
  NonNullable<NonNullable<PAGE_QUERY_RESULT>["blocks"]>[number],
  { _type: "section-header" }
> & {
  locale?: string;
};

export default function SectionHeader({
  padding,
  colorVariant,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
  locale = "en",
}: SectionHeaderProps) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);
  const color = stegaClean(colorVariant);

  const supportedLocale = (locale || "en") as 'en' | 'es' | 'fr' | 'ar';

  const localizedTagLine = typeof tagLine === 'string'
    ? tagLine
    : getLocalizedField(tagLine, supportedLocale, '');

  const localizedTitle = typeof title === 'string'
    ? title
    : getLocalizedField(title, supportedLocale, '');

  const localizedDescription = typeof description === 'string'
    ? description
    : getLocalizedField(description, supportedLocale, '');

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            align === "center" ? "max-w-[48rem] text-center mx-auto" : undefined,
            isNarrow ? "max-w-[48rem] mx-auto" : undefined
          )}
        >
        <div
          className={cn(color === "primary" ? "text-background" : undefined)}
        >
          {localizedTagLine && (
            <p className={cn(
              "text-base font-semibold uppercase tracking-wider mb-4",
              color === "primary" ? "text-background/80" : "text-ccm-water"
            )}>
              {localizedTagLine}
            </p>
          )}
          <h2 className={cn('font-bold font-heading text-balance mb-4', heading('md'))}>{localizedTitle}</h2>
        </div>
        {localizedDescription && (
          <p className={cn(
            "text-lg",
            color === "primary" ? "text-background/90" : "text-muted-foreground"
          )}>
            {localizedDescription}
          </p>
        )}
        </div>
      </div>
    </SectionContainer>
  );
}
