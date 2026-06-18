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
  } else if (targetType === "collaborationThread" || targetType === "collaborationFile") {
    // Collaboration tables land in a later migration. Until then these targets
    // are validated by the collaboration membership check at the call site;
    // here we resolve them via a raw count so this module needs no generated
    // model that may not exist yet.
    const table = targetType === "collaborationThread" ? "CollaborationThread" : "CollaborationFile";
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
