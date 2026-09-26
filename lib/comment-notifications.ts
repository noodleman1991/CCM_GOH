import "server-only";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

type Locale = "en" | "es" | "fr" | "ar";

const COPY: Record<Locale, { subject: string; heading: string; body: string; cta: string; unsubscribe: string; dir: "ltr" | "rtl" }> = {
  en: {
    subject: "Your comment is now live",
    heading: "Your comment was approved",
    body: "Thanks for contributing to the discussion. Your comment is now visible to the community.",
    cta: "View the discussion",
    unsubscribe: "Unsubscribe from these emails",
    dir: "ltr",
  },
  es: {
    subject: "Tu comentario ya está publicado",
    heading: "Tu comentario fue aprobado",
    body: "Gracias por contribuir al debate. Tu comentario ya es visible para la comunidad.",
    cta: "Ver el debate",
    unsubscribe: "Cancelar la suscripción a estos correos",
    dir: "ltr",
  },
  fr: {
    subject: "Votre commentaire est en ligne",
    heading: "Votre commentaire a été approuvé",
    body: "Merci d'avoir contribué à la discussion. Votre commentaire est désormais visible.",
    cta: "Voir la discussion",
    unsubscribe: "Se désabonner de ces e-mails",
    dir: "ltr",
  },
  ar: {
    subject: "تم نشر تعليقك",
    heading: "تمت الموافقة على تعليقك",
    body: "شكرًا لمساهمتك في النقاش. أصبح تعليقك الآن مرئيًا للمجتمع.",
    cta: "عرض النقاش",
    unsubscribe: "إلغاء الاشتراك في هذه الرسائل",
    dir: "rtl",
  },
};

/**
 * Email the author that their held comment was approved. Localized via the
 * author's preferredLanguage; called only on the PENDING→VISIBLE transition,
 * so it is effectively idempotent.
 *
 * Preferences: there is no dedicated "email me when my comment is approved"
 * flag (adding one is a schema change, on the backlog). What exists is the
 * blanket unsubscribe, which flips every email flag off — so a person in that
 * state gets nothing from here either, and the message carries the same
 * one-click unsubscribe link as every other notification email. Until
 * 2026-09-17 this sender bypassed both.
 *
 * The provider's result is read: Resend resolves `{ error }` on a rejected
 * message rather than throwing, and the old `sent:` on that path hid every
 * sandbox-sender failure in production.
 */
export async function notifyCommentApproved(commentId: string): Promise<string> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });
  if (!comment?.authorId) return "skipped: no author";

  if (!process.env.RESEND_API_KEY) return "skipped: RESEND_API_KEY not configured";

  const [user, pref] = await Promise.all([
    prisma.user.findUnique({
      where: { id: comment.authorId },
      select: { email: true, preferredLanguage: true },
    }),
    prisma.notificationPreference.upsert({
      where: { userId: comment.authorId },
      create: { userId: comment.authorId },
      update: {},
    }),
  ]);
  if (!user?.email) return "skipped: author has no email";
  if (!pref.emailOnReply && !pref.emailOnMention && !pref.emailOnMessage && !pref.emailWeeklyDigest) {
    return "skipped: author opted out of email";
  }

  const locale = (user.preferredLanguage?.toLowerCase() as Locale) || "en";
  const c = COPY[locale] ?? COPY.en;
  // No `kind`: the unsubscribe route treats a blank kind as "all email kinds",
  // which is the only preference this message can honour today.
  const unsubUrl = `${SITE_URL}/api/notifications/unsubscribe?token=${pref.unsubscribeToken}`;

  const html = `<!doctype html><html dir="${c.dir}"><body style="font-family:system-ui,sans-serif;color:#0f172a">
    <h2>${c.heading}</h2>
    <p>${c.body}</p>
    <p><a href="${SITE_URL}" style="color:#0e7490">${c.cta}</a></p>
    <p style="font-size:12px;color:#94a3b8"><a href="${unsubUrl}" style="color:#94a3b8">${c.unsubscribe}</a></p>
  </body></html>`;
  const text = `${c.heading}\n\n${c.body}\n\n${c.cta}: ${SITE_URL}\n\n${c.unsubscribe}: ${unsubUrl}`;

  const result = await sendEmail({
    kind: "comment-approved",
    to: user.email,
    subject: c.subject,
    html,
    text,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
  return result.ok ? `sent: ${user.email}` : `failed: ${result.reason}`;
}
