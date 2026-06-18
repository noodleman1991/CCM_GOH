"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/authz";
import { assertRateLimit, RateLimitError } from "@/lib/rate-limit";
import { isCommentTargetValid } from "@/lib/comments/target";
import { moderateBody } from "@/lib/comments/moderation";
import { verifyTurnstile, turnstileConfigured } from "@/lib/turnstile";
import { isCommentTargetType } from "@/lib/comments/types";
import { parseMentions } from "@/lib/comments/mentions";
import { createNotification } from "@/lib/notifications/service";
import type { CommentStatus } from "@/generated/prisma";

/**
 * Best-effort engagement fan-out after a visible comment is created:
 *  - resolve @mentions to users, store Mention rows, notify them
 *  - notify the parent comment's author of a reply
 */
async function fanOutEngagement(params: {
  commentId: string;
  authorId: string;
  body: string;
  parentId: string | null;
}): Promise<void> {
  // Mentions
  const usernames = parseMentions(params.body);
  if (usernames.length > 0) {
    const users = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { id: true },
    });
    for (const u of users) {
      if (u.id === params.authorId) continue;
      await prisma.mention.create({
        data: { commentId: params.commentId, mentionedUserId: u.id },
      }).catch(() => {}); // unique [commentId, mentionedUserId]
      await createNotification({
        recipientId: u.id,
        type: "MENTION",
        actorId: params.authorId,
        entityType: "comment",
        entityId: params.commentId,
        snippet: params.body.slice(0, 280),
      });
    }
  }

  // Reply notification to the parent author
  if (params.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: params.parentId },
      select: { authorId: true },
    });
    if (parent?.authorId && parent.authorId !== params.authorId) {
      await createNotification({
        recipientId: parent.authorId,
        type: "COMMENT_REPLY",
        actorId: params.authorId,
        entityType: "comment",
        entityId: params.commentId,
        snippet: params.body.slice(0, 280),
      });
    }
  }
}

const baseSchema = z.object({
  targetType: z.string().refine(isCommentTargetType, "Invalid target type"),
  targetId: z.string().min(1).max(256),
  parentId: z.string().cuid().optional(),
  body: z.string().trim().min(1, "Comment cannot be empty").max(4000),
  page: z.number().int().positive().optional(),
  // Anonymous-only fields:
  authorName: z.string().trim().min(1).max(80).optional(),
  authorEmail: z.string().email().max(160).optional(),
  turnstileToken: z.string().optional(),
});

export type PostCommentInput = z.infer<typeof baseSchema>;

export type PostCommentResult =
  | { ok: true; status: CommentStatus; id: string; held: boolean }
  | { ok: false; error: string; code?: "RATE_LIMIT" | "BLOCKED" | "TURNSTILE" | "TARGET" | "VALIDATION" | "DEPTH" };

/**
 * Post a comment. Pipeline:
 *  1. validate input
 *  2. rate-limit (anon ≪ authed) BEFORE any external call
 *  3. anonymous → require Turnstile (fail closed if unconfigured)
 *  4. validate the target is public (GROQ/DB), cached
 *  5. enforce one-level nesting
 *  6. wordlist: block → REMOVED_BY_MOD (never shown); review/anon → PENDING; else VISIBLE
 */
