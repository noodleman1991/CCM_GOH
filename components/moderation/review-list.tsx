"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RelativeTime } from "@/components/ui/relative-time";
import { approveComment, removeComment } from "@/lib/actions/moderation";
import { reviewSubmission } from "@/lib/actions/review";
import type { ReviewItem } from "@/lib/moderation/review-items";
import type { ModerationAction } from "@/payload/moderation/workflows";

const PRESETS = ["moreDetail", "offTopic", "duplicate", "consent"] as const;
const ACTION_LABEL: Record<ModerationAction, string> = { approve: "approve", revision: "askChanges", reject: "reject" };

/**
 * "Waiting for review" (editor-experience spec §3.7): member submissions and
 * held comments in one list, newest first, decided in place.
 */
export function ReviewList({ items }: { items: ReviewItem[] }) {
  const router = useRouter();
  const t = useTranslations("moderation.queue");
  const tComments = useTranslations("comments");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [noting, setNoting] = useState<{ key: string; action: ModerationAction } | null>(null);
  const [note, setNote] = useState("");

  const act = (key: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setDone((prev) => new Set(prev).add(key));
        setNoting(null);
        setNote("");
        toast.success(t("done"));
        router.refresh();
      } else {
        toast.error(res.error ?? t("failed"));
      }
    });
  };

  const visible = items.filter((i) => !done.has(i.key));
  if (visible.length === 0) return <p className="text-sm text-muted-foreground">{t("empty")}</p>;

  return (
    <div className="space-y-4">
      {visible.map((item) => (
        <Card key={item.key}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-ccm-sea/10 px-2 py-0.5 font-semibold text-ccm-sea">
                {t(`types.${item.kind === "comment" ? "comment" : item.collection}`)}
              </span>
              <span className="font-medium text-foreground">
                <bdi>
                  {item.kind === "comment"
                    ? (item.comment.authorName ?? tComments("anonymous"))
                    : (item.sender ?? t("unknownSender"))}
                </bdi>
              </span>
              <span>
                · <RelativeTime date={item.createdAt} />
              </span>
              {item.kind === "comment" && item.comment.reason && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">{item.comment.reason}</span>
              )}
            </div>

            {item.kind === "comment" ? (
              <>
                <p className="whitespace-pre-wrap break-words text-sm" dir="auto">{item.comment.body}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" disabled={pending} onClick={() => act(item.key, () => approveComment(item.comment.id))}>
                    {t("approve")}
                  </Button>
                  <Button size="sm" variant="destructive" disabled={pending} onClick={() => act(item.key, () => removeComment(item.comment.id))}>
                    {t("remove")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-3">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded media of unknown host
                    <img src={item.imageUrl} alt="" className="size-16 flex-none rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-ccm-midnight" dir="auto">{item.title}</p>
                    {item.summary && <p className="line-clamp-3 text-sm text-muted-foreground" dir="auto">{item.summary}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {item.actions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={action === "reject" ? "destructive" : action === "approve" ? "default" : "outline"}
                      disabled={pending}
                      onClick={() =>
                        item.notesRequired.includes(action)
                          ? setNoting({ key: item.key, action })
                          : act(item.key, () => reviewSubmission({ collection: item.collection, id: item.id, action }))
                      }
                    >
                      {t(ACTION_LABEL[action])}
                    </Button>
                  ))}
                  <a href={item.adminHref} className="ms-auto text-sm font-medium text-ccm-sea hover:underline">
                    {t("openInAdmin")}
                  </a>
                </div>
                {noting?.key === item.key && (
                  <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                    <label className="text-sm font-medium" htmlFor={`note-${item.key}`}>
                      {t("note")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className="rounded-full border bg-white px-2.5 py-1 text-xs hover:bg-muted"
                          onClick={() => setNote(t(`presets.${p}`))}
                        >
                          {t(`presets.${p}`)}
                        </button>
                      ))}
                    </div>
                    <textarea
                      id={`note-${item.key}`}
                      dir="auto"
                      className="min-h-20 w-full rounded-md border bg-white p-2 text-sm"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={pending || note.trim().length === 0}
                        onClick={() =>
                          act(item.key, () => reviewSubmission({ collection: item.collection, id: item.id, action: noting.action, reviewNotes: note.trim() }))
                        }
                      >
                        {t("send")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setNoting(null); setNote(""); }}>
                        {t("cancel")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
