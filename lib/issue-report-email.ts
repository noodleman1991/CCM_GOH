import "server-only";
import { Resend } from "resend";
import type { IssueReportInput } from "@/lib/issue-report";

/**
 * Delivers editor issue reports by email. There is no database side to this
 * feature — the inbox IS the tracker — so a send failure is a lost report and
 * must surface to the reporter rather than being swallowed.
 */

const FROM =
  process.env.ISSUE_REPORT_EMAIL_FROM ||
  process.env.CASE_STUDY_EMAIL_FROM ||
  "Connecting Climate Minds <onboarding@resend.dev>";

/**
 * Defaults to amit2@pm.me because the Resend account is still unverified and
 * will only deliver to its owner — sending anywhere else 403s. Once a domain is
 * verified at resend.com/domains, point this at hello@spiro-spero.zone with the
 * ISSUE_REPORT_EMAIL_TO env var; no code change needed.
 */
const TO = process.env.ISSUE_REPORT_EMAIL_TO || "amit2@pm.me";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://connectingclimateminds.org";

/** Display labels for the values the form sends. Unknown strings pass through. */
const URGENCY_LABELS: Record<string, string> = {
  blocking: "Blocking",
  annoying: "Annoying",
  minor: "Minor",
  idea: "Just an idea",
};

const AREA_LABELS: Record<string, string> = {
  home: "Home page",
  map: "The map",
  stories: "Lived experiences (stories)",
  "story-submit": "Submitting a story",
  "case-studies": "Case studies",
  "research-outputs": "Research outputs",
  communities: "Communities",
  collaborations: "Collaborations / workspaces",
  events: "Events",
  news: "News",
  blog: "Blog",
  reader: "Reader",
  search: "Search",
  profiles: "Member profiles",
  dashboard: "My dashboard",
  messages: "Messages",
  comments: "Comments",
  notifications: "Notifications",
  auth: "Sign in / sign up",
  onboarding: "New member setup",
  studio: "Sanity Studio",
  navigation: "Menu, header or footer",
  "whole-site": "Whole site",
  other: "Not sure",
};

export type IssueReportReporter = {
  name: string;
  email: string | null;
  role: string;
};

export type SendResult = { ok: true } | { ok: false; reason: string };

function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch] as string
  );
}

/** Preserve the reporter's line breaks without trusting their markup. */
function paragraph(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br>");
}

function row(labelText: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(labelText)}</td>
    <td style="padding:6px 0;color:#0f172a;font-size:13px;vertical-align:top">${valueHtml}</td>
  </tr>`;
}

export function buildSubject(report: IssueReportInput): string {
  const urgency = label(URGENCY_LABELS, report.urgency);
  return `[Hub] ${urgency} — ${report.summary}`;
}

/**
 * Send one report. Returns a reason instead of throwing so the caller can tell
 * the editor precisely why their report didn't arrive.
 */
export async function sendIssueReportEmail(params: {
  report: IssueReportInput;
  reporter: IssueReportReporter;
}): Promise<SendResult> {
  const { report, reporter } = params;

  if (!process.env.RESEND_API_KEY) {
    return { ok: false, reason: "Email is not configured (RESEND_API_KEY is missing)." };
  }

  const ctx = report.context;
  const urlHtml = ctx.url
    ? `<a href="${escapeHtml(ctx.url)}" style="color:#0e7490">${escapeHtml(ctx.url)}</a>`
    : "<em style='color:#94a3b8'>not captured</em>";

  const details = [
    row("Page", urlHtml),
    ctx.pageTitle ? row("Page title", escapeHtml(ctx.pageTitle)) : "",
    row("Area", escapeHtml(label(AREA_LABELS, report.area))),
    row("Urgency", escapeHtml(label(URGENCY_LABELS, report.urgency))),
    row("Signed in", report.wasSignedIn ? "Yes" : "No — saw it signed out"),
    row(
      "Reporter",
      `${escapeHtml(reporter.name)}${reporter.email ? ` &lt;${escapeHtml(reporter.email)}&gt;` : ""} · ${escapeHtml(reporter.role)}`
    ),
    row(
      "Browser",
      `${escapeHtml(ctx.browser || "—")} on ${escapeHtml(ctx.os || "—")} · ${escapeHtml(ctx.device || "—")}`
    ),
    row("Screen", escapeHtml(ctx.viewport || "—")),
    row("Language", escapeHtml(ctx.locale || "—")),
  ]
    .filter(Boolean)
    .join("");

  const shouldBlock = report.whatShouldHappen
    ? `<h3 style="margin:20px 0 6px;font-size:14px;color:#334155">What should happen</h3>
       <div style="font-size:14px;color:#0f172a;line-height:1.55">${paragraph(report.whatShouldHappen)}</div>`
    : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,sans-serif">
    <div style="max-width:640px;margin:0 auto;padding:24px">
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0e7490;font-weight:600">Hub issue report</div>
        <h1 style="margin:6px 0 18px;font-size:20px;line-height:1.3;color:#0f172a">${escapeHtml(report.summary)}</h1>

        <h3 style="margin:0 0 6px;font-size:14px;color:#334155">What happened</h3>
        <div style="font-size:14px;color:#0f172a;line-height:1.55">${paragraph(report.whatHappened)}</div>
        ${shouldBlock}

        <table style="margin-top:22px;border-top:1px solid #e2e8f0;padding-top:8px;width:100%;border-collapse:collapse">
          ${details}
        </table>

        <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">
          Sent from the editor reporting widget on <a href="${escapeHtml(SITE_URL)}" style="color:#94a3b8">${escapeHtml(SITE_URL)}</a>.
          ${reporter.email ? "Reply to this email to reach the reporter." : ""}
        </p>
      </div>
    </div>
  </body></html>`;

  const text = [
    `HUB ISSUE REPORT`,
    ``,
    report.summary,
    ``,
    `What happened:`,
    report.whatHappened,
    ...(report.whatShouldHappen ? [``, `What should happen:`, report.whatShouldHappen] : []),
    ``,
    `Page:      ${ctx.url || "not captured"}`,
    `Area:      ${label(AREA_LABELS, report.area)}`,
    `Urgency:   ${label(URGENCY_LABELS, report.urgency)}`,
    `Signed in: ${report.wasSignedIn ? "Yes" : "No — saw it signed out"}`,
    `Reporter:  ${reporter.name}${reporter.email ? ` <${reporter.email}>` : ""} (${reporter.role})`,
    `Browser:   ${ctx.browser || "—"} on ${ctx.os || "—"} (${ctx.device || "—"})`,
    `Screen:    ${ctx.viewport || "—"}`,
    `Language:  ${ctx.locale || "—"}`,
  ].join("\n");

  const attachments = report.screenshot
    ? [
        {
          filename: report.screenshot.filename || "screenshot.png",
          content: Buffer.from(report.screenshot.dataBase64, "base64"),
        },
      ]
    : undefined;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      subject: buildSubject(report),
      html,
      text,
      ...(reporter.email ? { replyTo: reporter.email } : {}),
      ...(attachments ? { attachments } : {}),
    });
    if (error) {
      console.error("Issue report email rejected by Resend:", error);
      return { ok: false, reason: error.message || "The email provider rejected the message." };
    }
    return { ok: true };
  } catch (err) {
    console.error("Issue report email failed:", err);
    return { ok: false, reason: "The email provider could not be reached." };
  }
}
