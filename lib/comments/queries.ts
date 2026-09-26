import "server-only";
import { prisma, safeQuery } from "@/lib/prisma";
import type { CommentTargetType, Prisma } from "@/generated/prisma";
import {
  type CommentDTO,
  type CommentPage,
  encodeCursor,
  decodeCursor,
} from "./types";

const PAGE_SIZE = 20;

/**
 * List comments for a target, newest-first, keyset-paginated on (createdAt, id).
 * Returns VISIBLE comments for everyone, plus the viewer's own PENDING ones
 * (so an author sees "held for review" immediately). Reaction counts are
 * aggregated; `mine` flags are resolved for the viewer. Degrades to an empty
 * page on DB failure (via safeQuery) so the host page never 500s.
 */
export async function listComments(params: {
  targetType: CommentTargetType;
  targetId: string;
  viewerId: string | null;
  cursor?: string | null;
}): Promise<CommentPage> {
  const { targetType, targetId, viewerId } = params;
  const cursor = params.cursor ? decodeCursor(params.cursor) : null;

  const result = await safeQuery(async () => {
    const visibility: Prisma.CommentWhereInput = viewerId
      ? { OR: [{ status: "VISIBLE" }, { status: "PENDING", authorId: viewerId }] }
      : { status: "VISIBLE" };

    const where: Prisma.CommentWhereInput = {
      targetType,
      targetId,
      ...visibility,
      ...(cursor
        ? {
            OR: [
              { createdAt: { lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, id: { lt: cursor.id } },
            ],
          }
        : {}),
    };

    const rows = await prisma.comment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      include: {
        author: { select: { id: true, username: true, firstName: true, lastName: true, image: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    const comments: CommentDTO[] = page.map((c) => {
      const counts = new Map<string, { count: number; mine: boolean }>();
      for (const r of c.reactions) {
        const cur = counts.get(r.emoji) ?? { count: 0, mine: false };
        cur.count += 1;
        if (viewerId && r.userId === viewerId) cur.mine = true;
        counts.set(r.emoji, cur);
      }
      const displayName =
        c.author
          ? [c.author.firstName, c.author.lastName].filter(Boolean).join(" ") ||
            c.author.username ||
            null
          : c.authorName;

      return {
        id: c.id,
        targetType: c.targetType,
        targetId: c.targetId,
        parentId: c.parentId,
        depth: c.depth,
        authorId: c.authorId,
        authorName: displayName,
        authorImage: c.author?.image ?? null,
        body: c.status === "VISIBLE" || c.authorId === viewerId ? c.body : "",
        bodyRich: c.status === "VISIBLE" || c.authorId === viewerId ? c.bodyRich : null,
        status: c.status,
        page: c.page,
        createdAt: c.createdAt.toISOString(),
        editedAt: c.updatedAt > c.createdAt ? c.updatedAt.toISOString() : null,
        reactions: [...counts.entries()].map(([emoji, v]) => ({ emoji, count: v.count, mine: v.mine })),
        mine: !!viewerId && c.authorId === viewerId,
      };
    });

    const last = page[page.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;
    return { comments, nextCursor };
  });

  if (!result.success) return { comments: [], nextCursor: null };
  return result.data;
}

/** Count of VISIBLE comments for a target (for the "Discussion (N)" header). */
export async function countVisibleComments(
  targetType: CommentTargetType,
  targetId: string
): Promise<number> {
  const result = await safeQuery(() =>
    prisma.comment.count({ where: { targetType, targetId, status: "VISIBLE" } })
  );
  return result.success ? result.data : 0;
}
