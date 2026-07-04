"use client";

import useSWR from "swr";
import { useTranslations } from "next-intl";
import { Bell, MessageSquare, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useSearchStore } from "@/stores/search-store";
import { useSidebar } from "@/components/ui/sidebar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/**
 * One-tap quick actions at the top of the MOBILE nav sheet (task #11,
 * user-approved layout): Search · Messages · Notifications, with the live
 * unread count. Hidden everywhere else — desktop keeps its footer pill +
 * topbar bell, so the two surfaces stay matched without duplication.
 */
export function SidebarQuickActions() {
  const t = useTranslations("navigation");
  const { setOpenMobile } = useSidebar();
  const { data } = useSWR<{ unread: number }>("/api/notifications", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });
  const unread = data?.unread ?? 0;

  const item =
    "flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-white/10 text-[11px] font-bold text-white active:bg-white/20";

  return (
    <div className="hidden gap-2 px-3 pt-3 [[data-mobile=true]_&]:flex">
      <button
        type="button"
        className={item}
        onClick={() => {
          setOpenMobile(false);
          useSearchStore.getState().setOpen(true);
        }}
      >
        <Search className="size-4" aria-hidden />
        {t("quickSearch")}
      </button>
      <Link href="/messages" className={item} onClick={() => setOpenMobile(false)}>
        <MessageSquare className="size-4" aria-hidden />
        {t("quickMessages")}
      </Link>
      <Link href="/messages?tab=notifications" className={`${item} relative`} onClick={() => setOpenMobile(false)}>
        <span className="relative">
          <Bell className="size-4" aria-hidden />
          {unread > 0 && (
            <span className="absolute -end-2.5 -top-1.5 min-w-4 rounded-full bg-ccm-amber px-1 text-center text-[9px] font-bold leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        {t("quickNotifications")}
      </Link>
    </div>
  );
}
