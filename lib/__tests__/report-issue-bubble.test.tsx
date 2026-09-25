// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
const capture = vi.hoisted(() => ({ available: true, dialogOpenDuringCapture: null as boolean | null, result: null as unknown }));

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/collections/newsPosts/create" }));
vi.mock("@payloadcms/ui", () => ({ toast }));
vi.mock("@/components/issue-report/capture-screen", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/issue-report/capture-screen")>();
  return {
    ...actual,
    canCaptureScreen: () => capture.available,
    captureCurrentTab: vi.fn(async () => {
      capture.dialogOpenDuringCapture = document.querySelector("dialog")?.open ?? null;
      if (!(capture.result instanceof File)) throw capture.result;
      return capture.result;
    }),
  };
});

import { ReportIssueBubble } from "@/payload/components/report-issue-bubble";

const fetchMock = vi.fn();

async function clickCapture() {
  fireEvent.click(screen.getByRole("button", { name: "Capture this page" }));
  const { captureCurrentTab } = await import("@/components/issue-report/capture-screen");
  await waitFor(() => expect(captureCurrentTab).toHaveBeenCalled());
  await waitFor(() => expect(document.querySelector("dialog")?.open).toBe(true));
}

beforeEach(async () => {
  const { captureCurrentTab } = await import("@/components/issue-report/capture-screen");
  vi.mocked(captureCurrentTab).mockClear();
  capture.available = true;
  capture.dialogOpenDuringCapture = null;
  capture.result = new File([new Uint8Array([0xff, 0xd8, 0xff])], "screenshot-2026-09-25-1405.jpg", { type: "image/jpeg" });
  toast.error.mockReset();
  toast.success.mockReset();
  fetchMock.mockReset().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
  // jsdom has no modal dialog; mirror the `open` attribute the browser sets.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const openPanel = () => fireEvent.click(screen.getByRole("button", { name: "Report a problem" }));

function typeReport() {
  fireEvent.change(screen.getByPlaceholderText(en.issueReport.summaryPlaceholder), { target: { value: "Save button does nothing" } });
  fireEvent.change(screen.getByPlaceholderText(en.issueReport.whatHappenedPlaceholder), { target: { value: "Clicked save, nothing happened" } });
}

describe("admin Report a problem bubble", () => {
  it("opens on the CMS area", () => {
    render(<ReportIssueBubble strings={en.issueReport} />);
    openPanel();
    expect(document.querySelector("dialog")?.open).toBe(true);
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("cms");
  });

  it("captures the page with the panel out of the way, then comes back with the picture and the text kept", async () => {
    render(<ReportIssueBubble strings={en.issueReport} />);
    openPanel();
    typeReport();

    await clickCapture();

    expect(capture.dialogOpenDuringCapture).toBe(false);
    await waitFor(() => expect(screen.getByText("screenshot-2026-09-25-1405.jpg")).toBeTruthy());
    expect(document.querySelector("dialog")?.open).toBe(true);
    expect((screen.getByPlaceholderText(en.issueReport.summaryPlaceholder) as HTMLInputElement).value).toBe("Save button does nothing");
    expect((screen.getByRole("combobox") as HTMLSelectElement).value).toBe("cms");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send report" }));
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/issue-reports");
    expect(body).toMatchObject({ summary: "Save button does nothing", area: "cms" });
    expect(body.screenshot).toMatchObject({ filename: "screenshot-2026-09-25-1405.jpg", contentType: "image/jpeg" });
    expect(body.screenshot.dataBase64.length).toBeGreaterThan(0);
    expect(toast.success).toHaveBeenCalledWith("Report sent", expect.anything());
  });

  it("treats a dismissed share prompt quietly and brings the panel back", async () => {
    capture.result = new DOMException("denied", "NotAllowedError");
    render(<ReportIssueBubble strings={en.issueReport} />);
    openPanel();
    await clickCapture();
    expect(toast.error).not.toHaveBeenCalled();
    expect(document.querySelector("dialog")?.open).toBe(true);
  });

  it("says so when the capture itself fails", async () => {
    capture.result = new Error("too large");
    render(<ReportIssueBubble strings={en.issueReport} />);
    openPanel();
    await clickCapture();
    expect(toast.error).toHaveBeenCalledWith(en.issueReport.screenshotCaptureFailed);
  });

  it("offers upload only where the browser cannot capture (phones)", () => {
    capture.available = false;
    render(<ReportIssueBubble strings={en.issueReport} />);
    openPanel();
    expect(screen.queryByRole("button", { name: "Capture this page" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add a screenshot" })).toBeTruthy();
    expect(screen.getByText(en.issueReport.screenshotHint)).toBeTruthy();
  });
});
