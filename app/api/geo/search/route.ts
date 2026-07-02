import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { geocodeQuery } from "@/lib/geocoding";
import { projectPoint } from "@/lib/maps/project-point";

export const dynamic = "force-dynamic";

/** Place suggestions for the submit-flow picker. Auth-gated (submitters only)
 *  to keep the Nominatim proxy from being an open geocoder. */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ results: [] }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 2) return NextResponse.json({ results: [] });

  const suggestions = await geocodeQuery(q);
  const results = suggestions.map((s) => {
    const p = projectPoint(s.lat, s.lng);
    return { ...s, vx: p?.x ?? null, vy: p?.y ?? null };
  });
  return NextResponse.json({ results });
}
