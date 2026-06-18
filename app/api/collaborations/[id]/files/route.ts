import { NextRequest, NextResponse } from "next/server";
import { authorizeCollab } from "@/lib/collaboration/service";
import { prisma, safeQuery } from "@/lib/prisma";
import { fileUrl, r2Configured } from "@/lib/r2";

/**
 * GET /api/collaborations/[id]/files
 * Authorize collab:readFiles (MEMBERS files require membership; staff are NOT
 * auto-granted). Returns file metadata + a short-TTL URL per file. Never logged.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await authorizeCollab(id, "collab:readFiles");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const r = await safeQuery(() =>
    prisma.collaborationFile.findMany({
      where: { collaborationId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, fileName: true, contentType: true, size: true, r2Key: true, createdAt: true, uploadedById: true },
      take: 200,
    })
  );
  const rows = r.success ? r.data : [];

  const files = await Promise.all(
    rows.map(async (f) => ({
      id: f.id,
      fileName: f.fileName,
      contentType: f.contentType,
      size: f.size,
      createdAt: f.createdAt.toISOString(),
      uploadedById: f.uploadedById,
      url: r2Configured() ? await fileUrl(f.r2Key) : null,
      isPdf: f.contentType === "application/pdf",
    }))
  );

  return NextResponse.json({ files }, { headers: { "Cache-Control": "private, no-store" } });
}
