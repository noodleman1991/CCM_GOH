"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, MessagesSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createThread } from "@/lib/actions/collaboration";
import { CommentSection } from "@/components/comments/comment-section";
import type { CollaborationRole } from "@/generated/prisma";

type Thread = { id: string; title: string; createdAt: string };
const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ threads: Thread[] }>);

export function WorkspaceThreads({
  collaborationId,
  myRole,
  isSignedIn,
}: {
  collaborationId: string;
  myRole: CollaborationRole | null;
  isSignedIn: boolean;
}) {
  const t = useTranslations("collaboration");
  const { data, mutate } = useSWR(`/api/collaborations/${collaborationId}/threads`, fetcher, {
    revalidateOnFocus: false,
  });
  const [open, setOpen] = useState<Thread | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  const canEdit = myRole === "EDITOR" || myRole === "OWNER";
  const threads = data?.threads ?? [];

  const create = async () => {
    if (!title.trim()) return;
    const res = await createThread(collaborationId, title);
    if (!res.ok) return toast.error(res.error);
    setTitle("");
    setCreating(false);
    mutate();
  };

  if (open) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setOpen(null)}>
          <ArrowLeft className="size-4 me-2 rtl:-scale-x-100" />
          {t("backToThreads")}
        </Button>
        <h2 className="text-xl font-heading font-semibold text-ccm-midnight">
          <bdi>{open.title}</bdi>
        </h2>
        {/* Reuse the polymorphic comment engine for thread discussion */}
        <CommentSection targetType="collaborationThread" targetId={open.id} isSignedIn={isSignedIn} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          {creating ? (
            <div className="flex gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("threadTitlePlaceholder")}
                maxLength={160}
                onKeyDown={(e) => e.key === "Enter" && create()}
              />
              <Button onClick={create} disabled={!title.trim()}>
                {t("createThread")}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setCreating(true)}>
              <Plus className="size-4 me-2" />
              {t("newThread")}
            </Button>
          )}
        </div>
      )}

      {threads.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noThreads")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {threads.map((th) => (
            <li key={th.id}>
              <button
                onClick={() => setOpen(th)}
                className="flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-muted"
              >
                <MessagesSquare className="size-4 flex-shrink-0 text-ccm-sea" aria-hidden="true" />
                <span className="flex-1 font-medium">
                  <bdi>{th.title}</bdi>
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(th.createdAt), { addSuffix: true })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
