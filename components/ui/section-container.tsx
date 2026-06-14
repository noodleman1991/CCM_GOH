import { cn } from "@/lib/utils";
import { BackgroundOptionType } from "@/types/background-option";
import { getBackgroundStyles } from "@/lib/background-utils";
import { SectionPadding, ColorVariant } from "@/sanity.types";
import { spacingY, containerWidth, type SpacingToken, type WidthToken } from "@/lib/design-tokens";

interface SectionContainerProps {
  color?: ColorVariant | null;
  padding?: SectionPadding | null;
  background?: BackgroundOptionType | null;
  /** Vertical rhythm token. Defaults to the site-standard "md". */
  spacing?: SpacingToken;
  /** Content max-width token. Defaults to the site-standard "default" (max-w-6xl). */
  width?: WidthToken;
  children: React.ReactNode;
  className?: string;
}

export default function SectionContainer({
  color = "background",
  padding,
  background,
  spacing = "md",
  width = "default",
  children,
  className,
}: SectionContainerProps) {
  const backgroundStyles = getBackgroundStyles(background);
  const hasBackground = background && background.type !== "none";

  // Vertical rhythm + optional top/bottom inner padding, sourced from tokens so
  // the spacing scale lives in one place (lib/design-tokens.ts).
  const verticalPadding = cn(
    spacingY(spacing),
    padding?.top ? "pt-12 xl:pt-16" : undefined,
    padding?.bottom ? "pb-12 xl:pb-16" : undefined,
  );
  const maxWidth = containerWidth(width);

  if (hasBackground) {
    return (
      <section className={cn("relative w-full -mx-4", verticalPadding)}>
        {/* Full-width background - positioned relative to section which has height */}
        <div
          className={cn(
            "absolute inset-0 w-full",
            backgroundStyles.className
          )}
          style={backgroundStyles.style}
          aria-hidden="true"
        />

        {/* Centered content with horizontal padding restored and increased to compensate for -mx-4 */}
        <div className={cn(
          "relative mx-auto px-8 sm:px-10 lg:px-12",
          maxWidth,
          className
        )}>
          {children}
        </div>
      </section>
    );
  }

  // No background: simple centered container with horizontal padding
  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", maxWidth)}>
      <div className={cn("relative", verticalPadding, className)}>
        {children}
      </div>
    </div>
  );
}
