import { NextRequest, NextResponse } from "next/server";
import { buildEventIcs, fetchEventBySlug } from "@/lib/events";

/** GET /api/events/[slug]/ics — add-to-calendar download (X6). Public,
 *  approved events only (fetchEventBySlug enforces the moderation gate). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event || !event.startAt || !event.title) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const ics = buildEventIcs({
    id: event._id,
    title: event.title,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    location: event.locationName ?? (event.mode === "online" ? "Online" : null),
    url: event.url,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
