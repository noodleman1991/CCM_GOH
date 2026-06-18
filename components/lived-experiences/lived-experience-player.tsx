"use client";

import { useTranslations } from "next-intl";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-provider";

const ALLOWED = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtu.be"];

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
 * Consent-gated video for the lived-experience detail page. The consent prompt
 * is scoped to the media frame only (the story sits outside it and stays
 * readable regardless), matching the modal's respectful pattern.
 */
export function LivedExperiencePlayer({ url, title }: { url: string; title: string; locale: string }) {
  const t = useTranslations("livedExperiences");
  const { consent, hasConsented, acceptAll } = useCookieConsent();
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
