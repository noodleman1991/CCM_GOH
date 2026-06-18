import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-click unsubscribe from notification emails. The link in each email carries
 * the recipient's unsubscribeToken + the kind; we flip the matching preference
 * off. No auth needed (the token is the proof) — and it can only DISABLE.
 */
const FIELD: Record<string, "emailOnReply" | "emailOnMention" | "emailOnMessage"> = {
  reply: "emailOnReply",
  mention: "emailOnMention",
  message: "emailOnMessage",
};

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const kind = req.nextUrl.searchParams.get("kind") ?? "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const pref = await prisma.notificationPreference.findUnique({ where: { unsubscribeToken: token } });
  if (!pref) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const field = FIELD[kind];
  await prisma.notificationPreference.update({
    where: { unsubscribeToken: token },
    // Unknown/blank kind unsubscribes from all email kinds.
    data: field
      ? { [field]: false }
      : { emailOnReply: false, emailOnMention: false, emailOnMessage: false },
  });

  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;padding:2rem"><p>You've been unsubscribed. You can re-enable these emails anytime in your settings.</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
