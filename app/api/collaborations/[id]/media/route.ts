import { NextRequest, NextResponse } from "next/server";
import { authorizeCollab } from "@/lib/collaboration/service";
import { prisma, safeQuery } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await authorizeCollab(id, "collab:read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const r = await safeQuery(() =>
    prisma.collaborationMedia.findMany({
      where: { collaborationId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, url: true, title: true, createdAt: true },
      take: 100,
    })
  );
  return NextResponse.json({ media: r.success ? r.data : [] }, { headers: { "Cache-Control": "private, no-store" } });
}
