import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: { user: { findUnique: vi.fn().mockResolvedValue({ email: "m@example.org" }) } } }));
import { notifySubmissionStatusChange } from "@/lib/case-study-emails";

describe("event outcome emails", () => {
  it("tell the sender their event is on the hub, linking to their suggestions", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    const markNotified = vi.fn().mockResolvedValue(undefined);
    const out = await notifySubmissionStatusChange(
      { kind: "event", caseStudyId: "ev1", status: "approved", submittedBy: "u1", title: "Reef day", siteUrl: "https://hub.example" },
      { sendEmail, markNotified },
    );
    expect(out).toMatch(/^sent: approved/);
    const msg = sendEmail.mock.calls[0][0];
    expect(msg.subject).toBe('Your event "Reef day" is on the hub');
    expect(msg.text).toContain("https://hub.example/en/events/suggest");
    expect(markNotified).toHaveBeenCalledWith("ev1", "approved");
  });
  it("pass the reviewer's note on when changes are asked for", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await notifySubmissionStatusChange(
      { kind: "event", caseStudyId: "ev1", status: "revision", submittedBy: "u1", title: "Reef day", reviewNotes: "Add the venue.", siteUrl: "https://hub.example" },
      { sendEmail, markNotified: vi.fn() },
    );
    expect(sendEmail.mock.calls[0][0].text).toContain("Add the venue.");
    expect(sendEmail.mock.calls[0][0].subject).toContain("needs a few changes");
  });
  it("leave case-study emails as they were", async () => {
    const sendEmail = vi.fn().mockResolvedValue({ ok: true });
    await notifySubmissionStatusChange(
      { kind: "caseStudy", caseStudyId: "cs1", status: "approved", submittedBy: "u1", title: "Floods", siteUrl: "https://hub.example" },
      { sendEmail, markNotified: vi.fn() },
    );
    expect(sendEmail.mock.calls[0][0].subject).toBe('Your case study "Floods" has been published');
    expect(sendEmail.mock.calls[0][0].text).toContain("/en/dashboard/submissions");
  });
});
