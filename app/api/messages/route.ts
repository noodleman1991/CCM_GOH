import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listConversations, listMessages } from "@/lib/messaging/service";

/**
 * GET /api/messages              -> { conversations }
 * GET /api/messages?id=<convId>  -> { messages }
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const messages = await listMessages(id, userId);
    if (messages === null) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ messages }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const conversations = await listConversations(userId);
  return NextResponse.json({ conversations }, { headers: { "Cache-Control": "private, no-store" } });
}
