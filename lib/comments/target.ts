import "server-only";
import { client } from "@/sanity/lib/client";
import { prisma, safeQuery } from "@/lib/prisma";
import type { CommentTargetType } from "@/generated/prisma";

/**
 * Validate at WRITE time that a comment target exists AND is publicly
 * commentable, re-asserting the public predicate (e.g. caseStudy must be
 * `status == "approved"`). This guards against the ISR staleness window and a
 * client aiming the polymorphic targetId at an arbitrary document.
 *
 * Sanity-backed targets are checked via a targeted existence GROQ; Postgres
 * targets (collaboration threads/files) are checked in the DB.
 *
 * Results are cached briefly in-process to blunt repeated lookups from the same
 * target (and to limit Sanity load from anonymous traffic). Rate limiting must
 * run BEFORE calling this.
 */

type CacheEntry = { ok: boolean; at: number };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000;

const SANITY_PREDICATE: Partial<Record<CommentTargetType, string>> = {
  caseStudy: '_type == "caseStudy" && status == "approved"',
  newsPost: '_type == "newsPost"',
  livedExperience: '_type == "livedExperience" && (status == "approved" || !defined(status))',
};

/** Postgres table name for each workspace (membership-gated) target type. */
const WORKSPACE_TARGET_TABLE: Record<
  "collaborationThread" | "collaborationFile" | "collaborationDoc",
  string
> = {
  collaborationThread: "CollaborationThread",
  collaborationFile: "CollaborationFile",
  collaborationDoc: "CollaborationDoc",
};

export async function isCommentTargetValid(
  targetType: CommentTargetType,
  targetId: string
): Promise<boolean> {
  const cacheKey = `${targetType}:${targetId}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.ok;

  let ok = false;

  const predicate = SANITY_PREDICATE[targetType];
  if (predicate) {
    try {
      const count: number = await client.fetch(
        `count(*[${predicate} && _id == $id])`,
        { id: targetId }
      );
      ok = count > 0;
    } catch {
      ok = false;
    }
  } else if (
    targetType === "collaborationThread" ||
    targetType === "collaborationFile" ||
    targetType === "collaborationDoc"
  ) {
    // Collaboration tables exist; raw-SQL lookups retained here. Typed Prisma
    // delegates are a possible follow-up. For now, the membership check at the
    // call site gates access; this validates existence only.
    const table = WORKSPACE_TARGET_TABLE[targetType];
    const r = await safeQuery(async () => {
      try {
        const rows = await prisma.$queryRawUnsafe<{ n: bigint }[]>(
          `SELECT count(*)::bigint AS n FROM "${table}" WHERE "id" = $1`,
          targetId
        );
        return Number(rows[0]?.n ?? 0);
      } catch {
        return 0; // table not present yet
      }
    });
    ok = r.success && r.data > 0;
  }

  cache.set(cacheKey, { ok, at: Date.now() });
  return ok;
}

/** Resolve the parent collaboration id for a thread/file/doc target (for authz). */
export async function collaborationIdForTarget(
  targetType: "collaborationThread" | "collaborationFile" | "collaborationDoc",
  targetId: string
): Promise<string | null> {
  const table = WORKSPACE_TARGET_TABLE[targetType];
  const r = await safeQuery(async () => {
    try {
      const rows = await prisma.$queryRawUnsafe<{ collaborationId: string }[]>(
        `SELECT "collaborationId" FROM "${table}" WHERE "id" = $1 LIMIT 1`,
        targetId
      );
      return rows[0]?.collaborationId ?? null;
    } catch {
      return null;
    }
  });
  return r.success ? r.data : null;
}
