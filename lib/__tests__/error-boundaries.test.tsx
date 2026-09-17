// @vitest-environment jsdom
/**
 * The two error boundaries (`app/global-error.tsx`, `app/[locale]/(main)/error.tsx`)
 * must hand the caught error to `reportError` on mount, so it reaches Sentry
 * in production instead of only the browser console (audit: "Error /
 * not-found pages — no captureException"). Their UI stays as it was: a
 * heading, an explanation and a working "try again" button.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const report = vi.hoisted(() => ({ reportError: vi.fn() }));
vi.mock("@/lib/errors/report", () => report);

// (main)/error.tsx pulls next-intl and the app Link; neither has a provider here.
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import GlobalError from "@/app/global-error";
import MainError from "@/app/[locale]/(main)/error";

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  // GlobalError renders <html>/<body> inside the test container; React 19
  // reports that nesting via console.error. Silence it so the assertions
  // below are about our behaviour, not the harness.
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  consoleError.mockRestore();
});

describe("GlobalError", () => {
  it("reports the error with its digest and keeps the retry UI", () => {
    const error = Object.assign(new Error("root layout blew up"), { digest: "d-123" });
    const reset = vi.fn();
    render(<GlobalError error={error} reset={reset} />);

    expect(report.reportError).toHaveBeenCalledTimes(1);
    const [reported, ctx] = report.reportError.mock.calls[0];
    expect(reported).toBe(error);
    expect(ctx).toMatchObject({ route: "global-error", extra: { digest: "d-123" } });

    expect(screen.getByRole("heading")).toHaveTextContent(/something went wrong/i);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe("MainError", () => {
  it("reports the error with its digest and keeps the retry + home UI", () => {
    const error = Object.assign(new Error("page failed"), { digest: "d-456" });
    const reset = vi.fn();
    render(<MainError error={error} reset={reset} />);

    expect(report.reportError).toHaveBeenCalledTimes(1);
    const [reported, ctx] = report.reportError.mock.calls[0];
    expect(reported).toBe(error);
    expect(ctx).toMatchObject({ route: "main-error", extra: { digest: "d-456" } });

    expect(screen.getByRole("heading")).toHaveTextContent("errorTitle");
    fireEvent.click(screen.getByRole("button", { name: "tryAgain" }));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "goHome" })).toHaveAttribute("href", "/");
  });

  it("reports once per error, not once per render", () => {
    const error = new Error("page failed");
    const { rerender } = render(<MainError error={error} reset={() => {}} />);
    rerender(<MainError error={error} reset={() => {}} />);
    expect(report.reportError).toHaveBeenCalledTimes(1);
  });
});
