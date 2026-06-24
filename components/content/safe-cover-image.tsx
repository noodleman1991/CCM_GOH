"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * A cover image that degrades gracefully: if the asset 404s or fails to load,
 * it hides instead of throwing (which would blank the page via the error
 * boundary). Use for CMS-sourced cover images that may have missing assets.
 */
export function SafeCoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <div className="relative aspect-video overflow-hidden rounded-lg">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
        // Bypass the Next image optimizer so a missing/404 asset surfaces as a
        // client onError (→ hidden) instead of a fatal server render error.
        unoptimized
        onError={() => setFailed(true)}
      />
    </div>
  );
}
