// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const capture = vi.hoisted(() => ({ available: true }));

vi.mock("next/navigation", () => ({ usePathname: () => "/en/news" }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/components/issue-report/capture-screen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/issue-report/capture-screen")>();
  return {
    ...actual,
    canCaptureScreen: () => capture.available,
    captureCurrentTab: vi.fn(async () => new File([new Uint8Array([1, 2, 3])], "screenshot-site.jpg", { type: "image/jpeg" })),
  };
});

import { ReportIssueWidget } from "@/components/issue-report/report-issue-widget";

beforeEach(() => {
  capture.available = true;
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => cleanup());

function mount() {
  return render(
    <NextIntlClientProvider locale="en" messages={{ issueReport: en.issueReport }}>
      <ReportIssueWidget />
    </NextIntlClientProvider>,
  );
}

describe("hub Report a problem widget", () => {
  it("offers Capture this page next to upload, and attaches the capture", async () => {
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Report a problem" }));
    fireEvent.click(await screen.findByRole("button", { name: "Capture this page" }));
    expect(await screen.findByText("screenshot-site.jpg")).toBeTruthy();
    expect(screen.getByText(en.issueReport.title, { selector: "h2" })).toBeTruthy();
  });

  it("keeps upload only where the browser cannot capture", async () => {
    capture.available = false;
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Report a problem" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Add a screenshot" })).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Capture this page" })).toBeNull();
  });
});
