"use client";

import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markNotificationsRead } from "@/lib/actions/notifications";

type Notif = {
  id: string;
  type: string;
  actorName: string | null;
  actorImage: string | null;
  snippet: string | null;
  readAt: string | null;
  createdAt: string;
};

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<{ unread: number; notifications: Notif[] }>);

export function NotificationBell() {
  const { isSignedIn } = useAuth();
  const t = useTranslations("notifications");

  const { data, mutate } = useSWR(isSignedIn ? "/api/notifications" : null, fetcher, {
    refreshInterval: 60_000,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
  });

  if (!isSignedIn) return null;

  const unread = data?.unread ?? 0;
  const items = data?.notifications ?? [];

  const verb = (type: string) => {
    switch (type) {
      case "COMMENT_REPLY": return t("repliedToYou");
      case "MENTION": return t("mentionedYou");
      case "REACTION": return t("reactedToYou");
      case "COMMENT_APPROVED": return t("commentApproved");
      case "MESSAGE": return t("sentMessage");
      default: return t("activity");
    }
  };

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
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className={n.readAt ? "" : "bg-ccm-sky/10"}>
                <div className="flex items-start gap-3 p-3">
                  <Avatar className="size-8 flex-shrink-0">
                    {n.actorImage && <AvatarImage src={n.actorImage} alt="" />}
                    <AvatarFallback>{(n.actorName ?? "?").slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm">
                      {n.actorName && <span className="font-medium"><bdi>{n.actorName}</bdi></span>}{" "}
                      {verb(n.type)}
                    </p>
                    {n.snippet && <p className="truncate text-xs text-muted-foreground">{n.snippet}</p>}
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
