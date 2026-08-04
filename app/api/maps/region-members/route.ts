import { NextRequest, NextResponse } from "next/server";
import { getRegionMembers } from "@/lib/community/region-data";
import { isRegionCode, REGION_TO_RC_SLUG } from "@/lib/maps/region-codes";

export const runtime = "nodejs";

/** Preview cap: the strip is a teaser — the community page's members section
 *  is the full list. */
const PREVIEW_CAP = 12;

/**
 * GET /api/maps/region-members?region=<code>
 * The atlas spotlight's members strip. Public: `getRegionMembers` is already
 * privacy-filtered for public display (isSearchable + public profiles only).
 */
export async function GET(request: NextRequest) {
  const region = request.nextUrl.searchParams.get("region") ?? "";
  if (!isRegionCode(region)) {
    return NextResponse.json({ error: "Unknown region" }, { status: 400 });
  }
  const members = await getRegionMembers(REGION_TO_RC_SLUG[region]);
  return NextResponse.json(
    { total: members.length, members: members.slice(0, PREVIEW_CAP) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } }
  );
}
