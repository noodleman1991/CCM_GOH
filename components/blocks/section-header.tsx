import { cn } from "@/lib/utils";
import SectionContainer, { type SectionPadding } from "@/components/ui/section-container";
import { cleanText } from "@/lib/content/text";
import { getLocalizedField } from "@/lib/localization-utils";
import { heading } from "@/lib/design-tokens";
import { SectionHeader as UISectionHeader } from "@/components/ui/section-header";

/** A field that carries either a plain string or a `{en, es, fr, ar}` map —
 *  the shape `getLocalizedField` resolves. Matches the precedent already
 *  used for this exact pattern in lib/content/discovery.ts's LocalizedText. */
type LocalizedText = string | Record<string, string> | null;

interface SectionHeaderProps {
  padding?: SectionPadding | null;
  sectionWidth?: "default" | "narrow" | string | null;
  stackAlign?: "left" | "center" | string | null;
  tagLine?: LocalizedText;
  title?: LocalizedText;
  description?: LocalizedText;
  locale?: string;
}

export default function SectionHeader({
  padding,
  sectionWidth = "default",
  stackAlign = "left",
  tagLine,
  title,
  description,
  locale = "en",
}: SectionHeaderProps) {
  const isNarrow = cleanText(sectionWidth) === "narrow";
  const align = cleanText(stackAlign);

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
          <p className={cn("text-base @content-md/page:text-lg text-muted-foreground", align !== "center" && "mt-3")}>
            {localizedDescription}
          </p>
        )}
        </div>
    </SectionContainer>
  );
}
