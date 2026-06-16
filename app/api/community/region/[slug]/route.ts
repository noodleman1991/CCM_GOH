import { NextRequest, NextResponse } from "next/server";
import { getRegionMembers } from "@/lib/community/region-data";

// Members change slowly; cache for 5 minutes.
export const revalidate = 300;

/** Public members of a regional community (privacy-filtered) + contribution counts. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const members = await getRegionMembers(slug);
  return NextResponse.json({ slug, members });
}
