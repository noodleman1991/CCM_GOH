"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  locale: string;
}

function getEmbedUrl(url: string): string {
  // YouTube embed handling
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    let videoId = "";

    if (url.includes("youtube.com/watch")) {
      const urlParams = new URLSearchParams(url.split("?")[1]);
      videoId = urlParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }

    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
  }

  // Vimeo embed handling
  if (url.includes("vimeo.com")) {
    const videoId = url.split("vimeo.com/")[1]?.split("?")[0] || "";
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
  }

  // Return original URL if not recognized
  return url;
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  title,
  locale,
}: VideoModalProps) {
  const isRTL = locale === "ar";
  const embedUrl = getEmbedUrl(videoUrl);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "max-w-5xl p-0",
          isRTL && "font-arabic"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title || "Video"}</DialogTitle>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            src={embedUrl}
            title={title || "Video player"}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={cn(
            "absolute top-2 z-50 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isRTL ? "left-2" : "right-2"
          )}
          aria-label="Close video"
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
