"use client";

import useSWR from "swr";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/lib/actions/notifications";
import { respondToJoinByTarget, respondToInviteByTarget, respondToContactByTarget } from "@/lib/actions/requests";
import { cn } from "@/lib/utils";

export type Notif = {
  id: string;
  type: string;
  actorId: string | null;
  actorName: string | null;
  actorImage: string | null;
  entityType: string | null;
  entityId: string | null;
  snippet: string | null;
  readAt: string | null;
  createdAt: string;
};

/** An actionable, still-open request notification (Accept/Decline shown). */
const ACTIONABLE_ENTITY = new Set(["joinRequest", "contactRequest", "collaborationInvite"]);
function isActionableRequest(n: Notif): boolean {
  return n.type === "REQUEST" && !!n.entityType && ACTIONABLE_ENTITY.has(n.entityType);
}

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
      case "REQUEST": return t("sentRequest");
      // Lifecycle spine (X3)
      case "TASK_ASSIGNED": return t("assignedYouTask");
      case "TASK_DUE": return t("taskDue");
      case "OUTPUT_STATUS": return t("outputStatus");
      case "THREAD_REPLY": return t("threadReply");
      case "MEMBER_JOINED": return t("memberJoined");
      case "FOLLOWED_PUBLISH": return t("followedPublish");
      case "EVENT_REMINDER": return t("eventReminder");
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
  // Requests acted on this session — hide their Accept/Decline immediately.
  const [resolved, setResolved] = useState<Record<string, "ACCEPTED" | "DECLINED">>({});

  useEffect(() => {
    if (markReadOnMount && (data?.unread ?? 0) > 0) {
      markNotificationsRead().then(() => mutate());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markReadOnMount, data?.unread]);

  if (items.length === 0) {
    return <p className={cn("p-6 text-center text-sm text-muted-foreground", className)}>{t("empty")}</p>;
  }

  // Three groups (spec §4.16): actionable Requests first, then recency buckets.
  const requests = items.filter(isActionableRequest);
  const rest = items.filter((n) => !isActionableRequest(n));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today: Notif[] = [];
  const earlier: Notif[] = [];
  for (const n of rest) {
    (new Date(n.createdAt) >= startOfToday ? today : earlier).push(n);
  }
  const groups: { key: string; label: string; items: Notif[] }[] = [
    { key: "requests", label: t("requests"), items: requests },
    { key: "today", label: t("today"), items: today },
    { key: "earlier", label: t("earlier"), items: earlier },
  ].filter((g) => g.items.length > 0);

  const respond = async (n: Notif, accept: boolean) => {
    const res =
      n.entityType === "joinRequest" && n.entityId && n.actorId
        ? await respondToJoinByTarget(n.entityId, n.actorId, accept)
        : n.entityType === "contactRequest" && n.actorId
          ? await respondToContactByTarget(n.actorId, accept)
          : n.entityType === "collaborationInvite" && n.entityId
            ? await respondToInviteByTarget(n.entityId, accept)
            : ({ ok: false, error: "Can't act on this request." } as const);
    if (res.ok) {
      setResolved((r) => ({ ...r, [n.id]: accept ? "ACCEPTED" : "DECLINED" }));
    } else {
      toast.error(res.error);
    }
    // Always refetch: on success to pick up the now-resolved row, and on error
    // (e.g. "Already resolved.") to drop a stale row the server has since closed.
    mutate();
  };

  const row = (n: Notif) => {
    const actionable = isActionableRequest(n);
    const decided = resolved[n.id];
    return (
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
            {actionable && (
              decided ? (
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {decided === "ACCEPTED" ? t("accepted") : t("declined")}
                </p>
              ) : (
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => respond(n, true)}>{t("accept")}</Button>
                  <Button size="sm" variant="outline" onClick={() => respond(n, false)}>{t("decline")}</Button>
                </div>
              )
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className={className}>
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="bg-muted/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {g.label}
          </h3>
          <ul className="divide-y">{g.items.map(row)}</ul>
        </section>
      ))}
    </div>
  );
}
