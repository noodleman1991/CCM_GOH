"use client";

import { useEffect } from "react";
import { X, User, Calendar, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

interface LivedExperience {
  _id: string;
  _type: string;
  title?: {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
  };
  description?: {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
  };
  videoLink?: string;
  duration?: string;
  publishedAt?: string;
  author?: {
    _id: string;
    name: string;
    organizationalAffiliation?: string;
  };
  relatedCommunity?: {
    _id: string;
    name?: {
      en?: string;
      es?: string;
      fr?: string;
      ar?: string;
    };
  };
  tags?: Array<{
    _id: string;
    label?: {
      en?: string;
      es?: string;
      fr?: string;
      ar?: string;
    };
    color?: string;
  }>;
}

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  experience?: LivedExperience;
  videoUrl?: string;
  title?: string;
  locale: string;
}

const ALLOWED_EMBED_DOMAINS = [
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
]

function isAllowedEmbedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_EMBED_DOMAINS.includes(parsed.hostname)
  } catch {
    return false
  }
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

function getLocalizedText(obj: any, locale: string): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[locale] || obj["en"] || "";
}

export function VideoModal({
  isOpen,
  onClose,
  experience,
  videoUrl,
  title,
  locale,
}: VideoModalProps) {
  const t = useTranslations("livedExperiences");
  const isRTL = locale === "ar";

  // Get video URL and title from experience or props
  const url = experience?.videoLink || videoUrl || "";
  const displayTitle = experience
    ? getLocalizedText(experience.title, locale)
    : title || "";
  const description = experience
    ? getLocalizedText(experience.description, locale)
    : null;
  const communityName = experience?.relatedCommunity?.name
    ? getLocalizedText(experience.relatedCommunity.name, locale)
    : null;

  const embedUrl = getEmbedUrl(url);
  const isAllowed = url ? isAllowedEmbedUrl(url) : false;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(
      locale === "ar" ? "ar-EG" : locale,
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

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
          "w-[95vw] max-w-sm sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl",
          "max-h-[95vh] overflow-y-auto",
          "p-0",
          isRTL && "font-arabic"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{displayTitle || "Video"}</DialogTitle>
        </DialogHeader>

        {/* Video Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-black">
          {isAllowed ? (
            <iframe
              src={embedUrl}
              title={displayTitle || "Video player"}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <p>{t("videoUnavailable")}</p>
            </div>
          )}
        </div>

        {/* Content Section - Only show if experience data is available */}
        {experience && (
          <div className="p-6 space-y-4">
            {/* Title */}
            {displayTitle && (
              <h2 className="text-2xl font-bold">{displayTitle}</h2>
            )}

            {/* Metadata Row */}
            <div
              className={cn(
                "flex flex-wrap gap-4 text-sm text-muted-foreground",
                isRTL && "flex-row-reverse"
              )}
            >
              {experience.author && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{experience.author.name}</span>
                  {experience.author.organizationalAffiliation && (
                    <span className="text-muted-foreground">
                      • {experience.author.organizationalAffiliation}
                    </span>
                  )}
                </div>
              )}

              {experience.publishedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(experience.publishedAt)}</span>
                </div>
              )}

              {communityName && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-ccm-water font-medium">
                    {communityName}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            {description && (
              <div>
                <p className="text-muted-foreground leading-relaxed">{description}</p>
              </div>
            )}

            {/* Tags */}
            {experience.tags && experience.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  {t("tags")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {experience.tags
                    .filter((tag) => tag && tag.label)
                    .map((tag) => {
                      // Skip tags without color field
                      if (!tag.color) return null;

                      const tagLabel = getLocalizedText(tag.label, locale);
                      if (!tagLabel) return null;
                      return (
                        <span
                          key={tag._id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border-2"
                          style={{
                            borderColor: tag.color,
                            color: tag.color,
                            backgroundColor: `${tag.color}10`
                          }}
                        >
                          {tagLabel}
                        </span>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

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
