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

  // Common padding classes
  const verticalPadding = cn(
    "my-8 lg:my-10 xl:my-12",
    padding?.top ? "pt-12 xl:pt-16" : undefined,
    padding?.bottom ? "pb-12 xl:pb-16" : undefined,
  );

  if (hasBackground) {
    return (
      <div
        className={cn(
          "relative w-full grid grid-cols-[1fr_min(theme(maxWidth.6xl),100%)_1fr]",
          "[&>*]:col-start-2",
          verticalPadding,
          backgroundStyles.className
        )}
        style={backgroundStyles.style}
      >
        {/* Full-width background */}
        <div
          className="absolute inset-0 -z-10 col-span-full row-span-full"
          aria-hidden="true"
        />

        {/* Content constrained to middle column */}
        <div className={cn("px-4 sm:px-6 lg:px-8", className)}>
          {children}
        </div>
      </div>
    );
  }

  // No background: simple centered container
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={cn("relative", verticalPadding, className)}>
        {children}
      </div>
    </div>
  );
}
