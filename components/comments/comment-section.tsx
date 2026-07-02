"use client";

import { useState, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import { postComment, toggleReaction, deleteComment, reportComment } from "@/lib/actions/comments";
import type { CommentDTO, CommentPage } from "@/lib/comments/types";
import type { CommentTargetType } from "@/generated/prisma";

const fetcher = (url: string) =>
  fetch(url).then((r) =>
    r.ok
      ? (r.json() as Promise<CommentPage>)
      : Promise.resolve({ comments: [], nextCursor: null })
  );

type Props = {
  targetType: CommentTargetType;
  targetId: string;
  /** Whether the viewer is signed in (drives anon name field + Turnstile). */
  isSignedIn: boolean;
};

export function CommentSection({ targetType, targetId, isSignedIn }: Props) {
  const t = useTranslations("comments");

  const getKey = (index: number, prev: CommentPage | null) => {
    if (prev && !prev.nextCursor) return null;
    const base = `/api/comments?targetType=${targetType}&targetId=${encodeURIComponent(targetId)}`;
    return index === 0 ? base : `${base}&cursor=${encodeURIComponent(prev!.nextCursor!)}`;
  };

  const { data, size, setSize, mutate, isLoading } = useSWRInfinite<CommentPage>(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  });

  const pages = data ?? [];
  const comments = pages.flatMap((p) => p.comments);
  const hasMore = pages.length > 0 ? !!pages[pages.length - 1].nextCursor : false;
  const topLevel = comments.filter((c) => c.depth === 0);
  const repliesByParent = new Map<string, CommentDTO[]>();
  for (const c of comments) {
    if (c.parentId) {
      const arr = repliesByParent.get(c.parentId) ?? [];
      arr.push(c);
      repliesByParent.set(c.parentId, arr);
    }
  }

  return (
    <section className="mt-12 border-t pt-8" aria-label={t("heading")}>
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-heading font-bold text-ccm-midnight">
        <MessageCircle className="size-6 text-ccm-sea" aria-hidden="true" />
        {t("heading")}
      </h2>

      <Composer
        targetType={targetType}
        targetId={targetId}
        isSignedIn={isSignedIn}
        onPosted={() => mutate()}
      />

      <div className="mt-8 space-y-6">
        {isLoading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
        {!isLoading && topLevel.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        )}
        {topLevel.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            replies={repliesByParent.get(c.id) ?? []}
            targetType={targetType}
            targetId={targetId}
            isSignedIn={isSignedIn}
            onChanged={() => mutate()}
          />
        ))}
        {hasMore && (
          <Button variant="outline" onClick={() => setSize(size + 1)} className="w-full">
            {t("loadMore")}
          </Button>
        )}
      </div>
    </section>
  );
}

function Composer({
  targetType,
  targetId,
  parentId,
  isSignedIn,
  onPosted,
}: {
  targetType: CommentTargetType;
  targetId: string;
  parentId?: string;
  isSignedIn: boolean;
  onPosted: () => void;
}) {
  const t = useTranslations("comments");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  const submit = useCallback(async () => {
    if (!body.trim()) return;
    setPending(true);
    try {
      // Turnstile token would be collected here when configured; the server
      // fails closed if anonymous + no token.
      const res = await postComment({
        targetType,
        targetId,
        parentId,
        body,
        ...(isSignedIn ? {} : { authorName: name }),
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setName("");
      toast.success(res.held ? t("heldForReview") : t("posted"));
      onPosted();
    } finally {
      setPending(false);
    }
  }, [body, name, parentId, targetType, targetId, isSignedIn, onPosted, t]);

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {!isSignedIn && (
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          maxLength={80}
          aria-label={t("namePlaceholder")}
        />
      )}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? t("replyPlaceholder") : t("placeholder")}
        rows={3}
        maxLength={4000}
      />
      <div className="flex items-center justify-between gap-2">
        {!isSignedIn && <p className="text-xs text-muted-foreground">{t("anonNotice")}</p>}
        <Button onClick={submit} disabled={pending || !body.trim()} className="ms-auto">
          {parentId ? t("reply") : t("post")}
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  targetType,
  targetId,
  isSignedIn,
  onChanged,
}: {
  comment: CommentDTO;
  replies: CommentDTO[];
  targetType: CommentTargetType;
  targetId: string;
  isSignedIn: boolean;
  onChanged: () => void;
}) {
  const t = useTranslations("comments");
  const [replying, setReplying] = useState(false);

  const isTombstone = comment.status === "DELETED_BY_AUTHOR";
  const isPending = comment.status === "PENDING";

  const react = async () => {
    if (!isSignedIn) return toast.error(t("signInToReact"));
    await toggleReaction(comment.id, "👍");
    onChanged();
  };
  const remove = async () => {
    const res = await deleteComment(comment.id);
    if (res.ok) onChanged();
    else toast.error(res.error ?? "");
  };
  const report = async () => {
    if (!isSignedIn) return toast.error(t("signInToReport"));
    await reportComment(comment.id, "reported from thread");
    toast.success(t("reported"));
  };

  const thumbs = comment.reactions.find((r) => r.emoji === "👍");

  return (
    <article className="space-y-2">
      <div className="flex items-start gap-3">
        <Avatar className="size-9 flex-shrink-0">
          {comment.authorImage && <AvatarImage src={comment.authorImage} alt="" />}
          <AvatarFallback>{(comment.authorName ?? "?").slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-semibold text-ccm-midnight">
              <bdi>{comment.authorName ?? t("anonymous")}</bdi>
            </span>
            <span className="ms-2 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {isPending && (
              <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                {t("pending")}
              </span>
            )}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground/90">
            {isTombstone ? <span className="italic text-muted-foreground">{t("deleted")}</span> : comment.body}
          </p>
          {!isTombstone && (
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <button onClick={react} className="hover:text-ccm-sea">
                👍 {thumbs?.count ? thumbs.count : ""}
              </button>
              {comment.depth === 0 && (
                <button onClick={() => setReplying((v) => !v)} className="hover:text-ccm-sea">
                  {t("reply")}
                </button>
              )}
              {comment.mine && (
                <button onClick={remove} className="hover:text-destructive">
                  {t("delete")}
                </button>
              )}
              {!comment.mine && isSignedIn && (
                <button onClick={report} className="hover:text-destructive">
                  {t("report")}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {replying && (
        <div className="ms-12">
          <Composer
            targetType={targetType}
            targetId={targetId}
            parentId={comment.id}
            isSignedIn={isSignedIn}
            onPosted={() => {
              setReplying(false);
              onChanged();
            }}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ms-12 space-y-3 border-s ps-4">
          {replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              replies={[]}
              targetType={targetType}
              targetId={targetId}
              isSignedIn={isSignedIn}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </article>
  );
}
