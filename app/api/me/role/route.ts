import { NextResponse } from "next/server";
import { getActor, isStaff } from "@/lib/authz";

/** GET /api/me/role -> { isStaff } for conditionally showing staff-only nav. */
export async function GET() {
  const actor = await getActor();
  return NextResponse.json(
    { isStaff: isStaff(actor) },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
