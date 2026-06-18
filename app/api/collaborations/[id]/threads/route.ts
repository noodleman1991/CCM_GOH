import { NextRequest, NextResponse } from "next/server";
import { authorizeCollab, listThreads } from "@/lib/collaboration/service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await authorizeCollab(id, "collab:read");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const threads = await listThreads(id);
  return NextResponse.json({ threads }, { headers: { "Cache-Control": "private, no-store" } });
}