export async function postComment(input: PostCommentInput): Promise<PostCommentResult> {
  const parsed = baseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION" };
  }
  const data = parsed.data;

  const actor = await getActor();
  const isAnon = !actor;

  // 2. rate-limit
  const actorKey = actor?.id ?? `anon:${(data.authorEmail ?? data.authorName ?? "unknown").toLowerCase()}`;
  try {
    await assertRateLimit(actorKey, "comment:create", {
      limit: isAnon ? 3 : 20,
      windowSeconds: isAnon ? 600 : 300,
    });
  } catch (e) {
    if (e instanceof RateLimitError) return { ok: false, error: "Too many comments — please wait a bit.", code: "RATE_LIMIT" };
    throw e;
  }

  // 3. anonymous gate
  if (isAnon) {
    if (!data.authorName) return { ok: false, error: "Please add your name.", code: "VALIDATION" };
    if (!turnstileConfigured()) {
      return { ok: false, error: "Anonymous commenting is currently unavailable. Please sign in.", code: "TURNSTILE" };
    }
    const human = await verifyTurnstile(data.turnstileToken);
    if (!human) return { ok: false, error: "Verification failed. Please try again.", code: "TURNSTILE" };
  }

  // 4. target validity
  const validTarget = await isCommentTargetValid(data.targetType as any, data.targetId);
  if (!validTarget) return { ok: false, error: "This content is no longer available for comments.", code: "TARGET" };

  // 5. one-level nesting
  let depth = 0;
  if (data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: data.parentId },
      select: { depth: true, targetType: true, targetId: true },
    });
    if (!parent || parent.targetType !== data.targetType || parent.targetId !== data.targetId) {
      return { ok: false, error: "Invalid reply target.", code: "TARGET" };
    }
    if (parent.depth >= 1) {
      return { ok: false, error: "Replies can only go one level deep.", code: "DEPTH" };
    }
    depth = 1;
  }

  // 6. moderation
  const verdict = await moderateBody(data.body);
  let status: CommentStatus;
  if (verdict.tier === "block") {
    status = "REMOVED_BY_MOD";
  } else if (isAnon || verdict.tier === "review") {
    status = "PENDING";
  } else {
    status = "VISIBLE";
  }

  const created = await prisma.comment.create({
    data: {
      targetType: data.targetType as any,
      targetId: data.targetId,
      parentId: data.parentId ?? null,
      depth,
      authorId: actor?.id ?? null,
      authorName: isAnon ? data.authorName : null,
      authorEmail: isAnon ? data.authorEmail ?? null : null,
      body: data.body,
      status,
      page: data.page ?? null,
      flags:
        verdict.tier === "block"
          ? { create: { reason: "BLOCKWORD", term: verdict.term } }
          : verdict.tier === "review"
            ? { create: { reason: "WORDLIST", term: verdict.term } }
            : undefined,
    },
    select: { id: true, status: true },
  });

  // A blocked comment is silently dropped from the author's view too — tell them
  // it didn't meet guidelines rather than confirming a post.
  if (created.status === "REMOVED_BY_MOD") {
    return { ok: false, error: "Your comment couldn't be posted as it may violate the community guidelines.", code: "BLOCKED" };
  }

  // Engagement: mentions + reply notifications (only for visible comments, and
  // only for signed-in authors — anonymous comments don't notify). Best-effort.
  if (created.status === "VISIBLE" && actor) {
    await fanOutEngagement({
      commentId: created.id,
      authorId: actor.id,
      body: data.body,
      parentId: data.parentId ?? null,
    }).catch(() => {});
  }

  return {
    ok: true,
    id: created.id,
    status: created.status,
    held: created.status === "PENDING",
  };
}

// --- edit / delete / react / report ------------------------------------------

export async function editComment(
  id: string,
  body: string
): Promise<{ ok: true; held: boolean } | { ok: false; error: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to edit." };
  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 4000) return { ok: false, error: "Invalid length." };

  const existing = await prisma.comment.findUnique({ where: { id }, select: { authorId: true, status: true } });
  if (!existing || existing.authorId !== actor.id) return { ok: false, error: "Not permitted." };
  if (existing.status === "REMOVED_BY_MOD" || existing.status === "DELETED_BY_AUTHOR") {
    return { ok: false, error: "This comment can no longer be edited." };
  }

  // Re-run the wordlist on edit so an approved comment can't be edited into an
  // abusive one.
  const verdict = await moderateBody(trimmed);
  if (verdict.tier === "block") return { ok: false, error: "Your edit may violate the community guidelines." };
  const newStatus = verdict.tier === "review" ? "PENDING" : existing.status;

  await prisma.comment.update({
    where: { id },
    data: {
      body: trimmed,
      status: newStatus,
      ...(verdict.tier === "review" ? { flags: { create: { reason: "WORDLIST", term: verdict.term } } } : {}),
    },
  });
  return { ok: true, held: newStatus === "PENDING" };
}

export async function deleteComment(id: string): Promise<{ ok: boolean; error?: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in." };
  const c = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, _count: { select: { replies: true } } },
  });
  if (!c || c.authorId !== actor.id) return { ok: false, error: "Not permitted." };

  if (c._count.replies > 0) {
    // Tombstone: keep the row so the thread stays intact.
    await prisma.comment.update({ where: { id }, data: { status: "DELETED_BY_AUTHOR", body: "" } });
  } else {
    await prisma.comment.delete({ where: { id } });
  }
  return { ok: true };
}

export async function toggleReaction(
  commentId: string,
  emoji: string
): Promise<{ ok: boolean; error?: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to react." };
  if (emoji.length > 8) return { ok: false, error: "Invalid." };

  const existing = await prisma.reaction.findUnique({
    where: { commentId_userId_emoji: { commentId, userId: actor.id, emoji } },
  });
  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { commentId, userId: actor.id, emoji } });
    // Notify the comment author (best-effort, skips self).
    const c = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });
    if (c?.authorId) {
      await createNotification({
        recipientId: c.authorId,
        type: "REACTION",
        actorId: actor.id,
        entityType: "comment",
        entityId: commentId,
      }).catch(() => {});
    }
  }
  return { ok: true };
}

export async function reportComment(
  commentId: string,
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  const actor = await getActor();
  if (!actor) return { ok: false, error: "Sign in to report." };
  try {
    await prisma.commentReport.create({
      data: { commentId, reporterId: actor.id, reason: reason.slice(0, 500) },
    });
  } catch {
    // unique [commentId, reporterId] — already reported; treat as success.
  }
  return { ok: true };
}
