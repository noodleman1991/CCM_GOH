"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { useHydrated } from "@/hooks/use-hydrated";

// The bell only needs the unread count for its badge; the list itself is
// rendered by the shared <NotificationFeed>, which runs its own SWR.
const countFetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ unread: number }>);

export function NotificationBell() {
  const { isSignedIn } = useAuth();
  const t = useTranslations("notifications");

  // Clerk resolves auth state on the client, so `isSignedIn` can differ between
  // the server render and the first client render — which caused a hydration
  // mismatch. Gate on hydration so server + first client render agree (both
  // render nothing), then reveal once hydrated.
  const hydrated = useHydrated();

  const { data, mutate } = useSWR(hydrated && isSignedIn ? "/api/notifications" : null, countFetcher, {
    refreshInterval: 60_000,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });

  if (!hydrated || !isSignedIn) return null;

  const unread = data?.unread ?? 0;

  const onOpen = async (open: boolean) => {
    if (open && unread > 0) {
      await markNotificationsRead();
      mutate();
    }
  };

  return (
    <Popover onOpenChange={onOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("title")}>
          <Bell className="size-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex min-w-4 items-center justify-center rounded-full bg-ccm-sea px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-2 text-sm font-semibold">{t("title")}</div>
        <NotificationFeed className="max-h-96 overflow-y-auto" />
      </PopoverContent>
    </Popover>
  );
}
