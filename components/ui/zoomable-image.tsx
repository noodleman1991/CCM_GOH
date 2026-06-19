"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An image that opens full-size in a dialog on click — useful for charts/tables
 * where detail matters. Keeps the inline rendering (LQIP, sizing) intact; the
 * dialog shows the image at up to viewport size, scrollable if larger.
 */
export function ZoomableImage({
  src,
  alt,
  width,
  height,
  blurDataURL,
  className,
  style,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group/zoom relative block w-fit max-w-full cursor-zoom-in"
        aria-label={`${alt} — click to enlarge`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          placeholder={blurDataURL ? "blur" : undefined}
          blurDataURL={blurDataURL}
          style={style}
          className={className}
        />
        <span className="pointer-events-none absolute bottom-2 end-2 rounded-full bg-black/55 p-1.5 text-white opacity-0 transition-opacity group-hover/zoom:opacity-100">
          <ZoomIn className="size-4" />
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-w-[95vw] sm:max-w-[90vw] w-fit p-2 sm:p-4",
            "max-h-[92vh] overflow-auto"
          )}
        >
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {/* Intrinsic size, capped to the viewport; scroll if larger. */}
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="h-auto w-auto max-w-full rounded-lg"
            sizes="90vw"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
