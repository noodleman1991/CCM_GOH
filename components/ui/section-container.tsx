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

  // If we have a custom background, use full-width layout
  if (background && background.type !== "none") {
    return (
      // Break out of container constraints for full-width background
      <div className={cn("relative w-screen -mx-4", backgroundStyles.className)} style={backgroundStyles.style}>
        <div className="container mx-auto px-4">
          <div
            className={cn(
              "relative",
              padding?.top ? "pt-16 xl:pt-20" : undefined,
              padding?.bottom ? "pb-16 xl:pb-20" : undefined,
              className
            )}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Standard layout with Tailwind color classes
  return (
    <div
      className={cn(
        `bg-${color} relative w-screen -mx-4`,
        padding?.top ? "pt-16 xl:pt-20" : undefined,
        padding?.bottom ? "pb-16 xl:pb-20" : undefined,
        className
      )}
    >
      <div className="container mx-auto px-4">{children}</div>
    </div>
  );
}
