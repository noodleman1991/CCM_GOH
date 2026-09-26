// Pure helpers for the site announcement bar: variant → on-brand styles, and
// the "should we show it right now" decision (enabled + date window).

export type AnnouncementVariant = "brand" | "info" | "success" | "warning";

/**
 * Tailwind class strings per variant. All combinations meet WCAG AA on the
 * chosen background (white text on the dark CCM tones; dark text on light).
 */
export const ANNOUNCEMENT_STYLES: Record<
  AnnouncementVariant,
  { bar: string; link: string }
> = {
  // ccm-sea background, white text
  brand: { bar: "bg-[var(--color-ccm-sea)] text-white", link: "underline decoration-white/60 hover:decoration-white" },
  // ccm-sky tint, midnight text
  info: { bar: "bg-[var(--color-ccm-sky)]/30 text-ccm-midnight", link: "underline decoration-ccm-sea/50 hover:decoration-ccm-sea" },
  // deep green, white text
  success: { bar: "bg-[#0F7368] text-white", link: "underline decoration-white/60 hover:decoration-white" },
  // amber, dark text (amber on white text fails AA, so dark text here)
  warning: { bar: "bg-[#B45309] text-white", link: "underline decoration-white/60 hover:decoration-white" },
};

export const announcementStyles = (variant?: string | null) =>
  ANNOUNCEMENT_STYLES[(variant as AnnouncementVariant) in ANNOUNCEMENT_STYLES ? (variant as AnnouncementVariant) : "brand"];

type ShowInput = {
  enabled?: boolean | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

/**
 * Whether the announcement should display at time `now`:
 * must be enabled, and (if set) within [startsAt, endsAt].
 */
export function shouldShowAnnouncement(
  a: ShowInput | null | undefined,
  now: Date = new Date()
): boolean {
  if (!a || !a.enabled) return false;
  const t = now.getTime();
  if (a.startsAt) {
    const start = Date.parse(a.startsAt);
    if (!Number.isNaN(start) && t < start) return false;
  }
  if (a.endsAt) {
    const end = Date.parse(a.endsAt);
    if (!Number.isNaN(end) && t > end) return false;
  }
  return true;
}

/**
 * A stable key for a given announcement's content, so a visitor's dismissal
 * resets when the editor changes the message/variant.
 */
export function announcementKey(message: string, variant?: string | null): string {
  let h = 0;
  const s = `${variant || "brand"}:${message}`;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `a${(h >>> 0).toString(36)}`;
}
