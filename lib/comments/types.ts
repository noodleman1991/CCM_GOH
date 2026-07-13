import type { CommentTargetType } from "@/generated/prisma";

export const COMMENT_TARGET_TYPES: CommentTargetType[] = [
  "caseStudy",
  "newsPost",
  "livedExperience",
  "researchOutput",
  "event",
  "collaborationThread",
  "collaborationFile",
  "collaborationDoc",
];

export function isCommentTargetType(v: unknown): v is CommentTargetType {
  return typeof v === "string" && (COMMENT_TARGET_TYPES as string[]).includes(v);
}

/** The public shape returned to clients — never leaks authorEmail. */
export type CommentDTO = {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  parentId: string | null;
  depth: number;
  authorId: string | null;
  authorName: string | null;
  authorImage: string | null;
  body: string;
  status: "PENDING" | "VISIBLE" | "DELETED_BY_AUTHOR" | "REMOVED_BY_MOD";
  page: number | null;
  createdAt: string;
  editedAt: string | null;
  reactions: { emoji: string; count: number; mine: boolean }[];
  /** Whether the current viewer authored this comment. */
  mine: boolean;
};

export type CommentPage = {
  comments: CommentDTO[];
  nextCursor: string | null;
};

/** Cursor = base64 of `${createdAtISO}|${id}` for keyset (createdAt,id) DESC. */
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const [iso, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
    const createdAt = new Date(iso);
    if (!id || isNaN(createdAt.getTime())) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}
