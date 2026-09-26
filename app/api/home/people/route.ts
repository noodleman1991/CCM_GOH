import { NextRequest, NextResponse } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import type { RegionalCommunityName } from "@/generated/prisma";
import { isRegionCode } from "@/lib/maps/region-codes";

// People widget (WIREFRAMES §4.1): public, searchable members in a region, with
// their role + what they're looking for (seeking). `?region=<code>&limit=<n>`.
// `export const revalidate` on a route handler that reads `searchParams` is
// dead — the request is dynamic — so nothing was cached and no Cache-Control
// was sent. The CDN caches these for five minutes now, serving stale for ten
// more while it refreshes.
const PUBLIC_CACHE = { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" };

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get("region") || "";
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 6, 1), 24);
  if (!isRegionCode(region)) {
    return NextResponse.json({ region: null, people: [] }, { headers: PUBLIC_CACHE });
  }

  const result = await safeQuery(() =>
    prisma.user.findMany({
      where: {
        isSearchable: true,
        profileVisibility: "PUBLIC",
        communityMemberships: {
          some: { community: { type: "REGIONAL", regionalName: region as RegionalCommunityName } },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        image: true,
        headline: true,
        role: true,
        lookingFor: true,
      },
      take: limit,
      orderBy: { updatedAt: "desc" },
    })
  );

  if (!result.success) {
    return NextResponse.json({ region, people: [] }, { headers: PUBLIC_CACHE });
  }
  const people = result.data.map((u) => ({
    id: u.id,
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || null,
    username: u.username,
    image: u.image,
    headline: u.headline,
    role: u.role,
    lookingFor: u.lookingFor,
  }));
  return NextResponse.json({ region, people }, { headers: PUBLIC_CACHE });
}
