import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listComments } from "@/lib/comments/queries";
import { isCommentTargetType } from "@/lib/comments/types";
import { collaborationIdForTarget } from "@/lib/comments/target";
import { authorizeCollab } from "@/lib/collaboration/service";

/**
 * GET /api/comments?targetType=&targetId=&cursor=
 * Anonymous-readable for Sanity-backed targets. Returns VISIBLE comments
 * (+ the viewer's own PENDING), keyset-paginated. Never throws to the client
 * — degrades to an empty page.
 *
 * Workspace targets (collaborationThread/File/Doc) are membership-gated: the
 * comment thread is only as visible as the workspace itself, so a non-member
 * of a MEMBERS-visibility workspace must not be able to read its comments by
 * guessing the target id.
 */
export async function GET(req: NextRequest) {
  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");
  const cursor = req.nextUrl.searchParams.get("cursor");

  if (!isCommentTargetType(targetType) || !targetId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  if (
    targetType === "collaborationThread" ||
    targetType === "collaborationFile" ||
    targetType === "collaborationDoc"
  ) {
    const collaborationId = await collaborationIdForTarget(targetType, targetId);
    if (!collaborationId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    try {
      await authorizeCollab(collaborationId, "collab:read");
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { userId } = await auth();
  const page = await listComments({ targetType, targetId, viewerId: userId ?? null, cursor });

  return NextResponse.json(page, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
