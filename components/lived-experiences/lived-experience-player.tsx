"use client";

import { useTranslations } from "next-intl";
import { Video, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";
import { youtubeId } from "@/lib/youtube";
import { vimeoId } from "@/lib/vimeo";
import { deriveVideoSource } from "@/lib/video-source";

const AUDIO_EMBED_HOSTS = ["soundcloud.com", "www.soundcloud.com", "w.soundcloud.com"];

function host(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function isDirectAudioFile(url: string): boolean {
  return /\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(url);
}

/**
 * Format-aware media for the lived-experience detail page. Consent prompts are
 * scoped to the media frame only (the story stays readable regardless), matching
 * the modal's respectful pattern.
 *  - video → by source: YouTube / Vimeo consent-gated iframes, or a natively
 *    played uploaded file (no third-party — no consent needed). Legacy docs
 *    have only a URL; the source is derived from it.
 *  - audio → native <audio> for self-hosted files, or a consent-gated SoundCloud
 *    embed; written stories render no media (the prose is the content).
 */
export function LivedExperiencePlayer({
  url,
  title,
  format = "video",
  videoSource,
  fileUrl,
  posterUrl,
}: {
  url?: string | null;
  title: string;
  locale: string;
  format?: "video" | "audio" | "written";
  /** Explicit source from the CMS; absent on legacy docs (derived from url). */
  videoSource?: string | null;
  /** CDN URL of a directly uploaded video file (videoSource "upload"). */
  fileUrl?: string | null;
  /** Poster for the native player — the LE thumbnail when available. */
  posterUrl?: string | null;
}) {
  const t = useTranslations("livedExperiences");
  const { consent, hasConsented, acceptAll } = useCookieConsent();

  // Written stories have no media frame.
  if (format === "written") return null;

  // Audio: self-hosted file plays natively (no third-party consent needed).
  if (format === "audio" && url && isDirectAudioFile(url)) {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-ccm-sky/15 p-4">
        <Headphones className="size-6 shrink-0 text-ccm-sea" aria-hidden="true" />
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls preload="none" className="w-full" src={url}>
          {t("audioFallback")}
        </audio>
      </div>
    );
  }

  // Audio via an embeddable host (e.g. SoundCloud) → consent-gated iframe.
  if (format === "audio") {
    if (!url) return null;
    const allowedAudio =
      consent?.functional && hasConsented && AUDIO_EMBED_HOSTS.includes(host(url) || "");
    return (
      <div className="relative overflow-hidden rounded-lg bg-ccm-midnight">
        {allowedAudio ? (
          <iframe
            src={url}
            title={title || t("audioTitleFallback")}
            className="h-32 w-full"
            allow="autoplay"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <Headphones className="h-9 w-9 opacity-80" aria-hidden="true" />
            <p className="text-sm text-white/85">{t("cookieConsentRequired")}</p>
            <Button onClick={acceptAll} size="sm" variant="secondary">
              {t("acceptCookies")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Video (default) — routed by source. Legacy docs (no videoSource) derive it
  // from the URL, so they keep playing exactly as before.
  const source = deriveVideoSource(videoSource, url, fileUrl);

  // Uploaded file: played natively — no third-party embed, no consent gate.
  if (source === "upload" && fileUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ccm-midnight">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          controls
          preload="metadata"
          playsInline
          poster={posterUrl || undefined}
          className="absolute inset-0 h-full w-full"
          src={fileUrl}
          title={title || t("videoTitleFallback")}
        />
      </div>
    );
  }

  // Embedded YouTube / Vimeo → the same consent gate for both.
  const embedSrc =
    source === "youtube" && url && youtubeId(url)
      ? `https://www.youtube-nocookie.com/embed/${youtubeId(url)}`
      : source === "vimeo" && url && vimeoId(url)
        ? `https://player.vimeo.com/video/${vimeoId(url)}?dnt=1`
        : null;

  const allowed = consent?.functional && hasConsented && Boolean(embedSrc);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ccm-midnight">
      {allowed && embedSrc ? (
        <iframe
          src={embedSrc}
          title={title || t("videoTitleFallback")}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <Video className="h-9 w-9 opacity-80" aria-hidden="true" />
          <p className="text-sm text-white/85">
            {embedSrc ? t("cookieConsentRequired") : t("videoUnavailable")}
          </p>
          {embedSrc && (
            <Button onClick={acceptAll} size="sm" variant="secondary">
              {t("acceptCookies")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
