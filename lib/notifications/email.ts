import "server-only";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma";

const FROM = process.env.CASE_STUDY_EMAIL_FROM || "Connecting Climate Minds <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

type Locale = "en" | "es" | "fr" | "ar";
type EmailKind = "reply" | "mention" | "message";
type DigestLocaleCopy = { subject: string; intro: string; unreadLine: string };

const COPY: Record<Locale, Record<EmailKind, { subject: string; body: string }> & { cta: string; unsubscribe: string; dir: "ltr" | "rtl" }> = {
  en: {
    reply: { subject: "New reply to your comment", body: "Someone replied to your comment." },
    mention: { subject: "You were mentioned", body: "Someone mentioned you in a comment." },
    message: { subject: "New message", body: "You have a new direct message." },
    cta: "View on the Hub",
    unsubscribe: "Unsubscribe from these emails",
    dir: "ltr",
  },
  es: {
    reply: { subject: "Nueva respuesta a tu comentario", body: "Alguien respondió a tu comentario." },
    mention: { subject: "Te han mencionado", body: "Alguien te mencionó en un comentario." },
    message: { subject: "Nuevo mensaje", body: "Tienes un nuevo mensaje directo." },
    cta: "Ver en el Hub",
    unsubscribe: "Cancelar la suscripción a estos correos",
    dir: "ltr",
  },
  fr: {
    reply: { subject: "Nouvelle réponse à votre commentaire", body: "Quelqu'un a répondu à votre commentaire." },
    mention: { subject: "Vous avez été mentionné", body: "Quelqu'un vous a mentionné dans un commentaire." },
    message: { subject: "Nouveau message", body: "Vous avez un nouveau message direct." },
    cta: "Voir sur le Hub",
    unsubscribe: "Se désabonner de ces e-mails",
    dir: "ltr",
  },
  ar: {
    reply: { subject: "رد جديد على تعليقك", body: "ردّ أحدهم على تعليقك." },
    mention: { subject: "تمت الإشارة إليك", body: "أشار إليك أحدهم في تعليق." },
    message: { subject: "رسالة جديدة", body: "لديك رسالة مباشرة جديدة." },
    cta: "العرض على المنصة",
    unsubscribe: "إلغاء الاشتراك في هذه الرسائل",
    dir: "rtl",
  },
};

const KIND_FOR_TYPE: Partial<Record<NotificationType, EmailKind>> = {
  COMMENT_REPLY: "reply",
  MENTION: "mention",
  MESSAGE: "message",
};

const PREF_FIELD: Record<EmailKind, "emailOnReply" | "emailOnMention" | "emailOnMessage"> = {
  reply: "emailOnReply",
  mention: "emailOnMention",
  message: "emailOnMessage",
};

/**
 * Send a notification email IF the recipient's NotificationPreference allows it.
 * Localized, with a working one-click unsubscribe link. Skips gracefully when
 * Resend / email are unavailable. Best-effort — never throws to the caller.
 */
