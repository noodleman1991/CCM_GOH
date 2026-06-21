import { cn } from "@/lib/utils";
import SectionContainer from "@/components/ui/section-container";
import { stegaClean } from "next-sanity";
import { getLocalizedField } from "@/lib/localization-utils";
import { PAGE_QUERY_RESULT } from "@/sanity.types";
import { heading } from "@/lib/design-tokens";
import { SectionHeader as UISectionHeader } from "@/components/ui/section-header";

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
        {/* Left-aligned headers get the shared bar'd SectionHeader (matches the
            rest of the app). Centred headers keep the tagLine accent — a vertical
            bar reads oddly on centred text. */}
        {align === "center" ? (
          <div>
            {localizedTagLine && (
              <p className="text-sm font-semibold uppercase tracking-wider text-ccm-water mb-3">
                {localizedTagLine}
              </p>
            )}
            <h2 className={cn('font-bold font-heading text-ccm-midnight text-balance mb-4', heading('md'))}>{localizedTitle}</h2>
          </div>
        ) : (
          <UISectionHeader title={localizedTitle} subtitle={localizedTagLine || undefined} titleClassName={heading('md')} />
        )}
        {localizedDescription && (
          <p className={cn("text-base md:text-lg text-muted-foreground", align !== "center" && "mt-3")}>
            {localizedDescription}
          </p>
        )}
        </div>
    </SectionContainer>
  );
}
