import Image from "next/image";
import { cn } from "@/lib/utils";
import type { HubIllustration } from "@/lib/sanity/hub-illustrations";

interface HeaderIllustrationProps {
  /** Resolved CMS illustration, or undefined when the slot isn't configured
   *  — in that case this renders null and the header looks exactly as it
   *  does with no illustration support at all. */
  image?: HubIllustration;
  className?: string;
}

/**
 * Decorative header illustration (hub character), placed in the header's
 * inline-END space (logical properties, so it flips correctly under RTL).
 * Purely decorative: `aria-hidden` + empty alt, never announced to screen
 * readers, never the only carrier of information.
 *
 * Positioning contract: the parent header container must be `relative` (and
 * should reserve `pe-*` padding to keep text from overlapping this element
 * once an illustration is configured — see the Atlas/Search page headers).
 */
export function HeaderIllustration({ image, className }: HeaderIllustrationProps) {
  if (!image) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute end-0 top-1/2 block -translate-y-1/2",
        className
      )}
    >
      <Image
        src={image.url}
        alt=""
        width={image.width}
        height={image.height}
        // Scales down (never hidden) so the character survives at 375px,
        // then grows back at larger breakpoints.
        className="h-12 w-auto max-h-12 object-contain sm:h-20 sm:max-h-20 lg:h-32 lg:max-h-32"
        priority={false}
      />
    </div>
  );
}
