import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { email } = subscribeSchema.parse(body);

    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (!audienceId) {
      console.error("RESEND_AUDIENCE_ID not configured");
      return Response.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      );
    }

    await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId,
    });

    return Response.json({ success: true });
  } catch (error: any) {
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
