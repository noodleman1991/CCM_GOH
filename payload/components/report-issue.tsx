import en from "@/messages/en.json";
import { getActor, isStaff } from "@/lib/authz";
import { ReportIssueBubble } from "@/payload/components/report-issue-bubble";

/**
 * The hub's "Report a problem" bubble inside /admin (a `header` slot, so it
 * shows on every signed-in admin page and never on the login screen). Staff
 * only, the same gate as the hub and as /api/issue-reports.
 *
 * A server component, so it hands the client just the English strings: the
 * admin has no next-intl provider, and shipping the whole 115KB message file
 * to the browser for thirty strings would be waste.
 */
export async function ReportIssue() {
  if (!isStaff(await getActor())) return null;
  return <ReportIssueBubble strings={en.issueReport} />;
}
