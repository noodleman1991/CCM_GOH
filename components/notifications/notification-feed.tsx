"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export type Notif = {
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

/** Human verb for a notification type (shared by the bell + the inbox tab). */
export function useNotificationVerb() {
  const t = useTranslations("notifications");
  return (type: string) => {
    switch (type) {
      case "COMMENT_REPLY": return t("repliedToYou");
      case "MENTION": return t("mentionedYou");
      case "REACTION": return t("reactedToYou");
      case "COMMENT_APPROVED": return t("commentApproved");
      case "MESSAGE": return t("sentMessage");
      default: return t("activity");
    }
  };
}

/**
 * The notifications list, shared between the bell dropdown and the Inbox's
 * Notifications tab. In the inbox it marks everything read on mount; in the
 * compact bell that's handled on open.
 */
export function NotificationFeed({
  markReadOnMount = false,
  className,
}: {
  markReadOnMount?: boolean;
  className?: string;
}) {
  const t = useTranslations("notifications");
  const verb = useNotificationVerb();
  const { data, mutate } = useSWR("/api/notifications", fetcher, {
    refreshInterval: 60_000,
    refreshWhenHidden: false,
  });
  const items = data?.notifications ?? [];

  useEffect(() => {
    if (markReadOnMount && (data?.unread ?? 0) > 0) {
      markNotificationsRead().then(() => mutate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markReadOnMount, data?.unread]);

  if (items.length === 0) {
    return <p className={cn("p-6 text-center text-sm text-muted-foreground", className)}>{t("empty")}</p>;
  }

  return (
    <ul className={cn("divide-y", className)}>
      {items.map((n) => (
        <li key={n.id} className={n.readAt ? "" : "bg-ccm-sky/10"}>
          <div className="flex items-start gap-3 p-4">
            <Avatar className="size-9 shrink-0">
              {n.actorImage && <AvatarImage src={n.actorImage} alt="" />}
              <AvatarFallback>{(n.actorName ?? "?").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                {n.actorName && <span className="font-medium"><bdi>{n.actorName}</bdi></span>}{" "}
                {verb(n.type)}
              </p>
              {n.snippet && <p className="truncate text-xs text-muted-foreground">{n.snippet}</p>}
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
