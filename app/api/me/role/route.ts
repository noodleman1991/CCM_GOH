import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";
import { getReviewCount } from "@/lib/moderation/review-queue";

/** GET /api/me/role -> { isStaff, reviewCount } for the staff-only nav and its "waiting for review" badge. */
export async function GET() {
  const actor = await getActor();
  const staff = isStaff(actor);
  return NextResponse.json(
    { isStaff: staff, reviewCount: staff ? await getReviewCount().catch(() => 0) : 0 },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
