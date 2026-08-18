import { NextRequest, NextResponse } from "next/server";
import { authorizeCollab } from "@/lib/collaboration/service";
import { prisma } from "@/lib/prisma";
import { r2Configured, buildFileKey, presignUpload } from "@/lib/r2";
import { isAllowedUpload } from "@/lib/file-policy";
import { rateLimitRequest } from "@/lib/rate-limit-route";

/**
 * POST /api/collaborations/[id]/files/presign
 * { fileName, contentType, size } -> { key, url }
 * Authorize collab:upload, validate against the shared file policy, return a
 * short-TTL presigned PUT. The client PUTs directly to R2, then calls the
 * confirm action which HEADs the object and persists the row.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const limited = await rateLimitRequest(req, "collab-file:presign", { limit: 30, windowSeconds: 600 });
  if (limited) return limited;

  if (!r2Configured()) {
    return NextResponse.json({ error: "File storage is not configured." }, { status: 503 });
  }
  try {
    await authorizeCollab(id, "collab:upload");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { fileName?: string; contentType?: string; size?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { fileName, contentType, size } = body;
  if (!fileName || !contentType || typeof size !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const policy = isAllowedUpload(contentType, size);
  if (!policy.ok) return NextResponse.json({ error: policy.error }, { status: 400 });

  const collab = await prisma.collaboration.findUnique({ where: { id }, select: { visibility: true } });
  if (!collab) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = buildFileKey(collab.visibility, id, fileName);
  const url = await presignUpload({ key, contentType, contentLength: size });
  return NextResponse.json({ key, url }, { headers: { "Cache-Control": "no-store" } });
}