export async function maybeSendNotificationEmail(params: {
  recipientId: string;
  type: NotificationType;
  snippet?: string | null;
}): Promise<void> {
  const kind = KIND_FOR_TYPE[params.type];
  if (!kind) return;
  if (!process.env.RESEND_API_KEY) return;

  // Load preference (create the default row lazily if absent).
  const pref = await prisma.notificationPreference.upsert({
    where: { userId: params.recipientId },
    create: { userId: params.recipientId },
    update: {},
  });
  if (!pref[PREF_FIELD[kind]]) return; // user opted out

  const user = await prisma.user.findUnique({
    where: { id: params.recipientId },
    select: { email: true, preferredLanguage: true },
  });
  if (!user?.email) return;

  const locale = (user.preferredLanguage?.toLowerCase() as Locale) || "en";
  const c = COPY[locale] ?? COPY.en;
  const copy = c[kind];
  const unsubUrl = `${SITE_URL}/api/notifications/unsubscribe?token=${pref.unsubscribeToken}&kind=${kind}`;

  const html = `<!doctype html><html dir="${c.dir}"><body style="font-family:system-ui,sans-serif;color:#0f172a">
    <p>${copy.body}</p>
    ${params.snippet ? `<blockquote style="border-inline-start:3px solid #0e7490;padding-inline-start:12px;color:#475569">${escapeHtml(params.snippet)}</blockquote>` : ""}
    <p><a href="${SITE_URL}" style="color:#0e7490">${c.cta}</a></p>
    <p style="font-size:12px;color:#94a3b8"><a href="${unsubUrl}" style="color:#94a3b8">${c.unsubscribe}</a></p>
  </body></html>`;
  const text = `${copy.body}\n\n${c.cta}: ${SITE_URL}\n\n${c.unsubscribe}: ${unsubUrl}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to: user.email, subject: copy.subject, html, text });
  } catch {
    // best-effort
  }
}

const DIGEST_COPY: Record<Locale, DigestLocaleCopy> = {
  en: {
    subject: "Your week on Connecting Climate Minds",
    intro: "Here's what happened around your work this week.",
    unreadLine: "You have {unread} unread notifications.",
  },
  es: {
    subject: "Tu semana en Connecting Climate Minds",
    intro: "Esto es lo que pasó alrededor de tu trabajo esta semana.",
    unreadLine: "Tienes {unread} notificaciones sin leer.",
  },
  fr: {
    subject: "Votre semaine sur Connecting Climate Minds",
    intro: "Voici ce qui s'est passé autour de votre travail cette semaine.",
    unreadLine: "Vous avez {unread} notifications non lues.",
  },
  ar: {
    subject: "أسبوعك على Connecting Climate Minds",
    intro: "إليك ما حدث حول عملك هذا الأسبوع.",
    unreadLine: "لديك {unread} إشعارات غير مقروءة.",
  },
};

/**
 * The weekly digest email (cron-driven; caller has already checked the
 * emailWeeklyDigest preference). Localized; one-click unsubscribe with
 * kind=digest. Best-effort — never throws.
 */
export async function sendWeeklyDigestEmail(params: {
  email: string;
  locale: string | null;
  unread: number;
  highlights: string[];
  unsubscribeToken: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const locale = ((params.locale ?? "en").toLowerCase() as Locale) || "en";
  const c = COPY[locale] ?? COPY.en;
  const d = DIGEST_COPY[locale] ?? DIGEST_COPY.en;
  const unsubUrl = `${SITE_URL}/api/notifications/unsubscribe?token=${params.unsubscribeToken}&kind=digest`;
  const items = params.highlights
    .slice(0, 6)
    .map((h) => `<li style="margin-bottom:6px">${escapeHtml(h)}</li>`)
    .join("");
  const unreadLine = d.unreadLine.replace("{unread}", String(params.unread));

  const html = `<!doctype html><html dir="${c.dir}"><body style="font-family:system-ui,sans-serif;color:#0f172a">
    <p>${d.intro}</p>
    ${items ? `<ul style="padding-inline-start:18px;color:#334155">${items}</ul>` : ""}
    <p>${unreadLine}</p>
    <p><a href="${SITE_URL}" style="color:#0e7490">${c.cta}</a></p>
    <p style="font-size:12px;color:#94a3b8"><a href="${unsubUrl}" style="color:#94a3b8">${c.unsubscribe}</a></p>
  </body></html>`;
  const lines = params.highlights.slice(0, 6).map((h) => `- ${h}`).join("\n");
  const text = `${d.intro}\n\n${lines}\n\n${unreadLine}\n\n${c.cta}: ${SITE_URL}\n\n${c.unsubscribe}: ${unsubUrl}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to: params.email, subject: d.subject, html, text });
    return true;
  } catch {
    return false;
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string));
}
