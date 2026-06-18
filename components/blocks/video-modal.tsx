"use client";

import { useEffect } from "react";
import { X, User, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/components/cookie-consent/cookie-consent-provider';
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
  issue?: {
    en?: string;
    es?: string;
    fr?: string;
    ar?: string;
  };
  personContext?: {
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
  const { consent, hasConsented, acceptAll } = useCookieConsent();
  const hasFunctionalConsent = hasConsented && consent?.functional;
  const isRTL = locale === "ar";

  // Get video URL and title from experience or props
  const url = experience?.videoLink || videoUrl || "";
  const displayTitle = experience
    ? getLocalizedText(experience.title, locale)
    : title || "";
  const description = experience
    ? getLocalizedText(experience.description, locale)
    : null;
  const issue = experience ? getLocalizedText(experience.issue, locale) : null;
  const personContext = experience ? getLocalizedText(experience.personContext, locale) : null;
  const communityName = experience?.relatedCommunity?.name
    ? getLocalizedText(experience.relatedCommunity.name, locale)
    : null;

  const embedUrl = getEmbedUrl(url);
  const isAllowed = url ? isAllowedEmbedUrl(url) : false;

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

  const authorName = experience?.author?.name;
  const authorRole = experience?.author?.organizationalAffiliation;
  const hasStory = Boolean(issue || personContext || description);
  const visibleTags = (experience?.tags ?? []).filter(
    (tag) => tag?.label && tag.color && getLocalizedText(tag.label, locale)
  );

  // The media frame: video when consented, otherwise a calm in-frame consent
  // prompt — scoped to THIS box only, never the whole modal, so the story stays
  // readable beside/under it.
  const mediaFrame = (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ccm-midnight">
      {isAllowed && hasFunctionalConsent ? (
        <iframe
          src={embedUrl}
          title={displayTitle || t("videoTitleFallback")}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : !hasFunctionalConsent ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <Video className="h-9 w-9 opacity-80" aria-hidden="true" />
          <p className="text-sm text-white/85">{t("cookieConsentRequired")}</p>
          <Button onClick={acceptAll} size="sm" variant="secondary">
            {t("acceptCookies")}
          </Button>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/85">
          <p className="text-sm">{t("videoUnavailable")}</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          "w-[95vw] max-w-sm sm:max-w-2xl lg:max-w-4xl",
          "max-h-[92vh] overflow-y-auto p-6",
          isRTL && "font-arabic"
        )}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{displayTitle || t("videoTitleFallback")}</DialogTitle>
        </DialogHeader>

        {/* Person header — leads the modal, dignity first */}
        {experience && (authorName || communityName) && (
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-ccm-sky/30 text-ccm-sea">
              <User className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              {authorName && (
                <p className="font-heading font-semibold text-ccm-midnight leading-tight">
                  <bdi>{authorName}</bdi>
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {communityName && <bdi className="text-ccm-water">{communityName}</bdi>}
                {communityName && authorRole && <span className="mx-1.5">·</span>}
                {authorRole && <bdi>{authorRole}</bdi>}
              </p>
            </div>
          </div>
        )}

        {/* lg: media inline-start, context inline-end; base: stacked */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="space-y-4">
            {mediaFrame}
            {displayTitle && (
              <h2 className="text-balance text-lg font-heading font-semibold text-ccm-midnight leading-tight lg:hidden">
                {displayTitle}
              </h2>
            )}
          </div>

          <div className="space-y-4">
            {displayTitle && (
              <h2 className="hidden text-balance text-xl font-heading font-semibold text-ccm-midnight leading-tight lg:block">
                {displayTitle}
              </h2>
            )}

            {/* Story — a quiet noun label, then the person's own framing. */}
            {hasStory && (
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ccm-sea">
                  {t("storyLabel")}
                </p>
                {issue && (
                  <p className="text-sm text-foreground/85 leading-relaxed">{issue}</p>
                )}
                {personContext && (
                  <p className="text-sm text-foreground/75 leading-relaxed">{personContext}</p>
                )}
                {!issue && !personContext && description && (
                  <p className="text-sm text-foreground/85 leading-relaxed">{description}</p>
                )}
              </section>
            )}

            {visibleTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {visibleTags.map((tag) => {
                  const tagLabel = getLocalizedText(tag.label, locale);
                  return (
                    <span
                      key={tag._id}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: tag.color,
                        color: tag.color,
                        backgroundColor: `${tag.color}10`,
                      }}
                    >
                      {tagLabel}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Close — logical end side, no physical left/right */}
        <button
          onClick={onClose}
          className="absolute top-3 end-3 z-50 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={t("closeVideo")}
        >
          <X className="h-5 w-5" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
