"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, MessagesSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { createThread, renameThread } from "@/lib/actions/collaboration";
import { InlineText } from "@/components/ui/inline-text";
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
  const [title, setTitle] = useState("");

  const canEdit = myRole === "EDITOR" || myRole === "OWNER";
  const threads = data?.threads ?? [];

  const create = async () => {
    const t = title.trim();
    if (!t) return;
    setTitle("");
    const res = await createThread(collaborationId, t);
    if (!res.ok) { toast.error(res.error); return; }
    mutate();
  };

  const rename = async (threadId: string, next: string) => {
    const res = await renameThread(collaborationId, threadId, next);
    if (!res.ok) { toast.error(res.error); return; }
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
      {threads.length === 0 && !canEdit ? (
        <p className="text-sm text-muted-foreground">{t("noThreads")}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {threads.map((th) => (
            <li key={th.id} className="flex items-center gap-3 p-4 hover:bg-muted/50">
              <MessagesSquare className="size-4 flex-shrink-0 text-ccm-sea" aria-hidden="true" />
              {/* Inline rename for editors; click-to-open via the chevron/title area. */}
              {canEdit ? (
                <InlineText
                  value={th.title}
                  onCommit={(next) => rename(th.id, next)}
                  canEdit
                  as="span"
                  className="flex-1 font-medium"
                  placeholder={t("threadTitlePlaceholder")}
                />
              ) : (
                <button onClick={() => setOpen(th)} className="flex-1 text-start font-medium">
                  <bdi>{th.title}</bdi>
                </button>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(th.createdAt), { addSuffix: true })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setOpen(th)}>
                {t("open")}
              </Button>
            </li>
          ))}

          {/* Persistent inline add-row (Notion-style): type + Enter to create. */}
          {canEdit && (
            <li className="flex items-center gap-3 p-2">
              <Plus className="size-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("newThread")}
                maxLength={160}
                onKeyDown={(e) => e.key === "Enter" && create()}
                className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
