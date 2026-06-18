import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM = process.env.CASE_STUDY_EMAIL_FROM || "Connecting Climate Minds <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

type Locale = "en" | "es" | "fr" | "ar";

const COPY: Record<Locale, { subject: string; heading: string; body: string; cta: string; dir: "ltr" | "rtl" }> = {
  en: {
    subject: "Your comment is now live",
    heading: "Your comment was approved",
    body: "Thanks for contributing to the discussion. Your comment is now visible to the community.",
    cta: "View the discussion",
    dir: "ltr",
  },
  es: {
    subject: "Tu comentario ya está publicado",
    heading: "Tu comentario fue aprobado",
    body: "Gracias por contribuir al debate. Tu comentario ya es visible para la comunidad.",
    cta: "Ver el debate",
    dir: "ltr",
  },
  fr: {
    subject: "Votre commentaire est en ligne",
    heading: "Votre commentaire a été approuvé",
    body: "Merci d'avoir contribué à la discussion. Votre commentaire est désormais visible.",
    cta: "Voir la discussion",
    dir: "ltr",
  },
  ar: {
    subject: "تم نشر تعليقك",
    heading: "تمت الموافقة على تعليقك",
    body: "شكرًا لمساهمتك في النقاش. أصبح تعليقك الآن مرئيًا للمجتمع.",
    cta: "عرض النقاش",
    dir: "rtl",
  },
};

/**
 * Email the author that their held comment was approved. Mirrors the
 * case-study notification pattern (localized via the author's preferredLanguage,
 * skips gracefully when email/Resend are unavailable). Called only on the
 * PENDING→VISIBLE transition, so it is effectively idempotent.
 */
export async function notifyCommentApproved(commentId: string): Promise<string> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment?.authorId) return "skipped: no author";

  if (!process.env.RESEND_API_KEY) return "skipped: RESEND_API_KEY not configured";

  const user = await prisma.user.findUnique({
    where: { id: comment.authorId },
    select: { email: true, preferredLanguage: true },
  });
  if (!user?.email) return "skipped: author has no email";

  const locale = (user.preferredLanguage?.toLowerCase() as Locale) || "en";
  const c = COPY[locale] ?? COPY.en;

  const html = `<!doctype html><html dir="${c.dir}"><body style="font-family:system-ui,sans-serif;color:#0f172a">
    <h2>${c.heading}</h2>
    <p>${c.body}</p>
    <p><a href="${SITE_URL}" style="color:#0e7490">${c.cta}</a></p>
  </body></html>`;
  const text = `${c.heading}\n\n${c.body}\n\n${c.cta}: ${SITE_URL}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to: user.email, subject: c.subject, html, text });
    return `sent: ${user.email}`;
  } catch (e) {
    return `failed: ${e instanceof Error ? e.message : "unknown"}`;
  }
}
