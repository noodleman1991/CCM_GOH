import { Resend } from "resend";
import { z } from "zod";
import { rateLimitRequest } from "@/lib/rate-limit-route";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Both variables the subscription needs, or null. Read per request, not at
 * module scope: `new Resend(undefined)` throws ("Missing API key"), so a
 * module-level client made this route fail to IMPORT wherever the key was
 * unset, and the block 500'd before it could say what was missing (2026-09-16
 * audit, infra gap 2). `RESEND_AUDIENCE_ID` is unset in production today
 * (infra gap 5), so this path is the live one until the audience exists.
 */
function newsletterConfig(): { apiKey: string; audienceId: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) return null;
  return { apiKey, audienceId };
}

export const POST = async (request: Request) => {
  // Checked before the rate limiter: an unconfigured route should answer with
  // a plain "not available", not spend a Postgres rate-limit row per hit.
  const config = newsletterConfig();
  if (!config) {
    console.error("[newsletter] RESEND_API_KEY and/or RESEND_AUDIENCE_ID not configured");
    return Response.json({ error: "newsletter_unavailable" }, { status: 503 });
  }

  const limited = await rateLimitRequest(request, "newsletter:subscribe", { limit: 5, windowSeconds: 3600 });
  if (limited) return limited;

  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    const resend = new Resend(config.apiKey);
    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: config.audienceId,
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    console.error("Newsletter subscription error:", error);
    return Response.json(
      { error: "Error subscribing to updates" },
      { status: 500 }
    );
  }
};
