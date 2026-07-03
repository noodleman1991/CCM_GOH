import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { renderStoryBlock } from "@/lib/story-blocks/render";

/**
 * POST /api/story-blocks/render (Task E8)
 * Server-side render + sanitize endpoint for the "Data & story" editor
 * blocks. Input: { kind: "chart" | "mermaid", payload }, output:
 * { svg: string | null, status: "ok" | "failed" }.
 *
 *  - kind:"chart"   → payload is { chartType, title?, data:[{label,value}] };
 *    the SVG is generated server-side (lib/story-blocks/chart-svg.ts — pure,
 *    no chart library) and sanitized.
 *  - kind:"mermaid" → payload is { svg } rendered client-side by mermaid in
 *    the author's browser (see lib/story-blocks/render.ts for why mermaid
 *    can't render on this server) and sanitized here — the sanitizer is the
 *    trust boundary for the stored SVG.
 *
 * A "failed" result is a 200: the editor keeps the block's last-good
 * renderedSvg as preview and stores renderStatus:"failed", which withholds
 * the block from the public renderer until a successful re-render.
 *
 * Auth: any signed-in user — same gate as /api/uploads/image, since it's
 * called from the same editor surfaces (case-study form + workspace docs).
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { kind?: unknown; payload?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const kind = body?.kind;
  if (kind !== "chart" && kind !== "mermaid") {
    return NextResponse.json({ error: "kind must be 'chart' or 'mermaid'" }, { status: 400 });
  }

  const result = renderStoryBlock(kind, body?.payload);
  return NextResponse.json(result);
}
