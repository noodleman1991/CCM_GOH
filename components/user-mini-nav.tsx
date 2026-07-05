"use client";

import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import { LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UnreadBadge } from "@/components/unread-badge";
import { useSidebar } from "@/components/ui/sidebar";
import { FEATURES } from "@/lib/features";

/**
 * The user area's little nav menu (user direction 2026-07-05): the frequent
 * personal destinations — Dashboard · Messages (live unread badge) · Settings
 * — inline under the account button, identical on the desktop rail and in the
 * mobile sheet. Account/sign-out stay inside the AuthNavUser dropdown.
 */
export function UserMiniNav() {
  const t = useTranslations("navigation");
  const { isSignedIn } = useUser();
  const { setOpenMobile } = useSidebar();
  if (!isSignedIn) return null;

  const row =
    "flex min-h-[40px] items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium text-sidebar-foreground/85 transition-colors hover:bg-white/8 hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden";

  return (
    <nav aria-label={t("userMenu")} className="mt-1.5 grid gap-0.5 border-t border-white/10 pt-1.5 group-data-[collapsible=icon]:hidden">
      <Link href="/dashboard" className={row} onClick={() => setOpenMobile(false)}>
        <LayoutDashboard className="size-4 opacity-70" aria-hidden />
        {t("userDashboard")}
      </Link>
      {FEATURES.engagement && (
        <Link href="/messages" className={row} onClick={() => setOpenMobile(false)}>
          <MessageSquare className="size-4 opacity-70" aria-hidden />
          {t("userMessages")}
          <span className="ms-auto">
            <UnreadBadge />
          </span>
        </Link>
      )}
      <Link href="/dashboard/settings" className={row} onClick={() => setOpenMobile(false)}>
        <Settings className="size-4 opacity-70" aria-hidden />
        {t("userSettings")}
      </Link>
    </nav>
  );
}
