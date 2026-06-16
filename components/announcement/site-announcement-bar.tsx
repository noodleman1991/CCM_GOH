import { getTranslations } from "next-intl/server";
import { fetchSiteAnnouncement } from "@/sanity/lib/fetch";
import { getLocalizedField } from "@/lib/localization-utils";
import { announcementStyles, shouldShowAnnouncement, announcementKey } from "@/lib/announcement";
import { AnnouncementDismiss } from "./announcement-dismiss";
import { cn } from "@/lib/utils";

type SupportedLocale = "en" | "es" | "fr" | "ar";

/**
 * Site-wide announcement top bar (server component). Reads the singleton, checks
 * enabled + date window, resolves the locale message, and renders a dismissible
 * bar. Returns null when there's nothing to show.
 */
export async function SiteAnnouncementBar({ locale }: { locale: string }) {
  const announcement = await fetchSiteAnnouncement();

  if (!shouldShowAnnouncement(announcement)) return null;

  const supported = (["en", "es", "fr", "ar"].includes(locale) ? locale : "en") as SupportedLocale;
  const message = getLocalizedField(announcement!.message, supported, "")?.trim();
  if (!message) return null;

  const t = await getTranslations("announcement");
  const styles = announcementStyles(announcement!.variant);
  const key = announcementKey(message, announcement!.variant);

  const url = announcement!.link?.url;
  const linkLabel = getLocalizedField(announcement!.link?.label, supported, "")?.trim();

  const inner = (
    <div className={cn("w-full px-4 py-2 text-center text-sm font-medium", styles.bar)}>
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 pe-8">
        <span className="text-balance">{message}</span>
        {url && (
          <a href={url} className={cn("shrink-0 font-semibold", styles.link)} target="_blank" rel="noopener noreferrer">
            {linkLabel || t("readMore")}
          </a>
        )}
      </div>
    </div>
  );

  return (
    <AnnouncementDismiss
      announcementKey={key}
      dismissible={announcement!.dismissible !== false}
      dismissLabel={t("dismiss")}
    >
      {inner}
    </AnnouncementDismiss>
  );
}
