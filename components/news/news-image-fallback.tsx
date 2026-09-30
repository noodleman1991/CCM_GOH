import Image from "next/image";
import type { HubIllustration } from "@/lib/content/illustrations";

/**
 * The picture a news story shows when it has none of its own (2026-09-30):
 * the editors' choice from Hub Illustrations → "News picture when a story has
 * none", or else the hub's own pattern — a midnight-to-sea field with the
 * logo, softly — never an empty box. Fills its (positioned) parent.
 */
export function NewsImageFallback({ illustration }: { illustration?: HubIllustration | null }) {
  if (illustration) {
    return (
      <Image
        src={illustration.url}
        alt=""
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ccm-midnight via-ccm-sea to-ccm-water"
    >
      <span className="pointer-events-none absolute -end-10 -top-12 size-48 rounded-full bg-white/10 blur-2xl" />
      <span className="pointer-events-none absolute -bottom-16 -start-8 size-56 rounded-full bg-ccm-sky/20 blur-2xl" />
      <Image
        src="/connecting-climate-minds-logo-white.png"
        alt=""
        width={242}
        height={83}
        className="relative h-auto w-[42%] max-w-[12rem] opacity-80"
      />
    </div>
  );
}
