import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-click unsubscribe from notification emails. The link in each email carries
 * the recipient's unsubscribeToken + the kind; we flip the matching preference
 * off. No auth needed (the token is the proof) — and it can only DISABLE.
 */
const FIELD: Record<string, "emailOnReply" | "emailOnMention" | "emailOnMessage" | "emailWeeklyDigest"> = {
  reply: "emailOnReply",
  mention: "emailOnMention",
  message: "emailOnMessage",
  digest: "emailWeeklyDigest",
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
      : { emailOnReply: false, emailOnMention: false, emailOnMessage: false, emailWeeklyDigest: false },
  });

  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;padding:2rem"><p>You've been unsubscribed. You can re-enable these emails anytime in your settings.</p></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

// RFC 8058 one-click unsubscribe: mailbox providers POST to the
// List-Unsubscribe URL with no body semantics we need — same behavior as GET.
export async function POST(req: NextRequest) {
  return GET(req);
}
