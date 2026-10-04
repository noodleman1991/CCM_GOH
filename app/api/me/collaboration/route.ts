import { NextResponse } from "next/server";
import { getActor } from "@/lib/authz";
import { getCollaborationAccessFor } from "@/lib/collaboration/access-server";

/** GET /api/me/collaboration → what this viewer may use (Settings → Collaboration × their role). */
export async function GET() {
  const access = await getCollaborationAccessFor(await getActor());
  return NextResponse.json(access, { headers: { "Cache-Control": "private, max-age=60" } });
}
