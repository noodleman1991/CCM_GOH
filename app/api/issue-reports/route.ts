import { z } from "zod";
import { getActor, isStaff } from "@/lib/authz";
import { prisma, safeQuery } from "@/lib/prisma";
import {
  ACCEPTED_SCREENSHOT_TYPES,
  MAX_SCREENSHOT_BYTES,
  issueReportSchema,
} from "@/lib/issue-report";
import { sendIssueReportEmail } from "@/lib/issue-report-email";

/**
 * Editor-only issue reporting. Gated on the Prisma role (team_editor | admin),
 * the same gate the moderation queue uses — the widget is never rendered for
 * anyone else, and this handler re-checks so the endpoint isn't the weak link.
 *
 * Delivery is email-only (no persistence), so a failed send is reported back to
 * the reporter rather than being swallowed into a false "sent" confirmation.
 */

// Buffer (screenshot attachment) needs the Node runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** base64 decodes to 3 bytes per 4 chars, minus any '=' padding. */
function base64ByteLength(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor || !isStaff(actor)) {
    return Response.json({ error: "Not permitted" }, { status: 403 });
  }

  let report;
  try {
    report = issueReportSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message || "Please check the form and try again." },
        { status: 400 }
      );
    }
    return Response.json({ error: "Could not read the report." }, { status: 400 });
  }

  if (report.screenshot) {
    const { contentType, dataBase64 } = report.screenshot;
    if (!(ACCEPTED_SCREENSHOT_TYPES as readonly string[]).includes(contentType)) {
      return Response.json(
        { error: "That image type isn't supported. Use PNG, JPEG, WebP or GIF." },
        { status: 400 }
      );
    }
    if (base64ByteLength(dataBase64) > MAX_SCREENSHOT_BYTES) {
      return Response.json(
        { error: `That screenshot is too big. Keep it under ${Math.round(MAX_SCREENSHOT_BYTES / 1024 / 1024)}MB.` },
        { status: 413 }
      );
    }
  }

  const lookup = await safeQuery(() =>
    prisma.user.findUnique({
      where: { id: actor.id },
      select: { email: true, firstName: true, lastName: true, username: true },
    })
  );
  const profile = lookup.success ? lookup.data : null;
  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim() ||
    profile?.username ||
    profile?.email ||
    "An editor";

  const result = await sendIssueReportEmail({
    report,
    reporter: { name, email: profile?.email ?? null, role: actor.role },
  });

  if (!result.ok) {
    return Response.json(
      { error: `Your report wasn't sent. ${result.reason}` },
      { status: 502 }
    );
  }

  return Response.json({ success: true });
}
