"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { approveComment, removeComment, dismissReports } from "@/lib/actions/moderation";
import type { QueueItem, QueueTab } from "@/lib/comments/moderation-queue";

const TABS: { id: QueueTab; label: string }[] = [
  { id: "pending", label: "Pending (anon)" },
  { id: "flagged", label: "Flagged" },
  { id: "reported", label: "Reported" },
];

export function ModerationQueue({
  tab,
  items,
  counts,
}: {
  tab: QueueTab;
  items: QueueItem[];
  counts: Record<QueueTab, number>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<Set<string>>(new Set());

  const act = (id: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setDone((prev) => new Set(prev).add(id));
        toast.success("Done");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed");
      }
    });
  };

  const visible = items.filter((i) => !done.has(i.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b" role="tablist">
        {TABS.map((tdef) => (
          <Link
            key={tdef.id}
            href={`/moderation?tab=${tdef.id}`}
            className={
              "border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
              (tab === tdef.id
                ? "border-ccm-sea text-ccm-sea"
                : "border-transparent text-muted-foreground hover:text-foreground")
            }
          >
            {tdef.label}
            <span className="ms-2 rounded-full bg-muted px-2 py-0.5 text-xs">{counts[tdef.id]}</span>
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to review here.</p>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    <bdi>{item.authorName ?? "Anonymous"}</bdi>
                  </span>
                  <span>· {item.targetType}</span>
                  <span>· {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  {item.reason && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{item.reason}</span>
                  )}
                  {item.reportCount > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">
                      {item.reportCount} report{item.reportCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{item.body}</p>
                <div className="flex flex-wrap gap-2">
                  {tab !== "reported" && (
                    <Button size="sm" disabled={pending} onClick={() => act(item.id, () => approveComment(item.id))}>
                      Approve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => act(item.id, () => removeComment(item.id))}
                  >
                    Remove
                  </Button>
                  {tab === "reported" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() => act(item.id, () => dismissReports(item.id))}
                    >
                      Dismiss report
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
