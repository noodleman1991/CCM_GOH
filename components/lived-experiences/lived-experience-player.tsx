"use client";

import { useTranslations } from "next-intl";
import { Video, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";

const ALLOWED = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtu.be"];
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

function isAllowed(url: string): boolean {
  try {
    return ALLOWED.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function embedUrl(url: string): string {
  if (url.includes("youtube.com/watch")) {
    const id = new URLSearchParams(url.split("?")[1]).get("v");
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  return url;
}

/**
 * Format-aware media for the lived-experience detail page. Consent prompts are
 * scoped to the media frame only (the story stays readable regardless), matching
 * the modal's respectful pattern.
 *  - video → consent-gated YouTube iframe (16:9)
 *  - audio → native <audio> for self-hosted files, or a consent-gated SoundCloud
 *    embed; written stories render no media (the prose is the content).
 */
export function LivedExperiencePlayer({
  url,
  title,
  format = "video",
}: {
  url: string;
  title: string;
  locale: string;
  format?: "video" | "audio" | "written";
}) {
  const t = useTranslations("livedExperiences");
  const { consent, hasConsented, acceptAll } = useCookieConsent();

  // Written stories have no media frame.
  if (format === "written") return null;

  // Audio: self-hosted file plays natively (no third-party consent needed).
  if (format === "audio" && isDirectAudioFile(url)) {
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

  // Video (default).
  const allowed = consent?.functional && hasConsented && isAllowed(url);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ccm-midnight">
      {allowed ? (
        <iframe
          src={embedUrl(url)}
          title={title || t("videoTitleFallback")}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <Video className="h-9 w-9 opacity-80" aria-hidden="true" />
          <p className="text-sm text-white/85">{t("cookieConsentRequired")}</p>
          <Button onClick={acceptAll} size="sm" variant="secondary">
            {t("acceptCookies")}
          </Button>
        </div>
      )}
    </div>
  );
}
