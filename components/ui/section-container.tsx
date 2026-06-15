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
  // Editor opt-in: switch text to a light colour for dark backgrounds.
  const lightText = Boolean(background?.lightText);

  // Vertical rhythm + optional top/bottom inner padding, sourced from tokens so
  // the spacing scale lives in one place (lib/design-tokens.ts).
  const verticalPadding = cn(
    spacingY(spacing),
    padding?.top ? "pt-12 xl:pt-16" : undefined,
    padding?.bottom ? "pb-12 xl:pb-16" : undefined,
  );
  const maxWidth = containerWidth(width);

  if (hasBackground) {
    // The background spans the FULL width of the main content area (the
    // SidebarInset) edge-to-edge — no negative margins, so it stays flush to the
    // x-edges whether the sidebar is open or collapsed (the parent <main> has no
    // horizontal padding). The inner content keeps the standard centred width +
    // padding so it lines up with non-background sections above/below.
    return (
      <section className={cn("relative w-full", verticalPadding)}>
        <div
          className={cn("absolute inset-0", backgroundStyles.className)}
          style={backgroundStyles.style}
          aria-hidden="true"
        />
        <div
          className={cn(
            "relative mx-auto px-4 sm:px-6 lg:px-8",
            // When the editor flags a dark background, render text in the light
            // foreground so headings/body stay readable. Headings/muted text that
            // hardcode a dark brand colour are nudged to inherit via these
            // descendant selectors (kept narrow — only text colours, not links).
            lightText &&
              "text-background [&_h1]:text-background [&_h2]:text-background [&_h3]:text-background [&_p]:text-background/90 [&_.text-muted-foreground]:text-background/80 [&_.text-ccm-midnight]:text-background",
            maxWidth,
            className
          )}
        >
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
