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
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
  locale = "en",
}: SectionHeaderProps) {
  const isNarrow = stegaClean(sectionWidth) === "narrow";
  const align = stegaClean(stackAlign);

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
    <SectionContainer padding={padding}>
        <div
          className={cn(
            align === "center" ? "max-w-3xl text-center mx-auto" : undefined,
            isNarrow ? "max-w-3xl mx-auto" : undefined
          )}
        >
        <div>
          {localizedTagLine && (
            <p className="text-sm font-semibold uppercase tracking-wider text-ccm-water mb-3">
              {localizedTagLine}
            </p>
          )}
          <h2 className={cn('font-bold font-heading text-ccm-midnight text-balance mb-4', heading('md'))}>{localizedTitle}</h2>
        </div>
        {localizedDescription && (
          <p className="text-base md:text-lg text-muted-foreground">
            {localizedDescription}
          </p>
        )}
        </div>
    </SectionContainer>
  );
}
