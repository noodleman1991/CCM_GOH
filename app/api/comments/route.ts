import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listComments } from "@/lib/comments/queries";
import { isCommentTargetType } from "@/lib/comments/types";

/**
 * GET /api/comments?targetType=&targetId=&cursor=
 * Anonymous-readable. Returns VISIBLE comments (+ the viewer's own PENDING),
 * keyset-paginated. Never throws to the client — degrades to an empty page.
 */
export async function GET(req: NextRequest) {
  const targetType = req.nextUrl.searchParams.get("targetType");
  const targetId = req.nextUrl.searchParams.get("targetId");
  const cursor = req.nextUrl.searchParams.get("cursor");

  if (!isCommentTargetType(targetType) || !targetId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const { userId } = await auth();
  const page = await listComments({ targetType, targetId, viewerId: userId ?? null, cursor });

  return NextResponse.json(page, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
