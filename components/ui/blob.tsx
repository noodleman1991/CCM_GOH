import { cn } from "@/lib/utils";

/**
 * Decorative organic "blob" accent (redesign §1.5/§1.6). An absolutely-positioned,
 * soft, slowly-morphing shape placed behind hero/section content. Purely decorative:
 * it is `aria-hidden` and `pointer-events-none`, and the global
 * `prefers-reduced-motion` rule in globals.css freezes it to a static end-state.
 *
 * Place inside a `relative`/`overflow-hidden` parent. Colour comes from a CCM token
 * (see lib/ccm-colors.ts / globals.css `--color-ccm-*`); opacity keeps it subtle so
 * foreground text stays AA-contrast.
 */
export type BlobColor = "sky" | "water" | "sea" | "midnight" | "secondary";

const COLOR_VAR: Record<BlobColor, string> = {
  sky: "var(--color-ccm-sky)",
  water: "var(--color-ccm-water)",
  sea: "var(--color-ccm-sea)",
  midnight: "var(--color-ccm-midnight)",
  secondary: "var(--secondary)",
};

export interface BlobProps {
  /** CCM token colour for the fill. Default: sky (softest). */
  color?: BlobColor;
  /** Diameter in px (the blob is roughly square before morphing). Default 360. */
  size?: number;
  /** Fill opacity (0–1). Keep low so text stays readable. Default 0.45. */
  opacity?: number;
  /** Disable the slow morph animation (e.g. for a static decorative fill). */
  static?: boolean;
  /** Extra positioning classes, e.g. "top-[-10%] end-[-8%]". */
  className?: string;
}

export function Blob({
  color = "sky",
  size = 360,
  opacity = 0.45,
  static: isStatic = false,
  className,
}: BlobProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-0 block blur-[2px]",
        !isStatic && "motion-safe:animate-ccmblob",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: COLOR_VAR[color],
        opacity,
        borderRadius: "58% 42% 55% 45% / 52% 48% 52% 48%",
        willChange: isStatic ? undefined : "transform, border-radius",
      }}
    />
  );
}

export default Blob;
