import { cn } from "@/lib/utils";
import { BackgroundOptionType } from "@/types/background-option";
import { getBackgroundStyles } from "@/lib/background-utils";
import { SectionPadding, ColorVariant } from "@/sanity.types";

interface SectionContainerProps {
  color?: ColorVariant | null;
  padding?: SectionPadding | null;
  background?: BackgroundOptionType | null;
  children: React.ReactNode;
  className?: string;
}

export default function SectionContainer({
  color = "background",
  padding,
  background,
  children,
  className,
}: SectionContainerProps) {
  const backgroundStyles = getBackgroundStyles(background);
  const hasBackground = background && background.type !== "none";

  // Vertical padding only
  const verticalPadding = cn(
    "my-8 lg:my-10 xl:my-12",
    padding?.top ? "pt-12 xl:pt-16" : undefined,
    padding?.bottom ? "pb-12 xl:pb-16" : undefined, // Fixed typo: was pt-16
  );

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
          "relative mx-auto max-w-6xl px-8 sm:px-10 lg:px-12",
          className
        )}>
          {children}
        </div>
      </section>
    );
  }

  // No background: simple centered container with horizontal padding
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={cn("relative", verticalPadding, className)}>
        {children}
      </div>
    </div>
  );
}
