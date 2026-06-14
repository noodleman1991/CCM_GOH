import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { writeClient } from "@/sanity/lib/write-client"

/**
 * Sends a transactional email to a case-study submitter when their submission's
 * status changes to a terminal state (approved / rejected / revision).
 *
 * Called from the Sanity webhook (server-side, where the Resend key lives — NOT
 * from Studio document actions, which run in the editor's browser).
 *
 * Idempotency: the case-study document carries a `notifiedStatus` field. We only
 * send when the incoming `status` differs from `notifiedStatus`, then patch
 * `notifiedStatus` to the sent value. Sanity redelivers webhooks and fires on
 * every edit, so without this we'd spam the submitter.
 */

// Resend requires a verified sender. Falls back to onboarding@resend.dev for
// local/dev where no custom domain is configured.
const FROM = process.env.CASE_STUDY_EMAIL_FROM || "Connecting Climate Minds <onboarding@resend.dev>"

type NotifiableStatus = "approved" | "rejected" | "revision"

const NOTIFIABLE: NotifiableStatus[] = ["approved", "rejected", "revision"]

export function isNotifiableStatus(status: unknown): status is NotifiableStatus {
  return typeof status === "string" && (NOTIFIABLE as string[]).includes(status)
}

interface StatusEmailInput {
  locale?: string
  title: string
  status: NotifiableStatus
  reviewNotes?: string
  siteUrl: string
}

/** Localised subject + plain-text/HTML body per status. Kept inline (not in the
 *  next-intl message files) because this runs in a webhook with no request
 *  locale context; we still localise by the submitter's stored locale. */
function buildStatusEmail({ locale = "en", title, status, reviewNotes, siteUrl }: StatusEmailInput) {
  const dashboardUrl = `${siteUrl}/${locale}/dashboard/submissions`

  const copy: Record<string, Record<NotifiableStatus, { subject: string; heading: string; body: string }>> = {
    en: {
      approved: {
        subject: `Your case study "${title}" has been published`,
        heading: "Your case study is live",
        body: `Good news — your case study "${title}" has been approved and is now published on Connecting Climate Minds.`,
      },
      revision: {
        subject: `Your case study "${title}" needs a few changes`,
        heading: "Revisions requested",
        body: `Our reviewers have asked for some changes to your case study "${title}" before it can be published.`,
      },
      rejected: {
        subject: `Update on your case study "${title}"`,
        heading: "Submission not accepted",
        body: `Thank you for submitting "${title}". After review, it will not be published at this time.`,
      },
    },
    es: {
      approved: {
        subject: `Tu estudio de caso "${title}" ha sido publicado`,
        heading: "Tu estudio de caso está publicado",
        body: `Buenas noticias: tu estudio de caso "${title}" ha sido aprobado y ya está publicado en Connecting Climate Minds.`,
      },
      revision: {
        subject: `Tu estudio de caso "${title}" necesita algunos cambios`,
        heading: "Se solicitaron revisiones",
        body: `Nuestro equipo de revisión ha solicitado algunos cambios en tu estudio de caso "${title}" antes de publicarlo.`,
      },
      rejected: {
        subject: `Actualización sobre tu estudio de caso "${title}"`,
        heading: "Envío no aceptado",
        body: `Gracias por enviar "${title}". Tras la revisión, no se publicará en este momento.`,
      },
    },
    fr: {
      approved: {
        subject: `Votre étude de cas "${title}" a été publiée`,
        heading: "Votre étude de cas est en ligne",
        body: `Bonne nouvelle : votre étude de cas "${title}" a été approuvée et est désormais publiée sur Connecting Climate Minds.`,
      },
      revision: {
        subject: `Votre étude de cas "${title}" nécessite quelques modifications`,
        heading: "Révisions demandées",
        body: `Nos relecteurs ont demandé quelques modifications de votre étude de cas "${title}" avant sa publication.`,
      },
      rejected: {
        subject: `Mise à jour concernant votre étude de cas "${title}"`,
        heading: "Soumission non retenue",
        body: `Merci d'avoir soumis "${title}". Après examen, elle ne sera pas publiée pour le moment.`,
      },
    },
    ar: {
      approved: {
        subject: `تم نشر دراسة الحالة الخاصة بك "${title}"`,
        heading: "دراسة الحالة الخاصة بك منشورة الآن",
        body: `أخبار جيدة — تمت الموافقة على دراسة الحالة الخاصة بك "${title}" وهي الآن منشورة على Connecting Climate Minds.`,
      },
      revision: {
        subject: `تحتاج دراسة الحالة الخاصة بك "${title}" إلى بعض التعديلات`,
        heading: "طُلبت تعديلات",
        body: `طلب فريق المراجعة إجراء بعض التعديلات على دراسة الحالة الخاصة بك "${title}" قبل نشرها.`,
      },
      rejected: {
        subject: `تحديث بخصوص دراسة الحالة الخاصة بك "${title}"`,
        heading: "لم يتم قبول الطلب",
        body: `شكرًا لتقديمك "${title}". بعد المراجعة، لن يتم نشرها في الوقت الحالي.`,
      },
    },
  }

  const L = copy[locale] || copy.en
  const c = L[status]
  const dir = locale === "ar" ? "rtl" : "ltr"
  const notesBlock = reviewNotes
    ? `<div style="margin:16px 0;padding:12px 16px;background:#f4f4f5;border-radius:8px;"><strong>Notes:</strong><br/>${escapeHtml(reviewNotes)}</div>`
    : ""

  const html = `<!doctype html><html dir="${dir}"><body style="font-family:system-ui,sans-serif;color:#18181b;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="margin:0 0 12px;">${escapeHtml(c.heading)}</h2>
    <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(c.body)}</p>
    ${notesBlock}
    <p style="margin:24px 0 0;"><a href="${dashboardUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">View your submissions</a></p>
  </body></html>`

  const text = `${c.heading}\n\n${c.body}\n${reviewNotes ? `\nNotes: ${reviewNotes}\n` : ""}\nView your submissions: ${dashboardUrl}`

  return { subject: c.subject, html, text }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch] as string)
  )
}

interface NotifyInput {
  caseStudyId: string
  status: string
  notifiedStatus?: string
  submittedBy?: string
  title?: string
  reviewNotes?: string
  locale?: string
  siteUrl: string
}

/** Returns a short result describing what happened (for webhook logging). */
export async function notifyCaseStudyStatusChange(input: NotifyInput): Promise<string> {
  const { caseStudyId, status, notifiedStatus, submittedBy, title, reviewNotes, locale, siteUrl } = input

  if (!isNotifiableStatus(status)) return "skipped: status not notifiable"
  if (status === notifiedStatus) return "skipped: already notified for this status"
  if (!submittedBy) return "skipped: no submitter on document"

  // Resolve the submitter's email from their Prisma user row.
  const user = await prisma.user.findUnique({
    where: { id: submittedBy },
    select: { email: true },
  })
  if (!user?.email) return "skipped: submitter has no email on file"

  if (!process.env.RESEND_API_KEY) return "skipped: RESEND_API_KEY not configured"

  const { subject, html, text } = buildStatusEmail({
    locale,
    title: title || "your case study",
    status,
    reviewNotes,
    siteUrl,
  })

  // Instantiate lazily so importing this module never constructs a client.
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ from: FROM, to: user.email, subject, html, text })

  // Mark as notified so subsequent edits don't re-send for the same status.
  await writeClient.patch(caseStudyId).set({ notifiedStatus: status }).commit({ visibility: "async" })

  return `sent: ${status} -> ${user.email}`
}
