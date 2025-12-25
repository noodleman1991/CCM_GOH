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

  if (background && background.type !== "none") {
    return (
      <div className={cn("relative w-screen -ml-4 -mr-4", backgroundStyles.className)} style={backgroundStyles.style}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              "relative my-8 lg:my-10 xl:my-12",
              padding?.top ? "pt-12 xl:pt-16" : undefined,
              padding?.bottom ? "pb-12 xl:pb-16" : undefined,
              className
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative my-8 lg:my-10 xl:my-12",
        padding?.top ? "pt-12 xl:pt-16" : undefined,
        padding?.bottom ? "pb-12 xl:pb-16" : undefined,
        className
      )}
    >
      {children}
    </div>
  );
}
